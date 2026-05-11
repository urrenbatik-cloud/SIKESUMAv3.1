/**
 * Tests untuk C2 Validator — Pergeseran dalam 1 KRO yang Sama
 *
 * File: utils/validators/c2.test.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 3)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4a.json c2[] → assert per-scenario
 *   2. Edge cases: empty sections, no changes, missing kro_code (pending),
 *      single changed row, multi-section aggregation, Konteks 1 fallback,
 *      R3 override behavior, distinct count variations, result structure
 *
 * Pattern mirrors c3.test.ts (Turn 2) — same grouping algorithm shape,
 * substitute kegiatan_code → kro_code.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4a.json';
import { validateC2 } from './c2';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  hargaSatuanAwal: number,
  hargaSatuanRevisi: number,
  kroCode?: string,
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
    kro_code: kroCode,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C2 — Pergeseran dalam 1 KRO yang Sama', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c2.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c2.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC2(ctx);

        expect(result.constraintId).toBe('C2');
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
      const result = validateC2({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('vacuous');
    });

    it('passes when no rows changed (Semula = Revisi)', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, 'EBA'),
            leafRow('r2', 200, 200, 'EBA'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('passes when single row changed with kro_code', () => {
      const result = validateC2({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, 'EBA')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — pending status (R2 strict)', () => {
    it('returns pending when 1 changed row missing kro_code', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, undefined)]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'missing_kro_code',
        count: 1,
      });
    });

    it('returns pending when 1 of 2 changed rows missing kro_code (strict R2)', () => {
      // 1 row has kro_code, 1 doesn't → pending (NOT pass, NOT silent-evaluate)
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'EBA'),
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
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, undefined),
            leafRow('r2', 200, 250, undefined),
            leafRow('r3', 300, 350, 'EBA'),
          ]),
        ],
      });
      expect(result.status).toBe('pending');
      expect((result.violations[0].detail!.rowIds as string[]).sort()).toEqual(['r1', 'r2']);
    });

    it('ignores unchanged rows missing kro_code (not affecting pending)', () => {
      // r1 unchanged but missing kro_code → not in changedRows pool, irrelevant
      // r2 changed with kro_code → pass
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, undefined), // unchanged, missing — ignored
            leafRow('r2', 200, 250, 'EBA'),    // changed, has code
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('treats empty string kro_code as missing (pending)', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '')]),
        ],
      });
      expect(result.status).toBe('pending');
    });
  });

  describe('edge cases — R3 override behavior (override does not fill data)', () => {
    it('still pending when override_to=high but kro_code null', () => {
      // Per R3: override hanya forces confidence, TIDAK fill data.
      // Row dengan override + kro_code null → tetap pending (validator
      // baca raw kro_code, override flag tidak interfere).
      const row: PaguRow = {
        id: 'r1',
        kode: 'r1',
        kode_bas: '521115',
        description: 'TEST',
        volume: 1,
        satuan: 'TAHUN',
        hargaSatuanAwal: 100,
        hargaSatuanRevisi: 200,
        jumlahBiayaAwal: 100,
        jumlahBiayaRevisi: 200,
        sumberDana: 'RM',
        level: 0,
        kro_code: undefined, // null after override
        metadata_review: {
          reviewed_at: '2026-05-11T08:00:00Z',
          override_to: 'high',
          note: 'Manual reviewed but kro_code still pending',
        },
      };
      const result = validateC2({
        ta: 2025,
        sections: [makeSection('s1', [row])],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'missing_kro_code',
      });
    });

    it('passes when override_to=high AND kro_code filled', () => {
      // Override valid: user manually verified KRO untuk row tsb
      const row: PaguRow = {
        id: 'r1',
        kode: 'r1',
        kode_bas: '521115',
        description: 'TEST',
        volume: 1,
        satuan: 'TAHUN',
        hargaSatuanAwal: 100,
        hargaSatuanRevisi: 200,
        jumlahBiayaAwal: 100,
        jumlahBiayaRevisi: 200,
        sumberDana: 'RM',
        level: 0,
        kro_code: 'EBA',
        metadata_review: {
          reviewed_at: '2026-05-11T08:00:00Z',
          override_to: 'high',
        },
      };
      const result = validateC2({
        ta: 2025,
        sections: [makeSection('s1', [row])],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — fail status (distinct kro_codes)', () => {
    it('fails with 2 distinct kro_codes (EBA vs CAB)', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'EBA'),
            leafRow('r2', 200, 250, 'CAB'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect((result.violations[0].detail!.distinctKroCodes as string[]).sort()).toEqual(['CAB', 'EBA']);
    });

    it('fails with 3 distinct kro_codes (EBA, CAB, CCB)', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'EBA'),
            leafRow('r2', 200, 250, 'CAB'),
            leafRow('r3', 300, 350, 'CCB'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail!.count).toBe(3);
      expect(result.violations[0].detail!.affectedRowCount).toBe(3);
    });
  });

  describe('edge cases — Konteks 1 fallback (R1 effective values)', () => {
    it('treats hargaSatuanRevisi=0 as not changed (per R1)', () => {
      // r1: hsr=0, fallback ke hsa=100 → effective values equal → NOT changed
      // r2: hsr=200, effectiveAwal=100, effectiveRevisi=200 → changed
      // Only r2 dalam pool. 1 distinct kro_code → pass
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, 'EBA'),    // not changed (Konteks 1)
            leafRow('r2', 100, 200, 'EBA'), // changed
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('does not pending on Konteks 1 row missing kro_code (not "changed")', () => {
      // r1: hsr=0, fallback ke hsa=100 → NOT changed, AND missing kro_code.
      //     r1 di-ignore — bukan masuk changedRows pool, jadi missing kro_code
      //     tidak trigger pending.
      // r2: changed dengan kro_code → pass
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, undefined),  // not changed AND missing — irrelevant
            leafRow('r2', 100, 200, 'EBA'),   // changed, has code
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('does not fail on Konteks 1 row that would have different kro_code', () => {
      // r1: hsr=0 (not changed) tagged CAB → ignored
      // r2: changed tagged EBA → only changed row
      // Result: 1 distinct kro_code (EBA only) → pass, CAB tidak counted
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, 'CAB'),   // not changed (Konteks 1), CAB ignored
            leafRow('r2', 100, 200, 'EBA'), // changed, EBA
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates changed rows across multiple sections (fail case)', () => {
      // Section 1: r1 changed EBA
      // Section 2: r2 changed CAB
      // Aggregate: 2 distinct → fail
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200, 'EBA')]),
          makeSection('s2', [leafRow('r2', 100, 200, 'CAB')]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail!.count).toBe(2);
    });

    it('aggregates across sections, all same KRO → pass', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200, 'EBA')]),
          makeSection('s2', [leafRow('r2', 100, 200, 'EBA')]),
          makeSection('s3', [leafRow('r3', 100, 200, 'EBA')]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('pending dominates over fail across sections (R2 strict precedence)', () => {
      // Section 1: r1 changed EBA, r2 changed CAB → would be fail if alone
      // Section 2: r3 changed without kro_code → triggers pending
      // R2 strict: ANY missing → pending (pending checked BEFORE distinct check)
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 200, 'EBA'),
            leafRow('r2', 100, 200, 'CAB'),
          ]),
          makeSection('s2', [leafRow('r3', 100, 200, undefined)]),
        ],
      });
      expect(result.status).toBe('pending');
    });
  });

  describe('result structure', () => {
    it('returns spec from CONSTRAINT_SPECS catalogue', () => {
      const result = validateC2({ ta: 2025, sections: [] });
      expect(result.spec.id).toBe('C2');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4a');
    });

    it('includes evaluatedAt timestamp from ctx', () => {
      const fixed = new Date('2026-05-11T08:00:00Z');
      const result = validateC2({ ta: 2025, sections: [], evaluatedAt: fixed });
      expect(result.evaluatedAt).toBe(fixed.toISOString());
    });

    it('violation message references Pasal 22 huruf a', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 200, 'EBA'),
            leafRow('r2', 100, 200, 'CAB'),
          ]),
        ],
      });
      expect(result.violations[0].message).toContain('Pasal 22 huruf a');
    });

    it('pending message guides user to Tier 3 actions', () => {
      const result = validateC2({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 200, undefined)])],
      });
      expect(result.violations[0].message).toMatch(/Terima Rekomendasi|Manual Reviewed/);
    });

    it('summary describes status concisely', () => {
      const result = validateC2({ ta: 2025, sections: [] });
      expect(result.summary).toBeTruthy();
    });

    it('fail detail includes distinctKroCodes array', () => {
      const result = validateC2({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 200, 'EBA'),
            leafRow('r2', 100, 200, 'CAB'),
          ]),
        ],
      });
      expect(Array.isArray(result.violations[0].detail!.distinctKroCodes)).toBe(true);
    });
  });
});
