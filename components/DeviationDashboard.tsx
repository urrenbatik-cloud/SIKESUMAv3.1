// ============================================================================
// SIKESUMA v3.1 · S5.4 · DeviationDashboard
// ============================================================================
// File          : components/DeviationDashboard.tsx
// Phase         : Step 5 / Phase 5.4 — Deviation Dashboard
// Date          : 8 Mei 2026
// Purpose       : Visualisasi deviasi RPD vs Realisasi per kategori per bulan,
//                 dengan color-coding hybrid (reasoning category kalau ada,
//                 fallback warna kategori pagu).
//
// Decisions     :
//   §S5.4-D1 A  : Sub-tab di Tab 4 (Pelaporan & LRA) — wired di App.tsx
//   §S5.4-D2 A  : Pure SVG (no recharts/chart.js dep)
//   §S5.4-D3    : Stacked Bar (per kategori per bulan) + Line Chart (% deviasi
//                 per kategori) combo
//   §S5.4-D4    : 4-section drill-down modal: header + realisasi + RPD +
//                 reasoning context
//   §S5.4-D5 A  : Year filter respect main app dropdown (selectedYear prop)
//   §S5.4-D6 A  : Hybrid color — reasoning category color saat ada audit,
//                 fallback category baseColor (muted)
//
// Data flow     :
//   Caller (App.tsx) pass paguSections + rpdSections + bills + absorptionMap
//   + selectedYear → component fetch auditEntries from supabase audit_log
//   (year-filtered via timestamp) → computeDeviation → render charts.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Info, TrendingUp, TrendingDown, X, ExternalLink, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchReasoningCategories } from '../lib/audit';
import {
  computeDeviation,
  getHybridColor,
  formatRpShort,
  formatRpFull,
  formatDeviationPct,
  getDeviationSeverityColor,
  MONTH_LABELS_SHORT,
  MONTH_LABELS_FULL,
  type DeviationData,
  type CategoryDeviation,
  type MonthlyCell,
  type AuditLogRow,
} from '../utils/deviationMetrics';
import {
  type ReasoningCategory as ReasoningCategoryType,
  getReasoningCategoryMeta,
  getCategoryBadgeClasses,
  getAuditEntityLabel,
  getAuditActionMeta,
} from '../constants/audit';
import type { PaguSection, RPDSection, Bill } from '../types';
import EarlyWarningPanel from './EarlyWarningPanel';
import RevisionProposalGenerator from './RevisionProposalGenerator';
import { analyzeWarnings, DEFAULT_WARNING_THRESHOLDS } from '../utils/earlyWarning';

// ─── Props ─────────────────────────────────────────────────────────────────

interface DeviationDashboardProps {
  selectedYear:    number | 'ALL';
  paguSections:    PaguSection[];
  rpdSections:     RPDSection[];
  allBills:        Bill[];
  absorptionMap:   Record<string, Record<string, number>>;
}

// ─── Tailwind color → concrete classes (purge-safe literal map) ────────────

const FILL_BG: Record<string, string> = {
  slate:   'fill-slate-400',
  rose:    'fill-rose-500',
  red:     'fill-red-500',
  amber:   'fill-amber-500',
  emerald: 'fill-emerald-500',
  sky:     'fill-sky-500',
  blue:    'fill-blue-500',
  purple:  'fill-purple-500',
  gray:    'fill-gray-400',
};

const STROKE_BG: Record<string, string> = {
  slate:   'stroke-slate-500',
  rose:    'stroke-rose-600',
  red:     'stroke-red-600',
  amber:   'stroke-amber-600',
  emerald: 'stroke-emerald-600',
  sky:     'stroke-sky-600',
  blue:    'stroke-blue-600',
  purple:  'stroke-purple-600',
  gray:    'stroke-gray-500',
};

const BG_BG: Record<string, string> = {
  slate:   'bg-slate-100 text-slate-800 border-slate-200',
  rose:    'bg-rose-100 text-rose-800 border-rose-200',
  red:     'bg-red-100 text-red-800 border-red-200',
  amber:   'bg-amber-100 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  sky:     'bg-sky-100 text-sky-800 border-sky-200',
  blue:    'bg-blue-100 text-blue-800 border-blue-200',
  purple:  'bg-purple-100 text-purple-800 border-purple-200',
  gray:    'bg-gray-100 text-gray-700 border-gray-200',
};

// ─── Component ─────────────────────────────────────────────────────────────

const DeviationDashboard: React.FC<DeviationDashboardProps> = ({
  selectedYear, paguSections, rpdSections, allBills, absorptionMap,
}) => {
  const [auditEntries, setAuditEntries] = useState<AuditLogRow[]>([]);
  const [reasoningCategories, setReasoningCategories] = useState<ReasoningCategoryType[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [drillCell, setDrillCell]       = useState<{
    cell: MonthlyCell;
    category: CategoryDeviation;
  } | null>(null);
  const [showProposal, setShowProposal] = useState(false); // [S5.6] Proposal modal

  // Resolve year for fetch (ALL → fallback to current year for dashboard view)
  const yearNum = selectedYear === 'ALL'
    ? new Date().getFullYear()
    : selectedYear;

  // ─── Data Fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchReasoningCategories().then(setReasoningCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Year-filter audit entries via JSONB timestamp prefix or created_at range
        const yearStart = `${yearNum}-01-01T00:00:00.000Z`;
        const yearEnd   = `${yearNum}-12-31T23:59:59.999Z`;
        const { data, error: fetchErr } = await supabase
          .from('audit_log')
          .select('*')
          .gte('created_at', yearStart)
          .lte('created_at', yearEnd)
          .limit(2000);

        if (fetchErr) throw fetchErr;
        if (!cancelled) setAuditEntries((data ?? []) as AuditLogRow[]);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Gagal memuat audit log');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [yearNum]);

  // ─── Compute deviation data (memoized) ─────────────────────────────────
  const data: DeviationData = useMemo(() => {
    return computeDeviation(
      yearNum, paguSections, rpdSections, absorptionMap, allBills, auditEntries,
    );
  }, [yearNum, paguSections, rpdSections, absorptionMap, allBills, auditEntries]);

  // Year max value untuk Y-axis scaling
  const maxMonthlyValue = useMemo(() => {
    let max = 0;
    for (const mt of data.monthlyTotals) {
      if (mt.realisasi > max) max = mt.realisasi;
      if (mt.rpd > max) max = mt.rpd;
    }
    return max || 1; // avoid div by 0
  }, [data]);

  // [S5.5] Early Warning analysis (memoized)
  const warningResult = useMemo(
    () => analyzeWarnings(data, DEFAULT_WARNING_THRESHOLDS, 12),
    [data],
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  if (paguSections.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Info className="mx-auto mb-3 text-slate-300" size={40} />
        <p className="font-semibold mb-1">Belum ada data Pagu untuk tahun {yearNum}</p>
        <p className="text-sm">Setup Pagu Anggaran terlebih dahulu di Tab 1 → 1.1.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header strip */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Deviasi & Tinjauan {yearNum}</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Realisasi vs Rencana, dengan konteks alasan dari Tinjauan Audit.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="text-slate-300 uppercase tracking-wider">Total RPD</div>
            <div className="font-bold text-base">Rp {formatRpShort(data.yearTotalRpd)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-300 uppercase tracking-wider">Total Realisasi</div>
            <div className="font-bold text-base">Rp {formatRpShort(data.yearTotalReal)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-300 uppercase tracking-wider">Deviasi Tahunan</div>
            <div className={`font-bold text-base ${
              Math.abs(data.yearDeviationPct) >= 20 ? 'text-rose-300' :
              Math.abs(data.yearDeviationPct) >= 10 ? 'text-amber-300' :
              'text-emerald-300'
            }`}>
              {formatDeviationPct(data.yearDeviationPct)}
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Memuat audit context...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Audit context gagal: {error}. Charts tetap render tanpa reasoning overlay.</span>
        </div>
      )}

      {/* [S5.5] Early Warning Panel — between header and charts */}
      {!isLoading && data.categories.length > 0 && (
        <EarlyWarningPanel
          deviationData={data}
          onGenerateProposal={() => setShowProposal(true)}
        />
      )}

      {/* CHART 1: Stacked Bar — Realisasi per kategori per bulan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Realisasi per Bulan</h3>
            <p className="text-xs text-slate-500">
              Stacked Bar — warna mencerminkan kategori alasan kalau sudah ditinjau (hybrid coloring).
              <span className="ml-2 italic">Klik bar untuk drill-down.</span>
            </p>
          </div>
          <Legend categories={data.categories} reasoningCategories={reasoningCategories} />
        </div>

        <StackedBarChart
          data={data}
          maxValue={maxMonthlyValue}
          reasoningCategories={reasoningCategories}
          onCellClick={(cell, category) => setDrillCell({ cell, category })}
        />
      </div>

      {/* CHART 2: Line — Deviation % per kategori */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Trend Deviasi % per Kategori</h3>
            <p className="text-xs text-slate-500">
              Garis 0% = sesuai RPD. Atas = realisasi melebihi rencana.
              Bawah = underspend. Klik titik untuk drill-down.
            </p>
          </div>
        </div>

        <LineChart
          data={data}
          onCellClick={(cell, category) => setDrillCell({ cell, category })}
        />
      </div>

      {/* Per-category summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.categories.map((cat) => (
          <CategorySummaryCard key={cat.paguSectionId} category={cat} />
        ))}
      </div>

      {/* Drill-down modal */}
      {drillCell && (
        <DrillDownModal
          cell={drillCell.cell}
          category={drillCell.category}
          allBills={allBills}
          auditEntries={auditEntries}
          reasoningCategories={reasoningCategories}
          onClose={() => setDrillCell(null)}
        />
      )}

      {/* [S5.6] Revision Proposal Generator modal */}
      {showProposal && (
        <RevisionProposalGenerator
          deviationData={data}
          warningResult={warningResult}
          auditEntries={auditEntries}
          reasoningCategories={reasoningCategories}
          onClose={() => setShowProposal(false)}
        />
      )}
    </div>
  );
};

// ─── Sub-component: Legend ─────────────────────────────────────────────────

const Legend: React.FC<{
  categories: CategoryDeviation[];
  reasoningCategories: ReasoningCategoryType[];
}> = ({ categories, reasoningCategories }) => (
  <div className="flex flex-wrap gap-2 text-xs">
    {categories.map((c) => (
      <span
        key={c.paguSectionId}
        className={`px-2 py-1 rounded border ${BG_BG[c.baseColor] ?? BG_BG.slate}`}
      >
        {c.shortLabel}
      </span>
    ))}
    {reasoningCategories.length > 0 && (
      <span className="text-slate-400">·</span>
    )}
    {reasoningCategories.map((rc) => (
      <span
        key={rc.id}
        className={`px-2 py-1 rounded border text-[11px] ${getCategoryBadgeClasses(rc.color)}`}
        title={`Reasoning: ${rc.label}`}
      >
        🏷️ {rc.label}
      </span>
    ))}
  </div>
);

// ─── Sub-component: Stacked Bar Chart (pure SVG) ──────────────────────────

const StackedBarChart: React.FC<{
  data: DeviationData;
  maxValue: number;
  reasoningCategories: ReasoningCategoryType[];
  onCellClick: (cell: MonthlyCell, category: CategoryDeviation) => void;
}> = ({ data, maxValue, reasoningCategories, onCellClick }) => {
  const W = 900;
  const H = 360;
  const PAD = { top: 20, right: 20, bottom: 40, left: 70 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const monthWidth = innerW / 12;
  const barWidth = monthWidth * 0.7;

  // Y-axis ticks (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => maxValue * p);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[700px]" role="img" aria-label="Grafik realisasi per bulan">
        {/* Grid lines + Y-axis labels */}
        {yTicks.map((v, i) => {
          const y = PAD.top + innerH - (v / maxValue) * innerH;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
                    stroke="#e2e8f0" strokeWidth={1} strokeDasharray={i === 0 ? '0' : '3 3'} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#64748b">
                Rp {formatRpShort(v)}
              </text>
            </g>
          );
        })}

        {/* Bars per month, stacked per kategori */}
        {Array.from({ length: 12 }).map((_, mIdx) => {
          const monthCenterX = PAD.left + mIdx * monthWidth + monthWidth / 2;
          let stackY = PAD.top + innerH;

          return (
            <g key={mIdx}>
              {/* Month label */}
              <text x={monthCenterX} y={H - PAD.bottom + 18} textAnchor="middle"
                    fontSize={11} fill="#475569" fontWeight={600}>
                {MONTH_LABELS_SHORT[mIdx]}
              </text>

              {/* Stack categories */}
              {data.categories.map((cat) => {
                const cell = cat.monthly[mIdx];
                const value = cell.realisasiActual;
                if (value <= 0) return null;

                const barH = (value / maxValue) * innerH;
                const y = stackY - barH;
                stackY = y;

                const { color, isReasoned } = getHybridColor(cell, cat.baseColor, reasoningCategories);
                const fillClass = FILL_BG[color] ?? FILL_BG.slate;

                return (
                  <g key={cat.paguSectionId}>
                    <rect
                      x={monthCenterX - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      className={`${fillClass} cursor-pointer transition hover:opacity-80 ${isReasoned ? '' : 'opacity-60'}`}
                      onClick={() => onCellClick(cell, cat)}
                    >
                      <title>
                        {cat.shortLabel} {MONTH_LABELS_FULL[mIdx]}: Rp {formatRpFull(value)} (Deviasi: {formatDeviationPct(cell.deviationPct)})
                        {cell.dominantReasoningCategory ? `\nAlasan: ${getReasoningCategoryMeta(cell.dominantReasoningCategory, reasoningCategories)?.label}` : ''}
                      </title>
                    </rect>
                  </g>
                );
              })}

              {/* RPD plan marker (horizontal tick at top of expected stack height) */}
              {(() => {
                const totalRpd = data.monthlyTotals[mIdx]?.rpd ?? 0;
                if (totalRpd <= 0) return null;
                const rpdY = PAD.top + innerH - (totalRpd / maxValue) * innerH;
                return (
                  <line
                    x1={monthCenterX - barWidth / 2 - 2}
                    x2={monthCenterX + barWidth / 2 + 2}
                    y1={rpdY}
                    y2={rpdY}
                    stroke="#0f172a"
                    strokeWidth={2}
                    strokeDasharray="3 2"
                  >
                    <title>RPD Plan: Rp {formatRpFull(totalRpd)}</title>
                  </line>
                );
              })()}
            </g>
          );
        })}

        {/* Y-axis line */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
              stroke="#94a3b8" strokeWidth={1} />
      </svg>

      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 px-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-slate-900" />
          RPD Plan (target)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-slate-400 opacity-60" />
          Belum direview (warna kategori, redup)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-rose-500" />
          Sudah direview (warna alasan, vivid)
        </span>
      </div>
    </div>
  );
};

// ─── Sub-component: Line Chart (pure SVG) ──────────────────────────────────

const LineChart: React.FC<{
  data: DeviationData;
  onCellClick: (cell: MonthlyCell, category: CategoryDeviation) => void;
}> = ({ data, onCellClick }) => {
  const W = 900;
  const H = 280;
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const monthWidth = innerW / 11; // 11 spans for 12 points

  // Y-axis: clamp to ±100% for display (actual values may exceed); annotate accordingly
  const maxAbsPct = useMemo(() => {
    let max = 50; // floor of ±50%
    for (const cat of data.categories) {
      for (const cell of cat.monthly) {
        if (Number.isFinite(cell.deviationPct)) {
          const abs = Math.abs(cell.deviationPct);
          if (abs > max && abs < 200) max = abs; // ignore extreme outliers
        }
      }
    }
    // Round up to nearest 25
    return Math.ceil(max / 25) * 25;
  }, [data]);

  const yTicks = [-maxAbsPct, -maxAbsPct / 2, 0, maxAbsPct / 2, maxAbsPct];

  const toY = (pct: number): number => {
    // Clamp infinite/extreme values
    const clamped = Math.max(Math.min(pct, maxAbsPct), -maxAbsPct);
    const ratio = (clamped + maxAbsPct) / (2 * maxAbsPct);
    return PAD.top + innerH - ratio * innerH;
  };

  const toX = (mIdx: number): number => PAD.left + mIdx * monthWidth;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[700px]" role="img" aria-label="Trend deviasi per kategori">
        {/* Y-axis grid + labels */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          const isZero = tick === 0;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
                    stroke={isZero ? '#0f172a' : '#e2e8f0'}
                    strokeWidth={isZero ? 1.5 : 1}
                    strokeDasharray={isZero ? '0' : '3 3'} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11}
                    fill={isZero ? '#0f172a' : '#64748b'}
                    fontWeight={isZero ? 700 : 400}>
                {tick > 0 ? '+' : ''}{tick}%
              </text>
            </g>
          );
        })}

        {/* Month labels on X-axis */}
        {Array.from({ length: 12 }).map((_, mIdx) => (
          <text
            key={mIdx}
            x={toX(mIdx)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fontSize={11}
            fill="#475569"
            fontWeight={600}
          >
            {MONTH_LABELS_SHORT[mIdx]}
          </text>
        ))}

        {/* Lines per category */}
        {data.categories.map((cat) => {
          // Build path string
          let pathData = '';
          cat.monthly.forEach((cell, mIdx) => {
            const x = toX(mIdx);
            const y = toY(cell.deviationPct);
            pathData += `${mIdx === 0 ? 'M' : 'L'}${x},${y} `;
          });

          const strokeClass = STROKE_BG[cat.baseColor] ?? STROKE_BG.slate;

          return (
            <g key={cat.paguSectionId}>
              <path d={pathData} fill="none" className={strokeClass} strokeWidth={2.5}
                    strokeLinejoin="round" strokeLinecap="round" />
              {/* Points */}
              {cat.monthly.map((cell, mIdx) => {
                const x = toX(mIdx);
                const y = toY(cell.deviationPct);
                const sevColor = getDeviationSeverityColor(cell.deviationPct);
                const fillClass = FILL_BG[sevColor] ?? FILL_BG.slate;
                return (
                  <circle
                    key={mIdx}
                    cx={x}
                    cy={y}
                    r={5}
                    className={`${fillClass} cursor-pointer transition hover:r-6`}
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={() => onCellClick(cell, cat)}
                  >
                    <title>
                      {cat.shortLabel} {MONTH_LABELS_FULL[mIdx]}: {formatDeviationPct(cell.deviationPct)}
                      {'\n'}RPD Rp {formatRpFull(cell.rpdPlanned)} → Realisasi Rp {formatRpFull(cell.realisasiActual)}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* Y-axis line */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH}
              stroke="#94a3b8" strokeWidth={1} />
      </svg>

      <div className="flex flex-wrap items-center gap-3 mt-2 px-2 text-xs">
        {data.categories.map((cat) => {
          const cls = STROKE_BG[cat.baseColor] ?? STROKE_BG.slate;
          return (
            <span key={cat.paguSectionId} className="flex items-center gap-1.5 text-slate-700">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" className={cls} strokeWidth="2.5" /></svg>
              {cat.shortLabel}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Sub-component: Category Summary Card ─────────────────────────────────

const CategorySummaryCard: React.FC<{ category: CategoryDeviation }> = ({ category }) => {
  const dev = category.yearDeviationPct;
  const sevColor = getDeviationSeverityColor(dev);
  const isOver = dev > 0;
  const Icon = isOver ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${BG_BG[category.baseColor] ?? BG_BG.slate}`}>
          {category.shortLabel}
        </span>
        <div className={`flex items-center gap-1 text-sm font-bold ${
          sevColor === 'rose' ? 'text-rose-600' :
          sevColor === 'amber' ? 'text-amber-600' :
          sevColor === 'sky' ? 'text-sky-600' :
          'text-emerald-600'
        }`}>
          <Icon size={14} />
          {formatDeviationPct(dev)}
        </div>
      </div>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">RPD Plan:</span>
          <span className="font-medium text-slate-700">Rp {formatRpShort(category.yearTotalRpd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Realisasi:</span>
          <span className="font-medium text-slate-700">Rp {formatRpShort(category.yearTotalReal)}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component: DrillDownModal ─────────────────────────────────────────

const DrillDownModal: React.FC<{
  cell:                MonthlyCell;
  category:            CategoryDeviation;
  allBills:            Bill[];
  auditEntries:        AuditLogRow[];
  reasoningCategories: ReasoningCategoryType[];
  onClose:             () => void;
}> = ({ cell, category, allBills, auditEntries, reasoningCategories, onClose }) => {
  // Esc key → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const monthLabel = MONTH_LABELS_FULL[cell.month - 1];
  const sevColor = getDeviationSeverityColor(cell.deviationPct);

  // Resolve contributing bills
  const contributingBills = useMemo(() => {
    const idSet = new Set(cell.contributingBillIds);
    return allBills.filter((b) => idSet.has(b.id));
  }, [cell.contributingBillIds, allBills]);

  // Resolve audit entries
  const linkedEntries = useMemo(() => {
    const idSet = new Set(cell.auditEntryIds);
    return auditEntries.filter((a) => idSet.has(a.id));
  }, [cell.auditEntryIds, auditEntries]);

  return (
    <div
      className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 bg-gradient-to-r ${
          sevColor === 'rose' ? 'from-rose-50 to-white' :
          sevColor === 'amber' ? 'from-amber-50 to-white' :
          sevColor === 'sky' ? 'from-sky-50 to-white' :
          'from-emerald-50 to-white'
        } rounded-t-3xl`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Detail Deviasi
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {monthLabel} {cell.month <= 12 ? '· ' + category.shortLabel : ''}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-slate-600">Deviasi:</span>
                <span className={`font-bold ${
                  sevColor === 'rose' ? 'text-rose-600' :
                  sevColor === 'amber' ? 'text-amber-600' :
                  sevColor === 'sky' ? 'text-sky-600' :
                  'text-emerald-600'
                }`}>
                  {formatDeviationPct(cell.deviationPct)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition"
              title="Tutup (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">

          {/* §1. RPD Plan */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>📋 RPD Plan</span>
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Rencana {monthLabel} {category.shortLabel}:</span>
                <span className="font-bold text-slate-900">Rp {formatRpFull(cell.rpdPlanned)}</span>
              </div>
            </div>
          </section>

          {/* §2. Realisasi Breakdown */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>💰 Realisasi Aktual ({contributingBills.length} tagihan)</span>
            </h3>
            {contributingBills.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-3 py-4 bg-slate-50 rounded-lg">
                Tidak ada tagihan tercatat untuk bulan ini di kategori {category.shortLabel}.
              </div>
            ) : (
              <div className="space-y-1.5">
                {contributingBills.map((bill) => {
                  const matchingItems = bill.items.filter((it) => category.rowKodes.includes(it.akun.trim()));
                  const matchSum = matchingItems.reduce((s, it) => s + (it.volume * it.hargaSatuan), 0);
                  return (
                    <div key={bill.id} className="bg-white border border-slate-200 rounded-lg p-3 text-xs hover:bg-slate-50 transition">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{bill.namaTagihan}</div>
                          <div className="text-slate-500 mt-0.5 font-mono">{bill.id} · {bill.tanggal}</div>
                          <div className="text-slate-600 mt-0.5">
                            {matchingItems.map((it) => it.namaBarang).join(', ')}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900">Rp {formatRpShort(matchSum)}</div>
                          <div className="text-slate-400 text-[10px]">{bill.status}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 px-1 text-sm border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">Total Realisasi:</span>
                  <span className="font-bold text-slate-900">Rp {formatRpFull(cell.realisasiActual)}</span>
                </div>
              </div>
            )}
          </section>

          {/* §3. Reasoning Context */}
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>🧭 Konteks Tinjauan ({linkedEntries.length} entry audit)</span>
            </h3>
            {linkedEntries.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-3 py-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Info size={14} className="inline mr-1.5 -mt-0.5" />
                Belum ada entry audit yang terhubung dengan tagihan-tagihan di atas. Buka <strong>Pengaturan → Tinjauan Audit</strong> untuk isi reasoning.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedEntries.map((entry) => {
                  const meta = getReasoningCategoryMeta(entry.data.reasoningCategory, reasoningCategories);
                  const actionMeta = getAuditActionMeta(entry.data.action);
                  const isReviewed = entry.data.isReviewed === true;
                  return (
                    <div key={entry.id}
                         className={`rounded-lg border p-3 text-xs ${
                           isReviewed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/40 border-amber-200'
                         }`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {getAuditEntityLabel(entry.data.entity)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            actionMeta.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                            actionMeta.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            actionMeta.color === 'rose' ? 'bg-rose-100 text-rose-800' :
                            actionMeta.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                            'bg-stone-100 text-stone-700'
                          }`}>{actionMeta.label}</span>
                          {meta && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryBadgeClasses(meta.color)}`}>
                              🏷️ {meta.label}
                            </span>
                          )}
                          {!isReviewed && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold">
                              Belum Direview
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-700 mb-1">{entry.data.description}</div>
                      {entry.data.reasoning && (
                        <div className="bg-white border border-slate-200 rounded p-2 text-slate-700 italic mt-1.5">
                          "{entry.data.reasoning}"
                        </div>
                      )}
                      {entry.data.dynamicsFactor && (
                        <div className="text-slate-500 mt-1.5 text-[11px]">
                          ⚙️ Faktor dinamika: <em>{entry.data.dynamicsFactor}</em>
                        </div>
                      )}
                      {entry.data.reviewedBy && (
                        <div className="text-emerald-700 mt-1.5 text-[11px]">
                          ✓ Direview oleh {entry.data.reviewedBy}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {linkedEntries.length > 0 && (
              <p className="mt-2 text-xs text-slate-500 italic flex items-center gap-1.5">
                <ExternalLink size={12} />
                Untuk edit reasoning entry-entry ini, buka Pengaturan → Tinjauan Audit.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviationDashboard;
