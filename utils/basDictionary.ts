// ============================================================================
// SIKESUMA v3.1 · BAS Dictionary — Sprint B.1
// ============================================================================
// File          : utils/basDictionary.ts
// Phase         : Sprint B.1 — Whitelist BAS dari KEP-331/2021 + KEP-291/2022
// Date          : 10 Mei 2026
// Source        : KEP-331_PB_2021 (4,213 codes Kas+Akrual) + KEP-291_PB_2022
//                 (Lampiran I/III updates, V deactivations, VI TA 2023 new)
//                 → 4,314 unique codes total (4,293 active, 21 deactivated)
// Distribution  :
//   ASET         1,032
//   BELANJA      1,168
//   PENDAPATAN     649
//   ALLOTMENT      583
//   KEWAJIBAN      372
//   PEMBIAYAAN     268
//   TRANSFER       158
//   EKUITAS         84
// ============================================================================

import basRaw from '../constants/basDictionary.json';

export type BasKategori =
  | 'ASET' | 'KEWAJIBAN' | 'EKUITAS'
  | 'PENDAPATAN' | 'BELANJA' | 'TRANSFER' | 'PEMBIAYAAN' | 'ALLOTMENT'
  | 'OTHER' | 'UNKNOWN';

export interface BasEntry {
  kode:      string;        // 1-6 digit code
  uraian:    string;        // canonical name
  kategori:  BasKategori;   // top-level segment
  basis:     string;        // 'KAS' | 'AKRUAL' | 'KAS,AKRUAL'
  sumber:    string;        // 'KEP-331' | 'KEP-291' | 'KEP-291 TA-2023' | 'KEP-291 (deactivated)'
  active:    boolean;       // false if in KEP-291 Lampiran V (Penonaktifan)
}

// Index built once at module load
const _entries: BasEntry[] = basRaw as BasEntry[];
const _byKode: Map<string, BasEntry> = new Map(_entries.map(e => [e.kode, e]));

/**
 * Get all BAS entries as a (frozen) array.
 * Use for static enumeration; for lookups prefer lookupBas().
 */
export const ALL_BAS_ENTRIES: ReadonlyArray<BasEntry> = Object.freeze(_entries);

/**
 * Lookup BAS entry by exact kode. Returns null if not found.
 */
export function lookupBas(kode: string): BasEntry | null {
  return _byKode.get((kode || '').trim()) || null;
}

/**
 * Check if a kode exists in BAS (regardless of active/inactive status).
 */
export function isValidBasKode(kode: string): boolean {
  return _byKode.has((kode || '').trim());
}

/**
 * Check if a kode is active in BAS (i.e., not deactivated by KEP-291).
 */
export function isActiveBasKode(kode: string): boolean {
  const e = _byKode.get((kode || '').trim());
  return !!e && e.active;
}

/**
 * Search BAS entries by partial kode prefix or uraian text (case-insensitive).
 * Used by autocomplete UI. Returns up to `limit` entries.
 */
export function searchBas(
  query: string,
  options?: { kategori?: BasKategori | BasKategori[]; activeOnly?: boolean; limit?: number }
): BasEntry[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const limit = options?.limit ?? 20;
  const activeOnly = options?.activeOnly ?? true;
  const kategoriFilter = options?.kategori
    ? (Array.isArray(options.kategori) ? options.kategori : [options.kategori])
    : null;

  const results: BasEntry[] = [];
  // Prefer prefix matches on kode; then partial uraian match
  const prefix: BasEntry[] = [];
  const partial: BasEntry[] = [];

  for (const e of _entries) {
    if (activeOnly && !e.active) continue;
    if (kategoriFilter && !kategoriFilter.includes(e.kategori)) continue;

    if (e.kode.startsWith(q)) {
      prefix.push(e);
    } else if (e.uraian.toLowerCase().includes(q)) {
      partial.push(e);
    }
    if (prefix.length >= limit) break;
  }

  // Sort prefix matches by kode length asc (more specific first), then alphabetic
  prefix.sort((a, b) => a.kode.length - b.kode.length || a.kode.localeCompare(b.kode));
  results.push(...prefix.slice(0, limit));
  if (results.length < limit) {
    partial.sort((a, b) => a.kode.localeCompare(b.kode));
    results.push(...partial.slice(0, limit - results.length));
  }
  return results;
}

/**
 * Derive canonical 6-digit BAS kode from a SIKESUMA-internal kode.
 * SIKESUMA uses suffixes like '521115.01' for sub-coding. The canonical BAS
 * code is the part before the dot (or first 6 digits if no dot).
 *
 * Returns null if the prefix doesn't match any BAS code.
 */
export function deriveKodeBas(kodeInternal: string): string | null {
  const cleaned = (kodeInternal || '').trim();
  if (!cleaned) return null;
  // Strip suffix after first dot
  const prefix = cleaned.split('.')[0];
  // Pure digits only
  if (!/^\d+$/.test(prefix)) return null;
  return _byKode.has(prefix) ? prefix : null;
}

/**
 * Counts for diagnostics / "About" UI. Static — computed at module load.
 */
export const BAS_STATS = Object.freeze({
  total:    _entries.length,
  active:   _entries.filter(e => e.active).length,
  inactive: _entries.filter(e => !e.active).length,
  byKategori: _entries.reduce((acc, e) => {
    acc[e.kategori] = (acc[e.kategori] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
});
