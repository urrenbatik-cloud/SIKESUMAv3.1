/**
 * Tests untuk C10 Validator — Sesuai SBM/SBK
 *
 * File: utils/validators/c10.test.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 2)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4c.json c10[] → assert status
 *   2. Edge cases: deviasi boundary semantics (terutama float-precision pada
 *      exactly-10% boundary), skip conditions, multi-row aggregation (fail >
 *      warn > pass precedence), violation content + structure
 *
 * Special focus: C10 adalah validator pertama yang hasilkan severity='warning'
 * di violations dan status='warn' di aggregate result. Sebagian tests verifikasi
 * end-to-end bahwa engine + types support WARN state correctly.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4c.json';
import {
  validateC10,
  C10_WARN_THRESHOLD_PCT,
  C10_FAIL_THRESHOLD_PCT,
} from './c10';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(id: string, hsa: number, hsr: number, vol = 1): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: '521115',
    description: `TEST ROW ${id}`,
    volume: vol,
    satuan: 'TAHUN',
    hargaSatuanAwal: hsa,
    hargaSatuanRevisi: hsr,
    jumlahBiayaAwal: hsa * vol,
    jumlahBiayaRevisi: hsr * vol,
    sumberDana: 'RM',
    level: 0,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2026, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C10 — Sesuai SBM/SBK', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c10.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c10.length}] ${scenario.name}`, () => {
        const sc = scenario as typeof scenario & { ctx_ta?: number };
        const ctx: ValidationContext = {
          ta: sc.ctx_ta ?? fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-12T08:00:00Z'),
        };

        const result = validateC10(ctx);

        expect(result.constraintId).toBe('C10');
        expect(result.status).toBe(scenario.expected.status);
      });
    });
  });

  // ─── Edge cases — boundary semantics (float-precision safe) ────────────

  describe('edge cases — boundary semantics (float-precision safe)', () => {
    it('returns pass when deviasi 0% (hsr == hsa, no change)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 100000)])],
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns pass when deviasi exactly at warn threshold (10%)', () => {
      // CRITICAL: kalau pakai naive percentage compare, float artifact akan
      // bikin ini accidentally jadi warn. Verifikasi multiplier-based safe.
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 110000)])],
      });
      expect(result.status).toBe('pass');
    });

    it('returns warn when deviasi just above warn threshold (10.01%)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 110001)])],
      });
      expect(result.status).toBe('warn');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('warning');
    });

    it('returns warn when deviasi exactly at fail threshold (25%)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 125000)])],
      });
      expect(result.status).toBe('warn');
      expect(result.violations[0].severity).toBe('warning');
    });

    it('returns fail when deviasi just above fail threshold (25.01%)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 125001)])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].severity).toBe('blocker');
    });

    it('returns fail when deviasi very large (200%)', () => {
      // hsa=100k, hsr=300k → deviasi 200%
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 300000)])],
      });
      expect(result.status).toBe('fail');
    });
  });

  // ─── Edge cases — symmetric deviasi (revisi lebih kecil dari baseline) ─

  describe('edge cases — symmetric deviasi (Math.abs)', () => {
    it('returns warn when revisi 15% LEBIH KECIL dari baseline', () => {
      // hsa=100k, hsr=85k → |85k-100k|/100k = 15% → warn
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 85000)])],
      });
      expect(result.status).toBe('warn');
    });

    it('returns fail when revisi 30% LEBIH KECIL dari baseline', () => {
      // hsa=100k, hsr=70k → |70k-100k|/100k = 30% → fail
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 70000)])],
      });
      expect(result.status).toBe('fail');
    });
  });

  // ─── Edge cases — skip conditions ──────────────────────────────────────

  describe('edge cases — skip conditions', () => {
    it('skips row when hsr=0 (no revisi — Konteks 1 territory)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 0)])],
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('1 skipped');
    });

    it('skips row when hsa=0 (no baseline — cannot compute)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 0, 100000)])],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('1 skipped');
    });

    it('skips row when both hsr=0 and hsa=0', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 0, 0)])],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('1 skipped');
    });
  });

  // ─── Edge cases — multi-row aggregation (precedence fail > warn > pass) ─

  describe('edge cases — multi-row aggregation (precedence fail > warn > pass)', () => {
    it('all pass → status pass', () => {
      const result = validateC10({
        ta: 2026,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100000, 105000), // 5% pass
            leafRow('r2', 200000, 210000), // 5% pass
            leafRow('r3', 300000, 330000), // 10% boundary pass
          ]),
        ],
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('mix pass + warn (zero fail) → status warn', () => {
      const result = validateC10({
        ta: 2026,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100000, 105000), // 5% pass
            leafRow('r2', 100000, 115000), // 15% warn
            leafRow('r3', 100000, 120000), // 20% warn
          ]),
        ],
      });
      expect(result.status).toBe('warn');
      expect(result.violations).toHaveLength(2); // r2 + r3
      expect(result.violations.every(v => v.severity === 'warning')).toBe(true);
    });

    it('mix pass + warn + fail → status fail (fail precedence)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [
          makeSection('s1', [
            leafRow('r1', 100000, 105000), // 5% pass
            leafRow('r2', 100000, 115000), // 15% warn
            leafRow('r3', 100000, 130000), // 30% fail
          ]),
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2); // r2 + r3
      const severities = result.violations.map(v => v.severity);
      expect(severities).toContain('warning');
      expect(severities).toContain('blocker');
    });

    it('multi-section aggregation works correctly', () => {
      const result = validateC10({
        ta: 2026,
        sections: [
          makeSection('s1', [leafRow('r1', 100000, 115000)]), // 15% warn
          makeSection('s2', [leafRow('r2', 100000, 130000)]), // 30% fail
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2);
    });
  });

  // ─── Edge cases — empty input ──────────────────────────────────────────

  describe('edge cases — empty input', () => {
    it('returns pass when no sections', () => {
      const result = validateC10({ ta: 2026, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns pass when sections punya 0 leaves', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — violation detail content ─────────────────────────────

  describe('edge cases — violation detail content', () => {
    it('warn violation has proper detail structure', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 115000)])], // 15%
      });
      const v = result.violations[0];
      expect(v.severity).toBe('warning');
      expect(v.affectedRowIds).toEqual(['r1']);
      expect(v.detail).toMatchObject({
        rowId: 'r1',
        kode: 'r1',
        hargaSatuanAwal: 100000,
        hargaSatuanRevisi: 115000,
        threshold_breached: 'warn',
        warnThresholdPct: C10_WARN_THRESHOLD_PCT,
        failThresholdPct: C10_FAIL_THRESHOLD_PCT,
      });
      expect(v.detail?.deviasi_pct).toBeCloseTo(15.0, 1);
    });

    it('fail violation has proper detail structure (threshold_breached=fail)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 130000)])], // 30%
      });
      const v = result.violations[0];
      expect(v.severity).toBe('blocker');
      expect(v.detail).toMatchObject({
        threshold_breached: 'fail',
      });
      expect(v.detail?.deviasi_pct).toBeCloseTo(30.0, 1);
    });

    it('violation message mentions SBM/SBK', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 115000)])],
      });
      expect(result.violations[0].message).toContain('SBM/SBK');
    });

    it('violation message mentions deviasi percentage', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 115000)])],
      });
      expect(result.violations[0].message).toContain('15.0%');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape (pass)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 105000)])],
      });
      expect(result).toHaveProperty('constraintId', 'C10');
      expect(result).toHaveProperty('spec');
      expect(result.spec.severity).toBe('warning'); // C10 spec severity itself
      expect(result.spec.subBranch).toBe('4c');
      expect(result).toHaveProperty('status', 'pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns proper ConstraintResult shape (warn — FIRST warn status validator)', () => {
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 115000)])],
      });
      // Verifikasi end-to-end warn state: status + violation severity match
      expect(result.status).toBe('warn');
      expect(result.violations[0].severity).toBe('warning');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-12T13:00:00Z');
      const result = validateC10({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', 100000, 100000)])],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });

  // ─── Constants smoke test ──────────────────────────────────────────────

  describe('exported constants (T4 thresholds)', () => {
    it('warn threshold = 10 per Decision T4', () => {
      expect(C10_WARN_THRESHOLD_PCT).toBe(10);
    });

    it('fail threshold = 25 per Decision T4', () => {
      expect(C10_FAIL_THRESHOLD_PCT).toBe(25);
    });

    it('warn threshold < fail threshold (invariant)', () => {
      expect(C10_WARN_THRESHOLD_PCT).toBeLessThan(C10_FAIL_THRESHOLD_PCT);
    });
  });
});
