/**
 * Tests untuk C3 Validator — Pergeseran dalam 1 Kegiatan yang Sama
 *
 * File: utils/validators/c3.test.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 2)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4a.json c3[] → assert per-scenario
 *   2. Edge cases: empty sections, no changes, missing kegiatan_code (pending),
 *      single changed row, multi-section aggregation, override behavior (R3)
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4a.json';
import { validateC3 } from './c3';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  hargaSatuanAwal: number,
  hargaSatuanRevisi: number,
  kegiatanCode?: string,
  volume = 1,
  level = 0
): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: '521115',
    description: `TEST ROW ${id}`,
    volume,
    satuan: 'TAHUN',
    hargaSatuanAwal,
    hargaSatuanRevisi,
    jumlahBiayaAwal: volume * hargaSatuanAwal,
    jumlahBiayaRevisi: volume * hargaSatuanRevisi,
    sumberDana: 'RM',
    level,
    kegiatan_code: kegiatanCode,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C3 — Pergeseran dalam 1 Kegiatan yang Sama', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c3.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c3.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC3(ctx);

        expect(result.constraintId).toBe('C3');
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

  describe('edge cases — empty / no changes (vacuous pass)', () => {
    it('passes with empty sections', () => {
      const result = validateC3({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('vacuous');
    });

    it('passes when no rows changed (Semula = Revisi)', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, '6507'),
            leafRow('r2', 200, 200, '6507'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('passes when single row changed with kegiatan_code', () => {
      const result = validateC3({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, '6507')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — pending status (R2 strict)', () => {
    it('returns pending when 1 changed row missing kegiatan_code', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, undefined)]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'missing_kegiatan_code',
        count: 1,
      });
    });

    it('returns pending when 1 of 2 changed rows missing kegiatan_code (strict R2)', () => {
      // 1 row has kegiatan_code, 1 doesn't → pending (NOT pass)
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '6507'),
            leafRow('r2', 200, 250, undefined),
          ]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail).toMatchObject({
        count: 1,
        rowIds: ['r2'],
      });
    });

    it('returns pending with all affected row IDs listed', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, undefined),
            leafRow('r2', 200, 250, undefined),
            leafRow('r3', 300, 350, '6507'),
          ]),
        ],
      });
      expect(result.status).toBe('pending');
      expect((result.violations[0].detail!.rowIds as string[]).sort()).toEqual(['r1', 'r2']);
    });

    it('ignores unchanged rows missing kegiatan_code (not affecting pending)', () => {
      // r1 is unchanged but missing kegiatan_code → ignored (not in changedRows pool)
      // r2 changed with kegiatan_code → pass
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, undefined), // unchanged, missing — irrelevant
            leafRow('r2', 200, 250, '6507'),    // changed, has code
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — fail status (distinct kegiatan_codes)', () => {
    it('fails with 2 distinct kegiatan_codes', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '6507'),
            leafRow('r2', 200, 250, '6508'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect((result.violations[0].detail!.distinctKegiatanCodes as string[]).sort()).toEqual(['6507', '6508']);
    });

    it('fails with 3 distinct kegiatan_codes', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '6507'),
            leafRow('r2', 200, 250, '6508'),
            leafRow('r3', 300, 350, '6509'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail!.count).toBe(3);
    });
  });

  describe('edge cases — Konteks 1 fallback (R1 effective values)', () => {
    it('treats hargaSatuanRevisi=0 as not changed (per R1)', () => {
      // r1: hsr=0, fallback to hsa=100. effectiveRevisi=100=effectiveAwal → NOT changed
      // r2: hsr=200, effectiveRevisi=200, effectiveAwal=100 → changed
      // Only r2 changed. Just 1 distinct kegiatan_code → pass
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, '6507'),    // not changed (Konteks 1)
            leafRow('r2', 100, 200, '6507'), // changed
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('does not pending on Konteks 1 row missing kegiatan_code (it is not "changed")', () => {
      // r1: hsr=0, fallback to hsa=100 → NOT changed, AND missing kegiatan_code
      // r2: changed with kegiatan_code
      // r1 ignored (not in changedRows). r2 changed with code → pass
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, undefined),  // not changed (Konteks 1), missing code — both irrelevant
            leafRow('r2', 100, 200, '6507'),  // changed, has code
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates changed rows across multiple sections', () => {
      // Section 1: r1 changed with 6507
      // Section 2: r2 changed with 6508
      // Aggregate: 2 distinct → fail
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200, '6507')]),
          makeSection('s2', [leafRow('r2', 100, 200, '6508')]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail!.count).toBe(2);
    });

    it('aggregates across sections, all same kegiatan → pass', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200, '6507')]),
          makeSection('s2', [leafRow('r2', 100, 200, '6507')]),
          makeSection('s3', [leafRow('r3', 100, 200, '6507')]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('result structure', () => {
    it('returns spec from CONSTRAINT_SPECS catalogue', () => {
      const result = validateC3({ ta: 2025, sections: [] });
      expect(result.spec.id).toBe('C3');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4a');
    });

    it('includes evaluatedAt timestamp from ctx', () => {
      const fixed = new Date('2026-05-11T08:00:00Z');
      const result = validateC3({ ta: 2025, sections: [], evaluatedAt: fixed });
      expect(result.evaluatedAt).toBe(fixed.toISOString());
    });

    it('violation message references Pasal 22 huruf a angka 1', () => {
      const result = validateC3({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 200, '6507'),
            leafRow('r2', 100, 200, '6508'),
          ]),
        ],
      });
      expect(result.violations[0].message).toContain('Pasal 22 huruf a angka 1');
    });

    it('pending message guides user to Tier 3 actions', () => {
      const result = validateC3({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 200, undefined)])],
      });
      expect(result.violations[0].message).toMatch(/Terima Rekomendasi|Manual Reviewed/);
    });

    it('summary describes status concisely', () => {
      const result = validateC3({ ta: 2025, sections: [] });
      expect(result.summary).toBeTruthy();
    });
  });
});
