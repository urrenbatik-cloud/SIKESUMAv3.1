
import React, { useState, useMemo } from 'react';
import { BPJSCalcSettings, ScenarioSettings } from '../types';
import { Settings2, Percent, DollarSign, Info, Calendar, Copy, BrainCircuit } from 'lucide-react';
import { getEffectiveSettings } from '../utils/feeCalculation';

interface BpjsSettingsFormProps {
  history: Record<string, BPJSCalcSettings>;
  onChange: (newHistory: Record<string, BPJSCalcSettings>) => void;
}

const BpjsSettingsForm: React.FC<BpjsSettingsFormProps> = ({ history, onChange }) => {
  // [F3.6 v2] Item 3: Default ke latest period yang ada di history (bukan current date).
  //   Sebelumnya: defaults to current month/year (e.g., Mei 2026) yang biasanya kosong di seed.
  //   Sekarang: defaults to most recent period in history (e.g., 2025-07 jika seed terbaru ada di sana).
  //   User dapat tetap navigate ke periode lain via dropdown.
  const getInitialPeriod = (): { year: number; month: number } => {
    const keys = Object.keys(history).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
    if (keys.length > 0) {
      const latest = keys[keys.length - 1];
      const [yearStr, monthStr] = latest.split('-');
      return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) };
    }
    // Fallback: current date kalau history kosong
    return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  };
  const initialPeriod = getInitialPeriod();
  const [editMonth, setEditMonth] = useState(initialPeriod.month);
  const [editYear, setEditYear] = useState(initialPeriod.year);
  
  const currentKey = `${editYear}-${editMonth.toString().padStart(2, '0')}`;
  
  const currentSettings = useMemo(() => {
    return history[currentKey] || getEffectiveSettings(editYear, editMonth, history);
  }, [history, currentKey, editYear, editMonth]);

  const updateScenario = (id: keyof BPJSCalcSettings, field: keyof ScenarioSettings, val: number) => {
    const newSettings = { ...currentSettings };
    newSettings[id] = { ...newSettings[id], [field]: val };
    
    onChange({
      ...history,
      [currentKey]: newSettings
    });
  };

  const copyFromPrevious = () => {
    const prevDate = new Date(editYear, editMonth - 2, 1);
    const prevSettings = getEffectiveSettings(prevDate.getFullYear(), prevDate.getMonth() + 1, history);
    onChange({
      ...history,
      [currentKey]: { ...prevSettings }
    });
  };

  const renderScenarioCard = (id: keyof BPJSCalcSettings, title: string, desc: string, color: string) => {
    const s = currentSettings[id];
    return (
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className={`p-8 ${color} text-white`}>
           <h3 className="text-xl font-black uppercase tracking-tighter">{title}</h3>
           <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">{desc}</p>
        </div>
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <SettingInput label="DPJP Spesialis (%)" value={s.specPct} icon={<Percent size={12}/>} onChange={v => updateScenario(id, 'specPct', v)} />
              <SettingInput label="Maksimal Jasa (Rp)" value={s.specCap} icon={<DollarSign size={12}/>} onChange={v => updateScenario(id, 'specCap', v)} />
           </div>
           <div className="grid grid-cols-2 gap-6">
              <SettingInput label="Potong Raber 1 Dr (%)" value={s.raberCutPct} icon={<Percent size={12}/>} onChange={v => updateScenario(id, 'raberCutPct', v)} />
              <SettingInput label="Pool Raber > 1 Dr (%)" value={s.raberPoolPct} icon={<Percent size={12}/>} onChange={v => updateScenario(id, 'raberPoolPct', v)} />
           </div>
           
           {(id === 'scenarioB' || id === 'scenarioE') && (
             <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-200 space-y-4 shadow-inner">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg"><BrainCircuit size={16} /></div>
                   <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Skenario Khusus Bedah Saraf</p>
                      <p className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">Akan Mengambil Nilai Flat Jika Kasus Terdeteksi</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <SettingInput label="Jasa Flat Bedah Saraf (Rp)" value={s.bedahSarafFlat} icon={<DollarSign size={12}/>} onChange={v => updateScenario(id, 'bedahSarafFlat', v)} />
                   <SettingInput label="Flat + Jasa Raharja (Rp)" value={s.bedahSarafJRFlat} icon={<DollarSign size={12}/>} onChange={v => updateScenario(id, 'bedahSarafJRFlat', v)} />
                </div>
             </div>
           )}

           <div className="h-px bg-slate-100"></div>
           <div className="grid grid-cols-2 gap-6">
              <SettingInput label="Anestesi (%)" value={s.anestesiPct} icon={<Percent size={12}/>} onChange={v => updateScenario(id, 'anestesiPct', v)} />
              <SettingInput label="Anestesi Maks (Rp)" value={s.anestesiCap} icon={<DollarSign size={12}/>} onChange={v => updateScenario(id, 'anestesiCap', v)} />
           </div>
           <div className="grid grid-cols-2 gap-6">
              <SettingInput label="Dokter Umum (%)" value={s.gpPct} icon={<Percent size={12}/>} onChange={v => updateScenario(id, 'gpPct', v)} />
              <SettingInput label="Dokter Umum Maks (Rp)" value={s.gpCap} icon={<DollarSign size={12}/>} onChange={v => updateScenario(id, 'gpCap', v)} />
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden gap-8">
         <div className="absolute right-0 top-0 p-10 opacity-10"><Settings2 size={160} /></div>
         <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Konfigurasi Berlaku Per Bulan</h2>
            <p className="text-slate-400 text-sm max-w-lg mt-2">Logika yang diatur pada bulan tertentu akan berlaku untuk bulan tersebut dan bulan-bulan selanjutnya sampai ada perubahan baru di bulan lain.</p>
         </div>
         <div className="relative z-10 flex flex-col items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
               <Calendar size={20} className="text-amber-400" />
               <select value={editMonth} onChange={e => setEditMonth(Number(e.target.value))} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-black text-white outline-none cursor-pointer">
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
               </select>
               <select value={editYear} onChange={e => setEditYear(Number(e.target.value))} className="bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-black text-white outline-none cursor-pointer">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
            <button onClick={copyFromPrevious} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5">
               <Copy size={14} /> Salin Dari Logika Sebelumnya
            </button>
            <p className="text-[8px] font-bold text-amber-500 uppercase tracking-[0.2em]">Status Database: {history[currentKey] ? 'Custom Logika Aktif' : 'Default/Warisan Aktif'}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {renderScenarioCard('scenarioA', 'Skenario A: Bedah Non-ICU', 'Logika Standar Tindakan Bedah RS', 'bg-blue-600')}
         {renderScenarioCard('scenarioB', 'Skenario B: Bedah ICU / Tinggi', 'Tindakan Bedah Khusus & Perawatan Intensif', 'bg-emerald-600')}
         {renderScenarioCard('scenarioD', 'Skenario D: Non-Bedah Non-ICU', 'Rawat Inap Medik Standar', 'bg-indigo-600')}
         {renderScenarioCard('scenarioE', 'Skenario E: Non-Bedah ICU > 20JT', 'Kasus Medik Berat & Biaya Tinggi', 'bg-amber-600')}
         {renderScenarioCard('scenarioF', 'Skenario F: Non-Bedah ICU <= 20JT', 'Kasus Medik Intensif Biaya Standar', 'bg-rose-600')}
      </div>
    </div>
  );
};

const SettingInput = ({ label, value, onChange, icon }: any) => (
  <div className="flex flex-col gap-2">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
     <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">{icon}</div>
        <input 
          type="number" value={value} 
          onChange={e => onChange(Number(e.target.value))} 
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all shadow-inner" 
        />
     </div>
  </div>
);

export default BpjsSettingsForm;
