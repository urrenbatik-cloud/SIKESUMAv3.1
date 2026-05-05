
import React, { useMemo, useState } from 'react';
import { PatientClaim, BPJSCalcSettings, Doctor, Employee, JasaVerificationFiles, ProcurementFile } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR } from './Formatters';
import { 
  Receipt, ArrowRight, Printer, Download, Info, CheckCircle2, Wallet, Coins, UserCog, Tags, 
  Upload, FileText, Trash2, File, Eye, Settings, ChevronDown 
} from 'lucide-react';

interface ServiceBillRecapProps {
  logs: PatientClaim[];
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  globalMonth: number;
  globalYear: number;
  doctors: Doctor[];
  staff: Employee[];
  jasaVerificationFiles: JasaVerificationFiles;
  onJasaVerificationFilesChange: (files: JasaVerificationFiles) => void;
  jasaAccountMap: { tks: string; nakes: string; pengelola: string };
  onJasaAccountMapChange: (newMap: { tks: string; nakes: string; pengelola: string }) => void;
}

const ServiceBillRecap: React.FC<ServiceBillRecapProps> = ({ 
  logs, bpjsSettingsHistory, globalMonth, globalYear, doctors, staff,
  jasaVerificationFiles, onJasaVerificationFilesChange,
  jasaAccountMap, onJasaAccountMapChange
}) => {
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const periodKey = `${globalYear}-${globalMonth}`;
  const currentFiles = jasaVerificationFiles[periodKey] || { tks: [], nakes: [], pengelola: [] };

  const recapData = useMemo(() => {
    const periodLogs = logs.filter(l => l.tahun === globalYear && l.bulan === globalMonth && l.status === 'Verifikasi');
    const settings = getEffectiveSettings(globalYear, globalMonth, bpjsSettingsHistory);
    let total = { tksFlat: 0, jasaNakes: 0, jasaPengelola: 0 };
    const baseStaff = staff.filter(s => s.status === 'TKS').reduce((sum, s) => sum + (s.baseHonor || 0), 0);
    total.tksFlat = baseStaff;
    const baseDocsTransport = doctors.reduce((sum, d) => sum + (d.baseTransport || 0), 0);
    total.jasaNakes += baseDocsTransport;
    periodLogs.forEach(l => {
      const f = calculatePatientFees(l, settings);
      total.jasaNakes += (f.spesialis + f.anestesi + f.gp + f.konsul + f.paramOK + f.paramICU + f.paramGen + f.penataAnestesi);
      total.jasaPengelola += (f.pengelola + f.manajemen + f.casemix);
    });
    return total;
  }, [logs, bpjsSettingsHistory, globalMonth, globalYear, doctors, staff]);

  const handleFileUpload = (category: 'tks' | 'nakes' | 'pengelola', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: ProcurementFile[] = (Array.from(e.target.files) as File[]).map(f => ({
        id: `jasa-file-${Date.now()}-${Math.random()}`,
        namaFile: f.name,
        tipe: f.type,
        size: (f.size / 1024).toFixed(1) + ' KB',
        url: URL.createObjectURL(f)
      }));
      onJasaVerificationFilesChange({
        ...jasaVerificationFiles,
        [periodKey]: {
          ...currentFiles,
          [category]: [...(currentFiles[category] || []), ...newFiles]
        }
      });
    }
  };

  const deleteFile = (category: 'tks' | 'nakes' | 'pengelola', fileId: string) => {
    onJasaVerificationFilesChange({
      ...jasaVerificationFiles,
      [periodKey]: {
        ...currentFiles,
        [category]: (currentFiles[category] || []).filter(f => f.id !== fileId)
      }
    });
  };

  const grandTotal = recapData.tksFlat + recapData.jasaNakes + recapData.jasaPengelola;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* HEADER & ACCOUNT CODE SETTINGS */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10">
           <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-6">
                 <div className="p-5 bg-slate-900 rounded-[2rem] text-white shadow-xl"><Receipt size={32} /></div>
                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Integrasi Sub-Mata Anggaran (Pagu Jasa)</h3>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                       Rekap Audit Jasa <span className="text-blue-600 font-mono">521115.xx</span>
                    </h2>
                 </div>
              </div>
              <div className="flex gap-3 no-print">
                 <button onClick={() => setShowAccountSettings(!showAccountSettings)} className={`p-4 rounded-2xl transition-all shadow-xl flex items-center gap-2 ${showAccountSettings ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <Settings size={20} className={showAccountSettings ? 'animate-spin-slow' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Edit Kode Akun</span>
                 </button>
                 <button className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-emerald-600 transition-all"><Download size={20} /></button>
              </div>
           </div>

           {showAccountSettings && (
             <div className="mb-10 bg-slate-900 p-8 rounded-[2.5rem] text-white animate-in slide-in-from-top-4 duration-500 shadow-2xl border-b-4 border-blue-500">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-blue-500 rounded-xl"><Tags size={16} /></div>
                   <h4 className="text-sm font-black uppercase tracking-widest">Pemetaan Kode Akun Jasa</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <AccountInput label="Kode Honor TKS" value={jasaAccountMap.tks} onChange={(v) => onJasaAccountMapChange({...jasaAccountMap, tks: v})} />
                   <AccountInput label="Kode Honor Nakes" value={jasaAccountMap.nakes} onChange={(v) => onJasaAccountMapChange({...jasaAccountMap, nakes: v})} />
                   <AccountInput label="Kode Honor Pengelola" value={jasaAccountMap.pengelola} onChange={(v) => onJasaAccountMapChange({...jasaAccountMap, pengelola: v})} />
                </div>
                <p className="mt-6 text-[9px] font-bold text-slate-500 italic uppercase">Perubahan ini akan otomatis menyesuaikan laporan di Tab Pagu dan Realisasi Anggaran (LRA).</p>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <RecapCard title="Honor Tenaga Lepas (TKS)" desc="Gaji Pokok Flat Seluruh Pegawai TKS" value={recapData.tksFlat} icon={<Wallet size={28} />} color="slate" account={jasaAccountMap.tks} />
                <FileUploadSection category="tks" files={currentFiles.tks} onUpload={(e) => handleFileUpload('tks', e)} onDelete={(id) => deleteFile('tks', id)} />
              </div>
              <div className="space-y-4">
                <RecapCard title="Honor Tenaga Kesehatan" desc="Transport Dokter + Jasa Medis" value={recapData.jasaNakes} icon={<Coins size={28} />} color="blue" account={jasaAccountMap.nakes} />
                <FileUploadSection category="nakes" files={currentFiles.nakes} onUpload={(e) => handleFileUpload('nakes', e)} onDelete={(id) => deleteFile('nakes', id)} />
              </div>
              <div className="space-y-4">
                <RecapCard title="Honor Pengelola" desc="Manajemen, Casemix, & Tim Verifikasi" value={recapData.jasaPengelola} icon={<UserCog size={28} />} color="emerald" account={jasaAccountMap.pengelola} />
                <FileUploadSection category="pengelola" files={currentFiles.pengelola} onUpload={(e) => handleFileUpload('pengelola', e)} onDelete={(id) => deleteFile('pengelola', id)} />
              </div>
           </div>

           <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border-b-8 border-emerald-500">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Receipt size={40} /></div>
                 <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Total Tagihan Akun Jasa (Gaji Bruto)</p>
                    <h4 className="text-5xl font-black font-mono tracking-tighter">{formatIDR(grandTotal)}</h4>
                 </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-4">
                 <CheckCircle2 size={32} className="text-emerald-400" />
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alamat Kode Akun Utama</p>
                    <p className="text-sm font-black text-white font-mono uppercase tracking-widest">521115 - AKTIF (DINAMIS)</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AccountInput = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
     <input value={value} onChange={(e) => onChange(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black font-mono text-emerald-400 outline-none focus:bg-white/10 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="X.X.X.X" />
  </div>
);

const FileUploadSection = ({ category, files, onUpload, onDelete }: any) => (
  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4 no-print">
     <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Berkas Verifikasi</span>
        <label className="cursor-pointer p-2 bg-white rounded-xl text-blue-600 shadow-sm border border-blue-50 hover:bg-blue-50 transition-all">
           <Upload size={14}/>
           <input type="file" multiple onChange={onUpload} className="hidden" />
        </label>
     </div>
     <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide">
        {files.length > 0 ? files.map((f: any) => (
           <div key={f.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 group">
              <div className="flex items-center gap-2 min-w-0">
                 <FileText size={14} className="text-slate-400 shrink-0" />
                 <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold text-slate-600 truncate uppercase">{f.namaFile}</span>
                    <span className="text-[7px] font-black text-slate-300 uppercase">{f.size}</span>
                 </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {f.url && (
                    <>
                       <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 p-1"><Eye size={12}/></a>
                       <a href={f.url} download={f.namaFile} className="text-emerald-400 hover:text-emerald-600 p-1"><Download size={12}/></a>
                    </>
                 )}
                 <button onClick={() => onDelete(f.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={12}/></button>
              </div>
           </div>
        )) : (
           <div className="text-center py-4 border border-dashed border-slate-300 rounded-2xl">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Belum ada dokumen diupload</p>
           </div>
        )}
     </div>
  </div>
);

const RecapCard = ({ title, desc, value, icon, color, account }: any) => {
  const colors: any = {
    slate: "bg-slate-50 border-slate-100 text-slate-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600"
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border group hover:shadow-xl transition-all duration-500 ${colors[color]} relative`}>
       <div className="absolute top-8 right-8 flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <Tags size={14}/> <span className="text-[10px] font-black font-mono">{account}</span>
       </div>
       <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">{icon}</div>
          <ArrowRight size={20} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
       </div>
       <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2">{title}</h4>
       <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed mb-6">{desc}</p>
       <div className="pt-6 border-t border-slate-200/50">
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{formatIDR(value)}</p>
       </div>
    </div>
  );
};

export default ServiceBillRecap;
