/**
 * C8 Validator — Memperhatikan LHR APIP
 *
 * File: utils/validators/c8.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 4)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C8
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 2 (BARU)
 *   - Severity: blocker
 *   - Description: "User wajib explicit acknowledge sudah mempertimbangkan
 *     LHR APIP atas RKA TA berkenaan sebelum submit revisi."
 *   - Decision: SSOT §0.10.1 S3 (App-level state) + S6 (in-memory v1)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C8: User wajib confirm sudah review LHR APIP (Laporan Hasil
 * Reviu Aparatur Pengawas Internal Pemerintah) atas RKA TA berkenaan
 * sebelum mengajukan revisi POK kewenangan KPA.
 *
 * Bukan validation logic terhadap data pagu — ini procedural check:
 * apakah user (Sie Renbang / dr Ferry) sudah explicit acknowledge
 * sebelum tekan tombol Submit Revisi POK.
 *
 * Langkah algoritma (super simple boolean):
 *   1. Read ctx.lhrApipAcknowledged (optional boolean field)
 *   2. Status decision:
 *      - lhrApipAcknowledged === true → 'pass'
 *      - lhrApipAcknowledged === false || undefined → 'pending'
 *        (BUKAN 'fail' — semantic: belum acknowledge, not violated)
 *   3. Tidak iterate sections sama sekali — boolean state aja
 *
 * Tidak ada 'fail' state. Semantic: belum acknowledge ≠ violated.
 * User akan tetap di-prompt checkbox di UI sampai click.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti tanda tangan checklist "Pre-Op Briefing Done" sebelum mulai
 * operasi. Bukan medis — administrative confirmation. Dokter wajib
 * sign off acknowledging sudah review chart pasien + sterile protocol
 * sebelum incision. Kalau belum sign, mesin operasi physical tidak
 * bisa di-start (analogi dengan disable Submit button di UI sampai
 * checkbox di-tick).
 *
 * C8 ini essentially: human-in-the-loop safety gate, BUKAN data check.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.10.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * S3: C8 LHR APIP storage = App-level state per year +
 *     ValidationContext.lhrApipAcknowledged field (SUDAH ADA di types.ts
 *     dari Phase 1 Tier 4a forward-compatible placeholder)
 * S6: v1 persistence = in-memory only saat session. App restart =
 *     re-confirm checkbox. Proper audit trail = Tier 5 scope.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari C1-C7
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C1-C7: data validation (iterate sections, check values)
 * - C8: procedural state check (read context flag, no iteration)
 * - C1-C7: can return pass/warn/fail/pending
 * - C8: returns only pass or pending (no fail — belum acknowledge ≠ violation)
 * - C1-C7: violations array dengan affectedRowIds
 * - C8: pending state ada single violation entry (informational)
 *
 * ────────────────────────────────────────────────────────────────────────
 * UI Integration (Phase 3 Tier 4b)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Phase 3 akan add checkbox di ValidationDashboardHeader:
 *   ☐ Saya konfirmasi sudah review LHR APIP atas RKA TA <year>
 *     sebelum mengajukan revisi POK kewenangan KPA
 *
 * State management:
 *   - App.tsx: lhrApipAcknowledgedByYear: Record<number, boolean>
 *   - Pass via ctx.lhrApipAcknowledged saat runAllValidators called
 *   - Submit button disable selama C8 pending
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - ValidationContext field: utils/validators/types.ts (lhrApipAcknowledged)
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4b.json c8[]
 * - Decisions log: SSOT §0.10.1 S3 + S6
 * - Phase 3 UI plan: docs/TIER-4B-DESIGN.md §5.2
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';

/**
 * Validate C8 — Memperhatikan LHR APIP.
 *
 * Procedural check — bukan data validation. Reads ctx.lhrApipAcknowledged
 * boolean state set oleh user via checkbox di UI.
 *
 * @param ctx ValidationContext dengan optional lhrApipAcknowledged field
 * @returns ConstraintResult status pass (acknowledged) atau pending (not yet)
 */
export function validateC8(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C8;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Read boolean state (default false kalau undefined)
  const acknowledged = ctx.lhrApipAcknowledged === true;

  // Step 2: Status decision — pass jika acknowledged, pending lainnya
  if (acknowledged) {
    return {
      constraintId: 'C8',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'LHR APIP sudah di-acknowledge oleh user — C8 pass',
    };
  }

  // Pending: user belum check checkbox (state false atau undefined)
  return {
    constraintId: 'C8',
    spec,
    status: 'pending',
    violations: [
      {
        constraintId: 'C8',
        severity: 'blocker',
        message: `User belum mengkonfirmasi sudah review LHR APIP atas RKA TA ${ctx.ta} sebelum submit revisi POK. Mohon check checkbox "Saya konfirmasi sudah review LHR APIP" di dashboard Validasi sebelum tekan Submit. Per Pasal 22 huruf b angka 2 Perdirjen Renhan 7/2025 (BARU).`,
        detail: {
          reason: 'lhr_apip_not_acknowledged',
          currentState: ctx.lhrApipAcknowledged ?? null,
          ta: ctx.ta,
        },
      },
    ],
    evaluatedAt,
    summary: 'LHR APIP belum di-acknowledge — pending user confirmation',
  };
}
