/**
 * Tests untuk C12 Validator — Deadline 27 Desember TA Berkenaan
 *
 * File: utils/validators/c12.test.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 1)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4c.json c12[] → assert per-scenario
 *   2. Edge cases: date boundary semantics, sections orthogonal, violation
 *      message content, context handling, result structure
 *
 * Pattern: procedural validator — mirip C8 (boolean state check) tapi
 * pakai date comparison. Tidak iterate sections.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4c.json';
import { validateC12 } from './c12';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(id: string, hsa = 100, hsr = 150): PaguRow {
  return {
    id,
    kode: id,
    kode_bas: '521115',
    description: `TEST ROW ${id}`,
    volume: 1,
    satuan: 'TAHUN',
    hargaSatuanAwal: hsa,
    hargaSatuanRevisi: hsr,
    jumlahBiayaAwal: hsa,
    jumlahBiayaRevisi: hsr,
    sumberDana: 'RM',
    level: 0,
  };
}

function makeSection(id: string, rows: PaguRow[]): PaguSection {
  return { id, tahun: 2026, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C12 — Deadline 27 Desember TA Berkenaan', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c12.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c12.length}] ${scenario.name}`, () => {
        const sc = scenario as typeof scenario & {
          ctx_ta?: number;
          ctx_evaluatedAt?: string;
        };
        const ctx: ValidationContext = {
          ta: sc.ctx_ta ?? fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: sc.ctx_evaluatedAt ? new Date(sc.ctx_evaluatedAt) : undefined,
        };

        const result = validateC12(ctx);

        expect(result.constraintId).toBe('C12');
        expect(result.status).toBe(scenario.expected.status);
      });
    });
  });

  // ─── Edge cases — date boundary semantics ──────────────────────────────

  describe('edge cases — date boundary semantics', () => {
    it('returns pass when evaluatedAt 1 hari sebelum deadline (26 Des)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-26T12:00:00+07:00'),
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns fail when evaluatedAt tepat 27 Des 00:00:00 WIB (boundary inclusive of deadline)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-27T00:00:00+07:00'),
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('blocker');
    });

    it('returns fail when evaluatedAt 1 detik setelah deadline (27 Des 00:00:01)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-27T00:00:01+07:00'),
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'deadline_missed',
        ta: 2026,
        nextTa: 2027,
      });
    });
  });

  // ─── Edge cases — cross-year TA derivation ─────────────────────────────

  describe('edge cases — cross-year TA derivation (deadline pakai ctx.ta)', () => {
    it('TA 2025 + evaluatedAt mid-2025 = pass (verifikasi deadline derived dari ctx.ta)', () => {
      const result = validateC12({
        ta: 2025,
        sections: [],
        evaluatedAt: new Date('2025-08-15T10:00:00+07:00'),
      });
      expect(result.status).toBe('pass');
    });

    it('TA 2025 + evaluatedAt 28 Desember 2025 = fail (lewat deadline TA 2025)', () => {
      const result = validateC12({
        ta: 2025,
        sections: [],
        evaluatedAt: new Date('2025-12-28T10:00:00+07:00'),
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].detail).toMatchObject({
        ta: 2025,
        nextTa: 2026,
      });
    });
  });

  // ─── Edge cases — sections data orthogonal to C12 ──────────────────────

  describe('edge cases — sections data orthogonal (C12 ignores sections)', () => {
    it('pass result unaffected by sections content (pre-deadline)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200), leafRow('r2', 100, -500)]),
        ],
        evaluatedAt: new Date('2026-06-01T10:00:00+07:00'),
      });
      // Even with weird sections (negative revisi), C12 only checks date
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — violation message content ────────────────────────────

  describe('edge cases — violation message content', () => {
    it('fail message mentions Pasal 24 ayat (11) huruf d', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-28T10:00:00+07:00'),
      });
      expect(result.violations[0].message).toContain('Pasal 24');
      expect(result.violations[0].message).toContain('27 Desember');
    });

    it('fail message contains "TA berikutnya" action guidance', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-31T15:30:00+07:00'),
      });
      expect(result.violations[0].message).toContain('TA berikutnya');
      expect(result.violations[0].message).toContain('TA 2027');
    });
  });

  // ─── Edge cases — context handling ─────────────────────────────────────

  describe('edge cases — context handling', () => {
    it('honors evaluatedAt timestamp from ctx (echoes back in result.evaluatedAt)', () => {
      const ts = new Date('2026-06-15T08:30:00+07:00');
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });

    it('works without ctx.evaluatedAt (defaults to new Date(), status well-formed)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
      });
      // Status depends on current real-world date; just verify well-formed
      expect(['pass', 'fail']).toContain(result.status);
      expect(result.constraintId).toBe('C12');
      expect(result.evaluatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape (pass case)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-06-15T10:00:00+07:00'),
      });
      expect(result).toHaveProperty('constraintId', 'C12');
      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('status', 'pass');
      expect(result).toHaveProperty('violations');
      expect(result.violations).toHaveLength(0);
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4c');
    });

    it('returns proper ConstraintResult shape (fail case)', () => {
      const result = validateC12({
        ta: 2026,
        sections: [],
        evaluatedAt: new Date('2026-12-30T10:00:00+07:00'),
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toHaveProperty('constraintId', 'C12');
      expect(result.violations[0]).toHaveProperty('severity', 'blocker');
      expect(result.violations[0]).toHaveProperty('message');
      expect(result.violations[0]).toHaveProperty('detail');
      expect(result.violations[0].detail).toHaveProperty('reason', 'deadline_missed');
      expect(result.violations[0].detail).toHaveProperty('deadlineIso');
    });
  });
});
