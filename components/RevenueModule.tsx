import React, { useState, useMemo, useEffect } from 'react';
import { PatientClaim, RevenueTarget, TabType, SpecialtyTarget, Doctor, Bill, RPDSection } from '../types';
import { formatIDR } from './Formatters';
import { 
  Target, TrendingUp, Coins, Calendar, 
  Search, Wallet, Activity, History, ListFilter, Stethoscope,
  Users, ClipboardList, Info, HeartPulse,
  Scale, AlertCircle, ShoppingCart, UserCheck, ShieldCheck, Settings, Bed, User,
  BarChart3, ArrowRight, X, ArrowUpRight, Globe, Lock, ClipboardCheck, FileText
} from 'lucide-react';
import { exportToCSV } from '../utils/csvHelper';
import { YEARS } from '../constants';
import LocalFilterBar, { LocalFilterState } from './LocalFilterBar';

interface RevenueModuleProps {
  activeTabType: TabType;
  logs: PatientClaim[];
  targets: RevenueTarget[];
  specialtyTargets: SpecialtyTarget[];
  onTargetsChange: (newTargets: RevenueTarget[]) => void;
  onSpecialtyTargetsChange: (newTargets: SpecialtyTarget[]) => void;
  selectedYear: number | 'ALL';
  doctors: Doctor[];
  bills: Bill[];
  rpdData?: RPDSection[];
}

const RevenueModule: React.FC<RevenueModuleProps> = ({ 
  activeTabType, logs, targets, specialtyTargets, onTargetsChange, onSpecialtyTargetsChange, selectedYear, doctors, bills, rpdData 
}) => {
  const [search, setSearch] = useState('');
  const [localFilter, setLocalFilter] = useState<LocalFilterState>({
    mode: 'YEARLY',
    day: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: selectedYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLocalFilter(prev => ({ ...prev, year: selectedYear }));
  }, [selectedYear]);

  const temporalLogs = useMemo(() => {
    return logs.filter(l => {
      const logDate = new Date(l.tanggalInput);
      if (localFilter.mode === 'DAILY') return l.tanggalInput === localFilter.day;
      if (localFilter.mode === 'MONTHLY') return l.bulan === localFilter.month && (localFilter.year === 'ALL' || l.tahun === localFilter.year);
      if (localFilter.mode === 'YEARLY') return (localFilter.year === 'ALL' || l.tahun === localFilter.year);
      if (localFilter.mode === 'RANGE') return logDate >= new Date(localFilter.startDate) && logDate <= new Date(localFilter.endDate);
      return true;
    });
  }, [logs, localFilter]);

  const filteredRevenueStats = useMemo(() => {
    const displayCategories = ['BPJS_DINAS', 'BPJS_UMUM', 'YANMASUM', 'JASA_RAHARJA'];
    const stats: any = {};
    
    displayCategories.forEach(cat => {
      const target = targets.find(t => t.kategori === cat && (localFilter.year === 'ALL' ? true : t.tahun === localFilter.year));
      const targetNominal = target?.targetNominal || 0;
      const targetPasien = (target?.targetRawatInap || 0) + (target?.targetRawatJalan || 0);

      let displayTargetNominal = targetNominal;
      let displayTargetPasien = targetPasien;

      if (localFilter.mode === 'MONTHLY') { displayTargetNominal /= 12; displayTargetPasien /= 12; }
      else if (localFilter.mode === 'DAILY') { displayTargetNominal /= 365; displayTargetPasien /= 365; }

      const categoryLogs = temporalLogs.filter(l => {
        if (cat === 'BPJS_UMUM') return l.kategoriPasien === 'BPJS_UMUM' || l.kategoriPasien === 'BPJS_PLUS_JR';
        return l.kategoriPasien === cat;
      });

      const realization = categoryLogs.reduce((sum, l) => sum + l.nilaiKlaim, 0);
      stats[cat] = { 
        targetNominal: displayTargetNominal, 
        realization, 
        pctNominal: displayTargetNominal > 0 ? (realization / displayTargetNominal) * 100 : 0,
        pasienCount: categoryLogs.length,
        pctPasien: displayTargetPasien > 0 ? (categoryLogs.length / displayTargetPasien) * 100 : 0
      };
    });

    const totalTarget = targets.filter(t => (localFilter.year === 'ALL' ? true : t.tahun === localFilter.year)).reduce((s, t) => s + t.targetNominal, 0);
    const totalReal = temporalLogs.reduce((s, l) => s + l.nilaiKlaim, 0);
    return { stats, totalTarget, totalReal, totalPct: totalTarget > 0 ? (totalReal / totalTarget) * 100 : 0 };
  }, [temporalLogs, targets, localFilter]);

  const financialHealth = useMemo(() => {
    const filteredBills = bills.filter(b => {
      const bDate = new Date(b.tanggal);
      if (localFilter.mode === 'DAILY') return b.tanggal === localFilter.day;
      if (localFilter.mode === 'MONTHLY') return bDate.getMonth() + 1 === localFilter.month && (localFilter.year === 'ALL' || bDate.getFullYear() === localFilter.year);
      if (localFilter.mode === 'YEARLY') return (localFilter.year === 'ALL' || bDate.getFullYear() === localFilter.year);
      if (localFilter.mode === 'RANGE') return bDate >= new Date(localFilter.startDate) && bDate <= new Date(localFilter.endDate);
      return true;
    });

    const lunasBills = filteredBills.filter(b => b.status === 'Lunas');
    const belanjaModal = lunasBills.filter(b => b.category === 'MODAL').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0);
    const belanjaOps = lunasBills.filter(b => b.category === 'OPERASIONAL').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0);
    const belanjaPemeliharaan = lunasBills.filter(b => b.category === 'PEMELIHARAAN').reduce((s, b) => s + b.items.reduce((si, i) => si + (i.volume * i.hargaSatuan), 0), 0);
    
    // Perencanaan vs Realisasi (Accountability Check)
    let totalPlannedWithdrawal = 0;
    if (rpdData) {
       rpdData.forEach(sec => {
          sec.rows.forEach(r => {
             // Fix: Explicitly cast to number to avoid 'unknown' type errors in addition
             if (localFilter.mode === 'MONTHLY') {
               const monthlyVal = (r.monthly as any)[`m${localFilter.month}`];
               totalPlannedWithdrawal += (typeof monthlyVal === 'number' ? monthlyVal : 0);
             } else if (localFilter.mode === 'YEARLY') {
               totalPlannedWithdrawal += (Object.values(r.monthly) as number[]).reduce((a, b) => a + b, 0);
             }
          });
       });
    }

    const totalExpenditure = belanjaModal + belanjaOps + belanjaPemeliharaan;
    const ratioExpRev = filteredRevenueStats.totalReal > 0 ? (totalExpenditure / filteredRevenueStats.totalReal) * 100 : 0;
    const piutang = temporalLogs.filter(l => l.status === 'Pending' || l.status === 'Dispute').reduce((s, l) => s + l.nilaiKlaim, 0);

    return { belanjaModal, belanjaOps, belanjaPemeliharaan, totalExpenditure, ratioExpRev, piutang, totalPlannedWithdrawal };
  }, [bills, temporalLogs, localFilter, filteredRevenueStats.totalReal, rpdData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <LocalFilterBar initialYear={selectedYear} onFilterChange={setLocalFilter} />

      {activeTabType === TabType.FINANCIAL_HEALTH && (
        <div className="space-y-10">
           {/* FLOW AKUNTABILITAS AUDIT */}
           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><ClipboardCheck className="text-emerald-400" /> Alur Kontrol Akuntabilitas (Audit Trail)</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status Keuangan Dari Perencanaan ke Pelaporan</p>
                 </div>
                 <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase">Live Data Verified</span>
                 </div>
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                 {/* Garis Penghubung Alur */}
                 <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-50 -translate-y-1/2 z-0"></div>
                 
                 <AuditStep 
                    title="1. PERSIAPAN" 
                    desc="Pagu Anggaran" 
                    val={filteredRevenueStats.totalTarget} 
                    icon={<Lock size={18}/>} 
                    color="text-blue-600" bg="bg-blue-50" 
                    active 
                 />
                 <AuditStep 
                    title="2. PERENCANAAN" 
                    desc="RPD (Planned Out)" 
                    val={financialHealth.totalPlannedWithdrawal} 
                    icon={<Calendar size={18}/>} 
                    color="text-amber-600" bg="bg-amber-50" 
                    active 
                 />
                 <AuditStep 
                    title="3. PELAKSANAAN" 
                    desc="Total Belanja Lunas" 
                    val={financialHealth.totalExpenditure} 
                    icon={<ShoppingCart size={18}/>} 
                    color="text-emerald-600" bg="bg-emerald-50" 
                    active 
                 />
                 <AuditStep 
                    title="4. PELAPORAN" 
                    desc="Sisa Dana (LRA)" 
                    val={filteredRevenueStats.totalTarget - financialHealth.totalExpenditure} 
                    icon={<FileText size={18}/>} 
                    color="text-slate-600" bg="bg-slate-100" 
                    active 
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <HealthCard title="Piutang Klaim RS" value={financialHealth.piutang} icon={<History className="text-amber-500" />} desc="Status Dispute/Pending" />
              <div className="lg:col-span-3 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl flex items-center justify-between relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700"><HeartPulse size={200} /></div>
                 <div className="relative z-10 w-full">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Efficiency Score (Net Margin)</p>
                    <div className="flex items-baseline gap-4">
                       <h4 className="text-5xl font-black tracking-tighter">{(100 - financialHealth.ratioExpRev).toFixed(1)}%</h4>
                       <div><p className="text-[10px] font-bold text-slate-500 uppercase">Margin Operasional</p><p className={`text-xs font-black uppercase ${financialHealth.ratioExpRev <= 85 ? 'text-emerald-500' : 'text-rose-500'}`}>Status: {financialHealth.ratioExpRev <= 85 ? 'SEHAT (OPTIMAL)' : 'KRITIS (EVALUASI)'}</p></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl flex flex-col">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><Scale size={16} className="text-blue-500" /> Realisasi PNBP (Sisi Penerimaan)</h3>
                 <div className="space-y-8 flex-1 flex flex-col justify-center">
                    <ProgressWithInfo label="BPJS Dinas" val={filteredRevenueStats.stats.BPJS_DINAS.realization} target={filteredRevenueStats.stats.BPJS_DINAS.targetNominal} color="bg-blue-600" />
                    <ProgressWithInfo label="BPJS Umum (+Plus JR)" val={filteredRevenueStats.stats.BPJS_UMUM.realization} target={filteredRevenueStats.stats.BPJS_UMUM.targetNominal} color="bg-indigo-600" />
                    <ProgressWithInfo label="Yanmasum" val={filteredRevenueStats.stats.YANMASUM.realization} target={filteredRevenueStats.stats.YANMASUM.targetNominal} color="bg-emerald-600" />
                 </div>
              </div>
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2"><ShoppingCart size={16} className="text-amber-500" /> Alokasi Belanja (Sisi Pengeluaran)</h3>
                 <div className="space-y-10">
                    <div className="grid grid-cols-3 gap-4">
                       <MetricBox label="Modal Alkes" val={financialHealth.belanjaModal} />
                       <MetricBox label="Operasional" val={financialHealth.belanjaOps} />
                       <MetricBox label="Pemeliharaan" val={financialHealth.belanjaPemeliharaan} />
                    </div>
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={60}/></div>
                       <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase text-slate-500">Net Surplus / (Deficit)</p>
                          <h4 className={`text-2xl font-black font-mono ${filteredRevenueStats.totalReal - financialHealth.totalExpenditure >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {formatIDR(filteredRevenueStats.totalReal - financialHealth.totalExpenditure)}
                          </h4>
                       </div>
                       <div className="text-right relative z-10">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Efektivitas Belanja</p>
                          <p className="text-xs font-black text-white">{financialHealth.ratioExpRev.toFixed(1)}% Dari Realisasi</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTabType === TabType.REV_DASHBOARD && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
            <RevenueCard title="Realisasi RS" real={filteredRevenueStats.totalReal} target={filteredRevenueStats.totalTarget} icon={<Coins className="text-amber-500" size={24} />} color="amber" />
            <RevenueCard title="BPJS Dinas" real={filteredRevenueStats.stats.BPJS_DINAS.realization} target={filteredRevenueStats.stats.BPJS_DINAS.targetNominal} icon={<ShieldCheck className="text-emerald-500" size={24} />} color="emerald" />
            <RevenueCard title="BPJS Umum" real={filteredRevenueStats.stats.BPJS_UMUM.realization} target={filteredRevenueStats.stats.BPJS_UMUM.targetNominal} icon={<Activity className="text-blue-500" size={24} />} color="blue" />
            <RevenueCard title="Yanmasum" real={filteredRevenueStats.stats.YANMASUM.realization} target={filteredRevenueStats.stats.YANMASUM.targetNominal} icon={<Wallet className="text-indigo-500" size={24} />} color="indigo" />
          </div>
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
             <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 uppercase">Log Audit Penerimaan (Kas Masuk)</h3>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari DPJP / Pasien..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" /></div>
             </div>
             <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0f172a] text-white font-black uppercase tracking-widest"><tr><th className="px-6 py-5">Tgl Input</th><th className="px-6 py-5">Kategori</th><th className="px-6 py-5">Nama Pasien</th><th className="px-6 py-5">DPJP Utama</th><th className="px-6 py-5 text-right">Nilai Klaim (Kas)</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                   {temporalLogs.filter(l => l.dpjpUtama.toLowerCase().includes(search.toLowerCase()) || l.nama.toLowerCase().includes(search.toLowerCase())).map(l => (
                     <tr key={l.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">{l.tanggalInput}</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-[8px] font-black uppercase">{l.kategoriPasien.replace('_', ' ')}</span></td>
                        <td className="px-6 py-4 font-black text-slate-900 uppercase">{l.nama}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 uppercase">{l.dpjpUtama}</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">{formatIDR(l.nilaiKlaim).replace('Rp', '')}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </>
      )}
    </div>
  );
};

const AuditStep = ({ title, desc, val, icon, color, bg, active }: any) => (
  <div className={`relative z-10 flex flex-col items-center text-center group`}>
     <div className={`w-14 h-14 ${active ? bg : 'bg-slate-50'} rounded-2xl flex items-center justify-center shadow-lg border border-white group-hover:scale-110 transition-transform duration-500`}>
        <div className={active ? color : 'text-slate-300'}>{icon}</div>
     </div>
     <div className="mt-4">
        <p className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-slate-400' : 'text-slate-300'}`}>{title}</p>
        <p className={`text-[10px] font-black uppercase ${active ? 'text-slate-900' : 'text-slate-400'}`}>{desc}</p>
        <p className={`text-[11px] font-mono font-black mt-1 ${active ? 'text-blue-600' : 'text-slate-300'}`}>{formatIDR(val).replace('Rp', '')}</p>
     </div>
  </div>
);

const HealthCard = ({ title, value, icon, desc }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col gap-3 group hover:border-blue-200 transition-all">
     <div className="flex justify-between items-start"><div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">{icon}</div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p><p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{formatIDR(value)}</p></div></div>
     <p className="text-[9px] font-bold text-slate-400 uppercase italic text-right mt-2">{desc}</p>
  </div>
);

const MetricBox = ({ label, val }: any) => (
  <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
     <p className="text-xs font-black text-slate-900 font-mono">{formatIDR(val).replace('Rp','')}</p>
  </div>
);

const ProgressWithInfo = ({ label, val, target, color }: any) => {
  const pct = target > 0 ? (val / target) * 100 : 0;
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span><div className="text-right"><span className="text-[12px] font-black text-slate-900 font-mono">{formatIDR(val)}</span><span className="text-[9px] font-bold text-slate-400 ml-2">/ {formatIDR(target)}</span></div></div>
       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50"><div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div>
       <p className={`text-[8px] font-black uppercase text-right ${pct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{pct.toFixed(1)}% Capaian Target</p>
    </div>
  );
};

const RevenueCard = ({ title, real, target, icon, color }: any) => {
  const pct = target > 0 ? (real / target) * 100 : 0;
  const colors: any = { amber: "bg-amber-50 border-amber-100 text-amber-600", blue: "bg-blue-50 border-blue-100 text-blue-600", emerald: "bg-emerald-50 border-emerald-100 text-emerald-600", indigo: "bg-indigo-50 border-indigo-100 text-indigo-600" };
  const progressColor: any = { amber: "bg-amber-500", blue: "bg-blue-600", emerald: "bg-emerald-600", indigo: "bg-indigo-600" };
  return (
    <div className={`p-6 rounded-[2.5rem] border-2 shadow-sm ${colors[color]} flex flex-col gap-4 group hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start"><div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">{icon}</div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p><p className="text-lg font-black text-slate-900 font-mono">{pct.toFixed(1)}%</p></div></div>
      <div className="space-y-1"><div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span className="text-slate-400">Kas Masuk</span><span className="text-slate-900">{formatIDR(real)}</span></div><div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-slate-100/50"><div className={`h-full ${progressColor[color]} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div></div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-200/30">
        <div className="flex flex-col"><span className="text-[8px] font-bold text-slate-400 uppercase">Target</span><span className="text-xs font-black font-mono text-slate-900">{formatIDR(target)}</span></div>
        <ArrowUpRight size={16} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
      </div>
    </div>
  );
};

export default RevenueModule;