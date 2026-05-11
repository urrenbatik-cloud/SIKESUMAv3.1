/**
 * Row-to-Constraint Mapping Helper
 *
 * File: utils/validators/rowConstraintMap.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 3c — inline indicators di Pagu Anggaran)
 *
 * Given ValidationResult, produce a Map<rowId, ConstraintInfo[]> yang
 * dipakai oleh PaguAnggaran tab untuk render inline indicators (colored
 * dot per leaf row).
 *
 * Per Phase 3a design doc §7.2: dot color = highest severity constraint
 * yang affect row (red > amber > blue > slate).
 *
 * Per §7.4: click dot → navigate ke dashboard dengan first violation
 * (constraint paling severe). Helper `pickPriorityConstraint` return
 * id yang harus auto-expand di dashboard.
 *
 * References:
 * - Phase 3a design: docs/TIER-4A-PHASE-3-UI-DESIGN.md §7 (inline indicators)
 * - Validators source: c1.ts..c5.ts violations dengan affectedRowIds
 */
import type {
  ConstraintId,
  ConstraintResult,
  ConstraintStatus,
  ValidationResult,
} from './types';
import { isTodoState } from './runAllValidators';

/**
 * Info untuk satu (row × constraint) entry — dipakai tooltip + click handler.
 */
export interface RowConstraintEntry {
  constraintId: ConstraintId;
  status: ConstraintStatus;
  title: string; // copy dari spec.title untuk tooltip
}

/**
 * Build Map dari rowId ke list constraints yang affect row tersebut.
 *
 * Iterasi semua 12 ConstraintResult, untuk setiap violation yang punya
 * `affectedRowIds`, akumulasi ke map[rowId] = [...constraintEntries].
 *
 * Excludes:
 * - Todo state results (C6-C12 placeholder — no real violations)
 * - Pass status (no violations to flag)
 * - Na status (no actionable info)
 *
 * Includes:
 * - Fail, warn, pending statuses dengan affectedRowIds populated
 *
 * @param result ValidationResult dari runAllValidators
 * @returns Map<rowId, RowConstraintEntry[]>
 */
export function buildRowConstraintMap(
  result: ValidationResult
): Map<string, RowConstraintEntry[]> {
  const map = new Map<string, RowConstraintEntry[]>();

  const allIds: ConstraintId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];

  allIds.forEach(id => {
    const r: ConstraintResult = result.results[id];

    // Skip todo placeholder (no real violations)
    if (isTodoState(r)) return;

    // Skip status yang tidak punya actionable indicator
    if (r.status === 'pass' || r.status === 'na') return;

    // Iterasi violations, akumulasi ke map per affected row
    r.violations.forEach(v => {
      v.affectedRowIds?.forEach(rowId => {
        if (!map.has(rowId)) map.set(rowId, []);
        map.get(rowId)!.push({
          constraintId: id,
          status: r.status,
          title: r.spec.title,
        });
      });
    });
  });

  return map;
}

/**
 * Severity priority untuk pilih warna dot — fail > warn > pending > slate.
 * Higher number = higher priority.
 */
const SEVERITY_PRIORITY: Record<ConstraintStatus, number> = {
  fail: 3,
  warn: 2,
  pending: 1,
  pass: 0,
  na: 0,
};

/**
 * Dot color mapping per highest severity.
 */
const DOT_COLOR_BY_SEVERITY: Record<ConstraintStatus, string> = {
  fail: 'bg-red-500',
  warn: 'bg-amber-500',
  pending: 'bg-blue-500',
  pass: '',
  na: '',
};

/**
 * Untuk row dengan multiple constraint entries, return:
 * - dot color (highest severity)
 * - priority constraint untuk click handler (auto-expand di dashboard)
 *
 * Priority constraint = highest-severity entry; tie-break dengan urutan
 * canonical ConstraintId (C1 sebelum C2, dst.).
 *
 * @param entries Array RowConstraintEntry untuk satu row
 * @returns Color class + priorityConstraintId, atau null kalau entries empty
 */
export function pickPriorityIndicator(
  entries: RowConstraintEntry[]
): { color: string; priorityConstraintId: ConstraintId; topStatus: ConstraintStatus } | null {
  if (entries.length === 0) return null;

  // Sort by severity DESC, then by ConstraintId ASC (canonical order)
  const sorted = [...entries].sort((a, b) => {
    const sevA = SEVERITY_PRIORITY[a.status];
    const sevB = SEVERITY_PRIORITY[b.status];
    if (sevA !== sevB) return sevB - sevA;
    // Same severity → canonical ConstraintId order
    return a.constraintId.localeCompare(b.constraintId, undefined, { numeric: true });
  });

  const top = sorted[0];
  const color = DOT_COLOR_BY_SEVERITY[top.status];

  // Safety: skip if status doesn't have actionable color
  if (!color) return null;

  return {
    color,
    priorityConstraintId: top.constraintId,
    topStatus: top.status,
  };
}

/**
 * Build tooltip text untuk hover state. Lists semua constraints yang
 * affect row dengan status indicator.
 *
 * Example output:
 * "Row ini affect:
 *  ❌ C2 — Pergeseran dalam 1 KRO yang Sama
 *  ⏸️ C5 — Volume dan Satuan RO Tidak Berubah
 *  Klik untuk lihat detail"
 *
 * Native HTML title attribute (multi-line via \n).
 */
export function buildTooltipText(entries: RowConstraintEntry[]): string {
  if (entries.length === 0) return '';

  // Sort sama dengan pickPriorityIndicator (highest severity first)
  const sorted = [...entries].sort((a, b) => {
    const sevA = SEVERITY_PRIORITY[a.status];
    const sevB = SEVERITY_PRIORITY[b.status];
    if (sevA !== sevB) return sevB - sevA;
    return a.constraintId.localeCompare(b.constraintId, undefined, { numeric: true });
  });

  const STATUS_ICON: Record<ConstraintStatus, string> = {
    fail: '❌',
    warn: '⚠️',
    pending: '⏸️',
    pass: '✅',
    na: '⊘',
  };

  const lines = ['Row ini affect:'];
  sorted.forEach(e => {
    const icon = STATUS_ICON[e.status];
    lines.push(`  ${icon} ${e.constraintId} ${e.status.toUpperCase()} — ${e.title}`);
  });
  lines.push('');
  lines.push('Klik untuk lihat detail');

  return lines.join('\n');
}
