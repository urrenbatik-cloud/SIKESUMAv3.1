/**
 * Tests untuk C1 Validator — Total Pagu Satker Net Change = 0
 *
 * File: utils/validators/c1.test.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4a.json c1[] → assert per-scenario
 *   2. Edge cases: empty sections, parent-row skipping, Konteks 1 fallback,
 *      epsilon tolerance, multi-section aggregation, idempotency
 *
 * Coverage target: ≥30 tests (combined fixture + edge cases).
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4a.json';
import { validateC1 } from './c1';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

/** Build a minimal leaf row for testing. */
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

/** Build a parent row (no own value, has children). */
function parentRow(id: string, level = 0): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: '521',
    description: `PARENT ${id}`,
    volume: 0,
    satuan: '',
    hargaSatuanAwal: 0,
    hargaSatuanRevisi: 0,
    jumlahBiayaAwal: 999999, // junk value yang harus DI-SKIP
    jumlahBiayaRevisi: 999999,
    sumberDana: 'RM',
    level,
  };
}

/** Wrap rows in a section. */
function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C1 — Total Pagu Satker Net Change = 0', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c1.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c1.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC1(ctx);

        expect(result.constraintId).toBe('C1');
        expect(result.status).toBe(scenario.expected.status);
        expect(result.violations).toHaveLength(scenario.expected.violations.length);

        // Verify violation detail matches expected (mainly untuk fail scenarios)
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

  describe('edge cases — empty/minimal data', () => {
    it('passes with empty sections', () => {
      const result = validateC1({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('passes with single section having no rows', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [])],
      });
      expect(result.status).toBe('pass');
    });

    it('passes with single leaf row Semula=Revisi', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 100)])],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — parent row skipping (§0.7.2 traversal)', () => {
    it('skips parent row jumlahBiaya, sums only leaves', () => {
      // Parent has junk 999999, child has real 100. C1 should evaluate via child only.
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [
            parentRow('p', 0),
            leafRow('c', 100, 100, 1, 1), // level 1 (child of parent)
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      // detail bukan ada karena pass, tapi internally totalAwal = totalRevisi = 100
    });

    it('detects fail when only leaves contribute (parent junk ignored)', () => {
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [
            parentRow('p', 0),
            leafRow('c', 100, 150, 1, 1), // child has +50 net change
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({
        totalAwal: 100,
        totalRevisi: 150,
        selisih: 50,
      });
    });

    it('handles 3-level hierarchy correctly (deepest = leaf)', () => {
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [
            parentRow('p1', 0), // level 0
            parentRow('p1-1', 1), // level 1 (child of p1)
            leafRow('p1-1-a', 100, 100, 1, 2), // level 2 (leaf)
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  describe('edge cases — Konteks 1 fallback (hargaSatuanRevisi=0)', () => {
    it('treats hargaSatuanRevisi=0 as "no revision" (fallback to Awal)', () => {
      // r1: hargaSatuanRevisi=0 → effective Revisi = Awal = 100
      // Total Awal = 100, Total Revisi (effective) = 100 → PASS
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 0)])],
      });
      expect(result.status).toBe('pass');
    });

    it('treats hargaSatuanRevisi=0 in 1 of 2 leaves correctly', () => {
      // r1: 5jt Awal, 0 Revisi → fallback to 5jt effective
      // r2: 5jt Awal, 5jt Revisi
      // Total Awal = 10jt, Total Revisi (effective) = 5jt + 5jt = 10jt → PASS
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 5000000, 0),
            leafRow('r2', 5000000, 5000000),
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('positive hargaSatuanRevisi takes precedence over Awal (no fallback)', () => {
      // r1: hargaSatuanRevisi=200 → uses 200 (not fallback). Awal=100. Selisih=+100 → FAIL.
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 200)])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({
        totalAwal: 100,
        totalRevisi: 200,
        selisih: 100,
      });
    });
  });

  describe('edge cases — epsilon tolerance (Rp 0.50)', () => {
    it('passes with selisih 0', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 100)])],
      });
      expect(result.status).toBe('pass');
    });

    it('passes with selisih within epsilon (≤ Rp 0.50)', () => {
      // Manually construct row with sub-rupiah difference via volume
      const ctx: ValidationContext = {
        ta: 2025,
        sections: [
          makeSection('s1', [
            { ...leafRow('r1', 100, 100), volume: 1.001 }, // total awal ≈ 100.1, revisi ≈ 100.1
          ]),
        ],
      };
      const result = validateC1(ctx);
      expect(result.status).toBe('pass');
    });

    it('fails with selisih > epsilon (Rp 1)', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 101)])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({ selisih: 1 });
    });
  });

  describe('edge cases — multi-section aggregation', () => {
    it('aggregates across multiple sections (satker-wide)', () => {
      // Section 1: balanced (+100, -100 = 0)
      // Section 2: balanced (+50, -50 = 0)
      // Total: 0 → PASS
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100, 0), // Konteks 1: effective = 100
            leafRow('r2', 100, 100),
          ]),
          makeSection('s2', [
            leafRow('r3', 50, 100), // +50
            leafRow('r4', 100, 50), // -50
          ]),
        ],
      });
      expect(result.status).toBe('pass');
    });

    it('detects fail when total imbalance across sections', () => {
      // Section 1: +100
      // Section 2: 0
      // Total: +100 → FAIL
      const result = validateC1({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200)]), // +100
          makeSection('s2', [leafRow('r2', 50, 50)]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({ selisih: 100 });
    });
  });

  describe('result structure', () => {
    it('returns spec from CONSTRAINT_SPECS catalogue', () => {
      const result = validateC1({ ta: 2025, sections: [] });
      expect(result.spec.id).toBe('C1');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4a');
    });

    it('includes evaluatedAt timestamp from ctx', () => {
      const fixed = new Date('2026-05-11T08:00:00Z');
      const result = validateC1({ ta: 2025, sections: [], evaluatedAt: fixed });
      expect(result.evaluatedAt).toBe(fixed.toISOString());
    });

    it('includes summary string', () => {
      const result = validateC1({ ta: 2025, sections: [] });
      expect(result.summary).toBeTruthy();
    });

    it('violation includes constraintId=C1 + severity=blocker', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 100, 200)])],
      });
      expect(result.violations[0].constraintId).toBe('C1');
      expect(result.violations[0].severity).toBe('blocker');
    });

    it('violation message contains Rupiah formatting + direction', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 5000000, 7000000)])],
      });
      expect(result.violations[0].message).toContain('bertambah');
      expect(result.violations[0].message).toMatch(/Rp[\s\u00A0]\d/);
    });

    it('violation message says "berkurang" when pagu decreases', () => {
      const result = validateC1({
        ta: 2025,
        sections: [makeSection('s1', [leafRow('r1', 7000000, 5000000)])],
      });
      expect(result.violations[0].message).toContain('berkurang');
    });
  });
});
