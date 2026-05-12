/**
 * Tests untuk C8 Validator — Memperhatikan LHR APIP
 *
 * File: utils/validators/c8.test.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 4)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4b.json c8[] → assert per-scenario
 *   2. Edge cases: explicit true/false/undefined, sections data orthogonal,
 *      multiple ta years, result structure, evaluatedAt honor
 *
 * Pattern unik — boolean state check, BUKAN data validation. Simpler dari
 * C1-C7 / C9. Tidak iterate sections sama sekali.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4b.json';
import { validateC8 } from './c8';
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
  return { id, tahun: 2025, title: `Test ${id}`, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C8 — Memperhatikan LHR APIP', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c8.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c8.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
          lhrApipAcknowledged: (scenario as { ctx_lhrApipAcknowledged?: boolean })
            .ctx_lhrApipAcknowledged,
        };

        const result = validateC8(ctx);

        expect(result.constraintId).toBe('C8');
        expect(result.status).toBe(scenario.expected.status);
      });
    });
  });

  // ─── Edge cases — boolean state variations ─────────────────────────────

  describe('edge cases — boolean state variations', () => {
    it('returns pass when ctx.lhrApipAcknowledged = true (explicit)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
        lhrApipAcknowledged: true,
      });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('sudah di-acknowledge');
    });

    it('returns pending when ctx.lhrApipAcknowledged = false (explicit)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
        lhrApipAcknowledged: false,
      });
      expect(result.status).toBe('pending');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('blocker');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'lhr_apip_not_acknowledged',
        currentState: false,
        ta: 2025,
      });
    });

    it('returns pending when ctx.lhrApipAcknowledged undefined (initial state)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail).toMatchObject({
        currentState: null,
      });
    });
  });

  // ─── Edge cases — sections data orthogonal to C8 ───────────────────────

  describe('edge cases — sections data orthogonal (C8 ignores sections)', () => {
    it('pass result unaffected by sections content (acknowledged=true)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 100, 200), leafRow('r2', 100, -500)]),
        ],
        lhrApipAcknowledged: true,
      });
      // Even with weird sections data (negative revisi), C8 only checks boolean
      expect(result.status).toBe('pass');
    });

    it('pending result unaffected by sections content (acknowledged=false)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [
          makeSection('s1', [leafRow('r1', 1000, 999999), leafRow('r2', 100, 150)]),
        ],
        lhrApipAcknowledged: false,
      });
      // Even with valid sections data, C8 pending karena boolean not yet set
      expect(result.status).toBe('pending');
    });
  });

  // ─── Edge cases — multi-year scenarios ─────────────────────────────────

  describe('edge cases — multi-year context', () => {
    it('detail.ta reflects context year (TA 2026)', () => {
      const result = validateC8({
        ta: 2026,
        sections: [],
        lhrApipAcknowledged: false,
      });
      expect(result.violations[0].detail).toMatchObject({ ta: 2026 });
      expect(result.violations[0].message).toContain('TA 2026');
    });

    it('detail.ta reflects context year (TA 2025)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
        lhrApipAcknowledged: false,
      });
      expect(result.violations[0].detail).toMatchObject({ ta: 2025 });
    });
  });

  // ─── Edge cases — pending violation message content ────────────────────

  describe('edge cases — pending violation message details', () => {
    it('pending message mentions Pasal 22 huruf b angka 2 (BARU rule)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
        lhrApipAcknowledged: false,
      });
      expect(result.violations[0].message).toContain('Pasal 22 huruf b angka 2');
      expect(result.violations[0].message).toContain('LHR APIP');
    });

    it('pending message mentions checkbox UI action guidance', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
      });
      expect(result.violations[0].message.toLowerCase()).toContain('checkbox');
      expect(result.violations[0].message.toLowerCase()).toContain('dashboard validasi');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape (pass case)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
        lhrApipAcknowledged: true,
      });
      expect(result).toHaveProperty('constraintId', 'C8');
      expect(result).toHaveProperty('spec');
      expect(result).toHaveProperty('status', 'pass');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('evaluatedAt');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4b');
    });

    it('returns proper ConstraintResult shape (pending case)', () => {
      const result = validateC8({
        ta: 2025,
        sections: [],
      });
      expect(result.status).toBe('pending');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toHaveProperty('constraintId', 'C8');
      expect(result.violations[0]).toHaveProperty('severity', 'blocker');
      expect(result.violations[0]).toHaveProperty('message');
      expect(result.violations[0]).toHaveProperty('detail');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-11T13:00:00Z');
      const result = validateC8({
        ta: 2025,
        sections: [],
        evaluatedAt: ts,
        lhrApipAcknowledged: true,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });
});
