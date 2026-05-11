// ============================================================================
// Sprint D Item #1 — Migration d1_fix_revisi_fallback
// ============================================================================
// File          : lib/migrations/d1_fix_revisi_fallback.ts
// Date applied  : 11 Mei 2026
// Status        : ✅ APPLIED to live Supabase
// Author        : AI-Assisted Dev (Sprint D Item #1)
//
// Purpose       : Fix two related bugs di pagu_sections data:
//                 1. Bug Konteks 1 (Angga normative logic 10 Mei 2026):
//                    Aplikasi memperlakukan hargaSatuanRevisi=0 sebagai literal
//                    drop ke nol, padahal seharusnya berarti "tidak ada revisi
//                    → fallback ke hargaSatuanAwal sebagai baseline".
//                 2. Bug Schema Integrity v3.0:
//                    Field jumlahBiayaAwal & jumlahBiayaRevisi di DB tidak
//                    ter-sync dengan hargaSatuan{Awal,Revisi} × volume.
//                    UI menampilkan formula computed (benar) tapi field stored
//                    stale → IV checks dan LRA aggregator silent wrong.
//
// Strategy (Opsi A Strict, approved by user):
//   Rule 1: Untuk setiap leaf row:
//             if hargaSatuanRevisi == 0 AND hargaSatuanAwal > 0:
//               set hargaSatuanRevisi = hargaSatuanAwal  (mirror Semula→Revisi)
//   Rule 2: Untuk setiap leaf row, sync field derived:
//             jumlahBiayaAwal = hargaSatuanAwal × volume
//             jumlahBiayaRevisi = hargaSatuanRevisi × volume
//   Rule 3: Untuk parent rows (level 0/1 dengan children), bubble up:
//             jumlahBiayaAwal = sum(direct children jumlahBiayaAwal)
//             jumlahBiayaRevisi = sum(direct children jumlahBiayaRevisi)
//
// Result (verified via API after apply):
//   - Rule 1: 4 leaf rows recovered, +Rp 137,995,000 ke total Pagu TA 2025
//     - pagu-2025-bekkes/521811.05 (Obat & BMHP YANMASUM REKANAN): +Rp 72,995,000
//     - pagu-2025-jasa/521115.04 (HONOR PENGELOLA YANMASUM):       +Rp  5,000,000
//     - pagu-2025-modal/532111.06.A (PENGADAAN ALSINTOR BPJS):     +Rp 40,000,000
//     - pagu-2025-operasional/521112.01 (BAHAN MAKANAN YANMASUM):  +Rp 20,000,000
//   - Rule 2: 41 leaf rows had field sync
//   - Rule 3: Multiple parents auto-bubble-up sums
//   - Total Pagu TA 2025: Rp 2,571,940,000.40 → Rp 2,709,935,000.40 (+Rp 137,995,000)
//
// Future-proofing (code-level fix):
//   - components/PaguAnggaran.tsx handleRowChange: now auto-mirrors Revisi←Semula
//     when user edits hargaSatuanAwal (if Revisi was 0 or equal to old Awal)
//   - components/PaguAnggaran.tsx handleRowChange: now syncs jumlahBiaya fields
//     when hargaSatuanAwal/hargaSatuanRevisi/volume change (no more stale fields)
//   - utils/paguLookup.ts: new getEffectiveValue() helper for defensive aggregation
//   - utils/paguLookup.ts buildPaguByKode + lookupPagu: use getEffectiveValue
//   - utils/realisasiBucket.ts totalPagu + paguByKode: use getEffectiveValue
//
// ⚠️ This file is for AUDIT TRAIL only. The migration has been APPLIED via
// Python script directly to Supabase REST API. Re-running this code is safe
// (idempotent), but unnecessary.
// ============================================================================

import { supabase } from '../supabase';
import type { PaguSection, PaguRow } from '../../types';

export interface MigrationResult {
  konteks1Recovery: number;
  rule1AffectedRows: Array<{
    section: string;
    rowId: string;
    kode: string;
    description: string;
    recoveryJumlah: number;
  }>;
  rule2SyncCount: number;
}

/**
 * Apply Sprint D Item #1 migration.
 *
 * @param dryRun - if true, compute changes but do not write to DB
 * @returns migration summary
 */
export async function applyMigrationD1(dryRun = false): Promise<MigrationResult> {
  const { data: sections, error } = await supabase
    .from('pagu_sections')
    .select('*');

  if (error) throw error;
  if (!sections) return { konteks1Recovery: 0, rule1AffectedRows: [], rule2SyncCount: 0 };

  const result: MigrationResult = {
    konteks1Recovery: 0,
    rule1AffectedRows: [],
    rule2SyncCount: 0,
  };

  for (const section of sections as Array<{ id: string; data: { title?: string; rows: PaguRow[] } }>) {
    const body = section.data || { rows: [] };
    const rows = body.rows || [];
    let dirty = false;

    // ── Pass 1: leaf rows — Rule 1 (mirror) + Rule 2 (sync) ──
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const next = rows[i + 1];
      const isLeaf = !(next && next.level > r.level);
      if (!isLeaf) continue;

      const vol = r.volume || 0;
      const hsAwal = r.hargaSatuanAwal || 0;
      let hsRevisi = r.hargaSatuanRevisi || 0;
      const jbAwal = r.jumlahBiayaAwal || 0;
      const jbRevisi = r.jumlahBiayaRevisi || 0;

      // Rule 1: Konteks 1 mirror
      if (hsRevisi === 0 && hsAwal > 0) {
        result.rule1AffectedRows.push({
          section: section.id,
          rowId: r.id,
          kode: r.kode,
          description: r.description,
          recoveryJumlah: hsAwal * vol,
        });
        result.konteks1Recovery += hsAwal * vol;
        r.hargaSatuanRevisi = hsAwal;
        hsRevisi = hsAwal;
        dirty = true;
      }

      // Rule 2: Sync jumlahBiaya from harga × volume
      const newJbAwal = hsAwal * vol;
      const newJbRevisi = hsRevisi * vol;
      if (jbAwal !== newJbAwal || jbRevisi !== newJbRevisi) {
        r.jumlahBiayaAwal = newJbAwal;
        r.jumlahBiayaRevisi = newJbRevisi;
        result.rule2SyncCount++;
        dirty = true;
      }
    }

    // ── Pass 2: parent rows — bubble up sums (level 5 → 0) ──
    for (let lvl = 5; lvl >= 0; lvl--) {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.level !== lvl) continue;
        const next = rows[i + 1];
        const hasChildren = next && next.level > lvl;
        if (!hasChildren) continue;

        let sumAwal = 0;
        let sumRevisi = 0;
        for (let j = i + 1; j < rows.length; j++) {
          if (rows[j].level <= lvl) break;
          if (rows[j].level === lvl + 1) {
            sumAwal += rows[j].jumlahBiayaAwal || 0;
            sumRevisi += rows[j].jumlahBiayaRevisi || 0;
          }
        }

        if (r.jumlahBiayaAwal !== sumAwal || r.jumlahBiayaRevisi !== sumRevisi) {
          r.jumlahBiayaAwal = sumAwal;
          r.jumlahBiayaRevisi = sumRevisi;
          dirty = true;
        }
      }
    }

    if (dirty && !dryRun) {
      const { error: updateError } = await supabase
        .from('pagu_sections')
        .update({ data: body })
        .eq('id', section.id);
      if (updateError) {
        console.error(`Migration failed for section ${section.id}:`, updateError);
        throw updateError;
      }
    }
  }

  return result;
}
