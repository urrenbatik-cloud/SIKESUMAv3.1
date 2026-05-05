
import React, { useMemo } from 'react';
import { PaguRow, PaguSection } from '../types';
import { formatIDR } from './Formatters';
import { Plus, Trash2, TrendingUp, DollarSign, Wallet, ChevronDown, Landmark, Calendar, Printer, FileSpreadsheet, ListChecks } from 'lucide-react';
import { YEARS } from '../constants';

interface PaguAnggaranProps {
  sections: PaguSection[];
  onSectionsChange: (newSections: PaguSection[]) => void;
  onAddSection: () => void;
  onDeleteSection: (id: string) => void;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  selectedYear: number;
  onYearChange: (year: number) => void;
  metrics: {
    total: { budget: number; real: number };
  };
}

const PaguAnggaran: React.FC<PaguAnggaranProps> = ({ 
  sections, onSectionsChange, onAddSection, onDeleteSection, 
  viewMode, selectedYear, onYearChange, metrics 
}) => {

  // FUNGSI UTAMA: Menghitung total biaya berdasarkan hierarki (Bubble Up)
  const processedSections = useMemo(() => {
    return sections.map(section => {
      let rows = [...section.rows];
      
      // Hitung Jumlah Biaya untuk baris rincian (yang tidak punya anak)
      rows = rows.map((row, idx) => {
        const hasChildren = idx < rows.length - 1 && rows[idx + 1].level > row.level;
        if (!hasChildren) {
          return {
            ...row,
            jumlahBiayaAwal: (row.volume || 0) * (row.hargaSatuanAwal || 0),
            jumlahBiayaRevisi: (row.volume || 0) * (row.hargaSatuanRevisi || 0)
          };
        }
        return row;
      });

      // Bubble up totals dari level terdalam ke level terluar (5 ke 0)
      for (let lvl = 5; lvl >= 0; lvl--) {
        rows = rows.map((row, idx) => {
          const hasChildren = idx < rows.length - 1 && rows[idx + 1].level > row.level;
          if (row.level === lvl && hasChildren) {
            let sumAwal = 0;
            let sumRevisi = 0;
            // Cari semua anak langsung (level + 1) sampai bertemu level yang sama atau lebih kecil
            for (let j = idx + 1; j < rows.length; j++) {
              if (rows[j].level <= row.level) break;
              if (rows[j].level === row.level + 1) {
                sumAwal += rows[j].jumlahBiayaAwal || 0;
                sumRevisi += rows[j].jumlahBiayaRevisi || 0;
              }
            }
            return { ...row, jumlahBiayaAwal: sumAwal, jumlahBiayaRevisi: sumRevisi };
          }
          return row;
        });
      }
      return { ...section, rows };
    });
  }, [sections]);

  // Ringkasan per Kode Akun (Menggabungkan semua seksi)
  const summaryByAccount = useMemo(() => {
    const map: Record<string, { awal: number, revisi: number, desc: string }> = {};
    processedSections.forEach(sec => {
      sec.rows.forEach(row => {
        const cleanCode = row.kode.trim();
        const hasChildren = processedSections.flatMap(s => s.rows).some((r, idx, arr) => {
            const myIdx = arr.findIndex(x => x.id === row.id);
            return idx === myIdx + 1 && r.level > row.level;
        });
        
        // Hanya hitung baris rincian (Leaf nodes) agar tidak double counting
        if (cleanCode && !hasChildren) {
          if (!map[cleanCode]) map[cleanCode] = { awal: 0, revisi: 0, desc: row.description };
          map[cleanCode].awal += row.jumlahBiayaAwal;
          map[cleanCode].revisi += row.jumlahBiayaRevisi;
        }
      });
    });
    return Object.entries(map).sort();
  }, [processedSections]);

  const handleRowChange = (sectionId: string, rowId: string, field: keyof PaguRow, value: any) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const newRows = sec.rows.map(row => 
          row.id === rowId ? { ...row, [field]: value } : row
        );
        return { ...sec, rows: newRows };
      }
      return sec;
    });
    onSectionsChange(newSections);
  };

  const addRootRow = (sectionId: string) => {
    const newRow: PaguRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      kode: '', description: '', volume: 1, satuan: '',
      hargaSatuanAwal: 0, hargaSatuanRevisi: 0, jumlahBiayaAwal: 0,
      jumlahBiayaRevisi: 0, realisasi: 0, sumberDana: 'RM', level: 0
    };
    onSectionsChange(sections.map(sec => sec.id === sectionId ? { ...sec, rows: [...sec.rows, newRow] } : sec));
  };

  const addSubRow = (sectionId: string, parentRowId: string) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const parentIndex = sec.rows.findIndex(r => r.id === parentRowId);
        if (parentIndex === -1) return sec;
        const parent = sec.rows[parentIndex];
        const newRow: PaguRow = {
          id: `row-${Date.now()}-${Math.random()}`,
          kode: '', description: '', volume: 1, satuan: '',
          hargaSatuanAwal: 0, hargaSatuanRevisi: 0, jumlahBiayaAwal: 0,
          jumlahBiayaRevisi: 0, realisasi: 0, sumberDana: parent.sumberDana, level: Math.min(parent.level + 1, 5)
        };
        const newRows = [...sec.rows];
        newRows.splice(parentIndex + 1, 0, newRow);
        return { ...sec, rows: newRows };
      }
      return sec;
    });
    onSectionsChange(newSections);
  };

  const showSemula = viewMode === 'SEMULA' || viewMode === 'SEMUA';
  const showRevisi = viewMode === 'REVISI' || viewMode === 'SEMUA';

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full -mr-48 -mt-48 opacity-40"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-emerald-500" /> Pilih Tahun Anggaran
             </label>
             <div className="relative group">
                <select 
                  value={selectedYear} 
                  onChange={(e) => onYearChange(Number(e.target.value))} 
                  className="pl-6 pr-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none cursor-pointer appearance-none shadow-lg hover:bg-emerald-600 transition-all border border-slate-800"
                >
                   {YEARS.map(y => <option key={y} value={y}>TA {y}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
             </div>
          </div>
          <div className="h-16 w-px bg-slate-100 mx-4 hidden md:block"></div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
               RKKS RUMAH SAKIT TK.IV 02.07.03 BATIN TIKAL
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                  Pagu Anggaran & Rencana Kerja Digital
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print relative z-10">
          <button onClick={onAddSection} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3 active:scale-95 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Seksi Baru
          </button>
        </div>
      </div>

      {/* BUDGET SECTIONS */}
      {processedSections.map((section, idx) => {
        const minLvl = section.rows.length > 0 ? Math.min(...section.rows.map(r => r.level)) : 0;
        const totalAwal = section.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaAwal || 0), 0);
        const totalRevisi = section.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaRevisi || 0), 0);
        
        return (
          <div key={section.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden mb-12">
            <div className="bg-slate-900 px-8 py-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-5 flex-1">
                <div className="bg-emerald-600 text-white text-lg font-black w-10 h-10 flex items-center justify-center rounded-xl shadow-lg ring-2 ring-slate-800">{idx + 1}</div>
                <div className="flex-1">
                  <input 
                    value={section.title} 
                    onChange={(e) => onSectionsChange(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))} 
                    className="bg-transparent border-none focus:ring-0 p-0 text-lg font-black text-white uppercase tracking-tight w-full outline-none" 
                    placeholder="Nama Seksi Anggaran..." 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 no-print">
                <button onClick={() => addRootRow(section.id)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md active:scale-95">
                  <Plus size={14} /> Tambah Baris
                </button>
                <button onClick={() => onDeleteSection(section.id)} className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-xl flex items-center justify-center transition-all active:scale-75"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
                  <thead className="bg-[#1e293b] text-white text-[9px] font-black uppercase tracking-widest">
                    <tr>
                      <th rowSpan={2} className="px-5 py-5 w-32 border-r border-slate-700 text-center">Kode</th>
                      <th rowSpan={2} className="px-5 py-5 w-[35%] border-r border-slate-700">Uraian Komponen</th>
                      <th rowSpan={2} className="px-2 py-5 w-20 text-center border-r border-slate-700">Vol</th>
                      <th rowSpan={2} className="px-4 py-5 w-28 text-center border-r border-slate-700">Satuan</th>
                      <th colSpan={(showSemula ? 1 : 0) + (showRevisi ? 1 : 0)} className="px-4 py-3 text-center border-b border-r border-slate-700 bg-slate-800">Harga Satuan</th>
                      <th colSpan={(showSemula ? 1 : 0) + (showRevisi ? 1 : 0)} className="px-5 py-3 text-center border-b border-r border-slate-700 bg-emerald-900/20">Jumlah Biaya</th>
                      <th rowSpan={2} className="px-4 py-5 w-24 text-center border-r border-slate-700">Sumber</th>
                      <th rowSpan={2} className="px-2 py-5 w-12 text-center no-print"></th>
                    </tr>
                    <tr className="bg-slate-800 text-[8px]">
                      {showSemula && <th className="px-2 py-2 text-center border-r border-slate-700">Semula</th>}
                      {showRevisi && <th className="px-2 py-2 text-center border-r border-slate-700 bg-emerald-900/40">Revisi</th>}
                      {showSemula && <th className="px-2 py-2 text-center border-r border-slate-700">Semula</th>}
                      {showRevisi && <th className="px-2 py-2 text-center border-r border-slate-700 bg-emerald-800/40">Revisi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {section.rows.map((row, rIdx) => {
                      const indentation = row.level * 1.5;
                      const hasChildren = rIdx < section.rows.length - 1 && section.rows[rIdx + 1].level > row.level;
                      return (
                        <tr key={row.id} className={`${hasChildren ? 'bg-slate-50/70 font-black' : 'bg-white'} hover:bg-emerald-50/50 transition-colors group/row text-[11px]`}>
                          <td className="px-5 py-3 border-r border-slate-100 align-top">
                            <input className="w-full bg-transparent border-none focus:ring-0 p-0 font-mono font-bold text-slate-500 uppercase" value={row.kode} onChange={e => handleRowChange(section.id, row.id, 'kode', e.target.value)} />
                          </td>
                          <td className="px-5 py-3 border-r border-slate-100 align-top relative" style={{ paddingLeft: `${indentation + 1}rem` }}>
                            <div className="flex items-start gap-3 relative z-10">
                              {row.level < 5 && (
                                <button onClick={() => addSubRow(section.id, row.id)} className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all transform hover:scale-110 shadow-sm no-print"><Plus size={12} /></button>
                              )}
                              <textarea rows={1} className={`w-full bg-transparent border-none focus:ring-0 p-0 resize-none leading-relaxed outline-none ${hasChildren ? 'font-black text-slate-900 uppercase' : 'font-bold text-slate-700'}`} value={row.description} onChange={e => handleRowChange(section.id, row.id, 'description', e.target.value)} placeholder="..." />
                            </div>
                          </td>
                          <td className="px-2 py-3 border-r border-slate-100 text-center align-top">
                            {!hasChildren && <input type="number" className="w-full bg-slate-50/50 border-none rounded-lg text-center font-black" value={row.volume || ''} onChange={e => handleRowChange(section.id, row.id, 'volume', Number(e.target.value))} />}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-center align-top">
                            {!hasChildren && <input className="w-full bg-slate-50/50 border-none rounded-lg text-center font-bold uppercase text-slate-400" value={row.satuan} onChange={e => handleRowChange(section.id, row.id, 'satuan', e.target.value)} />}
                          </td>
                          {showSemula && (
                            <td className="px-2 py-3 border-r border-slate-100 text-right align-top bg-slate-50/30">
                              {!hasChildren && <input type="number" className="w-full bg-transparent border-none text-right font-mono font-bold text-slate-400" value={row.hargaSatuanAwal || ''} onChange={e => handleRowChange(section.id, row.id, 'hargaSatuanAwal', Number(e.target.value))} />}
                            </td>
                          )}
                          {showRevisi && (
                            <td className="px-2 py-3 border-r border-slate-100 text-right align-top bg-emerald-50/20">
                              {!hasChildren && <input type="number" className="w-full bg-transparent border-none text-right font-mono font-black text-slate-900 outline-none" value={row.hargaSatuanRevisi || ''} onChange={e => handleRowChange(section.id, row.id, 'hargaSatuanRevisi', Number(e.target.value))} />}
                            </td>
                          )}
                          {showSemula && <td className={`px-2 py-3 border-r border-slate-100 text-right align-top font-bold font-mono ${hasChildren ? 'text-slate-900' : 'text-slate-400'}`}>{formatIDR(row.jumlahBiayaAwal).replace('Rp', '').trim()}</td>}
                          {showRevisi && <td className={`px-2 py-3 border-r border-slate-100 text-right align-top font-black font-mono bg-emerald-50/40 ${hasChildren ? 'text-blue-700' : 'text-emerald-700'}`}>{formatIDR(row.jumlahBiayaRevisi).replace('Rp', '').trim()}</td>}
                          <td className="px-4 py-3 border-r border-slate-100 text-center align-top">
                            <input className="w-full bg-transparent border-none focus:ring-0 p-0 text-center font-black uppercase text-slate-300" value={row.sumberDana} onChange={e => handleRowChange(section.id, row.id, 'sumberDana', e.target.value)} />
                          </td>
                          <td className="px-2 py-3 text-center align-top no-print">
                            <button onClick={() => onSectionsChange(sections.map(s => s.id === section.id ? { ...s, rows: s.rows.filter(r => r.id !== row.id) } : s))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white text-[11px] font-black">
                    <tr>
                      <td colSpan={4} className="px-8 py-5 text-right uppercase tracking-[0.2em] opacity-40">Subtotal Seksi TA {selectedYear}:</td>
                      {showSemula && <td className="px-5 py-5 text-right font-mono text-emerald-400 border-r border-slate-800" colSpan={2}>{formatIDR(totalAwal)}</td>}
                      {showRevisi && <td className="px-5 py-5 text-right font-mono text-emerald-300" colSpan={2}>{formatIDR(totalRevisi)}</td>}
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
            </div>
          </div>
        );
      })}

      {/* SUMMARY PER KODE AKUN - Dasar Utama Pembayaran */}
      <div className="bg-[#0f172a] rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><ListChecks size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><ListChecks size={28} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Ringkasan Pagu Per Kode Akun</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Konsolidasi Mata Anggaran Dasar Pembayaran Tagihan</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {summaryByAccount.map(([code, data]) => (
              <div key={code} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xl font-black text-emerald-400 group-hover:scale-110 transition-transform">{code}</span>
                  <span className="text-[8px] font-black bg-white/10 px-2 py-1 rounded uppercase tracking-widest text-slate-500">Mata Anggaran</span>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase mb-4 line-clamp-1">{data.desc}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500"><span>Target Semula</span><span>{formatIDR(data.awal).replace('Rp','')}</span></div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-400"><span>Target Revisi</span><span>{formatIDR(data.revisi).replace('Rp','')}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30"><DollarSign size={32} /></div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Total Pagu Keseluruhan RS TA {selectedYear}</p>
                <h4 className="text-4xl font-black font-mono tracking-tighter">
                  {formatIDR(processedSections.reduce((acc, sec) => {
                    const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
                    return acc + sec.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaRevisi || 0), 0);
                  }, 0))}
                </h4>
              </div>
            </div>
            <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Sinkronisasi</p>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">LIVE DATABASE AKTIF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaguAnggaran;
