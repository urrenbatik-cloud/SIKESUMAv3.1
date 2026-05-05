
import React, { useState } from 'react';
import { Doctor } from '../types';
import { getDiffDays, formatIDR } from './Formatters';
import { Plus, Edit3, Trash2, Users, Search, X, Landmark, ShieldCheck, Car, Wallet } from 'lucide-react';

interface DoctorDataProps {
  doctors: Doctor[];
  onDoctorsChange: (newDoctors: Doctor[]) => void;
}

const DoctorData: React.FC<DoctorDataProps> = ({ doctors, onDoctorsChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState<Partial<Doctor>>({
    nama: '', spesialis: 'Bedah', status: 'Militer', mulaiDinas: '2020-01-01',
    wa: '', rekening: '', bank: 'BNI', pangkat: '', nrp: '', roles: ['Spesialis'],
    baseTransport: 0
  });

  const handleSave = () => {
    if (!formData.nama) return;
    if (editingId) {
      onDoctorsChange(doctors.map(d => d.id === editingId ? { ...d, ...formData as Doctor } : d));
    } else {
      onDoctorsChange([...doctors, { ...formData as Doctor, id: `dr-${Date.now()}` }]);
    }
    setShowModal(false);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Database Dokter</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Data Tenaga Ahli Medis</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({nama:'', spesialis:'Bedah', status:'Militer', baseTransport:0, bank:'BNI', mulaiDinas:'2020-01-01'}); setShowModal(true); }} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-xl active:scale-95"><Plus size={24} /></button>
      </div>

      <div className="p-4 border-b border-slate-50 no-print">
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Dokter..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {doctors.filter(d => d.nama.toLowerCase().includes(search.toLowerCase())).map(doc => {
          const service = getDiffDays(doc.mulaiDinas);
          return (
            <div key={doc.id} className="flex items-center gap-6 p-6 rounded-3xl border border-slate-100 hover:bg-blue-50/30 transition-all group relative">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-md border border-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all"><Users size={32} /></div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{doc.nama}</h4>
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded tracking-widest">{doc.spesialis}</span>
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded ml-1">{doc.status}</span>
                  <span className="text-[10px] font-black text-emerald-600 ml-2">Trans: {formatIDR(doc.baseTransport || 0)}</span>
                </div>
                <div className="mt-3 flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-500" /> {service.years} thn dinas</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all no-print">
                <button onClick={() => { setFormData(doc); setEditingId(doc.id); setShowModal(true); }} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Edit3 size={16} /></button>
                <button onClick={() => onDoctorsChange(doctors.filter(x => x.id !== doc.id))} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center relative">
              <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter w-full text-center">TAMBAH DOKTER</h3>
              <button onClick={() => setShowModal(false)} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 text-slate-900 transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NAMA DOKTER</label>
                 <input value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SPESIALISASI</label>
                    <select value={formData.spesialis} onChange={e => setFormData({...formData, spesialis: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:bg-white transition-all">
                       {['Bedah', 'Anestesi', 'Bedah Saraf', 'Umum', 'Penyakit Dalam', 'Anak', 'Obsgyn'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">STATUS</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:bg-white transition-all">
                       {['Militer', 'PNS', 'TKS', 'PPP3', 'Mitra'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </div>
              </div>
              
              <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 shadow-inner">
                 <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 mb-4 block">PENGATURAN TRANSPORT (OTOMATIS KE AUDIT)</label>
                 <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-400 transition-transform group-focus-within:scale-110"><Car size={24} /></div>
                    <input type="number" value={formData.baseTransport} onChange={e => setFormData({...formData, baseTransport: Number(e.target.value)})} placeholder="0" className="w-full pl-16 pr-6 py-6 bg-white border border-amber-200 rounded-3xl text-xl font-black text-amber-900 outline-none shadow-sm focus:ring-4 focus:ring-amber-100 transition-all" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BANK</label>
                    <select value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:bg-white transition-all">
                       {['BNI', 'BRI', 'BCA', 'Mandiri'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NO. REKENING</label>
                    <input value={formData.rekening} onChange={e => setFormData({...formData, rekening: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-900 outline-none focus:bg-white transition-all" />
                 </div>
              </div>

              <button onClick={handleSave} className="w-full py-6 bg-[#0f172a] text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98] mt-4">SIMPAN DATA MEDIS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorData;
