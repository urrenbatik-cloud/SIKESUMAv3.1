
import React, { useState } from 'react';
import { Employee } from '../types';
import { getDiffDays, formatIDR } from './Formatters';
import { Plus, Edit3, Trash2, Users, Search, X, Briefcase, FileBadge, Coins } from 'lucide-react';

interface StaffDataProps {
  staff: Employee[];
  onStaffChange: (newStaff: Employee[]) => void;
}

const StaffData: React.FC<StaffDataProps> = ({ staff, onStaffChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const roleOptions = ['Paramedis Umum', 'Perawat OK', 'Perawat ICU', 'Penata Anestesi', 'Manajemen', 'Casemix', 'Pengelola'];

  const [formData, setFormData] = useState<Partial<Employee>>({
    nama: '', pendidikan: '', status: 'TKS', mulaiDinas: '2020-01-01',
    wa: '', rekening: '', bank: 'BNI', roles: [],
    baseHonor: 0
  });

  const handleSave = () => {
    if (!formData.nama) return;
    if (editingId) {
      onStaffChange(staff.map(s => s.id === editingId ? { ...s, ...formData as Employee } : s));
    } else {
      onStaffChange([...staff, { ...formData as Employee, id: `stf-${Date.now()}` }]);
    }
    setShowModal(false);
  };

  const toggleRole = (role: string) => {
    const current = formData.roles || [];
    if (current.includes(role)) setFormData({ ...formData, roles: current.filter(r => r !== role) });
    else setFormData({ ...formData, roles: [...current, role] });
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Database Pegawai</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Data Tenaga Penunjang</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({nama:'', status:'TKS', baseHonor:3000000, roles:[], bank:'BNI', mulaiDinas:'2020-01-01'}); setShowModal(true); }} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl active:scale-95"><Plus size={24} /></button>
      </div>

      <div className="p-4 border-b border-slate-50 no-print">
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Pegawai..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none" />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {staff.filter(s => s.nama.toLowerCase().includes(search.toLowerCase())).map(item => {
          return (
            <div key={item.id} className="flex items-center gap-5 p-5 rounded-3xl border border-slate-50 hover:bg-emerald-50/30 transition-all group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Users size={24} /></div>
              <div className="flex-1">
                 <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.nama}</h4>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.roles.join(', ')}</p>
                 <div className="mt-2 flex gap-3 items-center text-[8px] font-bold uppercase tracking-widest text-emerald-600">
                    <span>{item.status}</span>
                    <span className="text-slate-200">|</span>
                    <span>Honor: {formatIDR(item.baseHonor || 0)}</span>
                 </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all no-print">
                <button onClick={() => { setFormData(item); setEditingId(item.id); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => onStaffChange(staff.filter(x => x.id !== item.id))} className="p-1.5 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-10 space-y-6">
              <InputSmall label="Nama Lengkap" value={formData.nama} onChange={v => setFormData({...formData, nama: v})} />
              <div className="grid grid-cols-2 gap-4">
                 <InputSmall label="Pendidikan" value={formData.pendidikan} onChange={v => setFormData({...formData, pendidikan: v})} />
                 <SelectSmall label="Status" value={formData.status} options={['Militer', 'PNS', 'TKS', 'PPP3', 'Mitra']} onChange={v => setFormData({...formData, status: v})} />
              </div>
              
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                 <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1 mb-2 block">Pengaturan Honor (Khusus TKS)</label>
                 <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                    <input type="number" value={formData.baseHonor} onChange={e => setFormData({...formData, baseHonor: Number(e.target.value)})} placeholder="Rp 0" className="w-full pl-12 pr-4 py-4 bg-white border border-emerald-200 rounded-2xl text-sm font-black text-emerald-900 outline-none shadow-inner" />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Peran:</label>
                 <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                   {roleOptions.map(r => (
                     <label key={r} className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" checked={formData.roles?.includes(r)} onChange={() => toggleRole(r)} className="w-4 h-4 rounded text-emerald-600 border-slate-300" />
                       <span className="text-[9px] font-bold text-slate-500 uppercase">{r}</span>
                     </label>
                   ))}
                 </div>
              </div>

              <button onClick={handleSave} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">Simpan Data Pegawai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputSmall = ({ label, value, onChange, type='text' }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 transition-all" />
  </div>
);

const SelectSmall = ({ label, value, options, onChange }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold text-slate-900 outline-none cursor-pointer">
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default StaffData;
