// ============================================================================
// SIKESUMA v3.1 · PaguDiffDashboard — Phase 1 UX (Opsi B + Opsi C)
// ============================================================================
// File          : components/PaguDiffDashboard.tsx
// Phase         : Sprint D Item #2 — UX Pagu Semula vs Revisi visibility
// Date          : 11 Mei 2026
//
// Renders:
//   1. 4 summary cards di top (Opsi C): Total Semula | Total Revisi | Net Change | Rows Affected
//   2. Sintesis Revisi table dengan 4 grup (Opsi B):
//      - Pagu Bertambah  (green)
//      - Item Baru/Breakdown (blue) — Konteks 3 dr Ferry
//      - Pagu Berkurang  (red)
//      - Tidak Berubah   (gray)
//
// Each grup row is expandable to see individual line items.
// ============================================================================

import React, { useMemo, useState } from 'react';
import type { PaguSection } from '../types';
import { computeSintesis, type SintesisGroup } from '../utils/paguDiff';
import { formatIDR } from './Formatters';
import { TrendingUp, TrendingDown, Plus, Equal, ChevronDown, ChevronRight } from 'lucide-react';

interface PaguDiffDashboardProps {
  sections: PaguSection[];
}

const PaguDiffDashboard: React.FC<PaguDiffDashboardProps> = ({ sections }) => {
  const sintesis = useMemo(() => computeSintesis(sections), [sections]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  // If no data, hide dashboard (avoid noise on empty TA)
  if (sintesis.totalRows === 0) return null;

  const netPositive = sintesis.netChange >= 0;
  const netSign = netPositive ? '+' : '−';
  const netColor = netPositive ? 'emerald' : 'red';

  return (
    <div className="space-y-4 mb-2">
      {/* ============ Opsi C: 4 Summary Cards ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagu Semula</p>
          <p className="text-2xl font-black text-slate-700 leading-tight font-mono">
            {formatIDR(sintesis.totalSemula)}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Baseline Awal TA</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pagu Revisi</p>
          <p className="text-2xl font-black text-slate-900 leading-tight font-mono">
            {formatIDR(sintesis.totalRevisi)}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">Effective Current</p>
        </div>

        <div className={`bg-${netColor}-50 rounded-2xl border-2 border-${netColor}-200 p-5 shadow-sm`}>
          <p className={`text-[10px] font-black text-${netColor}-600 uppercase tracking-widest mb-2`}>Net Change</p>
          <p className={`text-2xl font-black text-${netColor}-700 leading-tight font-mono`}>
            {netSign}{formatIDR(Math.abs(sintesis.netChange))}
          </p>
          <p className={`text-[10px] font-bold text-${netColor}-600 mt-1.5 uppercase tracking-wide`}>
            {netSign}{Math.abs(sintesis.netChangePercent).toFixed(1)}% dari Semula
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rows Affected</p>
          <p className="text-2xl font-black text-slate-900 leading-tight font-mono">
            {sintesis.rowsAffected} / {sintesis.totalRows}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">
            {sintesis.totalRows > 0 ? Math.round(100 * sintesis.rowsAffected / sintesis.totalRows) : 0}% rows direvisi
          </p>
        </div>
      </div>

      {/* ============ Opsi B: Sintesis Revisi Table ============ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            Sintesis Revisi Pagu
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {sintesis.bertambah.rows.length} bertambah · {sintesis.baru.rows.length} baru · {sintesis.berkurang.rows.length} berkurang
          </p>
        </div>

        <div className="space-y-2">
          <DiffGroupRow
            label="Pagu Bertambah"
            icon={<TrendingUp size={14} />}
            color="emerald"
            group={sintesis.bertambah}
            valueLabel="+"
            isExpanded={!!expandedGroups['bertambah']}
            onToggle={() => toggle('bertambah')}
          />
          <DiffGroupRow
            label="Item Baru / Breakdown"
            icon={<Plus size={14} />}
            color="blue"
            group={sintesis.baru}
            valueLabel="+"
            isExpanded={!!expandedGroups['baru']}
            onToggle={() => toggle('baru')}
            sublabel="Konteks 3 — akun tambahan tidak direncanakan dari awal, atau detail breakdown dari akun general"
          />
          <DiffGroupRow
            label="Pagu Berkurang"
            icon={<TrendingDown size={14} />}
            color="red"
            group={sintesis.berkurang}
            valueLabel="−"
            isExpanded={!!expandedGroups['berkurang']}
            onToggle={() => toggle('berkurang')}
          />
          <DiffGroupRow
            label="Tidak Berubah"
            icon={<Equal size={14} />}
            color="slate"
            group={sintesis.tidakBerubah}
            valueLabel=""
            isExpanded={!!expandedGroups['tidakBerubah']}
            onToggle={() => toggle('tidakBerubah')}
            sublabel="Baseline holdovers (Revisi = Semula). Termasuk row Sprint D Item #1 fix (Konteks 1)."
          />
        </div>
      </div>
    </div>
  );
};

// ─── Sub-component: One row per category dengan expand ──────────────────────

interface DiffGroupRowProps {
  label: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'red' | 'slate';
  group: SintesisGroup;
  valueLabel: '+' | '−' | '';
  isExpanded: boolean;
  onToggle: () => void;
  sublabel?: string;
}

const COLOR_CLASSES: Record<DiffGroupRowProps['color'], {
  border: string; text: string; textDark: string; bg: string; bgHover: string; row: string;
}> = {
  emerald: {
    border: 'border-emerald-500', text: 'text-emerald-600', textDark: 'text-emerald-700',
    bg: 'bg-emerald-50', bgHover: 'hover:bg-emerald-100/50', row: 'bg-emerald-50/30'
  },
  blue: {
    border: 'border-blue-500', text: 'text-blue-600', textDark: 'text-blue-700',
    bg: 'bg-blue-50', bgHover: 'hover:bg-blue-100/50', row: 'bg-blue-50/30'
  },
  red: {
    border: 'border-red-500', text: 'text-red-600', textDark: 'text-red-700',
    bg: 'bg-red-50', bgHover: 'hover:bg-red-100/50', row: 'bg-red-50/30'
  },
  slate: {
    border: 'border-slate-400', text: 'text-slate-500', textDark: 'text-slate-700',
    bg: 'bg-slate-50', bgHover: 'hover:bg-slate-100/50', row: 'bg-slate-50/30'
  },
};

const DiffGroupRow: React.FC<DiffGroupRowProps> = ({
  label, icon, color, group, valueLabel, isExpanded, onToggle, sublabel
}) => {
  const c = COLOR_CLASSES[color];
  const hasItems = group.rows.length > 0;
  const totalDisplay = `${valueLabel}${formatIDR(Math.abs(group.total))}`;

  return (
    <div className={`border-l-4 ${c.border} pl-4 py-2 rounded-r-lg transition-colors ${hasItems ? c.bgHover + ' cursor-pointer' : 'opacity-50'}`}
         onClick={hasItems ? onToggle : undefined}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasItems && (
            isExpanded ? <ChevronDown size={14} className={c.text} /> : <ChevronRight size={14} className={c.text} />
          )}
          <span className={c.text}>{icon}</span>
          <p className={`text-sm font-black ${c.textDark} uppercase tracking-wide`}>{label}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <p className="text-xs font-bold text-slate-500 hidden md:block">{group.rows.length} rows</p>
          <p className={`text-base font-black font-mono ${c.textDark}`}>{totalDisplay}</p>
        </div>
      </div>

      {sublabel && !isExpanded && (
        <p className="text-[11px] text-slate-500 mt-1 pl-6 italic">{sublabel}</p>
      )}

      {isExpanded && hasItems && (
        <div className="mt-3 pl-6 space-y-1.5">
          {group.rows.slice(0, 50).map(({ row, section, classification }) => (
            <div key={`${section.id}-${row.id}`}
                 className={`flex items-baseline justify-between gap-3 px-3 py-1.5 rounded-lg ${c.row} text-xs`}>
              <div className="flex items-baseline gap-2 flex-1 min-w-0">
                <span className="font-mono text-slate-500 text-[11px] shrink-0">{row.kode}</span>
                <span className="text-slate-700 truncate">{row.description || '—'}</span>
                <span className="text-[10px] text-slate-400 hidden lg:inline shrink-0 italic">
                  ({(section.title || section.id).replace(/^PAGU ANGGARAN /i, '')})
                </span>
              </div>
              <div className="text-right shrink-0 font-mono">
                {classification.category === 'TIDAK_BERUBAH' ? (
                  <span className="text-slate-600 font-bold">{formatIDR(classification.revisi)}</span>
                ) : (
                  <>
                    <span className="text-slate-400">{formatIDR(classification.semula)}</span>
                    <span className="mx-1 text-slate-300">→</span>
                    <span className={`${c.textDark} font-black`}>{formatIDR(classification.revisi)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
          {group.rows.length > 50 && (
            <p className="text-[11px] text-slate-400 italic px-3 pt-1">
              ...dan {group.rows.length - 50} row lainnya
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaguDiffDashboard;
