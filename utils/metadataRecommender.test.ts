/**
 * Tests untuk utils/metadataRecommender.ts — Tier 3 Phase 2b
 *
 * Strategy:
 *   1. Load fixture utils/fixtures/pagu-leaves-ta2025.json (38 leaves ground truth)
 *   2. Untuk setiap leaf, call recommendMetadata(row) → compare ke
 *      leaf.expected_recommendation per field
 *   3. Assert 100% match (sejak fixture + recommender pakai identical mapping rules)
 *   4. Plus dedicated tests untuk override mechanism + aggregate helper
 *
 * Run: `npm test` atau `npm run test:fixture`
 */
import { describe, it, expect } from 'vitest';
import fixture from './fixtures/pagu-leaves-ta2025.json';
import type { PaguRow } from '../types';
import {
  recommendMetadata,
  aggregateConfidence,
  type MetadataRecommendation,
} from './metadataRecommender';

// ────────────────────────────────────────────────────────────────────────
// Fixture validation: recommender output match expected_recommendation
// ────────────────────────────────────────────────────────────────────────

describe('metadataRecommender — fixture validation (38 leaves TA 2025)', () => {
  // Construct PaguRow shape from fixture leaf (fixture has extra fields)
  const leavesAsPaguRows = fixture.leaves.map((leaf) => ({
    id: leaf.row_id,
    kode: leaf.kode,
    kode_bas: leaf.kode_bas,
    description: leaf.description,
    volume: leaf.volume,
    satuan: leaf.satuan,
    hargaSatuanAwal: leaf.hargaSatuanAwal,
    hargaSatuanRevisi: leaf.hargaSatuanRevisi,
    jumlahBiayaAwal: leaf.effective_awal,
    jumlahBiayaRevisi: leaf.effective_revisi,
    sumberDana: leaf.sumberDana,
    level: leaf.level,
  })) as PaguRow[];

  it('fixture has expected leaf count (regression baseline)', () => {
    expect(fixture.total_leaves).toBe(38);
    expect(fixture.leaves.length).toBe(38);
  });

  it('fixture meets acceptance criteria (≥80% aggregate HIGH)', () => {
    expect(fixture.confidence_summary.acceptance_pass).toBe(true);
    expect(fixture.confidence_summary.aggregate_all_high_pct).toBeGreaterThanOrEqual(80);
  });

  // Generate per-row test cases
  fixture.leaves.forEach((leaf, idx) => {
    const row = leavesAsPaguRows[idx];
    const expected = leaf.expected_recommendation as MetadataRecommendation;
    const label = `[${idx + 1}/38] ${leaf.kode} ${leaf.description.slice(0, 35)}`;

    it(`${label} — kro matches`, () => {
      const actual = recommendMetadata(row);
      expect(actual.kro).toEqual(expected.kro);
    });

    it(`${label} — kegiatan matches`, () => {
      const actual = recommendMetadata(row);
      expect(actual.kegiatan).toEqual(expected.kegiatan);
    });

    it(`${label} — ro matches`, () => {
      const actual = recommendMetadata(row);
      expect(actual.ro).toEqual(expected.ro);
    });

    it(`${label} — komponen matches`, () => {
      const actual = recommendMetadata(row);
      expect(actual.komponen).toEqual(expected.komponen);
    });

    it(`${label} — sumber_dana matches`, () => {
      const actual = recommendMetadata(row);
      expect(actual.sumber_dana).toEqual(expected.sumber_dana);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// Override mechanism — manual review forces 'high'
// ────────────────────────────────────────────────────────────────────────

describe('metadataRecommender — manual review override', () => {
  const baseRow: PaguRow = {
    id: 'test-row-1',
    kode: '532111.C',
    kode_bas: '532111',
    description: 'BELANJA MODAL PERALATAN DAN MESIN (ALSATRI)',
    volume: 1,
    satuan: 'PAKET',
    hargaSatuanAwal: 0,
    hargaSatuanRevisi: 189945000,
    jumlahBiayaAwal: 0,
    jumlahBiayaRevisi: 189945000,
    sumberDana: 'RM',
    level: 0,
  };

  it('without override: 532111.C returns MEDIUM KRO + LOW RO', () => {
    const rec = recommendMetadata(baseRow);
    expect(rec.kro.confidence).toBe('medium');
    expect(rec.ro.confidence).toBe('low');
    expect(rec.komponen.confidence).toBe('high');  // prefix-based deterministic
    expect(rec.sumber_dana.confidence).toBe('high');
  });

  it('with override: all confidence forced to high', () => {
    const rowWithOverride: PaguRow = {
      ...baseRow,
      metadata_review: {
        reviewed_at: '2026-05-11T10:00:00Z',
        reviewed_by: 'Angga (Sie Renbang)',
        override_to: 'high',
        note: 'Alsatri rencana TA 2026 — verified vs RKKS internal',
      },
    };
    const rec = recommendMetadata(rowWithOverride);
    expect(rec.kro.confidence).toBe('high');
    expect(rec.ro.confidence).toBe('high');
    expect(rec.komponen.confidence).toBe('high');
    expect(rec.sumber_dana.confidence).toBe('high');
    expect(rec.kegiatan.confidence).toBe('high');
  });

  it('override preserves null codes (not fabricated)', () => {
    const rowWithOverride: PaguRow = {
      ...baseRow,
      metadata_review: {
        reviewed_at: '2026-05-11T10:00:00Z',
        override_to: 'high',
      },
    };
    const rec = recommendMetadata(rowWithOverride);
    // RO code untuk Alsatri tetap null (belum di §12.2), confidence saja yang forced
    expect(rec.ro.code).toBeNull();
    expect(rec.ro.confidence).toBe('high');  // overridden
  });
});

// ────────────────────────────────────────────────────────────────────────
// Aggregate confidence helper
// ────────────────────────────────────────────────────────────────────────

describe('aggregateConfidence helper', () => {
  it('returns high when all critical fields are high', () => {
    const rec: MetadataRecommendation = {
      kro: { code: 'EBA', name: 'X', confidence: 'high' },
      kegiatan: { code: '6507', name: 'X', confidence: 'high' },
      ro: { code: '962', confidence: 'high' },
      komponen: { code: '3', name: 'X', confidence: 'high' },
      sumber_dana: { kode: 'PNBP', confidence: 'high' },
      volume_ro: { value: null, confidence: 'low' },  // ignored
      satuan_ro: { value: null, confidence: 'low' },  // ignored
    };
    expect(aggregateConfidence(rec)).toBe('high');
  });

  it('returns medium when any critical is medium and no low', () => {
    const rec: MetadataRecommendation = {
      kro: { code: 'CCB', name: 'X', confidence: 'medium' },
      kegiatan: { code: '6507', name: 'X', confidence: 'high' },
      ro: { code: '4', confidence: 'high' },
      komponen: { code: '3', name: 'X', confidence: 'high' },
      sumber_dana: { kode: 'RM', confidence: 'high' },
      volume_ro: { value: null, confidence: 'low' },
      satuan_ro: { value: null, confidence: 'low' },
    };
    expect(aggregateConfidence(rec)).toBe('medium');
  });

  it('returns low when any critical is low', () => {
    const rec: MetadataRecommendation = {
      kro: { code: 'CAB', name: 'X', confidence: 'medium' },
      kegiatan: { code: '6507', name: 'X', confidence: 'high' },
      ro: { code: null, confidence: 'low' },  // ← critical low
      komponen: { code: '52', name: 'X', confidence: 'high' },
      sumber_dana: { kode: 'RM', confidence: 'high' },
      volume_ro: { value: null, confidence: 'low' },
      satuan_ro: { value: null, confidence: 'low' },
    };
    expect(aggregateConfidence(rec)).toBe('low');
  });
});

// ────────────────────────────────────────────────────────────────────────
// Edge cases
// ────────────────────────────────────────────────────────────────────────

describe('metadataRecommender — edge cases', () => {
  it('unknown kode_bas returns all-low default (manual fill required)', () => {
    const row: PaguRow = {
      id: 'edge-1',
      kode: '999999',
      kode_bas: '999999',
      description: 'Unknown account',
      volume: 1,
      satuan: 'UNIT',
      hargaSatuanAwal: 0,
      hargaSatuanRevisi: 1000000,
      jumlahBiayaAwal: 0,
      jumlahBiayaRevisi: 1000000,
      sumberDana: '',
      level: 0,
    };
    const rec = recommendMetadata(row);
    expect(rec.kro.confidence).toBe('low');
    expect(rec.ro.confidence).toBe('low');
    expect(rec.komponen.confidence).toBe('low');
    expect(rec.sumber_dana.confidence).toBe('low');
    // kegiatan tetap HIGH karena deterministic untuk RS Batin Tikal
    expect(rec.kegiatan.confidence).toBe('high');
  });

  it('empty description: sumber_dana fallback ke sumberDana field', () => {
    const row: PaguRow = {
      id: 'edge-2',
      kode: '521115.01',
      kode_bas: '521115',
      description: '',
      volume: 1,
      satuan: 'TAHUN',
      hargaSatuanAwal: 100000000,
      hargaSatuanRevisi: 100000000,
      jumlahBiayaAwal: 100000000,
      jumlahBiayaRevisi: 100000000,
      sumberDana: 'PNBP',
      level: 1,
    };
    const rec = recommendMetadata(row);
    expect(rec.sumber_dana.kode).toBe('PNBP');
    expect(rec.sumber_dana.confidence).toBe('high');
  });

  it('description with BPJS overrides sumberDana field', () => {
    const row: PaguRow = {
      id: 'edge-3',
      kode: '521811.01',
      kode_bas: '521811',
      description: 'Obat & BMHP BPJS',
      volume: 1,
      satuan: 'TAHUN',
      hargaSatuanAwal: 100000000,
      hargaSatuanRevisi: 100000000,
      jumlahBiayaAwal: 100000000,
      jumlahBiayaRevisi: 100000000,
      sumberDana: '',  // empty, but BPJS in description → PNBP
      level: 1,
    };
    const rec = recommendMetadata(row);
    expect(rec.sumber_dana.kode).toBe('PNBP');
    expect(rec.sumber_dana.confidence).toBe('high');
  });
});
