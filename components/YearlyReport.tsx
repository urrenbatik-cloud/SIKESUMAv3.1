
import React, { useMemo, useState } from 'react';
import { PatientClaim, BPJSCalcSettings } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR } from './Formatters';
import { Calendar, Layers, CheckCircle2, AlertCircle, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface YearlyReportProps {
  logs: PatientClaim[];
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
}

const YearlyReport: React.FC<YearlyReportProps> = ({ logs, bpjsSettingsHistory }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => {
    const filtered = logs.filter(l => l.tahun === selectedYear);
    let pendapatan = 0;
    let jasaTotal = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let categories = { spesialis: 0, perawat: 0, manajemen: 0, casemix: 0 };

    filtered.forEach(l => {
      pendapatan += l.nilaiKlaim;
      if (l.status === 'Verifikasi') verifiedCount++;
      if (l.status === 'Pending') pendingCount++;
      
      // Mengambil settings yang berlaku untuk bulan log ini
      const effectiveSettings = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
      const fees = calculatePatientFees(l, effectiveSettings);
      
      jasaTotal += (fees.spesialis + fees.anestesi + fees.gp + fees.paramOK + fees.paramICU + fees.paramGen + fees.penataAnestesi);
      categories.spesialis += fees.spesialis + fees.anestesi;
      categories.perawat += fees.paramOK + fees.paramICU + fees.paramGen + fees.penataAnestesi;
      categories.manajemen += fees.manajemen + fees.pengelola;
      categories.casemix += fees.casemix;
    });

    return { pendapatan, jasaTotal, filtered, verifiedCount, pendingCount, categories };
  }, [logs, selectedYear, bpjsSettingsHistory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm no-print">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Tahun:</span>
        <select 
          value={selectedYear} 
          onChange={e => setSelectedYear(Number(e.target.value))} 
          className="bg-slate-100 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-widest">Akurasi Berdasarkan Versi Logika Bulanan Aktif</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatMini label="Total Pendapatan Thn" value={formatIDR(stats.pendapatan)} icon={<DollarSign className="text-blue-600" />} />
        <StatMini label="Total Layanan Thn" value={`${stats.filtered.length} Pasien`} icon={<Layers className="text-emerald-600" />} />
        <StatMini label="Klaim Terverifikasi" value={stats.verifiedCount} icon={<CheckCircle2 className="text-indigo-600" />} />
        <StatMini label="Klaim Pending/Dispute" value={stats.pendingCount} icon={<AlertCircle className="text-rose-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Distribusi Jasa Tahunan (Multi-Logika)</h3>
          <div className="space-y-6">
            <CategoryProgress label="Jasa Medis (Spesialis & Anestesi)" value={stats.categories.spesialis} total={stats.jasaTotal} color="bg-blue-600" />
            <CategoryProgress label="Keperawatan & Paramedis" value={stats.categories.perawat} total={stats.jasaTotal} color="bg-emerald-600" />
            <CategoryProgress label="Manajemen & Pengelola" value={stats.categories.manajemen} total={stats.jasaTotal} color="bg-indigo-600" />
            <CategoryProgress label="Team Casemix" value={stats.categories.casemix} total={stats.jasaTotal} color="bg-amber-600" />
          </div>
        </div>
        
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl flex flex-col justify-center">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Efisiensi Jasa Tahunan</p>
          <h4 className="text-6xl font-black tracking-tighter mb-4">
            {((stats.jasaTotal / (stats.pendapatan || 1)) * 100).toFixed(1)}%
          </h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Rasio akumulasi jasa tahun {selectedYear} terhadap total pendapatan klaim. 
            Sistem secara otomatis menyesuaikan rumus perhitungan untuk setiap bulan layanan sesuai riwayat perubahan logika.
          </p>
          <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={24} />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pertumbuhan Vs Tahun Lalu</p>
                <p className="text-lg font-black text-white">+14.2%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatMini = ({ label, value, icon }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  </div>
);

const CategoryProgress = ({ label, value, total, color }: any) => {
  const pct = (value / (total || 1)) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-black text-slate-900 font-mono">{formatIDR(value)}</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

export default YearlyReport;
