/**
 * Shared Validator Helpers
 *
 * File: utils/validators/helpers.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b continuation — Turn 2 C3)
 *
 * Helper functions yang dipakai cross-validator untuk avoid code duplication.
 * Originally inline di c1.ts; extracted ke shared module agar C2/C3/C5 + future
 * validators (C6-C12) bisa reuse.
 *
 * Design principle: Pure functions, no side effects, no global state.
 *
 * Owner-friendly (per dr Ferry neurosurgeon background):
 * - isLeaf: "leaf detection" = identify row tanpa anak (mirip "tip of bronchial
 *   tree" — bagian terkecil dari hierarchy)
 * - effectiveAwal/Revisi: compute nilai aktual per row (volume × harga satuan)
 *   dengan Konteks 1 fallback untuk Revisi
 * - isChangedRow: detect row yang ter-revisi (analog: "patient parameters changed
 *   between visits")
 * - formatRupiah: cosmetic — format angka jadi 'Rp 1.234.567' (locale id-ID)
 *
 * References:
 * - SSOT §0.7.2 (leaf detection — traversal-based, BUKAN level>0 filter)
 * - SSOT §0.7.3 (effective value — Konteks 1 fallback)
 * - Sprint D Item #1 (Konteks 1 normative logic per Angga)
 */
import type { PaguRow } from '../../types';

/**
 * Tolerance untuk floating-point comparison.
 * Selisih ≤ Rp 0.50 dianggap "sama" (negligible rounding artifact).
 *
 * Re-exported dari sini sebagai single source of truth — semua validator yang
 * butuh numeric comparison harus pakai konstanta ini, bukan literal 0.5.
 */
export const EPSILON_RUPIAH = 0.5;

/**
 * Cek apakah row pada index `idx` di array `rows` adalah LEAF (tidak punya anak).
 *
 * Per SSOT §0.7.2 — traversal-based detection (BUKAN level>0 filter):
 *   - Last row di section → leaf (no next row to compare)
 *   - Next row level ≤ current level → current is leaf
 *   - Next row level > current level → current has children (NOT leaf)
 *
 * @param rows Array PaguRow dalam 1 section (urutan hierarchical order)
 * @param idx Index row yang di-cek
 * @returns true kalau row adalah leaf, false kalau punya anak
 */
export function isLeaf(rows: PaguRow[], idx: number): boolean {
  if (idx >= rows.length - 1) return true;
  const curLevel = rows[idx].level ?? 0;
  const nextLevel = rows[idx + 1].level ?? 0;
  return nextLevel <= curLevel;
}

/**
 * Hitung effective Awal untuk satu leaf row.
 * Simple: volume × hargaSatuanAwal.
 *
 * @param row PaguRow (preferably leaf, tapi tidak strictly required)
 * @returns Nilai Rupiah Awal effective
 */
export function effectiveAwal(row: PaguRow): number {
  return (row.volume ?? 0) * (row.hargaSatuanAwal ?? 0);
}

/**
 * Hitung effective Revisi untuk satu leaf row, dengan Konteks 1 fallback.
 *
 * Per Konteks 1 normative logic (Sprint D Item #1, Angga):
 *   - hargaSatuanRevisi > 0 → use hargaSatuanRevisi (row sudah direvisi)
 *   - hargaSatuanRevisi = 0 → fallback ke hargaSatuanAwal
 *     ("belum direvisi" = sama dengan Semula, BUKAN literal 0)
 *
 * @param row PaguRow (preferably leaf)
 * @returns Nilai Rupiah Revisi effective (dengan fallback kalau perlu)
 */
export function effectiveRevisi(row: PaguRow): number {
  const hsr = row.hargaSatuanRevisi ?? 0;
  const hsa = row.hargaSatuanAwal ?? 0;
  const effectiveHarga = hsr > 0 ? hsr : hsa;
  return (row.volume ?? 0) * effectiveHarga;
}

/**
 * Cek apakah row adalah "changed row" — yaitu row yang ter-revisi
 * (effective Awal ≠ effective Revisi, di luar epsilon tolerance).
 *
 * Per Decision R1 (11 Mei 2026 Owner-approved): pakai effective values untuk
 * konsisten dengan Konteks 1 fallback. Row dengan hargaSatuanRevisi=0 yang
 * fallback ke Awal TIDAK dihitung sebagai "changed" (karena effective values
 * akan sama).
 *
 * Dipakai oleh C2, C3 (group by metadata fields → cek distinct count).
 *
 * @param row PaguRow (preferably leaf)
 * @returns true kalau row terdeteksi sebagai changed
 */
export function isChangedRow(row: PaguRow): boolean {
  const eAwal = effectiveAwal(row);
  const eRevisi = effectiveRevisi(row);
  return Math.abs(eAwal - eRevisi) > EPSILON_RUPIAH;
}

/**
 * Format angka Rupiah untuk human-readable message.
 * Pakai locale 'id-ID' (Indonesian thousand separator).
 *
 * @param amount Nilai Rupiah (number)
 * @returns String dalam format "Rp 1.234.567"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

/**
 * Collect SEMUA leaf rows dari semua sections (regardless of changed status).
 *
 * Helper untuk validator yang butuh iterate ALL leaves — bukan hanya yang
 * direvisi. Contoh use case:
 *   - C5: cek volume_ro/satuan_ro consistency per RO (semua leaves, bukan
 *     hanya changed)
 *   - C6/C7/C9 (future Tier 4b): per-row sanity check (jenis belanja,
 *     sumber dana, nilai minus) yang independen dari status changed
 *
 * Internally pakai `isLeaf` helper traversal-based (§0.7.2 — AP-1 safe).
 *
 * @param sections Array PaguSection dari ValidationContext
 * @returns Array PaguRow yang merupakan leaf (changed maupun unchanged)
 */
export function collectAllLeaves(
  sections: { rows: PaguRow[] }[]
): PaguRow[] {
  const result: PaguRow[] = [];
  sections.forEach(section => {
    section.rows.forEach((row, idx) => {
      if (isLeaf(section.rows, idx)) result.push(row);
    });
  });
  return result;
}

/**
 * Collect semua changed leaf rows dari semua sections.
 *
 * Helper convenience untuk validator yang butuh iterate changed rows
 * (C2, C3). Implementasi sederhana: delegasi ke `collectAllLeaves` lalu
 * filter `isChangedRow` (Decision R1 — effective values).
 *
 * @param sections Array PaguSection dari ValidationContext
 * @returns Array PaguRow yang merupakan leaf DAN changed
 */
export function collectChangedLeaves(
  sections: { rows: PaguRow[] }[]
): PaguRow[] {
  return collectAllLeaves(sections).filter(isChangedRow);
}
