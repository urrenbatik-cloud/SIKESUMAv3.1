
import React, { useState, useMemo } from 'react';
import { PatientClaim, Doctor, Employee, ServiceDetailState, BPJSCalcSettings, TabType } from '../types';
import { calculatePatientFees, getEffectiveSettings } from '../utils/feeCalculation';
import { formatIDR, calculatePPH21 } from './Formatters';
import { Landmark, Search, ChevronDown, CheckCircle, Wallet, Coins, AlertTriangle, Stethoscope, Info, Users, ArrowRightLeft } from 'lucide-react';

interface PayrollDetailProps {
  logs: PatientClaim[];
  onLogsChange: (newLogs: PatientClaim[]) => void;
  doctors: Doctor[];
  staff: Employee[];
  fees: ServiceDetailState;
  onFeesChange: (newFees: ServiceDetailState) => void;
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  globalMonth?: number;
  globalYear?: number;
  activeTabType?: TabType;
}

const PayrollDetail: React.FC<PayrollDetailProps> = ({ logs, doctors, staff, bpjsSettingsHistory, activeTabType, globalMonth, globalYear }) => {
  const [searchName, setSearchName] = useState('');
  const [activeRole, setActiveRole] = useState('DOKTER_SPESIALIS');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const roles = [
    { id: 'DOKTER_SPESIALIS', label: 'Dokter Spesialis' },
    { id: 'DOKTER_UMUM', label: 'Dokter Umum' },
    { id: 'PERAWAT_OK', label: 'Perawat OK' },
    { id: 'PERAWAT_ICU', label: 'Perawat ICU' },
    { id: 'PARAMEDIS_UMUM', label: 'Paramedis Umum' },
    { id: 'ADMIN_CASEMIX', label: 'Manajemen & Casemix' }
  ];

  const payrollData = useMemo(() => {
    // Filter berkas yang lunas/verifikasi di bulan & tahun terpilih
    const periodLogs = logs.filter(l => 
      l.status === 'Verifikasi' && 
      l.bulan === globalMonth && 
      l.tahun === globalYear
    );

    // 1. HITUNG POOL JASA UNTUK STAF (NON-DOKTER)
    const pools = {
      paramOK: 0, paramICU: 0, paramGen: 0, 
      manajemen: 0, casemix: 0, pengelola: 0
    };

    periodLogs.forEach(l => {
      const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
      const f = calculatePatientFees(l, s);
      pools.paramOK += f.paramOK;
      pools.paramICU += f.paramICU;
      pools.paramGen += f.paramGen;
      pools.manajemen += f.manajemen;
      pools.casemix += f.casemix;
      pools.pengelola += f.pengelola;
    });

    // 2. LOGIKA UNTUK DOKTER
    if (activeRole.startsWith('DOKTER')) {
      const isSpec = activeRole === 'DOKTER_SPESIALIS';
      const targetDoctors = doctors.filter(d => {
        const matchType = isSpec ? (d.spesialis !== 'Umum') : (d.spesialis === 'Umum');
        return d.nama.toLowerCase().includes(searchName.toLowerCase()) && matchType;
      });

      return targetDoctors.map(doc => {
        let bpjsJasa = 0;
        let yanJasa = 0;
        const attachments: any[] = [];
        const docName = doc.nama.trim().toLowerCase();

        periodLogs.forEach(l => {
          const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
          const b = calculatePatientFees(l, s);
          let earning = 0;
          let roleLabel = '';
          const isYan = l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA';

          if (l.dpjpUtama?.trim().toLowerCase() === docName) { earning += b.spesialis; roleLabel = 'DPJP'; }
          if (l.drAnestesi?.trim().toLowerCase() === docName) { earning += b.anestesi; roleLabel += ' + Anes'; }
          if (l.drUmum?.trim().toLowerCase() === docName) { earning += b.gp; roleLabel = 'DR Umum'; }
          if (l.drKonsulen?.trim().toLowerCase() === docName) { earning += b.konsul; roleLabel = 'Konsul'; }

          if (earning > 0) {
            if (isYan) yanJasa += earning; else bpjsJasa += earning;
            attachments.push({ 
              id: l.id, sep: l.sep, patient: l.nama, role: roleLabel, fee: earning, 
              isYan, isSaraf: l.isBedahSaraf, tindakan: l.itemsTindakan || [] 
            });
          }
        });

        const transport = doc.baseTransport || 0;
        const gross = bpjsJasa + yanJasa + transport;
        const tax = calculatePPH21(gross);
        return { id: doc.id, name: doc.nama, status: doc.status, transport, bpjsJasa, yanJasa, gross, tax, net: gross - tax, attachments, roles: [doc.spesialis] };
      });
    }

    // 3. LOGIKA UNTUK STAF (BAGI HASIL POOL)
    const targetStaff = staff.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(searchName.toLowerCase());
      const roleMap: Record<string, string> = {
        'PERAWAT_OK': 'Perawat OK',
        'PERAWAT_ICU': 'Perawat ICU',
        'PARAMEDIS_UMUM': 'Paramedis Umum',
        'ADMIN_CASEMIX': 'Manajemen' // or 'Casemix' or 'Pengelola'
      };
      const targetRole = roleMap[activeRole];
      
      let matchRole = false;
      if (activeRole === 'ADMIN_CASEMIX') {
        matchRole = s.roles.some(r => ['Manajemen', 'Casemix', 'Pengelola'].includes(r));
      } else {
        matchRole = s.roles.includes(targetRole);
      }
      return matchSearch && matchRole;
    });

    return targetStaff.map(s => {
      let bpjsJasa = 0;
      let yanJasa = 0; // Yanmasum biasanya langsung ke Dokter, Staf ambil dari pool manajemen

      // Hitung pembagi (berapa orang yang punya role ini)
      if (activeRole === 'PERAWAT_OK') {
        const count = staff.filter(x => x.roles.includes('Perawat OK')).length || 1;
        bpjsJasa = pools.paramOK / count;
      } else if (activeRole === 'PERAWAT_ICU') {
        const count = staff.filter(x => x.roles.includes('Perawat ICU')).length || 1;
        bpjsJasa = pools.paramICU / count;
      } else if (activeRole === 'PARAMEDIS_UMUM') {
        const count = staff.filter(x => x.roles.includes('Paramedis Umum')).length || 1;
        bpjsJasa = pools.paramGen / count;
      } else if (activeRole === 'ADMIN_CASEMIX') {
        const count = staff.filter(x => x.roles.some(r => ['Manajemen', 'Casemix', 'Pengelola'].includes(r))).length || 1;
        bpjsJasa = (pools.manajemen + pools.casemix + pools.pengelola) / count;
      }

      const transport = s.baseHonor || 0;
      const gross = bpjsJasa + yanJasa + transport;
      const tax = calculatePPH21(gross);
      return { 
        id: s.id, name: s.nama, status: s.status, transport, bpjsJasa, yanJasa, gross, tax, net: gross - tax, 
        attachments: [], roles: s.roles 
      };
    });
  }, [logs, activeRole, searchName, doctors, staff, bpjsSettingsHistory, globalMonth, globalYear]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FILTER & NAVIGASI ROLE */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-wrap gap-4 items-center no-print">
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
           {roles.map(r => (
             <button key={r.id} onClick={() => setActiveRole(r.id)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeRole === r.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{r.label}</button>
           ))}
         </div>
         <div className="relative min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Cari Nama Personel..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
         </div>
      </div>

      {/* DAFTAR PERSONEL */}
      <div className="space-y-6">
        {payrollData.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <Info className="mx-auto text-slate-300 mb-4" size={48} />
             <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Tidak ada data personel untuk kategori & periode ini</p>
          </div>
        ) : (
          payrollData.map(item => (
            <div key={item.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden group hover:border-blue-200 transition-all">
              <div className="p-8 flex flex-wrap justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Landmark size={32} /></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{item.name}</h3>
                      <div className="flex gap-2 items-center mt-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">{item.status}</span>
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{item.roles.join(', ')}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-10">
                   <div className="text-right border-r border-slate-100 pr-10">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Jasa Cair (Netto)</p>
                      <p className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{formatIDR(item.net)}</p>
                   </div>
                   <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                      <ChevronDown size={24} className={expandedId === item.id ? 'rotate-180' : ''} />
                   </button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="px-10 pb-10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard label="Honor/Trans Dasar" value={item.transport} icon={<Wallet size={20}/>} color="slate" />
                    <SummaryCard label="Jasa BPJS" value={item.bpjsJasa} icon={<Coins size={20}/>} color="blue" />
                    <SummaryCard label="Jasa Yanmasum" value={item.yanJasa} icon={<ArrowRightLeft size={20}/>} color="emerald" />
                    <SummaryCard label="Pajak PPH 21" value={item.tax} icon={<AlertTriangle size={20}/>} color="rose" />
                  </div>

                  {item.attachments.length > 0 ? (
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><Stethoscope size={14} className="text-blue-500" /> Rincian Log Pasien (Jasa Langsung)</h4>
                       <div className="grid grid-cols-1 gap-4">
                          {item.attachments.map((at, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:border-blue-200 transition-all flex justify-between items-center">
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <p className="font-black text-slate-900 uppercase tracking-tight">{at.patient}</p>
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${at.isYan ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {at.isYan ? 'NON-BPJS' : 'BPJS'}
                                     </span>
                                     {at.isSaraf && <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">Bedah Saraf</span>}
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SEP: {at.sep} | PERAN: {at.role}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-lg font-black text-slate-900 font-mono">{formatIDR(at.fee)}</p>
                                  {at.isYan && <p className="text-[8px] font-bold text-emerald-600 uppercase">Input Manual Terverifikasi</p>}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-center gap-4">
                       <Info size={24} className="text-blue-400" />
                       <div>
                          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Informasi Distribusi Jasa</p>
                          <p className="text-[11px] font-medium text-blue-600 leading-relaxed">Personel ini menerima jasa melalui sistem **Pooling (Bagi Hasil)**. Nilai di atas adalah hasil pembagian merata dari total jasa seluruh pasien di unit kerja terkait untuk periode ini.</p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color }: any) => {
  const colors: any = {
    slate: "bg-slate-50 text-slate-400 border-slate-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-500 border-emerald-100",
    rose: "bg-rose-50 text-rose-500 border-rose-100"
  };
  return (
    <div className={`p-6 rounded-[2rem] border flex items-center gap-4 shadow-sm ${colors[color]}`}>
       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">{icon}</div>
       <div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
          <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">{formatIDR(value)}</p>
       </div>
    </div>
  );
};

export default PayrollDetail;
