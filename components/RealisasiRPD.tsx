
import React, { useState, useMemo } from 'react';
import { RPDSection, RPDRow, PaguSection } from '../types';
import { formatIDR } from './Formatters';
import { Database, Info } from 'lucide-react';

// ============================================================================
// RealisasiRPD — Laporan Realisasi Anggaran (LRA)
// ============================================================================
// FIX (9 Mei 2026): Bug E1.2 — realisasi hanya dari tagihan "Lunas".
// FIX (10 Mei 2026): Pagu single source of truth — diambil dari paguSections
//   (Tab 1.1 Pagu Anggaran), BUKAN dari RPDSection.totalBudget yang terpisah.
//   Lookup via kode akun (leaf nodes only, anti double-count).
//
// ENHANCEMENT (C7/E2.4): Pagu + RPD Rencana + Realisasi + Delta + Sisa Pagu
// ============================================================================

interface RealisasiRPDProps {
  /** Sections dengan monthly = data realisasi (zero-init + absorptionMap Lunas only) */
  sections: RPDSection[];
  /** Sections RPD rencana asli (optional, untuk perbandingan) */
  rpdPlannedSections?: RPDSection[];
  /** Pagu dari Tab 1.1 — single source of truth (optional, fallback ke RPD pagu) */
  paguSections?: PaguSection[];
  onSectionsChange: (newSections: RPDSection[]) => void;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  selectedYear: number;
}

const RealisasiRPD: React.FC<RealisasiRPDProps> = ({ sections, rpdPlannedSections, paguSections, onSectionsChange, viewMode, selectedYear }) => {
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  const showRevisi = viewMode === 'REVISI' || viewMode === 'SEMUA';
  const showSemula = viewMode === 'SEMULA' || viewMode === 'SEMUA';

  const toggleRowCollapse = (rowId: string) => {
    setCollapsedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) newSet.delete(rowId);
      else newSet.add(rowId);
      return newSet;
    });
  };

  const sumMonthly = (monthly: RPDRow['monthly']) => {
    return (monthly.m1||0)+(monthly.m2||0)+(monthly.m3||0)+(monthly.m4||0)+(monthly.m5||0)+(monthly.m6||0)
      +(monthly.m7||0)+(monthly.m8||0)+(monthly.m9||0)+(monthly.m10||0)+(monthly.m11||0)+(monthly.m12||0);
  };

  const calculateRowSums = (row: RPDRow) => {
    const { monthly } = row;
    const t1 = (monthly.m1||0)+(monthly.m2||0)+(monthly.m3||0);
    const t2 = (monthly.m4||0)+(monthly.m5||0)+(monthly.m6||0);
    const t3 = (monthly.m7||0)+(monthly.m8||0)+(monthly.m9||0);
    const t4 = (monthly.m10||0)+(monthly.m11||0)+(monthly.m12||0);
    return { t1, t2, t3, t4, total: t1+t2+t3+t4 };
  };

  // Lookup: rowId → planned RPD row
  const plannedLookup = useMemo(() => {
    const map: Record<string, RPDRow> = {};
    if (rpdPlannedSections) {
      rpdPlannedSections.forEach(sec => sec.rows.forEach(row => { map[row.id] = row; }));
    }
    return map;
  }, [rpdPlannedSections]);

  // Lookup: kode akun → pagu { awal, revisi } from Tab 1.1 (single source of truth)
  // Uses leaf-node-only logic to avoid double-counting parent rows
  const paguByKode = useMemo(() => {
    const map: Record<string, { awal: number; revisi: number }> = {};
    if (paguSections) {
      const allRows = paguSections.flatMap(s => s.rows);
      paguSections.forEach(sec => {
        sec.rows.forEach((row, idx) => {
          const cleanCode = row.kode.trim();
          if (!cleanCode) return;
          // Check if this row has children (= parent/subtotal row)
          const myGlobalIdx = allRows.findIndex(r => r.id === row.id);
          const nextRow = allRows[myGlobalIdx + 1];
          const hasChildren = nextRow && nextRow.level > row.level;
          // Only count leaf nodes to avoid double-counting
          if (!hasChildren) {
            if (!map[cleanCode]) map[cleanCode] = { awal: 0, revisi: 0 };
            map[cleanCode].awal += row.jumlahBiayaAwal || 0;
            map[cleanCode].revisi += row.jumlahBiayaRevisi || 0;
          }
        });
      });
    }
    return map;
  }, [paguSections]);

  // Helper: get pagu for a row — from paguSections if available, fallback to RPD's own value
  const getPaguForRow = (row: RPDRow): { awal: number; revisi: number } => {
    const kode = row.kode.trim();
    if (paguByKode[kode]) return paguByKode[kode];
    // Fallback: use RPD's own totalBudget (may differ from Tab 1.1)
    return { awal: row.totalBudget || 0, revisi: row.totalBudgetRevisi || 0 };
  };

  const getVisibleRows = (rows: RPDRow[]) => {
    const visible: RPDRow[] = [];
    let hiddenAboveLevel = Infinity;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.level <= hiddenAboveLevel) hiddenAboveLevel = Infinity;
      if (hiddenAboveLevel === Infinity) {
        visible.push(row);
        if (collapsedRows.has(row.id)) hiddenAboveLevel = row.level;
      }
    }
    return visible;
  };

  // Grand totals — pagu from paguSections (Tab 1.1), not from RPD
  const grandTotals = useMemo(() => {
    let totalPagu = 0, totalRencana = 0, totalRealisasi = 0;

    if (paguSections && paguSections.length > 0) {
      // Pagu from Tab 1.1 (single source of truth)
      paguSections.forEach(sec => {
        const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
        sec.rows.filter(r => r.level === minLvl).forEach(r => {
          totalPagu += (viewMode === 'SEMULA' ? r.jumlahBiayaAwal : r.jumlahBiayaRevisi) || 0;
        });
      });
    } else {
      // Fallback: from RPD rows (backward compat)
      sections.forEach(sec => {
        const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
        sec.rows.filter(r => r.level === minLvl).forEach(row => {
          totalPagu += (viewMode === 'SEMULA' ? row.totalBudget : row.totalBudgetRevisi) || 0;
        });
      });
    }

    // Realisasi + RPD Rencana from sections
    sections.forEach(sec => {
      const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
      sec.rows.filter(r => r.level === minLvl).forEach(row => {
        totalRealisasi += sumMonthly(row.monthly);
        const planned = plannedLookup[row.id];
        if (planned) totalRencana += sumMonthly(planned.monthly);
      });
    });

    return { totalPagu, totalRencana, totalRealisasi, delta: totalRealisasi - totalRencana, sisaPagu: totalPagu - totalRealisasi };
  }, [sections, plannedLookup, viewMode, paguSections]);

  const hasPlanned = !!rpdPlannedSections;

  return (
    <div className="space-y-12 pb-32">
      {/* Header */}
      <div className="bg-[#1e293b] rounded-2xl p-6 text-white shadow-xl ring-4 ring-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-900/40">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">LAPORAN REALISASI ANGGARAN (LRA) TA {selectedYear}</p>
              <p className="text-xl font-black text-white">Sinkronisasi Audit Berbasis Kode Akun</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
            <Info size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-100">Hanya tagihan berstatus LUNAS yang masuk realisasi</span>
          </div>
        </div>
        {/* Summary cards */}
        <div className={`grid ${hasPlanned ? 'grid-cols-5' : 'grid-cols-3'} gap-3 mt-4`}>
          <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Pagu</p>
            <p className="text-lg font-black text-white font-mono">{formatIDR(grandTotals.totalPagu)}</p>
          </div>
          {hasPlanned && (
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">RPD Rencana</p>
              <p className="text-lg font-black text-blue-300 font-mono">{formatIDR(grandTotals.totalRencana)}</p>
            </div>
          )}
          <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Realisasi (Lunas)</p>
            <p className="text-lg font-black text-emerald-400 font-mono">{formatIDR(grandTotals.totalRealisasi)}</p>
          </div>
          {hasPlanned && (
            <div className={`rounded-xl px-4 py-3 border ${grandTotals.delta > 0 ? 'bg-rose-500/10 border-rose-400/30' : grandTotals.delta < 0 ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Delta (Real − Rencana)</p>
              <p className={`text-lg font-black font-mono ${grandTotals.delta > 0 ? 'text-rose-400' : grandTotals.delta < 0 ? 'text-emerald-400' : 'text-white'}`}>
                {grandTotals.delta > 0 ? '+' : ''}{formatIDR(grandTotals.delta)}
              </p>
            </div>
          )}
          <div className={`rounded-xl px-4 py-3 border ${grandTotals.sisaPagu < 0 ? 'bg-rose-500/10 border-rose-400/30' : 'bg-white/5 border-white/10'}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Sisa Pagu</p>
            <p className={`text-lg font-black font-mono ${grandTotals.sisaPagu < 0 ? 'text-rose-400' : 'text-white'}`}>
              {formatIDR(grandTotals.sisaPagu)}
            </p>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const visibleRows = getVisibleRows(section.rows);
        
        return (
          <div key={section.id} className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden mb-10">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{section.title}</h3>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Alamat: Kode Satker Terdaftar</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] text-left border-collapse table-fixed min-w-[2400px]">
                <thead className="text-white font-black uppercase tracking-tighter text-center">
                  <tr className="bg-slate-800">
                    <th rowSpan={2} className="w-80 px-4 py-4 text-left sticky left-0 z-20 bg-slate-800 border-r border-slate-700">KEGIATAN / KODE AKUN TA {selectedYear}</th>
                    {showSemula && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-slate-900">PAGU SEMULA</th>}
                    {showRevisi && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-blue-900">PAGU REVISI</th>}
                    {hasPlanned && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-indigo-900">RPD RENCANA</th>}
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">REALISASI TRIMESTER I</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">REALISASI TRIMESTER II</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">REALISASI TRIMESTER III</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">REALISASI TRIMESTER IV</th>
                    <th rowSpan={2} className="w-32 px-2 py-4 bg-slate-900 border-l border-slate-700">TOTAL REALISASI</th>
                    {hasPlanned && <th rowSpan={2} className="w-28 px-2 py-4 bg-amber-900 border-l border-slate-700">DELTA</th>}
                    <th rowSpan={2} className="w-28 px-2 py-4 bg-slate-800 border-l border-slate-700">SISA PAGU</th>
                  </tr>
                  <tr className="bg-slate-700 text-[8px]">
                    <th className="w-20 bg-emerald-800/40">JAN</th><th className="w-20 bg-emerald-800/40">FEB</th><th className="w-20 bg-emerald-800/40">MAR</th><th className="w-24 bg-emerald-900 font-black">SUB T1</th>
                    <th className="w-20 bg-emerald-800/40">APR</th><th className="w-20 bg-emerald-800/40">MEI</th><th className="w-20 bg-emerald-800/40">JUN</th><th className="w-24 bg-emerald-900 font-black">SUB T2</th>
                    <th className="w-20 bg-emerald-800/40">JUL</th><th className="w-20 bg-emerald-800/40">AGU</th><th className="w-20 bg-emerald-800/40">SEP</th><th className="w-24 bg-emerald-900 font-black">SUB T3</th>
                    <th className="w-20 bg-emerald-800/40">OKT</th><th className="w-20 bg-emerald-800/40">NOV</th><th className="w-20 bg-emerald-800/40">DES</th><th className="w-24 bg-emerald-900 font-black">SUB T4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {visibleRows.map((row) => {
                    const { t1, t2, t3, t4, total } = calculateRowSums(row);
                    const rowPagu = getPaguForRow(row);
                    const currentPagu = viewMode === 'SEMULA' ? rowPagu.awal : rowPagu.revisi;
                    const planned = plannedLookup[row.id];
                    const totalPlanned = planned ? sumMonthly(planned.monthly) : 0;
                    const delta = total - totalPlanned;
                    const sisa = currentPagu - total;
                    const indentation = row.level * 1.5;
                    const originalIndex = section.rows.findIndex(r => r.id === row.id);
                    const nextRowOriginal = section.rows[originalIndex + 1];
                    const hasChildren = nextRowOriginal && nextRowOriginal.level > row.level;

                    return (
                      <tr key={row.id} className={`${hasChildren ? 'bg-slate-50/50' : 'bg-white'} hover:bg-emerald-50 transition-colors group text-[10px]`}>
                        <td className="px-4 py-3 sticky left-0 z-10 bg-inherit border-r border-slate-100 align-top cursor-pointer" style={{ paddingLeft: `${indentation + 1}rem` }} onClick={() => hasChildren && toggleRowCollapse(row.id)}>
                          <span className="font-mono font-black text-emerald-600 mr-2">{row.kode}</span>
                          <span className={`${hasChildren ? 'font-black' : 'font-bold'} text-slate-700`}>{row.description}</span>
                          {hasChildren && <span className="ml-2 text-slate-400">{collapsedRows.has(row.id) ? '▶' : '▼'}</span>}
                        </td>
                        {showSemula && <td className="px-2 py-3 text-right font-mono font-bold text-slate-400">{formatIDR(rowPagu.awal).replace('Rp', '').trim()}</td>}
                        {showRevisi && <td className="px-2 py-3 text-right font-mono font-black text-blue-800">{formatIDR(rowPagu.revisi).replace('Rp', '').trim()}</td>}
                        {hasPlanned && (
                          <td className="px-2 py-3 text-right font-mono font-bold text-indigo-600 bg-indigo-50/30">
                            {totalPlanned > 0 ? formatIDR(totalPlanned).replace('Rp', '').trim() : '-'}
                          </td>
                        )}
                        
                        {[1, 2, 3, 't1', 4, 5, 6, 't2', 7, 8, 9, 't3', 10, 11, 12, 't4'].map((m) => {
                          const isSub = typeof m === 'string';
                          const mKey = isSub ? m : `m${m}`;
                          const val = isSub ? (m === 't1' ? t1 : m === 't2' ? t2 : m === 't3' ? t3 : t4) : (row.monthly as any)[mKey];
                          const hasValue = val > 0;
                          const plannedVal = planned && !isSub ? (planned.monthly as any)[mKey] || 0 : 0;
                          const isOverPlanned = hasValue && plannedVal > 0 && val > plannedVal;

                          return (
                            <td key={mKey} className={`px-1 py-3 text-right border-r border-slate-100 ${isSub ? 'bg-emerald-50 font-black' : ''} ${isOverPlanned ? 'bg-rose-50' : hasValue && !isSub ? 'bg-emerald-50/30' : ''}`}>
                               <span className={`font-mono font-black ${isOverPlanned ? 'text-rose-600' : hasValue ? 'text-emerald-700' : 'text-slate-300'}`}>
                                 {val > 0 ? formatIDR(val).replace('Rp', '').trim() : '-'}
                               </span>
                            </td>
                          );
                        })}

                        <td className="px-2 py-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">{total > 0 ? formatIDR(total).replace('Rp', '').trim() : '-'}</td>
                        {hasPlanned && (
                          <td className={`px-2 py-3 text-right font-mono font-black ${delta > 0 ? 'text-rose-600 bg-rose-50/50' : delta < 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-400'}`}>
                            {total === 0 && totalPlanned === 0 ? '-' : `${delta > 0 ? '+' : ''}${formatIDR(delta).replace('Rp', '').trim()}`}
                          </td>
                        )}
                        <td className={`px-2 py-3 text-right font-mono font-black ${sisa < 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-500'}`}>
                          {formatIDR(sisa).replace('Rp', '').trim()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RealisasiRPD;
