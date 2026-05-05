
import React, { useMemo, useState, useRef } from 'react';
import { PatientClaim, Doctor, Employee, BPJSCalcSettings } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR, calculatePPH21 } from './Formatters';
import { 
  LayoutList, Download, Search, Users, Landmark, Wallet, Coins, 
  ArrowRightLeft, UserCog, Edit2, Check, Info, FileText, 
  CheckCircle2, Printer, X, Plus, Trash2, Receipt
} from 'lucide-react';

interface PayrollSummaryProps {
  logs: PatientClaim[];
  doctors: Doctor[];
  staff: Employee[];
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  globalMonth: number;
  globalYear: number;
  payrollStatuses: Record<string, 'Lunas' | 'Belum Lunas'>;
  onPayrollStatusesChange: (newStatuses: Record<string, 'Lunas' | 'Belum Lunas'>) => void;
}

interface SlipExtra {
  label: string;
  nominal: number;
}

const PayrollSummary: React.FC<PayrollSummaryProps> = ({ logs, doctors, staff, bpjsSettingsHistory, globalMonth, globalYear, payrollStatuses, onPayrollStatusesChange }) => {
  const [search, setSearch] = useState('');
  const [taxOverrides, setTaxOverrides] = useState<Record<string, number>>({});
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State untuk Slip Gaji Modal
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [activeSlipPerson, setActiveSlipPerson] = useState<any>(null);
  const [extraAllowances, setExtraAllowances] = useState<SlipExtra[]>([]);
  const [extraDeductions, setExtraDeductions] = useState<SlipExtra[]>([]);
  const [slipNote, setSlipNote] = useState('');

  const consolidatedData = useMemo(() => {
    const periodLogs = logs.filter(l => (l.tahun === globalYear && l.bulan === globalMonth && l.status === 'Verifikasi') || l.status === 'Lunas');
    
    const allPersonnel = [
      ...doctors.map(d => ({ ...d, isDoctor: true })),
      ...staff.map(s => ({ ...s, isDoctor: false }))
    ];

    const poolTotals = { paramOK: 0, paramICU: 0, paramGen: 0, management: 0 };
    periodLogs.forEach(l => {
      const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
      const f = calculatePatientFees(l, s);
      poolTotals.paramOK += f.paramOK;
      poolTotals.paramICU += f.paramICU;
      poolTotals.paramGen += f.paramGen;
      poolTotals.management += (f.pengelola + f.manajemen + f.casemix);
    });

    const staffCounts = {
      ok: staff.filter(st => st.roles.includes('Perawat OK')).length || 1,
      icu: staff.filter(st => st.roles.includes('Perawat ICU')).length || 1,
      gen: staff.filter(st => st.roles.includes('Paramedis Umum')).length || 1,
      mgmt: staff.filter(st => st.roles.some(r => ['Manajemen', 'Casemix', 'Pengelola'].includes(r))).length || 1
    };

    return allPersonnel.map(p => {
      let bpjsEarn = 0;
      let yanEarn = 0;
      let poolBreakdown = { ok: 0, icu: 0, gen: 0, mgmt: 0 };
      let logsAttached: { patient: string; fee: number; category: string; role: string; diagnosa: string }[] = [];
      let isMgmt = !p.isDoctor && p.roles.some(r => ['Manajemen', 'Casemix', 'Pengelola'].includes(r));
      const pName = p.nama.trim().toLowerCase();

      periodLogs.forEach(l => {
        const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
        const f = calculatePatientFees(l, s);
        const isYan = l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA';

        if (p.isDoctor) {
          let earning = 0;
          let role = '';
          if (l.dpjpUtama?.trim().toLowerCase() === pName) { earning += f.spesialis; role = 'DPJP Utama'; }
          if (l.drAnestesi?.trim().toLowerCase() === pName) { earning += f.anestesi; role = role ? role + ' + Anestesi' : 'Anestesi'; }
          if (l.drUmum?.trim().toLowerCase() === pName) { earning += f.gp; role = role ? role + ' + DR Umum' : 'DR Umum'; }
          if (l.drKonsulen?.trim().toLowerCase() === pName) { earning += f.konsul; role = role ? role + ' + Konsulen' : 'Konsulen'; }
          
          if (earning > 0) {
            if (isYan) yanEarn += earning; else bpjsEarn += earning;
            logsAttached.push({ patient: l.nama, fee: earning, category: l.kategoriPasien, role, diagnosa: l.diagnosa });
          }
        }
      });

      if (!p.isDoctor) {
        if (p.roles.includes('Perawat OK')) { 
          bpjsEarn += poolTotals.paramOK / staffCounts.ok; 
          poolBreakdown.ok = poolTotals.paramOK;
        }
        if (p.roles.includes('Perawat ICU')) { 
          bpjsEarn += poolTotals.paramICU / staffCounts.icu; 
          poolBreakdown.icu = poolTotals.paramICU;
        }
        if (p.roles.includes('Paramedis Umum')) { 
          bpjsEarn += poolTotals.paramGen / staffCounts.gen; 
          poolBreakdown.gen = poolTotals.paramGen;
        }
        if (isMgmt) { 
          bpjsEarn += poolTotals.management / staffCounts.mgmt; 
          poolBreakdown.mgmt = poolTotals.management;
        }
      }

      const tksBase = p.isDoctor ? 0 : (p.baseHonor || 0);
      const docTransport = p.isDoctor ? (p.baseTransport || 0) : 0;
      const gross = tksBase + docTransport + bpjsEarn + yanEarn;
      const defaultTax = p.status === 'TKS' ? 0 : calculatePPH21(gross);
      const tax = taxOverrides[p.id] !== undefined ? taxOverrides[p.id] : defaultTax;
      const statusKey = `${globalYear}-${globalMonth}-${p.id}`;
      const status = payrollStatuses[statusKey] || 'Belum Lunas';

      return {
        id: p.id, nama: p.nama, status, roles: p.roles, employmentStatus: p.status, isDoctor: p.isDoctor,
        isMgmt, tksBase, docTransport, bpjsEarn, yanEarn, gross, tax, netto: gross - tax,
        isTaxOverridden: taxOverrides[p.id] !== undefined, logsAttached, poolBreakdown, staffCounts, statusKey
      };
    }).filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));
  }, [logs, doctors, staff, bpjsSettingsHistory, globalMonth, globalYear, search, taxOverrides, payrollStatuses]);

  const grandTotals = useMemo(() => {
    return consolidatedData.reduce((acc, p) => ({
      tks: acc.tks + p.tksBase, transport: acc.transport + p.docTransport,
      jasa: acc.jasa + p.bpjsEarn + p.yanEarn, tax: acc.tax + p.tax, netto: acc.netto + p.netto
    }), { tks: 0, transport: 0, jasa: 0, tax: 0, netto: 0 });
  }, [consolidatedData]);

  const handleOpenSlip = (person: any) => {
    setActiveSlipPerson(person);
    setExtraAllowances([]);
    setExtraDeductions([]);
    setSlipNote('');
    setShowSlipModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalExtraAllowance = extraAllowances.reduce((s, i) => s + i.nominal, 0);
  const totalExtraDeduction = extraDeductions.reduce((s, i) => s + i.nominal, 0);
  const slipFinalNetto = activeSlipPerson ? (activeSlipPerson.netto + totalExtraAllowance - totalExtraDeduction) : 0;

  const toggleSelect = (id: string) => {
    setSelectedPersonnel(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateSingleStatus = (statusKey: string, status: 'Lunas' | 'Belum Lunas') => {
    onPayrollStatusesChange({ ...payrollStatuses, [statusKey]: status });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Audit Belanja */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200 flex flex-wrap justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-lg"><LayoutList size={32} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Audit Jasa & Daftar Gaji</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validasi Pencairan Jasa Periode {globalMonth}/{globalYear}</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Personel..." className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-50 w-64 shadow-sm" />
           </div>
           <button className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-blue-600 transition-all active:scale-95"><Download size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
         <SummaryMini label="Honor TKS Flat" value={grandTotals.tks} icon={<Wallet className="text-slate-400" />} />
         <SummaryMini label="Transport Dokter" value={grandTotals.transport} icon={<Coins className="text-blue-500" />} />
         <SummaryMini label="Total Jasa Cair" value={grandTotals.jasa} icon={<ArrowRightLeft className="text-emerald-500" />} />
         <SummaryMini label="Netto Keseluruhan" value={grandTotals.netto} icon={<Landmark className="text-amber-500" />} />
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden no-print">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
               <thead className="bg-[#0f172a] text-white font-black uppercase tracking-widest">
                  <tr>
                     <th className="px-6 py-5 w-16 text-center">X</th>
                     <th className="px-6 py-5">Nama Personel</th>
                     <th className="px-6 py-5 text-right">Bruto</th>
                     <th className="px-6 py-5 text-right w-40">Pajak (PPh 21)</th>
                     <th className="px-6 py-5 text-right bg-emerald-900/30">Total Netto</th>
                     <th className="px-6 py-5 text-center">Status</th>
                     <th className="px-6 py-5 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {consolidatedData.map(p => (
                     <React.Fragment key={p.id}>
                        <tr className={`hover:bg-slate-50 transition-colors group ${p.status === 'Lunas' ? 'bg-emerald-50/20' : ''}`}>
                           <td className="px-6 py-4 text-center">
                              <input type="checkbox" checked={selectedPersonnel.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-5 h-5 rounded border-slate-200 text-emerald-600" />
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="font-black text-slate-900 uppercase tracking-tight">{p.nama}</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase">{p.employmentStatus} | {p.roles.join(', ')}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-slate-400">{formatIDR(p.gross).replace('Rp', '')}</td>
                           <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">{formatIDR(p.tax).replace('Rp', '')}</td>
                           <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 bg-emerald-50/40 text-[13px]">{formatIDR(p.netto).replace('Rp', '')}</td>
                           <td className="px-6 py-4 text-center">
                              <button onClick={() => updateSingleStatus(p.statusKey, p.status === 'Lunas' ? 'Belum Lunas' : 'Lunas')} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${p.status === 'Lunas' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`}>{p.status}</button>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className={`p-2 rounded-xl transition-all ${expandedId === p.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-300 hover:text-slate-900'}`} title="Detail Perhitungan"><FileText size={16} /></button>
                                <button onClick={() => handleOpenSlip(p)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="Cetak Slip Gaji"><Receipt size={16} /></button>
                              </div>
                           </td>
                        </tr>
                        {expandedId === p.id && (
                          <tr className="bg-slate-50/50">
                             <td colSpan={7} className="px-12 py-8 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                   <div className="space-y-4">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Info size={14} className="text-blue-500" /> Detail Perhitungan Bruto</h4>
                                      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                                         <DerivationRow label="Honor/Transport Dasar" value={p.isDoctor ? p.docTransport : p.tksBase} desc={p.isDoctor ? 'Biaya Transport Spesialis' : 'Gaji Pokok TKS'} />
                                         {!p.isDoctor ? (
                                            <div className="space-y-2 border-t pt-4">
                                               {p.roles.includes('Perawat OK') && <DerivationRow label="Pool Perawat OK" value={p.poolBreakdown.ok} desc={`Total Pool: ${formatIDR(p.poolBreakdown.ok)}`} isSub />}
                                               {p.roles.includes('Perawat ICU') && <DerivationRow label="Pool Perawat ICU" value={p.poolBreakdown.icu} desc={`Total Pool: ${formatIDR(p.poolBreakdown.icu)}`} isSub />}
                                               {p.isMgmt && <DerivationRow label="Pool Manajemen" value={p.poolBreakdown.mgmt} desc={`Total Pool: ${formatIDR(p.poolBreakdown.mgmt)}`} isSub />}
                                            </div>
                                         ) : (
                                            <div className="space-y-2 border-t pt-4">
                                               <DerivationRow label="Total Jasa BPJS" value={p.bpjsEarn} desc={`${p.logsAttached.filter(l => !l.category.includes('YANMASUM')).length} Berkas`} isSub />
                                               <DerivationRow label="Total Jasa Yanmasum" value={p.yanEarn} desc={`${p.logsAttached.filter(l => l.category.includes('YANMASUM')).length} Berkas`} isSub />
                                            </div>
                                         )}
                                      </div>
                                   </div>
                                   {p.isDoctor && p.logsAttached.length > 0 && (
                                     <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Users size={14} className="text-emerald-500" /> Daftar Berkas Pasien & Diagnosa</h4>
                                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden max-h-[300px] overflow-y-auto">
                                           <table className="w-full text-left text-[9px]">
                                              <thead className="bg-slate-900 text-white uppercase font-black"><tr><th className="px-4 py-3">Nama Pasien</th><th className="px-4 py-3">Diagnosa</th><th className="px-4 py-3 text-right">Jasa</th></tr></thead>
                                              <tbody className="divide-y divide-slate-100">
                                                 {p.logsAttached.map((log, li) => (
                                                   <tr key={li} className="hover:bg-slate-50">
                                                      <td className="px-4 py-3 font-bold uppercase text-slate-600">{log.patient}</td>
                                                      <td className="px-4 py-3 text-slate-400 italic">{log.diagnosa}</td>
                                                      <td className="px-4 py-3 text-right font-mono font-black">{formatIDR(log.fee).replace('Rp','')}</td>
                                                   </tr>
                                                 ))}
                                              </tbody>
                                           </table>
                                        </div>
                                     </div>
                                   )}
                                </div>
                             </td>
                          </tr>
                        )}
                     </React.Fragment>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Slip Gaji Editable & Print */}
      {showSlipModal && activeSlipPerson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Receipt className="text-blue-500" /> Editor Slip Gaji Digital</h3>
               <button onClick={() => setShowSlipModal(false)} className="p-3 bg-white rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* SISI KIRI: PREVIEW SLIP (PRINT AREA) */}
               <div id="slip-print-area" className="bg-white border-2 border-slate-100 p-8 rounded-3xl shadow-inner print:shadow-none print:border-none print:p-0 print:m-0">
                  <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                     <p className="text-[12px] font-black uppercase tracking-tight">RUMAH SAKIT TK.IV 02.07.03 BATIN TIKAL</p>
                     <p className="text-[10px] font-bold uppercase text-slate-500">Jl. Batin Tikal No. 10, Bangka Belitung</p>
                     <p className="text-[14px] font-black uppercase mt-4 underline decoration-2">SLIP GAJI JASA PELAYANAN</p>
                     <p className="text-[10px] font-bold">PERIODE: {globalMonth}/{globalYear}</p>
                  </div>

                  <div className="grid grid-cols-2 text-[10px] mb-6 gap-y-1">
                     <span className="font-bold text-slate-400 uppercase">Nama:</span><span className="font-black text-right uppercase">{activeSlipPerson.nama}</span>
                     <span className="font-bold text-slate-400 uppercase">Status:</span><span className="font-black text-right uppercase">{activeSlipPerson.employmentStatus}</span>
                     <span className="font-bold text-slate-400 uppercase">Role:</span><span className="font-black text-right uppercase">{activeSlipPerson.roles.join(', ')}</span>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Penghasilan (Bruto):</p>
                     <SlipLine label="Honor/Transport Dasar" val={activeSlipPerson.isDoctor ? activeSlipPerson.docTransport : activeSlipPerson.tksBase} />
                     <SlipLine label="Jasa Pelayanan (BPJS/Yanmas)" val={activeSlipPerson.bpjsEarn + activeSlipPerson.yanEarn} />
                     {extraAllowances.map((ex, i) => <SlipLine key={i} label={ex.label} val={ex.nominal} isExtra />)}
                     
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-4">Potongan:</p>
                     <SlipLine label="PPh 21 (Pajak)" val={activeSlipPerson.tax} isDeduction />
                     {extraDeductions.map((ex, i) => <SlipLine key={i} label={ex.label} val={ex.nominal} isDeduction />)}
                  </div>

                  <div className="mt-8 pt-4 border-t-2 border-slate-900 border-dashed flex justify-between items-center">
                     <p className="text-[11px] font-black uppercase">Total Diterima (Netto):</p>
                     <p className="text-lg font-black font-mono">{formatIDR(slipFinalNetto)}</p>
                  </div>

                  {slipNote && <div className="mt-6 p-3 bg-slate-50 border-l-4 border-blue-500 text-[9px] italic text-slate-600">{slipNote}</div>}

                  {activeSlipPerson.isDoctor && activeSlipPerson.logsAttached.length > 0 && (
                    <div className="mt-8 border-t pt-4 print:page-break-before-auto">
                       <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Appendix: Daftar Pasien Terverifikasi</p>
                       <div className="space-y-1">
                          {activeSlipPerson.logsAttached.map((log: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[7px] border-b border-slate-50 pb-1">
                               <span>{idx+1}. {log.patient} ({log.diagnosa})</span>
                               <span className="font-mono">{formatIDR(log.fee).replace('Rp', '')}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="mt-12 flex justify-between px-4">
                     <div className="text-center">
                        <p className="text-[8px] mb-12">Penerima,</p>
                        <div className="w-24 border-b border-black mx-auto"></div>
                        <p className="text-[8px] font-black uppercase mt-1">{activeSlipPerson.nama}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] mb-12">Bendahara Jasa,</p>
                        <div className="w-24 border-b border-black mx-auto"></div>
                        <p className="text-[8px] font-black uppercase mt-1">SIKESUMA SYSTEM</p>
                     </div>
                  </div>
               </div>

               {/* SISI KANAN: EDITOR TUNJANGAN/POTONGAN */}
               <div className="space-y-8 bg-slate-50 p-8 rounded-3xl border border-slate-200">
                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tunjangan Tambahan</h4>
                        <button onClick={() => setExtraAllowances([...extraAllowances, {label: 'Bonus', nominal: 0}])} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-all"><Plus size={14}/></button>
                     </div>
                     <div className="space-y-2">
                        {extraAllowances.map((ex, i) => (
                          <div key={i} className="flex gap-2">
                             <input value={ex.label} onChange={e => {const n=[...extraAllowances]; n[i].label=e.target.value; setExtraAllowances(n);}} className="flex-1 px-3 py-2 text-[10px] font-bold rounded-lg border border-slate-200 outline-none" placeholder="Label Tunjangan" />
                             <input type="number" value={ex.nominal} onChange={e => {const n=[...extraAllowances]; n[i].nominal=Number(e.target.value); setExtraAllowances(n);}} className="w-28 px-3 py-2 text-[10px] font-mono font-black rounded-lg border border-slate-200 text-right outline-none" />
                             <button onClick={() => setExtraAllowances(extraAllowances.filter((_, idx)=>idx!==i))} className="text-rose-400 p-1 hover:bg-rose-50 rounded"><Trash2 size={14}/></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600">Potongan Tambahan</h4>
                        <button onClick={() => setExtraDeductions([...extraDeductions, {label: 'Iuran', nominal: 0}])} className="p-1.5 bg-rose-500 text-white rounded-lg hover:scale-110 transition-all"><Plus size={14}/></button>
                     </div>
                     <div className="space-y-2">
                        {extraDeductions.map((ex, i) => (
                          <div key={i} className="flex gap-2">
                             <input value={ex.label} onChange={e => {const n=[...extraDeductions]; n[i].label=e.target.value; setExtraDeductions(n);}} className="flex-1 px-3 py-2 text-[10px] font-bold rounded-lg border border-slate-200 outline-none" placeholder="Label Potongan" />
                             <input type="number" value={ex.nominal} onChange={e => {const n=[...extraDeductions]; n[i].nominal=Number(e.target.value); setExtraDeductions(n);}} className="w-28 px-3 py-2 text-[10px] font-mono font-black rounded-lg border border-slate-200 text-right outline-none text-rose-600" />
                             <button onClick={() => setExtraDeductions(extraDeductions.filter((_, idx)=>idx!==i))} className="text-rose-400 p-1 hover:bg-rose-50 rounded"><Trash2 size={14}/></button>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Catatan Khusus Slip</h4>
                     <textarea value={slipNote} onChange={e => setSlipNote(e.target.value)} rows={3} className="w-full px-4 py-3 text-[10px] font-bold rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Masukkan keterangan tambahan jika ada..." />
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-6 text-white text-center shadow-lg">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Final Netto Setelah Penyesuaian</p>
                     <h4 className="text-2xl font-black font-mono text-emerald-400">{formatIDR(slipFinalNetto)}</h4>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t bg-white flex justify-end gap-4">
               <button onClick={() => setShowSlipModal(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
               <button onClick={handlePrint} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3"><Printer size={18} /> Cetak Slip Gaji</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #slip-print-area, #slip-print-area * { visibility: visible; }
          #slip-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

const SlipLine = ({ label, val, isDeduction, isExtra }: any) => (
  <div className="flex justify-between items-center py-0.5">
     <span className={`uppercase ${isExtra ? 'text-emerald-600' : (isDeduction ? 'text-rose-500' : 'text-slate-700')}`}>{label}</span>
     <span className={`font-mono ${isDeduction ? 'text-rose-600' : 'text-slate-900'}`}>{isDeduction ? '-' : ''}{formatIDR(val).replace('Rp', '')}</span>
  </div>
);

const DerivationRow = ({ label, value, desc, isSub, isNeg }: any) => (
  <div className={`flex justify-between items-center ${isSub ? 'pl-4 border-l-2 border-slate-100' : ''}`}>
     <div>
        <p className={`text-[10px] font-black uppercase ${isNeg ? 'text-rose-500' : 'text-slate-600'}`}>{label}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{desc}</p>
     </div>
     <span className={`font-mono font-black ${isNeg ? 'text-rose-600' : 'text-slate-900'} ${isSub ? 'text-xs' : 'text-sm'}`}>
        {isNeg ? '-' : ''}{formatIDR(value).replace('Rp', '')}
     </span>
  </div>
);

const SummaryMini = ({ label, value, icon }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 tracking-tighter">{formatIDR(value)}</p>
    </div>
  </div>
);

export default PayrollSummary;
