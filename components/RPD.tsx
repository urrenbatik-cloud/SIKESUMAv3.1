
import React, { useState } from 'react';
import { RPDSection, RPDRow } from '../types';
import { formatIDR } from './Formatters';

interface RPDProps {
  sections: RPDSection[];
  onSectionsChange: (newSections: RPDSection[]) => void;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  selectedYear: number;
}

const RPD: React.FC<RPDProps> = ({ sections, onSectionsChange, viewMode, selectedYear }) => {
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

  const bubbleUpRPD = (rows: RPDRow[]): RPDRow[] => {
    let updated = [...rows];
    for (let i = updated.length - 1; i >= 0; i--) {
      const item = updated[i];
      let hasChildren = false;
      const childSums = { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0 };
      let childBudgetSum = 0;
      let childBudgetRevisiSum = 0;

      for (let j = i + 1; j < updated.length; j++) {
        if (updated[j].level <= item.level) break;
        if (updated[j].level === item.level + 1) {
          hasChildren = true;
          childBudgetSum += updated[j].totalBudget || 0;
          childBudgetRevisiSum += updated[j].totalBudgetRevisi || 0;
          Object.keys(childSums).forEach(key => {
            (childSums as any)[key] += (updated[j].monthly as any)[key] || 0;
          });
        }
      }

      if (hasChildren) {
        updated[i].monthly = { ...childSums };
        updated[i].totalBudget = childBudgetSum;
        updated[i].totalBudgetRevisi = childBudgetRevisiSum;
      }
    }
    return updated;
  };

  const handleRowChange = (sectionId: string, rowId: string, field: string, val: any) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const newRows = sec.rows.map(row => {
          if (row.id === rowId) {
            if (field.startsWith('m') && field.length <= 3) {
              return { ...row, monthly: { ...row.monthly, [field]: val } };
            }
            return { ...row, [field as keyof RPDRow]: val };
          }
          return row;
        });
        return { ...sec, rows: bubbleUpRPD(newRows) };
      }
      return sec;
    });
    onSectionsChange(newSections);
  };

  const deleteRow = (sectionId: string, rowId: string) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const filteredRows = sec.rows.filter(r => r.id !== rowId);
        return { ...sec, rows: bubbleUpRPD(filteredRows) };
      }
      return sec;
    });
    onSectionsChange(newSections);
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
            <div className="bg-amber-500 p-3 rounded-xl shadow-lg shadow-amber-900/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">RENCANA PENARIKAN DANA TA {selectedYear}</p>
              <p className="text-xl font-black text-white">RPD 12 Bulan - Mode: {viewMode}</p>
            </div>
         </div>
      </div>

      {sections.map((section) => {
        const visibleRows = getVisibleRows(section.rows);
        
        return (
          <div key={section.id} className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{section.title}</h3>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Tahun Anggaran {selectedYear}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left border-collapse table-fixed min-w-[2100px]">
                  <thead className="text-white font-black uppercase tracking-tighter text-center">
                    <tr className="bg-slate-800">
                      <th rowSpan={2} className="w-80 px-4 py-4 text-left sticky left-0 z-20 bg-slate-800 border-r border-slate-700">KEGIATAN / RINCIAN TA {selectedYear}</th>
                      {showSemula && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-slate-900">PAGU SEMULA</th>}
                      {showRevisi && <th rowSpan={2} className="w-32 px-2 py-4 border-r border-slate-700 bg-blue-900">PAGU REVISI</th>}
                      <th colSpan={4} className="bg-amber-600 border-b border-amber-500">TRIMESTER I</th>
                      <th colSpan={4} className="bg-emerald-600 border-b border-emerald-500">TRIMESTER II</th>
                      <th colSpan={4} className="bg-blue-600 border-b border-blue-500">TRIMESTER III</th>
                      <th colSpan={4} className="bg-purple-600 border-b border-purple-500">TRIMESTER IV</th>
                      <th rowSpan={2} className="w-32 px-2 py-4 bg-slate-900 border-l border-slate-700">TOTAL RPD</th>
                      <th rowSpan={2} className="w-24 px-2 py-4 bg-red-900 border-l border-slate-700">SELISIH</th>
                      <th rowSpan={2} className="w-12 px-2 py-4 bg-slate-800">X</th>
                    </tr>
                    <tr className="bg-slate-700 text-[8px]">
                      <th className="w-20 bg-amber-700/50">JAN</th><th className="w-20 bg-amber-700/50">FEB</th><th className="w-20 bg-amber-700/50">MAR</th><th className="w-24 bg-amber-800 font-black">SUB T1</th>
                      <th className="w-20 bg-emerald-700/50">APR</th><th className="w-20 bg-emerald-700/50">MEI</th><th className="w-20 bg-emerald-700/50">JUN</th><th className="w-24 bg-emerald-800 font-black">SUB T2</th>
                      <th className="w-20 bg-blue-700/50">JUL</th><th className="w-20 bg-blue-700/50">AGU</th><th className="w-20 bg-blue-700/50">SEP</th><th className="w-24 bg-blue-800 font-black">SUB T3</th>
                      <th className="w-20 bg-purple-700/50">OKT</th><th className="w-20 bg-purple-700/50">NOV</th><th className="w-20 bg-purple-700/50">DES</th><th className="w-24 bg-purple-800 font-black">SUB T4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map((row) => {
                      const { t1, t2, t3, t4, total } = calculateRowSums(row);
                      const currentPagu = viewMode === 'SEMULA' ? row.totalBudget : row.totalBudgetRevisi;
                      const selisih = currentPagu - total;
                      
                      const indentation = row.level * 1.5;
                      const originalIndex = section.rows.findIndex(r => r.id === row.id);
                      const nextRowOriginal = section.rows[originalIndex + 1];
                      const hasChildren = nextRowOriginal && nextRowOriginal.level > row.level;
                      const isCollapsed = collapsedRows.has(row.id);

                      return (
                        <tr key={row.id} className={`${hasChildren ? 'bg-slate-50/50 font-black' : 'bg-white'} hover:bg-blue-50 transition-colors group text-[10px]`}>
                          <td className="px-4 py-3 sticky left-0 z-10 bg-inherit border-r border-slate-100 align-top" style={{ paddingLeft: `${indentation + 1}rem` }}>
                             {hasChildren && (
                              <button onClick={() => toggleRowCollapse(row.id)} className={`mr-2 w-4 h-4 rounded bg-slate-200 text-slate-600 items-center justify-center transition-transform inline-flex ${isCollapsed ? '-rotate-90' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            )}
                            <span className="font-bold">{row.kode} {row.description}</span>
                          </td>
                          {showSemula && <td className="px-2 py-3 text-right font-mono font-bold text-slate-400 bg-slate-50/20">{formatIDR(row.totalBudget).replace('Rp', '').trim()}</td>}
                          {showRevisi && <td className="px-2 py-3 text-right font-mono font-black text-blue-800 bg-blue-50/20">{formatIDR(row.totalBudgetRevisi).replace('Rp', '').trim()}</td>}
                          
                          {[1, 2, 3, 't1', 4, 5, 6, 't2', 7, 8, 9, 't3', 10, 11, 12, 't4'].map((m) => {
                            const isSub = typeof m === 'string';
                            const mKey = isSub ? m : `m${m}`;
                            const val = isSub ? (m === 't1' ? t1 : m === 't2' ? t2 : m === 't3' ? t3 : t4) : (row.monthly as any)[mKey];
                            return (
                              <td key={mKey} className={`px-1 py-3 text-right border-r border-slate-100 ${isSub ? 'bg-slate-100/50 font-black' : ''}`}>
                                {!hasChildren && !isSub ? (
                                  <input type="number" className="w-full bg-slate-50 text-right p-1 font-mono font-bold rounded" value={val || ''} onChange={(e) => handleRowChange(section.id, row.id, mKey, Number(e.target.value))} />
                                ) : <span className="font-mono">{val > 0 ? formatIDR(val).replace('Rp', '').trim() : '-'}</span>}
                              </td>
                            );
                          })}

                          <td className="px-2 py-3 text-right font-mono font-black text-blue-700 bg-blue-50/30">{total > 0 ? formatIDR(total).replace('Rp', '').trim() : '-'}</td>
                          <td className={`px-2 py-3 text-right font-mono font-black ${selisih !== 0 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-emerald-600 opacity-30'}`}>{formatIDR(selisih).replace('Rp', '').trim()}</td>
                          <td className="px-1 py-3 text-center"><button onClick={() => deleteRow(section.id, row.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button></td>
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

export default RPD;
