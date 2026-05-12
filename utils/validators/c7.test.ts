/**
 * Tests untuk C7 Validator — Tidak Ubah Sumber Dana
 *
 * File: utils/validators/c7.test.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 2)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4b.json c7[] → assert per-scenario
 *   2. Edge cases: empty sections, no changes, missing sumber_dana_kode
 *      (pending), single changed row, sumber variations (RM/PNBP/PHLN/PLN/
 *      PDN/SBSN/HIBAH), escape hatch strings, multi-section aggregation,
 *      Konteks 1 fallback, R3 override behavior, distinct count variations,
 *      result structure
 *
 * Pattern mirrors c6.test.ts (Turn 1) — same grouping algorithm shape,
 * substitute kode_bas derive → sumber_dana_kode direct field.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4b.json';
import { validateC7 } from './c7';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  hargaSatuanAwal: number,
  hargaSatuanRevisi: number,
  sumberDanaKode?: string,
  volume = 1,
  level = 0
): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: '521115', // dummy, not used by C7
    description: `TEST ROW ${id}`,
    volume,
    satuan: 'TAHUN',
    hargaSatuanAwal,
    hargaSatuanRevisi,
    jumlahBiayaAwal: volume * hargaSatuanAwal,
    jumlahBiayaRevisi: volume * hargaSatuanRevisi,
    sumberDana: 'RM', // legacy field, not used by C7
    level,
    sumber_dana_kode: sumberDanaKode,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C7 — Tidak Ubah Sumber Dana', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c7.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c7.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC7(ctx);

        expect(result.constraintId).toBe('C7');
        expect(result.status).toBe(scenario.expected.status);

        // Fixture variant assertions — loose-match
        const expected = scenario.expected as Record<string, unknown>;
        if (Array.isArray(expected.violations)) {
          expect(result.violations).toHaveLength(
            (expected.violations as unknown[]).length
          );
        }
        if (typeof expected.violationsCount === 'number') {
          expect(result.violations).toHaveLength(expected.violationsCount as number);
        }
        if (typeof expected.violationMessageContains === 'string') {
          expect(result.violations[0]?.message.toLowerCase()).toContain(
            (expected.violationMessageContains as string).toLowerCase()
          );
        }
        if (Array.isArray(expected.affectedRowIdsContains)) {
          const expectedIds = expected.affectedRowIdsContains as string[];
          const actualIds = result.violations[0]?.affectedRowIds ?? [];
          expectedIds.forEach(id => expect(actualIds).toContain(id));
        }
      });
    });
  });

  // ─── Edge cases — empty / no changes (vacuous pass) ────────────────────

  describe('edge cases — empty / no changes (vacuous pass)', () => {
    it('passes with empty sections', () => {
      const result = validateC7({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('vacuous');
    });

    it('passes when no rows changed (Semula = Revisi)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, 'RM'),
            leafRow('r2', 200, 200, 'PNBP'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('passes when single row changed with sumber_dana_kode', () => {
      const result = validateC7({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, 'RM')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — pending status (S5 strict per R2) ────────────────────

  describe('edge cases — pending status (S5 strict)', () => {
    it('returns pending when 1 changed row missing sumber_dana_kode', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, undefined)]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1']);
      expect(result.summary).toContain('missing sumber_dana_kode');
    });

    it('returns pending when changed row has sumber_dana_kode empty string', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '')]),
        ],
      });
      expect(result.status).toBe('pending');
    });

    it('returns pending when sumber_dana_kode is whitespace-only (trim defensive)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '   ')]),
        ],
      });
      expect(result.status).toBe('pending');
    });

    it('pending lists all rows missing sumber_dana_kode (not just first)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, undefined),
            leafRow('r2', 100, 200, 'RM'),
            leafRow('r3', 100, 250, undefined),
          ]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1', 'r3']);
      expect(result.violations[0]?.detail).toMatchObject({ count: 2 });
    });
  });

  // ─── Edge cases — pass single sumber dana (canonical 7 variants) ───────

  describe('edge cases — pass single sumber dana variants', () => {
    it('passes when all changed rows sumber RM (Rupiah Murni APBN)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'RM'),
            leafRow('r2', 200, 250, 'RM'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('RM');
    });

    it('passes when all changed rows sumber PNBP (BPJS/YANMASUM)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'PNBP'),
            leafRow('r2', 200, 250, 'PNBP'),
            leafRow('r3', 300, 350, 'PNBP'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('PNBP');
    });

    it('passes when all changed rows sumber PHLN (Pinjaman/Hibah Luar Negeri)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 1000000, 1500000, 'PHLN')]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('PHLN');
    });

    it('passes when all changed rows sumber SBSN (Surat Berharga Syariah)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 1000000, 1500000, 'SBSN')]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('SBSN');
    });

    it('passes when all changed rows sumber HIBAH', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 1000000, 1500000, 'HIBAH')]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('HIBAH');
    });
  });

  // ─── Edge cases — fail multi-sumber combinations ───────────────────────

  describe('edge cases — fail multi-sumber combinations', () => {
    it('fails when 2 sumber dana terdeteksi (RM + PNBP — common BPJS scenario)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, 'RM'),
            leafRow('r2', 100, 120, 'PNBP'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.detail).toMatchObject({
        distinctSumber: ['RM', 'PNBP'],
        count: 2,
      });
    });

    it('fails when 3 sumber dana terdeteksi (RM + PNBP + HIBAH)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 50, 'RM'),
            leafRow('r2', 100, 80, 'PNBP'),
            leafRow('r3', 100, 170, 'HIBAH'),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0]?.detail).toMatchObject({ count: 3 });
    });

    it('fail message mentions Pasal 22 huruf b angka 1 + DIPA Halaman III pathway', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, 'RM'),
            leafRow('r2', 100, 120, 'PNBP'),
          ]),
        ],
      });
      expect(result.violations[0]?.message).toContain('Pasal 22 huruf b angka 1');
      expect(result.violations[0]?.message.toLowerCase()).toContain('dipa halaman iii');
      expect(result.violations[0]?.message.toLowerCase()).toContain('sumber pendanaan');
    });

    it('fail includes affected row IDs untuk traceability', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, 'RM'),
            leafRow('r2', 100, 120, 'PNBP'),
          ]),
        ],
      });
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1', 'r2']);
    });
  });

  // ─── Edge cases — escape hatch + variations ────────────────────────────

  describe('edge cases — escape hatch (non-canonical) + whitespace', () => {
    it('handles escape hatch string (non-canonical sumber) as opaque value', () => {
      // Types.ts allows `string` escape hatch beyond 7 canonical codes
      // Validator must treat as opaque grouping value (deterministic)
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'CUSTOM_X'),
            leafRow('r2', 200, 250, 'CUSTOM_X'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('CUSTOM_X');
    });

    it('handles sumber_dana_kode with leading whitespace (trim defensive)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '  RM')]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('RM');
    });

    it('treats trimmed equivalent sumber as same group (RM vs " RM ")', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, 'RM'),
            leafRow('r2', 200, 250, '  RM  '),
          ]),
        ],
      });
      expect(result.status).toBe('pass'); // Both normalize to 'RM'
    });
  });

  // ─── Edge cases — multi-section aggregation ────────────────────────────

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates changed rows across multiple sections (pass case)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, 'RM')]),
          makeSection('s2', [leafRow('r2', 100, 80, 'RM')]),
          makeSection('s3', [leafRow('r3', 100, 120, 'RM')]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('detects cross-section cross-sumber violation (fail case)', () => {
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 80, 'RM')]),
          makeSection('s2', [leafRow('r2', 100, 120, 'PNBP')]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0]?.detail).toMatchObject({
        distinctSumber: ['RM', 'PNBP'],
      });
    });
  });

  // ─── Edge cases — Konteks 1 fallback (hsr=0 fallback ke hsa) ───────────

  describe('edge cases — Konteks 1 fallback (per R1)', () => {
    it('treats row with hargaSatuanRevisi=0 as unchanged (Konteks 1 fallback)', () => {
      // Per Konteks 1 (Angga): hsr=0 means "belum direvisi", fallback ke hsa
      const result = validateC7({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, 'RM'),     // hsr=0, treat as unchanged
            leafRow('r2', 100, 150, 'PNBP'),
          ]),
        ],
      });
      // Only r2 is changed → 1 sumber → pass
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('PNBP');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape', () => {
      const result = validateC7({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, 'RM')])],
      });
      expect(result).toHaveProperty('constraintId', 'C7');
      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4b');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-11T13:00:00Z');
      const result = validateC7({
        ta: 2025,
        sections: [],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });
});
