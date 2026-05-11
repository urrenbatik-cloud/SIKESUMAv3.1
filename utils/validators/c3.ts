/**
 * C3 Validator — Pergeseran dalam 1 Kegiatan yang Sama
 *
 * File: utils/validators/c3.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 2)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C3
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf a angka 1
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C3
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C3: "Pergeseran POK hanya boleh di dalam 1 Kegiatan yang sama."
 *
 * Langkah algoritma:
 *   1. Collect SEMUA changed leaf rows dari semua sections
 *      (changed = effectiveAwal ≠ effectiveRevisi, per Decision R1)
 *   2. Untuk setiap changed row, baca field kegiatan_code (dari Tier 3 metadata)
 *   3. Kalau ada changed row dengan kegiatan_code null/empty → status 'pending'
 *      (per Decision R2 strict: ANY missing → pending)
 *   4. Kalau semua changed rows punya kegiatan_code → cek distinct count:
 *      - 0 changed rows (no revisi) → 'pass' (vacuous)
 *      - 1 distinct kegiatan_code → 'pass'
 *      - 2+ distinct kegiatan_codes → 'fail'
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi medis (untuk Owner pemahaman)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti "service line consistency check":
 * - Anggaran "operasi bedah saraf" tidak boleh dipakai untuk "anestesi"
 * - Walaupun keduanya di RS yang sama (C4 pass), tetap beda service line
 *
 * Untuk RS Batin Tikal:
 * - Kegiatan ini deterministic = "6507" (Penyelenggaraan Kesehatan Matra Darat)
 * - Practically, C3 hampir selalu pass selama metadata Tier 3 sudah HIGH
 * - C3 fail hanya kalau ada row salah-tag (defensive check, catches typo)
 *
 * Pending status analoginya: "informasi penting belum diisi" — seperti dokter
 * tidak bisa decide diagnosis kalau hasil lab key parameter belum ada.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Captured (Owner-approved 11 Mei 2026)
 * ────────────────────────────────────────────────────────────────────────
 *
 * R1: Definisi "changed row" = pakai effective values (consistent dengan C1)
 * R2: Pending threshold = strict (ANY changed row missing kegiatan_code → pending)
 * R3: Override mechanism = tetap pending kalau kegiatan_code null
 *     (override only forces confidence, tidak fill data)
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Leaf detection: SSOT §0.7.2 (via helpers.isLeaf)
 * - Effective value: SSOT §0.7.3 (via helpers.effectiveAwal/Revisi)
 * - Changed row detection: helpers.isChangedRow
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4a.json c3[]
 * - Decisions log: SSOT §0.9.1 + §0.9.4
 */
import type { PaguRow } from '../../types';
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';
import { collectChangedLeaves } from './helpers';

/**
 * Validate C3 — Pergeseran dalam 1 Kegiatan yang Sama.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail/pending + detail
 */
export function validateC3(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C3;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect changed rows across all sections
  const changedRows = collectChangedLeaves(ctx.sections);

  // Step 2: Vacuous pass — no rows changed = no revisi to validate
  if (changedRows.length === 0) {
    return {
      constraintId: 'C3',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'Tidak ada row yang direvisi — C3 vacuous pass',
    };
  }

  // Step 3: Cek apakah ada row dengan kegiatan_code missing (pending case)
  const rowsMissingKegiatan = changedRows.filter(r => !r.kegiatan_code);

  if (rowsMissingKegiatan.length > 0) {
    const affectedRowIds = rowsMissingKegiatan.map(r => r.id);
    return {
      constraintId: 'C3',
      spec,
      status: 'pending',
      violations: [
        {
          constraintId: 'C3',
          severity: 'blocker',
          affectedRowIds,
          message: `${rowsMissingKegiatan.length} row yang direvisi belum punya field kegiatan_code. Mohon fill metadata via tombol "Terima Rekomendasi" atau "Tandai Manual Reviewed" sebelum validasi C3 bisa dieksekusi.`,
          detail: {
            reason: 'missing_kegiatan_code',
            rowIds: affectedRowIds,
            count: rowsMissingKegiatan.length,
          },
        },
      ],
      evaluatedAt,
      summary: `${rowsMissingKegiatan.length} row missing kegiatan_code — pending fill`,
    };
  }

  // Step 4: All changed rows have kegiatan_code → check distinct count
  const distinctKegiatanCodes = Array.from(
    new Set(changedRows.map(r => r.kegiatan_code).filter((c): c is string => Boolean(c)))
  );

  if (distinctKegiatanCodes.length <= 1) {
    // 0 or 1 distinct → PASS
    const kegiatanLabel = distinctKegiatanCodes[0] ?? '(none)';
    return {
      constraintId: 'C3',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `${changedRows.length} row direvisi, semua dalam Kegiatan ${kegiatanLabel} — C3 pass`,
    };
  }

  // 2+ distinct → FAIL
  const affectedRowIds = changedRows.map(r => r.id);
  return {
    constraintId: 'C3',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C3',
        severity: 'blocker',
        affectedRowIds,
        message: `Pergeseran POK mencakup ${distinctKegiatanCodes.length} Kegiatan berbeda (${distinctKegiatanCodes.join(', ')}). Revisi POK kewenangan KPA hanya boleh dalam 1 Kegiatan yang sama (Pasal 22 huruf a angka 1). Untuk pergeseran antar-Kegiatan, eskalasi ke revisi DIPA Halaman III.`,
        detail: {
          distinctKegiatanCodes,
          count: distinctKegiatanCodes.length,
          affectedRowCount: changedRows.length,
        },
      },
    ],
    evaluatedAt,
    summary: `${distinctKegiatanCodes.length} Kegiatan berbeda terdeteksi`,
  };
}
