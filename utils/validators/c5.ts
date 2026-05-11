/**
 * C5 Validator — Volume dan Satuan RO Tidak Berubah
 *
 * File: utils/validators/c5.ts
 * Created: 11 Mei 2026 (Tier 4a Phase 2b Turn 4)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C5
 *   - Pasal: Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1
 *   - Severity: blocker
 *   - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 C5 + §12.2
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C5: "Volume dan satuan RO tidak boleh berubah setelah revisi POK."
 *
 * Domain: setiap RO (Rincian Output) di DIPA Petikan punya target output
 * yang spesifik — misal RO 962 Layanan Umum = 1 Layanan. Semua row akun
 * yang masuk di bawah RO tersebut harus declare `volume_ro` + `satuan_ro`
 * yang sama. Kalau berbeda, artinya user mengubah target output RO —
 * itu BUKAN lagi revisi POK kewenangan KPA (eskalasi ke revisi DIPA).
 *
 * Langkah algoritma:
 *   1. Collect SEMUA leaf rows (R4 — bukan hanya changed, semua leaves
 *      dalam scope app pasti masuk di salah satu RO)
 *   2. Cek "all-missing" case (R5 strict NA):
 *      - Kalau SETIAP leaf row missing volume_ro AND satuan_ro → status 'na'
 *      - Rationale: Tier 3 LOW confidence default — volume_ro/satuan_ro
 *        butuh manual fill dari DIPA Petikan. Kalau belum di-fill, C5
 *        tidak bisa di-evaluasi (bukan fail, bukan pass).
 *   3. Group leaves by ro_code (skip rows tanpa ro_code dari grouping)
 *   4. Per RO group, cek distinct count:
 *      - volume_ro distinct > 1 → violation (field='volume_ro')
 *      - satuan_ro distinct > 1 → violation (field='satuan_ro')
 *      Per (RO × field) inconsistency = 1 violation; 1 RO bisa contribute
 *      ≥2 violations kalau both fields inconsistent.
 *   5. Setelah collect violations:
 *      - violations.length > 0 → status 'fail'
 *      - violations.length === 0 + ada row missing data → status 'warn'
 *        (R5 mixed case — sebagian filled konsisten, sebagian belum)
 *      - violations.length === 0 + semua filled konsisten → status 'pass'
 *
 * ────────────────────────────────────────────────────────────────────────
 * Konteks 1 fallback: TIDAK relevan untuk C5
 * ────────────────────────────────────────────────────────────────────────
 *
 * C2/C3 bergantung pada "changed row" definition (effective values + Konteks 1
 * fallback). C5 BERBEDA — ia cek consistency dari `volume_ro`/`satuan_ro`
 * yang merupakan property RO (DIPA-level), bukan property row pricing
 * (hargaSatuan*). Jadi hargaSatuanRevisi=0 tidak mempengaruhi C5 evaluation.
 *
 * ────────────────────────────────────────────────────────────────────────
 * R3 override behavior: TIDAK fill data
 * ────────────────────────────────────────────────────────────────────────
 *
 * Per §0.9.1 R3: `metadata_review.override_to='high'` hanya force
 * confidence, TIDAK fill `volume_ro`/`satuan_ro`. Row dengan override +
 * volume_ro null tetap counted sebagai "missing" untuk NA/MIXED logic.
 * Override TIDAK skip C5 evaluation.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Edge: rows tanpa ro_code
 * ────────────────────────────────────────────────────────────────────────
 *
 * Row tanpa `ro_code` di-skip dari group consistency check (tidak ada
 * group untuk ditaruh). Data volume_ro/satuan_ro di row tsb tetap
 * dipertimbangkan untuk NA/MIXED count. Missing ro_code adalah concern
 * C2 (validation Pasal 22 huruf a), bukan C5.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi medis (untuk Owner pemahaman)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti "ward census consistency":
 * - Setiap ward di RS punya kapasitas tempat tidur tetap (mis. Ward A = 10 TT)
 * - Semua admisi pasien yang masuk ke ward harus akui kapasitas yang sama
 * - Kalau ada catatan "Ward A = 10 TT" di satu chart dan "Ward A = 12 TT"
 *   di chart lain → inkonsistensi → C5 fail
 *
 * Untuk RS Batin Tikal:
 * - RO 962 Layanan Umum = 1 Layanan (target output dari DIPA Petikan)
 * - Semua akun di bawah RO 962 (521115 Honor, 521119 Operasional, 521811
 *   Persediaan, dst.) harus declare volume_ro=1 satuan_ro='Layanan'
 * - Mismatch → fail (artinya user secara accidental mengubah target output)
 *
 * NA status analoginya: "data sensus belum diinput" — tidak bisa cek
 * konsistensi sampai data fill. UI prompt user fill DIPA Petikan data.
 *
 * MIXED warn analoginya: "sebagian chart sudah update sensus, sebagian
 * belum" — yang ada terbukti konsisten, tapi soft-warn untuk fill sisanya.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Captured (per §0.9.1 R4-R5, Owner-approved 11 Mei 2026)
 * ────────────────────────────────────────────────────────────────────────
 *
 * R4: Grouping = per leaf row dalam ro_code yang sama. Distinct values
 *     dalam grup → fail.
 * R5: NA = strict ALL-missing; MIXED = warn dengan evaluate yang ada
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Leaf detection: SSOT §0.7.2 (via helpers.isLeaf)
 * - All-leaves collection: helpers.collectAllLeaves (Turn 4 extraction)
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4a.json c5[]
 * - Decisions log: SSOT §0.9.1 R4-R5
 * - Master domain RO target output: docs/REVISI-POK-PAGU-vKoreksi.md §12.2
 */
import type { PaguRow } from '../../types';
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
  type ConstraintViolation,
} from './types';
import { collectAllLeaves } from './helpers';

/**
 * Validate C5 — Volume dan Satuan RO Tidak Berubah.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult dengan status pass/fail/warn/na + detail
 */
export function validateC5(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C5;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect ALL leaf rows (R4 — bukan hanya changed)
  const allLeaves = collectAllLeaves(ctx.sections);

  // Vacuous pass — no leaves at all
  if (allLeaves.length === 0) {
    return {
      constraintId: 'C5',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary: 'Tidak ada leaf row — C5 vacuous pass',
    };
  }

  // Step 2: R5 strict NA — kalau SEMUA leaves missing volume_ro AND satuan_ro
  const allMissingBoth = allLeaves.every(
    r => r.volume_ro == null && r.satuan_ro == null
  );

  if (allMissingBoth) {
    return {
      constraintId: 'C5',
      spec,
      status: 'na',
      violations: [],
      evaluatedAt,
      summary: `${allLeaves.length} leaves semua missing volume_ro AND satuan_ro — Tier 3 LOW confidence default. Fill via DIPA Petikan untuk eksekusi C5.`,
    };
  }

  // Step 3: Group leaves by ro_code (skip rows tanpa ro_code dari grouping)
  const byRo = new Map<string, PaguRow[]>();
  for (const row of allLeaves) {
    if (!row.ro_code) continue;
    const k = row.ro_code;
    if (!byRo.has(k)) byRo.set(k, []);
    byRo.get(k)!.push(row);
  }

  // Step 4: Per-RO consistency check — volume_ro + satuan_ro
  const violations: ConstraintViolation[] = [];

  for (const [roCode, rowsInRo] of byRo) {
    // Check volume_ro consistency (among rows yang have it)
    const withVolume = rowsInRo.filter(r => r.volume_ro != null);
    const distinctVolumes = Array.from(
      new Set(withVolume.map(r => r.volume_ro!))
    );
    if (distinctVolumes.length > 1) {
      violations.push({
        constraintId: 'C5',
        severity: 'blocker',
        affectedRowIds: rowsInRo.map(r => r.id),
        message: `RO ${roCode}: volume_ro tidak konsisten — ${distinctVolumes.length} nilai berbeda (${distinctVolumes.join(', ')}). Volume RO harus sama untuk semua row dalam 1 RO (Pasal 22 huruf b angka 1). Mengubah volume RO = mengubah target output, bukan kewenangan KPA via revisi POK.`,
        detail: {
          roCode,
          field: 'volume_ro',
          distinctValues: distinctVolumes,
        },
      });
    }

    // Check satuan_ro consistency
    const withSatuan = rowsInRo.filter(r => r.satuan_ro != null);
    const distinctSatuans = Array.from(
      new Set(withSatuan.map(r => r.satuan_ro!))
    );
    if (distinctSatuans.length > 1) {
      violations.push({
        constraintId: 'C5',
        severity: 'blocker',
        affectedRowIds: rowsInRo.map(r => r.id),
        message: `RO ${roCode}: satuan_ro tidak konsisten — ${distinctSatuans.length} nilai berbeda (${distinctSatuans.map(s => `'${s}'`).join(', ')}). Satuan RO harus sama untuk semua row dalam 1 RO (Pasal 22 huruf b angka 1).`,
        detail: {
          roCode,
          field: 'satuan_ro',
          distinctValues: distinctSatuans,
        },
      });
    }
  }

  // Step 5: Status decision
  if (violations.length > 0) {
    return {
      constraintId: 'C5',
      spec,
      status: 'fail',
      violations,
      evaluatedAt,
      summary: `${violations.length} inkonsistensi terdeteksi di ${new Set(violations.map(v => (v.detail as Record<string, unknown>).roCode)).size} RO group(s)`,
    };
  }

  // R5 MIXED case — ada row missing volume_ro OR satuan_ro, tapi yang ada konsisten
  const missingRows = allLeaves.filter(
    r => r.volume_ro == null || r.satuan_ro == null
  );

  if (missingRows.length > 0) {
    const missingRowIds = missingRows.map(r => r.id);
    return {
      constraintId: 'C5',
      spec,
      status: 'warn',
      violations: [
        {
          constraintId: 'C5',
          severity: 'blocker',
          affectedRowIds: missingRowIds,
          message: `${missingRowIds.length} dari ${allLeaves.length} row missing volume_ro atau satuan_ro. Partial evaluation: row yang sudah filled terbukti konsisten. Mohon fill missing values via DIPA Petikan untuk evaluasi lengkap.`,
          detail: {
            reason: 'mixed_partial_fill',
            missingRowIds,
            missingCount: missingRowIds.length,
            totalLeaves: allLeaves.length,
          },
        },
      ],
      evaluatedAt,
      summary: `Partial fill — ${missingRowIds.length}/${allLeaves.length} row missing data; yang filled konsisten`,
    };
  }

  // All filled, all consistent → PASS
  return {
    constraintId: 'C5',
    spec,
    status: 'pass',
    violations: [],
    evaluatedAt,
    summary: `${allLeaves.length} leaves konsisten dalam ${byRo.size} RO group(s) — C5 pass`,
  };
}
