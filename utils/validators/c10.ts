/**
 * C10 Validator — Sesuai SBM/SBK (Standar Biaya Masukan/Keluaran)
 *
 * File: utils/validators/c10.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 2)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C10
 *   - Pasal: PMK Standar Biaya tahunan + Perdirjen Renhan 7/2025 implicit
 *   - Severity: warning (FIRST validator dengan severity selain 'blocker'!)
 *   - Description: "Tarif hargaSatuanRevisi harus dalam tolerance terhadap
 *     SBM/SBK baseline. Default V1: hargaSatuanAwal as baseline proxy."
 *   - Decisions: SSOT §0.11.1 T2b (baseline proxy) + T4 (thresholds)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C10: Setiap baris pagu (leaf row) harus punya hargaSatuanRevisi
 * yang tidak terlalu jauh deviasinya dari baseline. V1 simplified: pakai
 * hargaSatuanAwal sebagai SBM baseline proxy (asumsi: kalau row sudah masuk
 * Pagu Semula, baseline-nya sudah PMK-compliant per validation manual Sie
 * Renbang sebelumnya).
 *
 * Tujuan: catch wrong-baseline atau real anomaly worth flagging — BUKAN
 * authoritative SBM lookup (itu V2 future enhancement saat Tier 5+).
 *
 * Langkah algoritma:
 *   1. Collect SEMUA leaf rows (changed maupun unchanged) via
 *      helpers.collectAllLeaves — sanity check, BUKAN filter changed
 *   2. Per leaf:
 *      a. baseline = hargaSatuanAwal
 *      b. revisi = hargaSatuanRevisi
 *      c. Skip jika baseline === 0 (cannot compute deviasi — no baseline)
 *      d. Skip jika revisi === 0 (no revisi to check — Konteks 1 territory)
 *      e. Compute diff = |revisi - baseline|
 *      f. Compare via multiplier (BUKAN percentage) untuk float-precision safe:
 *         - diff <= baseline × (warnPct/100) → pass (within tolerance)
 *         - diff <= baseline × (failPct/100) → WARN (between thresholds)
 *         - else → fail (beyond fail threshold)
 *   3. Aggregate status (precedence fail > warn > pass):
 *      - ≥1 fail → 'fail'
 *      - 0 fail AND ≥1 warn → 'warn'
 *      - 0 fail AND 0 warn → 'pass'
 *
 * Thresholds (Decision T4):
 *   - warnPct = 10 (catch most data entry errors)
 *   - failPct = 25 (significant deviation, likely wrong baseline atau anomaly)
 *
 * Boundary semantics:
 *   - Exactly warnPct (e.g. 10%) → pass (≤ comparison, owner-confirmed)
 *   - Exactly failPct (e.g. 25%) → warn (≤ comparison)
 *   - Strict greater than failPct (e.g. 25.01%) → fail
 *
 * ────────────────────────────────────────────────────────────────────────
 * Float precision protection
 * ────────────────────────────────────────────────────────────────────────
 *
 * JavaScript IEEE-754 famously yields `(110 - 100) / 100 * 100` =
 * 10.000000000000002 (BUKAN exactly 10). Kalau boundary check pakai
 * percentage value, exactly-10% case bisa accidentally jadi warn.
 *
 * Solusi: compare via multiplier dengan baseline:
 *   diff <= baseline × (warnPct/100)
 *
 * Untuk baseline=100, warnPct=10:
 *   baseline × 0.1 = 10 (exact, untuk integer baseline kelipatan 10)
 *
 * Display deviasi_pct di message (cosmetic) tetap pakai division, tapi
 * pakai .toFixed(1) untuk human-readable precision.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti normal range vital signs cek di pre-op:
 *   - Tekanan darah dalam range ±10% baseline pasien → normal (pass)
 *   - Deviasi 15% → tampak abnormal, perlu attending review (WARN)
 *   - Deviasi 30% → harus delay operasi sampai dipastikan (fail)
 *
 * C10 adalah validator pertama yang menghasilkan WARN — analog dengan
 * abnormal-but-not-critical vital sign. UI dashboard sudah designed
 * support amber card border untuk WARN state sejak Tier 4a Phase 3, baru
 * sekarang ada validator real yang actually trigger.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.11.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * T2b: hargaSatuanAwal sebagai SBM baseline proxy. Pragmatic V1 leveraging
 *      existing data. Asumsi: Semula sudah PMK-compliant per validation
 *      manual sebelumnya. V2 enhancement (full SBM lookup table) defer ke
 *      Tier 5+ saat ada workflow PMK data entry.
 * T4:  warnPct=10, failPct=25. Adjustable di constants di-bawah jika Sie
 *      Renbang feedback indicate too tight/loose. Tier 5+ bisa juga
 *      override per BAS code.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari validator lain
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C1/C6/C7:  group changed leaves + aggregate check (1 violation)
 * - C9:        per-leaf direct check (multiple violations possible, all 'blocker')
 * - C10:       per-leaf deviasi check (multiple violations, mixed severity!)
 * - C10 unique: FIRST validator yang hasilkan severity='warning' di violations,
 *               dan status='warn' di aggregate result
 *
 * ────────────────────────────────────────────────────────────────────────
 * UI Integration (Phase 3 Tier 4c)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Phase 3 akan transition C10 dari placeholder 'todo' ke live di
 * runAllValidators.ts. C10 violation tampil di:
 *   - Dashboard card C10 — amber border untuk WARN, red untuk fail
 *   - Inline indicators di Pagu Anggaran tab — per affectedRowIds, dot
 *     warna sesuai severity (amber=warn / red=fail)
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Helper: helpers.collectAllLeaves (refactor from Phase 2b Turn 4 Tier 4b)
 * - Fixture scenarios: utils/fixtures/validation-scenarios-4c.json c10[]
 * - Decisions log: SSOT §0.11.1 T2b + T4
 * - Phase 3 UI plan: docs/TIER-4C-DESIGN.md §5.1
 * - Pattern reference: utils/validators/c9.ts (collectAllLeaves + per-leaf)
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
  type ConstraintViolation,
  type ConstraintStatus,
} from './types';
import { collectAllLeaves, formatRupiah } from './helpers';

/**
 * Warn threshold dalam percentage. Deviasi di atas ini akan flag
 * sebagai warning (amber state di UI). Adjustable jika Sie Renbang
 * feedback indicate too tight/loose.
 */
export const C10_WARN_THRESHOLD_PCT = 10;

/**
 * Fail threshold dalam percentage. Deviasi di atas ini akan flag
 * sebagai fail/blocker (red state di UI, blocks Submit Revisi POK).
 */
export const C10_FAIL_THRESHOLD_PCT = 25;

/**
 * Validate C10 — Sesuai SBM/SBK.
 *
 * Per-leaf deviasi check terhadap baseline. First validator dengan
 * mixed severity output — bisa hasilkan warning violations alongside
 * blocker, dan status='warn' di aggregate result.
 *
 * @param ctx ValidationContext dengan sections
 * @returns ConstraintResult status pass/warn/fail + per-leaf violations
 */
export function validateC10(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C10;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // Step 1: Collect ALL leaf rows (sanity check, BUKAN filter changed)
  const allLeaves = collectAllLeaves(ctx.sections);

  // Step 2: Per leaf, compute deviasi + categorize
  const violations: ConstraintViolation[] = [];
  let warnCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const leaf of allLeaves) {
    const hsa = leaf.hargaSatuanAwal ?? 0;
    const hsr = leaf.hargaSatuanRevisi ?? 0;

    // Skip conditions per design §2.2:
    // - hsa === 0: cannot compute deviasi (division by zero / no baseline)
    // - hsr === 0: no revisi (Konteks 1 fallback territory — belum direvisi)
    if (hsa === 0 || hsr === 0) {
      skipCount++;
      continue;
    }

    // Float-precision-safe boundary check via multiplier (lihat docblock atas)
    const diff = Math.abs(hsr - hsa);
    const warnBound = hsa * (C10_WARN_THRESHOLD_PCT / 100);
    const failBound = hsa * (C10_FAIL_THRESHOLD_PCT / 100);

    if (diff <= warnBound) {
      // Pass — within tolerance, no violation
      continue;
    }

    // Compute deviasi percentage untuk display message (cosmetic)
    const deviasi_pct = (diff / hsa) * 100;
    const deviasi_pct_display = deviasi_pct.toFixed(1);

    if (diff <= failBound) {
      // WARN — between warn and fail thresholds
      warnCount++;
      violations.push({
        constraintId: 'C10',
        severity: 'warning',
        affectedRowIds: [leaf.id],
        message:
          `Akun "${leaf.kode}" (${leaf.description ?? '-'}) deviasi ${deviasi_pct_display}% ` +
          `dari baseline Semula (${formatRupiah(hsa)} → ${formatRupiah(hsr)}). ` +
          `Di atas warn threshold ${C10_WARN_THRESHOLD_PCT}% — mohon verifikasi tarif ` +
          `terhadap PMK Standar Biaya Masukan/Keluaran (SBM/SBK) TA berkenaan.`,
        detail: {
          rowId: leaf.id,
          kode: leaf.kode,
          hargaSatuanAwal: hsa,
          hargaSatuanRevisi: hsr,
          deviasi_pct: Number(deviasi_pct_display),
          threshold_breached: 'warn',
          warnThresholdPct: C10_WARN_THRESHOLD_PCT,
          failThresholdPct: C10_FAIL_THRESHOLD_PCT,
        },
      });
    } else {
      // FAIL — > failThreshold, likely wrong baseline atau real anomaly
      failCount++;
      violations.push({
        constraintId: 'C10',
        severity: 'blocker',
        affectedRowIds: [leaf.id],
        message:
          `Akun "${leaf.kode}" (${leaf.description ?? '-'}) deviasi ${deviasi_pct_display}% ` +
          `dari baseline Semula (${formatRupiah(hsa)} → ${formatRupiah(hsr)}). ` +
          `Di atas fail threshold ${C10_FAIL_THRESHOLD_PCT}% — kemungkinan baseline ` +
          `salah atau perubahan tarif tidak sesuai PMK Standar Biaya. Verify tarif ` +
          `sebelum re-submit.`,
        detail: {
          rowId: leaf.id,
          kode: leaf.kode,
          hargaSatuanAwal: hsa,
          hargaSatuanRevisi: hsr,
          deviasi_pct: Number(deviasi_pct_display),
          threshold_breached: 'fail',
          warnThresholdPct: C10_WARN_THRESHOLD_PCT,
          failThresholdPct: C10_FAIL_THRESHOLD_PCT,
        },
      });
    }
  }

  // Step 3: Aggregate status (precedence fail > warn > pass)
  let status: ConstraintStatus;
  let summary: string;
  if (failCount > 0) {
    status = 'fail';
    summary =
      `${failCount} akun deviasi > ${C10_FAIL_THRESHOLD_PCT}% (fail), ` +
      `${warnCount} deviasi ${C10_WARN_THRESHOLD_PCT}-${C10_FAIL_THRESHOLD_PCT}% (warn), ` +
      `${skipCount} skipped (no baseline/revisi).`;
  } else if (warnCount > 0) {
    status = 'warn';
    summary =
      `${warnCount} akun deviasi ${C10_WARN_THRESHOLD_PCT}-${C10_FAIL_THRESHOLD_PCT}% — ` +
      `mohon verifikasi terhadap SBM/SBK TA berkenaan. ${skipCount} skipped.`;
  } else {
    status = 'pass';
    summary =
      `${allLeaves.length - skipCount} akun dengan revisi dan baseline tersedia, semua ` +
      `deviasi ≤ ${C10_WARN_THRESHOLD_PCT}% (pass). ${skipCount} skipped.`;
  }

  return {
    constraintId: 'C10',
    spec,
    status,
    violations,
    evaluatedAt,
    summary,
  };
}
