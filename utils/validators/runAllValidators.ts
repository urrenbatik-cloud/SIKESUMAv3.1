/**
 * Validation Engine Orchestrator
 *
 * File: utils/validators/runAllValidators.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 3b — UI integration)
 *
 * Single entry point untuk run all validators. Returns aggregate
 * ValidationResult dengan results untuk semua 12 constraint. C1-C5
 * di-run via implemented validators; C6-C12 di-mark sebagai 'todo'
 * placeholder state (rendering-only — not part of ConstraintStatus
 * enum, attached via dedicated marker di summary field).
 *
 * Per §0.9.1 Decision Q7 (default): full re-run on demand — 5 validators
 * × ~38 leaves baseline = ~5ms total, no perf concern. No caching layer.
 *
 * Per §0.9.1 Decision Q4 (default): manual trigger only — caller
 * decides when to invoke (button click, post-Apply Recommendation).
 * This function tidak schedule sendiri.
 *
 * References:
 * - Phase 3 UI design: docs/TIER-4A-PHASE-3-UI-DESIGN.md §9 (file structure)
 * - Decisions: SSOT §0.9.1 Q4 (manual button), Q7 (full re-run on demand)
 * - Phase 2b validators: c1.ts, c2.ts, c3.ts, c4.ts, c5.ts
 */
import {
  CONSTRAINT_SPECS,
  type ConstraintId,
  type ConstraintResult,
  type ConstraintStatus,
  type ValidationContext,
  type ValidationResult,
} from './types';
import { validateC1 } from './c1';
import { validateC2 } from './c2';
import { validateC3 } from './c3';
import { validateC4 } from './c4';
import { validateC5 } from './c5';
import { validateC6 } from './c6';
import { validateC7 } from './c7';
import { validateC8 } from './c8';
import { validateC9 } from './c9';

/**
 * Marker special yang ditandai pada `result.summary` untuk constraint
 * yang validatornya belum di-build (C6-C12 di Phase 3). UI dashboard
 * detect marker ini dan render sebagai 'todo' visual state.
 *
 * Per Phase 3a design doc §4 — 'todo' adalah rendering treatment,
 * BUKAN part of ConstraintStatus enum. Kita simpan ConstraintStatus
 * sebagai 'na' (closest safe default) dan attach marker text.
 */
export const TODO_MARKER = '__TODO__';

/**
 * Sub-branch untuk constraint yang belum implemented. Saat
 * sub-branch 4b ships, hapus 4b entries dari list ini. Saat 4c ships,
 * list jadi empty.
 */
const PENDING_CONSTRAINTS: Record<ConstraintId, '4b' | '4c' | null> = {
  C1: null, C2: null, C3: null, C4: null, C5: null,  // Tier 4a implemented
  C6: null, C7: null, C8: null, C9: null,             // Tier 4b implemented (Phase 2b complete)
  C10: '4c', C11: '4c', C12: '4c',                    // Tier 4c pending
};

/**
 * Cek apakah constraint result mengindikasikan 'todo' rendering state.
 * UI component pakai ini untuk decide visual treatment.
 *
 * @param result ConstraintResult dari ValidationResult.results
 * @returns true kalau constraint belum implemented (Tier 4b/4c)
 */
export function isTodoState(result: ConstraintResult): boolean {
  return result.summary?.startsWith(TODO_MARKER) ?? false;
}

/**
 * Ekstrak sub-branch label dari 'todo' constraint untuk UI display.
 * Returns '4b' atau '4c', atau null kalau bukan todo state.
 */
export function getTodoSubBranch(result: ConstraintResult): '4b' | '4c' | null {
  if (!isTodoState(result)) return null;
  return PENDING_CONSTRAINTS[result.constraintId];
}

/**
 * Build placeholder ConstraintResult untuk constraint yang belum
 * implemented (Tier 4b/4c). Status defaults ke 'na' (closest safe
 * semantic — "not evaluated"); UI detect via TODO_MARKER prefix.
 */
function buildTodoResult(
  constraintId: ConstraintId,
  evaluatedAt: string
): ConstraintResult {
  const spec = CONSTRAINT_SPECS[constraintId];
  const subBranch = PENDING_CONSTRAINTS[constraintId];
  return {
    constraintId,
    spec,
    status: 'na',
    violations: [],
    evaluatedAt,
    summary: `${TODO_MARKER}Akan diimplementasi di Tier ${subBranch}`,
  };
}

/**
 * Orchestrator — run semua validator yang implemented + return aggregate
 * ValidationResult dengan placeholders untuk yang belum.
 *
 * @param ctx ValidationContext (sections + TA + optional fields untuk 4b/4c future)
 * @returns ValidationResult dengan 12 entries (5 live, 7 todo) + aggregate stats
 */
export function runAllValidators(ctx: ValidationContext): ValidationResult {
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Run Phase 2b validators (Tier 4a C1-C5 + Tier 4b C6-C9)
  const liveResults: Record<string, ConstraintResult> = {
    C1: validateC1(ctx),
    C2: validateC2(ctx),
    C3: validateC3(ctx),
    C4: validateC4(ctx),
    C5: validateC5(ctx),
    C6: validateC6(ctx),
    C7: validateC7(ctx),
    C8: validateC8(ctx),
    C9: validateC9(ctx),
  };

  // Build placeholder for Tier 4c constraints (still pending)
  const todoIds: ConstraintId[] = ['C10', 'C11', 'C12'];
  todoIds.forEach(id => {
    liveResults[id] = buildTodoResult(id, evaluatedAt);
  });

  const results = liveResults as Record<ConstraintId, ConstraintResult>;

  // Aggregate stats — count by status. Todo states counted as 'na'
  // di status sense, tapi visual UI render terpisah via isTodoState.
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  let pendingCount = 0;
  let naCount = 0;

  const allIds: ConstraintId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
  allIds.forEach(id => {
    const status: ConstraintStatus = results[id].status;
    if (status === 'pass') passCount++;
    else if (status === 'warn') warnCount++;
    else if (status === 'fail') failCount++;
    else if (status === 'pending') pendingCount++;
    else if (status === 'na') naCount++;
  });

  // canSubmit logic: 0 fail with blocker severity + 0 pending.
  // During Phase 3 (only C1-C5 implemented), canSubmit tetap effectively
  // false karena C6-C12 'na' (todo) — meskipun na tidak block submit by
  // logic, UI dashboard akan render "Submit" button disabled selama
  // 4b+4c belum complete (per Phase 3a design §5 Submit button section).
  const canSubmit = failCount === 0 && pendingCount === 0;

  return {
    ta: ctx.ta,
    evaluatedAt,
    results,
    passCount,
    warnCount,
    failCount,
    pendingCount,
    naCount,
    canSubmit,
  };
}
