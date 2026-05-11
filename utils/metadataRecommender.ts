/**
 * Metadata Recommender — Tier 3 Phase 2b
 *
 * File: utils/metadataRecommender.ts
 * Created: 11 Mei 2026 (Tier 3 fresh session)
 *
 * Tujuan: Pure function pattern-matching recommender untuk metadata BAS
 * (KRO, Kegiatan, RO, Komponen, Sumber Dana) berdasarkan kode_bas +
 * description + sumberDana row. Output dipakai UI PaguAnggaran.tsx (Phase 3)
 * untuk render badge confidence + button Terima/Edit/Tolak.
 *
 * **Konteks 4 dr Ferry compliance:** Function ini PURE — tidak modify
 * data input. UI yang decide apply suggestion ke row state, dengan
 * eksplisit user click.
 *
 * Mapping rules: RKKS 2025 §12.2 (vKoreksi v3) + corrected Decision B
 * (11 Mei 2026). Lihat docs/REVISI-POK-PAGU-vKoreksi.md untuk detail
 * domain reasoning.
 *
 * Override mechanism (per Owner direction): jika `row.metadata_review`
 * is set (manual review by Angga via UI), semua confidence di-force ke
 * 'high' regardless of computed rules. Lihat types.ts metadata_review
 * untuk shape.
 *
 * Test: utils/metadataRecommender.test.ts validates against fixture
 * utils/fixtures/pagu-leaves-ta2025.json (38 leaves ground truth).
 */
import type { PaguRow } from '../types';

// ────────────────────────────────────────────────────────────────────────
// Type definitions
// ────────────────────────────────────────────────────────────────────────

export type Confidence = 'high' | 'medium' | 'low';

export interface MetadataRecommendation {
  kro: { code: string | null; name: string | null; confidence: Confidence };
  kegiatan: { code: string | null; name: string | null; confidence: Confidence };
  ro: { code: string | null; confidence: Confidence };
  komponen: { code: string | null; name: string | null; confidence: Confidence };
  sumber_dana: { kode: string | null; confidence: Confidence };
  volume_ro: { value: number | null; confidence: Confidence };
  satuan_ro: { value: string | null; confidence: Confidence };
}

// ────────────────────────────────────────────────────────────────────────
// Constants — Master mapping per RKKS 2025 §12.2
// ────────────────────────────────────────────────────────────────────────

const KRO_NAMES: Record<string, string> = {
  EBA: 'Layanan Dukungan Manajemen Internal',
  CAB: 'Sarana Bidang Kesehatan',
  CCB: 'OM Sarana Bidang Kesehatan',
};

const KEGIATAN_DEFAULT = {
  code: '6507',
  name: 'Penyelenggaraan Kesehatan Matra Darat',
};

const KOMPONEN_3_NAME = 'Dukungan Operasional Pertahanan dan Keamanan';
const KOMPONEN_52_MODAL_PERALATAN = 'Belanja Modal Peralatan dan Mesin';
const KOMPONEN_52_MODAL_LAINNYA = 'Belanja Modal Lainnya';

// ────────────────────────────────────────────────────────────────────────
// Main recommender function
// ────────────────────────────────────────────────────────────────────────

/**
 * Compute metadata recommendation untuk satu PaguRow.
 *
 * Pure function. Tidak modify input. Override via row.metadata_review
 * di-apply terakhir (forces all confidence ke 'high').
 */
export function recommendMetadata(row: PaguRow): MetadataRecommendation {
  const rec = computeFromRules(row);

  // Apply manual review override if present (per Owner direction)
  if (row.metadata_review?.override_to === 'high') {
    return applyHighOverride(rec);
  }

  return rec;
}

/**
 * Internal: apply mapping rules berdasarkan kode_bas + description.
 * Tidak handle override — itu dilakukan caller.
 */
function computeFromRules(row: PaguRow): MetadataRecommendation {
  const kb = (row.kode_bas ?? '').trim();
  const kodeUpper = (row.kode ?? '').toUpperCase();
  const descUpper = (row.description ?? '').toUpperCase();
  const sumberDana = row.sumberDana ?? '';

  // Start with defaults — kegiatan always HIGH (deterministic for RS Batin Tikal)
  const rec: MetadataRecommendation = {
    kro: { code: null, name: null, confidence: 'low' },
    kegiatan: { code: KEGIATAN_DEFAULT.code, name: KEGIATAN_DEFAULT.name, confidence: 'high' },
    ro: { code: null, confidence: 'low' },
    komponen: { code: null, name: null, confidence: 'low' },
    sumber_dana: { kode: null, confidence: 'low' },
    volume_ro: { value: null, confidence: 'low' },
    satuan_ro: { value: null, confidence: 'low' },
  };

  // ──────────────────────────────────────────────────────
  // KRO + RO + Komponen by kode_bas family
  // (per RKKS 2025 §12.2 + corrected Decision B 11 Mei 2026)
  // ──────────────────────────────────────────────────────

  if (kb.startsWith('521') || kb === '522112' || kb === '522113' || kb === '524111') {
    // Belanja Operasional → KRO EBA, RO 962, Komponen 3 (all HIGH)
    rec.kro = { code: 'EBA', name: KRO_NAMES.EBA, confidence: 'high' };
    rec.ro = { code: '962', confidence: 'high' };
    rec.komponen = { code: '3', name: KOMPONEN_3_NAME, confidence: 'high' };

  } else if (kb === '523111') {
    // Pemeliharaan Gedung → KRO CCB, RO 4, Komponen 3 (all HIGH per §12.2)
    rec.kro = { code: 'CCB', name: KRO_NAMES.CCB, confidence: 'high' };
    rec.ro = { code: '4', confidence: 'high' };
    rec.komponen = { code: '3', name: KOMPONEN_3_NAME, confidence: 'high' };

  } else if (kb === '523122') {
    // BMP (pemeliharaan kendaraan) — CCB by analogy, RO ambigu, Komp 3 high (prefix-based)
    rec.kro = { code: 'CCB', name: KRO_NAMES.CCB, confidence: 'medium' };
    rec.ro = { code: null, confidence: 'low' };
    rec.komponen = { code: '3', name: KOMPONEN_3_NAME, confidence: 'high' };

  } else if (kb === '532111') {
    // Belanja Modal Pengadaan — disambiguate by .A/.B/.C subkode (Konteks 4 Angga)
    rec.kro = { code: 'CAB', name: KRO_NAMES.CAB, confidence: 'high' };
    rec.komponen = { code: '52', name: KOMPONEN_52_MODAL_PERALATAN, confidence: 'high' };

    if (kodeUpper.includes('.A')) {
      // Alsintor → RO 5 (Pengadaan Alsintor Kesehatan)
      rec.ro = { code: '5', confidence: 'high' };
    } else if (kodeUpper.includes('.B')) {
      // Alkes → RO 1 (Pengadaan Alat Kesehatan)
      rec.ro = { code: '1', confidence: 'high' };
    } else if (kodeUpper.endsWith('.C')) {
      // Alsatri — belum di §12.2 (rencana TA 2026)
      rec.ro = { code: null, confidence: 'low' };
      rec.kro = { code: 'CAB', name: KRO_NAMES.CAB, confidence: 'medium' };
    } else {
      // 532111 tanpa subkode — ambigu
      rec.ro = { code: null, confidence: 'low' };
    }

  } else if (kb === '536111') {
    // Belanja Modal Lainnya (mis. XDR, software, lisensi) — CAB by analogy
    rec.kro = { code: 'CAB', name: KRO_NAMES.CAB, confidence: 'medium' };
    rec.ro = { code: null, confidence: 'low' };
    rec.komponen = { code: '52', name: KOMPONEN_52_MODAL_LAINNYA, confidence: 'high' };
  }
  // else: leave defaults (all null/low) for unknown BAS codes — UI prompt manual

  // ──────────────────────────────────────────────────────
  // Sumber dana inference
  // ──────────────────────────────────────────────────────

  if (descUpper.includes('BPJS') || descUpper.includes('YANMASUM')) {
    rec.sumber_dana = { kode: 'PNBP', confidence: 'high' };
  } else if (sumberDana === 'PNBP') {
    rec.sumber_dana = { kode: 'PNBP', confidence: 'high' };
  } else if (sumberDana === 'RM') {
    rec.sumber_dana = { kode: 'RM', confidence: 'high' };
  }
  // else: leave default { kode: null, confidence: 'low' }

  // volume_ro / satuan_ro: tetap default LOW — butuh DIPA Petikan eksternal

  return rec;
}

/**
 * Internal: force all confidence ke 'high' (manual review override).
 * Used when row.metadata_review.override_to === 'high'.
 *
 * Important: hanya CONFIDENCE yang dipaksa, code/name TIDAK diubah.
 * Kalau computed code/name = null (mis. RO untuk Alsatri), tetap null
 * tapi confidence jadi 'high' karena user sudah review dan accept the gap
 * (mungkin akan input manual later via UI).
 */
function applyHighOverride(rec: MetadataRecommendation): MetadataRecommendation {
  return {
    kro: { ...rec.kro, confidence: 'high' },
    kegiatan: { ...rec.kegiatan, confidence: 'high' },
    ro: { ...rec.ro, confidence: 'high' },
    komponen: { ...rec.komponen, confidence: 'high' },
    sumber_dana: { ...rec.sumber_dana, confidence: 'high' },
    volume_ro: { ...rec.volume_ro, confidence: 'high' },
    satuan_ro: { ...rec.satuan_ro, confidence: 'high' },
  };
}

// ────────────────────────────────────────────────────────────────────────
// Aggregate helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Helper: hitung aggregate confidence dari recommendation.
 * Returns 'high' jika semua critical fields (kro, ro, komponen, sumber_dana) = high,
 *         'medium' jika ada yang medium tapi tidak ada low,
 *         'low' jika ada minimal 1 yang low.
 *
 * volume_ro/satuan_ro/kegiatan TIDAK include di critical karena:
 *   - kegiatan selalu deterministic high
 *   - volume_ro/satuan_ro selalu LOW default (butuh data eksternal)
 */
export function aggregateConfidence(rec: MetadataRecommendation): Confidence {
  const critical = [rec.kro, rec.ro, rec.komponen, rec.sumber_dana];
  if (critical.some(f => f.confidence === 'low')) return 'low';
  if (critical.some(f => f.confidence === 'medium')) return 'medium';
  return 'high';
}
