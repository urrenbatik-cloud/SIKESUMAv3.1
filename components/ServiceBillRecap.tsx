
import React, { useMemo, useState } from 'react';
import { PatientClaim, BPJSCalcSettings, Doctor, Employee, JasaVerificationFiles, ProcurementFile } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR } from './Formatters';
import { supabase } from '../lib/supabase';
import { toast } from './Toast';
import { 
  Receipt, ArrowRight, Printer, Download, Info, CheckCircle2, Wallet, Coins, UserCog, Tags, 
  Upload, FileText, Trash2, File, Eye, Settings, ChevronDown, Loader2 
} from 'lucide-react';

// [F2.2 v2] Storage constants — must match F2_2_STORAGE_SETUP.sql config
const STORAGE_BUCKET = 'jasa-verification';
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE_MB = 10;

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
  // [F2.2 v2] Watchpoint v1.0 #6 #2 fix: zero-padded periodKey (Mei 2025 → '2025-05' not '2025-5')
  const periodKey = `${globalYear}-${String(globalMonth).padStart(2, '0')}`;
  const currentFiles = jasaVerificationFiles[periodKey] || { tks: [], nakes: [], pengelola: [] };
  // [F2.2 v2] Upload state untuk loading indicator per category
  const [uploadingFor, setUploadingFor] = useState<'tks' | 'nakes' | 'pengelola' | null>(null);

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

  // [F2.2 v2] Refactor: upload ke Supabase Storage bucket 'jasa-verification' (was URL.createObjectURL blob)
  // Folder structure: {periodKey}/{category}/{fileId}-{safeFilename}
  const handleFileUpload = async (category: 'tks' | 'nakes' | 'pengelola', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesToUpload = Array.from(e.target.files) as File[];

    // [F2.2 v2] Client-side validation (size + MIME) sebelum upload
    for (const f of filesToUpload) {
      if (!ALLOWED_MIME.includes(f.type)) {
        // [F2.4 v2] Replace alert dengan toast.error untuk better UX
        toast.error(`File "${f.name}" ditolak: tipe ${f.type || 'unknown'} tidak didukung. Hanya PDF, PNG, JPEG.`, 5000);
        e.target.value = '';
        return;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        // [F2.4 v2] Replace alert dengan toast.error
        toast.error(`File "${f.name}" ditolak: ukuran ${(f.size / 1024 / 1024).toFixed(2)} MB melebihi batas ${MAX_FILE_SIZE_MB} MB.`, 5000);
        e.target.value = '';
        return;
      }
    }

    setUploadingFor(category);
    try {
      const newFiles: ProcurementFile[] = [];
      for (const f of filesToUpload) {
        const fileId = `jasa-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        // Sanitize filename: keep only alphanumeric, dot, dash, underscore
        const safeFilename = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${periodKey}/${category}/${fileId}-${safeFilename}`;

        const { error: uploadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, f, {
            contentType: f.type,
            upsert: false,
          });

        if (uploadErr) {
          console.error('❌ Upload gagal:', uploadErr);
          // [F2.4 v2] Replace alert dengan toast.error
          toast.error(`Upload "${f.name}" gagal: ${uploadErr.message}`, 6000);
          continue;
        }

        // Get public URL (bucket is public, no signed URL needed for Phase 2)
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath);

        newFiles.push({
          id: fileId,
          namaFile: f.name,
          tipe: f.type,
          size: (f.size / 1024).toFixed(1) + ' KB',
          url: urlData.publicUrl,
        });
      }

      if (newFiles.length > 0) {
        onJasaVerificationFilesChange({
          ...jasaVerificationFiles,
          [periodKey]: {
            ...currentFiles,
            [category]: [...(currentFiles[category] || []), ...newFiles],
          },
        });
        console.log(`✅ ${newFiles.length} file(s) uploaded to Storage`, { periodKey, category });
        // [F2.4 v2] Toast success dengan specific count + reminder untuk sync
        const fileLabel = newFiles.length === 1 ? newFiles[0].namaFile : `${newFiles.length} berkas`;
        toast.success(`✅ ${fileLabel} berhasil di-upload. Klik tombol Sync untuk persist.`);
      }
    } catch (err: any) {
      console.error('❌ Upload exception:', err);
      // [F2.4 v2] Replace alert dengan toast.error
      toast.error(`Upload gagal: ${err?.message || 'Unknown error'}`, 6000);
    } finally {
      setUploadingFor(null);
      e.target.value = ''; // reset input untuk allow re-upload same filename
    }
  };

  // [F2.2 v2] Delete dari Storage bucket + state
  // URL pattern: https://{project}.supabase.co/storage/v1/object/public/jasa-verification/{path}
  const deleteFile = async (category: 'tks' | 'nakes' | 'pengelola', fileId: string) => {
    const file = (currentFiles[category] || []).find(f => f.id === fileId);
    if (!file) return;

    // Try delete from Storage bucket (best-effort — proceed dengan state update kalau gagal)
    if (file.url) {
      const marker = `/${STORAGE_BUCKET}/`;
      const idx = file.url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(file.url.substring(idx + marker.length));
        const { error: removeErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([storagePath]);
        if (removeErr) {
          console.warn('⚠️ Storage delete failed (proceeding dengan state update):', removeErr);
          // [F2.4 v2] Toast warning kalau Storage delete gagal (state tetap di-update)
          toast.warning(`Storage delete gagal: ${removeErr.message}. State tetap di-update.`, 5000);
        } else {
          console.log('✅ File deleted from Storage:', storagePath);
        }
      }
    }

    // Update state regardless (consistent UX even kalau Storage delete fails)
    onJasaVerificationFilesChange({
      ...jasaVerificationFiles,
      [periodKey]: {
        ...currentFiles,
        [category]: (currentFiles[category] || []).filter(f => f.id !== fileId),
      },
    });
    // [F2.4 v2] Toast success info
    toast.success(`✅ "${file.namaFile}" dihapus. Klik Sync untuk persist.`);
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
                <FileUploadSection category="tks" files={currentFiles.tks} onUpload={(e: any) => handleFileUpload('tks', e)} onDelete={(id: any) => deleteFile('tks', id)} isUploading={uploadingFor === 'tks'} />
              </div>
              <div className="space-y-4">
                <RecapCard title="Honor Tenaga Kesehatan" desc="Transport Dokter + Jasa Medis" value={recapData.jasaNakes} icon={<Coins size={28} />} color="blue" account={jasaAccountMap.nakes} />
                <FileUploadSection category="nakes" files={currentFiles.nakes} onUpload={(e: any) => handleFileUpload('nakes', e)} onDelete={(id: any) => deleteFile('nakes', id)} isUploading={uploadingFor === 'nakes'} />
              </div>
              <div className="space-y-4">
                <RecapCard title="Honor Pengelola" desc="Manajemen, Casemix, & Tim Verifikasi" value={recapData.jasaPengelola} icon={<UserCog size={28} />} color="emerald" account={jasaAccountMap.pengelola} />
                <FileUploadSection category="pengelola" files={currentFiles.pengelola} onUpload={(e: any) => handleFileUpload('pengelola', e)} onDelete={(id: any) => deleteFile('pengelola', id)} isUploading={uploadingFor === 'pengelola'} />
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

const FileUploadSection = ({ category, files, onUpload, onDelete, isUploading }: any) => (
  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4 no-print">
     <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Berkas Verifikasi</span>
        {isUploading ? (
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shadow-sm border border-blue-100 flex items-center gap-1">
            <Loader2 size={14} className="animate-spin"/>
            <span className="text-[8px] font-black uppercase tracking-widest">Uploading...</span>
          </div>
        ) : (
          <label className="cursor-pointer p-2 bg-white rounded-xl text-blue-600 shadow-sm border border-blue-50 hover:bg-blue-50 transition-all">
             <Upload size={14}/>
             <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={onUpload} className="hidden" />
          </label>
        )}
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
