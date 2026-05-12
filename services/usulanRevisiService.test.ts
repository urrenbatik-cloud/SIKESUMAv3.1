// ============================================================================
// SIKESUMA Tier 5a Phase 2.3 — Service Layer Tests
// ============================================================================
// File          : services/usulanRevisiService.test.ts
// Tier/Phase    : Tier 5a — Phase 2.3 tests (CRUD + composite operations)
// Reference     : services/usulanRevisiService.ts
// Strategy      : Mock lib/supabase module dengan chainable fluent API.
//                 Centralized helper `mockResponses(...)` configures the from()
//                 mock to return chains that consume responses in queue order.
//                 Each test calls mockResponses() to set up its scenario.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UsulanRevisi, UsulanRevisiData, PaguSection } from '../types';

// ─── Supabase client mock ──────────────────────────────────────────────────

vi.mock('../lib/supabase', () => {
  return {
    supabase: { from: vi.fn() },
  };
});

import * as supabaseMod from '../lib/supabase';
import {
  createUsulanDraft,
  getUsulanById,
  listUsulan,
  transitionUsulan,
  recordValidationAttempt,
  recordManualOverride,
  addPerubahan,
  listPerubahan,
  createSnapshot,
  getSnapshotByDate,
  listSnapshots,
} from './usulanRevisiService';

/**
 * Configure the supabase mock to return a chain that consumes the given
 * responses in queue order. Subsequent chain.from().select()...await calls
 * pop the next response. When queue exhausted, last response is repeated.
 *
 * Returns a `captured` object — observe captured.insert/update payloads
 * + captured.from table names + captured.eq filter values from the test.
 */
function mockResponses(...responses: Array<{ data: any; error: any }>) {
  let idx = 0;
  const popResponse = () => responses[Math.min(idx++, responses.length - 1)];

  const captured = {
    from: [] as string[],
    insert: [] as any[],
    update: [] as any[],
    eq: [] as Array<{ column: string; value: any }>,
    order: [] as Array<{ column: string; options?: any }>,
  };

  const supa = (supabaseMod as any).supabase;
  supa.from.mockImplementation((table: string) => {
    captured.from.push(table);
    const chain: any = {};

    ['select', 'delete', 'upsert', 'limit', 'in'].forEach((m) => {
      chain[m] = vi.fn().mockReturnValue(chain);
    });
    chain.insert = vi.fn((payload: any) => { captured.insert.push(payload); return chain; });
    chain.update = vi.fn((payload: any) => { captured.update.push(payload); return chain; });
    chain.eq = vi.fn((column: string, value: any) => {
      captured.eq.push({ column, value });
      return chain;
    });
    chain.order = vi.fn((column: string, options?: any) => {
      captured.order.push({ column, options });
      return chain;
    });
    // Terminal methods pop response
    chain.single = vi.fn().mockImplementation(() => Promise.resolve(popResponse()));
    chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(popResponse()));
    // Awaitable chain (for `await q.order(...)` without .single)
    chain.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve(popResponse()).then(onFulfilled, onRejected);
    return chain;
  });

  return captured;
}

beforeEach(() => {
  const supa = (supabaseMod as any).supabase;
  supa.from.mockReset();
});

// ─── Fixture builders ──────────────────────────────────────────────────────

function fakeUsulanRow(overrides: Partial<UsulanRevisi> = {}): any {
  return {
    id: overrides.id ?? 'uuid-fake-1',
    status: overrides.status ?? 'draft',
    tahun_anggaran: overrides.tahun_anggaran ?? 2026,
    jenis: overrides.jenis ?? 'revisi_pok',
    data: overrides.data ?? {},
    created_at: overrides.created_at ?? '2026-05-12T00:00:00Z',
    updated_at: overrides.updated_at ?? '2026-05-12T00:00:00Z',
  };
}

// ─── createUsulanDraft ─────────────────────────────────────────────────────

describe('createUsulanDraft', () => {
  it('inserts row with status=draft + returns typed object', async () => {
    const cap = mockResponses({
      data: fakeUsulanRow({ id: 'new-uuid', status: 'draft' }),
      error: null,
    });

    const result = await createUsulanDraft(2026, 'revisi_pok', { justifikasi: 'test' });

    expect(cap.from).toEqual(['usulan_revisi']);
    expect(cap.insert[0]).toMatchObject({
      status: 'draft',
      tahun_anggaran: 2026,
      jenis: 'revisi_pok',
      data: { justifikasi: 'test' },
    });
    expect(result.id).toBe('new-uuid');
    expect(result.status).toBe('draft');
  });

  it('throws when Supabase returns error', async () => {
    mockResponses({ data: null, error: { message: 'RLS denied' } });
    await expect(createUsulanDraft(2026, 'revisi_pok')).rejects.toThrow(/RLS denied/);
  });

  it('throws when no row returned', async () => {
    mockResponses({ data: null, error: null });
    await expect(createUsulanDraft(2026, 'revisi_pok')).rejects.toThrow(/no row/);
  });

  it('passes empty initial data when omitted', async () => {
    const cap = mockResponses({ data: fakeUsulanRow(), error: null });
    await createUsulanDraft(2026, 'pagu_berubah');
    expect(cap.insert[0].data).toEqual({});
  });
});

// ─── getUsulanById ─────────────────────────────────────────────────────────

describe('getUsulanById', () => {
  it('returns row when found', async () => {
    const cap = mockResponses({ data: fakeUsulanRow({ id: 'find-me' }), error: null });
    const result = await getUsulanById('find-me');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('find-me');
    expect(cap.eq).toEqual([{ column: 'id', value: 'find-me' }]);
  });

  it('returns null when not found', async () => {
    mockResponses({ data: null, error: null });
    const result = await getUsulanById('nonexistent');
    expect(result).toBeNull();
  });

  it('throws on Supabase error', async () => {
    mockResponses({ data: null, error: { message: 'DB error' } });
    await expect(getUsulanById('x')).rejects.toThrow(/DB error/);
  });
});

// ─── listUsulan ────────────────────────────────────────────────────────────

describe('listUsulan', () => {
  it('returns mapped array sorted by created_at DESC', async () => {
    const cap = mockResponses({
      data: [fakeUsulanRow({ id: 'a' }), fakeUsulanRow({ id: 'b' })],
      error: null,
    });
    const result = await listUsulan();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(cap.order).toEqual([{ column: 'created_at', options: { ascending: false } }]);
  });

  it('returns empty array when no rows', async () => {
    mockResponses({ data: null, error: null });
    const result = await listUsulan();
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    mockResponses({ data: null, error: { message: 'fail' } });
    await expect(listUsulan({ status: 'draft' })).rejects.toThrow(/fail/);
  });

  it('applies status + tahun + jenis filter as eq() calls', async () => {
    const cap = mockResponses({ data: [], error: null });
    await listUsulan({ status: 'direkomendasi', tahun_anggaran: 2026, jenis: 'revisi_pok' });
    expect(cap.eq).toHaveLength(3);
    expect(cap.eq).toContainEqual({ column: 'status', value: 'direkomendasi' });
    expect(cap.eq).toContainEqual({ column: 'tahun_anggaran', value: 2026 });
    expect(cap.eq).toContainEqual({ column: 'jenis', value: 'revisi_pok' });
  });

  it('omits filter when not provided', async () => {
    const cap = mockResponses({ data: [], error: null });
    await listUsulan();
    expect(cap.eq).toHaveLength(0);
  });
});

// ─── transitionUsulan ──────────────────────────────────────────────────────

describe('transitionUsulan', () => {
  it('disallowed transition returns current usulan + result.allowed=false', async () => {
    mockResponses({ data: fakeUsulanRow({ status: 'draft' }), error: null });
    const r = await transitionUsulan('id1', 'direkomendasi', {
      validatorsPassed: false,
      lhrApipAcknowledged: true,
    });
    expect(r.result.allowed).toBe(false);
    expect(r.result.reason).toMatch(/C1-C12/);
    expect(r.usulan.status).toBe('draft');
  });

  it('allowed transition issues UPDATE + returns new status', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ status: 'draft' }), error: null },          // 1. getUsulanById
      { data: fakeUsulanRow({ status: 'direkomendasi' }), error: null }   // 2. UPDATE.select.single
    );
    const r = await transitionUsulan('id1', 'direkomendasi', {
      validatorsPassed: true,
      lhrApipAcknowledged: true,
    });
    expect(r.result.allowed).toBe(true);
    expect(r.usulan.status).toBe('direkomendasi');
    expect(cap.update).toHaveLength(1);
    expect(cap.update[0].status).toBe('direkomendasi');
  });

  it('returns sideEffects=create_snapshot for ditetapkan → berlaku_efektif', async () => {
    mockResponses(
      {
        data: fakeUsulanRow({
          status: 'ditetapkan',
          data: { tanggal_berlaku_efektif: '2026-05-10' } as UsulanRevisiData,
        }),
        error: null,
      },
      { data: fakeUsulanRow({ status: 'berlaku_efektif' }), error: null }
    );
    const r = await transitionUsulan('id1', 'berlaku_efektif', {
      now: '2026-05-12T00:00:00Z',
    });
    expect(r.result.allowed).toBe(true);
    expect(r.result.sideEffects).toEqual(['create_snapshot']);
  });

  it('disallowed when prerequisites missing → no UPDATE issued', async () => {
    const cap = mockResponses({ data: fakeUsulanRow({ status: 'diteruskan' }), error: null });
    const r = await transitionUsulan('id1', 'ditetapkan');
    expect(r.result.allowed).toBe(false);
    expect(cap.update).toHaveLength(0); // no UPDATE issued when disallowed
  });

  it('throws when usulan not found', async () => {
    mockResponses({ data: null, error: null });
    await expect(transitionUsulan('missing', 'direkomendasi')).rejects.toThrow(/not found/);
  });
});

// ─── recordValidationAttempt ───────────────────────────────────────────────

describe('recordValidationAttempt', () => {
  it('appends entry to validation_attempts[] with pass result', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ data: { validation_attempts: [] } }), error: null },
      { data: fakeUsulanRow(), error: null }
    );
    await recordValidationAttempt('id1', 'pass');
    expect(cap.update).toHaveLength(1);
    expect(cap.update[0].data.validation_attempts).toHaveLength(1);
    expect(cap.update[0].data.validation_attempts[0].result).toBe('pass');
  });

  it('omits violations_summary when result=pass even if provided', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ data: {} }), error: null },
      { data: fakeUsulanRow(), error: null }
    );
    await recordValidationAttempt('id1', 'pass', { constraintIds: ['C8'], total: 1 });
    expect(cap.update[0].data.validation_attempts[0].violations_summary).toBeUndefined();
  });

  it('includes violations_summary when result=fail', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ data: {} }), error: null },
      { data: fakeUsulanRow(), error: null }
    );
    await recordValidationAttempt('id1', 'fail', { constraintIds: ['C8', 'C11'], total: 2 });
    expect(cap.update[0].data.validation_attempts[0].result).toBe('fail');
    expect(cap.update[0].data.validation_attempts[0].violations_summary).toEqual({
      constraintIds: ['C8', 'C11'],
      total: 2,
    });
  });

  it('preserves existing validation_attempts entries (append, not replace)', async () => {
    const cap = mockResponses(
      {
        data: fakeUsulanRow({
          data: {
            validation_attempts: [
              { attempted_at: '2026-05-11T00:00:00Z', result: 'fail', violations_summary: { constraintIds: ['C8'], total: 1 } },
            ],
          },
        }),
        error: null,
      },
      { data: fakeUsulanRow(), error: null }
    );
    await recordValidationAttempt('id1', 'pass');
    expect(cap.update[0].data.validation_attempts).toHaveLength(2);
    expect(cap.update[0].data.validation_attempts[0].result).toBe('fail');
    expect(cap.update[0].data.validation_attempts[1].result).toBe('pass');
  });

  it('throws when usulan not found', async () => {
    mockResponses({ data: null, error: null });
    await expect(recordValidationAttempt('missing', 'pass')).rejects.toThrow(/not found/);
  });
});

// ─── recordManualOverride ──────────────────────────────────────────────────

describe('recordManualOverride', () => {
  it('appends override entry + updates status', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ status: 'berlaku_efektif', data: {} }), error: null },
      { data: fakeUsulanRow({ status: 'ditolak' }), error: null }
    );
    const r = await recordManualOverride('id1', 'ditolak', 'Itjenad temuan audit', 'KPA');
    expect(cap.update[0].status).toBe('ditolak');
    expect(cap.update[0].data.manual_override_log).toHaveLength(1);
    const entry = cap.update[0].data.manual_override_log[0];
    expect(entry.from_state).toBe('berlaku_efektif');
    expect(entry.to_state).toBe('ditolak');
    expect(entry.reason).toBe('Itjenad temuan audit');
    expect(entry.actor).toBe('KPA');
    expect(entry.manual_override).toBe(true);
    expect(r.status).toBe('ditolak');
  });

  it('throws when override reason too short (< 5 char)', async () => {
    mockResponses({ data: fakeUsulanRow({ status: 'draft' }), error: null });
    await expect(
      recordManualOverride('id1', 'ditolak', 'no', 'KPA')
    ).rejects.toThrow(/disallowed/);
  });

  it('throws when from === to (no-op)', async () => {
    mockResponses({ data: fakeUsulanRow({ status: 'draft' }), error: null });
    await expect(
      recordManualOverride('id1', 'draft', 'self-loop test', 'KPA')
    ).rejects.toThrow(/disallowed/);
  });

  it('preserves existing manual_override_log entries (append)', async () => {
    const existing = {
      from_state: 'draft' as const,
      to_state: 'direkomendasi' as const,
      reason: 'previous override',
      actor: 'Renbang',
      timestamp: '2026-05-10T00:00:00Z',
      manual_override: true as const,
    };
    const cap = mockResponses(
      {
        data: fakeUsulanRow({
          status: 'direkomendasi',
          data: { manual_override_log: [existing] },
        }),
        error: null,
      },
      { data: fakeUsulanRow({ status: 'ditolak' }), error: null }
    );
    await recordManualOverride('id1', 'ditolak', 'second override', 'Karumkit');
    expect(cap.update[0].data.manual_override_log).toHaveLength(2);
  });

  it('trims override reason before storage', async () => {
    const cap = mockResponses(
      { data: fakeUsulanRow({ status: 'draft', data: {} }), error: null },
      { data: fakeUsulanRow({ status: 'direkomendasi' }), error: null }
    );
    await recordManualOverride('id1', 'direkomendasi', '   trimmed reason   ', 'Renbang');
    expect(cap.update[0].data.manual_override_log[0].reason).toBe('trimmed reason');
  });

  it('throws when usulan not found', async () => {
    mockResponses({ data: null, error: null });
    await expect(
      recordManualOverride('missing', 'ditolak', 'audit reason', 'KPA')
    ).rejects.toThrow(/not found/);
  });
});

// ─── addPerubahan / listPerubahan ──────────────────────────────────────────

describe('addPerubahan', () => {
  it('inserts row with correct payload', async () => {
    const cap = mockResponses({
      data: {
        id: 'p-1',
        usulan_id: 'u-1',
        pagu_row_id: 'pagu-r-1',
        data: { kode: '521115', nilai_semula: 100, nilai_revisi: 200 },
        created_at: '2026-05-12T00:00:00Z',
      },
      error: null,
    });
    const r = await addPerubahan('u-1', 'pagu-r-1', {
      kode: '521115',
      nilai_semula: 100,
      nilai_revisi: 200,
    });
    expect(cap.from).toEqual(['usulan_revisi_perubahan']);
    expect(cap.insert[0]).toMatchObject({
      usulan_id: 'u-1',
      pagu_row_id: 'pagu-r-1',
      data: { kode: '521115', nilai_semula: 100, nilai_revisi: 200 },
    });
    expect(r.id).toBe('p-1');
  });

  it('throws on error', async () => {
    mockResponses({ data: null, error: { message: 'FK violation' } });
    await expect(
      addPerubahan('u', 'p', { kode: 'x', nilai_semula: 0, nilai_revisi: 1 })
    ).rejects.toThrow(/FK violation/);
  });
});

describe('listPerubahan', () => {
  it('returns mapped array filtered by usulan_id', async () => {
    const cap = mockResponses({
      data: [
        { id: 'p1', usulan_id: 'u1', pagu_row_id: 'r1', data: {}, created_at: 't1' },
        { id: 'p2', usulan_id: 'u1', pagu_row_id: 'r2', data: {}, created_at: 't2' },
      ],
      error: null,
    });
    const r = await listPerubahan('u1');
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe('p1');
    expect(cap.eq).toEqual([{ column: 'usulan_id', value: 'u1' }]);
  });

  it('returns empty when no rows', async () => {
    mockResponses({ data: null, error: null });
    const r = await listPerubahan('u1');
    expect(r).toEqual([]);
  });
});

// ─── snapshot_pok CRUD ─────────────────────────────────────────────────────

describe('createSnapshot', () => {
  it('inserts row + computes total_pagu from pagu_sections (fallback semula when revisi=0)', async () => {
    const paguSections: PaguSection[] = [
      {
        id: 'pagu-2026-x',
        title: 'X',
        rows: [
          { jumlahBiayaAwal: 100, jumlahBiayaRevisi: 150 } as any,
          { jumlahBiayaAwal: 200, jumlahBiayaRevisi: 0 } as any,   // fallback to 200
        ],
      } as any,
    ];

    const cap = mockResponses({
      data: {
        id: 'snap-1',
        tahun_anggaran: 2026,
        tanggal_efektif: '2026-05-15',
        usulan_id: 'u-1',
        snapshot_data: {} as any,
        created_at: 't',
      },
      error: null,
    });

    await createSnapshot('u-1', 2026, '2026-05-15', paguSections);
    expect(cap.from).toEqual(['snapshot_pok']);
    expect(cap.insert[0].snapshot_data.total_pagu).toBe(150 + 200);
    expect(cap.insert[0].snapshot_data.generated_from_usulan_id).toBe('u-1');
  });

  it('includes total_realisasi when provided', async () => {
    const cap = mockResponses({
      data: { id: 's', tahun_anggaran: 2026, tanggal_efektif: '2026-05-15', usulan_id: 'u', snapshot_data: {}, created_at: 't' },
      error: null,
    });
    await createSnapshot('u', 2026, '2026-05-15', [], 999);
    expect(cap.insert[0].snapshot_data.total_realisasi).toBe(999);
  });

  it('omits total_realisasi when undefined', async () => {
    const cap = mockResponses({
      data: { id: 's', tahun_anggaran: 2026, tanggal_efektif: '2026-05-15', usulan_id: 'u', snapshot_data: {}, created_at: 't' },
      error: null,
    });
    await createSnapshot('u', 2026, '2026-05-15', []);
    expect(cap.insert[0].snapshot_data).not.toHaveProperty('total_realisasi');
  });

  it('throws on FK error', async () => {
    mockResponses({ data: null, error: { message: 'FK violation: usulan_id' } });
    await expect(createSnapshot('bad-u', 2026, '2026-05-15', [])).rejects.toThrow(/FK violation/);
  });
});

describe('getSnapshotByDate', () => {
  it('returns snapshot when found', async () => {
    const cap = mockResponses({
      data: {
        id: 'snap-1',
        tahun_anggaran: 2026,
        tanggal_efektif: '2026-05-15',
        usulan_id: 'u-1',
        snapshot_data: {} as any,
        created_at: 't',
      },
      error: null,
    });
    const r = await getSnapshotByDate(2026, '2026-05-15');
    expect(r).not.toBeNull();
    expect(r!.id).toBe('snap-1');
    expect(cap.eq).toContainEqual({ column: 'tahun_anggaran', value: 2026 });
    expect(cap.eq).toContainEqual({ column: 'tanggal_efektif', value: '2026-05-15' });
  });

  it('returns null when no snapshot at date', async () => {
    mockResponses({ data: null, error: null });
    const r = await getSnapshotByDate(2026, '2026-01-01');
    expect(r).toBeNull();
  });
});

describe('listSnapshots', () => {
  it('returns mapped array sorted by tanggal_efektif DESC', async () => {
    const cap = mockResponses({
      data: [
        { id: 's1', tahun_anggaran: 2026, tanggal_efektif: '2026-05-15', usulan_id: 'u1', snapshot_data: {}, created_at: 't' },
        { id: 's2', tahun_anggaran: 2026, tanggal_efektif: '2026-03-01', usulan_id: 'u2', snapshot_data: {}, created_at: 't' },
      ],
      error: null,
    });
    const r = await listSnapshots(2026);
    expect(r).toHaveLength(2);
    expect(r[0].id).toBe('s1');
    expect(cap.order).toEqual([{ column: 'tanggal_efektif', options: { ascending: false } }]);
  });

  it('returns empty when no snapshots', async () => {
    mockResponses({ data: null, error: null });
    const r = await listSnapshots(2099);
    expect(r).toEqual([]);
  });
});

// ─── R7c immutability defense (negative test) ──────────────────────────────

describe('R7c defense — no update*Snapshot* export', () => {
  it('service module DOES NOT export any update*snapshot* / snapshot*update* function', async () => {
    const serviceMod = await import('./usulanRevisiService');
    const exportedNames = Object.keys(serviceMod);
    const offending = exportedNames.filter(
      (n) => /update.*snapshot|snapshot.*update/i.test(n)
    );
    expect(offending).toEqual([]);
  });
});
