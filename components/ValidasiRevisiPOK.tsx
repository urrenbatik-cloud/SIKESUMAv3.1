// ============================================================================
// SIKESUMA v3.1 · ValidasiRevisiPOK — Phase 3b UI
// ============================================================================
// File          : components/ValidasiRevisiPOK.tsx
// Phase         : Tier 4a Phase 3b — UI integration
// Date          : 11 Mei 2026
//
// Main tab orchestrator untuk sub-tab "1.5 Validasi Revisi POK".
// Renders:
//   1. ValidationDashboardHeader — aggregate status + Validate Now button
//   2. 12-card grid grouped by sub-branch (4a / 4b / 4c)
//   3. Inline detail panel (di bawah grid, conditional saat user click card)
//
// Engine: runAllValidators(ctx) dipanggil saat Validate Now click atau
// initial mount. Per Decision Q4 (manual button) + Q7 (full re-run on demand).
//
// Spec source: docs/TIER-4A-PHASE-3-UI-DESIGN.md §3, §6, §11 (Q-UI-2 inline)
// ============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { PaguSection } from '../types';
import type { ConstraintId, ConstraintResult, ValidationResult } from '../utils/validators/types';
import { runAllValidators, isTodoState, getTodoSubBranch } from '../utils/validators/runAllValidators';
import ValidationDashboardHeader from './ValidationDashboardHeader';
import ValidationConstraintCard from './ValidationConstraintCard';
import { ChevronDown, ExternalLink, X as CloseIcon } from 'lucide-react';

interface ValidasiRevisiPOKProps {
  paguSections: PaguSection[];
  selectedYear: number;
  /**
   * Callback untuk navigate ke tab 1.1 Pagu Anggaran saat user
   * klik "→ Pagu Anggaran" di affected row list. Phase 3b: callback
   * boleh no-op kalau parent belum wire (akan di-wire di Phase 3d).
   */
  onNavigateToPagu?: (sectionId?: string, rowId?: string) => void;
  /**
   * [Tier 4a Phase 3c] Constraint yang harus auto-selected saat tab open
   * (consumed dari pendingValidasiConstraint state di App.tsx). Set saat
   * user klik validation dot di Pagu Anggaran tab — landing di sini
   * langsung expand detail panel constraint yang relevant.
   */
  initialSelectedConstraint?: ConstraintId | null;
  /**
   * Callback untuk clear pendingValidasiConstraint di parent setelah
   * di-consume. Mencegah re-trigger saat user tab away + back.
   */
  onPendingConsumed?: () => void;
  /**
   * [Tier 4b Phase 3c] LHR APIP acknowledgment untuk C8 validator.
   * Bidirectional state — boolean dari App.tsx per-year, change handler
   * propagate balik ke parent untuk update.
   */
  lhrApipAcknowledged: boolean;
  onLhrApipChange: (acknowledged: boolean) => void;
}

const ValidasiRevisiPOK: React.FC<ValidasiRevisiPOKProps> = ({
  paguSections,
  selectedYear,
  onNavigateToPagu,
  initialSelectedConstraint,
  onPendingConsumed,
  lhrApipAcknowledged,
  onLhrApipChange,
}) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedConstraint, setSelectedConstraint] = useState<ConstraintId | null>(null);

  // ─── Validate handler — full re-run per Q7 ─────────────────────────
  const handleValidate = useCallback(() => {
    setIsValidating(true);
    // Defer ~50ms supaya UI sempat update isValidating=true (spinner visible)
    setTimeout(() => {
      const newResult = runAllValidators({
        ta: selectedYear,
        sections: paguSections,
        evaluatedAt: new Date(),
        lhrApipAcknowledged,  // [Tier 4b] C8 gate
      });
      setResult(newResult);
      setIsValidating(false);
    }, 50);
  }, [paguSections, selectedYear, lhrApipAcknowledged]);

  // Initial validation saat tab di-buka. ValidasiRevisiPOK di-unmount
  // saat user pindah tab, jadi useEffect ini fire sekali per mount.
  // Auto-revalidate saat paguSections berubah implicit via handleValidate
  // useCallback dependency — kalau parent provide stale sections, fresh
  // mount tetap evaluate latest data.
  useEffect(() => {
    handleValidate();
  }, [handleValidate]);

  // [Tier 4a Phase 3c] Sync initialSelectedConstraint dari parent state.
  // Saat user klik validation dot di Pagu Anggaran → App.tsx set pending
  // → mount/update di sini → auto-expand detail panel. Clear di parent
  // setelah consumed agar tidak re-trigger saat tab away+back.
  useEffect(() => {
    if (initialSelectedConstraint) {
      setSelectedConstraint(initialSelectedConstraint);
      onPendingConsumed?.();
    }
  }, [initialSelectedConstraint, onPendingConsumed]);

  // ─── Group results by sub-branch untuk grid layout ──────────────────
  const groupedResults = useMemo(() => {
    if (!result) return null;
    const subBranches: Record<'4a' | '4b' | '4c', ConstraintId[]> = {
      '4a': ['C1', 'C2', 'C3', 'C4', 'C5'],
      '4b': ['C6', 'C7', 'C8', 'C9'],
      '4c': ['C10', 'C11', 'C12'],
    };
    return subBranches;
  }, [result]);

  const selectedResult = selectedConstraint && result
    ? result.results[selectedConstraint]
    : null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <ValidationDashboardHeader
        result={result}
        isValidating={isValidating}
        onValidate={handleValidate}
        ta={selectedYear}
        lhrApipAcknowledged={lhrApipAcknowledged}
        onLhrApipChange={onLhrApipChange}
      />

      {/* 12-card grid grouped by sub-branch */}
      {groupedResults && result && (
        <>
          <ConstraintGroupSection
            label="4a — Pagu Structure"
            subtitle="5 constraints · IMPLEMENTED"
            ids={groupedResults['4a']}
            results={result.results}
            selectedConstraint={selectedConstraint}
            onSelect={setSelectedConstraint}
          />
          <ConstraintGroupSection
            label="4b — Revisi Mechanism"
            subtitle="4 constraints · IMPLEMENTED"
            ids={groupedResults['4b']}
            results={result.results}
            selectedConstraint={selectedConstraint}
            onSelect={setSelectedConstraint}
          />
          <ConstraintGroupSection
            label="4c — Procedural & References"
            subtitle="3 constraints · BELUM TERSEDIA"
            ids={groupedResults['4c']}
            results={result.results}
            selectedConstraint={selectedConstraint}
            onSelect={setSelectedConstraint}
          />
        </>
      )}

      {/* Inline detail panel (conditional) */}
      {selectedResult && (
        <DetailPanel
          result={selectedResult}
          paguSections={paguSections}
          onClose={() => setSelectedConstraint(null)}
          onNavigateToPagu={onNavigateToPagu}
        />
      )}
    </div>
  );
};

// ─── Sub-component: ConstraintGroupSection ──────────────────────────────

interface ConstraintGroupSectionProps {
  label: string;
  subtitle: string;
  ids: ConstraintId[];
  results: Record<ConstraintId, ConstraintResult>;
  selectedConstraint: ConstraintId | null;
  onSelect: (id: ConstraintId) => void;
}

const ConstraintGroupSection: React.FC<ConstraintGroupSectionProps> = ({
  label,
  subtitle,
  ids,
  results,
  selectedConstraint,
  onSelect,
}) => (
  <div>
    <div className="flex items-baseline gap-3 mb-3 px-1">
      <h3 className="text-sm font-black text-slate-700 tracking-wide">{label}</h3>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {ids.map(id => (
        <ValidationConstraintCard
          key={id}
          result={results[id]}
          isSelected={selectedConstraint === id}
          onSelect={() => onSelect(id)}
        />
      ))}
    </div>
  </div>
);

// ─── Sub-component: DetailPanel (inline expandable) ─────────────────────

interface DetailPanelProps {
  result: ConstraintResult;
  paguSections: PaguSection[];
  onClose: () => void;
  onNavigateToPagu?: (sectionId?: string, rowId?: string) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  result,
  paguSections,
  onClose,
  onNavigateToPagu,
}) => {
  const isTodo = isTodoState(result);
  const subBranch = getTodoSubBranch(result);

  // Aggregate affected row info dari violations
  const affectedRows = useMemo(() => {
    const ids = new Set<string>();
    result.violations.forEach(v => {
      v.affectedRowIds?.forEach(id => ids.add(id));
    });
    return Array.from(ids).map(rowId => {
      // Find row + parent section
      for (const section of paguSections) {
        const row = section.rows.find(r => r.id === rowId);
        if (row) {
          return {
            rowId,
            kode: row.kode,
            description: row.description,
            sectionId: section.id,
            sectionTitle: section.title,
          };
        }
      }
      return { rowId, kode: '?', description: '(row not found)', sectionId: '?', sectionTitle: '?' };
    });
  }, [result, paguSections]);

  const statusLabelColor =
    result.status === 'pass' ? 'text-emerald-700 bg-emerald-100'
    : result.status === 'warn' ? 'text-amber-700 bg-amber-100'
    : result.status === 'fail' ? 'text-red-700 bg-red-100'
    : result.status === 'pending' ? 'text-blue-700 bg-blue-100'
    : 'text-slate-600 bg-slate-100';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Detail header */}
      <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono font-black text-sm bg-slate-100 rounded-md px-2 py-0.5 text-slate-700">
              {result.constraintId}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest rounded-md px-2 py-0.5 ${statusLabelColor}`}>
              {isTodo ? 'BELUM TERSEDIA' : result.status}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {result.spec.severity === 'blocker' ? '🔴 Blocker' : result.spec.severity === 'warning' ? '🟡 Warning' : 'ℹ️ Info'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-700 mb-1">{result.spec.title}</h3>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{result.spec.pasal}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Tutup detail panel"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Algoritma
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">{result.spec.description}</p>
      </div>

      {/* Summary */}
      {result.summary && !isTodo && (
        <div className="mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Summary
          </p>
          <p className="text-sm text-slate-700 font-medium">{result.summary}</p>
        </div>
      )}

      {/* Todo notice */}
      {isTodo && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4">
          <p className="text-sm text-slate-600">
            Validator untuk constraint ini <strong>belum di-implementasi</strong>.
            Akan tersedia di <strong>Tier {subBranch}</strong> (sub-branch{' '}
            <code className="font-mono bg-slate-100 px-1 rounded">
              feature/tier-{subBranch}-{subBranch === '4b' ? 'revisi-mechanism' : 'procedural-references'}
            </code>).
          </p>
        </div>
      )}

      {/* Violations */}
      {result.violations.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Violations ({result.violations.length})
          </p>
          <ul className="space-y-3">
            {result.violations.map((v, idx) => (
              <li key={idx} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm text-slate-700 leading-relaxed mb-2">{v.message}</p>
                {v.detail && (
                  <details className="mt-2">
                    <summary className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600">
                      Detail teknis
                      <ChevronDown size={12} className="inline-block ml-1" />
                    </summary>
                    <pre className="mt-2 text-[11px] font-mono bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto text-slate-600">
                      {JSON.stringify(v.detail, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected rows */}
      {affectedRows.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Affected Rows ({affectedRows.length})
          </p>
          <ul className="space-y-2">
            {affectedRows.map(row => (
              <li
                key={row.rowId}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono font-bold text-slate-700">{row.kode}</p>
                  <p className="text-xs text-slate-500 truncate">{row.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Section: <code className="font-mono">{row.sectionId}</code>
                  </p>
                </div>
                {onNavigateToPagu && (
                  <button
                    type="button"
                    onClick={() => onNavigateToPagu(row.sectionId, row.rowId)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Pagu Anggaran
                    <ExternalLink size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer — evaluated at */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400">
        Evaluated at: <span className="font-mono">{new Date(result.evaluatedAt).toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
};

export default ValidasiRevisiPOK;
