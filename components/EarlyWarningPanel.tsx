// ============================================================================
// SIKESUMA v3.1 · S5.5 · EarlyWarningPanel
// ============================================================================
// File          : components/EarlyWarningPanel.tsx
// Phase         : Step 5 / Phase 5.5 — Early Warning Engine
// Date          : 9 Mei 2026
// Purpose       : Dashboard widget menampilkan peringatan dini dari analisis
//                 deviasi. Diintegrasikan ke DeviationDashboard antara header
//                 strip dan charts.
//
// Decisions     :
//   §S5.5-D3    : Placement inline di DeviationDashboard
//   §S5.5-D4    : Configurable thresholds (caller pass)
//
// Data flow     :
//   DeviationDashboard pass deviationData + thresholds →
//   EarlyWarningPanel calls analyzeWarnings() → renders alerts
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, Shield, FileText,
} from 'lucide-react';
import {
  analyzeWarnings,
  PATTERN_LABELS,
  PATTERN_ICONS,
  SEVERITY_CONFIG,
  HEALTH_CONFIG,
  formatMonthRange,
  type EarlyWarningResult,
  type WarningAlert,
  type WarningThresholds,
  type WarningSeverity,
  DEFAULT_WARNING_THRESHOLDS,
} from '../utils/earlyWarning';
import type { DeviationData } from '../utils/deviationMetrics';

// ─── Props ─────────────────────────────────────────────────────────────────

interface EarlyWarningPanelProps {
  deviationData:    DeviationData;
  thresholds?:      WarningThresholds;
  upToMonth?:       number;
  onGenerateProposal?: () => void;  // trigger Phase 5.6 modal
}

// ─── Component ─────────────────────────────────────────────────────────────

const EarlyWarningPanel: React.FC<EarlyWarningPanelProps> = ({
  deviationData,
  thresholds = DEFAULT_WARNING_THRESHOLDS,
  upToMonth = 12,
  onGenerateProposal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<WarningSeverity | 'all'>('all');

  // Compute warnings (memoized)
  const result: EarlyWarningResult = useMemo(
    () => analyzeWarnings(deviationData, thresholds, upToMonth),
    [deviationData, thresholds, upToMonth],
  );

  // Filter alerts
  const visibleAlerts = useMemo(() => {
    if (filterSeverity === 'all') return result.alerts;
    return result.alerts.filter((a) => a.severity === filterSeverity);
  }, [result.alerts, filterSeverity]);

  const healthCfg = HEALTH_CONFIG[result.overallHealth];

  // Don't render panel if no alerts and health is fine
  if (result.totalAlerts === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-emerald-600" />
          <div>
            <span className="font-semibold text-emerald-800 text-sm">Early Warning: Aman</span>
            <p className="text-xs text-emerald-600 mt-0.5">{result.healthMessage}</p>
          </div>
        </div>
        {onGenerateProposal && (
          <button
            onClick={onGenerateProposal}
            className="text-xs px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1.5"
            title="Generate proposal revisi pagu (opsional saat aman)"
          >
            <FileText size={12} />
            Buat Proposal
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      result.overallHealth === 'critical' ? 'border-red-300 bg-red-50/30' :
      result.overallHealth === 'at_risk' ? 'border-amber-300 bg-amber-50/30' :
      'border-sky-200 bg-sky-50/30'
    }`}>
      {/* Header bar */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between cursor-pointer hover:opacity-90 transition ${
          result.overallHealth === 'critical' ? 'bg-red-100' :
          result.overallHealth === 'at_risk' ? 'bg-amber-100' :
          'bg-sky-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className={
            result.overallHealth === 'critical' ? 'text-red-600' :
            result.overallHealth === 'at_risk' ? 'text-amber-600' :
            'text-sky-600'
          } />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Early Warning System</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${healthCfg.bgClass} ${healthCfg.textClass}`}>
                {healthCfg.icon} {healthCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{result.healthMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Severity badge summary */}
          <div className="flex items-center gap-1.5 text-xs">
            {result.criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-bold">
                {result.criticalCount} kritis
              </span>
            )}
            {result.warningCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold">
                {result.warningCount} peringatan
              </span>
            )}
            {result.infoCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-800 font-bold">
                {result.infoCount} info
              </span>
            )}
          </div>

          {/* Generate Proposal button */}
          {onGenerateProposal && (
            <button
              onClick={(e) => { e.stopPropagation(); onGenerateProposal(); }}
              className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5 shadow-sm"
              title="Generate proposal revisi pagu berdasarkan analisis deviasi"
            >
              <FileText size={12} />
              Buat Proposal Revisi
            </button>
          )}

          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expandable body */}
      {isExpanded && (
        <div className="px-5 py-4 space-y-3">

          {/* Severity filter tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 mr-1">Filter:</span>
            <FilterTab
              label="Semua"
              count={result.totalAlerts}
              active={filterSeverity === 'all'}
              onClick={() => setFilterSeverity('all')}
              color="slate"
            />
            {result.criticalCount > 0 && (
              <FilterTab
                label="Kritis"
                count={result.criticalCount}
                active={filterSeverity === 'critical'}
                onClick={() => setFilterSeverity('critical')}
                color="red"
              />
            )}
            {result.warningCount > 0 && (
              <FilterTab
                label="Peringatan"
                count={result.warningCount}
                active={filterSeverity === 'warning'}
                onClick={() => setFilterSeverity('warning')}
                color="amber"
              />
            )}
            {result.infoCount > 0 && (
              <FilterTab
                label="Info"
                count={result.infoCount}
                active={filterSeverity === 'info'}
                onClick={() => setFilterSeverity('info')}
                color="sky"
              />
            )}
          </div>

          {/* Alert cards */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {visibleAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>

          {visibleAlerts.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-500 italic">
              Tidak ada peringatan untuk filter yang dipilih.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─── Sub-component: FilterTab ──────────────────────────────────────────────

const FilterTab: React.FC<{
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
}> = ({ label, count, active, onClick, color }) => {
  const baseClasses: Record<string, string> = {
    slate: active ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    red:   active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
    amber: active ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    sky:   active ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  };

  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg font-medium transition ${baseClasses[color] || baseClasses.slate}`}
    >
      {label} ({count})
    </button>
  );
};


// ─── Sub-component: AlertCard ──────────────────────────────────────────────

const AlertCard: React.FC<{ alert: WarningAlert }> = ({ alert }) => {
  const sevCfg = SEVERITY_CONFIG[alert.severity];
  const patternLabel = PATTERN_LABELS[alert.pattern];
  const patternIcon = PATTERN_ICONS[alert.pattern];

  return (
    <div className={`rounded-xl border p-3.5 ${sevCfg.bgClass} ${sevCfg.borderClass} transition hover:shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Top badge row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sevCfg.bgClass} ${sevCfg.textClass} border ${sevCfg.borderClass}`}>
              {sevCfg.icon} {sevCfg.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-slate-600 border border-slate-200">
              {patternIcon} {patternLabel}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
              {alert.categoryLabel}
            </span>
            <span className="text-[10px] text-slate-500">
              {formatMonthRange(alert.monthRange)}
            </span>
          </div>

          {/* Message */}
          <p className={`text-xs font-medium ${sevCfg.textClass} leading-relaxed`}>
            {alert.message}
          </p>

          {/* Recommendation */}
          <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed italic">
            💡 {alert.recommendation}
          </p>
        </div>

        {/* Deviation badge */}
        <div className="shrink-0 text-right">
          <div className={`text-sm font-bold ${
            alert.severity === 'critical' ? 'text-red-700' :
            alert.severity === 'warning' ? 'text-amber-700' :
            'text-sky-700'
          }`}>
            {Number.isFinite(alert.deviationPct)
              ? `${alert.deviationPct > 0 ? '+' : ''}${alert.deviationPct.toFixed(1)}%`
              : '∞'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyWarningPanel;
