/**
 * C7 Validator — Tidak Ubah Sumber Dana
 *
 * File: utils/validators/c7.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 2)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C7
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C7
 *   - Decision: SSOT §0.10.1 S2 (mirror C6 grouping pattern)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C7: "Revisi POK kewenangan KPA tidak boleh mengubah sumber
 * pendanaan akun." Sumber dana diidentifikasi dari field `sumber_dana_kode`
 * langsung — tidak perlu derive (beda dari C6 yang derive dari kode_bas).
 *
 * Klasifikasi 7 sumber dana canonical (per Perdirjen Renhan Pasal 1.24-27):
 *   RM    — Rupiah Murni (APBN)
 *   PNBP  — Penerimaan Negara Bukan Pajak (BPJS, YANMASUM)
 *   PHLN  — Pinjaman/Hibah Luar Negeri (kompositif)
 *   PLN   — Pinjaman Luar Negeri (Pasal 1.24)
 *   PDN   — Pinjaman Dalam Negeri (Pasal 1.25)
 *   SBSN  — Surat Berharga Syariah Negara (Pasal 1.27)
 *   HIBAH — Hibah (Pasal 1.26)
 *
 * Plus escape hatch `string` untuk legacy/uncommon codes — di-treat
 * sebagai opaque value (distinct grouping tetap deterministic).
 *
 * Langkah algoritma (mirror C6 pattern, per Decision S2):
 *   1. Collect SEMUA changed leaf rows dari semua sections
 *      (changed = effectiveAwal ≠ effectiveRevisi, per Decision R1)
 *   2. Untuk setiap changed row, baca field sumber_dana_kode
 *   3. Kalau ada changed row dengan sumber_dana_kode null/empty → 'pending'
 *      (per Decision S5 strict: ANY missing → pending, consistent R2)
 *   4. Kalau semua changed rows punya sumber_dana_kode → cek distinct count:
 *      - 0 changed rows (no revisi) → 'pass' (vacuous)
 *      - 1 distinct sumber → 'pass' (pergeseran dalam 1 sumber = OK)
 *      - 2+ distinct sumber → 'fail' (pergeseran antar-sumber = NOT allowed)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Bayangkan rumah sakit punya dua kantong dana terpisah: kas APBN (RM)
 * dari pemerintah pusat, dan kas BPJS (PNBP) dari layanan medis. Dokter
 * boleh tukar pakai dana dalam kantong yang sama (RM ke RM lain, atau
 * PNBP ke PNBP lain). TAPI tidak boleh "pinjam" dana antar-kantong
 * (mis. dana RM dipakai bayar tagihan BPJS) tanpa approval Eselon I.
 * Itu rule C7 — pergeseran intra-sumber boleh, antar-sumber blocked.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.10.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * S2: C7 algorithm = group changed leaves by sumber_dana_kode (direct),
 *     ≥2 distinct → fail. Mirror C6 dengan substitute field.
 * S5: Missing field handling = pending (R2 strict consistent)
 *
 * Inherited dari §0.9.1 Tier 4a:
 * R1: 'changed row' = effective values via isChangedRow (Konteks 1 consistent)
 * R3: Override mechanism = tetap pending kalau sumber_dana_kode null
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari C6
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C6 derive 2-digit dari kode_bas (preprocessing)
 * - C7 read field langsung (no preprocessing)
 * - C6 jenis belanja: 4 canonical (51/52/53/57)
 * - C7 sumber dana: 7 canonical (RM/PNBP/PHLN/PLN/PDN/SBSN/HIBAH) + escape hatch
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Pattern reference: utils/validators/c6.ts (Tier 4b Turn 1 mirror)
 * - Changed row detection: helpers.isChangedRow + collectChangedLeaves
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4b.json c7[]
 * - Decisions log: SSOT §0.10.1 S2 + S5
 * - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C7
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';
import { collectChangedLeaves } from './helpers';

/**
 * Normalize sumber_dana_kode: trim whitespace. Returns null kalau empty
 * setelah trim. Defensive untuk handle legacy data entry.
 */
function normalizeSumberDana(kode: string | undefined): string | null {
  if (!kode) return null;
  const trimmed = kode.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

/**
 * Validate C7 — Tidak Ubah Sumber Dana.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail/pending + detail
 */
export function validateC7(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C7;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect changed rows across all sections
  const changedRows = collectChangedLeaves(ctx.sections);

  // Step 2: Vacuous pass — no rows changed = no revisi to validate
  if (changedRows.length === 0) {
    return {
      constraintId: 'C7',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'Tidak ada row yang direvisi — C7 vacuous pass',
    };
  }

  // Step 3: Cek apakah ada row dengan sumber_dana_kode missing (pending per S5)
  const rowsMissingSumber = changedRows.filter(
    r => normalizeSumberDana(r.sumber_dana_kode) === null
  );

  if (rowsMissingSumber.length > 0) {
    const affectedRowIds = rowsMissingSumber.map(r => r.id);
    return {
      constraintId: 'C7',
      spec,
      status: 'pending',
      violations: [
        {
          constraintId: 'C7',
          severity: 'blocker',
          affectedRowIds,
          message: `${rowsMissingSumber.length} row yang direvisi belum punya field sumber_dana_kode. Mohon fill metadata via tombol "Terima Rekomendasi" atau "Tandai Manual Reviewed" sebelum validasi C7 bisa dieksekusi.`,
          detail: {
            reason: 'missing_sumber_dana_kode',
            rowIds: affectedRowIds,
            count: rowsMissingSumber.length,
          },
        },
      ],
      evaluatedAt,
      summary: `${rowsMissingSumber.length} row missing sumber_dana_kode — pending fill`,
    };
  }

  // Step 4: All changed rows have sumber_dana_kode → check distinct count
  const sumberList = changedRows
    .map(r => normalizeSumberDana(r.sumber_dana_kode))
    .filter((s): s is string => s !== null);

  const distinctSumber = Array.from(new Set(sumberList));

  if (distinctSumber.length <= 1) {
    // 0 or 1 distinct → PASS (pergeseran dalam 1 sumber dana, atau no changed)
    const sumberLabel = distinctSumber[0] ?? '(none)';
    return {
      constraintId: 'C7',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `${changedRows.length} row direvisi, semua dalam sumber dana ${sumberLabel} — C7 pass`,
    };
  }

  // 2+ distinct → FAIL (pergeseran antar-sumber dana NOT allowed)
  const affectedRowIds = changedRows.map(r => r.id);
  return {
    constraintId: 'C7',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C7',
        severity: 'blocker',
        affectedRowIds,
        message: `Pergeseran POK mencakup ${distinctSumber.length} sumber dana berbeda (${distinctSumber.join(', ')}). Revisi POK kewenangan KPA tidak boleh mengubah sumber pendanaan akun (Pasal 22 huruf b angka 1 Perdirjen Renhan 7/2025). Untuk pergeseran antar-sumber dana (mis. dari RM ke PNBP, atau RM ke PHLN), gunakan revisi DIPA Halaman III via KAPK/Eselon I — bukan revisi POK kewenangan KPA.`,
        detail: {
          distinctSumber,
          count: distinctSumber.length,
          affectedRowCount: changedRows.length,
        },
      },
    ],
    evaluatedAt,
    summary: `${distinctSumber.length} sumber dana berbeda terdeteksi`,
  };
}
