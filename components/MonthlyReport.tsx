
import React, { useMemo, useState } from 'react';
import { PatientClaim, BPJSCalcSettings } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR } from './Formatters';
import { Calendar, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface MonthlyReportProps {
  logs: PatientClaim[];
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  // Added globalMonth and globalYear to fix type mismatch error
  globalMonth?: number;
  globalYear?: number;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ logs, bpjsSettingsHistory, globalMonth, globalYear }) => {
  // Fixed: Initialize state from global props if available to maintain sync with global filter
  const [month, setMonth] = useState(globalMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(globalYear || new Date().getFullYear());

  const stats = useMemo(() => {
    const filtered = logs.filter(l => l.tahun === year && l.bulan === month);
    
    // Mengambil settings yang berlaku untuk bulan yang sedang difilter ini
    const effectiveSettings = getEffectiveSettings(year, month, bpjsSettingsHistory);
    
    let pendapatan = 0;
    let jasaTotal = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let categories = { spesialis: 0, perawat: 0, manajemen: 0, casemix: 0 };

    filtered.forEach(l => {
      pendapatan += l.nilaiKlaim;
      if (l.status === 'Verifikasi') verifiedCount++;
      if (l.status === 'Pending') pendingCount++;
      
      const fees = calculatePatientFees(l, effectiveSettings);
      jasaTotal += (fees.spesialis + fees.anestesi + fees.gp + fees.paramOK + fees.paramICU + fees.paramGen + fees.penataAnestesi);
      categories.spesialis += fees.spesialis + fees.anestesi;
      categories.perawat += fees.paramOK + fees.paramICU + fees.paramGen + fees.penataAnestesi;
      categories.manajemen += fees.manajemen + fees.pengelola;
      categories.casemix += fees.casemix;
    });

    return { pendapatan, jasaTotal, filtered, verifiedCount, pendingCount, categories };
  }, [logs, month, year, bpjsSettingsHistory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm no-print">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Periode:</span>
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-slate-100 border-none rounded-xl text-xs font-bold px-4 py-2">
          {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-slate-100 border-none rounded-xl text-xs font-bold px-4 py-2">
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatMini label="Total Pendapatan" value={formatIDR(stats.pendapatan)} icon={<Calendar className="text-blue-600" />} />
        <StatMini label="Total Layanan" value={`${stats.filtered.length} Pasien`} icon={<Layers className="text-emerald-600" />} />
        <StatMini label="Klaim Terverifikasi" value={stats.verifiedCount} icon={<CheckCircle2 className="text-indigo-600" />} />
        <StatMini label="Klaim Pending" value={stats.pendingCount} icon={<AlertCircle className="text-rose-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Distribusi Jasa Bulanan (Logika Versi {year}-{month})</h3>
          <div className="space-y-6">
            <CategoryProgress label="Jasa Medis (Spesialis & Anestesi)" value={stats.categories.spesialis} total={stats.jasaTotal} color="bg-blue-600" />
            <CategoryProgress label="Keperawatan & Paramedis" value={stats.categories.perawat} total={stats.jasaTotal} color="bg-emerald-600" />
            <CategoryProgress label="Manajemen & Pengelola" value={stats.categories.manajemen} total={stats.jasaTotal} color="bg-indigo-600" />
            <CategoryProgress label="Team Casemix" value={stats.categories.casemix} total={stats.jasaTotal} color="bg-amber-600" />
          </div>
        </div>
        
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-center">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Efisiensi Jasa Bulanan</p>
          <h4 className="text-6xl font-black tracking-tighter mb-4">
            {((stats.jasaTotal / (stats.pendapatan || 1)) * 100).toFixed(1)}%
          </h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Rasio total jasa yang didistribusikan terhadap total klaim periode ini. 
            Mencerminkan pengaturan logika yang berlaku khusus pada bulan layanan ini.
          </p>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ label, value, icon }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const CategoryProgress = ({ label, value, total, color }: any) => {
  const pct = (value / (total || 1)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-black text-slate-900">{formatIDR(value)}</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

export default MonthlyReport;
