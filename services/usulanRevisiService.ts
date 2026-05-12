// ============================================================================
// SIKESUMA Tier 5a Phase 2.3 — Service Layer for Usulan Revisi POK
// ============================================================================
// File          : services/usulanRevisiService.ts
// Tier/Phase    : Tier 5a — Phase 2.3 (Supabase CRUD wrapper)
// Reference     : docs/TIER-5-DESIGN.md §3 schema + §8.1 Phase 2 deliverable
// Decisions     : R1c hybrid schema (columned + JSONB) — TIDAK pakai
//                 fetchEnvelope/saveEnvelope generic helpers di lib/supabase.ts
//                 karena schema BUKAN pure envelope (lihat preflight finding #1).
//
// CRUD operations:
//   • createUsulanDraft        → INSERT status='draft'
//   • getUsulanById            → SELECT by PK
//   • listUsulan(filter?)      → SELECT with filter (status/tahun/jenis)
//   • transitionUsulan         → UPDATE status (validated via state machine)
//   • recordValidationAttempt  → APPEND data.validation_attempts[]
//   • recordManualOverride     → UPDATE status + APPEND data.manual_override_log[]
//   • addPerubahan             → INSERT usulan_revisi_perubahan row
//   • listPerubahan            → SELECT by usulan_id
//   • createSnapshot           → INSERT snapshot_pok (NO update — R7c)
//   • getSnapshotByDate        → SELECT by (tahun, tanggal_efektif)
//
// CRITICAL R7c: NO updateSnapshot function exposed. App-layer defense
// (DB trigger snapshot_pok_immutable already enforces at storage layer).
//
// Error handling: throws Error dengan PostgrestError.message untuk caller
// (App.tsx) UI surface. Service tidak swallow errors.
// ============================================================================

import { supabase } from '../lib/supabase';
import {
  validateTransition,
  type TransitionContext,
  type TransitionResult,
} from '../utils/usulanRevisiStateMachine';
import type {
  PaguSection,
  UsulanRevisi,
  UsulanRevisiData,
  UsulanRevisiPerubahan,
  UsulanRevisiPerubahanData,
  UsulanStatus,
  UsulanJenis,
  UsulanValidationAttempt,
  UsulanManualOverrideEntry,
  SnapshotPok,
  SnapshotPokData,
} from '../types';

// ─── Type helpers ──────────────────────────────────────────────────────────

/**
 * Filter untuk listUsulan. Semua optional — kalau kosong, returns all rows.
 */
export interface UsulanListFilter {
  status?: UsulanStatus;
  tahun_anggaran?: number;
  jenis?: UsulanJenis;
}

/**
 * Composite result dari transitionUsulan — mengembalikan updated row +
 * state machine result (untuk inspect sideEffects + isOverride).
 */
export interface TransitionUsulanResult {
  usulan: UsulanRevisi;
  result: TransitionResult;
}

// ─── DB row → typed interface mappers ──────────────────────────────────────

// Row dari Supabase sudah match shape interface (R1c hybrid: columned + JSONB).
// Mapper minimal — defensive defaults untuk nullable JSONB.

function rowToUsulan(row: any): UsulanRevisi {
  return {
    id: row.id,
    status: row.status,
    tahun_anggaran: row.tahun_anggaran,
    jenis: row.jenis,
    data: (row.data ?? {}) as UsulanRevisiData,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToPerubahan(row: any): UsulanRevisiPerubahan {
  return {
    id: row.id,
    usulan_id: row.usulan_id,
    pagu_row_id: row.pagu_row_id,
    data: (row.data ?? {}) as UsulanRevisiPerubahanData,
    created_at: row.created_at,
  };
}

function rowToSnapshot(row: any): SnapshotPok {
  return {
    id: row.id,
    tahun_anggaran: row.tahun_anggaran,
    tanggal_efektif: row.tanggal_efektif,
    usulan_id: row.usulan_id,
    snapshot_data: row.snapshot_data as SnapshotPokData,
    created_at: row.created_at,
  };
}

// ─── usulan_revisi CRUD ────────────────────────────────────────────────────

/**
 * Create new usulan revisi in 'draft' state.
 * Returns the newly created row (with server-generated id + timestamps).
 */
export async function createUsulanDraft(
  tahun_anggaran: number,
  jenis: UsulanJenis,
  initialData: Partial<UsulanRevisiData> = {}
): Promise<UsulanRevisi> {
  const { data, error } = await supabase
    .from('usulan_revisi')
    .insert({
      status: 'draft',
      tahun_anggaran,
      jenis,
      data: initialData,
    })
    .select()
    .single();
  if (error) throw new Error(`createUsulanDraft failed: ${error.message}`);
  if (!data) throw new Error('createUsulanDraft returned no row');
  return rowToUsulan(data);
}

/**
 * Fetch usulan by primary key UUID. Returns null when not found.
 */
export async function getUsulanById(id: string): Promise<UsulanRevisi | null> {
  const { data, error } = await supabase
    .from('usulan_revisi')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getUsulanById failed: ${error.message}`);
  return data ? rowToUsulan(data) : null;
}

/**
 * List usulan with optional filter. Sorted by created_at DESC (newest first).
 */
export async function listUsulan(filter: UsulanListFilter = {}): Promise<UsulanRevisi[]> {
  let q = supabase.from('usulan_revisi').select('*');
  if (filter.status !== undefined) q = q.eq('status', filter.status);
  if (filter.tahun_anggaran !== undefined) q = q.eq('tahun_anggaran', filter.tahun_anggaran);
  if (filter.jenis !== undefined) q = q.eq('jenis', filter.jenis);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(`listUsulan failed: ${error.message}`);
  return (data ?? []).map(rowToUsulan);
}

/**
 * Transit usulan ke new status via state machine validation.
 *
 * Behavior:
 *   1. Fetch current usulan
 *   2. Build TransitionContext (merge defaults + caller-provided ctx)
 *   3. validateTransition() — caller responsible if disallowed
 *   4. If allowed: UPDATE status (+ updated_at auto). data NOT modified.
 *      For audit log append, use recordValidationAttempt / recordManualOverride.
 *   5. Returns updated row + state machine result (sideEffects for caller).
 *
 * Side effects (e.g. create_snapshot for rule #4) — caller responsible to
 * execute via separate createSnapshot() call after seeing result.sideEffects.
 * Service does NOT auto-create snapshot — keep CRUD operations composable.
 */
export async function transitionUsulan(
  id: string,
  toStatus: UsulanStatus,
  ctxOverrides: Partial<Omit<TransitionContext, 'fromStatus' | 'toStatus' | 'usulan'>> = {}
): Promise<TransitionUsulanResult> {
  const current = await getUsulanById(id);
  if (!current) throw new Error(`transitionUsulan: usulan id=${id} not found`);

  const ctx: TransitionContext = {
    fromStatus: current.status,
    toStatus,
    usulan: current,
    ...ctxOverrides,
  };
  const result = validateTransition(ctx);
  if (!result.allowed) {
    return { usulan: current, result };
  }

  // Update status only — log entries handled by record* functions
  const { data, error } = await supabase
    .from('usulan_revisi')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`transitionUsulan UPDATE failed: ${error.message}`);
  if (!data) throw new Error('transitionUsulan UPDATE returned no row');
  return { usulan: rowToUsulan(data), result };
}

/**
 * Append validation_attempts[] entry ke usulan.data. Useful saat Submit fired
 * (capture pass/fail + violations summary untuk Itjenad audit trail).
 *
 * Uses read-modify-write — bukan atomic dengan transitionUsulan. Acceptable
 * untuk V1 single-user (R5a). V2 multi-user → switch to RPC/CTE.
 */
export async function recordValidationAttempt(
  id: string,
  attemptResult: 'pass' | 'fail' | 'pending',
  violations?: { constraintIds: string[]; total: number }
): Promise<UsulanRevisi> {
  const current = await getUsulanById(id);
  if (!current) throw new Error(`recordValidationAttempt: usulan id=${id} not found`);

  const entry: UsulanValidationAttempt = {
    attempted_at: new Date().toISOString(),
    result: attemptResult,
    ...(violations && attemptResult !== 'pass' ? { violations_summary: violations } : {}),
  };
  const newData: UsulanRevisiData = {
    ...current.data,
    validation_attempts: [...(current.data.validation_attempts ?? []), entry],
  };

  const { data, error } = await supabase
    .from('usulan_revisi')
    .update({ data: newData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`recordValidationAttempt UPDATE failed: ${error.message}`);
  if (!data) throw new Error('recordValidationAttempt UPDATE returned no row');
  return rowToUsulan(data);
}

/**
 * R6+ Manual Override — transit state + append manual_override_log[] entry.
 *
 * Behavior:
 *   1. Fetch current usulan
 *   2. validateTransition with isManualOverride=true
 *   3. If allowed: UPDATE status + append log entry. Both di same UPDATE call
 *      untuk atomicity (read-modify-write — acceptable V1 single-user).
 *   4. Returns updated row.
 *
 * Throws if override disallowed (e.g. reason < 5 char, no-op).
 */
export async function recordManualOverride(
  id: string,
  toStatus: UsulanStatus,
  reason: string,
  actor: string
): Promise<UsulanRevisi> {
  const current = await getUsulanById(id);
  if (!current) throw new Error(`recordManualOverride: usulan id=${id} not found`);

  const ctx: TransitionContext = {
    fromStatus: current.status,
    toStatus,
    usulan: current,
    isManualOverride: true,
    overrideReason: reason,
  };
  const result = validateTransition(ctx);
  if (!result.allowed) {
    throw new Error(`recordManualOverride disallowed: ${result.reason ?? 'unknown'}`);
  }

  const entry: UsulanManualOverrideEntry = {
    from_state: current.status,
    to_state: toStatus,
    reason: reason.trim(),
    actor,
    timestamp: new Date().toISOString(),
    manual_override: true,
  };
  const newData: UsulanRevisiData = {
    ...current.data,
    manual_override_log: [...(current.data.manual_override_log ?? []), entry],
  };

  const { data, error } = await supabase
    .from('usulan_revisi')
    .update({
      status: toStatus,
      data: newData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`recordManualOverride UPDATE failed: ${error.message}`);
  if (!data) throw new Error('recordManualOverride UPDATE returned no row');
  return rowToUsulan(data);
}

// ─── usulan_revisi_perubahan CRUD ──────────────────────────────────────────

/**
 * INSERT per-row diff entry untuk usulan. Caller bisa panggil multiple kali
 * untuk batch insert beberapa perubahan dalam 1 usulan.
 */
export async function addPerubahan(
  usulan_id: string,
  pagu_row_id: string,
  perubahanData: UsulanRevisiPerubahanData
): Promise<UsulanRevisiPerubahan> {
  const { data, error } = await supabase
    .from('usulan_revisi_perubahan')
    .insert({
      usulan_id,
      pagu_row_id,
      data: perubahanData,
    })
    .select()
    .single();
  if (error) throw new Error(`addPerubahan failed: ${error.message}`);
  if (!data) throw new Error('addPerubahan returned no row');
  return rowToPerubahan(data);
}

/**
 * List all perubahan rows untuk a specific usulan. Sorted by created_at ASC.
 */
export async function listPerubahan(usulan_id: string): Promise<UsulanRevisiPerubahan[]> {
  const { data, error } = await supabase
    .from('usulan_revisi_perubahan')
    .select('*')
    .eq('usulan_id', usulan_id)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`listPerubahan failed: ${error.message}`);
  return (data ?? []).map(rowToPerubahan);
}

// ─── snapshot_pok CRUD (NO UPDATE — R7c defense in depth) ─────────────────

/**
 * INSERT snapshot_pok row. R2b full snapshot (entire pagu state at moment).
 * R7c immutability: NO updateSnapshot function exposed. DB trigger
 * snapshot_pok_immutable BEFORE UPDATE acts as final enforcement layer.
 *
 * Caller responsibility:
 *   - Pass full PaguSection[] array (not delta)
 *   - tanggal_efektif = ISO date YYYY-MM-DD (=tanggal_penetapan SK)
 *
 * Computes total_pagu inside untuk skip caller calculation.
 */
export async function createSnapshot(
  usulan_id: string,
  tahun_anggaran: number,
  tanggal_efektif: string,
  pagu_sections: PaguSection[],
  total_realisasi?: number
): Promise<SnapshotPok> {
  // Fallback semantic: revisi=0 means "row not revised", use awal value.
  // Uses || (not ??) intentionally — 0 is a valid "no revision" sentinel.
  const total_pagu = pagu_sections.reduce((sum, section) => {
    return sum + section.rows.reduce((s, row) => s + (row.jumlahBiayaRevisi || row.jumlahBiayaAwal || 0), 0);
  }, 0);

  const snapshot_data: SnapshotPokData = {
    pagu_sections,
    total_pagu,
    ...(total_realisasi !== undefined ? { total_realisasi } : {}),
    generated_from_usulan_id: usulan_id,
    generated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('snapshot_pok')
    .insert({
      tahun_anggaran,
      tanggal_efektif,
      usulan_id,
      snapshot_data,
    })
    .select()
    .single();
  if (error) throw new Error(`createSnapshot failed: ${error.message}`);
  if (!data) throw new Error('createSnapshot returned no row');
  return rowToSnapshot(data);
}

/**
 * Time-travel viewer — fetch snapshot at specific tanggal_efektif untuk a year.
 * Returns null if no snapshot exists for that date.
 *
 * Note: assumes 1 snapshot per (tahun, tanggal) — enforce via business logic
 * (Phase 5b UI prevents duplicate insert at same date).
 */
export async function getSnapshotByDate(
  tahun_anggaran: number,
  tanggal_efektif: string
): Promise<SnapshotPok | null> {
  const { data, error } = await supabase
    .from('snapshot_pok')
    .select('*')
    .eq('tahun_anggaran', tahun_anggaran)
    .eq('tanggal_efektif', tanggal_efektif)
    .maybeSingle();
  if (error) throw new Error(`getSnapshotByDate failed: ${error.message}`);
  return data ? rowToSnapshot(data) : null;
}

/**
 * List all snapshots untuk a tahun (sorted by tanggal_efektif DESC).
 * Berguna untuk time-travel viewer dropdown (Phase 5b).
 */
export async function listSnapshots(tahun_anggaran: number): Promise<SnapshotPok[]> {
  const { data, error } = await supabase
    .from('snapshot_pok')
    .select('*')
    .eq('tahun_anggaran', tahun_anggaran)
    .order('tanggal_efektif', { ascending: false });
  if (error) throw new Error(`listSnapshots failed: ${error.message}`);
  return (data ?? []).map(rowToSnapshot);
}

// NOTE: Intentionally NO updateSnapshot() function. R7c immutability
// enforced via:
//   1. DB trigger snapshot_pok_immutable BEFORE UPDATE (storage layer)
//   2. Absence of UPDATE function in this service module (app layer)
// Both layers must agree. If a future developer adds updateSnapshot here,
// they must FIRST drop the DB trigger and document the R7c regression.
