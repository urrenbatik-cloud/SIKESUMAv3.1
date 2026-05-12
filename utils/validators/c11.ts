/**
 * C11 Validator — Tidak Ubah Halaman III DIPA (RPD)
 *
 * File: utils/validators/c11.ts
 * Created: 12 Mei 2026 (Tier 4c Phase 2b Turn 3)
 *
 * Spec source: utils/validators/types.ts CONSTRAINT_SPECS.C11
 *   - Pasal: Perdirjen Renhan 7/2025 Lampiran I Bagian 5 kode 5.d
 *   - Severity: blocker
 *   - Description: "Revisi POK tidak boleh mengubah RPD (Rencana Penarikan
 *     Dana) — distribusi bulanan di Halaman III DIPA. Jika berubah, harus
 *     naik ke revisi DIPA Halaman III (proses berbeda, kewenangan KAPK)."
 *   - Decisions: SSOT §0.11.1 T3a (V1 flag affected) + T5a (strict match)
 *
 * ────────────────────────────────────────────────────────────────────────
 * Algorithm (plain language untuk Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Constraint C11: Saat Sie Renbang melakukan revisi POK kewenangan KPA,
 * tidak boleh ada row yang ter-revisi pagu-nya yang juga punya entri di
 * RPD (Rencana Penarikan Dana — distribusi bulanan yang sudah disetujui
 * KAPK/Eselon I di Halaman III DIPA). Jika ada, revisi tersebut sebenarnya
 * butuh proses lain (revisi DIPA Halaman III), BUKAN revisi POK KPA.
 *
 * Validator ini = cross-table check. Iterate changed leaves di Pagu →
 * lookup di RPD via key composite `${sectionId}:${kode}` → flag yang
 * affected.
 *
 * V1 simplified per T3a: hanya flag existence of linked RPD entry —
 * BUKAN numerical sum verification antara monthly distribution vs revised
 * pagu total. V2 future enhancement saat Tier 5+ akan add sum check.
 *
 * Langkah algoritma:
 *
 *   Step 0 (vacuous + pending decision tree — order tergantung strategy):
 *     a. Collect changed pagu leaves (Konteks 1 aware via isChangedRow)
 *     b. Decision tree per ctx.c11Strategy (default 'permisif'):
 *
 *        Mode 'permisif' (default development setting):
 *          - IF 0 changed leaves → 'pass' (vacuous, rpdsData irrelevant)
 *          - ELSE IF rpdsData undefined → 'pending'
 *          - ELSE continue Step 1
 *
 *        Mode 'ketat' (strict, opt-in):
 *          - IF rpdsData undefined → 'pending' (CHECK FIRST, walau 0 changed)
 *          - ELSE IF 0 changed leaves → 'pass' (then-vacuous)
 *          - ELSE continue Step 1
 *
 *   Step 1: Build RPD lookup map
 *     Map<`${linkedPaguSectionId}:${rpdRow.kode}`, {row, sectionId}>
 *
 *   Step 2: Per changed pagu leaf
 *     paguKey = `${pagu.sectionId}:${pagu.kode}`
 *     IF rpdMap[paguKey] exists → affected (push violation)
 *
 *   Step 3: Final status decision
 *     - 0 affected → 'pass' (revisi tidak menyentuh RPD)
 *     - ≥1 affected → 'fail' (RPD akan ter-impact → eskalasi Hal III DIPA)
 *
 * Decision T9 BARU (12 Mei 2026) — toggle architecture:
 *   Owner direction: dua interpretasi semantic yang sama-sama defensible
 *   untuk edge case "0 changed leaves + rpdsData undefined". Daripada
 *   lock-in di salah satu, expose sebagai ctx.c11Strategy toggle. Sie
 *   Renbang dapat eksperimen kedua mode via UI toggle (Phase 3c) → pilih
 *   preference akhirnya based on workflow experience ("learning by doing").
 *
 *   - 'permisif' (default): pass jika belum ada perubahan, walau rpdsData
 *     belum ter-load. Default-safe — match natural app-startup flow tanpa
 *     surprise pending state.
 *   - 'ketat': pending sampai data lengkap. Default-skeptical — paksa user
 *     verify RPD context loaded sebelum claim aman. Cocok kalau Sie Renbang
 *     ingin maximum defensive checking sebelum submit.
 *
 *   Default tetap 'permisif' untuk backward compat + natural UX. Toggle ke
 *   'ketat' = opt-in via UI Phase 3c.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Konteks 1 fallback aware (pakai isChangedRow via collectChangedLeaves)
 * ────────────────────────────────────────────────────────────────────────
 *
 * BERBEDA dengan C9/C10 yang BYPASS Konteks 1 fallback:
 *   - C9: bypass untuk catch raw negative typo
 *   - C10: bypass untuk skip no-revisi rows
 *   - C11: PAKAI Konteks 1 — hanya consider "actually changed" rows
 *
 * Row dengan hsr=0 effectively unchanged (fallback ke hsa) → tidak counted
 * sebagai changed → tidak trigger RPD impact check. Semantic correct:
 * "kalau tidak benar-benar berubah, RPD juga tidak butuh adjustment".
 *
 * ────────────────────────────────────────────────────────────────────────
 * T5a strict match (linkedPaguSectionId + kode exact)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Match method per Decision T5a:
 *   key = `${rpdSection.linkedPaguSectionId}:${rpdRow.kode}`
 *
 * BUKAN fuzzy prefix match (T5b yang di-reject). Implikasi:
 *   - Section A changed, RPD section linked ke section B dengan kode sama
 *     → NO MATCH (linkedPaguSectionId beda)
 *   - Section A changed, RPD linked ke A tapi kode beda
 *     → NO MATCH (kode beda)
 *   - Section A changed, RPD linked ke A dengan kode sama
 *     → MATCH (affected)
 *
 * Trade-off: lebih strict → fewer false positives → defensible default.
 * Kalau Sie Renbang feedback ada missed cases, adjust ke T5b later.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Section context preservation challenge
 * ────────────────────────────────────────────────────────────────────────
 *
 * helpers.collectChangedLeaves return flat `PaguRow[]` — sectionId hilang.
 * Tapi C11 butuh sectionId untuk build paguKey.
 *
 * Solusi: inline traversal di c11.ts dengan pattern serupa helpers.collectAllLeaves
 * tapi preserve section context. BUKAN modify shared helper (risk break C2/C3
 * yang sudah established + tested).
 *
 * ────────────────────────────────────────────────────────────────────────
 * Analogi pre-operative checklist (untuk konteks Owner)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Seperti checking apakah perubahan rencana operasi (mis. ganti tipe
 * anestesi) memerlukan re-approval ulang dari komite anestesi — BUKAN
 * cukup sign dokter operator saja. Kalau pagu di-revisi tapi sudah ada
 * rencana penarikan bulanan yang di-approve eselon atas (Hal III DIPA),
 * revisi tidak cukup wewenang KPA — harus naik level.
 *
 * Pending state = analog dengan "lab result belum keluar" — operasi
 * defer sampai data lengkap untuk evaluasi safety.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Decisions Locked (per SSOT §0.11.1)
 * ────────────────────────────────────────────────────────────────────────
 *
 * T3a: V1 flag affected RPD rows. NO numerical sum verification. V2 +
 *      V3 enhancements defer ke Tier 5+ saat ada workflow tracking RPD
 *      update terhubung dengan revisi POK.
 * T5a: Strict linkedPaguSectionId + kode exact match. BUKAN fuzzy prefix.
 * T9 (BARU 12 Mei 2026 Owner-approved): Toggle ctx.c11Strategy ('permisif'
 *      default + 'ketat' opt-in) untuk edge case "0 changed leaves + rpdsData
 *      undefined". Architecture-ready sekarang, UI toggle di Phase 3c
 *      (in-context di card C11 dashboard, localStorage persist per-device).
 *      Naming Indonesian per Owner preference (RS TNI AD primary language).
 *      SSOT §0.11.1 T9 entry akan di-sync di Phase 3d docs sync commit.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Differences dari validator lain
 * ────────────────────────────────────────────────────────────────────────
 *
 * - C1-C7, C9, C10: single-table (sections aja)
 * - C8: zero-table (boolean state)
 * - C12: zero-table (date comparison)
 * - C11: CROSS-TABLE (sections + rpdsData) ← UNIK
 * - C11 pertama yang return pending DENGAN data-context-not-available
 *   semantic (C8 pending = user not yet acknowledged, beda intent)
 *
 * ────────────────────────────────────────────────────────────────────────
 * UI Integration (Phase 3 Tier 4c)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Phase 3 akan:
 *   - 3b: Transition placeholder → live di runAllValidators.ts
 *   - 3c: REFACTOR onNavigate signature (`'pagu' | 'rpd'` target) +
 *     RPD.tsx scroll/highlight mirror PaguAnggaran Tier 4a Phase 3d
 *
 * Per violation di-render dengan 2 buttons di DetailPanel:
 *   - → Pagu Anggaran (existing, route via target='pagu' + sectionId + rowId)
 *   - → RPD (NEW, route via target='rpd' + rpdSectionId + rpdRowId)
 *
 * detail object expose both paguRowId + rpdRowId + sectionIds untuk
 * Phase 3c handler.
 *
 * ────────────────────────────────────────────────────────────────────────
 * References
 * ────────────────────────────────────────────────────────────────────────
 *
 * - Types: RPDSection + RPDRow di types.ts (Sprint A2 + B.5)
 * - Helper: helpers.isLeaf + isChangedRow (inline traversal)
 * - Fixture: utils/fixtures/validation-scenarios-4c.json c11[]
 * - Decisions: SSOT §0.11.1 T3a + T5a + custom vacuous-wins-pending
 * - Phase 3 UI plan: docs/TIER-4C-DESIGN.md §5.3 cross-tab navigation
 */
import {
  CONSTRAINT_SPECS,
  type ValidationContext,
  type ConstraintResult,
  type ConstraintViolation,
} from './types';
import { isLeaf, isChangedRow } from './helpers';
import type { PaguRow, RPDRow } from '../../types';

/**
 * Internal helper — collect changed leaves dengan section context preserved.
 *
 * Pattern serupa helpers.collectChangedLeaves (delegate ke collectAllLeaves
 * + filter isChangedRow), tapi return `{row, sectionId}[]` agar caller bisa
 * build cross-table lookup keys.
 *
 * @param sections Array PaguSection
 * @returns Array of {row, sectionId} untuk semua changed leaf rows
 */
function collectChangedLeavesWithSection(
  sections: ValidationContext['sections']
): Array<{ row: PaguRow; sectionId: string }> {
  const result: Array<{ row: PaguRow; sectionId: string }> = [];
  sections.forEach(section => {
    section.rows.forEach((row, idx) => {
      if (isLeaf(section.rows, idx) && isChangedRow(row)) {
        result.push({ row, sectionId: section.id });
      }
    });
  });
  return result;
}

/**
 * Validate C11 — Tidak Ubah RPD (Halaman III DIPA).
 *
 * Cross-table validator: iterate changed pagu leaves, lookup di RPD via
 * `${sectionId}:${kode}` key, flag yang affected.
 *
 * @param ctx ValidationContext dengan sections + optional rpdsData + optional c11Strategy
 * @returns ConstraintResult status pass/fail/pending + per-leaf violations
 */
export function validateC11(ctx: ValidationContext): ConstraintResult {
  const spec = CONSTRAINT_SPECS.C11;
  const evaluatedAt = (ctx.evaluatedAt ?? new Date()).toISOString();

  // [T9] Read strategy preference — default 'permisif' (vacuous wins).
  // Sie Renbang dapat opt-in 'ketat' via UI toggle Phase 3c.
  const strategy: 'permisif' | 'ketat' = ctx.c11Strategy ?? 'permisif';

  // [T9] User-facing note appended ke setiap summary — supaya saat C11 card
  // di dashboard expand, Sie Renbang sadar mode mana yang aktif + tahu
  // bahwa fitur ini bisa di-toggle. Pattern "soft-onboarding" — tidak
  // intrusive (pesan singkat), tapi visible cukup untuk drive eksplorasi.
  const strategyNote =
    strategy === 'permisif'
      ? `[Mode: PERMISIF — default pengembangan, vacuous pass aktif. ` +
        `Mode KETAT (validate-first) tersedia via toggle UI Phase 3c.]`
      : `[Mode: KETAT — strict pending-first aktif. ` +
        `Mode PERMISIF (default, lebih lenient) tersedia via toggle.]`;

  // Step 0a: Collect changed leaves (Konteks 1 aware via isChangedRow)
  const changedLeaves = collectChangedLeavesWithSection(ctx.sections);

  // Step 0b: Decision tree per strategy. Order matters di edge case
  // "0 changed leaves + rpdsData undefined" — that's the only case where
  // permisif vs ketat actually diverge in output.
  if (strategy === 'permisif') {
    // Permisif: vacuous wins. Check changedLeaves first.
    if (changedLeaves.length === 0) {
      return {
        constraintId: 'C11',
        spec,
        status: 'pass',
        violations: [],
        evaluatedAt,
        summary: `Tidak ada perubahan pagu effective — C11 vacuous pass. ${strategyNote}`,
      };
    }
    if (ctx.rpdsData === undefined) {
      return buildPendingResult(spec, evaluatedAt, changedLeaves.length, strategyNote);
    }
  } else {
    // Ketat: pending-first. Check rpdsData undefined dulu.
    if (ctx.rpdsData === undefined) {
      return buildPendingResult(spec, evaluatedAt, changedLeaves.length, strategyNote);
    }
    if (changedLeaves.length === 0) {
      return {
        constraintId: 'C11',
        spec,
        status: 'pass',
        violations: [],
        evaluatedAt,
        summary: `Tidak ada perubahan pagu effective + RPD context tersedia — C11 pass. ${strategyNote}`,
      };
    }
  }

  // Step 1: Build RPD lookup map. Key composite `${linkedPaguSectionId}:${kode}`
  // per T5a strict match. Value preserve {row, sectionId} untuk Phase 3c
  // cross-tab navigation routing.
  //
  // Type narrowing: kalau sampai sini, ctx.rpdsData pasti defined (sudah
  // checked di Step 0b untuk kedua strategy mode).
  const rpdsData = ctx.rpdsData!;
  const rpdMap = new Map<string, { row: RPDRow; sectionId: string }>();
  for (const rpdSection of rpdsData) {
    for (const rpdRow of rpdSection.rows) {
      const key = `${rpdSection.linkedPaguSectionId}:${rpdRow.kode}`;
      // Defensive: last-wins jika duplicate key (RPD shouldn't have duplicates
      // anyway — Sie Renbang convention is 1 row per kode per section).
      rpdMap.set(key, { row: rpdRow, sectionId: rpdSection.id });
    }
  }

  // Step 2: Per changed leaf, lookup di rpdMap
  const violations: ConstraintViolation[] = [];
  for (const { row: paguRow, sectionId: paguSectionId } of changedLeaves) {
    const paguKey = `${paguSectionId}:${paguRow.kode}`;
    const matched = rpdMap.get(paguKey);

    if (matched) {
      // Affected — RPD entry exists for this changed pagu leaf
      violations.push({
        constraintId: 'C11',
        severity: 'blocker',
        affectedRowIds: [paguRow.id],
        message:
          `Akun "${paguRow.kode}" (${paguRow.description ?? '-'}) ter-revisi ` +
          `dan memiliki entri RPD (Rencana Penarikan Dana) terkait. Revisi POK ` +
          `kewenangan KPA TIDAK BOLEH mengubah RPD per Lampiran I Bagian 5 ` +
          `kode 5.d Perdirjen Renhan 7/2025. Perubahan ini perlu naik ke ` +
          `revisi DIPA Halaman III (kewenangan KAPK/Eselon I — proses berbeda).`,
        detail: {
          reason: 'rpd_entry_affected',
          paguRowId: paguRow.id,
          paguSectionId,
          paguKode: paguRow.kode,
          rpdRowId: matched.row.id,
          rpdSectionId: matched.sectionId,
          rpdKode: matched.row.kode,
          // T3a V1: no numerical sum check, tapi expose monthly untuk Phase 3
          // UI display + Tier 5 audit detail
          rpdMonthlyTotal:
            (matched.row.monthly.m1 ?? 0) + (matched.row.monthly.m2 ?? 0) +
            (matched.row.monthly.m3 ?? 0) + (matched.row.monthly.m4 ?? 0) +
            (matched.row.monthly.m5 ?? 0) + (matched.row.monthly.m6 ?? 0) +
            (matched.row.monthly.m7 ?? 0) + (matched.row.monthly.m8 ?? 0) +
            (matched.row.monthly.m9 ?? 0) + (matched.row.monthly.m10 ?? 0) +
            (matched.row.monthly.m11 ?? 0) + (matched.row.monthly.m12 ?? 0),
        },
      });
    }
  }

  // Step 3: Final status decision
  if (violations.length === 0) {
    return {
      constraintId: 'C11',
      spec,
      status: 'pass',
      violations: [],
      evaluatedAt,
      summary:
        `${changedLeaves.length} perubahan pagu terdeteksi, tidak ada entri RPD ` +
        `terkait — revisi POK aman, RPD tidak ter-impact (C11 pass). ${strategyNote}`,
    };
  }

  return {
    constraintId: 'C11',
    spec,
    status: 'fail',
    violations,
    evaluatedAt,
    summary:
      `${violations.length} perubahan pagu akan ter-impact RPD — eskalasi ke ` +
      `revisi DIPA Halaman III (kewenangan KAPK/Eselon I). ${strategyNote}`,
  };
}

/**
 * Internal helper — construct pending ConstraintResult untuk kasus rpdsData
 * unavailable. Shared antara mode 'permisif' (changedLeaves > 0 path) dan
 * mode 'ketat' (always-first-check path).
 *
 * @param spec ConstraintSpec C11 (passed in untuk avoid double lookup)
 * @param evaluatedAt ISO timestamp
 * @param changedCount Jumlah changed leaves (untuk message content)
 * @param strategyNote User-facing note tentang mode aktif
 */
function buildPendingResult(
  spec: ConstraintResult['spec'],
  evaluatedAt: string,
  changedCount: number,
  strategyNote: string
): ConstraintResult {
  return {
    constraintId: 'C11',
    spec,
    status: 'pending',
    violations: [
      {
        constraintId: 'C11',
        severity: 'blocker',
        message:
          `${changedCount} perubahan pagu terdeteksi tetapi data RPD ` +
          `belum tersedia di ValidationContext. Validator tidak bisa evaluate ` +
          `apakah revisi POK ini akan ter-impact RPD (Halaman III DIPA). ` +
          `Mohon pastikan rpdsData ter-wire dari App.tsx state ke validator ` +
          `context, atau coba refresh halaman.`,
        detail: {
          reason: 'rpd_context_unavailable',
          changedLeavesCount: changedCount,
        },
      },
    ],
    evaluatedAt,
    summary: `Pending — ${changedCount} perubahan terdeteksi tapi rpdsData unavailable. ${strategyNote}`,
  };
}
