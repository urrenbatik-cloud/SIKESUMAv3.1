/**
 * C9 Validator — Tidak Boleh Akun Minus
 *
 * File: utils/validators/c9.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 3)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C9
 *   - Pasal: Prinsip umum pelaksanaan APBN (BUKAN Perdirjen-specific)
 *   - Severity: blocker
 *   - Description: "Per row: jumlahBiayaRevisi >= 0. Sanity check untuk
 *     catch data entry typo."
 *   - Decision: SSOT §0.10.1 S4 (per-leaf check, BUKAN net balance)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C9: "Akun pagu tidak boleh negatif." Prinsip umum APBN —
 * tidak ada akun yang boleh punya saldo negatif. Validator ini berfungsi
 * sebagai sanity check untuk catch data entry typo (mis. Sie Renbang
 * input -1000000 instead of 1000000).
 *
 * Langkah algoritma (per Decision S4 — per-leaf check, BUKAN net balance):
 *   1. Collect SEMUA leaf rows (changed maupun unchanged) via
 *      helpers.collectAllLeaves
 *   2. Per leaf: cek field `jumlahBiayaRevisi` LANGSUNG (BUKAN via
 *      effectiveRevisi helper — yang pakai Konteks 1 fallback `hsr > 0`
 *      → kalau hsr negative akan fallback ke hsa, MASK negative typo)
 *   3. Kalau jumlahBiayaRevisi < 0 → tambah ke list violations
 *   4. Status:
 *      - 0 negative leaves → 'pass'
 *      - ≥1 negative leaves → 'fail' (1 violation per negative leaf)
 *
 * Boundary: jumlahBiayaRevisi = 0 → 'pass' (0 ≥ 0 OK, not a violation)
 *
 * Penting — semantic divergence dari C1/C6/C7:
 *   - C1/C6/C7 pakai effectiveRevisi (Konteks 1 fallback, untuk consistent
 *     comparison semantics di pergeseran/grouping logic)
 *   - C9 BYPASS Konteks 1 fallback — tujuan justru catch raw typo input
 *     yang lain validator akan miss karena fallback masks negative
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti checklist akhir sebelum operasi — perawat scan ulang form
 * untuk lihat ada angka aneh atau tanda salah input (mis. dosis obat
 * tertulis "-50 mg" yang jelas typo). C9 lakukan hal sama untuk data
 * pagu — scan semua leaf rows, flag yang nilai akhir minus karena
 * pasti hasil typo. Bukan validation logic kompleks, tapi safety net
 * yang penting sebelum dokumen ditandatangani KPA.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.10.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * S4: C9 algorithm = per-leaf check effectiveRevisi(leaf) >= 0.
 *     BUKAN net balance per kode akun. Match types.ts spec "sanity check
 *     untuk catch data entry typo". Net balance enhancement = potential
 *     Tier 4c atau later.
 *
 * Inherited dari §0.9.1 Tier 4a:
 * R1: Effective value computation via helpers (Konteks 1 consistent)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari C6/C7
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C6/C7: group changed leaves + distinct count check
 * - C9: per-leaf direct check on effective value
 * - C6/C7: 1 aggregate violation if fail
 * - C9: 1 violation per negative leaf (multiple violations possible)
 * - C6/C7: ALL leaves consideration (changed only)
 * - C9: ALL leaves consideration (no filter — catch typo anywhere)
 * - C6/C7: pending state possible (missing field)
 * - C9: no pending state (just pass or fail)
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Effective value: helpers.effectiveRevisi (SSOT §0.7.3)
 * - Leaf detection: helpers.collectAllLeaves (refactor from Phase 2b Turn 4)
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4b.json c9[]
 * - Decisions log: SSOT §0.10.1 S4
 * - Pattern reference: utils/validators/c5.ts (collectAllLeaves usage)
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
  type ConstraintViolation,
} from './types';
import { collectAllLeaves, formatRupiah } from './helpers';

/**
 * Validate C9 — Tidak Boleh Akun Minus.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail + per-leaf violations
 */
export function validateC9(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C9;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect ALL leaf rows (no filter — catch typo anywhere)
  const allLeaves = collectAllLeaves(ctx.sections);

  // Step 2: Per leaf, check jumlahBiayaRevisi field LANGSUNG (BUKAN via
  // effectiveRevisi helper — yang fallback masks negative typo)
  const violations: ConstraintViolation[] = [];

  for (const leaf of allLeaves) {
    const revisiValue = leaf.jumlahBiayaRevisi ?? 0;

    // Defensive: NaN comparison returns false, so NaN rows not flagged
    if (revisiValue < 0) {
      violations.push({
        constraintId: 'C9',
        severity: 'blocker',
        affectedRowIds: [leaf.id],
        message: `Akun "${leaf.kode}" (${leaf.description ?? '-'}) punya nilai revisi negatif: ${formatRupiah(revisiValue)}. Akun tidak boleh minus per prinsip umum pelaksanaan APBN. Kemungkinan typo input — verify hargaSatuanRevisi dan volume sebelum submit.`,
        detail: {
          rowId: leaf.id,
          kode: leaf.kode,
          jumlahBiayaRevisi: revisiValue,
          hargaSatuanRevisi: leaf.hargaSatuanRevisi,
          hargaSatuanAwal: leaf.hargaSatuanAwal,
          volume: leaf.volume,
        },
      });
    }
  }

  // Step 3: Status decision
  if (violations.length === 0) {
    return {
      constraintId: 'C9',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `${allLeaves.length} leaf rows scanned — semua nilai revisi ≥ 0 (C9 pass)`,
    };
  }

  // ≥1 negative → FAIL with one violation per negative leaf
  return {
    constraintId: 'C9',
    spec,
    status: 'fail',
    violations,
    evaluatedAt,
    summary: `${violations.length} akun minus terdeteksi — kemungkinan typo data entry`,
  };
}
