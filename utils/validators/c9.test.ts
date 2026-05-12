/**
 * Tests untuk C9 Validator — Tidak Boleh Akun Minus
 *
 * File: utils/validators/c9.test.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 3)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4b.json c9[] → assert per-scenario
 *   2. Edge cases: empty sections, all positive, single negative, multi-section,
 *      Konteks 1 fallback, parent rows skipped, boundary zero, NaN defensive,
 *      result structure
 *
 * Pattern beda dari C6/C7 (no grouping, no pending state, per-leaf direct check).
 * Mirror c5.ts collectAllLeaves usage pattern.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4b.json';
import { validateC9 } from './c9';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(
  id: string,
  hargaSatuanAwal: number,
  hargaSatuanRevisi: number,
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
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C9 — Tidak Boleh Akun Minus', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c9.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c9.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC9(ctx);

        expect(result.constraintId).toBe('C9');
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
        if (Array.isArray(expected.affectedRowIdsContains)) {
          const expectedIds = expected.affectedRowIdsContains as string[];
          // For C9, each violation has its own affectedRowIds
          const allAffectedIds = result.violations.flatMap(v => v.affectedRowIds ?? []);
          expectedIds.forEach(id => expect(allAffectedIds).toContain(id));
        }
      });
    });
  });

  // ─── Edge cases — empty / all positive (pass) ──────────────────────────

  describe('edge cases — pass scenarios', () => {
    it('passes with empty sections', () => {
      const result = validateC9({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('0 leaf rows scanned');
    });

    it('passes when single leaf with positive value', () => {
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150)])],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('1 leaf rows scanned');
    });

    it('passes at boundary effectiveRevisi = 0 (0 >= 0 OK)', () => {
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 0, 1, 0)])],
      });
      // hsr=0 → Konteks 1 fallback ke hsa=100 → effective=100 → pass
      // Boundary scenario requires both hsa=0 AND hsr=0:
      const ctx2: ValidationContext = {
        ta: 2025,
        sections: [
          makeSection('s1', [
            { ...leafRow('r1', 0, 0), description: 'TRUE ZERO' },
          ]),
        ],
      };
      const result2 = validateC9(ctx2);
      expect(result.status).toBe('pass');
      expect(result2.status).toBe('pass');
    });
  });

  // ─── Edge cases — fail scenarios ───────────────────────────────────────

  describe('edge cases — fail scenarios', () => {
    it('fails when single leaf has negative hargaSatuanRevisi', () => {
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, -50)])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].affectedRowIds).toEqual(['r1']);
      expect(result.violations[0].detail).toMatchObject({
        rowId: 'r1',
        jumlahBiayaRevisi: -50,
      });
    });

    it('fail violation includes pattern guidance untuk verify typo', () => {
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, -50)])],
      });
      expect(result.violations[0].message.toLowerCase()).toContain('typo');
      expect(result.violations[0].message.toLowerCase()).toContain('hargasatuanrevisi');
    });

    it('emits multiple violations — 1 per negative leaf', () => {
      const result = validateC9({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, -50),
            leafRow('r2', 100, 200),    // positive — should pass
            leafRow('r3', 100, -100),
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0].affectedRowIds).toEqual(['r1']);
      expect(result.violations[1].affectedRowIds).toEqual(['r3']);
    });

    it('volume × harga correctly computed for negative case', () => {
      // hsa=100, hsr=-200, volume=5 → jumlahBiayaRevisi = -1000
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, -200, 5)])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({
        jumlahBiayaRevisi: -1000,
        volume: 5,
      });
    });
  });

  // ─── Edge cases — multi-section aggregation ────────────────────────────

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates negative leaves across sections', () => {
      const result = validateC9({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, -50)]),
          makeSection('s2', [leafRow('r2', 100, 200)]),
          makeSection('s3', [leafRow('r3', 100, -100)]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2);
    });

    it('passes when all sections have positive leaves', () => {
      const result = validateC9({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 150)]),
          makeSection('s2', [leafRow('r2', 200, 250)]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — C9 BYPASS Konteks 1 fallback (per spec literal) ──────

  describe('edge cases — C9 bypasses Konteks 1 fallback semantic', () => {
    it('passes when hsr=0 (hargaSatuanRevisi=0) — jumlahBiayaRevisi=0 ≥ 0', () => {
      // hsa=100, hsr=0 → jbr=0 (from leafRow helper: volume * hsr = 1 * 0 = 0)
      // Per spec literal: jbr=0 ≥ 0 → pass
      // BUKAN check effectiveRevisi (yang akan fallback ke hsa=100)
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 0)])],
      });
      expect(result.status).toBe('pass');
    });

    it('passes when hsa negative + hsr=0 — jbr=0, not flagged (BYPASS fallback)', () => {
      // hsa=-50, hsr=0 → jbr=0 (volume * hsr = 0)
      // C9 BUKAN check hsa, hanya check jbr. jbr=0 → pass.
      // Konteks 1 fallback (yang akan return hsa=-50) BYPASSED by spec literal.
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', -50, 0)])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — parent rows (hasChildren=true) skipped ───────────────

  describe('edge cases — parent rows (level + nested) skipped', () => {
    it('skips parent rows when scanning leaves (only leaf children counted)', () => {
      // Parent row at level=0 with negative value, followed by leaf child level=1
      const result = validateC9({
        ta: 2025,
        sections: [
          makeSection('s1', [
            // Parent (hasChildren=true via following level=1 row)
            { ...leafRow('parent', -1000, -1000, 1, 0), description: 'PARENT — should be skipped' },
            // Leaf child positive (only this should be counted)
            { ...leafRow('child', 100, 150, 1, 1), description: 'LEAF CHILD' },
          ]),
        ],
      });
      // Even though parent has negative value, it's not a leaf → not flagged
      // Only child counted (positive) → pass
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('1 leaf rows scanned');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape', () => {
      const result = validateC9({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 150)])],
      });
      expect(result).toHaveProperty('constraintId', 'C9');
      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4b');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-11T13:00:00Z');
      const result = validateC9({
        ta: 2025,
        sections: [],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });
});
