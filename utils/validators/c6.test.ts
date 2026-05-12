/**
 * Tests untuk C6 Validator — Tidak Ubah Jenis Belanja (51/52/53/57)
 *
 * File: utils/validators/c6.test.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 1)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4b.json c6[] → assert per-scenario
 *   2. Edge cases: empty sections, no changes, missing kode_bas (pending),
 *      single changed row, jenis belanja variations (51/52/53/57), kode_bas
 *      with subspace, trim, multi-section aggregation, Konteks 1 fallback,
 *      R3 override behavior, distinct count variations, result structure
 *
 * Pattern mirrors c2.test.ts (Tier 4a Turn 3) — same grouping algorithm
 * shape, substitute kro_code → 2-digit kode_bas (jenis belanja).
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4b.json';
import { validateC6 } from './c6';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  hargaSatuanAwal: number,
  hargaSatuanRevisi: number,
  kodeBas?: string,
  volume = 1,
  level = 0
): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: kodeBas,
    description: `TEST ROW ${id}`,
    volume,
    satuan: 'TAHUN',
    hargaSatuanAwal,
    hargaSatuanRevisi,
    jumlahBiayaAwal: volume * hargaSatuanAwal,
    jumlahBiayaRevisi: volume * hargaSatuanRevisi,
    sumberDana: 'RM',
    level,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C6 — Tidak Ubah Jenis Belanja (51/52/53/57)', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c6.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c6.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC6(ctx);

        expect(result.constraintId).toBe('C6');
        expect(result.status).toBe(scenario.expected.status);

        // Fixture variant assertions — loose-match dengan field optional
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
      const result = validateC6({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('vacuous');
    });

    it('passes when no rows changed (Semula = Revisi)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 100, '521115'),
            leafRow('r2', 200, 200, '521119'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('passes when single row changed with kode_bas', () => {
      const result = validateC6({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, '521115')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — pending status (S5 strict per R2) ────────────────────

  describe('edge cases — pending status (S5 strict)', () => {
    it('returns pending when 1 changed row missing kode_bas', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, undefined)]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1']);
      expect(result.summary).toContain('missing kode_bas');
    });

    it('returns pending when changed row has kode_bas too short (< 2 chars)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '5')]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1']);
    });

    it('returns pending when changed row has kode_bas empty string', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '')]),
        ],
      });
      expect(result.status).toBe('pending');
    });

    it('pending lists all rows missing kode_bas (not just first)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, undefined),
            leafRow('r2', 100, 200, '521115'),
            leafRow('r3', 100, 250, undefined),
          ]),
        ],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1', 'r3']);
      expect(result.violations[0]?.detail).toMatchObject({ count: 2 });
    });
  });

  // ─── Edge cases — pass single jenis belanja (51/52/53/57) ──────────────

  describe('edge cases — pass single jenis belanja', () => {
    it('passes when all changed rows jenis 51 (Belanja Pegawai)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '511111'),
            leafRow('r2', 200, 250, '511121'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('51');
    });

    it('passes when all changed rows jenis 52 (Belanja Barang)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '521115'),
            leafRow('r2', 200, 250, '521119'),
            leafRow('r3', 300, 350, '522111'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('52');
    });

    it('passes when all changed rows jenis 53 (Belanja Modal)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 1000000, 1500000, '532111'),
            leafRow('r2', 2000000, 2500000, '533121'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('53');
    });

    it('passes when all changed rows jenis 57 (Belanja Bantuan Sosial)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 1000000, 1500000, '571111')]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('57');
    });
  });

  // ─── Edge cases — fail multi-jenis combinations ────────────────────────

  describe('edge cases — fail multi-jenis combinations', () => {
    it('fails when 2 jenis belanja terdeteksi (52 + 53)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, '521115'),    // jenis 52
            leafRow('r2', 100, 120, '532111'),   // jenis 53
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.detail).toMatchObject({
        distinctJenis: ['52', '53'],
        count: 2,
      });
    });

    it('fails when 3 jenis belanja terdeteksi (51 + 52 + 53)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 50, '511111'),    // jenis 51
            leafRow('r2', 100, 80, '521115'),    // jenis 52
            leafRow('r3', 100, 170, '532111'),   // jenis 53
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0]?.detail).toMatchObject({ count: 3 });
    });

    it('fail message mentions Pasal 22 huruf b angka 1 + DIPA Halaman III pathway', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, '521115'),
            leafRow('r2', 100, 120, '532111'),
          ]),
        ],
      });
      expect(result.violations[0]?.message).toContain('Pasal 22 huruf b angka 1');
      expect(result.violations[0]?.message.toLowerCase()).toContain('dipa halaman iii');
    });

    it('fail includes affected row IDs untuk traceability', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 80, '521115'),
            leafRow('r2', 100, 120, '532111'),
          ]),
        ],
      });
      expect(result.violations[0]?.affectedRowIds).toEqual(['r1', 'r2']);
    });
  });

  // ─── Edge cases — kode_bas variations ──────────────────────────────────

  describe('edge cases — kode_bas variations', () => {
    it('handles kode_bas with sub-akun suffix correctly (521115.04 → jenis 52)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 150, '521115.04'),
            leafRow('r2', 100, 200, '521119.01'),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('52');
    });

    it('handles kode_bas with leading whitespace (trim)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '  521115')]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('handles kode_bas exactly 2 chars ("52" only) as valid', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '52')]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — multi-section aggregation ────────────────────────────

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates changed rows across multiple sections (pass case)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150, '521115')]),
          makeSection('s2', [leafRow('r2', 100, 80, '521119')]),
          makeSection('s3', [leafRow('r3', 100, 120, '522111')]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('detects cross-section cross-jenis violation (fail case)', () => {
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 80, '521115')]),    // jenis 52
          makeSection('s2', [leafRow('r2', 100, 120, '532111')]),   // jenis 53
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0]?.detail).toMatchObject({
        distinctJenis: ['52', '53'],
      });
    });
  });

  // ─── Edge cases — Konteks 1 fallback (hsr=0 fallback ke hsa) ───────────

  describe('edge cases — Konteks 1 fallback (per R1)', () => {
    it('treats row with hargaSatuanRevisi=0 as unchanged (Konteks 1 fallback)', () => {
      // Per Konteks 1 (Angga): hsr=0 means "belum direvisi", fallback ke hsa
      // → effectiveAwal == effectiveRevisi == 100 → NOT changed
      const result = validateC6({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0, '521115'), // hsr=0, treat as unchanged
            leafRow('r2', 100, 150, '532111'),
          ]),
        ],
      });
      // Only r2 is changed → 1 jenis → pass
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('53');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape', () => {
      const result = validateC6({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150, '521115')])],
      });
      expect(result).toHaveProperty('constraintId', 'C6');
      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4b');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-11T13:00:00Z');
      const result = validateC6({
        ta: 2025,
        sections: [],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });
});
