
import React, { useState, useMemo, useEffect } from 'react';
import { TabType, SubTab, Bill, BillingItem, BillCategory, PatientClaim, BPJSCalcSettings, Doctor, Employee, MinimizedForm, ProcurementFile, PaguSection } from '../types';
import { formatIDR, calculatePPH21 } from './Formatters';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { canTransition, applyTransition } from '../utils/billStateMachine';
import { 
  Plus, Trash2, Edit3, X, FileText, Landmark, ShoppingBag, Box,
  Calculator, Coins, ReceiptText, Paperclip, CheckCircle, Wallet, Tags, UserCog, Users, Wrench,
  Minimize2, Upload, File, Eye, Download, AlertCircle
} from 'lucide-react';
import LocalFilterBar, { LocalFilterState } from './LocalFilterBar';
import KodeAutocomplete, { type KodeSuggestion } from './KodeAutocomplete';

interface OperationalBillingProps {
  activeTabType: TabType;
  subTab: SubTab;
  bills: Bill[];
  onBillsChange: (newBills: Bill[]) => void;
  globalYear: number | 'ALL';
  logs: PatientClaim[];
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  doctors: Doctor[];
  staff: Employee[];
  jasaAccountMap: { tks: string; nakes: string; pengelola: string };
  onJasaAccountMapChange: (newMap: { tks: string; nakes: string; pengelola: string }) => void;
  onMinimizeForm: (form: MinimizedForm) => void;
  reopenedForm: MinimizedForm | null;
  onReopenedFormHandled: () => void;
  /** [Sprint B.6] Pagu sections untuk autocomplete akun di Bill items.
   *  Bill.items[].akun harus match PaguRow.kode (FK konseptual) — autocomplete
   *  mencegah typo/free-text yang jadi orphan posting di realisasiBucket. */
  paguSections: PaguSection[];
}

const OperationalBilling: React.FC<OperationalBillingProps> = ({ 
  activeTabType, subTab, bills, onBillsChange, globalYear, logs, bpjsSettingsHistory, doctors, staff,
  jasaAccountMap, onJasaAccountMapChange, onMinimizeForm, reopenedForm, onReopenedFormHandled,
  paguSections
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [activeTabModal, setActiveTabModal] = useState<'DATA' | 'BERKAS'>('DATA');
  const [localFilter, setLocalFilter] = useState<LocalFilterState>({
    mode: 'MONTHLY',
    day: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: globalYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLocalFilter(prev => ({ ...prev, year: globalYear }));
  }, [globalYear]);

  useEffect(() => {
    if (reopenedForm && reopenedForm.type === 'BILL') {
      setFormData(reopenedForm.data);
      setEditingBillId(reopenedForm.data.id || 'new-minimized');
      setShowModal(true);
      onReopenedFormHandled();
    }
  }, [reopenedForm]);
  
  const [formData, setFormData] = useState<Partial<Bill>>({
    namaTagihan: '', noFaktur: '', kegiatan: '', noSprin: '', bank: 'BNI', noRekening: '', npwp: '',
    namaRekanan: '', tanggal: new Date().toISOString().split('T')[0], items: [], files: [],
    // [Sprint C.5] Default 'Draft' (sebelumnya 'Verifikasi' yang skip Draft → audit gap).
    // User harus klik 'Verifikasi' eksplisit setelah review item & nominal.
    status: 'Draft',
  });

  // [Sprint C.4 + C.5] Validation result state untuk modal "blocked save"
  const [saveBlockReason, setSaveBlockReason] = useState<{ message: string; invalidItems?: { id: string; akun: string; namaBarang: string }[] } | null>(null);

  const isGlobalRekap = subTab === SubTab.REKAP_AUDIT;

  // [Sprint B.6] Build paguOptions untuk autocomplete akun di Bill items.
  // Sumber: semua leaf nodes dari paguSections (yang sudah di-filter per tahun di App.tsx).
  // Bill.items[].akun harus match salah satu PaguRow.kode → mencegah orphan posting.
  const paguOptions = useMemo<KodeSuggestion[]>(() => {
    const opts: KodeSuggestion[] = [];
    paguSections.forEach(sec => {
      sec.rows.forEach((row, idx) => {
        const cleanCode = row.kode.trim();
        if (!cleanCode) return;
        // Only include leaf nodes (no children) — parent rows are aggregations
        const nextRow = sec.rows[idx + 1];
        const hasChildren = nextRow && nextRow.level > row.level;
        if (hasChildren) return;
        opts.push({ kode: cleanCode, uraian: row.description, meta: sec.title });
      });
    });
    return opts;
  }, [paguSections]);

  const currentFilteredBills = useMemo(() => {
    let filtered = bills;
    filtered = filtered.filter(b => {
      const bDate = new Date(b.tanggal);
      if (localFilter.mode === 'DAILY') return b.tanggal === localFilter.day;
      if (localFilter.mode === 'MONTHLY') return bDate.getMonth() + 1 === localFilter.month && (localFilter.year === 'ALL' || bDate.getFullYear() === localFilter.year);
      if (localFilter.year !== 'ALL' && bDate.getFullYear() !== localFilter.year) return false;
      if (localFilter.mode === 'YEARLY') return true; 
      if (localFilter.mode === 'RANGE') return bDate >= new Date(localFilter.startDate) && bDate <= new Date(localFilter.endDate);
      return true;
    });

    if (!isGlobalRekap) {
      if (subTab === SubTab.BELANJA_OPERASIONAL) filtered = filtered.filter(b => b.category === 'OPERASIONAL');
      else if (subTab === SubTab.BELANJA_MODAL) filtered = filtered.filter(b => b.category === 'MODAL');
      else if (subTab === SubTab.BELANJA_PEMELIHARAAN) filtered = filtered.filter(b => b.category === 'PEMELIHARAAN');
    }
    return filtered;
  }, [bills, subTab, isGlobalRekap, localFilter]);

  const serviceAuditData = useMemo(() => {
    const periodLogs = logs.filter(l => {
      const logDate = new Date(l.tanggalInput);
      if (localFilter.mode === 'DAILY') return l.tanggalInput === localFilter.day;
      if (localFilter.mode === 'MONTHLY') return l.bulan === localFilter.month && (localFilter.year === 'ALL' || l.tahun === localFilter.year);
      if (localFilter.mode === 'YEARLY') return (localFilter.year === 'ALL' || l.tahun === localFilter.year);
      if (localFilter.mode === 'RANGE') return logDate >= new Date(localFilter.startDate) && logDate <= new Date(localFilter.endDate);
      return true;
    });

    const audit = {
      tks: { gross: 0, tax: 0, net: 0 },
      nakes: { gross: 0, tax: 0, net: 0 },
      pengelola: { gross: 0, tax: 0, net: 0 }
    };

    staff.filter(s => s.status === 'TKS').forEach(s => {
       const gross = (s.baseHonor || 0);
       audit.tks.gross += gross;
       audit.tks.tax += calculatePPH21(gross);
    });

    let transportGross = doctors.reduce((sum, d) => sum + (d.baseTransport || 0), 0);
    periodLogs.forEach(l => {
      const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
      const f = calculatePatientFees(l, s);
      const nakesVal = f.spesialis + f.anestesi + f.gp + f.konsul + f.paramOK + f.paramICU + f.paramGen + f.penataAnestesi;
      audit.nakes.gross += nakesVal;
      audit.nakes.tax += calculatePPH21(nakesVal);
      const pengelolaVal = f.pengelola + f.manajemen + f.casemix;
      audit.pengelola.gross += pengelolaVal;
      audit.pengelola.tax += calculatePPH21(pengelolaVal);
    });

    audit.nakes.gross += transportGross;
    audit.nakes.tax += calculatePPH21(transportGross);

    audit.tks.net = audit.tks.gross - audit.tks.tax;
    audit.nakes.net = audit.nakes.gross - audit.nakes.tax;
    audit.pengelola.net = audit.pengelola.gross - audit.pengelola.tax;
    return audit;
  }, [logs, bpjsSettingsHistory, doctors, staff, localFilter]);

  const stats = useMemo(() => {
    const lunas = currentFilteredBills.filter(b => b.status === 'Lunas');
    return {
      ops: lunas.filter(b => b.category === 'OPERASIONAL').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0),
      modal: lunas.filter(b => b.category === 'MODAL').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0),
      pemeliharaan: lunas.filter(b => b.category === 'PEMELIHARAAN').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0),
      jasa: serviceAuditData.tks.net + serviceAuditData.nakes.net + serviceAuditData.pengelola.net
    };
  }, [currentFilteredBills, serviceAuditData]);

  const accountSummary = useMemo(() => {
    const summary: Record<string, { desc: string; bruto: number; pajak: number; netto: number }> = {};
    currentFilteredBills.filter(b => b.status === 'Lunas').forEach(b => {
      b.items.forEach(it => {
        const key = it.akun.trim() || 'TANPA_AKUN';
        if (!summary[key]) summary[key] = { desc: it.namaBarang, bruto: 0, pajak: 0, netto: 0 };
        const bruto = it.volume * it.hargaSatuan;
        const tax = it.ppn + it.pph21 + it.pph22;
        summary[key].bruto += bruto;
        summary[key].pajak += tax;
        summary[key].netto += (bruto - tax);
      });
    });
    return summary;
  }, [currentFilteredBills]);

  const handleSave = () => {
    let category: BillCategory = 'OPERASIONAL';
    if (subTab === SubTab.BELANJA_MODAL) category = 'MODAL';
    if (subTab === SubTab.BELANJA_PEMELIHARAAN) category = 'PEMELIHARAAN';

    const targetStatus = formData.status || 'Draft';
    const draftBill: Bill = {
      ...formData,
      id: editingBillId || `bill-${Date.now()}`,
      category,
      // Force Draft for validation purposes — actual transition done after via state machine
      status: 'Draft',
      statusLog: formData.statusLog || [],
    } as Bill;

    // [Sprint C.4 + C.5] Soft block: kalau user mau save dengan status non-Draft,
    // jalankan canTransition() validator. Kalau gagal, tampilkan modal alasan.
    let finalBill: Bill = draftBill;
    if (targetStatus !== 'Draft') {
      const transResult = canTransition(draftBill, targetStatus, paguSections);
      if (!transResult.ok) {
        setSaveBlockReason({
          message: transResult.reason || 'Validation failed',
          invalidItems: transResult.invalidItems,
        });
        return; // tidak save — show modal
      }
      finalBill = applyTransition(draftBill, targetStatus, { reason: 'Save action via form' });
    } else {
      // Kalau status Draft, log entry first-creation untuk audit trail
      if (!finalBill.statusLog || finalBill.statusLog.length === 0) {
        finalBill = {
          ...finalBill,
          statusLog: [{ from: null, to: 'Draft', at: new Date().toISOString(), reason: 'Bill created' }],
        };
      }
    }

    if (editingBillId && !editingBillId.includes('new')) onBillsChange(bills.map(b => b.id === editingBillId ? finalBill : b));
    else onBillsChange([...bills, finalBill]);
    setShowModal(false);
    setSaveBlockReason(null);
  };

  const handleMinimize = () => {
    const form: MinimizedForm = {
      id: editingBillId || `bill-draft-${Date.now()}`,
      type: 'BILL',
      data: { ...formData, id: editingBillId || `bill-draft-${Date.now()}` },
      title: formData.namaTagihan || 'Tagihan Tanpa Nama'
    };
    onMinimizeForm(form);
    setShowModal(false);
  };

  const addItem = () => {
    const newItem: BillingItem = { id: `item-${Date.now()}`, akun: '', namaBarang: '', volume: 1, satuan: 'Unit', hargaSatuan: 0, diskon: 0, ppn: 0, pph21: 0, pph22: 0 };
    setFormData({ ...formData, items: [...(formData.items || []), newItem] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: ProcurementFile[] = (Array.from(e.target.files) as File[]).map(f => ({
        id: `file-${Date.now()}-${Math.random()}`,
        namaFile: f.name,
        tipe: f.type,
        size: (f.size / 1024).toFixed(1) + ' KB',
        url: URL.createObjectURL(f) // Untuk preview dan download
      }));
      setFormData({ ...formData, files: [...(formData.files || []), ...newFiles] });
    }
  };

  if (isGlobalRekap) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
         <LocalFilterBar initialYear={globalYear} onFilterChange={setLocalFilter} />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryStat label="Belanja Jasa (Netto)" val={stats.jasa} icon={<Users size={18}/>} color="text-emerald-500" bg="bg-emerald-50" />
            <SummaryStat label="Belanja Ops (Lunas)" val={stats.ops} icon={<ShoppingBag size={18}/>} color="text-amber-500" bg="bg-amber-50" />
            <SummaryStat label="Belanja Modal (Lunas)" val={stats.modal} icon={<Box size={18}/>} color="text-blue-500" bg="bg-blue-50" />
            <SummaryStat label="Belanja Pemeliharaan" val={stats.pemeliharaan} icon={<Wrench size={18}/>} color="text-rose-500" bg="bg-rose-50" />
         </div>
         <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Rekapitulasi Realisasi Berbasis Sub-Akun</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Laporan Mendetail Per Alamat Mata Anggaran</p>
               </div>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full border border-blue-100">Audit Lokalnya Aktif</span>
            </div>
            <table className="w-full text-left text-[11px]">
               <thead className="bg-[#0f172a] text-white font-black uppercase tracking-widest">
                  <tr>
                     <th className="px-8 py-5 w-48">Kode / Sub-Akun</th>
                     <th className="px-8 py-5">Uraian Realisasi Anggaran</th>
                     <th className="px-8 py-5 text-right">Bruto</th>
                     <th className="px-8 py-5 text-right text-rose-300">Pajak</th>
                     <th className="px-8 py-5 text-right bg-emerald-900/40">Netto Cair</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 font-bold">
                  <tr className="bg-emerald-50/20">
                     <td className="px-8 py-4 font-mono font-black text-emerald-600">{jasaAccountMap.tks}</td>
                     <td className="px-8 py-4 uppercase text-emerald-800">Honor Tenaga Lepas (TKS)</td>
                     <td className="px-8 py-4 text-right font-mono">{formatIDR(serviceAuditData.tks.gross).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono text-rose-400">{formatIDR(serviceAuditData.tks.tax).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono font-black text-emerald-700">{formatIDR(serviceAuditData.tks.net).replace('Rp','')}</td>
                  </tr>
                  <tr className="bg-emerald-50/20">
                     <td className="px-8 py-4 font-mono font-black text-emerald-600">{jasaAccountMap.nakes}</td>
                     <td className="px-8 py-4 uppercase text-emerald-800">Honor Tenaga Kesehatan (Medis)</td>
                     <td className="px-8 py-4 text-right font-mono">{formatIDR(serviceAuditData.nakes.gross).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono text-rose-400">{formatIDR(serviceAuditData.nakes.tax).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono font-black text-emerald-700">{formatIDR(serviceAuditData.nakes.net).replace('Rp','')}</td>
                  </tr>
                  <tr className="bg-emerald-50/20">
                     <td className="px-8 py-4 font-mono font-black text-emerald-600">{jasaAccountMap.pengelola}</td>
                     <td className="px-8 py-4 uppercase text-emerald-800">Honor Tim Pengelola & Casemix</td>
                     <td className="px-8 py-4 text-right font-mono">{formatIDR(serviceAuditData.pengelola.gross).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono text-rose-400">{formatIDR(serviceAuditData.pengelola.tax).replace('Rp','')}</td>
                     <td className="px-8 py-4 text-right font-mono font-black text-emerald-700">{formatIDR(serviceAuditData.pengelola.net).replace('Rp','')}</td>
                  </tr>
                  {Object.entries(accountSummary).map(([code, data]: [string, any]) => (
                     <tr key={code} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 font-mono font-black text-slate-400">{code}</td>
                        <td className="px-8 py-4 uppercase text-slate-600 truncate max-w-xs">{data.desc}</td>
                        <td className="px-8 py-4 text-right font-mono">{formatIDR(data.bruto).replace('Rp','')}</td>
                        <td className="px-8 py-4 text-right font-mono text-rose-400">{formatIDR(data.pajak).replace('Rp','')}</td>
                        <td className="px-8 py-4 text-right font-mono font-black text-slate-900">{formatIDR(data.netto).replace('Rp','')}</td>
                     </tr>
                  ))}
               </tbody>
               <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                     <td colSpan={4} className="px-8 py-6 text-right uppercase tracking-widest opacity-60">Total Pengeluaran Netto Ter-Audit:</td>
                     <td className="px-8 py-6 text-right font-mono text-2xl text-emerald-400">{formatIDR(stats.jasa + stats.ops + stats.modal + stats.pemeliharaan)}</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <LocalFilterBar initialYear={globalYear} onFilterChange={setLocalFilter} />
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-200 flex flex-wrap justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-lg"><ReceiptText size={32} /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Database Audit {subTab.replace('BELANJA_', '').replace(/_/g, ' ')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validasi Kelengkapan Berkas & Kode Akun</p>
          </div>
        </div>
        <button onClick={() => { setEditingBillId(null); setFormData({ namaTagihan: '', items: [], files: [], bank: 'BNI', tanggal: new Date().toISOString().split('T')[0], status: 'Draft' }); setShowModal(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3 active:scale-95">
          <Plus size={20} /> Input Tagihan Baru
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-[#0f172a] text-white font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 w-40">Tanggal</th>
                <th className="px-6 py-5">Uraian / Faktur</th>
                <th className="px-6 py-5 w-32 text-center">Akun</th>
                <th className="px-6 py-5 text-right">Netto Cair</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentFilteredBills.map(b => {
                const bBruto = b.items.reduce((s, i) => s + (i.volume * i.hargaSatuan), 0);
                const bTax = b.items.reduce((s, i) => s + (i.ppn + i.pph21 + i.pph22), 0);
                const firstAccount = b.items[0]?.akun || '-';
                return (
                  <tr key={b.id} className="hover:bg-blue-50 transition-colors group font-bold">
                    <td className="px-6 py-5 font-mono text-slate-400">{b.tanggal}</td>
                    <td className="px-6 py-5 font-black text-slate-900 uppercase">{b.namaTagihan}<p className="text-[8px] font-bold text-blue-600">Faktur: {b.noFaktur}</p></td>
                    <td className="px-6 py-5 text-center"><span className="px-2 py-1 bg-slate-100 rounded-lg font-mono text-slate-500">{firstAccount}</span></td>
                    <td className="px-6 py-5 text-right font-mono font-black text-slate-900">{formatIDR(bBruto - bTax).replace('Rp', '')}</td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${b.status === 'Lunas' ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'}`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex justify-center gap-2">
                          <button onClick={() => { setFormData(b); setEditingBillId(b.id); setShowModal(true); }} className="p-2.5 bg-slate-50 text-slate-300 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                          <button onClick={() => onBillsChange(bills.filter(x => x.id !== b.id))} className="p-2.5 bg-slate-50 text-slate-300 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl p-10 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-8 flex-shrink-0">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Validasi Audit Tagihan Belanja</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Kategori: {subTab.replace('BELANJA_', '')}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={handleMinimize} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all" title="Minimize Form"><Minimize2 size={24}/></button>
                    <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24}/></button>
                 </div>
              </div>

              <div className="flex gap-6 border-b border-slate-100 mb-8 flex-shrink-0">
                 <button onClick={() => setActiveTabModal('DATA')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTabModal === 'DATA' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>1. Data Administratif & Akun</button>
                 <button onClick={() => setActiveTabModal('BERKAS')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTabModal === 'BERKAS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>2. Berkas Pendukung (Scan Dokumen)</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                 {activeTabModal === 'DATA' ? (
                    <div className="space-y-10 animate-in fade-in duration-300">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Identitas Tagihan</p>
                             <InputGroup label="Uraian Tagihan" value={formData.namaTagihan} onChange={v => setFormData({...formData, namaTagihan: v})} />
                             <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Nomor Faktur" value={formData.noFaktur} onChange={v => setFormData({...formData, noFaktur: v})} />
                                <InputGroup label="Nomor SPRIN" value={formData.noSprin} onChange={v => setFormData({...formData, noSprin: v})} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Tanggal Berkas" type="date" value={formData.tanggal} onChange={v => setFormData({...formData, tanggal: v})} />
                                <InputGroup label="Nama Rekanan / Toko" value={formData.namaRekanan} onChange={v => setFormData({...formData, namaRekanan: v})} />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Status & Pembayaran</p>
                             <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Verifikasi</label>
                                <div className="flex gap-2">
                                   {['Draft', 'Verifikasi', 'Lunas'].map(s => (
                                      <button key={s} onClick={() => setFormData({...formData, status: s as any})} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{s}</button>
                                   ))}
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Bank" value={formData.bank} onChange={v => setFormData({...formData, bank: v})} />
                                <InputGroup label="No. Rekening" value={formData.noRekening} onChange={v => setFormData({...formData, noRekening: v})} />
                             </div>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200">
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Tags size={18} className="text-blue-600"/> Item Barang / Layanan & Kode Akun</h4>
                             <button onClick={addItem} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">+ Tambah Item</button>
                          </div>
                          <div className="overflow-x-auto bg-white rounded-3xl shadow-inner border border-slate-200">
                             <table className="w-full text-left text-[10px]">
                                <thead className="bg-[#1e293b] text-white uppercase font-black tracking-widest text-[8px]">
                                   <tr>
                                      <th className="px-4 py-4 w-32">Kode Akun</th>
                                      <th className="px-4 py-4">Nama Barang / Uraian</th>
                                      <th className="px-4 py-4 w-20 text-center">Vol</th>
                                      <th className="px-4 py-4 w-40 text-right">Harga Satuan</th>
                                      <th className="px-4 py-4 w-32 text-right">Pajak (Total)</th>
                                      <th className="px-2 py-4 w-12 text-center">X</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                   {(formData.items || []).map((it, idx) => (
                                      <tr key={it.id}>
                                         <td className="px-4 py-3">
                                           <KodeAutocomplete
                                             mode="pagu"
                                             paguOptions={paguOptions}
                                             value={it.akun}
                                             onChange={v => { const n=[...(formData.items || [])]; n[idx].akun=v; setFormData({...formData, items: n}); }}
                                             onSelect={(sug) => {
                                               // [Sprint B.6] Auto-fill namaBarang dari Pagu description saat user pick suggestion.
                                               // Bill.items[].akun = FK konseptual ke PaguRow.kode → mencegah orphan posting di realisasiBucket.
                                               const n=[...(formData.items || [])];
                                               n[idx].akun = sug.kode;
                                               // Hanya auto-fill namaBarang kalau user belum mengisi (jangan timpa input manual)
                                               if (!n[idx].namaBarang || n[idx].namaBarang.trim() === '') {
                                                 n[idx].namaBarang = sug.uraian;
                                               }
                                               setFormData({...formData, items: n});
                                             }}
                                             placeholder="Pilih dari Pagu..."
                                             showValidation={true}
                                           />
                                         </td>
                                         <td className="px-4 py-3"><input value={it.namaBarang} onChange={e => { const n=[...(formData.items || [])]; n[idx].namaBarang=e.target.value; setFormData({...formData, items: n}); }} className="w-full border-none font-bold outline-none" placeholder="Uraian barang..." /></td>
                                         <td className="px-4 py-3"><input type="number" value={it.volume} onChange={e => { const n=[...(formData.items || [])]; n[idx].volume=Number(e.target.value); setFormData({...formData, items: n}); }} className="w-full border-none font-black text-center outline-none" /></td>
                                         <td className="px-4 py-3"><input type="number" value={it.hargaSatuan} onChange={e => { const n=[...(formData.items || [])]; n[idx].hargaSatuan=Number(e.target.value); setFormData({...formData, items: n}); }} className="w-full border-none font-mono font-black text-right outline-none" /></td>
                                         <td className="px-4 py-3"><input type="number" value={it.ppn + it.pph21 + it.pph22} onChange={e => { const n=[...(formData.items || [])]; n[idx].ppn=Number(e.target.value); setFormData({...formData, items: n}); }} className="w-full border-none font-mono font-black text-right text-rose-500 outline-none" /></td>
                                         <td className="px-2 py-3 text-center"><button onClick={() => setFormData({...formData, items: formData.items?.filter((_, i) => i !== idx)})} className="text-rose-300 hover:text-rose-500"><Trash2 size={14}/></button></td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-10 animate-in slide-in-from-right duration-300">
                       <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-[3rem] p-12 text-center relative group">
                          <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <Upload className="mx-auto text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={48} />
                          <h4 className="text-lg font-black text-blue-900 uppercase tracking-tight">Upload Scan Berkas Verifikasi</h4>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Klik atau seret file ke area ini (PDF, JPG, PNG)</p>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-2"><Paperclip size={14}/> Berkas yang Telah Diunggah</h4>
                          {formData.files && formData.files.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {formData.files.map(f => (
                                   <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><File size={18}/></div>
                                         <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 truncate max-w-[120px] uppercase">{f.namaFile}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{f.size}</span>
                                         </div>
                                      </div>
                                      <div className="flex gap-1">
                                         {f.url && (
                                            <>
                                               <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Preview"><Eye size={16}/></a>
                                               <a href={f.url} download={f.namaFile} className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download"><Download size={16}/></a>
                                            </>
                                         )}
                                         <button onClick={() => setFormData({...formData, files: formData.files?.filter(x => x.id !== f.id)})} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <FileText className="mx-auto text-slate-200 mb-4" size={48}/>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada berkas pendukung yang diunggah</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>
              <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 flex-shrink-0">
                 <div className="bg-slate-900 px-10 py-6 rounded-[2.5rem] text-white text-center shadow-2xl border-b-4 border-blue-500 min-w-[300px]">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Netto Tagihan</p>
                    <h4 className="text-3xl font-black font-mono text-emerald-400">
                       {formatIDR((formData.items || []).reduce((s,i) => s + (i.volume * i.hargaSatuan) - (i.ppn + i.pph21 + i.pph22), 0))}
                    </h4>
                 </div>
                 <div className="flex gap-4 items-center">
                    {/* [Sprint C.5] Status badge — show current state of bill */}
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                      formData.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' :
                      formData.status === 'Verifikasi' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{formData.status || 'Draft'}</span>
                    <button onClick={() => setShowModal(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
                    {/* [Sprint C.5] Two-button save: Save as Draft (no validation) atau Save & Verifikasi (validated) */}
                    <button onClick={() => { setFormData({ ...formData, status: 'Draft' }); setTimeout(handleSave, 0); }} className="px-8 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow hover:bg-slate-300 transition-all">Simpan Draft</button>
                    <button onClick={() => { setFormData({ ...formData, status: 'Verifikasi' }); setTimeout(handleSave, 0); }} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center gap-3">Simpan & Verifikasi</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* [Sprint C.4 + C.5] Save block modal — invalid akun atau transition gagal */}
      {saveBlockReason && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tidak Bisa Verifikasi</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Validasi state machine gagal — perbaiki dulu sebelum simpan & verifikasi.</p>
              </div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
              <p className="text-sm font-bold text-red-700">{saveBlockReason.message}</p>
            </div>
            {saveBlockReason.invalidItems && saveBlockReason.invalidItems.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Item yang akun-nya tidak valid:</p>
                <ul className="space-y-1.5 bg-slate-50 rounded-2xl p-4 max-h-48 overflow-y-auto">
                  {saveBlockReason.invalidItems.map(it => (
                    <li key={it.id} className="text-xs flex items-center gap-3">
                      <span className="font-mono font-black text-red-600">{it.akun || '(kosong)'}</span>
                      <span className="text-slate-600">{it.namaBarang || '(no name)'}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Pakai dropdown autocomplete untuk pilih kode akun yang valid dari Pagu.</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setSaveBlockReason(null); setFormData({ ...formData, status: 'Draft' }); setTimeout(handleSave, 0); }} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-300">Simpan Draft Saja</button>
              <button onClick={() => setSaveBlockReason(null)} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow hover:bg-slate-900">Kembali ke Form</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryStat = ({ label, val, icon, color, bg }: any) => (
  <div className={`p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center gap-5 transition-all hover:scale-105 ${bg}`}>
     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">{icon}</div>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-black font-mono ${color}`}>{formatIDR(val).replace('Rp', '')}</p>
     </div>
  </div>
);

const InputGroup = ({ label, value, onChange, type = 'text' }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
  </div>
);

export default OperationalBilling;
