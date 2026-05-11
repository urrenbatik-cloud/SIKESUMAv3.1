/**
 * Tests untuk C5 Validator — Volume dan Satuan RO Tidak Berubah
 *
 * File: utils/validators/c5.test.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 4)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4a.json c5[] → assert per-scenario
 *   2. Edge cases: NA strict (all-missing), MIXED warn (partial fill),
 *      PASS (all consistent), FAIL (volume/satuan inconsistent),
 *      multi-RO scenarios, rows tanpa ro_code, result structure
 *
 * R4/R5 governance (§0.9.1):
 *   R4: group by ro_code, distinct count > 1 dalam grup → fail
 *   R5: ALL leaves missing both → na; MIXED (sebagian missing) → warn
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4a.json';
import { validateC5 } from './c5';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  opts: {
    roCode?: string;
    volumeRo?: number;
    satuanRo?: string;
    hsa?: number;
    hsr?: number;
    volume?: number;
  } = {}
): PaguRow {
  const hsa = opts.hsa ?? 100;
  const hsr = opts.hsr ?? hsa;
  const vol = opts.volume ?? 1;
  return {
    id,
    kode: id,
    kode_bas: '521115',
    description: `TEST ROW ${id}`,
    volume: vol,
    satuan: 'TAHUN',
    hargaSatuanAwal: hsa,
    hargaSatuanRevisi: hsr,
    jumlahBiayaAwal: vol * hsa,
    jumlahBiayaRevisi: vol * hsr,
    sumberDana: 'RM',
    level: 0,
    ro_code: opts.roCode,
    volume_ro: opts.volumeRo,
    satuan_ro: opts.satuanRo,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C5 — Volume dan Satuan RO Tidak Berubah', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c5.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c5.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC5(ctx);

        expect(result.constraintId).toBe('C5');
        expect(result.status).toBe(scenario.expected.status);
        expect(result.violations).toHaveLength(scenario.expected.violations.length);

        if (scenario.expected.violations.length > 0) {
          const expectedDetail = scenario.expected.violations[0].detail;
          if (expectedDetail) {
            expect(result.violations[0].detail).toMatchObject(expectedDetail);
          }
        }
      });
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases — empty / vacuous', () => {
    it('passes with empty sections', () => {
      const result = validateC5({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('vacuous');
    });

    it('passes with section that has only parent rows (no leaves)', () => {
      // Parent row at level=0 dengan child at level=1 → parent is NOT a leaf
      const parent: PaguRow = {
        id: 'p1',
        kode: '521',
        kode_bas: '521',
        description: 'PARENT',
        volume: 1,
        satuan: 'TAHUN',
        hargaSatuanAwal: 100,
        hargaSatuanRevisi: 100,
        jumlahBiayaAwal: 100,
        jumlahBiayaRevisi: 100,
        sumberDana: 'RM',
        level: 0,
      };
      const child: PaguRow = {
        id: 'c1',
        kode: '521.01',
        kode_bas: '521',
        description: 'CHILD',
        volume: 1,
        satuan: 'TAHUN',
        hargaSatuanAwal: 100,
        hargaSatuanRevisi: 100,
        jumlahBiayaAwal: 100,
        jumlahBiayaRevisi: 100,
        sumberDana: 'RM',
        level: 1,
        ro_code: '962',
        volume_ro: 1,
        satuan_ro: 'Layanan',
      };
      const result = validateC5({
        ta: 2025,
        sections: [makeSection('s1', [parent, child])],
      });
      // Parent skipped (not leaf), only child evaluated → pass (1 row, no inconsistency)
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — NA strict (R5: ALL missing volume_ro AND satuan_ro)', () => {
    it('returns na when all leaves missing both fields', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962' }),
            leafRow('r2', { roCode: '962' }),
            leafRow('r3', { roCode: '1' }),
          ]),
        ],
      });
      expect(result.status).toBe('na');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toMatch(/missing.*DIPA Petikan/i);
    });

    it('does NOT return na when any row has at least volume_ro', () => {
      // 1 row has volume_ro, rest missing both → mixed, not na
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962' }), // missing both
          ]),
        ],
      });
      expect(result.status).toBe('warn'); // mixed, not na
    });

    it('does NOT return na when any row has at least satuan_ro', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', satuanRo: 'Layanan' }), // partial fill
            leafRow('r2', { roCode: '962' }),
          ]),
        ],
      });
      expect(result.status).toBe('warn');
    });
  });

  describe('edge cases — MIXED warn (R5: partial fill, consistent so far)', () => {
    it('returns warn when some rows filled and rest missing', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r3', { roCode: '962' }), // missing
          ]),
        ],
      });
      expect(result.status).toBe('warn');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'mixed_partial_fill',
        missingCount: 1,
        totalLeaves: 3,
      });
      expect(result.violations[0].detail!.missingRowIds).toEqual(['r3']);
    });

    it('returns warn even when fill is partial per-field (volume_ro yes, satuan_ro no)', () => {
      // r1 has volume_ro but not satuan_ro → counted as missing-something
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1 }), // satuan_ro missing
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
          ]),
        ],
      });
      expect(result.status).toBe('warn');
      expect((result.violations[0].detail!.missingRowIds as string[]).sort()).toEqual(['r1']);
    });
  });

  describe('edge cases — PASS (all filled, all consistent)', () => {
    it('passes with single RO, all rows consistent', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r3', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('passes with multiple ROs, each internally consistent', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
          ]),
          makeSection('s2', [
            leafRow('r3', { roCode: '1', volumeRo: 5, satuanRo: 'Unit' }),
            leafRow('r4', { roCode: '1', volumeRo: 5, satuanRo: 'Unit' }),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('2 RO group');
    });
  });

  describe('edge cases — FAIL (inconsistency within RO)', () => {
    it('fails when volume_ro inconsistent within same RO', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 2, satuanRo: 'Layanan' }),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({
        roCode: '962',
        field: 'volume_ro',
        distinctValues: [1, 2],
      });
    });

    it('fails when satuan_ro inconsistent within same RO', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Unit' }),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({
        roCode: '962',
        field: 'satuan_ro',
      });
    });

    it('fails with 2 violations when both volume_ro AND satuan_ro inconsistent (same RO)', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 2, satuanRo: 'Unit' }),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2);
      const fields = result.violations.map(v => (v.detail as Record<string, unknown>).field).sort();
      expect(fields).toEqual(['satuan_ro', 'volume_ro']);
    });

    it('isolates inconsistency to specific RO (1 RO ok, 1 RO bad)', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
          ]),
          makeSection('s2', [
            leafRow('r3', { roCode: '1', volumeRo: 5, satuanRo: 'Unit' }),
            leafRow('r4', { roCode: '1', volumeRo: 7, satuanRo: 'Unit' }), // inconsistent
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({ roCode: '1', field: 'volume_ro' });
    });
  });

  describe('edge cases — rows without ro_code', () => {
    it('skips rows without ro_code from grouping (treats as not part of any RO check)', () => {
      // r1 has ro_code, r2 doesn't
      // r1 alone in RO group → trivially consistent
      // r2 has data but not grouped → no consistency check applied
      // All rows have full data → not mixed
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { volumeRo: 99, satuanRo: 'Strange' }), // no ro_code
          ]),
        ],
      });
      expect(result.status).toBe('pass'); // r1 alone consistent; r2 ungrouped, ignored
    });

    it('still applies NA check across all leaves including no-ro_code rows', () => {
      // Row without ro_code AND without volume_ro/satuan_ro → still in NA pool
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', {}), // no ro_code, no data
            leafRow('r2', {}), // no ro_code, no data
          ]),
        ],
      });
      expect(result.status).toBe('na');
    });
  });

  describe('edge cases — R3 override (does not fill data, C5 unaffected)', () => {
    it('treats override+null volume_ro as still missing (NA/MIXED logic unchanged)', () => {
      // Per R3: override hanya force confidence, TIDAK fill data
      const row: PaguRow = {
        id: 'r1',
        kode: 'r1',
        kode_bas: '521115',
        description: 'TEST',
        volume: 1,
        satuan: 'TAHUN',
        hargaSatuanAwal: 100,
        hargaSatuanRevisi: 100,
        jumlahBiayaAwal: 100,
        jumlahBiayaRevisi: 100,
        sumberDana: 'RM',
        level: 0,
        ro_code: '962',
        // volume_ro and satuan_ro UNDEFINED — override doesn't fill
        metadata_review: {
          reviewed_at: '2026-05-11T08:00:00Z',
          override_to: 'high',
        },
      };
      const result = validateC5({
        ta: 2025,
        sections: [makeSection('s1', [row])],
      });
      // Single row, missing both → na
      expect(result.status).toBe('na');
    });
  });

  describe('result structure', () => {
    it('returns spec from CONSTRAINT_SPECS catalogue', () => {
      const result = validateC5({ ta: 2025, sections: [] });
      expect(result.spec.id).toBe('C5');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4a');
    });

    it('includes evaluatedAt timestamp from ctx', () => {
      const fixed = new Date('2026-05-11T08:00:00Z');
      const result = validateC5({ ta: 2025, sections: [], evaluatedAt: fixed });
      expect(result.evaluatedAt).toBe(fixed.toISOString());
    });

    it('fail violation message references Pasal 22 huruf b angka 1', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962', volumeRo: 2, satuanRo: 'Layanan' }),
          ]),
        ],
      });
      expect(result.violations[0].message).toContain('Pasal 22 huruf b angka 1');
    });

    it('warn violation guides user to fill DIPA Petikan', () => {
      const result = validateC5({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', { roCode: '962', volumeRo: 1, satuanRo: 'Layanan' }),
            leafRow('r2', { roCode: '962' }),
          ]),
        ],
      });
      expect(result.violations[0].message).toMatch(/DIPA Petikan/i);
    });

    it('na summary indicates skip evaluation reason', () => {
      const result = validateC5({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', { roCode: '962' })])],
      });
      expect(result.status).toBe('na');
      expect(result.summary).toMatch(/missing|Tier 3|DIPA Petikan/);
    });
  });
});
