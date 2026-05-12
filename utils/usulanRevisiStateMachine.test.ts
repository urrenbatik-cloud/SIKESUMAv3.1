// ============================================================================
// SIKESUMA Tier 5a Phase 2.2 — State Machine Tests
// ============================================================================
// File          : utils/usulanRevisiStateMachine.test.ts
// Tier/Phase    : Tier 5a — Phase 2.2 tests
// Reference     : docs/TIER-5-DESIGN.md §4 + design intent R6 + R6+ override
// Coverage      : 6 transition rules × edge cases + override + helpers
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  validateTransition,
  isTerminalStatus,
  getNextStatuses,
  TRANSITION_RULES,
} from './usulanRevisiStateMachine';
import type {
  UsulanRevisi,
  UsulanStatus,
  UsulanRevisiData,
} from '../types';

// ─── Fixture helpers ───────────────────────────────────────────────────────

function makeUsulan(status: UsulanStatus, data: UsulanRevisiData = {}): UsulanRevisi {
  return {
    id: 'test-usulan-uuid',
    status,
    tahun_anggaran: 2026,
    jenis: 'revisi_pok',
    data,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
  };
}

// ─── Rule #1: draft → direkomendasi ───────────────────────────────────────

describe('validateTransition — rule #1 draft → direkomendasi', () => {
  it('allowed when validators pass + LHR APIP ack', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'direkomendasi',
      usulan: makeUsulan('draft'),
      validatorsPassed: true,
      lhrApipAcknowledged: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.sideEffects).toBeUndefined();
  });

  it('disallowed when validatorsPassed=false', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'direkomendasi',
      usulan: makeUsulan('draft'),
      validatorsPassed: false,
      lhrApipAcknowledged: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/C1-C12/);
  });

  it('disallowed when LHR APIP not acknowledged', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'direkomendasi',
      usulan: makeUsulan('draft'),
      validatorsPassed: true,
      lhrApipAcknowledged: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/LHR APIP/);
  });

  it('disallowed when validatorsPassed undefined (defensive)', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'direkomendasi',
      usulan: makeUsulan('draft'),
      // validatorsPassed omitted
      lhrApipAcknowledged: true,
    });
    expect(result.allowed).toBe(false);
  });
});

// ─── Rule #2: direkomendasi → diteruskan ──────────────────────────────────

describe('validateTransition — rule #2 direkomendasi → diteruskan', () => {
  it('allowed without precondition (Karumkit R5a proxy)', () => {
    const result = validateTransition({
      fromStatus: 'direkomendasi',
      toStatus: 'diteruskan',
      usulan: makeUsulan('direkomendasi'),
    });
    expect(result.allowed).toBe(true);
  });
});

// ─── Rule #3: diteruskan → ditetapkan ─────────────────────────────────────

describe('validateTransition — rule #3 diteruskan → ditetapkan', () => {
  const fullData: UsulanRevisiData = {
    no_sk: 'B/123/RUM-IV/V/2026',
    tanggal_penetapan: '2026-05-15',
  };

  it('allowed when no_sk + tanggal_penetapan set', () => {
    const result = validateTransition({
      fromStatus: 'diteruskan',
      toStatus: 'ditetapkan',
      usulan: makeUsulan('diteruskan', fullData),
    });
    expect(result.allowed).toBe(true);
  });

  it('disallowed when no_sk missing', () => {
    const result = validateTransition({
      fromStatus: 'diteruskan',
      toStatus: 'ditetapkan',
      usulan: makeUsulan('diteruskan', { tanggal_penetapan: '2026-05-15' }),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/No SK/);
  });

  it('disallowed when no_sk empty string', () => {
    const result = validateTransition({
      fromStatus: 'diteruskan',
      toStatus: 'ditetapkan',
      usulan: makeUsulan('diteruskan', { no_sk: '   ', tanggal_penetapan: '2026-05-15' }),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/No SK/);
  });

  it('disallowed when tanggal_penetapan missing', () => {
    const result = validateTransition({
      fromStatus: 'diteruskan',
      toStatus: 'ditetapkan',
      usulan: makeUsulan('diteruskan', { no_sk: 'B/123' }),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Tanggal penetapan/);
  });
});

// ─── Rule #4: ditetapkan → berlaku_efektif (with snapshot side effect) ────

describe('validateTransition — rule #4 ditetapkan → berlaku_efektif', () => {
  it('allowed when current date >= tanggal_berlaku_efektif + side effect create_snapshot', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan', { tanggal_berlaku_efektif: '2026-05-10' }),
      now: '2026-05-12T00:00:00Z',
    });
    expect(result.allowed).toBe(true);
    expect(result.sideEffects).toEqual(['create_snapshot']);
  });

  it('allowed when current date equals tanggal_berlaku_efektif', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan', { tanggal_berlaku_efektif: '2026-05-12' }),
      now: '2026-05-12T08:00:00Z',
    });
    expect(result.allowed).toBe(true);
    expect(result.sideEffects).toEqual(['create_snapshot']);
  });

  it('disallowed when current date < tanggal_berlaku_efektif', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan', { tanggal_berlaku_efektif: '2026-06-01' }),
      now: '2026-05-12T00:00:00Z',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/belum tercapai/);
  });

  it('disallowed when tanggal_berlaku_efektif missing', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan'),
      now: '2026-05-12T00:00:00Z',
    });
    expect(result.allowed).toBe(false);
  });

  it('uses real Date.now() when ctx.now omitted', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10) // 10 years ahead
      .toISOString()
      .slice(0, 10);
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan', { tanggal_berlaku_efektif: futureDate }),
      // now omitted → uses real Date.now()
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/belum tercapai/);
  });
});

// ─── Rule #5: any-except-berlaku_efektif → ditolak ────────────────────────

describe('validateTransition — rule #5 any-except-berlaku_efektif → ditolak', () => {
  it('allowed draft → ditolak with reason (R6 permissive)', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'ditolak',
      usulan: makeUsulan('draft'),
      rejectReason: 'Tidak diperlukan setelah review awal.',
    });
    expect(result.allowed).toBe(true);
  });

  it('allowed direkomendasi → ditolak with reason', () => {
    const result = validateTransition({
      fromStatus: 'direkomendasi',
      toStatus: 'ditolak',
      usulan: makeUsulan('direkomendasi'),
      rejectReason: 'Karumkit tolak.',
    });
    expect(result.allowed).toBe(true);
  });

  it('allowed diteruskan → ditolak with reason', () => {
    const result = validateTransition({
      fromStatus: 'diteruskan',
      toStatus: 'ditolak',
      usulan: makeUsulan('diteruskan'),
      rejectReason: 'KPA Palembang minta revisi ulang.',
    });
    expect(result.allowed).toBe(true);
  });

  it('allowed ditetapkan → ditolak with reason (pre-efektif rejection)', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'ditolak',
      usulan: makeUsulan('ditetapkan'),
      rejectReason: 'SK cabut sebelum efektif.',
    });
    expect(result.allowed).toBe(true);
  });

  it('DISALLOWED berlaku_efektif → ditolak via normal flow (R6+ override required)', () => {
    const result = validateTransition({
      fromStatus: 'berlaku_efektif',
      toStatus: 'ditolak',
      usulan: makeUsulan('berlaku_efektif'),
      rejectReason: 'Itjenad temuan post-audit.',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Manual Override/);
  });

  it('disallowed when rejectReason missing', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'ditolak',
      usulan: makeUsulan('draft'),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Reason/);
  });

  it('disallowed when rejectReason empty string', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'ditolak',
      usulan: makeUsulan('draft'),
      rejectReason: '   ',
    });
    expect(result.allowed).toBe(false);
  });
});

// ─── Rule #6: R6+ Manual Override (catch-all any → any) ───────────────────

describe('validateTransition — rule #6 R6+ manual override', () => {
  it('allowed berlaku_efektif → ditolak via override (post-fact rejection)', () => {
    const result = validateTransition({
      fromStatus: 'berlaku_efektif',
      toStatus: 'ditolak',
      usulan: makeUsulan('berlaku_efektif'),
      isManualOverride: true,
      overrideReason: 'Itjenad temuan audit — SK harus dicabut post-fact.',
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
    // R7c integrity: override TIDAK trigger snapshot/notification side effects
    expect(result.sideEffects).toBeUndefined();
  });

  it('allowed ditolak → draft via override (resubmit setelah perbaikan)', () => {
    const result = validateTransition({
      fromStatus: 'ditolak',
      toStatus: 'draft',
      usulan: makeUsulan('ditolak'),
      isManualOverride: true,
      overrideReason: 'Resubmit setelah perbaikan justifikasi.',
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
  });

  it('allowed ditetapkan → draft via override (revisi ulang)', () => {
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'draft',
      usulan: makeUsulan('ditetapkan'),
      isManualOverride: true,
      overrideReason: 'Temuan baru — perlu revisi ulang sebelum berlaku.',
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
  });

  it('allowed draft → ditetapkan via override (skip normal flow)', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'ditetapkan',
      usulan: makeUsulan('draft'),
      isManualOverride: true,
      overrideReason: 'Skip flow karena darurat operasional.',
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
  });

  it('disallowed when override reason < 5 char', () => {
    const result = validateTransition({
      fromStatus: 'berlaku_efektif',
      toStatus: 'ditolak',
      usulan: makeUsulan('berlaku_efektif'),
      isManualOverride: true,
      overrideReason: 'ok',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/minimal 5/);
  });

  it('disallowed when override reason missing', () => {
    const result = validateTransition({
      fromStatus: 'berlaku_efektif',
      toStatus: 'ditolak',
      usulan: makeUsulan('berlaku_efektif'),
      isManualOverride: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/minimal 5/);
  });

  it('disallowed override no-op (from === to)', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'draft',
      usulan: makeUsulan('draft'),
      isManualOverride: true,
      overrideReason: 'Sengaja no-op untuk test.',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/no-op/);
  });

  it('override side effects always undefined (R7c integrity)', () => {
    // ditetapkan → berlaku_efektif via override BUKAN create snapshot
    const result = validateTransition({
      fromStatus: 'ditetapkan',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('ditetapkan', { tanggal_berlaku_efektif: '2026-05-10' }),
      isManualOverride: true,
      overrideReason: 'Force efektif untuk testing — snapshot tidak boleh create.',
      now: '2026-05-12T00:00:00Z',
    });
    expect(result.allowed).toBe(true);
    expect(result.isOverride).toBe(true);
    // CRITICAL — override NEVER trigger create_snapshot (R7c immutability defense)
    expect(result.sideEffects).toBeUndefined();
  });
});

// ─── No-op + invalid transitions ───────────────────────────────────────────

describe('validateTransition — no-op + invalid', () => {
  it('disallowed when from === to without override', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'draft',
      usulan: makeUsulan('draft'),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/no-op/);
  });

  it('disallowed undefined normal transition with suggestion', () => {
    const result = validateTransition({
      fromStatus: 'draft',
      toStatus: 'berlaku_efektif',
      usulan: makeUsulan('draft'),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Manual Override/);
  });

  it('disallowed ditolak → diteruskan normal (skip required override)', () => {
    const result = validateTransition({
      fromStatus: 'ditolak',
      toStatus: 'diteruskan',
      usulan: makeUsulan('ditolak'),
    });
    expect(result.allowed).toBe(false);
  });
});

// ─── Helper functions ──────────────────────────────────────────────────────

describe('isTerminalStatus', () => {
  it('berlaku_efektif is terminal', () => {
    expect(isTerminalStatus('berlaku_efektif')).toBe(true);
  });
  it('ditolak is terminal', () => {
    expect(isTerminalStatus('ditolak')).toBe(true);
  });
  it('draft is non-terminal', () => {
    expect(isTerminalStatus('draft')).toBe(false);
  });
  it('direkomendasi is non-terminal', () => {
    expect(isTerminalStatus('direkomendasi')).toBe(false);
  });
  it('diteruskan is non-terminal', () => {
    expect(isTerminalStatus('diteruskan')).toBe(false);
  });
  it('ditetapkan is non-terminal', () => {
    expect(isTerminalStatus('ditetapkan')).toBe(false);
  });
});

describe('getNextStatuses', () => {
  it('draft can go to direkomendasi + ditolak', () => {
    const next = getNextStatuses('draft');
    expect(next).toContain('direkomendasi');
    expect(next).toContain('ditolak');
    expect(next).toHaveLength(2);
  });
  it('direkomendasi can go to diteruskan + ditolak', () => {
    expect(getNextStatuses('direkomendasi').sort()).toEqual(['diteruskan', 'ditolak']);
  });
  it('diteruskan can go to ditetapkan + ditolak', () => {
    expect(getNextStatuses('diteruskan').sort()).toEqual(['ditetapkan', 'ditolak']);
  });
  it('ditetapkan can go to berlaku_efektif + ditolak', () => {
    expect(getNextStatuses('ditetapkan').sort()).toEqual(['berlaku_efektif', 'ditolak']);
  });
  it('berlaku_efektif terminal — no normal next', () => {
    expect(getNextStatuses('berlaku_efektif')).toEqual([]);
  });
  it('ditolak terminal — no normal next', () => {
    expect(getNextStatuses('ditolak')).toEqual([]);
  });
});

// ─── Map structural sanity ─────────────────────────────────────────────────

describe('TRANSITION_RULES structural sanity', () => {
  it('has rules for 4 non-terminal source states', () => {
    expect(Object.keys(TRANSITION_RULES).sort()).toEqual([
      'diteruskan',
      'ditetapkan',
      'direkomendasi',
      'draft',
    ].sort());
  });

  it('does NOT have normal rules for terminal states', () => {
    expect(TRANSITION_RULES.berlaku_efektif).toBeUndefined();
    expect(TRANSITION_RULES.ditolak).toBeUndefined();
  });
});
