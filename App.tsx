
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Box, FileText,
  ShieldCheck, Layers, Calendar, Coins, HeartPulse, ShoppingCart, 
  BarChart3, Users, Globe, Wrench, Calculator, Minimize2, Maximize2, 
  X, AlertCircle, CloudUpload, Check, RefreshCw
} from 'lucide-react';
import PaguAnggaran from './components/PaguAnggaran';
import RAB from './components/RAB';
import RPD from './components/RPD';
import RealisasiRPD from './components/RealisasiRPD';
import BPJSModule from './components/BPJSModule';
import OperationalBilling from './components/OperationalBilling';
import RevenueModule from './components/RevenueModule';
// Added RPDSection to types import
import { 
  MainTab, SubTab, TabType, PaguSection, RABCategory, RPDSection,
  PatientClaim, Doctor, Employee, Bill, RevenueTarget, SpecialtyTarget, BPJSCalcSettings,
  MinimizedForm, JasaVerificationFiles
} from './types';
// Note: RevenueTarget + SpecialtyTarget types sudah di-import (line di atas) — ready untuk F1.1/F1.2 wire

// [F2.1 v2] Helper: normalize payroll status key untuk avoid Watchpoint v1.0 #6 (zero-padded month)
// Format: 'YYYY-MM-personId' — month padding ensures consistent sort + DB lookup
const normalizeKey = (year: number, month: number, personId: string): string =>
  `${year}-${String(month).padStart(2, '0')}-${personId}`;
import { 
  INITIAL_PAGU_SECTIONS, INITIAL_RAB_NARRATIVE, INITIAL_RAB_CATEGORIES,
  YEARS, DUMMY_DOCTORS, DUMMY_EMPLOYEES, DUMMY_BILLS, DUMMY_PATIENTS, DEFAULT_BPJS_SETTINGS, 
  DUMMY_REVENUE_TARGETS, DUMMY_SPECIALTY_TARGETS
} from './constants';
import { calculatePatientFees, getEffectiveSettings } from './utils/feeCalculation';
import { supabase } from './lib/supabase';

const MainTabButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-6 border-b-4 transition-all whitespace-nowrap ${active ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SubTabButton = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 transition-all whitespace-nowrap ${active ? 'text-slate-900 border-b-2 border-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>(MainTab.RKKS);
  const [subTab, setSubTab] = useState<SubTab>(SubTab.PAGU_ANGGARAN);
  const [activeTabType, setActiveTabType] = useState<TabType>(TabType.PAGU);
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(2025);
  const [budgetViewMode, setBudgetViewMode] = useState<'SEMULA' | 'REVISI' | 'SEMUA'>('SEMUA');
  const [isPaguLocked, setIsPaguLocked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // States
  const [dataByYear, setDataByYear] = useState<Record<number, PaguSection[]>>({ 2025: INITIAL_PAGU_SECTIONS });
  const [allBills, setAllBills] = useState<Bill[]>(DUMMY_BILLS);
  const [logsList, setLogsList] = useState<PatientClaim[]>(DUMMY_PATIENTS); 
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(DUMMY_DOCTORS);
  const [staffList, setStaffList] = useState<Employee[]>(DUMMY_EMPLOYEES);
  const [jasaAccountMap, setJasaAccountMap] = useState({ tks: '521115.01', nakes: '521115.02', pengelola: '521115.03' });
  const [bpjsSettingsHistory, setBpjsSettingsHistory] = useState<Record<string, BPJSCalcSettings>>({ '2024-01': DEFAULT_BPJS_SETTINGS });
  const [payrollStatuses, setPayrollStatuses] = useState<Record<string, 'Lunas' | 'Belum Lunas'>>({});
  const [minimizedForms, setMinimizedForms] = useState<MinimizedForm[]>([]);
  const [activeFormFromMinimized, setActiveFormFromMinimized] = useState<MinimizedForm | null>(null);
  const [jasaVerificationFiles, setJasaVerificationFiles] = useState<JasaVerificationFiles>({});

  // [F1.1/F1.2 v2] Revenue + Specialty Targets — wired ke Supabase (was DUMMY hardcoded)
  const [revenueTargets, setRevenueTargets] = useState<RevenueTarget[]>(DUMMY_REVENUE_TARGETS);
  const [specialtyTargets, setSpecialtyTargets] = useState<SpecialtyTarget[]>(DUMMY_SPECIALTY_TARGETS);

  // --- LOGIKA SYNC SUPABASE (BACKEND) ---
  // Schema pattern: PURE envelope JSONB
  //   pagu_sections: { id text PK, data: {rows, title}, created_at, ... }
  //   bills:         { id text PK, data: <Bill fields>, created_at, ... }
  //   patient_claims:{ id text PK, data: <PatientClaim fields>, created_at, ... }
  //   doctors:       { id text PK, data: <Doctor fields>, created_at, ... }
  //   employees:     { id text PK, data: <Employee fields>, created_at, ... }
  //   system_settings:{ key text PK, value: <any JSONB>, updated_at }
  
  // 1. Muat data dari Supabase saat aplikasi pertama kali dibuka
  useEffect(() => {
    const loadData = async () => {
      setIsSyncing(true);
      try {
        // [F2.0 v2] PAGU: partition by year via id pattern `pagu-{year}-{slug}`
        // Falls back to selectedYear bucket untuk legacy ids tanpa year prefix.
        const { data: pagu } = await supabase.from('pagu_sections').select('*');
        if (pagu && pagu.length > 0) {
          const fallbackYear = selectedYear === 'ALL' ? 2025 : selectedYear;
          const byYear: Record<number, PaguSection[]> = {};
          pagu.forEach((p: any) => {
            const match = p.id.match(/^pagu-(\d{4})-/);
            const year = match ? parseInt(match[1], 10) : fallbackYear;
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({
              id: p.id,
              title: p.data?.title || '',
              rows: p.data?.rows || [],
            });
          });
          setDataByYear(byYear);
        }

        // BILLS: unwrap envelope, preserve id
        const { data: bills } = await supabase.from('bills').select('*');
        if (bills && bills.length > 0) {
          setAllBills(bills.map((b: any) => ({ ...(b.data || {}), id: b.id })));
        }

        // PATIENT CLAIMS: unwrap envelope, preserve id
        const { data: claims } = await supabase.from('patient_claims').select('*');
        if (claims && claims.length > 0) {
          setLogsList(claims.map((c: any) => ({ ...(c.data || {}), id: c.id })));
        }

        // DOCTORS: load dari DB (kalau ada). Kalau kosong, keep DUMMY dari constants.
        const { data: docs } = await supabase.from('doctors').select('*');
        if (docs && docs.length > 0) {
          setDoctorsList(docs.map((d: any) => ({ ...(d.data || {}), id: d.id })));
        }

        // EMPLOYEES: same pattern
        const { data: emps } = await supabase.from('employees').select('*');
        if (emps && emps.length > 0) {
          setStaffList(emps.map((e: any) => ({ ...(e.data || {}), id: e.id })));
        }

        // [F1.1 v2] REVENUE TARGETS: envelope unwrap
        const { data: rt } = await supabase.from('revenue_targets').select('*');
        if (rt && rt.length > 0) {
          setRevenueTargets(rt.map((r: any) => ({ ...(r.data || {}), id: r.id })));
        }

        // [F1.2 v2] SPECIALTY TARGETS: envelope unwrap
        const { data: st } = await supabase.from('specialty_targets').select('*');
        if (st && st.length > 0) {
          setSpecialtyTargets(st.map((s: any) => ({ ...(s.data || {}), id: s.id })));
        }

        // [F2.1 v2] PAYROLL STATUSES: load Record<key, status>
        // Key pattern: 'YYYY-MM-personId' (zero-padded month — Watchpoint v1.0 #6 fix)
        const { data: ps } = await supabase.from('payroll_statuses').select('*');
        if (ps && ps.length > 0) {
          const psMap: Record<string, 'Lunas' | 'Belum Lunas'> = {};
          ps.forEach((p: any) => {
            psMap[p.id] = p.data?.status || 'Belum Lunas';
          });
          setPayrollStatuses(psMap);
        }

        // [F2.2 v2] JASA VERIFICATION FILES: 1 row per period, data = { tks, nakes, pengelola }
        // ID pattern: 'jvf-YYYY-MM' → strip prefix to get periodKey 'YYYY-MM' (zero-padded)
        const { data: jvf } = await supabase.from('jasa_verification_files').select('*');
        if (jvf && jvf.length > 0) {
          const jvfMap: JasaVerificationFiles = {};
          jvf.forEach((j: any) => {
            const periodKey = j.id.replace(/^jvf-/, '');
            jvfMap[periodKey] = {
              tks: j.data?.tks || [],
              nakes: j.data?.nakes || [],
              pengelola: j.data?.pengelola || [],
            };
          });
          setJasaVerificationFiles(jvfMap);
        }

        // SYSTEM SETTINGS: key/value (sudah benar di v3.1 original, tidak diubah)
        const { data: settings } = await supabase.from('system_settings').select('*');
        if (settings) {
          settings.forEach((s: any) => {
            if (s.key === 'jasa_map') setJasaAccountMap(s.value);
            if (s.key === 'bpjs_history') setBpjsSettingsHistory(s.value);
            if (s.key === 'pagu_lock') setIsPaguLocked(s.value);
          });
        }
        setLastSync(new Date().toLocaleTimeString());
        console.log('✅ Data loaded from Supabase:', {
          pagu: pagu?.length || 0,
          bills: bills?.length || 0,
          claims: claims?.length || 0,
          doctors: docs?.length || 0,
          employees: emps?.length || 0,
          revenue_targets: rt?.length || 0,
          specialty_targets: st?.length || 0,
          payroll_statuses: ps?.length || 0,
          jasa_verification_files: jvf?.length || 0,
        });
      } catch (err) {
        console.error("❌ Gagal memuat data dari database:", err);
      } finally {
        setIsSyncing(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fungsi Helper untuk Simpan (Bisa dipanggil manual atau otomatis)
  // Pattern: untuk setiap row, pisahkan id dari business fields → upsert {id, data: rest}
  const syncToCloud = async () => {
    setIsSyncing(true);
    try {
      // [F2.0 v2] PAGU: save SEMUA tahun dari dataByYear (bukan cuma current selected).
      // ID pattern: pagu-{year}-{slug}. Legacy 'sec-*' ids akan di-prefix dengan year.
      const allSections: { id: string; data: any }[] = [];
      Object.entries(dataByYear).forEach(([yearStr, sections]) => {
        const year = parseInt(yearStr, 10);
        sections.forEach(s => {
          const idMatch = s.id.match(/^pagu-(\d{4})-/);
          const finalId = idMatch ? s.id : `pagu-${year}-${s.id.replace(/^sec-/, '')}`;
          allSections.push({
            id: finalId,
            data: { title: s.title, rows: s.rows }
          });
        });
      });
      if (allSections.length > 0) {
        const { error: paguErr } = await supabase.from('pagu_sections').upsert(allSections);
        if (paguErr) throw paguErr;
      }

      // BILLS: envelope upsert
      if (allBills.length > 0) {
        const billsPayload = allBills.map(b => {
          const { id, ...rest } = b;
          return { id, data: rest };
        });
        const { error: billsErr } = await supabase.from('bills').upsert(billsPayload);
        if (billsErr) throw billsErr;
      }

      // PATIENT CLAIMS: envelope upsert
      if (logsList.length > 0) {
        const claimsPayload = logsList.map(c => {
          const { id, ...rest } = c;
          return { id, data: rest };
        });
        const { error: claimsErr } = await supabase.from('patient_claims').upsert(claimsPayload);
        if (claimsErr) throw claimsErr;
      }

      // DOCTORS: envelope upsert
      if (doctorsList.length > 0) {
        const doctorsPayload = doctorsList.map(d => {
          const { id, ...rest } = d;
          return { id, data: rest };
        });
        const { error: docsErr } = await supabase.from('doctors').upsert(doctorsPayload);
        if (docsErr) throw docsErr;
      }

      // EMPLOYEES: envelope upsert
      if (staffList.length > 0) {
        const staffPayload = staffList.map(e => {
          const { id, ...rest } = e;
          return { id, data: rest };
        });
        const { error: empsErr } = await supabase.from('employees').upsert(staffPayload);
        if (empsErr) throw empsErr;
      }

      // [F1.1 v2] REVENUE TARGETS: envelope upsert
      if (revenueTargets.length > 0) {
        const rtPayload = revenueTargets.map(r => {
          const { id, ...rest } = r;
          return { id, data: rest };
        });
        const { error: rtErr } = await supabase.from('revenue_targets').upsert(rtPayload);
        if (rtErr) throw rtErr;
      }

      // [F1.2 v2] SPECIALTY TARGETS: envelope upsert
      if (specialtyTargets.length > 0) {
        const stPayload = specialtyTargets.map(s => {
          const { id, ...rest } = s;
          return { id, data: rest };
        });
        const { error: stErr } = await supabase.from('specialty_targets').upsert(stPayload);
        if (stErr) throw stErr;
      }

      // [F2.1 v2] PAYROLL STATUSES: upsert Record<key, status>
      // Key sudah zero-padded format dari PayrollSummary.tsx via normalizeKey helper.
      const psEntries = Object.entries(payrollStatuses);
      if (psEntries.length > 0) {
        const psPayload = psEntries.map(([key, status]) => ({
          id: key,
          data: { status }
        }));
        const { error: psErr } = await supabase.from('payroll_statuses').upsert(psPayload);
        if (psErr) throw psErr;
      }

      // [F2.2 v2] JASA VERIFICATION FILES: 1 row per period.
      // ID pattern: 'jvf-YYYY-MM' (zero-padded). Data = { tks: ProcurementFile[], nakes: ..., pengelola: ... }
      // Note: actual file binary di Supabase Storage bucket 'jasa-verification'.
      // Tabel ini hanya simpan metadata (id, namaFile, tipe, size, url).
      // [F2.2 v2.1] Skip empty periods (semua 3 categories empty) untuk prevent ghost rows.
      const jvfEntries = Object.entries(jasaVerificationFiles).filter(([_, files]) => 
        (files.tks?.length || 0) + (files.nakes?.length || 0) + (files.pengelola?.length || 0) > 0
      );
      if (jvfEntries.length > 0) {
        const jvfPayload = jvfEntries.map(([periodKey, files]) => ({
          id: `jvf-${periodKey}`,
          data: files
        }));
        const { error: jvfErr } = await supabase.from('jasa_verification_files').upsert(jvfPayload);
        if (jvfErr) throw jvfErr;
      }
      // [F2.2 v2.1] Cleanup ghost rows: DELETE periods yang sekarang empty di state
      //   (e.g., user delete semua files di periode tertentu → row di-cleanup)
      const emptyPeriodKeys = Object.entries(jasaVerificationFiles)
        .filter(([_, files]) => 
          (files.tks?.length || 0) + (files.nakes?.length || 0) + (files.pengelola?.length || 0) === 0
        )
        .map(([periodKey]) => `jvf-${periodKey}`);
      if (emptyPeriodKeys.length > 0) {
        const { error: jvfDelErr } = await supabase
          .from('jasa_verification_files')
          .delete()
          .in('id', emptyPeriodKeys);
        if (jvfDelErr) console.warn('⚠️ jvf empty cleanup warning:', jvfDelErr);
      }

      // SYSTEM SETTINGS: key-value (tidak diubah)
      await supabase.from('system_settings').upsert({ key: 'jasa_map', value: jasaAccountMap });
      await supabase.from('system_settings').upsert({ key: 'bpjs_history', value: bpjsSettingsHistory });
      await supabase.from('system_settings').upsert({ key: 'pagu_lock', value: isPaguLocked });
      
      setLastSync(new Date().toLocaleTimeString());
      console.log('✅ Sync to Supabase berhasil');
    } catch (err) {
      console.error("❌ Gagal sinkronisasi ke cloud:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- LOGIKA UI & DASHBOARD ---

  const currentRKKSYear = selectedYear === 'ALL' ? 2025 : selectedYear;
  const paguSections = useMemo(() => dataByYear[currentRKKSYear] || [], [dataByYear, currentRKKSYear]);
  const [rabCategories, setRabCategories] = useState<RABCategory[]>(INITIAL_RAB_CATEGORIES);

  useEffect(() => {
    setRabCategories(prev => {
      return paguSections.map(pSec => {
        const existingCat = prev.find(c => c.linkedPaguSectionId === pSec.id);
        const items = pSec.rows.map(pRow => {
          const existingRow = existingCat?.items.find(i => i.id === `sync-rab-${pRow.id}`);
          if (existingRow) return { ...existingRow, kode: pRow.kode || existingRow.kode, uraian: pRow.description || existingRow.uraian };
          return { id: `sync-rab-${pRow.id}`, kode: pRow.kode, uraian: pRow.description, volumeSub: String(pRow.volume), jenisKomponen: 'Utama', satuan: pRow.satuan, jumlahUnits: pRow.volume, hargaSatuanAwal: pRow.hargaSatuanAwal, hargaSatuanRevisi: pRow.hargaSatuanRevisi, jumlahHargaAwal: pRow.jumlahBiayaAwal, jumlahHargaRevisi: pRow.jumlahBiayaRevisi, level: pRow.level };
        });
        return { id: existingCat?.id || `rab-${pSec.id}`, title: pSec.title, showNarrative: existingCat?.showNarrative ?? false, viewMode: budgetViewMode, linkedPaguSectionId: pSec.id, narrative: existingCat?.narrative || { ...INITIAL_RAB_NARRATIVE }, items: items };
      });
    });
  }, [paguSections, budgetViewMode]);

  const [rpdSections, setRpdSections] = useState<RPDSection[]>([]);
  useEffect(() => {
    const rpdSectionsInitial = paguSections.map(sec => ({ id: `rpd-${sec.id}`, title: sec.title, linkedSectionId: sec.id, rows: sec.rows.map(r => ({ id: r.id, kode: r.kode, description: r.description, totalBudget: r.jumlahBiayaAwal, totalBudgetRevisi: r.jumlahBiayaRevisi, level: r.level, monthly: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0 } })) }));
    setRpdSections(prev => {
       if (prev.length === 0) return rpdSectionsInitial;
       return rpdSectionsInitial.map(newSec => {
          const existing = prev.find(p => p.linkedSectionId === newSec.linkedSectionId);
          if (existing) return { ...newSec, rows: newSec.rows.map(nr => { const exRow = existing.rows.find(er => er.id === nr.id); return exRow ? { ...nr, monthly: exRow.monthly, totalBudget: nr.totalBudget, totalBudgetRevisi: nr.totalBudgetRevisi } : nr; })};
          return newSec;
       });
    });
  }, [paguSections]);

  const realisasiMetrics = useMemo(() => {
    const yearFilter = selectedYear === 'ALL' ? '' : selectedYear.toString();
    const absorptionMap: Record<string, Record<string, number>> = {};
    const addByCode = (kode: string, month: number, value: number) => {
      const cleanCode = kode.trim(); if (!cleanCode) return;
      const mKey = `m${month}`; if (!absorptionMap[cleanCode]) absorptionMap[cleanCode] = {};
      absorptionMap[cleanCode][mKey] = (absorptionMap[cleanCode][mKey] || 0) + value;
    };
    allBills.filter(b => b.status === 'Lunas' && b.tanggal.startsWith(yearFilter)).forEach(b => {
      const bDate = new Date(b.tanggal);
      const monthNum = bDate.getMonth() + 1;
      b.items.forEach(it => addByCode(it.akun, monthNum, (it.volume * it.hargaSatuan)));
    });
    const filterYearNum = selectedYear === 'ALL' ? 2025 : selectedYear;
    for (let m = 1; m <= 12; m++) {
      const monthlyTKS = staffList.filter(s => s.status === 'TKS').reduce((sum, s) => sum + (s.baseHonor || 0), 0);
      addByCode(jasaAccountMap.tks, m, monthlyTKS);
      const monthlyTransport = doctorsList.reduce((sum, d) => sum + (d.baseTransport || 0), 0);
      const monthlyLogs = logsList.filter(l => l.tahun === filterYearNum && l.bulan === m && (l.status === 'Verifikasi' || l.status === 'Lunas'));
      const monthlyJasaNakes = monthlyLogs.reduce((sum, l) => {
        const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
        const f = calculatePatientFees(l, s);
        return sum + (f.spesialis + f.anestesi + f.gp + f.konsul + f.paramOK + f.paramICU + f.paramGen + f.penataAnestesi);
      }, 0);
      addByCode(jasaAccountMap.nakes, m, monthlyTransport + monthlyJasaNakes);
      const monthlyJasaPengelola = monthlyLogs.reduce((sum, l) => {
        const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
        const f = calculatePatientFees(l, s);
        return sum + (f.pengelola + f.manajemen + f.casemix);
      }, 0);
      addByCode(jasaAccountMap.pengelola, m, monthlyJasaPengelola);
    }
    let totalPagu = 0; let totalReal = 0;
    paguSections.forEach(sec => {
      const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
      sec.rows.filter(r => r.level === minLvl).forEach(r => {
        totalPagu += (budgetViewMode === 'SEMULA' ? r.jumlahBiayaAwal : r.jumlahBiayaRevisi) || 0;
        const rowMonthlyData = absorptionMap[r.kode.trim()] || {};
        totalReal += Object.values(rowMonthlyData).reduce((sum, val) => sum + val, 0);
      });
    });
    return { totalPagu, totalReal, absorptionMap };
  }, [paguSections, allBills, logsList, doctorsList, staffList, selectedYear, budgetViewMode, bpjsSettingsHistory, jasaAccountMap]);

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    if (tab === MainTab.RKKS) { setSubTab(SubTab.PAGU_ANGGARAN); setActiveTabType(TabType.PAGU); }
    else if (tab === MainTab.PENDAPATAN) { setSubTab(SubTab.TARGET_PENDAPATAN); setActiveTabType(TabType.REV_DASHBOARD); }
    else if (tab === MainTab.BELANJA) { setSubTab(SubTab.BELANJA_JASA); setActiveTabType(TabType.JASA_BPJS); }
    else { setActiveTabType(TabType.FINANCIAL_HEALTH); }
  };

  const handleSubTabChange = (tab: SubTab) => {
    setSubTab(tab);
    switch (tab) {
      case SubTab.PAGU_ANGGARAN: setActiveTabType(TabType.PAGU); break;
      case SubTab.RAB: setActiveTabType(TabType.RAB); break;
      case SubTab.RPD: setActiveTabType(TabType.RPD); break;
      case SubTab.REALISASI: setActiveTabType(TabType.REALISASI); break;
      case SubTab.BELANJA_JASA: setActiveTabType(TabType.JASA_BPJS); break;
      case SubTab.BELANJA_OPERASIONAL: setActiveTabType(TabType.BEKKES); break;
      case SubTab.BELANJA_MODAL: setActiveTabType(TabType.MODAL_DETAIL); break;
      case SubTab.BELANJA_PEMELIHARAAN: setActiveTabType(TabType.PEMELIHARAAN_DETAIL); break;
      case SubTab.REKAP_AUDIT: setActiveTabType(TabType.REKAP_OPERASIONAL); break;
      case SubTab.TARGET_PENDAPATAN: setActiveTabType(TabType.REV_DASHBOARD); break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="bg-slate-900 border-b border-slate-800 h-24 flex-shrink-0 z-50 shadow-2xl no-print">
        <div className="max-w-[98%] mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-500 p-3.5 rounded-2xl shadow-lg ring-4 ring-slate-800"><ShieldCheck className="text-white" size={32} /></div>
            <div className="border-l border-slate-700 pl-6">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">SIKESUMA</h1>
              <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">RS TK.IV 02.07.03 BATIN TIKAL</span></div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl">
                <div className="flex flex-col"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Database Cloud</span>
                   <div className="flex items-center gap-2">
                      {isSyncing ? <RefreshCw size={14} className="text-blue-400 animate-spin" /> : <Check size={14} className="text-emerald-400" />}
                      <span className="text-white text-xs font-black uppercase">{isSyncing ? 'Syncing...' : (lastSync ? `Updated ${lastSync}` : 'Connected')}</span>
                   </div>
                </div>
                <button onClick={syncToCloud} disabled={isSyncing} className="p-2 bg-white/10 hover:bg-emerald-600 rounded-xl text-white transition-all disabled:opacity-50"><CloudUpload size={18} /></button>
             </div>
             
             <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl">
                <div className="flex flex-col"><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Periode RKKS</span>
                   <div className="flex items-center gap-2"><Globe size={14} className="text-emerald-500" /><select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))} className="bg-transparent text-white text-xs font-black uppercase outline-none cursor-pointer">
                      <option value="ALL" className="bg-slate-800">SEMUA TAHUN</option>{YEARS.map(y => <option key={y} value={y} className="bg-slate-800">TA {y}</option>)}
                   </select></div>
                </div>
             </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-8 flex-shrink-0 shadow-sm z-40 no-print">
        <nav className="flex space-x-12 overflow-x-auto scrollbar-hide">
          <MainTabButton active={mainTab === MainTab.RKKS} onClick={() => handleMainTabChange(MainTab.RKKS)} label="1. PERSIAPAN & PERENCANAAN" icon={<LayoutDashboard size={18} />} />
          <MainTabButton active={mainTab === MainTab.BELANJA} onClick={() => handleMainTabChange(MainTab.BELANJA)} label="2. PELAKSANAAN & AUDIT" icon={<ShoppingCart size={18} />} />
          <MainTabButton active={mainTab === MainTab.PENDAPATAN} onClick={() => handleMainTabChange(MainTab.PENDAPATAN)} label="3. MONITORING PENERIMAAN" icon={<Coins size={18} />} />
          <MainTabButton active={mainTab === MainTab.FINANCIAL_HEALTH} onClick={() => handleMainTabChange(MainTab.FINANCIAL_HEALTH)} label="4. PELAPORAN & LRA" icon={<HeartPulse size={18} />} />
        </nav>
      </div>

      <div className="bg-slate-100/50 border-b border-slate-200 px-10 flex-shrink-0 z-30 no-print py-2">
        <div className="max-w-[98%] mx-auto flex justify-between items-center">
          <div className="flex space-x-6 items-center overflow-x-auto scrollbar-hide">
            {mainTab === MainTab.RKKS && (
              <>
                <SubTabButton active={subTab === SubTab.PAGU_ANGGARAN} onClick={() => handleSubTabChange(SubTab.PAGU_ANGGARAN)} label="1.1 Pagu Anggaran" icon={<FileText size={14} />} />
                <SubTabButton active={subTab === SubTab.RAB} onClick={() => handleSubTabChange(SubTab.RAB)} label="1.2 RAB Detail" icon={<Layers size={14} />} />
                <SubTabButton active={subTab === SubTab.RPD} onClick={() => handleSubTabChange(SubTab.RPD)} label="1.3 RPD (Rencana Tarik)" icon={<Calendar size={14} />} />
                <SubTabButton active={subTab === SubTab.REALISASI} onClick={() => handleSubTabChange(SubTab.REALISASI)} label="1.4 LRA (Realisasi)" icon={<BarChart3 size={14} />} />
              </>
            )}
            {mainTab === MainTab.BELANJA && (
              <>
                <SubTabButton active={subTab === SubTab.BELANJA_JASA} onClick={() => handleSubTabChange(SubTab.BELANJA_JASA)} label="2.1 Jasa Medis" icon={<Users size={14} />} />
                <SubTabButton active={subTab === SubTab.BELANJA_OPERASIONAL} onClick={() => handleSubTabChange(SubTab.BELANJA_OPERASIONAL)} label="2.2 Operasional" icon={<ShoppingBag size={14} />} />
                <SubTabButton active={subTab === SubTab.BELANJA_MODAL} onClick={() => handleSubTabChange(SubTab.BELANJA_MODAL)} label="2.3 Modal Alkes" icon={<Box size={14} />} />
                <SubTabButton active={subTab === SubTab.BELANJA_PEMELIHARAAN} onClick={() => handleSubTabChange(SubTab.BELANJA_PEMELIHARAAN)} label="2.4 Pemeliharaan" icon={<Wrench size={14} />} />
                <SubTabButton active={subTab === SubTab.REKAP_AUDIT} onClick={() => handleSubTabChange(SubTab.REKAP_AUDIT)} label="2.5 Audit Per Akun" icon={<Calculator size={14} />} />
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
             <div className="bg-white border border-slate-200 rounded-xl p-1 flex gap-1 shadow-inner">
                {['SEMULA', 'REVISI', 'SEMUA'].map(v => (<button key={v} onClick={() => setBudgetViewMode(v as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${budgetViewMode === v ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{v}</button>))}
             </div>
             {realisasiMetrics.totalPagu < realisasiMetrics.totalReal && (
               <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl animate-pulse">
                  <AlertCircle size={14} className="text-rose-600" />
                  <span className="text-[9px] font-black text-rose-600 uppercase">Warning: Realisasi Melampaui Pagu</span>
               </div>
             )}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto w-full bg-slate-50/30">
        <div className="max-w-[98%] mx-auto px-6 py-6 pb-32">
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
              {activeTabType === TabType.PAGU && (
                <PaguAnggaran metrics={{ total: { budget: realisasiMetrics.totalPagu, real: realisasiMetrics.totalReal } }} sections={paguSections} onSectionsChange={s => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: s})} onAddSection={() => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: [...paguSections, { id: `pagu-${currentRKKSYear}-${Date.now()}`, title: '', rows: [] }]})} onDeleteSection={id => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: paguSections.filter(s => s.id !== id)})} viewMode={budgetViewMode} selectedYear={currentRKKSYear} onYearChange={setSelectedYear} />
              )}
              {activeTabType === TabType.RAB && (
                <RAB paguSections={paguSections} categories={rabCategories} onCategoriesChange={setRabCategories} selectedYear={currentRKKSYear} />
              )}
              {activeTabType === TabType.RPD && (
                <RPD sections={rpdSections} onSectionsChange={setRpdSections} viewMode={budgetViewMode} selectedYear={currentRKKSYear} />
              )}
              {activeTabType === TabType.REALISASI && (
                <RealisasiRPD sections={rpdSections.map(sec => ({ ...sec, rows: sec.rows.map(row => ({ ...row, monthly: { ...row.monthly, ...(realisasiMetrics.absorptionMap[row.kode.trim()] || {}) } })) }))} onSectionsChange={setRpdSections} viewMode={budgetViewMode} selectedYear={currentRKKSYear} />
              )}
              {subTab === SubTab.BELANJA_JASA && (
                <BPJSModule 
                  logs={logsList} onLogsChange={setLogsList} doctors={doctorsList} onDoctorsChange={setDoctorsList} staff={staffList} onStaffChange={setStaffList} 
                  fees={{transportSpesialis: [], uangJagaUmum: [], honorTKS: [], honorPengelola: [], honorCasemix: [], jasaPerawatOK: [], jasaPerawatICU: [], jasaPenataAnestesi: []}} onFeesChange={() => {}} 
                  bills={allBills} onBillsChange={setAllBills} activeTabType={activeTabType} bpjsSettingsHistory={bpjsSettingsHistory} onBpjsSettingsHistoryChange={setBpjsSettingsHistory} globalYear={selectedYear} 
                  payrollStatuses={payrollStatuses} onPayrollStatusesChange={setPayrollStatuses} jasaVerificationFiles={jasaVerificationFiles} onJasaVerificationFilesChange={setJasaVerificationFiles} jasaAccountMap={jasaAccountMap} onJasaAccountMapChange={setJasaAccountMap} 
                  minimizedForms={minimizedForms} onMinimizeForm={f => setMinimizedForms([...minimizedForms, f])} reopenedForm={activeFormFromMinimized} onReopenedFormHandled={() => setActiveFormFromMinimized(null)}
                />
              )}
              {(activeTabType === TabType.REKAP_OPERASIONAL || subTab === SubTab.REKAP_AUDIT || subTab === SubTab.BELANJA_OPERASIONAL || subTab === SubTab.BELANJA_MODAL || subTab === SubTab.BELANJA_PEMELIHARAAN) && (
                <OperationalBilling activeTabType={activeTabType} subTab={subTab} bills={allBills} onBillsChange={setAllBills} globalYear={selectedYear} logs={logsList} bpjsSettingsHistory={bpjsSettingsHistory} doctors={doctorsList} staff={staffList} jasaAccountMap={jasaAccountMap} onJasaAccountMapChange={setJasaAccountMap} onMinimizeForm={f => setMinimizedForms([...minimizedForms, f])} reopenedForm={activeFormFromMinimized} onReopenedFormHandled={() => setActiveFormFromMinimized(null)} />
              )}
              {(mainTab === MainTab.PENDAPATAN || mainTab === MainTab.FINANCIAL_HEALTH) && (
                <RevenueModule activeTabType={activeTabType} logs={logsList} targets={revenueTargets} onTargetsChange={setRevenueTargets} specialtyTargets={specialtyTargets} onSpecialtyTargetsChange={setSpecialtyTargets} selectedYear={selectedYear} doctors={doctorsList} bills={allBills} rpdData={rpdSections} />
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
