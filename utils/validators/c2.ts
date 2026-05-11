/**
 * C2 Validator — Pergeseran dalam 1 KRO yang Sama
 *
 * File: utils/validators/c2.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 3)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C2
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf a
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C2 + §3.5
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C2: "Pergeseran POK hanya boleh di dalam 1 KRO yang sama
 * (untuk skema 5.a), atau 1 RO yang sama (untuk skema 5.b/5.c)."
 *
 * Langkah algoritma (v1 — skema 5.a default):
 *   1. Collect SEMUA changed leaf rows dari semua sections
 *      (changed = effectiveAwal ≠ effectiveRevisi, per Decision R1)
 *   2. Untuk setiap changed row, baca field kro_code (dari Tier 3 metadata)
 *   3. Kalau ada changed row dengan kro_code null/empty → status 'pending'
 *      (per Decision R2 strict: ANY missing → pending)
 *   4. Kalau semua changed rows punya kro_code → cek distinct count:
 *      - 0 changed rows (no revisi) → 'pass' (vacuous)
 *      - 1 distinct kro_code → 'pass'
 *      - 2+ distinct kro_codes → 'fail'
 *
 * ────────────────────────────────────────────────────────────────────────
 * Cakupan Skema 5.a vs 5.b/5.c (per master domain §3.5)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Master domain §3.2 + §3.3 mendefinisikan:
 *   - Skema 5.a: pergeseran antar-RO dalam 1 KRO → group by kro_code
 *   - Skema 5.b: pergeseran dalam 1 RO → group by ro_code
 *   - Skema 5.c: penambahan/perubahan akun dalam 1 RO → group by ro_code
 *
 * v1 implementation (Turn 3): group by kro_code saja. Asumsi: mayoritas
 * use case di RS Batin Tikal adalah skema 5.a (Konteks Sie Renbang).
 * Untuk skema 5.b/5.c di future, validator perlu di-extend untuk:
 *   - Auto-detect skema dari data shape (mis. semua changed rows share
 *     kro_code yang sama → masuk ke RO-level check)
 *   - Atau pass skema parameter explicit dari UI
 * Defer ke Tier 4a Phase 3 (UI integration) atau Tier 4b expansion.
 *
 * Konsekuensi v1: skenario yang sebenarnya valid sebagai 5.b/5.c bisa
 * mungkin LOLOS C2 (karena kro_code sama) — yang correct. Tapi kalau
 * skenario lintas-KRO yang sebenarnya invalid juga di-blok dengan benar.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi medis (untuk Owner pemahaman)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti "department transfer constraint":
 * - Pergeseran budget di dalam 1 departemen (KRO) → OK, kewenangan Karumkit
 * - Pergeseran lintas departemen (KRO Bedah → KRO Penyakit Dalam) → escalate
 *   ke level Direktur Utama (analog: revisi DIPA, bukan revisi POK)
 *
 * Untuk RS Batin Tikal (per §12.2 BAS RKKS), 3 KRO aktif:
 * - CAB (Sarana Bidang Kesehatan) — RO 1 Alkes, RO 5 Alsintor
 * - CCB (OM Sarana Bidang Kesehatan) — RO 4 Pemeliharaan Gedung
 * - EBA (Layanan Dukungan Manajemen Internal) — RO 962 Layanan Umum
 *
 * C2 pass = pergeseran dalam KRO yang sama (mis. dalam EBA, atau dalam CAB).
 * C2 fail = pergeseran lintas KRO (mis. EBA 521115 Honor ↔ CAB 532111 Alkes).
 *
 * Pending status analoginya: "department label belum diisi" — seperti
 * pasien masuk RS tapi belum di-triage ke departemen mana. Tidak bisa
 * decide validity transfer sampai label diisi (via "Terima Rekomendasi"
 * atau "Tandai Manual Reviewed").
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Captured (per §0.9.1 R1-R3, Owner-approved 11 Mei 2026)
 * ────────────────────────────────────────────────────────────────────────
 *
 * R1: Definisi "changed row" = pakai effective values (consistent dengan C1/C3)
 *     Konteks 1 fallback: hargaSatuanRevisi=0 → fallback ke Awal → effective
 *     values equal → TIDAK terhitung changed
 * R2: Pending threshold = strict (ANY changed row missing kro_code → pending)
 * R3: Override mechanism = tetap pending kalau kro_code null
 *     (override only forces confidence, TIDAK fill data fields)
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Leaf detection: SSOT §0.7.2 (via helpers.isLeaf)
 * - Effective value: SSOT §0.7.3 (via helpers.effectiveAwal/Revisi)
 * - Changed row detection: helpers.isChangedRow
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4a.json c2[]
 * - Decisions log: SSOT §0.9.1 R1-R3
 * - Master domain skema 5.a/b/c: docs/REVISI-POK-PAGU-vKoreksi.md §3.2 + §3.5
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';
import { collectChangedLeaves } from './helpers';

/**
 * Validate C2 — Pergeseran dalam 1 KRO yang Sama.
 *
 * v1 implementation: group by kro_code (skema 5.a). Future: detect skema
 * 5.b/5.c dan group by ro_code untuk kasus tersebut.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail/pending + detail
 */
export function validateC2(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C2;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect changed rows across all sections
  const changedRows = collectChangedLeaves(ctx.sections);

  // Step 2: Vacuous pass — no rows changed = no revisi to validate
  if (changedRows.length === 0) {
    return {
      constraintId: 'C2',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'Tidak ada row yang direvisi — C2 vacuous pass',
    };
  }

  // Step 3: Cek apakah ada row dengan kro_code missing (pending case per R2)
  const rowsMissingKro = changedRows.filter(r => !r.kro_code);

  if (rowsMissingKro.length > 0) {
    const affectedRowIds = rowsMissingKro.map(r => r.id);
    return {
      constraintId: 'C2',
      spec,
      status: 'pending',
      violations: [
        {
          constraintId: 'C2',
          severity: 'blocker',
          affectedRowIds,
          message: `${rowsMissingKro.length} row yang direvisi belum punya field kro_code. Mohon fill metadata via tombol "Terima Rekomendasi" atau "Tandai Manual Reviewed" sebelum validasi C2 bisa dieksekusi.`,
          detail: {
            reason: 'missing_kro_code',
            rowIds: affectedRowIds,
            count: rowsMissingKro.length,
          },
        },
      ],
      evaluatedAt,
      summary: `${rowsMissingKro.length} row missing kro_code — pending fill`,
    };
  }

  // Step 4: All changed rows have kro_code → check distinct count
  const distinctKroCodes = Array.from(
    new Set(changedRows.map(r => r.kro_code).filter((c): c is string => Boolean(c)))
  );

  if (distinctKroCodes.length <= 1) {
    // 0 or 1 distinct → PASS
    const kroLabel = distinctKroCodes[0] ?? '(none)';
    return {
      constraintId: 'C2',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `${changedRows.length} row direvisi, semua dalam KRO ${kroLabel} — C2 pass`,
    };
  }

  // 2+ distinct → FAIL
  const affectedRowIds = changedRows.map(r => r.id);
  return {
    constraintId: 'C2',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C2',
        severity: 'blocker',
        affectedRowIds,
        message: `Pergeseran POK mencakup ${distinctKroCodes.length} KRO berbeda (${distinctKroCodes.join(', ')}). Revisi POK kewenangan KPA hanya boleh dalam 1 KRO yang sama (Pasal 22 huruf a). Untuk pergeseran antar-KRO, eskalasi ke revisi DIPA Halaman III atau jalur Pasal 14 (reorganisasi/KRO baru).`,
        detail: {
          distinctKroCodes,
          count: distinctKroCodes.length,
          affectedRowCount: changedRows.length,
        },
      },
    ],
    evaluatedAt,
    summary: `${distinctKroCodes.length} KRO berbeda terdeteksi`,
  };
}
