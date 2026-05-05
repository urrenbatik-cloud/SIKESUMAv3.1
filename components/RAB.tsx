
import React, { useMemo } from 'react';
import { RABNarrative, RABCategory, RABRow, PaguSection } from '../types';
import { formatIDR } from './Formatters';
import { Trash2, Plus, Info, ChevronRight, ListPlus } from 'lucide-react';

const NarrativeGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
      {title}
    </h5>
    <div className="space-y-4">{children}</div>
  </div>
);

const NarrativeItem: React.FC<{ 
  label: string; 
  value: string | number; 
  onChange: (v: any) => void; 
  isLong?: boolean; 
  isNumber?: boolean; 
}> = ({ label, value, onChange, isLong = false, isNumber = false }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <textarea 
      rows={isLong ? 3 : 1} 
      value={value} 
      onChange={e => onChange(isNumber ? Number(e.target.value) : e.target.value)} 
      className="bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none resize-none shadow-inner transition-all leading-relaxed" 
      placeholder="..." 
    />
  </div>
);

interface RABProps {
  paguSections: PaguSection[];
  categories: RABCategory[];
  onCategoriesChange: (newCategories: RABCategory[]) => void;
  selectedYear: number;
}

const RAB: React.FC<RABProps> = ({ paguSections, categories, onCategoriesChange, selectedYear }) => {

  // LOGIKA HIERARKI: Menghitung total biaya berdasarkan struktur anak (Bubble Up)
  const processedCategories = useMemo(() => {
    return categories.map(cat => {
      let items = [...cat.items];
      
      // Step 1: Hitung rincian dasar (Leaf nodes)
      items = items.map((item, idx) => {
        const hasChildren = idx < items.length - 1 && items[idx + 1].level > item.level;
        if (!hasChildren) {
          return {
            ...item,
            jumlahHargaAwal: (item.jumlahUnits || 0) * (item.hargaSatuanAwal || 0),
            jumlahHargaRevisi: (item.jumlahUnits || 0) * (item.hargaSatuanRevisi || 0)
          };
        }
        return item;
      });

      // Step 2: Bubble up dari level 5 ke 0
      for (let lvl = 5; lvl >= 0; lvl--) {
        items = items.map((item, idx) => {
          const hasChildren = idx < items.length - 1 && items[idx + 1].level > item.level;
          if (item.level === lvl && hasChildren) {
            let sumAwal = 0;
            let sumRevisi = 0;
            for (let j = idx + 1; j < items.length; j++) {
              if (items[j].level <= item.level) break;
              if (items[j].level === item.level + 1) {
                sumAwal += items[j].jumlahHargaAwal || 0;
                sumRevisi += items[j].jumlahHargaRevisi || 0;
              }
            }
            return { ...item, jumlahHargaAwal: sumAwal, jumlahHargaRevisi: sumRevisi };
          }
          return item;
        });
      }
      return { ...cat, items };
    });
  }, [categories]);

  const handleRowChange = (catId: string, rowId: string, field: keyof RABRow, value: any) => {
    onCategoriesChange(categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === rowId ? { ...item, [field]: value } : item)
        };
      }
      return cat;
    }));
  };

  const addRootRow = (catId: string) => {
    const newRow: RABRow = {
      id: `rab-row-${Date.now()}`,
      kode: '', uraian: '', volumeSub: '', jenisKomponen: 'Utama', satuan: '',
      jumlahUnits: 1, hargaSatuanAwal: 0, hargaSatuanRevisi: 0,
      jumlahHargaAwal: 0, jumlahHargaRevisi: 0, level: 0
    };
    onCategoriesChange(categories.map(cat => cat.id === catId ? { ...cat, items: [...cat.items, newRow] } : cat));
  };

  const addSubRow = (catId: string, parentRowId: string) => {
    onCategoriesChange(categories.map(cat => {
      if (cat.id === catId) {
        const parentIdx = cat.items.findIndex(i => i.id === parentRowId);
        if (parentIdx === -1) return cat;
        const parent = cat.items[parentIdx];
        const newRow: RABRow = {
          id: `rab-row-${Date.now()}`,
          kode: '', uraian: '', volumeSub: '', jenisKomponen: parent.jenisKomponen, satuan: '',
          jumlahUnits: 1, hargaSatuanAwal: 0, hargaSatuanRevisi: 0,
          jumlahHargaAwal: 0, jumlahHargaRevisi: 0, level: Math.min(parent.level + 1, 5)
        };
        const newItems = [...cat.items];
        newItems.splice(parentIdx + 1, 0, newRow);
        return { ...cat, items: newItems };
      }
      return cat;
    }));
  };

  const deleteRow = (catId: string, rowId: string) => {
    onCategoriesChange(categories.map(cat => cat.id === catId ? { ...cat, items: cat.items.filter(i => i.id !== rowId) } : cat));
  };

  const handleNarrativeChange = (catId: string, field: keyof RABNarrative, value: any) => {
    onCategoriesChange(categories.map(cat => cat.id === catId ? { ...cat, narrative: { ...cat.narrative, [field]: value } } : cat));
  };

  const toggleNarrative = (catId: string) => {
    onCategoriesChange(categories.map(c => c.id === catId ? { ...c, showNarrative: !c.showNarrative } : c));
  };

  return (
    <div className="space-y-12 pb-32">
      <div className="bg-[#1e293b] rounded-2xl p-6 flex items-center justify-between text-white shadow-xl ring-4 ring-slate-200">
         <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-900/40">
              <ListPlus className="text-white" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">RENCANA ANGGARAN BELANJA TA {selectedYear}</p>
              <p className="text-xl font-black italic">RAB Format Mendetail (Standar Kemhan/TNI AD)</p>
            </div>
         </div>
         <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 rounded-xl flex items-center gap-2">
            <Info size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Narasi RAB Terintegrasi</span>
         </div>
      </div>

      {processedCategories.map((cat, idx) => {
        const showRevisi = cat.viewMode === 'REVISI' || cat.viewMode === 'SEMUA';
        const minLvl = cat.items.length > 0 ? Math.min(...cat.items.map(i => i.level)) : 0;
        const subtotal = cat.items.filter(i => i.level === minLvl).reduce((s, i) => s + (showRevisi ? i.jumlahHargaRevisi : i.jumlahHargaAwal), 0);

        return (
          <section key={cat.id} className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden mb-10">
            <div className="p-8 bg-slate-900 border-b border-slate-800 flex flex-wrap justify-between items-center gap-6">
              <div className="flex items-center gap-5 flex-1 min-w-[300px]">
                  <div className="bg-blue-600 text-white rounded-2xl flex flex-col items-center justify-center w-14 h-14 shadow-xl ring-2 ring-slate-800"><span className="text-xl font-black">{idx + 1}</span></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">RAB SEKSI TA {selectedYear}</p>
                    <input 
                      value={cat.title} 
                      onChange={(e) => onCategoriesChange(categories.map(c => c.id === cat.id ? { ...c, title: e.target.value } : c))} 
                      className="bg-transparent border-none p-0 text-xl font-black text-white uppercase tracking-tight w-full outline-none focus:ring-0" 
                      placeholder="Nama Seksi RAB..."
                    />
                  </div>
              </div>
              <div className="flex items-center gap-3 no-print">
                  <button onClick={() => addRootRow(cat.id)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all">
                    <Plus size={16} /> Tambah Baris
                  </button>
                  <button onClick={() => toggleNarrative(cat.id)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${cat.showNarrative ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400'}`}>
                    {cat.showNarrative ? "Tutup Identitas" : "Buka Identitas"}
                  </button>
              </div>
            </div>

            {cat.showNarrative && (
              <div className="p-10 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <NarrativeGroup title="Identitas Organisasi & Program">
                      <NarrativeItem label="Kementerian Negara/Lembaga" value={cat.narrative.kementerian} onChange={v => handleNarrativeChange(cat.id, 'kementerian', v)} />
                      <NarrativeItem label="Unit Eselon I/II" value={cat.narrative.unitEselon} onChange={v => handleNarrativeChange(cat.id, 'unitEselon', v)} />
                      <NarrativeItem label="Program" value={cat.narrative.program} onChange={v => handleNarrativeChange(cat.id, 'program', v)} />
                      <NarrativeItem label="Sasaran Program" value={cat.narrative.sasaranProgram} onChange={v => handleNarrativeChange(cat.id, 'sasaranProgram', v)} isLong />
                      <NarrativeItem label="Indikator Kinerja Program" value={cat.narrative.indikatorKinerjaProgram} onChange={v => handleNarrativeChange(cat.id, 'indikatorKinerjaProgram', v)} isLong />
                    </NarrativeGroup>
                    <NarrativeGroup title="Detail Kegiatan">
                      <NarrativeItem label="Kegiatan" value={cat.narrative.kegiatan} onChange={v => handleNarrativeChange(cat.id, 'kegiatan', v)} />
                      <NarrativeItem label="Sasaran Kegiatan" value={cat.narrative.sasaranKegiatan} onChange={v => handleNarrativeChange(cat.id, 'sasaranKegiatan', v)} isLong />
                      <NarrativeItem label="Indikator Kinerja Kegiatan" value={cat.narrative.indikatorKinerjaKegiatan} onChange={v => handleNarrativeChange(cat.id, 'indikatorKinerjaKegiatan', v)} isLong />
                    </NarrativeGroup>
                  </div>
                  <div className="space-y-6">
                    <NarrativeGroup title="Klasifikasi Rincian Output (KRO/RO)">
                      <NarrativeItem label="Klasifikasi Rincian Output (KRO)" value={cat.narrative.kro} onChange={v => handleNarrativeChange(cat.id, 'kro', v)} />
                      <NarrativeItem label="Indikator KRO" value={cat.narrative.indikatorKRO} onChange={v => handleNarrativeChange(cat.id, 'indikatorKRO', v)} isLong />
                      <div className="h-px bg-slate-100 my-2"></div>
                      <NarrativeItem label="Rincian Output (RO)" value={cat.narrative.ro} onChange={v => handleNarrativeChange(cat.id, 'ro', v)} />
                      <NarrativeItem label="Indikator RO" value={cat.narrative.indikatorRO} onChange={v => handleNarrativeChange(cat.id, 'indikatorRO', v)} isLong />
                      <div className="grid grid-cols-2 gap-4">
                        <NarrativeItem label="Volume RO" value={cat.narrative.volumeRO} onChange={v => handleNarrativeChange(cat.id, 'volumeRO', v)} isNumber />
                        <NarrativeItem label="Satuan RO" value={cat.narrative.satuanRO} onChange={v => handleNarrativeChange(cat.id, 'satuanRO', v)} />
                      </div>
                    </NarrativeGroup>
                    <NarrativeGroup title="Komponen & Sub Komponen">
                      <NarrativeItem label="Komponen" value={cat.narrative.komponen} onChange={v => handleNarrativeChange(cat.id, 'komponen', v)} />
                      <NarrativeItem label="Sub Komponen" value={cat.narrative.subKomponen} onChange={v => handleNarrativeChange(cat.id, 'subKomponen', v)} />
                      <NarrativeItem label="Indikator Sub Komponen" value={cat.narrative.indikatorSubKomponen} onChange={v => handleNarrativeChange(cat.id, 'indikatorSubKomponen', v)} isLong />
                      <div className="grid grid-cols-2 gap-4">
                        <NarrativeItem label="Volume Sub" value={cat.narrative.volumeSubKomponen} onChange={v => handleNarrativeChange(cat.id, 'volumeSubKomponen', v)} isNumber />
                        <NarrativeItem label="Satuan Sub" value={cat.narrative.satuanSubKomponen} onChange={v => handleNarrativeChange(cat.id, 'satuanSubKomponen', v)} />
                      </div>
                    </NarrativeGroup>
                  </div>
                </div>
                
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center text-center border-b-4 border-emerald-500">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Total Alokasi Dana (Netto)</p>
                  <p className="text-4xl font-black text-white font-mono">{formatIDR(subtotal)}</p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse table-fixed min-w-[1500px]">
                  <thead className="bg-[#1e293b] text-white font-black uppercase tracking-widest text-[8px]">
                    <tr className="divide-x divide-slate-700">
                      <th className="px-5 py-5 w-32">1. KODE</th>
                      <th className="px-5 py-5 w-[25%]">2. KOMPONEN/SUB/AKUN/DETAIL</th>
                      <th className="px-4 py-5 w-36 text-center">3. VOL SUB KOMP.</th>
                      <th className="px-4 py-5 w-32 text-center">4. JENIS KOMP.</th>
                      <th className="px-4 py-5 w-24 text-center">5. SATUAN</th>
                      <th className="px-4 py-5 w-20 text-center bg-slate-800/50">6. JUMLAH</th>
                      <th className="px-5 py-5 w-40 text-right bg-slate-800/50">7. HARGA SATUAN</th>
                      <th className="px-6 py-5 w-44 text-right bg-blue-900/40">8. JUMLAH TOTAL</th>
                      <th className="px-2 py-5 w-12 text-center no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cat.items.map((item, rIdx) => {
                      const indentation = item.level * 1.5;
                      const hasChildren = rIdx < cat.items.length - 1 && cat.items[rIdx + 1].level > item.level;
                      const currentPrice = showRevisi ? item.hargaSatuanRevisi : item.hargaSatuanAwal;
                      const currentTotal = showRevisi ? item.jumlahHargaRevisi : item.jumlahHargaAwal;

                      return (
                        <tr key={item.id} className={`${hasChildren ? 'bg-slate-50/70 font-black' : 'bg-white'} hover:bg-blue-50/50 transition-colors group/row text-[10px] divide-x divide-slate-100`}>
                          {/* 1. KODE */}
                          <td className="px-5 py-3 align-top">
                            <input className="w-full bg-transparent border-none font-mono font-bold text-slate-500 p-0 outline-none uppercase" value={item.kode} onChange={e => handleRowChange(cat.id, item.id, 'kode', e.target.value)} />
                          </td>
                          {/* 2. URAIAN */}
                          <td className="px-5 py-3 align-top relative" style={{ paddingLeft: `${indentation + 1}rem` }}>
                            <div className="flex items-start gap-2 relative z-10">
                              {item.level < 5 && (
                                <button onClick={() => addSubRow(cat.id, item.id)} className="mt-0.5 w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all transform hover:scale-110 shadow-sm no-print flex-shrink-0"><Plus size={12} /></button>
                              )}
                              <textarea rows={1} className={`w-full bg-transparent border-none p-0 outline-none resize-none leading-relaxed ${hasChildren ? 'font-black text-slate-900 uppercase' : 'font-bold text-slate-700'}`} value={item.uraian} onChange={e => handleRowChange(cat.id, item.id, 'uraian', e.target.value)} placeholder="..." />
                            </div>
                          </td>
                          {/* 3. VOL SUB */}
                          <td className="px-4 py-3 text-center align-top">
                            <input className="w-full bg-transparent border-none p-0 text-center font-bold text-slate-400 uppercase italic" value={item.volumeSub} onChange={e => handleRowChange(cat.id, item.id, 'volumeSub', e.target.value)} />
                          </td>
                          {/* 4. JENIS KOMPONEN */}
                          <td className="px-4 py-3 text-center align-top">
                            <select className={`w-full bg-transparent border-none p-0 text-center font-black uppercase appearance-none outline-none ${item.jenisKomponen === 'Utama' ? 'text-blue-600' : 'text-slate-400'}`} value={item.jenisKomponen} onChange={e => handleRowChange(cat.id, item.id, 'jenisKomponen', e.target.value)}>
                               <option value="Utama">Utama</option>
                               <option value="Penunjang">Penunjang</option>
                               <option value="Lainnya">Lainnya</option>
                            </select>
                          </td>
                          {/* 5. SATUAN */}
                          <td className="px-4 py-3 text-center align-top">
                            {!hasChildren && <input className="w-full bg-transparent border-none p-0 text-center font-black uppercase text-slate-400" value={item.satuan} onChange={e => handleRowChange(cat.id, item.id, 'satuan', e.target.value)} />}
                          </td>
                          {/* 6. JUMLAH (QTY) */}
                          <td className="px-4 py-3 text-center align-top bg-slate-50/30">
                            {!hasChildren && <input type="number" className="w-full bg-transparent border-none p-0 text-center font-black text-slate-900" value={item.jumlahUnits || ''} onChange={e => handleRowChange(cat.id, item.id, 'jumlahUnits', Number(e.target.value))} />}
                          </td>
                          {/* 7. HARGA SATUAN */}
                          <td className="px-5 py-3 text-right align-top bg-slate-50/30">
                            {!hasChildren && (
                              <input 
                                type="number" 
                                className="w-full bg-transparent border-none p-0 text-right font-mono font-black text-slate-900" 
                                value={currentPrice || ''} 
                                onChange={e => handleRowChange(cat.id, item.id, showRevisi ? 'hargaSatuanRevisi' : 'hargaSatuanAwal', Number(e.target.value))} 
                              />
                            )}
                          </td>
                          {/* 8. JUMLAH TOTAL */}
                          <td className={`px-6 py-3 text-right align-top font-black font-mono bg-blue-50/40 ${hasChildren ? 'text-slate-900' : 'text-blue-700'}`}>
                             {formatIDR(currentTotal).replace('Rp', '').trim()}
                          </td>
                          <td className="px-2 py-3 text-center align-top no-print">
                            <button onClick={() => deleteRow(cat.id, item.id)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#0f172a] text-white text-[11px] font-black uppercase">
                    <tr>
                      <td colSpan={7} className="px-8 py-6 text-right tracking-[0.2em] opacity-60">TOTAL ALOKASI DANA SEKSI:</td>
                      <td className="px-6 py-6 text-right font-mono text-lg text-emerald-400" colSpan={2}>{formatIDR(subtotal)}</td>
                    </tr>
                  </tfoot>
                </table>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default RAB;
