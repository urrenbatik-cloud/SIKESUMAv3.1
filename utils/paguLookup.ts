// ============================================================================
// SIKESUMA v3.1 · Pagu Lookup Helper — SSOT untuk Pagu per Kode Akun
// ============================================================================
// File          : utils/paguLookup.ts
// Phase         : Sprint A2 — Derive RPDRow.totalBudget dari Pagu
// Date          : 10 Mei 2026
// Purpose       : Helper terpusat untuk lookup Pagu (jumlahBiaya) berdasarkan
//                 kode akun. Sebagai pengganti RPDRow.totalBudget yang
//                 sebelumnya di-cache (violation L4).
//
// Lattice rule  : L4 — RPD totalBudget = Pagu totalBudget (DERIVED, not stored)
// ============================================================================

import type { PaguSection } from '../types';

export type PaguViewMode = 'SEMULA' | 'REVISI' | 'SEMUA';

/**
 * Lookup Pagu (awal & revisi) untuk satu kode akun di paguSections.
 *
 * Implementasi pakai LEAF-NODES-ONLY logic untuk hindari double-counting
 * (parent rows menjumlahkan children, jadi kalau dihitung lagi akan dobel).
 *
 * @param kode - kode akun yang dicari (mis. '521115.01')
 * @param paguSections - daftar section (sudah di-filter per tahun via App.tsx)
 * @returns { awal, revisi } dalam Rupiah, atau null jika kode tidak ditemukan
 */
export function lookupPagu(
  kode: string,
  paguSections: PaguSection[]
): { awal: number; revisi: number } | null {
  const cleanCode = kode.trim();
  if (!cleanCode) return null;

  let awalSum = 0;
  let revisiSum = 0;
  let found = false;

  for (const sec of paguSections) {
    const allRows = sec.rows;
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.kode.trim() !== cleanCode) continue;

      // Check if this row is a leaf (no children with deeper level)
      const nextRow = allRows[i + 1];
      const hasChildren = nextRow && nextRow.level > row.level;

      if (!hasChildren) {
        awalSum += row.jumlahBiayaAwal || 0;
        revisiSum += row.jumlahBiayaRevisi || 0;
        found = true;
      }
    }
  }

  return found ? { awal: awalSum, revisi: revisiSum } : null;
}

/**
 * Convenience: get pagu untuk satu kode dengan view mode tertentu.
 * Returns 0 jika kode tidak ditemukan (caller wajib check apakah ini valid).
 *
 * Untuk SSOT-strict mode (Opsi A), gunakan lookupPagu() dan handle null
 * dengan menampilkan "INVALID KODE" di UI.
 */
export function getPaguForKode(
  kode: string,
  paguSections: PaguSection[],
  viewMode: PaguViewMode
): number {
  const pagu = lookupPagu(kode, paguSections);
  if (!pagu) return 0;
  return viewMode === 'SEMULA' ? pagu.awal : pagu.revisi;
}

/**
 * Bangun map kode → {awal, revisi} untuk semua kode di paguSections.
 * Berguna untuk consumer yang perlu lookup banyak kode (mis. RPD render
 * banyak rows). Lebih efisien dari memanggil lookupPagu() berkali-kali.
 */
export function buildPaguByKode(
  paguSections: PaguSection[]
): Record<string, { awal: number; revisi: number }> {
  const map: Record<string, { awal: number; revisi: number }> = {};

  for (const sec of paguSections) {
    const allRows = sec.rows;
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      const cleanCode = row.kode.trim();
      if (!cleanCode) continue;

      const nextRow = allRows[i + 1];
      const hasChildren = nextRow && nextRow.level > row.level;
      if (hasChildren) continue; // skip parents to avoid double-count

      if (!map[cleanCode]) map[cleanCode] = { awal: 0, revisi: 0 };
      map[cleanCode].awal += row.jumlahBiayaAwal || 0;
      map[cleanCode].revisi += row.jumlahBiayaRevisi || 0;
    }
  }

  return map;
}
