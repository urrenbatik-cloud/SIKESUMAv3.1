/**
 * C6 Validator — Tidak Ubah Jenis Belanja (51/52/53/57)
 *
 * File: utils/validators/c6.ts
 * Created: 11 Mei 2026 (Tier 4b Phase 2b Turn 1)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C6
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C6
 *   - Decision: SSOT §0.10.1 S1 (mirror C2/C3 grouping pattern)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C6: "Revisi POK kewenangan KPA tidak boleh menggeser dana
 * antar-jenis belanja." Jenis belanja diidentifikasi dari 2-digit pertama
 * kode_bas (e.g., kode '521115' → jenis '52' Belanja Barang).
 *
 * Klasifikasi 4-letter jenis belanja:
 *   51 — Belanja Pegawai (gaji, honor PNS, tunjangan)
 *   52 — Belanja Barang (operasional, jasa, perjalanan dinas)
 *   53 — Belanja Modal (gedung, alat, kendaraan, software)
 *   57 — Belanja Bantuan Sosial (jarang dipakai di Satker Kemhan)
 *
 * Langkah algoritma (mirror C2/C3 pattern, per Decision S1):
 *   1. Collect SEMUA changed leaf rows dari semua sections
 *      (changed = effectiveAwal ≠ effectiveRevisi, per Decision R1)
 *   2. Untuk setiap changed row, baca field kode_bas
 *      - Derive jenis belanja = kode_bas.slice(0, 2)
 *   3. Kalau ada changed row dengan kode_bas null/empty → status 'pending'
 *      (per Decision S5 strict: ANY missing → pending, consistent R2)
 *   4. Kalau semua changed rows punya kode_bas → cek distinct count
 *      jenis belanja:
 *      - 0 changed rows (no revisi) → 'pass' (vacuous)
 *      - 1 distinct jenis → 'pass' (pergeseran dalam 1 jenis = OK)
 *      - 2+ distinct jenis → 'fail' (pergeseran antar-jenis = NOT allowed)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Bayangkan dokter yang mau revisi rencana operasi pasien — boleh tukar
 * peralatan dalam kategori sama (mis. ganti benang jenis A ke B, semua
 * masih konsumabel/52). TAPI tidak boleh tukar ANTAR-kategori (mis. dana
 * konsumabel 52 dipakai untuk beli alat permanen modal 53) tanpa approval
 * level Eselon I (KAPK Kakesdam). Itu rule C6 — pergeseran intra-jenis
 * boleh, antar-jenis blocked.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.10.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * S1: C6 algorithm = group changed leaves by 2-digit kode_bas, ≥2 distinct → fail
 * S5: Missing field handling = pending (R2 strict consistent)
 *
 * Inherited dari §0.9.1 Tier 4a:
 * R1: 'changed row' = effective values via isChangedRow (Konteks 1 consistent)
 * R3: Override mechanism = tetap pending kalau kode_bas null
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Pattern reference: utils/validators/c2.ts (KRO grouping mirror)
 * - Changed row detection: helpers.isChangedRow + collectChangedLeaves
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4b.json c6[]
 * - Decisions log: SSOT §0.10.1 S1 + S5
 * - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C6
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';
import { collectChangedLeaves } from './helpers';

/**
 * Derive jenis belanja dari kode_bas. Returns 2-digit string atau null
 * kalau kode_bas invalid (< 2 chars setelah trim).
 *
 * Defensive: handle whitespace via trim. Kalau kode_bas hanya 1 char
 * (anomaly), treat as missing (returns null) → caller propagate ke pending.
 */
function deriveJenisBelanja(kodeBas: string | undefined): string | null {
  if (!kodeBas) return null;
  const trimmed = kodeBas.trim();
  if (trimmed.length < 2) return null;
  return trimmed.slice(0, 2);
}

/**
 * Validate C6 — Tidak Ubah Jenis Belanja.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail/pending + detail
 */
export function validateC6(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C6;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect changed rows across all sections
  const changedRows = collectChangedLeaves(ctx.sections);

  // Step 2: Vacuous pass — no rows changed = no revisi to validate
  if (changedRows.length === 0) {
    return {
      constraintId: 'C6',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'Tidak ada row yang direvisi — C6 vacuous pass',
    };
  }

  // Step 3: Cek apakah ada row dengan kode_bas missing/invalid (pending per S5)
  const rowsMissingKodeBas = changedRows.filter(
    r => deriveJenisBelanja(r.kode_bas) === null
  );

  if (rowsMissingKodeBas.length > 0) {
    const affectedRowIds = rowsMissingKodeBas.map(r => r.id);
    return {
      constraintId: 'C6',
      spec,
      status: 'pending',
      violations: [
        {
          constraintId: 'C6',
          severity: 'blocker',
          affectedRowIds,
          message: `${rowsMissingKodeBas.length} row yang direvisi belum punya field kode_bas (atau kode_bas terlalu pendek). Mohon fill metadata via tombol "Terima Rekomendasi" atau "Tandai Manual Reviewed" sebelum validasi C6 bisa dieksekusi.`,
          detail: {
            reason: 'missing_kode_bas',
            rowIds: affectedRowIds,
            count: rowsMissingKodeBas.length,
          },
        },
      ],
      evaluatedAt,
      summary: `${rowsMissingKodeBas.length} row missing kode_bas — pending fill`,
    };
  }

  // Step 4: All changed rows have valid kode_bas → derive jenis + check distinct
  const jenisBelajaList = changedRows
    .map(r => deriveJenisBelanja(r.kode_bas))
    .filter((j): j is string => j !== null);

  const distinctJenis = Array.from(new Set(jenisBelajaList));

  if (distinctJenis.length <= 1) {
    // 0 or 1 distinct → PASS (pergeseran dalam 1 jenis belanja, atau no changed)
    const jenisLabel = distinctJenis[0] ?? '(none)';
    return {
      constraintId: 'C6',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `${changedRows.length} row direvisi, semua dalam jenis belanja ${jenisLabel} — C6 pass`,
    };
  }

  // 2+ distinct → FAIL (pergeseran antar-jenis belanja NOT allowed)
  const affectedRowIds = changedRows.map(r => r.id);
  return {
    constraintId: 'C6',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C6',
        severity: 'blocker',
        affectedRowIds,
        message: `Pergeseran POK mencakup ${distinctJenis.length} jenis belanja berbeda (${distinctJenis.join(', ')}). Revisi POK kewenangan KPA tidak boleh menggeser dana antar-jenis belanja (Pasal 22 huruf b angka 1 Perdirjen Renhan 7/2025). Untuk pergeseran antar-jenis (mis. dari Belanja Barang 52 ke Belanja Modal 53), gunakan revisi DIPA Halaman III via KAPK/Eselon I — bukan revisi POK kewenangan KPA.`,
        detail: {
          distinctJenis,
          count: distinctJenis.length,
          affectedRowCount: changedRows.length,
        },
      },
    ],
    evaluatedAt,
    summary: `${distinctJenis.length} jenis belanja berbeda terdeteksi`,
  };
}
