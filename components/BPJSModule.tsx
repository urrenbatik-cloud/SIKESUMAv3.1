
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, HeartPulse, LayoutList, Receipt, Database, Settings2
} from 'lucide-react';
import MonthlyReport from './MonthlyReport';
import ServiceLog from './ServiceLog';
import ServiceDetails from './ServiceDetails';
import PayrollSummary from './PayrollSummary';
import DoctorData from './DoctorData';
import StaffData from './StaffData';
import BpjsSettingsForm from './BpjsSettingsForm';
import ServiceBillRecap from './ServiceBillRecap';
import LocalFilterBar, { LocalFilterState } from './LocalFilterBar';
import { PatientClaim, Doctor, Employee, ServiceDetailState, Bill, TabType, BPJSCalcSettings, JasaVerificationFiles, MinimizedForm } from '../types';

interface BPJSModuleProps {
  logs: PatientClaim[];
  onLogsChange: (newLogs: PatientClaim[]) => void;
  doctors: Doctor[];
  onDoctorsChange: (newDoctors: Doctor[]) => void;
  staff: Employee[];
  onStaffChange: (newStaff: Employee[]) => void;
  fees: ServiceDetailState;
  onFeesChange: (newFees: ServiceDetailState) => void;
  bills: Bill[];
  onBillsChange: (newBills: Bill[]) => void;
  activeTabType: TabType;
  bpjsSettingsHistory: Record<string, BPJSCalcSettings>;
  onBpjsSettingsHistoryChange: (newHistory: Record<string, BPJSCalcSettings>) => void;
  globalYear: number | 'ALL';
  payrollStatuses: Record<string, 'Lunas' | 'Belum Lunas'>;
  onPayrollStatusesChange: (newStatuses: Record<string, 'Lunas' | 'Belum Lunas'>) => void;
  jasaVerificationFiles: JasaVerificationFiles;
  onJasaVerificationFilesChange: (files: JasaVerificationFiles) => void;
  jasaAccountMap: { tks: string; nakes: string; pengelola: string };
  onJasaAccountMapChange: (newMap: { tks: string; nakes: string; pengelola: string }) => void;
  minimizedForms: MinimizedForm[];
  onMinimizeForm: (form: MinimizedForm) => void;
  reopenedForm: MinimizedForm | null;
  onReopenedFormHandled: () => void;
}

const BPJSModule: React.FC<BPJSModuleProps> = (props) => {
  const [activeInternalTab, setActiveInternalTab] = useState('BPJS');
  const [localFilter, setLocalFilter] = useState<LocalFilterState>({
    mode: 'MONTHLY',
    day: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: props.globalYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLocalFilter(prev => ({ ...prev, year: props.globalYear }));
  }, [props.globalYear]);

  const filteredLogs = useMemo(() => {
    let result = props.logs;
    result = result.filter(l => {
      const logDate = new Date(l.tanggalInput);
      if (localFilter.mode === 'DAILY') {
        return l.tanggalInput === localFilter.day;
      } else if (localFilter.mode === 'MONTHLY') {
        const matchMonth = l.bulan === localFilter.month;
        const matchYear = localFilter.year === 'ALL' || l.tahun === localFilter.year;
        return matchMonth && matchYear;
      } else if (localFilter.mode === 'YEARLY') {
        return localFilter.year === 'ALL' || l.tahun === localFilter.year;
      } else if (localFilter.mode === 'RANGE') {
        const start = new Date(localFilter.startDate);
        const end = new Date(localFilter.endDate);
        return logDate >= start && logDate <= end;
      }
      return true;
    });

    if (activeInternalTab === 'BPJS') {
      return result.filter(l => l.kategoriPasien === 'BPJS_DINAS' || l.kategoriPasien === 'BPJS_UMUM' || l.kategoriPasien === 'BPJS_PLUS_JR');
    } else if (activeInternalTab === 'YANMASUM') {
      return result.filter(l => l.kategoriPasien === 'YANMASUM' || l.kategoriPasien === 'JASA_RAHARJA');
    }
    return result;
  }, [props.logs, activeInternalTab, localFilter]);

  // ==========================================================================
  // [S3.0] RECONCILE WRAPPER — fix prop-drilling anti-pattern
  // ==========================================================================
  // Background:
  //   ServiceLog menerima `filteredLogs` (subset by tab + period filter, e.g.,
  //   3 items "BPJS Mei 2025") sebagai display source. Tapi internal mutation
  //   pattern di ServiceLog (L80, L82, L176) operates pada `logs` prop:
  //     onLogsChange(logs.map(l => l.id === id ? edited : l))
  //     onLogsChange([...logs, newItem])
  //     onLogsChange(logs.filter(x => x.id !== id))
  //
  //   Kalau `logs` = filtered subset, callback hands subset ke parent setter.
  //   Without wrapper, parent's logsList state direplace dengan subset →
  //   true full state (60 items) berkurang ke 3 items. Pre-existing v3.1
  //   architectural bug, exposed oleh S3.2 audit log diff (phantom 57 removed).
  //
  // Fix:
  //   Reconcile subset back ke full list via 3-step merge:
  //   1. Items dalam filter window: replace dengan modified values, atau drop
  //      kalau tidak ada di modified (= deleted within scope).
  //   2. Items di luar filter window: preserve as-is (THE FIX — these stay in
  //      full list even though they're not in the visible subset).
  //   3. New items (in modified, not in full list): append.
  //
  // Result: ServiceLog API unchanged, BPJSModule API unchanged. Single
  // wrapper insertion fixes the data flow.
  //
  // Severity confirmed MEDIUM: patient_claims is upsert-only di syncToCloud,
  //   jadi DB rows tidak hilang. Bug murni di state layer + audit log layer.
  //   Tanpa fix, audit log emit phantom bulk_delete every kali user edit
  //   filtered view → audit unusable untuk BPK/Itjenad compliance.
  //
  // Latent (NOT FIXED in S3.0, deferred to Phase 3 P3.x cleanup):
  //   DoctorData.tsx + StaffData.tsx punya struktur internal yang sama
  //   (onChange(items.map(...)) etc.). Currently SAFE karena BPJSModule
  //   passes full props.doctors / props.staff (bukan filtered subset).
  //   Kalau caller berubah di future, bug akan trigger. Architectural smell
  //   yang sebaiknya di-refactor di tech-debt sprint.
  // ==========================================================================
  const handleFilteredLogsChange = useCallback((modifiedFiltered: PatientClaim[]) => {
    const filteredIds = new Set(filteredLogs.map(l => l.id));
    const modifiedById = new Map(modifiedFiltered.map(l => [l.id, l]));

    // Step 1+2: rebuild full list. Items di filter window: replace OR drop.
    // Items di luar filter window: preserve as-is.
    const reconciledExisting = props.logs
      .filter(l => !filteredIds.has(l.id) || modifiedById.has(l.id))
      .map(l => modifiedById.get(l.id) ?? l);

    // Step 3: append new items (in modified subset, tapi belum exist di full list)
    const existingIds = new Set(props.logs.map(l => l.id));
    const newlyAdded = modifiedFiltered.filter(l => !existingIds.has(l.id));

    props.onLogsChange([...reconciledExisting, ...newlyAdded]);
  }, [filteredLogs, props.logs, props.onLogsChange]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="bg-slate-900 p-2.5 rounded-[3rem] flex flex-wrap gap-2 shadow-2xl border border-slate-800 no-print sticky top-0 z-[60]">
        <NavButton active={activeInternalTab === 'BPJS'} onClick={() => setActiveInternalTab('BPJS')} label="Jasa BPJS" icon={<ShieldCheck size={18} />} color="blue" />
        <NavButton active={activeInternalTab === 'YANMASUM'} onClick={() => setActiveInternalTab('YANMASUM')} label="Jasa Yanmasum" icon={<HeartPulse size={18} />} color="emerald" />
        <NavButton active={activeInternalTab === 'PAYROLL_TOTAL'} onClick={() => setActiveInternalTab('PAYROLL_TOTAL')} label="Daftar Gaji" icon={<LayoutList size={18} />} color="indigo" />
        <NavButton active={activeInternalTab === 'REKAP_TAGIHAN'} onClick={() => setActiveInternalTab('REKAP_TAGIHAN')} label="Rekap Tagihan" icon={<Receipt size={18} />} color="amber" />
        <div className="h-10 w-px bg-slate-800 mx-2 self-center"></div>
        <NavButton active={activeInternalTab === 'DATABASE'} onClick={() => setActiveInternalTab('DATABASE')} label="Database" icon={<Database size={18} />} color="slate" />
      </div>

      <LocalFilterBar initialYear={props.globalYear} onFilterChange={setLocalFilter} />

      <div className="min-h-[700px]">
        {(activeInternalTab === 'BPJS' || activeInternalTab === 'YANMASUM') && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <ServiceLog 
                logs={filteredLogs} onLogsChange={handleFilteredLogsChange} doctors={props.doctors} 
                activeTabType={activeInternalTab === 'BPJS' ? TabType.JASA_BPJS : TabType.JASA_YANMASUM} 
                globalMonth={localFilter.month} globalYear={localFilter.year === 'ALL' ? 2025 : localFilter.year}
                onMinimizeForm={props.onMinimizeForm}
                reopenedForm={props.reopenedForm}
                onReopenedFormHandled={props.onReopenedFormHandled}
             />
             <ServiceDetails logs={filteredLogs} doctors={props.doctors} staff={props.staff} fees={props.fees} onFeesChange={props.onFeesChange} bpjsSettingsHistory={props.bpjsSettingsHistory} globalMonth={localFilter.month} globalYear={localFilter.year === 'ALL' ? 2025 : localFilter.year} />
          </div>
        )}

        {activeInternalTab === 'PAYROLL_TOTAL' && (
          <div className="animate-in fade-in duration-500">
             <PayrollSummary 
                logs={filteredLogs} 
                doctors={props.doctors} 
                staff={props.staff} 
                bpjsSettingsHistory={props.bpjsSettingsHistory} 
                globalMonth={localFilter.month} 
                globalYear={localFilter.year === 'ALL' ? 2025 : localFilter.year}
                payrollStatuses={props.payrollStatuses}
                onPayrollStatusesChange={props.onPayrollStatusesChange}
             />
          </div>
        )}

        {activeInternalTab === 'REKAP_TAGIHAN' && (
          <div className="animate-in zoom-in-95 duration-500">
             <ServiceBillRecap 
                logs={filteredLogs} bpjsSettingsHistory={props.bpjsSettingsHistory} 
                globalMonth={localFilter.month} globalYear={localFilter.year === 'ALL' ? 2025 : localFilter.year} 
                doctors={props.doctors} staff={props.staff} 
                jasaVerificationFiles={props.jasaVerificationFiles}
                onJasaVerificationFilesChange={props.onJasaVerificationFilesChange}
                jasaAccountMap={props.jasaAccountMap}
                onJasaAccountMapChange={props.onJasaAccountMapChange}
             />
          </div>
        )}

        {activeInternalTab === 'DATABASE' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <DoctorData doctors={props.doctors} onDoctorsChange={props.onDoctorsChange} />
               <StaffData staff={props.staff} onStaffChange={props.onStaffChange} />
            </div>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <Settings2 size={24} className="text-blue-500" /> Pengaturan Rumus Pembagian Jasa
               </h3>
               <BpjsSettingsForm history={props.bpjsSettingsHistory} onChange={props.onBpjsSettingsHistoryChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, label, icon, color }: any) => {
  const colorMap: any = {
    blue: active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800',
    emerald: active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800',
    indigo: active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800',
    amber: active ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800',
    slate: active ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800',
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-6 py-4 rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${colorMap[color]}`}>
      {icon} {label}
    </button>
  );
};

export default BPJSModule;
