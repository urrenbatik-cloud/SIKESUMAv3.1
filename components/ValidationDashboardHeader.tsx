// ============================================================================
// SIKESUMA v3.1 · ValidationDashboardHeader — Phase 3b UI
// ============================================================================
// File          : components/ValidationDashboardHeader.tsx
// Phase         : Tier 4a Phase 3b — UI integration
// Date          : 11 Mei 2026
//
// Renders aggregate status header di top dashboard Validasi Revisi POK:
//   - 5 counter chips (PASS / WARN / FAIL / PENDING / BELUM TERSEDIA)
//   - Progress bar implemented vs total (X/12)
//   - Last validated timestamp (relative format)
//   - "Validate Now" button (manual trigger per Decision Q4)
//   - "Submit Revisi POK" button (disabled selama 4b+4c belum ready)
//
// Spec source: docs/TIER-4A-PHASE-3-UI-DESIGN.md §5
// ============================================================================

import React, { useMemo } from 'react';
import { RefreshCw, FileCheck2 } from 'lucide-react';
import type { ValidationResult, ConstraintId } from '../utils/validators/types';
import { isTodoState } from '../utils/validators/runAllValidators';

interface ValidationDashboardHeaderProps {
  result: ValidationResult | null;
  isValidating: boolean;
  onValidate: () => void;
  ta: number;
  /**
   * [Tier 4b Phase 3c] LHR APIP acknowledgment state untuk C8 validator.
   * Boolean: true = user sudah check checkbox; false = belum.
   * Per Decision S6 (in-memory v1) — state managed di App.tsx per-year.
   */
  lhrApipAcknowledged: boolean;
  onLhrApipChange: (acknowledged: boolean) => void;
  /**
   * [Tier 5a Phase 2.4] Submit handler — wire Submit button ke
   * service layer (createUsulanDraft → addPerubahan × N →
   * recordValidationAttempt → transitionUsulan 'direkomendasi').
   * Optional: kalau undefined, button disabled (graceful degradation untuk
   * test mount / preview).
   */
  onSubmit?: () => void;
  /**
   * [Tier 5a Phase 2.4] In-flight indicator — disable Submit button selama
   * service calls async pending. Render label 'Submitting...' kalau true.
   */
  isSubmitting?: boolean;
}

const ValidationDashboardHeader: React.FC<ValidationDashboardHeaderProps> = ({
  result,
  isValidating,
  onValidate,
  ta,
  lhrApipAcknowledged,
  onLhrApipChange,
  onSubmit,
  isSubmitting = false,
}) => {
  // ─── Compute counters separating real status vs todo ───────────────
  const counters = useMemo(() => {
    if (!result) {
      return { pass: 0, warn: 0, fail: 0, pending: 0, todo: 0, implemented: 0, total: 12 };
    }
    let todo = 0;
    const allIds: ConstraintId[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
    allIds.forEach(id => {
      if (isTodoState(result.results[id])) todo++;
    });
    // Subtract todo from na (todos are stored as 'na' status but visually separate)
    return {
      pass: result.passCount,
      warn: result.warnCount,
      fail: result.failCount,
      pending: result.pendingCount,
      todo,
      implemented: 12 - todo,
      total: 12,
    };
  }, [result]);

  // ─── Relative time format untuk last validated ──────────────────────
  const lastValidatedLabel = useMemo(() => {
    if (!result) return 'Belum di-validasi';
    const now = Date.now();
    const evalTime = new Date(result.evaluatedAt).getTime();
    const diffSec = Math.floor((now - evalTime) / 1000);
    if (diffSec < 5) return 'Baru saja';
    if (diffSec < 60) return `${diffSec} detik lalu`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    return new Date(result.evaluatedAt).toLocaleString('id-ID');
  }, [result]);

  // Submit button enabled hanya kalau semua 12 constraint pass/warn/na
  // (BUKAN fail BUKAN pending) — DAN semua 12 already implemented (todo=0)
  // DAN lhrApipAcknowledged (C8 gate per Tier 4b Phase 3c)
  const canSubmit = result?.canSubmit ?? false;
  const allImplemented = counters.todo === 0;
  const submitEnabled = canSubmit && allImplemented && lhrApipAcknowledged;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6">
      {/* Title row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Status Validasi Revisi POK
          </p>
          <h2 className="text-xl font-black text-slate-700">
            TA {ta}
          </h2>
        </div>
        <button
          type="button"
          onClick={onValidate}
          disabled={isValidating}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
            transition-all
            ${isValidating
              ? 'bg-slate-200 text-slate-500 cursor-wait'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'}
          `.replace(/\s+/g, ' ').trim()}
        >
          <RefreshCw size={16} className={isValidating ? 'animate-spin' : ''} />
          {isValidating ? 'Validating...' : 'Validate Now'}
        </button>
      </div>

      {/* Counter chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <CounterChip count={counters.pass} label="PASS" color="emerald" />
        <CounterChip count={counters.warn} label="WARN" color="amber" />
        <CounterChip count={counters.fail} label="FAIL" color="red" />
        <CounterChip count={counters.pending} label="PENDING" color="blue" />
        <CounterChip count={counters.todo} label="BELUM TERSEDIA" color="slate" />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          <span>Implementasi Validator</span>
          <span className="font-mono">{counters.implemented}/{counters.total}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(counters.implemented / counters.total) * 100}%` }}
          />
        </div>
      </div>

      {/* [Tier 4b Phase 3c] LHR APIP acknowledgment checkbox (C8 gate) */}
      <label
        className={`
          flex items-start gap-3 rounded-xl border-2 p-3 mb-4 cursor-pointer
          transition-all
          ${lhrApipAcknowledged
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-amber-300 bg-amber-50 hover:bg-amber-100'}
        `.replace(/\s+/g, ' ').trim()}
      >
        <input
          type="checkbox"
          checked={lhrApipAcknowledged}
          onChange={(e) => onLhrApipChange(e.target.checked)}
          className="mt-1 w-4 h-4 rounded accent-emerald-600 cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold leading-tight ${lhrApipAcknowledged ? 'text-emerald-800' : 'text-amber-800'}`}>
            Saya konfirmasi sudah review LHR APIP atas RKA TA {ta} sebelum mengajukan revisi POK kewenangan KPA
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Pasal 22 huruf b angka 2 Perdirjen Renhan Kemhan 7/2025 — wajib explicit acknowledge sebelum Submit Revisi POK
          </p>
        </div>
      </label>

      {/* Last validated + Submit button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Last validated: <span className="font-medium text-slate-700">{lastValidatedLabel}</span>
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!submitEnabled || isSubmitting || !onSubmit}
          title={
            !allImplemented
              ? 'Menunggu Tier 4c — validator lengkap C1-C12'
              : !lhrApipAcknowledged
                ? 'Check checkbox LHR APIP dulu sebelum submit (C8 pending)'
                : !canSubmit
                  ? 'Masih ada FAIL / PENDING — perbaiki sebelum submit'
                  : !onSubmit
                    ? 'Handler Submit belum tersedia (Phase 2.4 wiring incomplete)'
                    : isSubmitting
                      ? 'Sedang memproses submit...'
                      : 'Submit Revisi POK ke KPA'
          }
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
            transition-all
            ${submitEnabled && !isSubmitting && onSubmit
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
          `.replace(/\s+/g, ' ').trim()}
        >
          <FileCheck2 size={16} />
          {isSubmitting ? 'Submitting...' : 'Submit Revisi POK'}
        </button>
      </div>
    </div>
  );
};

// ─── Counter chip sub-component ─────────────────────────────────────────

interface CounterChipProps {
  count: number;
  label: string;
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'slate';
}

const CHIP_COLORS: Record<CounterChipProps['color'], { bg: string; text: string; numText: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', numText: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   numText: 'text-amber-600' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     numText: 'text-red-600' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    numText: 'text-blue-600' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   numText: 'text-slate-500' },
};

const CounterChip: React.FC<CounterChipProps> = ({ count, label, color }) => {
  const c = CHIP_COLORS[color];
  return (
    <div className={`${c.bg} rounded-xl p-3 text-center`}>
      <p className={`text-2xl font-black font-mono ${c.numText} leading-tight`}>{count}</p>
      <p className={`text-[9px] font-black ${c.text} uppercase tracking-widest mt-1`}>{label}</p>
    </div>
  );
};

export default ValidationDashboardHeader;
