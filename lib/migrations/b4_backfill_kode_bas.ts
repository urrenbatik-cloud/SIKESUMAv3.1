/**
 * Migration B.4 — Backfill kode_bas di pagu_sections.data.rows[]
 *
 * Status:  ⏳ MENUNGGU PERSETUJUAN ANGGA (HITL)
 *
 * Latar belakang:
 * Sprint B.2 sudah menambah field optional `kode_bas` ke PaguRow. Sekarang
 * kita perlu backfill 40 row Pagu yang sudah ada di Supabase (data 2024-2025)
 * dengan canonical kode_bas yang benar. Karena beberapa kode SIKESUMA tidak
 * ada di BAS resmi (audit-flagged: 521311, 521411) dan beberapa lainnya butuh
 * review manual (mis. honor BLU vs non-BLU), pemetaan harus disetujui dulu
 * oleh Angga sebagai pemilik domain akuntansi.
 *
 * Document untuk review: SPRINT-B4-HITL-MAPPING-PROPOSAL.md
 *
 * Setelah Angga setujui, ganti `MAPPING_PENDING_APPROVAL = true` jadi `false`
 * dan isi `KODE_BAS_BACKFILL` dengan keputusan final.
 */

import { supabase } from '../supabase';

// ⚠️ Set ke `false` setelah Angga setujui dan KODE_BAS_BACKFILL terisi
const MAPPING_PENDING_APPROVAL = true;

// Map row.id → kode_bas yang akan di-set
// Format: 'row-2025-bk-1': '521813'
// Untuk row yang Angga setujui "tetap pakai kode prefix", isi dengan prefix.
// Untuk parent header (status ORPHAN di proposal), kosongi saja (jangan masuk map).
const KODE_BAS_BACKFILL: Record<string, string> = {
  // TODO: Isi setelah persetujuan Angga
  // Contoh setelah disetujui:
  // 'row-2025-bk-h': '521811',  // header BELANJA BEKKES
  // 'row-2025-bk-1': '521813',  // Obat & BMHP
  // 'row-2025-bk-2': '521811',  // Gas Medis
  // ...
};

export async function backfillKodeBas(): Promise<{ updated: number; skipped: number; missing: string[] }> {
  if (MAPPING_PENDING_APPROVAL) {
    throw new Error(
      'Mapping belum disetujui Angga. Lihat SPRINT-B4-HITL-MAPPING-PROPOSAL.md, ' +
      'isi keputusan, lalu update KODE_BAS_BACKFILL dan set MAPPING_PENDING_APPROVAL = false.'
    );
  }

  const { data, error } = await supabase.from('pagu_sections').select('*');
  if (error) throw error;
  if (!data) return { updated: 0, skipped: 0, missing: [] };

  let updated = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const section of data) {
    const body = (section.data || {}) as { rows?: any[] };
    if (!Array.isArray(body.rows)) {
      skipped++;
      continue;
    }
    let sectionDirty = false;
    for (const row of body.rows) {
      const rowId = row.id;
      if (!rowId) continue;
      const targetKodeBas = KODE_BAS_BACKFILL[rowId];

      if (targetKodeBas === undefined) {
        // Row tidak di-mapping — bisa header section atau sengaja di-skip
        // Pastikan kode_bas tetap kosong/null
        if (row.kode_bas !== undefined && row.kode_bas !== null && row.kode_bas !== '') {
          // Row ini punya kode_bas yang sudah di-set sebelumnya — biarkan
          continue;
        }
        if (row.kode && row.kode.trim() !== '') {
          missing.push(`${section.id}/${rowId} (kode=${row.kode}, desc=${row.description})`);
        }
        continue;
      }

      if (row.kode_bas === targetKodeBas) {
        skipped++; // already correct
        continue;
      }
      row.kode_bas = targetKodeBas;
      sectionDirty = true;
      updated++;
    }

    if (sectionDirty) {
      const { error: updErr } = await supabase
        .from('pagu_sections')
        .update({ data: body })
        .eq('id', section.id);
      if (updErr) {
        console.error(`Failed to update ${section.id}:`, updErr);
      } else {
        console.log(`✅ ${section.id}: ${body.rows.filter(r => r.kode_bas).length} rows have kode_bas`);
      }
    }
  }

  if (missing.length > 0) {
    console.warn(`⚠️ ${missing.length} rows have a kode tapi tidak di KODE_BAS_BACKFILL:`, missing);
  }

  return { updated, skipped, missing };
}
