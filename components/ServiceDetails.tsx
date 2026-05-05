
import React, { useState, useMemo } from 'react';
import { PatientClaim, Doctor, Employee, ServiceDetailState, BPJSCalcSettings } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR } from './Formatters';
import { BrainCircuit, ShieldCheck, Info, TrendingDown, Landmark, ArrowRight, Wallet } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Tooltip component to provide additional information on hover
const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => (
  <div className="group relative flex items-center">
    {children}
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 text-white text-[9px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

interface ServiceDetailsProps {
  logs: PatientClaim[];
  doctors: Doctor[];
  staff: Employee[];
  fees: ServiceDetailState;
  onFeesChange: (newFees: ServiceDetailState) => void;
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  globalMonth: number;
  globalYear: number;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ logs, doctors, staff, bpjsSettingsHistory, globalMonth, globalYear }) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const stats = useMemo(() => {
    const filtered = logs.filter(l => l.tahun === globalYear && l.bulan === globalMonth && l.status === 'Verifikasi');
    const effectiveSettings = getEffectiveSettings(globalYear, globalMonth, bpjsSettingsHistory);
    
    // Identifikasi konteks data (Apakah sedang melihat BPJS atau Yanmasum)
    const hasBPJS = filtered.some(l => l.kategoriPasien.startsWith('BPJS'));
    const hasYan = filtered.some(l => l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA');

    let klaimTotal = 0;
    let bpjsPools = { spesialis: 0, gp: 0, paramOK: 0, paramICU: 0, paramGen: 0, pengelola: 0 };
    let yanmasumTotal = 0;

    filtered.forEach(l => {
      klaimTotal += l.nilaiKlaim;
      const f = calculatePatientFees(l, effectiveSettings);
      const isYanPatient = l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA';
      
      if (isYanPatient) {
        yanmasumTotal += (f.spesialis + f.anestesi + f.gp + f.paramGen + f.bhp + f.pengelola + f.manajemen + f.casemix + f.konsul);
      } else {
        bpjsPools.spesialis += (f.spesialis + f.anestesi + f.konsul);
        bpjsPools.gp += f.gp;
        bpjsPools.paramOK += f.paramOK;
        bpjsPools.paramICU += f.paramICU;
        bpjsPools.paramGen += f.paramGen;
        bpjsPools.pengelola += (f.pengelola + f.manajemen + f.casemix);
      }
    });

    // Biaya Tetap (Honor TKS & Transport Dokter) HANYA dihitung jika ada pasien BPJS
    // Hal ini mencegah double-counting saat user menjumlahkan Tab BPJS + Tab Yanmasum
    const includeFixed = hasBPJS || (!hasBPJS && !hasYan); // Default true jika kosong atau ada BPJS
    const totalTransportDoc = includeFixed ? doctors.reduce((sum, d) => sum + (d.baseTransport || 0), 0) : 0;
    const totalHonorTKS = includeFixed ? staff.filter(s => s.status === 'TKS').reduce((sum, s) => sum + (s.baseHonor || 0), 0) : 0;
    
    const subtotalBPJS = Object.values(bpjsPools).reduce((a, b) => a + b, 0) + totalTransportDoc + totalHonorTKS;
    const subtotalYanmasum = yanmasumTotal;

    const totalBeban = subtotalBPJS + subtotalYanmasum;
    const profit = klaimTotal - totalBeban;
    const margin = klaimTotal > 0 ? (profit / klaimTotal) * 100 : 0;

    return { 
      klaimTotal, bpjsPools, totalTransportDoc, totalHonorTKS, 
      subtotalBPJS, subtotalYanmasum, totalBeban, profit, margin,
      hasBPJS, hasYan
    };
  }, [logs, globalMonth, globalYear, bpjsSettingsHistory, doctors, staff]);

  const handleAISuggestion = async () => {
    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analisis keuangan Rumah Sakit bulan ${globalMonth}/${globalYear}. Total Klaim: ${formatIDR(stats.klaimTotal)}. Total Beban Jasa: ${formatIDR(stats.totalBeban)}. Berikan 3 poin saran strategis singkat.`;
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt 
      });
      setAiSuggestion(response.text || "Saran tidak tersedia.");
    } catch (e) { 
      setAiSuggestion("Gagal menghubungi AI."); 
    } finally { 
      setLoadingAI(false); 
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
               <ShieldCheck size={18} className="text-blue-500" /> Analisis Beban Jasa Terverifikasi {globalMonth}/{globalYear}
            </h3>
            
            <div className={`grid grid-cols-1 ${stats.hasBPJS && stats.hasYan ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-12`}>
               {/* KOLOM I: BPJS & BIAYA TETAP (Hanya muncul jika ada data BPJS) */}
               {stats.hasBPJS && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Grup I: BPJS & Biaya Tetap Operasional</p>
                    </div>
                    <div className="space-y-3">
                      <ComponentRow label="Jasa Dokter Spesialis (BPJS)" value={stats.bpjsPools.spesialis} />
                      <ComponentRow label="Jasa Dokter Umum (BPJS)" value={stats.bpjsPools.gp} />
                      <ComponentRow label="Pool Perawat OK" value={stats.bpjsPools.paramOK} isPool />
                      <ComponentRow label="Pool Perawat ICU" value={stats.bpjsPools.paramICU} isPool />
                      <ComponentRow label="Pool Paramedis Umum" value={stats.bpjsPools.paramGen} isPool />
                      <ComponentRow label="Pool Manajemen/Casemix" value={stats.bpjsPools.pengelola} isPool />
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                         <ComponentRow label="Honor Dasar TKS (Flat)" value={stats.totalHonorTKS} isDb />
                         <ComponentRow label="Transport Dokter (Flat)" value={stats.totalTransportDoc} isDb />
                      </div>
                    </div>
                    <div className="mt-6 p-5 bg-blue-50/50 rounded-3xl flex justify-between items-center border border-blue-100">
                       <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Subtotal Jasa BPJS + Tetap</span>
                       <span className="text-sm font-black text-blue-900 font-mono">{formatIDR(stats.subtotalBPJS)}</span>
                    </div>
                 </div>
               )}

               {/* KOLOM II: YANMASUM MURNI (Hanya muncul jika ada data Yanmasum) */}
               {stats.hasYan && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Grup II: Jasa Yanmasum Murni</p>
                    </div>
                    <div className="space-y-3">
                      <ComponentRow label="Jasa Medis Pasien Umum" value={stats.subtotalYanmasum} color="emerald" />
                      <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                         <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic text-center">
                            "Menampilkan realisasi jasa variabel murni dari pembayaran umum. Biaya tetap (TKS & Transport) dialokasikan di Tab BPJS untuk menghindari double-counting."
                         </p>
                      </div>
                    </div>
                    <div className="mt-auto p-5 bg-emerald-50/50 rounded-3xl flex justify-between items-center border border-emerald-100">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Subtotal Jasa Yanmasum</span>
                       <span className="text-sm font-black text-emerald-900 font-mono">{formatIDR(stats.subtotalYanmasum)}</span>
                    </div>
                 </div>
               )}

               {/* TAMPILAN JIKA KOSONG */}
               {!stats.hasBPJS && !stats.hasYan && (
                 <div className="py-20 text-center">
                    <Wallet className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada data terverifikasi untuk periode ini</p>
                 </div>
               )}
            </div>

            {/* TOTAL BEBAN & PROFITABILITAS */}
            <div className="mt-12 p-10 bg-slate-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Landmark size={180} /></div>
               <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-emerald-500/20">
                       <TrendingDown className="text-emerald-400" size={40} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400 mb-2">Total Beban Jasa Tab Ini</p>
                       <h4 className="text-5xl font-black tracking-tighter font-mono">
                         {formatIDR(stats.totalBeban)}
                       </h4>
                    </div>
                  </div>
                  
                  <div className="text-right bg-white/5 p-8 rounded-[3rem] border border-white/10 min-w-[320px] backdrop-blur-sm">
                     <div className="flex items-center justify-end gap-3 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Profitabilitas Tab</p>
                        <Tooltip content="Selisih antara klaim masuk dan beban jasa di tab ini. Jika Tab BPJS + Tab Yanmasum digabung, maka total akan sinkron dengan Rekap Tagihan.">
                           <Info size={14} className="text-slate-500 cursor-help" />
                        </Tooltip>
                     </div>
                     <h4 className={`text-4xl font-black font-mono tracking-tighter ${stats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {formatIDR(stats.profit)}
                     </h4>
                     <div className="mt-3 flex items-center justify-end gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${stats.margin >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                           Margin: {stats.margin.toFixed(1)}%
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* AI PANEL */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl h-fit sticky top-24">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
              <BrainCircuit size={18} className="text-blue-500" /> AI Financial Advisory
           </h3>
           {loadingAI ? (
             <div className="py-12 text-center animate-pulse">
                <BrainCircuit className="mx-auto text-blue-500 mb-6 animate-bounce" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menganalisis Efisiensi...</p>
             </div>
           ) : aiSuggestion ? (
             <div className="prose prose-sm text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 italic relative shadow-inner">
                <div className="absolute -top-3 left-8 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase shadow-lg">Gemini Intelligence</div>
                <div className="whitespace-pre-line">{aiSuggestion}</div>
             </div>
           ) : (
             <div className="text-center py-10 space-y-6">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed px-6">Gunakan AI untuk mendapatkan strategi optimalisasi margin operasional jasa pelayanan bulan ini.</p>
                <button onClick={handleAISuggestion} className="px-8 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto active:scale-95">
                   Jalankan Analisis AI <ArrowRight size={16} />
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const ComponentRow = ({ label, value, isPool, isDb, color = 'blue' }: any) => {
  const dotColor = color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center justify-between group py-2 px-1 hover:bg-slate-50 rounded-xl transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} group-hover:scale-150 transition-transform`}></div>
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
           {label}
        </span>
        {isPool && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg ml-1">POOL</span>}
      </div>
      <span className="text-[12px] font-mono font-black text-slate-900">{formatIDR(value).replace('Rp', '').trim()}</span>
    </div>
  );
};

export default ServiceDetails;
