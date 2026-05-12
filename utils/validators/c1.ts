/**
 * C1 Validator — Total Pagu Satker Net Change = 0
 *
 * File: utils/validators/c1.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C1
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C1
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C1: "Total pagu satker tidak boleh berubah setelah revisi POK."
 *
 * Langkah algoritma:
 *   1. Loop semua section pagu_sections, untuk setiap row → cek apakah
 *      itu LEAF (tidak punya anak) via traversal §0.7.2.
 *      Cuma leaves yang ada nilai uang aktual; parent rows berisi
 *      bubble-up totals (dihitung dari leaves) — jangan double-count.
 *   2. Untuk setiap leaf:
 *      - effective_awal = volume × hargaSatuanAwal
 *      - effective_revisi = volume × hargaSatuanRevisi
 *        TAPI: kalau hargaSatuanRevisi=0 (Konteks 1 fallback per
 *              normative logic Angga, Sprint D Item #1), fallback ke
 *              hargaSatuanAwal — artinya "belum direvisi" = sama dengan Semula
 *   3. Sum total Awal + total Revisi across semua leaves
 *   4. Bandingkan: |totalAwal − totalRevisi| > epsilon → FAIL
 *      Else → PASS
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi medis (untuk Owner pemahaman)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti "conservation of mass" — total volume cairan yang masuk
 * (Semula) harus sama dengan total volume cairan yang keluar (Revisi).
 * Kalau revisi POK valid (cuma menggeser antar pos), totalnya tidak
 * boleh berubah. Kalau bertambah/berkurang, artinya bukan revisi POK —
 * itu sudah revisi DIPA (level kewenangan berbeda).
 *
 * Konteks 1 fallback analoginya: kalau dokter belum input "hasil ulang"
 * pengukuran (hargaSatuanRevisi=0 = blank), gunakan "hasil awal"
 * (hargaSatuanAwal) sebagai default — bukan diabaikan jadi 0.
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Leaf detection: SSOT §0.7.2 (traversal-based, BUKAN level>0 filter)
 * - Effective value: SSOT §0.7.3 (Konteks 1 fallback)
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4a.json c1[]
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
} from './types';
import {
  isLeaf,
  effectiveAwal,
  effectiveRevisi,
  formatRupiah,
  EPSILON_RUPIAH,
} from './helpers';

/**
 * Validate C1 — Total Pagu Satker Net Change = 0.
 *
 * @param ctx ValidationContext dengan sections + optional evaluatedAt
 * @returns ConstraintResult dengan status pass/fail + detail
 */
export function validateC1(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C1;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  let totalAwal = 0;
  let totalRevisi = 0;

  // Iterate semua section → semua leaf rows → akumulasi sum
  ctx.sections.forEach(section => {
    section.rows.forEach((row, idx) => {
      if (!isLeaf(section.rows, idx)) return; // skip parent rows
      totalAwal += effectiveAwal(row);
      totalRevisi += effectiveRevisi(row);
    });
  });

  const selisih = totalRevisi - totalAwal;

  // PASS case: selisih within epsilon tolerance
  if (Math.abs(selisih) <= EPSILON_RUPIAH) {
    return {
      constraintId: 'C1',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: `Total Pagu konsisten: ${formatRupiah(totalAwal)} (Semula = Revisi)`,
    };
  }

  // FAIL case: selisih signifikan
  const direction = selisih > 0 ? 'bertambah' : 'berkurang';
  // [§0.9.5 enhancement — batch dengan Tier 4b Phase 1.5]
  // Tambah guidance ke pathway alternatif untuk help Sie Renbang
  // identify correct mechanism. Case study RS Batin Tikal 2025:
  // layanan bedah saraf full operasional → add pagu Rp 1.7M → wrong
  // mechanism jika via revisi POK kewenangan KPA. Correct: DIPA Hal III.
  const message =
    `Pagu satker ${direction} ${formatRupiah(Math.abs(selisih))} — ` +
    `Semula ${formatRupiah(totalAwal)}, Revisi ${formatRupiah(totalRevisi)}. ` +
    `Revisi POK kewenangan KPA tidak boleh mengubah total pagu satker ` +
    `(Pasal 22 huruf b angka 1). ` +
    `Untuk menambah/mengurangi total pagu satker, gunakan Revisi DIPA ` +
    `Halaman III (kewenangan KAPK/Eselon I) atau revisi DIPA penuh — ` +
    `bukan Revisi POK kewenangan KPA.`;

  return {
    constraintId: 'C1',
    spec,
    status: 'fail',
    violations: [
      {
        constraintId: 'C1',
        severity: 'blocker',
        message,
        detail: {
          totalAwal,
          totalRevisi,
          selisih,
        },
      },
    ],
    evaluatedAt,
    summary: `Net change ${formatRupiah(selisih)} ≠ 0`,
  };
}
