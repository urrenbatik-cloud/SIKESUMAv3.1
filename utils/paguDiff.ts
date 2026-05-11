// ============================================================================
// SIKESUMA v3.1 · Pagu Diff Helper — Categorize revisions for sintesis view
// ============================================================================
// File          : utils/paguDiff.ts
// Phase         : Sprint D Item #2 — UX Pagu Semula vs Revisi visibility
// Date          : 11 Mei 2026
// Purpose       : Classify setiap leaf row berdasarkan jenis revisi (per
//                 Konteks 3 dr Ferry): Bertambah / Berkurang / Item Baru
//                 (breakdown) / Tidak Berubah. Plus compute sintesis aggregate
//                 untuk dashboard cards + summary table.
//
// Konsisten dengan Sprint D Item #1 — pakai getEffectiveValue helper untuk
// fallback Konteks 1 (Revisi=0 bukan drop, fallback ke Semula).
// ============================================================================

import type { PaguRow, PaguSection } from '../types';
import { getEffectiveValue } from './paguLookup';

export type RevisionCategory = 'BERTAMBAH' | 'BERKURANG' | 'BARU' | 'TIDAK_BERUBAH';

export interface RevisionClassification {
  category: RevisionCategory;
  semula: number;       // hargaSatuanAwal × volume
  revisi: number;       // effective revisi (with Konteks 1 fallback)
  delta: number;        // revisi - semula (signed)
  deltaPercent: number; // delta / semula × 100 (0 if semula=0 and revisi=0; Infinity if semula=0 and revisi>0)
}

/**
 * Classify a single leaf row berdasarkan delta Semula vs Revisi.
 *
 * Categories:
 *   - 'BARU'         : Semula = 0, Revisi > 0 (item baru / breakdown on the fly)
 *   - 'BERTAMBAH'    : Semula > 0, Revisi > Semula
 *   - 'BERKURANG'    : Semula > 0, Revisi < Semula AND Revisi > 0
 *   - 'TIDAK_BERUBAH': Semula = Revisi (termasuk both = 0)
 *
 * Note: Setelah Sprint D Item #1 fix, kasus "Semula > 0 AND Revisi = 0"
 * tidak akan terjadi (Revisi=0 sudah fallback ke Semula). Kalau muncul lagi,
 * berarti bug recurred — perlu investigate.
 */
export function classifyRow(row: PaguRow): RevisionClassification {
  const vol = row.volume || 0;
  const semula = (row.hargaSatuanAwal || 0) * vol;
  const revisi = getEffectiveValue(row, 'REVISI');
  const delta = revisi - semula;

  let category: RevisionCategory;
  if (semula === 0 && revisi > 0) {
    category = 'BARU';
  } else if (delta > 0) {
    category = 'BERTAMBAH';
  } else if (delta < 0) {
    category = 'BERKURANG';
  } else {
    category = 'TIDAK_BERUBAH';
  }

  const deltaPercent = semula > 0
    ? (delta / semula) * 100
    : (revisi > 0 ? Infinity : 0);

  return { category, semula, revisi, delta, deltaPercent };
}

/**
 * Helper: cek apakah row adalah leaf (tidak punya children dengan level lebih dalam).
 */
function isLeafRow(rows: PaguRow[], idx: number): boolean {
  const next = rows[idx + 1];
  return !(next && next.level > rows[idx].level);
}

export interface SintesisGroup {
  rows: Array<{ row: PaguRow; section: PaguSection; classification: RevisionClassification }>;
  total: number;         // signed sum of delta untuk BERTAMBAH/BERKURANG/BARU,
                         // or sum of revisi untuk TIDAK_BERUBAH
  sectionTitles: string[]; // distinct section titles yang punya row di kategori ini
}

export interface SintesisRevisi {
  bertambah: SintesisGroup;
  berkurang: SintesisGroup;
  baru: SintesisGroup;
  tidakBerubah: SintesisGroup;

  totalSemula: number;
  totalRevisi: number;
  netChange: number;
  netChangePercent: number;
  rowsAffected: number;  // bertambah + berkurang + baru
  totalRows: number;
}

/**
 * Compute sintesis revisi aggregate dari semua leaf rows di paguSections.
 */
export function computeSintesis(paguSections: PaguSection[]): SintesisRevisi {
  const make = (): SintesisGroup => ({ rows: [], total: 0, sectionTitles: [] });
  const result: SintesisRevisi = {
    bertambah: make(),
    berkurang: make(),
    baru: make(),
    tidakBerubah: make(),
    totalSemula: 0,
    totalRevisi: 0,
    netChange: 0,
    netChangePercent: 0,
    rowsAffected: 0,
    totalRows: 0,
  };

  const sectionTitlesByCategory: Record<RevisionCategory, Set<string>> = {
    BERTAMBAH: new Set(),
    BERKURANG: new Set(),
    BARU: new Set(),
    TIDAK_BERUBAH: new Set(),
  };

  for (const section of paguSections) {
    for (let i = 0; i < section.rows.length; i++) {
      const row = section.rows[i];
      if (!row.kode.trim()) continue;
      if (!isLeafRow(section.rows, i)) continue;

      const cls = classifyRow(row);
      result.totalSemula += cls.semula;
      result.totalRevisi += cls.revisi;

      const group = (() => {
        switch (cls.category) {
          case 'BERTAMBAH': return result.bertambah;
          case 'BERKURANG': return result.berkurang;
          case 'BARU': return result.baru;
          case 'TIDAK_BERUBAH': return result.tidakBerubah;
        }
      })();

      group.rows.push({ row, section, classification: cls });
      // 'BERTAMBAH'/'BERKURANG'/'BARU': accumulate signed delta
      // 'TIDAK_BERUBAH': accumulate revisi value (== semula)
      group.total += cls.category === 'TIDAK_BERUBAH' ? cls.revisi : cls.delta;
      sectionTitlesByCategory[cls.category].add(section.title || section.id);
    }
  }

  result.bertambah.sectionTitles = [...sectionTitlesByCategory.BERTAMBAH];
  result.berkurang.sectionTitles = [...sectionTitlesByCategory.BERKURANG];
  result.baru.sectionTitles = [...sectionTitlesByCategory.BARU];
  result.tidakBerubah.sectionTitles = [...sectionTitlesByCategory.TIDAK_BERUBAH];

  result.netChange = result.totalRevisi - result.totalSemula;
  result.netChangePercent = result.totalSemula > 0
    ? (result.netChange / result.totalSemula) * 100
    : 0;
  result.rowsAffected = result.bertambah.rows.length + result.berkurang.rows.length + result.baru.rows.length;
  result.totalRows = result.rowsAffected + result.tidakBerubah.rows.length;

  return result;
}

/**
 * Filter mode for Phase 2 Inline Indicator (Opsi A).
 */
export type RowFilterMode = 'all' | 'revised' | 'new';

/**
 * Apply filter to a list of rows berdasarkan category classification.
 * Used by PaguAnggaran.tsx untuk filter chip "Semua | Hanya Direvisi | Item Baru saja".
 *
 * @param rows - section.rows
 * @param mode - filter selection
 * @returns set of row IDs yang harus DI-HIDE (untuk apply via .filter)
 */
export function getHiddenRowIds(rows: PaguRow[], mode: RowFilterMode): Set<string> {
  const hidden = new Set<string>();
  if (mode === 'all') return hidden;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isLeafRow(rows, i)) continue;
    if (!row.kode.trim()) continue;

    const cls = classifyRow(row);
    if (mode === 'revised' && cls.category === 'TIDAK_BERUBAH') {
      hidden.add(row.id);
    } else if (mode === 'new' && cls.category !== 'BARU') {
      hidden.add(row.id);
    }
  }

  // Parents: hide if all children hidden
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const next = rows[i + 1];
    const hasChildren = next && next.level > row.level;
    if (!hasChildren) continue;

    let allChildrenHidden = true;
    let anyChild = false;
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[j].level <= row.level) break;
      if (isLeafRow(rows, j) && rows[j].kode.trim()) {
        anyChild = true;
        if (!hidden.has(rows[j].id)) {
          allChildrenHidden = false;
          break;
        }
      }
    }
    if (anyChild && allChildrenHidden) hidden.add(row.id);
  }

  return hidden;
}
