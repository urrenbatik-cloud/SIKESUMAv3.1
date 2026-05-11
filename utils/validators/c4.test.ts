/**
 * Tests untuk C4 Validator — Pergeseran dalam 1 Satker yang Sama
 *
 * File: utils/validators/c4.test.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b)
 *
 * Test approach: load fixture validation-scenarios-4a.json → iterate c4
 * scenarios → assert per-scenario expected status match.
 *
 * Plus edge cases:
 *   - Empty sections
 *   - Constraint ID consistency
 *   - Idempotent (returns sama dengan sections content apapun)
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4a.json';
import { validateC4 } from './c4';
import type { ValidationContext, PaguSection } from './types';

describe('C4 — Pergeseran dalam 1 Satker yang Sama', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c4.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c4.length}] ${scenario.name}`, () => {
        const ctx: ValidationContext = {
          ta: fixture.ta,
          sections: scenario.sections as PaguSection[],
          evaluatedAt: new Date('2026-05-11T08:00:00Z'),
        };

        const result = validateC4(ctx);

        expect(result.constraintId).toBe('C4');
        expect(result.status).toBe(scenario.expected.status);
        expect(result.violations).toHaveLength(scenario.expected.violations.length);
      });
    });
  });

  describe('edge cases', () => {
    it('passes with empty sections (deterministic single-satker)', () => {
      const result = validateC4({ ta: 2025, sections: [] });
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns constraintId C4', () => {
      const result = validateC4({ ta: 2025, sections: [] });
      expect(result.constraintId).toBe('C4');
    });

    it('returns spec from CONSTRAINT_SPECS catalogue', () => {
      const result = validateC4({ ta: 2025, sections: [] });
      expect(result.spec.id).toBe('C4');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4a');
    });

    it('returns evaluatedAt timestamp', () => {
      const fixed = new Date('2026-05-11T08:00:00Z');
      const result = validateC4({ ta: 2025, sections: [], evaluatedAt: fixed });
      expect(result.evaluatedAt).toBe(fixed.toISOString());
    });

    it('uses current time when evaluatedAt not provided', () => {
      const before = new Date().toISOString();
      const result = validateC4({ ta: 2025, sections: [] });
      const after = new Date().toISOString();
      expect(result.evaluatedAt >= before).toBe(true);
      expect(result.evaluatedAt <= after).toBe(true);
    });

    it('idempotent — same input → same output', () => {
      const ctx: ValidationContext = {
        ta: 2025,
        sections: [],
        evaluatedAt: new Date('2026-05-11T08:00:00Z'),
      };
      const r1 = validateC4(ctx);
      const r2 = validateC4(ctx);
      expect(r1.status).toBe(r2.status);
      expect(r1.violations).toEqual(r2.violations);
      expect(r1.evaluatedAt).toBe(r2.evaluatedAt);
    });

    it('includes human-readable summary', () => {
      const result = validateC4({ ta: 2025, sections: [] });
      expect(result.summary).toBeTruthy();
      expect(result.summary).toContain('685784');
    });
  });
});
