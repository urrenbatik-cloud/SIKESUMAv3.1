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

// ────────────────────────────────────────────────────────────────────────────
// Keyword Aliases — Sprint B.4 HB#3 (per Angga 10 Mei 2026)
// ────────────────────────────────────────────────────────────────────────────
// Istilah lokal di RS Batin Tikal yang punya konteks khusus tidak tampak dari
// uraian BAS literal. Mapping ini surface kode yang benar saat user typing
// istilah lokal — autocomplete inclusivity.
//
// Contoh: "BMP" awalnya di-misinterpret sebagai "Bahan Makanan Pokok" (521112);
// di Kemhan/TNI BMP = Bahan Bakar Minyak dan Pelumas (523122) per Permenhan 5/2020.
const KEYWORD_ALIASES: Record<string, string[]> = {
  // BMP/BBM Kemhan/TNI (Permenhan 5/2020)
  'bmp':         ['523122', '523125'],
  'bbm':         ['523122', '523125'],
  'bahan bakar': ['523122', '523125'],
  'pertamax':    ['523122'],
  'solar':       ['523122'],
  'pelumas':     ['523122', '523125'],
  'avtur':       ['523122'],
  // BMHP — Bahan Medis Habis Pakai
  'bmhp':        ['521811'],
  'obat':        ['521811'],
  'persediaan medis': ['521811'],
  // Honor (HB#2: continuous monthly = 521115 di RS Batin Tikal)
  'tks':         ['521115'],
  'honor tks':   ['521115'],
  'nakes':       ['521115'],
  'honor nakes': ['521115'],
  'honor pengelola': ['521115'],
  'casemix':     ['521115'],
  // BPD/perjalanan
  'bpd':         ['524111'],
  'perjalanan dinas': ['524111', '524112', '524113', '524114', '524119'],
  // ATK
  'atk':         ['521111'],
  // Utilities
  'listrik':     ['522111'],
  'pln':         ['522111'],
  'air':         ['522113'],
  'pdam':        ['522113'],
  'internet':    ['522112'],
  'telepon':     ['522112'],
  'wifi':        ['522112'],
};

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
 *
 * [Sprint B.4 HB#3] Selain prefix/uraian match, sekarang juga match keyword
 * aliases (KEYWORD_ALIASES map). Contoh: query "bmp" akan surface 523122
 * (Belanja BMP Kemhan/TNI) sebelum partial match "bmpwah" yang tidak relevan.
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

  const passesFilter = (e: BasEntry): boolean => {
    if (activeOnly && !e.active) return false;
    if (kategoriFilter && !kategoriFilter.includes(e.kategori)) return false;
    return true;
  };

  // [HB#3] Step 1: alias hits — prepend kalau query exact-match keyword alias
  const aliasResults: BasEntry[] = [];
  const seenKodes = new Set<string>();
  const aliasKodes = KEYWORD_ALIASES[q];
  if (aliasKodes) {
    for (const k of aliasKodes) {
      const e = _byKode.get(k);
      if (e && passesFilter(e)) {
        aliasResults.push(e);
        seenKodes.add(k);
      }
    }
  }

  // Step 2: prefix matches on kode
  const prefix: BasEntry[] = [];
  const partial: BasEntry[] = [];
  for (const e of _entries) {
    if (seenKodes.has(e.kode)) continue;
    if (!passesFilter(e)) continue;
    if (e.kode.startsWith(q)) {
      prefix.push(e);
    } else if (e.uraian.toLowerCase().includes(q)) {
      partial.push(e);
    }
    if (aliasResults.length + prefix.length >= limit) break;
  }

  prefix.sort((a, b) => a.kode.length - b.kode.length || a.kode.localeCompare(b.kode));
  partial.sort((a, b) => a.kode.localeCompare(b.kode));
  const out = [...aliasResults, ...prefix];
  if (out.length < limit) {
    out.push(...partial.slice(0, limit - out.length));
  }
  return out.slice(0, limit);
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
