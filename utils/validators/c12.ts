/**
 * C12 Validator — Deadline 27 Desember TA Berkenaan
 *
 * File: utils/validators/c12.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 1)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C12
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 24 ayat (11) huruf d
 *   - Severity: blocker
 *   - Description: "Submission date < {TA}-12-27. Setelah deadline,
 *     revisi POK harus untuk TA berikutnya."
 *   - Decision: SSOT §0.11.1 T1a (client browser WIB) + T6 (message template)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C12: Pengajuan Revisi POK kewenangan KPA harus diajukan
 * SEBELUM tanggal 27 Desember tahun anggaran berkenaan. Setelah deadline,
 * revisi tidak boleh untuk TA tersebut — harus diajukan untuk TA berikutnya.
 *
 * Procedural check — paling sederhana dari 3 Tier 4c. Tidak iterate
 * sections, hanya date comparison.
 *
 * Langkah algoritma:
 *   1. Read evaluatedAt = ctx.evaluatedAt ?? new Date() (saat ini)
 *   2. Compute deadline = 27 Desember TA jam 00:00 WIB
 *   3. Status decision:
 *      - evaluatedAt < deadline → 'pass' (masih dalam window)
 *      - evaluatedAt >= deadline → 'fail' (deadline missed)
 *   4. Tidak ada 'pending' atau 'warn' state — date selalu defined
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti deadline submission untuk informed consent pre-operasi elektif —
 * harus signed minimal 24 jam sebelum jadwal operasi. Lewat deadline,
 * operasi reschedule ke slot berikutnya, BUKAN forced-through. Sama
 * di sini: lewat 27 Des, revisi reschedule ke TA berikutnya (re-submit
 * dengan ctx.ta + 1).
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.11.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * T1a: Client `new Date()` browser WIB. Default JS behavior, sederhana
 *      untuk v1. Deadline construction pakai explicit `+07:00` offset
 *      untuk deterministic comparison terlepas dari test runner timezone.
 *      Tier 5 audit trail nanti capture server timestamp UTC untuk
 *      authoritative record.
 * T6:  Full Pasal cite + action guidance "ajukan untuk TA berikutnya".
 *      Message template di-embed dalam violation message (BUKAN constant
 *      di types.ts — keep validator self-contained).
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari validator lain
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C1-C7, C9, C10, C11: data validation (iterate sections, check values)
 * - C8: procedural state check (read boolean flag)
 * - C12: procedural date check (read timestamp, compute deadline) ← SIMILAR ke C8
 * - Tidak ada 'pending' atau 'warn' — hanya pass/fail (date selalu defined)
 * - Tidak ada affectedRowIds (global state, BUKAN per-row violation)
 *
 * ────────────────────────────────────────────────────────────────────────
 * UI Integration (Phase 3 Tier 4c)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Phase 3 akan transition C12 dari placeholder 'todo' ke live di
 * runAllValidators.ts. C12 violation tampil di dashboard card C12 —
 * BUKAN inline indicator di Pagu Anggaran (no affectedRowIds, global state).
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - ValidationContext fields: ctx.ta + ctx.evaluatedAt
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4c.json c12[]
 * - Decisions log: SSOT §0.11.1 T1a + T6
 * - Phase 3 UI plan: docs/TIER-4C-DESIGN.md §5.1
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';

/**
 * Construct deadline Date object untuk given TA dengan explicit WIB
 * timezone offset (+07:00). Deterministic terlepas dari runtime
 * timezone — pure data semantic: deadline = 27 Des 00:00 WIB.
 *
 * @param ta Tahun anggaran (mis. 2026)
 * @returns Date object pada 27 Desember TA jam 00:00:00 WIB
 */
function computeDeadline(ta: number): Date {
  // ISO 8601 dengan explicit +07:00 offset (WIB)
  return new Date(`${ta}-12-27T00:00:00+07:00`);
}

/**
 * Validate C12 — Deadline 27 Desember TA Berkenaan.
 *
 * Procedural check — date comparison. Reads ctx.evaluatedAt (defaults ke
 * current Date) terhadap deadline TA berkenaan jam 00:00 WIB.
 *
 * @param ctx ValidationContext dengan ta + optional evaluatedAt
 * @returns ConstraintResult status pass (pre-deadline) atau fail (at/post deadline)
 */
export function validateC12(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C12;

  // Step 1: Determine evaluation timestamp (default: sekarang per T1a)
  const evaluationTime = ctx.evaluatedAt ?? new Date();
  const evaluatedAtIso = evaluationTime.toISOString();

  // Step 2: Compute deadline untuk TA berkenaan
  const deadline = computeDeadline(ctx.ta);

  // Step 3: Comparison — strict less-than = pass, gte = fail
  const isPastDeadline = evaluationTime.getTime() >= deadline.getTime();

  if (!isPastDeadline) {
    // Pre-deadline: pengajuan masih dalam window TA berkenaan
    return {
      constraintId: 'C12',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt: evaluatedAtIso,
      summary: `Pengajuan dalam window TA ${ctx.ta} (sebelum 27 Desember ${ctx.ta}) — C12 pass`,
    };
  }

  // Fail: at-deadline atau post-deadline. Violation message per T6 dengan
  // Pasal cite + action guidance untuk reschedule ke TA berikutnya.
  const evalDateStr = evaluationTime.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const nextTa = ctx.ta + 1;

  return {
    constraintId: 'C12',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C12',
        severity: 'blocker',
        message:
          `Tanggal pengajuan (${evalDateStr}) sudah melewati deadline TA ${ctx.ta} ` +
          `(27 Desember ${ctx.ta} 00:00 WIB). Per Pasal 24 ayat (11) huruf d Perdirjen ` +
          `Renhan 7/2025, Revisi POK kewenangan KPA harus diajukan SEBELUM 27 Desember ` +
          `TA berkenaan. Setelah deadline, revisi POK tidak boleh untuk TA ${ctx.ta} — ` +
          `harus diajukan untuk TA berikutnya. Mohon adjust tahun anggaran ke TA ${nextTa} ` +
          `dan re-submit revisi.`,
        detail: {
          reason: 'deadline_missed',
          ta: ctx.ta,
          evaluatedAt: evaluatedAtIso,
          deadlineIso: deadline.toISOString(),
          nextTa,
        },
      },
    ],
    evaluatedAt: evaluatedAtIso,
    summary: `Deadline TA ${ctx.ta} terlewati — pengajuan harus untuk TA ${nextTa}`,
  };
}
