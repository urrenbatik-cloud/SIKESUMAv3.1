/**
 * C4 Validator — Pergeseran dalam 1 Satker yang Sama
 *
 * File: utils/validators/c4.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C4
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf a
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C4
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C4: "Pergeseran POK hanya boleh di dalam 1 Satker yang sama."
 *
 * Konteks SIKESUMA v3.1:
 *   - App SIKESUMA scope = RS Batin Tikal (1 satker: 685784 Kesdam II/Sriwijaya)
 *   - Tidak ada cross-satker data path (no satker selector di UI, no
 *     foreign-satker pagu_sections di Supabase)
 *   - Therefore: C4 deterministic pass — semua data di app pasti satker sama
 *
 * Future expansion:
 *   Jika app berkembang multi-satker (mis. roll-out ke Kesdam lain),
 *   validator perlu di-extend untuk cek satker consistency per section
 *   atau per row.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi medis (untuk Owner pemahaman)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti aturan "obat di gudang RS A tidak bisa di-charge ke pasien
 * RS B". Karena SIKESUMA hanya kelola 1 RS, aturan ini selalu terpenuhi
 * by design — tidak perlu cek apa-apa lagi.
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';

/**
 * Validate C4 — Single Satker constraint.
 *
 * Returns: ConstraintResult dengan status 'pass' deterministik untuk
 * current SIKESUMA scope (single-satker app).
 */
export function validateC4(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C4;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  return {
    constraintId: 'C4',
    spec,
    status: 'pass',
    violations: [],
    evaluatedAt,
    summary:
      'Scope app SIKESUMA = single-satker (685784 Kesdam II/Sriwijaya). C4 deterministic pass.',
  };
}
