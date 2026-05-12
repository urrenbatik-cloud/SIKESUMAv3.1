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
import type { PaguSection, RPDSection } from '../types';
import type { ConstraintId, ConstraintResult, ValidationResult } from '../utils/validators/types';
import { runAllValidators, isTodoState, getTodoSubBranch } from '../utils/validators/runAllValidators';
import ValidationDashboardHeader from './ValidationDashboardHeader';
import ValidationConstraintCard from './ValidationConstraintCard';
import { ChevronDown, ExternalLink, X as CloseIcon, Info } from 'lucide-react';

/**
 * [Tier 4c Phase 3c-nav] Cross-tab navigation target.
 * - 'pagu' = route ke sub-tab 1.1 Pagu Anggaran
 * - 'rpd'  = route ke sub-tab 1.3 RPD (NEW untuk C11 dual nav)
 */
type NavTarget = 'pagu' | 'rpd';

interface ValidasiRevisiPOKProps {
  paguSections: PaguSection[];
  selectedYear: number;
  /**
   * [Tier 4c Phase 3b] RPD sections untuk C11 cross-table check.
   * Wajib pass dari App.tsx (rpdSections state) agar C11 tidak stuck
   * pending. Optional secara type untuk graceful degradation kalau ada
   * test mount component standalone tanpa rpd state.
   */
  rpdSections?: RPDSection[];
  /**
   * [Tier 4c Phase 3c-nav T7] Unified navigation callback. Replaces
   * onNavigateToPagu. UI render dual buttons untuk C11 violations
   * (target='pagu' + target='rpd'), single button untuk constraints lain.
   * Parent (App.tsx) handle subtab change + pendingRowHighlight set
   * sesuai target.
   */
  onNavigate?: (target: NavTarget, sectionId?: string, rowId?: string) => void;
  /**
   * @deprecated Tier 4c Phase 3c-nav: gunakan onNavigate. Keep selama
   * transition untuk backward compat — akan dihapus di Phase 3d cleanup.
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
  /**
   * [Tier 5a Phase 2.4] Submit handler — pass-through ke
   * ValidationDashboardHeader. Optional kalau parent belum wire (test
   * scenarios atau Phase 2.4 incomplete state).
   */
  onSubmit?: () => void;
  /**
   * [Tier 5a Phase 2.4] In-flight indicator — pass-through ke header.
   */
  isSubmitting?: boolean;
}

const ValidasiRevisiPOK: React.FC<ValidasiRevisiPOKProps> = ({
  paguSections,
  selectedYear,
  rpdSections,
  onNavigate,
  onNavigateToPagu,
  initialSelectedConstraint,
  onPendingConsumed,
  lhrApipAcknowledged,
  onLhrApipChange,
  onSubmit,
  isSubmitting,
}) => {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedConstraint, setSelectedConstraint] = useState<ConstraintId | null>(null);

  // [Tier 4c Phase 3c-toggle T9] C11 strategy preference dengan
  // localStorage default. UI toggle banner (di-bawah ValidationDashboardHeader)
  // call setC11Strategy + persist ke localStorage. Re-validate auto-trigger
  // via useEffect dependency [handleValidate] yang deps include c11Strategy.
  const [c11Strategy, setC11Strategy] = useState<'permisif' | 'ketat'>(() => {
    if (typeof window === 'undefined') return 'permisif'; // SSR-safe
    const stored = window.localStorage.getItem('c11PendingStrategy');
    return stored === 'ketat' ? 'ketat' : 'permisif';
  });

  // [Tier 4c Phase 3c-toggle] Persist toggle change ke localStorage +
  // trigger immediate re-validate (handleValidate deps include c11Strategy).
  const handleC11StrategyChange = useCallback((strategy: 'permisif' | 'ketat') => {
    setC11Strategy(strategy);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('c11PendingStrategy', strategy);
    }
  }, []);

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
        rpdsData: rpdSections, // [Tier 4c Phase 3b] C11 cross-table input
        c11Strategy,           // [Tier 4c Phase 3b] T9 toggle (default permisif)
      });
      setResult(newResult);
      setIsValidating(false);
    }, 50);
  }, [paguSections, selectedYear, lhrApipAcknowledged, rpdSections, c11Strategy]);

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
      {/* [Tier 5a Phase 2.5] Banner V1 LHR APIP — R4a Owner choice (text-only,
          no link). Conditional render kalau current year LHR APIP belum
          di-acknowledge. Referensi: Pasal 22 huruf b angka 2 Perdirjen Renhan
          Kemhan 7/2025 — LHR APIP wajib di-considered untuk revisi POK.
          Strategy A V1 minimal (Owner-approved 13 Mei 2026): cukup notify,
          banner hilang otomatis saat checkbox C8 di-check (state propagate
          via `lhrApipAcknowledged` prop dari App.tsx). */}
      {!lhrApipAcknowledged && (
        <div
          className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center mt-0.5">
            <span className="text-amber-800 font-bold text-sm">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900 leading-snug">
              LHR APIP TA {selectedYear} belum di-acknowledge
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Submit Revisi POK akan ditolak sampai Sie Renbang konfirmasi
              review LHR APIP (Pasal 22 huruf b angka 2 Perdirjen Renhan
              Kemhan No. 7 Tahun 2025). Cek checkbox di header dashboard
              setelah review selesai.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <ValidationDashboardHeader
        result={result}
        isValidating={isValidating}
        onValidate={handleValidate}
        ta={selectedYear}
        lhrApipAcknowledged={lhrApipAcknowledged}
        onLhrApipChange={onLhrApipChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />

      {/* [Tier 4c Phase 3c-toggle T9] C11 strategy toggle banner.
          Placement Opsi A (Owner Q1 approved): in-context discoverability
          dengan settings banner di-render sebelum card grid. Pattern soft-
          onboarding — visible by default, tidak intrusive (compact 1-line),
          tapi cukup prominent untuk drive eksplorasi 'learning by doing'. */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-slate-700">Mode evaluasi C11:</span>
          <div className="relative group">
            <Info size={14} className="text-slate-400 cursor-help" />
            {/* Tooltip — appears on hover via group-hover */}
            <div className="invisible group-hover:visible absolute left-0 top-full mt-1 z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg p-3 text-[11px] text-slate-600 space-y-1.5 normal-case font-normal">
              <p>
                <strong className="text-slate-800">Permisif</strong> (default):
                pass kalau belum ada perubahan pagu, walau data RPD belum
                ter-load. Mode default-safe — match natural app-startup flow
                tanpa surprise pending state.
              </p>
              <p>
                <strong className="text-slate-800">Ketat</strong>: pending
                dulu sampai data RPD lengkap, walau belum ada perubahan
                pagu. Mode default-skeptical — paksa verify data dulu sebelum
                claim aman.
              </p>
              <p className="italic text-slate-400">
                Perbedaan hanya terasa saat pertama buka aplikasi sebelum
                Supabase fetch RPD selesai. Setelah data lengkap, hasil
                C11 identical di kedua mode.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="radio"
              name="c11-strategy"
              value="permisif"
              checked={c11Strategy === 'permisif'}
              onChange={() => handleC11StrategyChange('permisif')}
              className="accent-emerald-600"
            />
            <span className={c11Strategy === 'permisif' ? 'font-bold text-slate-800' : 'text-slate-600'}>
              Permisif
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="radio"
              name="c11-strategy"
              value="ketat"
              checked={c11Strategy === 'ketat'}
              onChange={() => handleC11StrategyChange('ketat')}
              className="accent-amber-600"
            />
            <span className={c11Strategy === 'ketat' ? 'font-bold text-slate-800' : 'text-slate-600'}>
              Ketat
            </span>
          </label>
        </div>
        <div className="text-[10px] text-slate-400 italic ml-auto">
          {c11Strategy === 'permisif'
            ? '(default pengembangan — fitur dapat di-upgrade)'
            : '(strict mode aktif)'}
        </div>
      </div>

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
            subtitle="3 constraints · IMPLEMENTED"
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
          onNavigate={onNavigate}
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

// ─── Sub-component: DetailPanel (inline expandable) ─────────────────────
// Uses NavTarget defined at module scope (line ~13).

interface DetailPanelProps {
  result: ConstraintResult;
  paguSections: PaguSection[];
  onClose: () => void;
  /**
   * [Tier 4c Phase 3c-nav T7] New unified navigation callback. Replaces
   * onNavigateToPagu (kept for backward compat). UI render dual buttons
   * untuk C11 violations (target='pagu' + target='rpd'), single button
   * untuk constraints lain (target='pagu' only).
   */
  onNavigate?: (target: NavTarget, sectionId?: string, rowId?: string) => void;
  /**
   * @deprecated Tier 4c Phase 3c-nav: gunakan onNavigate dengan target='pagu'.
   * Keep selama transition untuk backward compat existing parent yang belum
   * di-upgrade. Akan dihapus di Phase 3d cleanup.
   */
  onNavigateToPagu?: (sectionId?: string, rowId?: string) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  result,
  paguSections,
  onClose,
  onNavigate,
  onNavigateToPagu,
}) => {
  const isTodo = isTodoState(result);
  const subBranch = getTodoSubBranch(result);

  // ─── [Tier 4c Phase 3c-nav] Navigation handler — unified untuk pagu + rpd ─
  // Prefer onNavigate (T7 new); fallback ke onNavigateToPagu untuk
  // backward-compat target='pagu' only. Target='rpd' tanpa onNavigate =
  // silent no-op (old API tidak support, parent harus upgrade).
  const handleNav = (target: NavTarget, sectionId?: string, rowId?: string) => {
    if (onNavigate) {
      onNavigate(target, sectionId, rowId);
    } else if (target === 'pagu' && onNavigateToPagu) {
      onNavigateToPagu(sectionId, rowId);
    }
  };

  // Aggregate affected row info dari violations.
  // [Tier 4c Phase 3c-nav] Per-row, attach C11 RPD info dari violation.detail
  // kalau violation constraintId='C11' dengan reason='rpd_entry_affected'.
  // Ini enable dual nav button (→ Pagu + → RPD) per affected row.
  const affectedRows = useMemo(() => {
    const rowMap = new Map<string, {
      rowId: string;
      kode: string;
      description: string;
      sectionId: string;
      sectionTitle: string;
      // C11-specific: linked RPD info untuk dual nav button
      c11RpdInfo?: {
        rpdRowId: string;
        rpdSectionId: string;
        rpdKode: string;
      };
    }>();

    result.violations.forEach(v => {
      v.affectedRowIds?.forEach(id => {
        if (rowMap.has(id)) return; // dedup
        // Find row + parent section
        for (const section of paguSections) {
          const row = section.rows.find(r => r.id === id);
          if (row) {
            const entry = {
              rowId: id,
              kode: row.kode,
              description: row.description,
              sectionId: section.id,
              sectionTitle: section.title,
            };
            // C11 attach RPD detail kalau ada
            if (
              v.constraintId === 'C11' &&
              v.detail?.reason === 'rpd_entry_affected' &&
              typeof v.detail.rpdRowId === 'string' &&
              typeof v.detail.rpdSectionId === 'string'
            ) {
              rowMap.set(id, {
                ...entry,
                c11RpdInfo: {
                  rpdRowId: v.detail.rpdRowId,
                  rpdSectionId: v.detail.rpdSectionId,
                  rpdKode: (v.detail.rpdKode as string) ?? row.kode,
                },
              });
            } else {
              rowMap.set(id, entry);
            }
            return;
          }
        }
        // Row not found di paguSections — degraded entry
        rowMap.set(id, {
          rowId: id,
          kode: '?',
          description: '(row not found)',
          sectionId: '?',
          sectionTitle: '?',
        });
      });
    });
    return Array.from(rowMap.values());
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
                  {/* [Tier 4c Phase 3c-nav] C11 RPD info di-display kalau ada */}
                  {row.c11RpdInfo && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      RPD linked: <code className="font-mono">{row.c11RpdInfo.rpdKode}</code> (section{' '}
                      <code className="font-mono">{row.c11RpdInfo.rpdSectionId}</code>)
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {(onNavigate || onNavigateToPagu) && (
                    <button
                      type="button"
                      onClick={() => handleNav('pagu', row.sectionId, row.rowId)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      Pagu Anggaran
                      <ExternalLink size={12} />
                    </button>
                  )}
                  {/* [Tier 4c Phase 3c-nav] Dual nav untuk C11 — → RPD button */}
                  {row.c11RpdInfo && onNavigate && (
                    <button
                      type="button"
                      onClick={() => handleNav('rpd', row.c11RpdInfo!.rpdSectionId, row.c11RpdInfo!.rpdRowId)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      RPD
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
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
