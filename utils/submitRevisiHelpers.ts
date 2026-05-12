// ============================================================================
// SIKESUMA Tier 5a Phase 2.4 — Submit Flow Pure Helpers
// ============================================================================
// File          : utils/submitRevisiHelpers.ts
// Tier/Phase    : Tier 5a — Phase 2.4 (Submit flow UI integration)
// Reference     : docs/TIER-5-DESIGN.md §8.1 deliverable #4, PHASE-2-BACKEND-API-REFERENCE.md Recipe A
// Decisions     : Konteks 1 fallback semantic (Sprint D Item #1) — pakai
//                 `isChangedRow` dari utils/validators/helpers.ts (single source
//                 of truth — AP-4 jangan duplicate helpers).
//
// Pure functions yang Submit handler di App.tsx pakai untuk:
//   1. Extract list rows yang berubah (effective Awal != effective Revisi)
//      bersama section_id parent (untuk addPerubahan call per row).
//   2. Build payload UsulanRevisiPerubahanData per changed row.
//
// Why separate module (bukan inline di App.tsx):
//   - Pure logic, mudah unit-tested
//   - App.tsx sudah besar (1250+ lines) + 7 baseline TS errors yang harus
//     preserved — minimize touch surface
//   - Reusable kalau Tier 5b butuh similar logic (e.g., diff viewer)
// ============================================================================

import type { PaguSection, UsulanRevisiPerubahanData } from '../types';
import { isChangedRow } from './validators/helpers';

/**
 * Output type per changed row — pair (section_id, row info) untuk addPerubahan.
 * `pagu_row_id` adalah PaguRow.id (referenced via FK semantic ke pagu_sections.data.rows[].id).
 */
export interface ChangedRowEntry {
  section_id: string;
  pagu_row_id: string;
  perubahanData: UsulanRevisiPerubahanData;
}

/**
 * Iterate semua sections + rows, return entries untuk rows yang ter-revisi
 * (per Konteks 1 fallback semantic — effective Awal != effective Revisi).
 *
 * NOTE: Tidak filter "leaf vs parent" — Submit flow capture SEMUA rows yang
 * effective values berbeda (regardless of leaf status). Reason: parent rows
 * yang showed as "changed" usually mean their leaves were also changed +
 * propagated up. Itjenad audit prefer see semua entries, biar mereka decide
 * granularity sendiri. Future V2: bisa filter to leaves only kalau audit
 * stakeholder request.
 *
 * Output sorted by section position kemudian row position (deterministic order
 * untuk audit trail consistency).
 *
 * @param sections Array PaguSection dari paguSections state
 * @returns Array ChangedRowEntry — kosong kalau tidak ada row berubah
 */
export function collectChangedRowsWithSection(
  sections: PaguSection[]
): ChangedRowEntry[] {
  const result: ChangedRowEntry[] = [];
  sections.forEach((section) => {
    section.rows.forEach((row) => {
      if (!isChangedRow(row)) return;
      // jumlahBiayaAwal + jumlahBiayaRevisi sudah effective post Konteks 1 TD fix
      // (commit 303df65 — PaguAnggaran.tsx onChange writes effective value).
      // Aman ambil raw value untuk audit payload.
      result.push({
        section_id: section.id,
        pagu_row_id: row.id,
        perubahanData: {
          kode: row.kode,
          description: row.description,
          nilai_semula: row.jumlahBiayaAwal ?? 0,
          nilai_revisi: row.jumlahBiayaRevisi ?? 0,
          section_id: section.id,
        },
      });
    });
  });
  return result;
}

/**
 * Generate human-readable summary text untuk Submit feedback toast / log.
 * Format: "N row berubah di M section" atau "1 row berubah di 1 section".
 *
 * @param entries Output dari collectChangedRowsWithSection
 * @returns String summary id-ID
 */
export function summarizeChangedRows(entries: ChangedRowEntry[]): string {
  const rowCount = entries.length;
  const sectionCount = new Set(entries.map((e) => e.section_id)).size;
  return `${rowCount} row berubah di ${sectionCount} section`;
}

// ─── Submit orchestration (pure, DI-friendly) ─────────────────────────────

/**
 * Discriminated result dari executeSubmitRevisiPOK. UI caller pakai `.kind`
 * untuk toast/log routing.
 */
export type SubmitRevisiResult =
  | { kind: 'no_changes' }
  | { kind: 'state_rejected'; reason: string; usulanId: string }
  | { kind: 'service_error'; message: string; phase: 'create' | 'perubahan' | 'validation' | 'transition' }
  | { kind: 'success'; usulanId: string; summary: string };

/**
 * Service dependencies — injected untuk testability. Production caller pass
 * imports dari services/usulanRevisiService.ts.
 *
 * Return types narrow ke field yang orchestrator butuh (just `id` dari
 * createUsulanDraft). Service production functions return UsulanRevisi
 * (richer) — assignable karena structural typing (UsulanRevisi has `id`).
 */
export interface SubmitRevisiServices {
  createUsulanDraft: (
    tahun: number,
    jenis: 'revisi_pok' | 'pagu_berubah',
    initialData?: Partial<import('../types').UsulanRevisiData>
  ) => Promise<{ id: string }>;
  addPerubahan: (
    usulanId: string,
    paguRowId: string,
    data: import('../types').UsulanRevisiPerubahanData
  ) => Promise<unknown>;
  recordValidationAttempt: (
    usulanId: string,
    result: 'pass' | 'fail' | 'pending',
    violations?: { constraintIds: string[]; total: number }
  ) => Promise<unknown>;
  transitionUsulan: (
    usulanId: string,
    toStatus: import('../types').UsulanStatus,
    ctxOverrides?: { validatorsPassed?: boolean; lhrApipAcknowledged?: boolean }
  ) => Promise<{ result: { allowed: boolean; reason?: string } }>;
}

/**
 * Orchestrate Submit Revisi POK sequence — pure async function (no UI
 * coupling). Returns discriminated result untuk UI feedback.
 *
 * Sequence (per PHASE-2-BACKEND-API-REFERENCE.md Recipe A):
 *   1. Extract changed rows; kalau 0 → return 'no_changes'
 *   2. createUsulanDraft → INSERT status='draft'
 *   3. addPerubahan × N (parallel — R5a single-user, no ordering concern)
 *   4. recordValidationAttempt 'pass' (audit Itjenad trail)
 *   5. transitionUsulan 'direkomendasi' dengan validatorsPassed +
 *      lhrApipAcknowledged. Kalau state machine reject → 'state_rejected'.
 *   6. Return 'success'
 *
 * Service errors di-bungkus 'service_error' dengan phase indicator untuk
 * UI surface (mis. "Submit gagal di phase perubahan: ...").
 */
export async function executeSubmitRevisiPOK(args: {
  paguSections: import('../types').PaguSection[];
  tahunAnggaran: number;
  lhrApipAcknowledged: boolean;
  /**
   * [Tier 5a Phase 2.5] R3c tied audit data — UsulanLhrApip populated dari
   * global state (`system_settings.lhr_apip_global`). Kalau caller tidak pass
   * (undefined), `initialData.lhr_apip` tidak di-populate — backward compat
   * Phase 2.4 behavior.
   *
   * Strategy A (V1 minimal) caller flow: derive via `deriveLhrApipForSubmission`
   * dengan placeholder `nomor: "(belum diisi)"` dan `tanggal` = ISO date dari
   * `acknowledged_at`. Strategy B (richer V2 upgrade) caller flow: pass nilai
   * real dari form input.
   */
  lhrApipForYear?: import('../types').UsulanLhrApip;
  diusulkanOleh?: string;
  services: SubmitRevisiServices;
}): Promise<SubmitRevisiResult> {
  const {
    paguSections,
    tahunAnggaran,
    lhrApipAcknowledged,
    lhrApipForYear,
    diusulkanOleh = 'Sie Renbang (R5a proxy)',
    services,
  } = args;

  // 1. Extract changed rows
  const changedEntries = collectChangedRowsWithSection(paguSections);
  if (changedEntries.length === 0) {
    return { kind: 'no_changes' };
  }
  const summary = summarizeChangedRows(changedEntries);

  // 2. Create draft
  let usulanId: string;
  try {
    const usulan = await services.createUsulanDraft(tahunAnggaran, 'revisi_pok', {
      tanggal_pengajuan: new Date().toISOString().slice(0, 10),
      diusulkan_oleh: diusulkanOleh,
      justifikasi: `Revisi POK TA ${tahunAnggaran} — ${summary}. Detail per row di usulan_revisi_perubahan.`,
      // [Tier 5a Phase 2.5] R3c tied audit — populate kalau caller pass payload.
      // Strategy A (V1 minimal) → caller derive via deriveLhrApipForSubmission
      // dengan placeholder values. Strategy B (richer V2) → caller pass real nomor/tanggal.
      // Undefined → backward compat Phase 2.4 (lhr_apip column tetap kosong).
      ...(lhrApipForYear !== undefined && { lhr_apip: lhrApipForYear }),
    });
    usulanId = usulan.id;
  } catch (err) {
    return {
      kind: 'service_error',
      phase: 'create',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // 3. Perubahan inserts (parallel)
  try {
    await Promise.all(
      changedEntries.map((entry) =>
        services.addPerubahan(usulanId, entry.pagu_row_id, entry.perubahanData)
      )
    );
  } catch (err) {
    return {
      kind: 'service_error',
      phase: 'perubahan',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // 4. Validation attempt
  try {
    await services.recordValidationAttempt(usulanId, 'pass');
  } catch (err) {
    return {
      kind: 'service_error',
      phase: 'validation',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // 5. Transition ke direkomendasi
  try {
    const transitionResult = await services.transitionUsulan(usulanId, 'direkomendasi', {
      validatorsPassed: true,
      lhrApipAcknowledged,
    });
    if (!transitionResult.result.allowed) {
      return {
        kind: 'state_rejected',
        reason: transitionResult.result.reason ?? 'unknown',
        usulanId,
      };
    }
  } catch (err) {
    return {
      kind: 'service_error',
      phase: 'transition',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // 6. Success
  return { kind: 'success', usulanId, summary };
}

// ============================================================================
// SIKESUMA Tier 5a Phase 2.5 — LHR APIP R3c Persistence + Banner Helpers
// ============================================================================
// Strategy A (V1 minimal) per Owner decision 13 Mei 2026. Forward-compat ke
// Strategy B (richer) — schema sudah include optional nomor + tanggal.
//
// Persistence: pakai existing `getSetting<T>` / `saveSetting<T>` di lib/supabase.ts
// dengan key `lhr_apip_global` (JSONB di table `system_settings`). BUKAN tambah
// service module baru — JSONB-native pattern AP-8 (Konteks 4 dr Ferry).
//
// Reference: docs/TIER-5-DESIGN.md §3.3 + §5; PHASE-2-BACKEND-API-REFERENCE.md
// Recipe D + Recipe E; OWNER-POLICY §R.2.
// ============================================================================

/**
 * Per-tahun entry shape untuk LHR APIP acknowledgment global state.
 *
 * Strategy A (V1 minimal): `acknowledged` + `acknowledged_at` cukup. UI hanya
 * checkbox C8. Tied audit (`UsulanLhrApip`) pakai placeholder values via
 * `deriveLhrApipForSubmission`.
 *
 * Strategy B (richer V2 upgrade-path): `nomor` + `tanggal` di-isi dari form
 * input. Tidak perlu schema migration JSONB key — field optional sudah include
 * sejak V1 sehingga upgrade backward-compat.
 */
export interface LhrApipYearEntry {
  acknowledged: boolean;
  acknowledged_at: string;                  // ISO timestamp saat user check checkbox
  nomor?: string;                            // V2 forward-compat (Strategy B)
  tanggal?: string;                          // V2 forward-compat ISO date
}

/**
 * Top-level shape stored di `system_settings.lhr_apip_global` (JSONB key).
 * Year-keyed object — supports multi-year operation (TA 2026, TA 2027, dll).
 */
export type LhrApipGlobalState = Record<number, LhrApipYearEntry>;

/**
 * Storage key constant — single source of truth.
 * AP-4 (jangan duplicate string literal di multiple call sites).
 */
export const LHR_APIP_GLOBAL_KEY = 'lhr_apip_global' as const;

/**
 * Banner V1 predicate (R4a Owner choice — text-only, no link).
 *
 * Returns true kalau banner harus di-show untuk year `tahunAnggaran` —
 * yaitu kalau global state tidak/belum ada entry acknowledged untuk year ini.
 *
 * Pure function untuk testability. Caller di App.tsx atau ValidasiRevisiPOK
 * pakai untuk conditional render banner.
 *
 * @param state Global LHR APIP state (null kalau belum load atau Supabase error)
 * @param tahunAnggaran Year to check
 * @returns true kalau banner show, false kalau acknowledged
 *
 * @example
 * shouldShowLhrApipBanner(null, 2026)                              // → true (state belum load)
 * shouldShowLhrApipBanner({}, 2026)                                // → true (no entry)
 * shouldShowLhrApipBanner({2026: {acknowledged: false, ...}}, 2026) // → true
 * shouldShowLhrApipBanner({2026: {acknowledged: true,  ...}}, 2026) // → false
 */
export function shouldShowLhrApipBanner(
  state: LhrApipGlobalState | null,
  tahunAnggaran: number
): boolean {
  if (!state) return true;
  return !state[tahunAnggaran]?.acknowledged;
}

/**
 * Derive tied audit payload (`UsulanLhrApip`) dari global state untuk Submit flow.
 *
 * Strategy A placeholder behavior:
 *   - `nomor`: kalau V2 field tersedia → pakai itu; kalau tidak → `"(belum diisi)"`
 *   - `tanggal`: kalau V2 field tersedia → pakai itu; kalau tidak →
 *     ISO date slice (YYYY-MM-DD) dari `acknowledged_at`
 *   - `acknowledged_at`: copy verbatim dari entry
 *
 * Returns null kalau:
 *   - state null (belum load)
 *   - tidak ada entry untuk year
 *   - entry exists tapi `acknowledged: false` (gate Submit di handler)
 *
 * Caller di App.tsx pass result ke `executeSubmitRevisiPOK({lhrApipForYear})` —
 * orchestrator akan populate `usulan_revisi.data.lhr_apip` kalau non-null.
 *
 * @param state Global LHR APIP state
 * @param tahunAnggaran Year to derive untuk
 * @returns `UsulanLhrApip` audit payload atau null kalau tidak applicable
 *
 * @example Strategy A (no V2 fields)
 *   deriveLhrApipForSubmission(
 *     {2026: {acknowledged: true, acknowledged_at: "2026-05-13T10:30:00.000Z"}},
 *     2026
 *   )
 *   → {nomor: "(belum diisi)", tanggal: "2026-05-13", acknowledged_at: "2026-05-13T10:30:00.000Z"}
 *
 * @example Strategy B (V2 fields populated)
 *   deriveLhrApipForSubmission(
 *     {2026: {acknowledged: true, acknowledged_at: "...", nomor: "LHR-01/2026", tanggal: "2026-05-01"}},
 *     2026
 *   )
 *   → {nomor: "LHR-01/2026", tanggal: "2026-05-01", acknowledged_at: "..."}
 */
export function deriveLhrApipForSubmission(
  state: LhrApipGlobalState | null,
  tahunAnggaran: number
): import('../types').UsulanLhrApip | null {
  const entry = state?.[tahunAnggaran];
  if (!entry?.acknowledged) return null;
  return {
    nomor: entry.nomor ?? '(belum diisi)',
    tanggal: entry.tanggal ?? entry.acknowledged_at.slice(0, 10),
    acknowledged_at: entry.acknowledged_at,
  };
}
