
import React, { useState, useMemo, useEffect } from 'react';
import { PatientClaim, Doctor, PatientCategory, TindakanItem, TabType, MinimizedForm } from '../types';
import { formatIDR } from './Formatters';
import { Plus, Search, Edit3, Trash2, X, Stethoscope, Info, AlertTriangle, Users, Minimize2 } from 'lucide-react';

interface ServiceLogProps {
  logs: PatientClaim[];
  onLogsChange: (newLogs: PatientClaim[]) => void;
  doctors: Doctor[];
  globalMonth?: number;
  globalYear?: number;
  activeTabType?: TabType;
  onMinimizeForm: (form: MinimizedForm) => void;
  reopenedForm: MinimizedForm | null;
  onReopenedFormHandled: () => void;
}

const ServiceLog: React.FC<ServiceLogProps> = ({ logs, onLogsChange, doctors, globalMonth, globalYear, activeTabType, onMinimizeForm, reopenedForm, onReopenedFormHandled }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState<Partial<PatientClaim>>({
    tanggalInput: new Date().toISOString().split('T')[0],
    sep: '', nama: '', nilaiKlaim: 0, status: 'Verifikasi',
    isBedah: false, isICU: false, isBedahSaraf: false, isJasaRaharja: false,
    dpjpUtama: '', drAnestesi: '', drKonsulen: '', drUmum: '', timRaber: [],
    diagnosa: '', bulan: globalMonth || new Date().getMonth() + 1, tahun: globalYear || new Date().getFullYear(),
    kategoriPasien: activeTabType === TabType.JASA_YANMASUM ? 'YANMASUM' : 'BPJS_UMUM',
    itemsTindakan: []
  });

  useEffect(() => {
    if (reopenedForm && reopenedForm.type === 'PATIENT_LOG') {
      setFormData(reopenedForm.data);
      setEditingId(reopenedIdHandled(reopenedForm.data.id));
      setShowModal(true);
      onReopenedFormHandled();
    }
  }, [reopenedForm]);

  const reopenedIdHandled = (id: string) => {
    return id.includes('draft') ? null : id;
  };

  const isYanmasumContext = activeTabType === TabType.JASA_YANMASUM;
  const isYanmasumMode = formData.kategoriPasien === 'YANMASUM' || formData.kategoriPasien === 'JASA_RAHARJA';

  const categoryOptions = useMemo(() => {
    if (isYanmasumContext) return [
      { id: 'YANMASUM', label: 'Mandiri / Yanmasum' },
      { id: 'JASA_RAHARJA', label: 'Jasa Raharja' }
    ];
    return [
      { id: 'BPJS_DINAS', label: 'BPJS Dinas' },
      { id: 'BPJS_UMUM', label: 'BPJS Umum' },
      { id: 'BPJS_PLUS_JR', label: 'BPJS + Jasa Raharja' }
    ];
  }, [isYanmasumContext]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = l.nama.toLowerCase().includes(search.toLowerCase()) || l.sep.includes(search);
      const matchContext = isYanmasumContext 
        ? (l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA')
        : (l.kategoriPasien === 'BPJS_DINAS' || l.kategoriPasien === 'BPJS_UMUM' || l.kategoriPasien === 'BPJS_PLUS_JR');
      const matchPeriod = l.bulan === globalMonth && l.tahun === globalYear;
      return matchSearch && matchContext && matchPeriod;
    }).sort((a, b) => new Date(b.tanggalInput).getTime() - new Date(a.tanggalInput).getTime());
  }, [logs, search, isYanmasumContext, globalMonth, globalYear]);

  const handleSave = () => {
    if (!formData.nama || !formData.sep || !formData.dpjpUtama) {
      alert("Mohon lengkapi data wajib (Nama Pasien, No. SEP, dan DPJP Utama)");
      return;
    }
    const payload = { ...formData, isJasaRaharja: formData.kategoriPasien === 'JASA_RAHARJA' || formData.kategoriPasien === 'BPJS_PLUS_JR' };
    if (editingId) {
      onLogsChange(logs.map(l => l.id === editingId ? { ...l, ...payload as PatientClaim } : l));
    } else {
      onLogsChange([...logs, { ...payload as PatientClaim, id: `log-${Date.now()}` }]);
    }
    setShowModal(false);
    setEditingId(null);
  };

  const handleMinimize = () => {
    const form: MinimizedForm = {
      id: editingId || `patient-draft-${Date.now()}`,
      type: 'PATIENT_LOG',
      data: { ...formData, id: editingId || `patient-draft-${Date.now()}` },
      title: formData.nama || 'Pasien Baru'
    };
    onMinimizeForm(form);
    setShowModal(false);
  };

  const handleEdit = (log: PatientClaim) => {
    setFormData({ ...log, itemsTindakan: log.itemsTindakan || [], timRaber: log.timRaber || [] });
    setEditingId(log.id);
    setShowModal(true);
  };

  const addTindakan = () => {
    const newItem: TindakanItem = { id: `tnd-${Date.now()}`, namaTindakan: '', jasaMedis: 0, jasaAnestesi: 0, jasaGP: 0, jasaParamedis: 0, jasaBHP: 0, jasaRS: 0 };
    setFormData({ ...formData, itemsTindakan: [...(formData.itemsTindakan || []), newItem] });
  };

  const updateTindakan = (id: string, field: keyof TindakanItem, val: any) => {
    const updated = (formData.itemsTindakan || []).map(item => item.id === id ? { ...item, [field]: val } : item);
    const totalKlaim = updated.reduce((s, i) => s + (i.jasaMedis + i.jasaAnestesi + i.jasaGP + i.jasaParamedis + i.jasaBHP + i.jasaRS), 0);
    setFormData({ ...formData, itemsTindakan: updated, nilaiKlaim: totalKlaim > 0 ? totalKlaim : formData.nilaiKlaim });
  };

  const toggleRaber = (drName: string) => {
    const current = formData.timRaber || [];
    if (current.includes(drName)) setFormData({...formData, timRaber: current.filter(n => n !== drName)});
    else setFormData({...formData, timRaber: [...current, drName]});
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Audit Berkas Medis {globalMonth}/{globalYear}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Pasien Per Kategori Khusus (Context: {isYanmasumContext ? 'Non-BPJS' : 'BPJS'})</p>
        </div>
        <div className="flex gap-3 no-print">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Pasien..." className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-50 w-64 shadow-sm" />
          </div>
          <button onClick={() => { setEditingId(null); setFormData({ ...formData, nama: '', sep: '', nilaiKlaim: 0, itemsTindakan: [], timRaber: [], kategoriPasien: isYanmasumContext ? 'YANMASUM' : 'BPJS_UMUM', bulan: globalMonth, tahun: globalYear }); setShowModal(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95"><Plus size={16} /> Input Pasien Baru</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="bg-[#0f172a] text-white font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Tgl Input</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Nama Pasien / SEP</th>
              <th className="px-6 py-4">DPJP Utama</th>
              <th className="px-6 py-4 text-right">Nilai Klaim</th>
              <th className="px-6 py-4 text-center">Status Skenario</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.map(l => (
              <tr key={l.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-400">{l.tanggalInput}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">{l.kategoriPasien.replace(/_/g, ' ')}</span></td>
                <td className="px-6 py-4">
                   <p className="font-black text-slate-900 uppercase">{l.nama}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{l.sep}</p>
                </td>
                <td className="px-6 py-4">
                   <p className="font-bold text-blue-600 uppercase text-[10px]">{l.dpjpUtama}</p>
                   {l.timRaber && l.timRaber.length > 0 && <p className="text-[8px] font-black text-slate-400 uppercase">Team: {l.timRaber.length} Dr.</p>}
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-blue-600">{formatIDR(l.nilaiKlaim).replace('Rp', '')}</td>
                <td className="px-6 py-4 text-center">
                   <div className="flex justify-center gap-2">
                      {l.isBedahSaraf && <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Bedah Saraf</span>}
                      {l.isICU && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">ICU</span>}
                      {l.isBedah && !l.isICU && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Bedah</span>}
                   </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEdit(l)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-blue-600 transition-all"><Edit3 size={14} /></button>
                    <button onClick={() => onLogsChange(logs.filter(x => x.id !== l.id))} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:text-red-600 transition-all"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
            <div className="p-10 border-b flex justify-between items-center bg-white flex-shrink-0">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Edit' : 'Input'} Berkas Pasien</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">RS Tk.IV Batin Tikal - Periode {globalMonth}/{globalYear}</p>
               </div>
               <div className="flex gap-3">
                  <button onClick={handleMinimize} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all" title="Minimize Form"><Minimize2 size={20} /></button>
                  <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                  <div className="space-y-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Informasi Administratif</p>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategori Klaim</label>
                        <select value={formData.kategoriPasien} onChange={e => setFormData({...formData, kategoriPasien: e.target.value as PatientCategory})} className="bg-white border rounded-xl px-4 py-2.5 text-xs font-black outline-none border-slate-200 text-blue-600 shadow-sm">
                           {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                     </div>
                     <InputGroup label="Nama Lengkap Pasien" value={formData.nama} onChange={v => setFormData({...formData, nama: v})} />
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Nomor SEP / Kwitansi" value={formData.sep} onChange={v => setFormData({...formData, sep: v})} />
                        <InputGroup label="Nilai Klaim (Total)" value={formData.nilaiKlaim} type="number" onChange={v => setFormData({...formData, nilaiKlaim: Number(v)})} />
                     </div>
                     <InputGroup label="Diagnosa Utama" value={formData.diagnosa} onChange={v => setFormData({...formData, diagnosa: v})} />
                  </div>

                  <div className="space-y-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Skenario Medis & Tim Pelaksana</p>
                     <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                        <CheckboxGroup label="Tindakan Bedah / Operasi" checked={formData.isBedah} onChange={v => setFormData({...formData, isBedah: v})} />
                        <CheckboxGroup label="Perawatan Ruang ICU" checked={formData.isICU} onChange={v => setFormData({...formData, isICU: v})} />
                        <div className="h-px bg-slate-100"></div>
                        <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" checked={formData.isBedahSaraf} onChange={e => setFormData({...formData, isBedahSaraf: e.target.checked})} className="w-5 h-5 rounded-lg border-amber-300 text-amber-600 focus:ring-amber-500" />
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-amber-600">Dokter Spesialis Bedah Saraf</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Aktifkan Perhitungan Flat (6jt / 9jt)</span>
                           </div>
                        </label>
                     </div>

                     <SelectGroup label="DPJP Utama (Spesialis)" value={formData.dpjpUtama} options={doctors.map(d => d.nama)} onChange={v => setFormData({...formData, dpjpUtama: v})} />
                     
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Tim Raber (Rawat Bersama)</label>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto shadow-inner">
                           {doctors.filter(d => d.nama !== formData.dpjpUtama).map(d => (
                              <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-lg">
                                 <input type="checkbox" checked={formData.timRaber?.includes(d.nama)} onChange={() => toggleRaber(d.nama)} className="w-4 h-4 rounded text-blue-600" />
                                 <span className="text-[9px] font-bold text-slate-600 uppercase truncate">{d.nama}</span>
                              </label>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <SelectGroup label="Dokter Anestesi" value={formData.drAnestesi} options={doctors.filter(d => d.spesialis === 'Anestesi').map(d => d.nama)} onChange={v => setFormData({...formData, drAnestesi: v})} />
                        <SelectGroup label="Dokter Umum" value={formData.drUmum} options={doctors.filter(d => d.spesialis === 'Umum').map(d => d.nama)} onChange={v => setFormData({...formData, drUmum: v})} />
                     </div>
                  </div>
               </div>

               {isYanmasumMode && (
                  <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6 animate-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg"><Info size={16} /></div>
                           <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tighter">Detail Item Jasa Yanmasum</h4>
                        </div>
                        <button onClick={addTindakan} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-lg transition-all active:scale-95">+ Tambah Item Jasa</button>
                     </div>
                     <div className="overflow-x-auto bg-white rounded-3xl border border-emerald-100 shadow-inner">
                        <table className="w-full text-left text-[10px]">
                           <thead className="bg-emerald-900 text-white uppercase font-black tracking-widest">
                              <tr>
                                 <th className="px-4 py-4">Nama Tindakan / Layanan</th>
                                 <th className="px-4 py-4 text-right">Jasa Medis</th>
                                 <th className="px-4 py-4 text-right">Jasa RS (Ops)</th>
                                 <th className="px-4 py-4 text-right">BHP</th>
                                 <th className="px-2 py-4 w-12 text-center">X</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-emerald-50">
                              {(formData.itemsTindakan || []).map(it => (
                                 <tr key={it.id}>
                                    <td className="px-4 py-3"><input value={it.namaTindakan} onChange={e => updateTindakan(it.id, 'namaTindakan', e.target.value)} className="w-full border-none font-bold outline-none focus:text-emerald-600" placeholder="..." /></td>
                                    <td className="px-4 py-3"><input type="number" value={it.jasaMedis} onChange={e => updateTindakan(it.id, 'jasaMedis', Number(e.target.value))} className="w-full text-right border-none font-mono font-black" /></td>
                                    <td className="px-4 py-3"><input type="number" value={it.jasaRS} onChange={e => updateTindakan(it.id, 'jasaRS', Number(e.target.value))} className="w-full text-right border-none font-mono text-slate-400" /></td>
                                    <td className="px-4 py-3"><input type="number" value={it.jasaBHP} onChange={e => updateTindakan(it.id, 'jasaBHP', Number(e.target.value))} className="w-full text-right border-none font-mono text-slate-400" /></td>
                                    <td className="px-2 py-3 text-center"><button onClick={() => setFormData({...formData, itemsTindakan: formData.itemsTindakan?.filter(x => x.id !== it.id)})} className="text-rose-300 hover:text-rose-500"><Trash2 size={14} /></button></td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot className="bg-emerald-50 font-black">
                              <tr>
                                 <td className="px-4 py-4 uppercase text-emerald-800 tracking-widest text-[8px]">Total Itemized Claim:</td>
                                 <td colSpan={4} className="px-4 py-4 text-right font-mono text-emerald-700 text-lg">{formatIDR((formData.itemsTindakan || []).reduce((s,i) => s + i.jasaMedis + i.jasaRS + i.jasaBHP, 0))}</td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                  </div>
               )}
            </div>

            <div className="flex justify-end gap-4 border-t p-10 flex-shrink-0">
               <button onClick={() => setShowModal(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
               <button onClick={handleSave} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2">Verifikasi & Simpan Berkas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type = 'text' }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all shadow-sm" />
  </div>
);

const SelectGroup = ({ label, value, options, onChange }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none cursor-pointer focus:ring-4 focus:ring-blue-50 transition-all shadow-sm">
      <option value="">Pilih Dokter...</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const CheckboxGroup = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" />
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-600 transition-colors">{label}</span>
  </label>
);

export default ServiceLog;
