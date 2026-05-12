/**
 * Tests untuk C11 Validator — Tidak Ubah RPD (Halaman III DIPA)
 *
 * File: utils/validators/c11.test.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 3)
 *
 * Test approach:
 *   1. Fixture-driven: load validation-scenarios-4c.json c11[] → assert status
 *   2. Edge cases: cross-table match precision (T5a strict), pending vs
 *      vacuous, Konteks 1 fallback awareness, multi-section/multi-rpd
 *      scenarios, violation detail structure (paguRowId + rpdRowId untuk
 *      Phase 3c cross-tab nav)
 *
 * Pattern unik — C11 adalah CROSS-TABLE validator pertama (sections + rpdsData).
 * Sebagian tests verifikasi correct interaction antara two data sources.
 */
import { describe, it, expect } from 'vitest';
import fixture from '../fixtures/validation-scenarios-4c.json';
import { validateC11 } from './c11';
import type { ValidationContext, PaguSection } from './types';
import type { PaguRow, RPDSection, RPDRow } from '../../types';

// ─── Helpers untuk construct test data ───────────────────────────────────

function leafRow(id: string, kode: string, hsa: number, hsr: number, vol = 1): PaguRow {
  return {
    id,
    kode,
    kode_bas: kode,
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

function rpdRow(id: string, kode: string): RPDRow {
  return {
    id,
    kode,
    description: `RPD ${kode}`,
    level: 0,
    monthly: {
      m1: 100000, m2: 100000, m3: 100000, m4: 100000,
      m5: 100000, m6: 100000, m7: 100000, m8: 100000,
      m9: 100000, m10: 100000, m11: 100000, m12: 100000,
    },
  };
}

function makeRpdSection(id: string, linkedPaguSectionId: string, rows: RPDRow[]): RPDSection {
  return { id, title: `RPD ${id}`, linkedPaguSectionId, rows };
}

// ─── Fixture-driven tests ────────────────────────────────────────────────

describe('C11 — Tidak Ubah RPD (Halaman III DIPA)', () => {
  describe('fixture scenarios', () => {
    fixture.scenarios.c11.forEach((scenario, idx) => {
      it(`[${idx + 1}/${fixture.scenarios.c11.length}] ${scenario.name}`, () => {
        const sc = scenario as typeof scenario & {
          ctx_ta?: number;
          ctx_rpdsData?: RPDSection[];
          ctx_c11Strategy?: 'permisif' | 'ketat';
        };
        const ctx: ValidationContext = {
          ta: sc.ctx_ta ?? fixture.ta,
          sections: scenario.sections as PaguSection[],
          rpdsData: sc.ctx_rpdsData,
          c11Strategy: sc.ctx_c11Strategy,
          evaluatedAt: new Date('2026-05-12T08:00:00Z'),
        };

        const result = validateC11(ctx);

        expect(result.constraintId).toBe('C11');
        expect(result.status).toBe(scenario.expected.status);
      });
    });
  });

  // ─── Edge cases — c11Strategy toggle (T9 BARU) ─────────────────────────

  describe('edge cases — c11Strategy toggle (T9 — permisif default, ketat opt-in)', () => {
    // Skenario referensi: 0 changed leaves + rpdsData undefined.
    // Hanya kasus ini di mana permisif vs ketat berbeda outputnya.
    const unchangedSection = makeSection('s1', [
      leafRow('r1', '521115', 5000000, 5000000), // hsr === hsa, NOT changed
    ]);

    it('default (no ctx.c11Strategy) → permisif behavior → vacuous pass', () => {
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        // c11Strategy NOT set → default 'permisif'
        // rpdsData NOT set → undefined
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('PERMISIF');
      expect(result.summary).toContain('default pengembangan');
    });

    it('explicit permisif + 0 changed + rpdsData undefined → vacuous pass', () => {
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        c11Strategy: 'permisif',
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('PERMISIF');
    });

    it('explicit ketat + 0 changed + rpdsData undefined → pending wins (flip)', () => {
      // INI satu-satunya kasus output berbeda dari permisif.
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        c11Strategy: 'ketat',
      });
      expect(result.status).toBe('pending');
      expect(result.summary).toContain('KETAT');
      expect(result.violations[0].detail).toMatchObject({
        reason: 'rpd_context_unavailable',
      });
    });

    it('explicit ketat + 0 changed + rpdsData = [] → pass (rpdsData defined, vacuous applies)', () => {
      // rpdsData = [] berbeda dari undefined — defined (empty), so pending
      // check di mode ketat pass-through ke vacuous check.
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        rpdsData: [],
        c11Strategy: 'ketat',
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('KETAT');
    });

    it('explicit ketat + changed > 0 + rpdsData undefined → pending (same as permisif untuk kasus ini)', () => {
      // Verifikasi kasus changedLeaves > 0 + rpdsData undefined identical
      // di kedua mode (sama-sama pending). Toggle hanya berpengaruh untuk
      // edge "0 changed + undefined".
      const ctxPermisif: ValidationContext = {
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        c11Strategy: 'permisif',
      };
      const ctxKetat: ValidationContext = { ...ctxPermisif, c11Strategy: 'ketat' };

      const resPermisif = validateC11(ctxPermisif);
      const resKetat = validateC11(ctxKetat);

      expect(resPermisif.status).toBe('pending');
      expect(resKetat.status).toBe('pending');
    });

    it('explicit ketat + changed > 0 + rpdsData defined → fail (cross-table eval normal)', () => {
      // Verifikasi mode ketat tidak mengganggu happy-path full evaluation
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
        c11Strategy: 'ketat',
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.summary).toContain('KETAT');
    });

    it('strategyNote mention "toggle UI Phase 3c" di permisif summary', () => {
      // Verifikasi user-facing note tentang fitur upgrade
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        c11Strategy: 'permisif',
      });
      expect(result.summary).toContain('Phase 3c');
    });

    it('strategyNote mention permisif sebagai alternative di ketat summary', () => {
      const result = validateC11({
        ta: 2026,
        sections: [unchangedSection],
        c11Strategy: 'ketat',
      });
      // Mode ketat note mention PERMISIF sebagai alternative
      expect(result.summary).toContain('PERMISIF');
      expect(result.summary).toContain('default');
    });
  });

  describe('edge cases — pending vs vacuous (custom decision tree)', () => {
    it('returns pass (vacuous) when 0 changed leaves + rpdsData undefined', () => {
      // Custom interpretation: vacuous wins over pending. Tidak ada yang
      // perlu di-evaluate, missing rpdsData irrelevant.
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 5000000)])],
        // rpdsData NOT set
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('returns pass (vacuous) when 0 changed leaves + rpdsData = []', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 5000000)])],
        rpdsData: [],
      });
      expect(result.status).toBe('pass');
    });

    it('returns pending when changed leaves exist + rpdsData undefined', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        // rpdsData NOT set → pending
      });
      expect(result.status).toBe('pending');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({
        reason: 'rpd_context_unavailable',
        changedLeavesCount: 1,
      });
    });

    it('returns pass when changed leaves exist + rpdsData = [] (no RPD entries)', () => {
      // Empty array semantic: "RPD checked, no data" — different from undefined
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [],
      });
      expect(result.status).toBe('pass');
    });

    it('returns pass when changed leaves + rpdsData has sections but 0 rows', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — T5a strict match (linkedPaguSectionId + kode) ────────

  describe('edge cases — T5a strict match precision', () => {
    it('returns fail when both linkedPaguSectionId + kode exact match', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
    });

    it('returns pass when kode mismatch (linkedPaguSectionId OK)', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521119')])],
      });
      expect(result.status).toBe('pass');
    });

    it('returns pass when linkedPaguSectionId mismatch (kode OK)', () => {
      // T5a strict: RPD section linked ke section LAIN dengan kode sama
      // → bukan affected. Verifikasi BUKAN fuzzy prefix match.
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-other', 'OTHER_SECTION', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('pass');
    });

    it('returns pass when both mismatch', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-other', 'OTHER', [rpdRow('rpd-r1', '521119')])],
      });
      expect(result.status).toBe('pass');
    });

    it('exact kode match works for kode dengan sub-akun (521811.05)', () => {
      // Verifikasi T5a strict equality bahkan untuk kode dengan dot notation
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521811.05', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521811.05')])],
      });
      expect(result.status).toBe('fail');
    });

    it('similar but not identical kode does NOT match (521811 vs 521811.05)', () => {
      // T5a strict: kode "521811" ≠ kode "521811.05" walaupun prefix sama
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521811', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521811.05')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — Konteks 1 fallback awareness ─────────────────────────

  describe('edge cases — Konteks 1 fallback awareness (isChangedRow)', () => {
    it('row dengan hsr=0 NOT counted as changed (Konteks 1 fallback) → pass even if RPD exists', () => {
      // Row hsr=0 effectively = hsa via Konteks 1 fallback → not changed →
      // RPD impact not triggered.
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 0)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('pass');
      expect(result.summary).toContain('vacuous');
    });

    it('row dengan hsr === hsa NOT counted as changed → pass', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 5000000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('pass');
    });

    it('mix: 1 changed + 1 unchanged dengan RPD match untuk keduanya → fail dengan 1 violation only', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [
          leafRow('r1', '521115', 5000000, 4500000),  // changed
          leafRow('r2', '521119', 3000000, 3000000),  // NOT changed
        ])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [
          rpdRow('rpd-r1', '521115'),
          rpdRow('rpd-r2', '521119'),
        ])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].affectedRowIds).toEqual(['r1']);
    });
  });

  // ─── Edge cases — multi-section / multi-RPD scenarios ──────────────────

  describe('edge cases — multi-section / multi-RPD aggregation', () => {
    it('2 changed leaves dalam 1 section, 2 RPD matches → fail dengan 2 violations', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [
          leafRow('r1', '521115', 5000000, 4500000),
          leafRow('r2', '521119', 3000000, 3500000),
        ])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [
          rpdRow('rpd-r1', '521115'),
          rpdRow('rpd-r2', '521119'),
        ])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(2);
    });

    it('changed leaves di 2 section berbeda, hanya 1 yang ada RPD-nya → fail dengan 1 violation', () => {
      const result = validateC11({
        ta: 2026,
        sections: [
          makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)]),
          makeSection('s2', [leafRow('r2', '521119', 3000000, 3500000)]),
        ],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
        // s2 tidak punya RPD section linked
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({
        paguSectionId: 's1',
        paguKode: '521115',
      });
    });

    it('multiple RPD sections linked to same pagu section, only one matches kode', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [
          makeRpdSection('rpd-A', 's1', [rpdRow('rpd-rA', '521115')]),  // MATCH
          makeRpdSection('rpd-B', 's1', [rpdRow('rpd-rB', '521999')]),  // no match
        ],
      });
      expect(result.status).toBe('fail');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].detail).toMatchObject({
        rpdSectionId: 'rpd-A',
        rpdKode: '521115',
      });
    });

    it('vacuous pass dengan banyak RPD sections + 0 changed leaves', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [
          leafRow('r1', '521115', 5000000, 5000000),
          leafRow('r2', '521119', 3000000, 3000000),
        ])],
        rpdsData: [
          makeRpdSection('rpd-A', 's1', [rpdRow('rpd-rA', '521115')]),
          makeRpdSection('rpd-B', 's1', [rpdRow('rpd-rB', '521119')]),
        ],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Edge cases — violation detail (untuk Phase 3c cross-tab nav) ──────

  describe('edge cases — violation detail content', () => {
    it('violation detail has paguRowId + paguSectionId + rpdRowId + rpdSectionId', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('pagu-s1', [leafRow('pagu-r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 'pagu-s1', [rpdRow('rpd-r1', '521115')])],
      });
      const v = result.violations[0];
      expect(v.detail).toMatchObject({
        reason: 'rpd_entry_affected',
        paguRowId: 'pagu-r1',
        paguSectionId: 'pagu-s1',
        paguKode: '521115',
        rpdRowId: 'rpd-r1',
        rpdSectionId: 'rpd-s1',
        rpdKode: '521115',
      });
    });

    it('violation detail.rpdMonthlyTotal sums all 12 months', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
        // Default rpdRow helper: 12 × 100k = 1.2M
      });
      expect(result.violations[0].detail?.rpdMonthlyTotal).toBe(1200000);
    });

    it('violation message mentions "RPD" + "Halaman III" + "DIPA" + "KAPK"', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      const msg = result.violations[0].message;
      expect(msg).toContain('RPD');
      expect(msg).toContain('Halaman III');
      expect(msg).toContain('DIPA');
      expect(msg).toContain('KAPK');
    });

    it('violation message mentions Pasal Lampiran I 5.d', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.violations[0].message).toContain('Lampiran I');
      expect(result.violations[0].message).toContain('5.d');
    });

    it('pending violation message mentions rpdsData wiring guidance', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
      });
      expect(result.violations[0].message).toContain('rpdsData');
      expect(result.violations[0].message).toContain('ValidationContext');
    });
  });

  // ─── Empty input ────────────────────────────────────────────────────────

  describe('edge cases — empty input', () => {
    it('returns pass when sections empty + rpdsData empty', () => {
      const result = validateC11({ ta: 2026, sections: [], rpdsData: [] });
      expect(result.status).toBe('pass');
    });

    it('returns pass when sections empty + rpdsData has data', () => {
      const result = validateC11({
        ta: 2026,
        sections: [],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('pass');
    });
  });

  // ─── Result structure validation ───────────────────────────────────────

  describe('result structure', () => {
    it('returns proper ConstraintResult shape (pass)', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 5000000)])],
        rpdsData: [],
      });
      expect(result).toHaveProperty('constraintId', 'C11');
      expect(result).toHaveProperty('spec');
      expect(result.spec.severity).toBe('blocker');
      expect(result.spec.subBranch).toBe('4c');
      expect(result.status).toBe('pass');
      expect(result.violations).toHaveLength(0);
    });

    it('returns proper ConstraintResult shape (fail)', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
        rpdsData: [makeRpdSection('rpd-s1', 's1', [rpdRow('rpd-r1', '521115')])],
      });
      expect(result.status).toBe('fail');
      expect(result.violations[0].severity).toBe('blocker');
      expect(result.violations[0].affectedRowIds).toEqual(['r1']);
    });

    it('returns proper ConstraintResult shape (pending)', () => {
      const result = validateC11({
        ta: 2026,
        sections: [makeSection('s1', [leafRow('r1', '521115', 5000000, 4500000)])],
      });
      expect(result.status).toBe('pending');
      expect(result.violations[0].detail?.reason).toBe('rpd_context_unavailable');
    });

    it('honors evaluatedAt timestamp from ctx', () => {
      const ts = new Date('2026-05-12T15:00:00Z');
      const result = validateC11({
        ta: 2026,
        sections: [],
        rpdsData: [],
        evaluatedAt: ts,
      });
      expect(result.evaluatedAt).toBe(ts.toISOString());
    });
  });
});
