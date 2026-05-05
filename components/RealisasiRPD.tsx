
import React, { useState } from 'react';
import { RPDSection, RPDRow } from '../types';
import { formatIDR } from './Formatters';
import { Database, Info } from 'lucide-react';

interface RealisasiRPDProps {
  sections: RPDSection[];
  onSectionsChange: (newSections: RPDSection[]) => void;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  selectedYear: number;
}

const RealisasiRPD: React.FC<RealisasiRPDProps> = ({ sections, onSectionsChange, viewMode, selectedYear }) => {
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  const showRevisi = viewMode === 'REVISI' || viewMode === 'SEMUA';
  const showSemula = viewMode === 'SEMULA' || viewMode === 'SEMUA';

  const toggleRowCollapse = (rowId: string) => {
    setCollapsedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const calculateRowSums = (row: RPDRow) => {
    const { monthly } = row;
    const t1 = (monthly.m1 || 0) + (monthly.m2 || 0) + (monthly.m3 || 0);
    const t2 = (monthly.m4 || 0) + (monthly.m5 || 0) + (monthly.m6 || 0);
    const t3 = (monthly.m7 || 0) + (monthly.m8 || 0) + (monthly.m9 || 0);
    const t4 = (monthly.m10 || 0) + (monthly.m11 || 0) + (monthly.m12 || 0);
    const total = t1 + t2 + t3 + t4;
    return { t1, t2, t3, t4, total };
  };

  const getVisibleRows = (rows: RPDRow[]) => {
    const visible: RPDRow[] = [];
    let hiddenAboveLevel = Infinity;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.level <= hiddenAboveLevel) {
        hiddenAboveLevel = Infinity;
      }

      if (hiddenAboveLevel === Infinity) {
        visible.push(row);
        if (collapsedRows.has(row.id)) {
          hiddenAboveLevel = row.level;
        }
      }
    }
    return visible;
  };

  return (
    <div className="space-y-12 pb-32">
      <div className="bg-[#1e293b] rounded-2xl p-6 flex items-center justify-between text-white shadow-xl ring-4 ring-slate-200">
         <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-900/40">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">LAPORAN REALISASI ANGGARAN (LRA) TA {selectedYear}</p>
              <p className="text-xl font-black text-white">Sinkronisasi Audit Berbasis Kode Akun - Aktif</p>
            </div>
         </div>
         <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
            <Info size={14} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-100">Data Realisasi Mengikuti Alamat Kode Akun</span>
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
              <table className="w-full text-[10px] text-left border-collapse table-fixed min-w-[2100px]">
                <thead className="text-white font-black uppercase tracking-tighter text-center">
                  <tr className="bg-slate-800">
                    <th rowSpan={2} className="w-80 px-4 py-4 text-left sticky left-0 z-20 bg-slate-800 border-r border-slate-700">KEGIATAN / KODE AKUN TA {selectedYear}</th>
                    {showSemula && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-slate-900">PAGU SEMULA</th>}
                    {showRevisi && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-blue-900">PAGU REVISI</th>}
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">TRIMESTER I</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">TRIMESTER II</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">TRIMESTER III</th>
                    <th colSpan={4} className="bg-emerald-700 border-b border-emerald-600">TRIMESTER IV</th>
                    <th rowSpan={2} className="w-32 px-2 py-4 bg-slate-900 border-l border-slate-700">TOTAL REALISASI</th>
                    <th rowSpan={2} className="w-24 px-2 py-4 bg-slate-800 border-l border-slate-700">SISA PAGU</th>
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
                    const currentPagu = viewMode === 'SEMULA' ? row.totalBudget : row.totalBudgetRevisi;
                    const sisa = currentPagu - total;
                    const indentation = row.level * 1.5;
                    const originalIndex = section.rows.findIndex(r => r.id === row.id);
                    const nextRowOriginal = section.rows[originalIndex + 1];
                    const hasChildren = nextRowOriginal && nextRowOriginal.level > row.level;

                    return (
                      <tr key={row.id} className={`${hasChildren ? 'bg-slate-50/50' : 'bg-white'} hover:bg-emerald-50 transition-colors group text-[10px]`}>
                        <td className="px-4 py-3 sticky left-0 z-10 bg-inherit border-r border-slate-100 align-top" style={{ paddingLeft: `${indentation + 1}rem` }}>
                          <span className="font-mono font-black text-emerald-600 mr-2">{row.kode}</span>
                          <span className={`${hasChildren ? 'font-black' : 'font-bold'} text-slate-700`}>{row.description}</span>
                        </td>
                        {showSemula && <td className="px-2 py-3 text-right font-mono font-bold text-slate-400">{formatIDR(row.totalBudget).replace('Rp', '').trim()}</td>}
                        {showRevisi && <td className="px-2 py-3 text-right font-mono font-black text-blue-800">{formatIDR(row.totalBudgetRevisi).replace('Rp', '').trim()}</td>}
                        
                        {[1, 2, 3, 't1', 4, 5, 6, 't2', 7, 8, 9, 't3', 10, 11, 12, 't4'].map((m) => {
                          const isSub = typeof m === 'string';
                          const mKey = isSub ? m : `m${m}`;
                          const val = isSub ? (m === 't1' ? t1 : m === 't2' ? t2 : m === 't3' ? t3 : t4) : (row.monthly as any)[mKey];
                          const hasValue = val > 0;

                          return (
                            <td key={mKey} className={`px-1 py-3 text-right border-r border-slate-100 ${isSub ? 'bg-emerald-50 font-black' : ''} ${hasValue && !isSub ? 'bg-emerald-50/30' : ''}`}>
                               <span className={`font-mono font-black ${hasValue ? 'text-emerald-700' : 'text-slate-300'}`}>
                                 {val > 0 ? formatIDR(val).replace('Rp', '').trim() : '-'}
                               </span>
                            </td>
                          );
                        })}

                        <td className="px-2 py-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">{total > 0 ? formatIDR(total).replace('Rp', '').trim() : '-'}</td>
                        <td className={`px-2 py-3 text-right font-mono font-black ${sisa < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{formatIDR(sisa).replace('Rp', '').trim()}</td>
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
