// ============================================================================
// SIKESUMA Tier 5a Phase 2.2 — State Machine for Usulan Revisi POK
// ============================================================================
// File          : utils/usulanRevisiStateMachine.ts
// Tier/Phase    : Tier 5a — Phase 2.2 (state machine + R6+ override)
// Reference     : docs/TIER-5-DESIGN.md §4.1 diagram + §4.2 rules + §4.3 validator
// Decisions     : R6 permissive rejection paths + R6+ manual override catch-all
//                 R7c snapshot side-effect gating (auto-only, not via override)
//
// Normal flow:
//   draft → direkomendasi → diteruskan → ditetapkan → berlaku_efektif
//   any-except-berlaku_efektif → ditolak (normal #5)
//
// R6+ Manual Override (catch-all any → any with mandatory reason):
//   - berlaku_efektif → ditolak (post-fact rejection per Itjenad temuan)
//   - ditetapkan → draft (revisi ulang)
//   - ditolak → draft (resubmit)
//   - any other unusual flow
//
// IMPORTANT — Override TIDAK trigger normal side effects:
//   ditetapkan → berlaku_efektif via Override BUKAN create snapshot.
//   Snapshot HANYA via normal auto-transition (rule #4) untuk audit integrity.
// ============================================================================

import type {
  UsulanRevisi,
  UsulanStatus,
} from '../types';

// ─── Public API types ──────────────────────────────────────────────────────

/**
 * Side effect identifier yang dilaporkan ke caller saat transisi allowed.
 * Caller (service layer) bertanggung jawab untuk eksekusi side effect ini.
 */
export type TransitionSideEffect = 'create_snapshot' | 'send_notification';

/**
 * Konteks untuk validasi transisi state machine. Caller fill semua relevant
 * fields sesuai operasi yang di-attempt.
 */
export interface TransitionContext {
  fromStatus: UsulanStatus;
  toStatus: UsulanStatus;
  usulan: UsulanRevisi;

  // Optional validators data
  /** Hasil run validator C1-C12 untuk transition draft → direkomendasi (rule #1). */
  validatorsPassed?: boolean;
  /** LHR APIP acknowledge flag untuk transition draft → direkomendasi (rule #1). */
  lhrApipAcknowledged?: boolean;
  /** Current date (ISO) untuk transition ditetapkan → berlaku_efektif (rule #4). */
  now?: string;
  /** Reject reason text untuk transition any → ditolak (rule #5). */
  rejectReason?: string;

  // R6+ override path
  /** Set true untuk bypass normal rules, append manual_override_log. */
  isManualOverride?: boolean;
  /** Mandatory min 5 char if isManualOverride. */
  overrideReason?: string;
}

/**
 * Hasil validasi transisi. Caller pakai `.allowed` untuk gate operasi.
 * `.sideEffects` berisi action yang HARUS di-execute oleh caller saat allowed.
 */
export interface TransitionResult {
  allowed: boolean;
  reason?: string;                          // human-readable kenapa allowed/disallowed
  sideEffects?: TransitionSideEffect[];     // hanya populated kalau allowed
  isOverride?: boolean;                     // marker — caller catat ke manual_override_log
}

// ─── R6+ override config ───────────────────────────────────────────────────

const OVERRIDE_REASON_MIN_LENGTH = 5;

// ─── Per-transition validators (normal flow) ───────────────────────────────

type RuleValidator = (ctx: TransitionContext) => TransitionResult;

/**
 * Rule #1 — draft → direkomendasi.
 * Pre-condition: validator C1-C12 all pass/warn/na + LHR APIP acknowledged.
 */
const validateDraftToDirekomendasi: RuleValidator = (ctx) => {
  if (!ctx.validatorsPassed) {
    return {
      allowed: false,
      reason: 'Validator C1-C12 belum semua pass. Perbaiki FAIL/PENDING sebelum submit.',
    };
  }
  if (!ctx.lhrApipAcknowledged) {
    return {
      allowed: false,
      reason: 'LHR APIP belum di-acknowledge. Check checkbox C8 sebelum submit.',
    };
  }
  return { allowed: true, reason: 'Validator pass + LHR APIP acknowledged.' };
};

/**
 * Rule #2 — direkomendasi → diteruskan.
 * Pre-condition: none (Karumkit approve action, R5a proxy).
 */
const validateDirekomendasiToDiteruskan: RuleValidator = () => {
  return { allowed: true, reason: 'Karumkit approve (R5a proxy).' };
};

/**
 * Rule #3 — diteruskan → ditetapkan.
 * Pre-condition: `no_sk` + `tanggal_penetapan` di data sudah set.
 */
const validateDiteruskanToDitetapkan: RuleValidator = (ctx) => {
  const data = ctx.usulan.data || {};
  if (!data.no_sk || data.no_sk.trim().length === 0) {
    return {
      allowed: false,
      reason: 'No SK belum di-set. Wajib isi sebelum ditetapkan.',
    };
  }
  if (!data.tanggal_penetapan) {
    return {
      allowed: false,
      reason: 'Tanggal penetapan SK belum di-set. Wajib isi sebelum ditetapkan.',
    };
  }
  return { allowed: true, reason: 'SK + tanggal penetapan tersedia.' };
};

/**
 * Rule #4 — ditetapkan → berlaku_efektif.
 * Pre-condition: current date >= tanggal_berlaku_efektif.
 * Side effect: create_snapshot (R2b full snapshot saat efektif).
 */
const validateDitetapkanToBerlakuEfektif: RuleValidator = (ctx) => {
  const data = ctx.usulan.data || {};
  if (!data.tanggal_berlaku_efektif) {
    return {
      allowed: false,
      reason: 'Tanggal berlaku efektif belum di-set di data usulan.',
    };
  }
  const now = ctx.now || new Date().toISOString();
  // Compare YYYY-MM-DD prefix (ISO date-only) — safe across timezones
  const nowDate = now.slice(0, 10);
  const efektifDate = data.tanggal_berlaku_efektif.slice(0, 10);
  if (nowDate < efektifDate) {
    return {
      allowed: false,
      reason: `Tanggal berlaku efektif ${efektifDate} belum tercapai (sekarang: ${nowDate}).`,
    };
  }
  return {
    allowed: true,
    reason: 'Tanggal berlaku efektif tercapai. Snapshot POK akan di-create.',
    sideEffects: ['create_snapshot'],
  };
};

/**
 * Rule #5 — any-state-except-berlaku_efektif → ditolak.
 * Pre-condition: reason text. R6 permissive: draft → ditolak allowed.
 * berlaku_efektif → ditolak HANYA via R6+ override (post-fact).
 */
const validateToDitolak: RuleValidator = (ctx) => {
  if (ctx.fromStatus === 'berlaku_efektif') {
    return {
      allowed: false,
      reason:
        'berlaku_efektif → ditolak hanya boleh via Manual Override (R6+). ' +
        'Gunakan override path dengan reason audit Itjenad.',
    };
  }
  if (!ctx.rejectReason || ctx.rejectReason.trim().length === 0) {
    return {
      allowed: false,
      reason: 'Reason rejection wajib di-isi.',
    };
  }
  return { allowed: true, reason: 'Rejection allowed dengan reason.' };
};

// ─── Transition rule map ───────────────────────────────────────────────────
// Per design §4.2. Keys = from status, nested = to status.
// Missing entry = invalid normal transition (caller use override path kalau perlu).

type FromMap = { [to in UsulanStatus]?: RuleValidator };
type TransitionRulesMap = { [from in UsulanStatus]?: FromMap };

export const TRANSITION_RULES: TransitionRulesMap = {
  draft: {
    direkomendasi: validateDraftToDirekomendasi,
    ditolak: validateToDitolak,
  },
  direkomendasi: {
    diteruskan: validateDirekomendasiToDiteruskan,
    ditolak: validateToDitolak,
  },
  diteruskan: {
    ditetapkan: validateDiteruskanToDitetapkan,
    ditolak: validateToDitolak,
  },
  ditetapkan: {
    berlaku_efektif: validateDitetapkanToBerlakuEfektif,
    ditolak: validateToDitolak,
  },
  // berlaku_efektif → ditolak: hanya via R6+ override (rule #5 reject berlaku_efektif)
  // berlaku_efektif: terminal state, only override boleh transit out
  // ditolak: terminal state, only override boleh transit out
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Validasi apakah transisi state allowed.
 *
 * Algoritma:
 *   1. Kalau isManualOverride=true → validate reason ≥ 5 char, allowed=true with isOverride flag.
 *      Override TIDAK trigger normal side effects (R7c integrity untuk snapshot).
 *   2. Kalau from === to → no-op transition disallowed (caller bug).
 *   3. Lookup TRANSITION_RULES[from][to]. Tidak ada → disallowed dengan saran override.
 *   4. Run rule validator dengan ctx.
 *
 * @returns TransitionResult — caller cek `.allowed` untuk gate operasi
 */
export function validateTransition(ctx: TransitionContext): TransitionResult {
  // R6+ override path (catch-all any → any with mandatory reason)
  if (ctx.isManualOverride) {
    const reason = (ctx.overrideReason || '').trim();
    if (reason.length < OVERRIDE_REASON_MIN_LENGTH) {
      return {
        allowed: false,
        reason: `Manual override membutuhkan reason minimal ${OVERRIDE_REASON_MIN_LENGTH} karakter.`,
      };
    }
    if (ctx.fromStatus === ctx.toStatus) {
      return {
        allowed: false,
        reason: 'Override no-op transition (from === to) tidak diizinkan.',
      };
    }
    // Override SUKSES — caller wajib append manual_override_log entry.
    // No side effects (snapshot integrity: hanya via normal rule #4).
    return {
      allowed: true,
      reason: 'Manual override granted (R6+). Audit log entry akan di-append.',
      isOverride: true,
    };
  }

  // No-op guard
  if (ctx.fromStatus === ctx.toStatus) {
    return {
      allowed: false,
      reason: `Transition no-op: ${ctx.fromStatus} → ${ctx.toStatus} (from === to).`,
    };
  }

  // Normal rule lookup
  const fromMap = TRANSITION_RULES[ctx.fromStatus];
  const rule = fromMap?.[ctx.toStatus];
  if (!rule) {
    return {
      allowed: false,
      reason:
        `Transition ${ctx.fromStatus} → ${ctx.toStatus} bukan normal flow. ` +
        `Gunakan Manual Override (R6+) dengan reason jika operasi ini sengaja.`,
    };
  }

  return rule(ctx);
}

/**
 * Helper — check apakah suatu status adalah terminal state (tidak ada normal outgoing).
 * `berlaku_efektif` + `ditolak` = terminal di V1.
 */
export function isTerminalStatus(status: UsulanStatus): boolean {
  return status === 'berlaku_efektif' || status === 'ditolak';
}

/**
 * Helper — list valid normal next states dari current status.
 * Berguna untuk UI Phase 5b populate action buttons dynamically.
 */
export function getNextStatuses(from: UsulanStatus): UsulanStatus[] {
  const fromMap = TRANSITION_RULES[from];
  if (!fromMap) return [];
  return Object.keys(fromMap) as UsulanStatus[];
}
