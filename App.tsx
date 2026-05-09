
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Box, FileText,
  ShieldCheck, Layers, Calendar, Coins, HeartPulse, ShoppingCart, 
  BarChart3, Users, Globe, Wrench, Calculator, Minimize2, Maximize2, 
  X, AlertCircle, CloudUpload, Check, RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react';
import PaguAnggaran from './components/PaguAnggaran';
import RAB from './components/RAB';
import RPD from './components/RPD';
import RealisasiRPD from './components/RealisasiRPD';
import BPJSModule from './components/BPJSModule';
import OperationalBilling from './components/OperationalBilling';
import RevenueModule from './components/RevenueModule';
import DeviationDashboard from './components/DeviationDashboard';
// [S3.2.3] Settings overlay (gear icon di header) — Riwayat Aktivitas + future config tabs
import SettingsModule from './components/SettingsModule';
// [Komunikasi] Konstanta key localStorage untuk read-state — single source of truth
import { STORAGE_KEY_READ_STATE } from './constants/komunikasi';
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
import { buildBucketRegistry, type BucketRegistry, type JasaMonthlyData } from './utils/realisasiBucket';
import { supabase } from './lib/supabase';
// [S3.2] Audit log foundation — sync-time logging via diff helpers
import {
  diffCollectionForAudit,
  diffObjectForAudit,
  logAuditEntries,
  type AuditEntryInput,
  type ItemWithId,
} from './lib/audit';
import { ToastContainer, toast } from './components/Toast';

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
  // [S3.2.3] Settings overlay open/close state — wired ke gear icon di header
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // [Komunikasi] Unread message count untuk badge di gear icon. Simplified MVP:
  // count phase_messages WHERE created_at > localStorage last_global_read.
  // Per-discussion granularity = future (TD-15 / Phase 3).
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const checkUnreadKomunikasi = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ_STATE);
      let lastRead = '1970-01-01T00:00:00.000Z';
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.global_last_read) lastRead = parsed.global_last_read;
      }
      const { count, error: e } = await supabase
        .from('phase_messages')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastRead);
      if (!e && typeof count === 'number') setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  // Initial check on mount; re-check setiap kali Settings ditutup (user mungkin
  // sudah baca pesan baru → localStorage updated oleh PhaseDiscussionsModule).
  useEffect(() => { checkUnreadKomunikasi(); }, [checkUnreadKomunikasi]);

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
    // Delay 500ms supaya PhaseDiscussionsModule sempat update localStorage dulu
    setTimeout(checkUnreadKomunikasi, 500);
  }, [checkUnreadKomunikasi]);

  // ==========================================================================
  // STATE — Backed by Supabase (DB-driven) dengan DUMMY initial fallback
  // ==========================================================================
  // [F3.1 v2] DUMMY constants pattern decision (per Sequence 4):
  //   Initial state pakai DUMMY_* sebagai fallback sebelum loadData complete.
  //   Mencegah UI flicker (kosong → DB data) dan memberikan offline UX kalau
  //   Supabase tidak reachable. Setelah loadData success, state akan replaced
  //   dengan DB data. DUMMY constants di-bundle ke production build (~few KB).
  //
  //   Alternative future: kalau Phase 3 mau remove DUMMY (production sterile mode),
  //   replace dengan `useState<T[]>([])` + add loading skeleton di UI.
  // ==========================================================================
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

  // ==========================================================================
  // [S3.2] AUDIT LOG — sync-time prevSnapshot baseline (Decision §F #9)
  // ==========================================================================
  // useRef (bukan useState): hindari re-render saat update; single source of
  // truth untuk diff baseline. Populated:
  //   - di akhir loadData (DB → state hydration baseline)
  //   - per-entity setelah successful upsert di syncToCloud (next-cycle baseline)
  //
  // Shape mirror state shape, kecuali:
  //   - `pagu` di-flatten dari Record<year, PaguSection[]> ke flat PaguSection[]
  //     (id pattern `pagu-{year}-{slug}` sudah unique cross-year, jadi flat OK)
  //   - `payrollStatuses` dan `jasaFiles` di-convert dari Record ke array of
  //     ItemWithId untuk diffCollectionForAudit compatibility
  // ==========================================================================
  const prevSnapshotRef = useRef<{
    pagu:               PaguSection[];
    bills:              Bill[];
    claims:             PatientClaim[];
    doctors:            Doctor[];
    employees:          Employee[];
    revenueTargets:     RevenueTarget[];
    specialtyTargets:   SpecialtyTarget[];
    payrollStatuses:    Array<{ id: string; status: string }>;
    jasaFiles:          Array<{ id: string; tks: unknown[]; nakes: unknown[]; pengelola: unknown[] }>;
    bpjsHistory:        Record<string, BPJSCalcSettings>;
    jasaMap:            Record<string, string>;
    paguLock:           { locked: boolean };
    rabs:               RABCategory[];
    rpds:               RPDSection[];
  }>({
    pagu:             [],
    bills:            [],
    claims:           [],
    doctors:          [],
    employees:        [],
    revenueTargets:   [],
    specialtyTargets: [],
    payrollStatuses:  [],
    jasaFiles:        [],
    bpjsHistory:      {},
    jasaMap:          { tks: '', nakes: '', pengelola: '' },
    paguLock:         { locked: false },
    rabs:             [],
    rpds:             [],
  });

  // ==========================================================================
  // SYNC LOGIC — Supabase (Backend Pipeline)
  // ==========================================================================
  // Schema convention: SEMUA 9 tabel transactional pakai pure envelope JSONB:
  //   { id text PK, data jsonb NOT NULL, created_at, updated_at, created_by, updated_by }
  //
  // System settings table = key-value:
  //   { key text PK, value jsonb, updated_at }
  //
  // Storage bucket 'jasa-verification' = file binaries (10 MB limit, PDF/PNG/JPEG)
  //   Path: {periodKey}/{category}/{uuid}-{filename}
  //
  // Multi-year handling (F2.0): pagu_sections id pattern `pagu-{year}-{slug}`.
  // Zero-padded keys (F2.1, F2.2): payroll_statuses + jasa_verification_files.
  // ==========================================================================

  /**
   * loadData — Hydrate state dari Supabase saat app mount.
   *
   * @summary Granular per-entity loading dengan partial failure resilience.
   *   Setiap entity (pagu_sections, bills, claims, doctors, employees,
   *   revenue_targets, specialty_targets, payroll_statuses,
   *   jasa_verification_files, system_settings) di-load dalam try-catch sendiri.
   *   Kalau 1 entity gagal, others tetap di-load. Errors aggregated ke
   *   toast.warning di akhir.
   *
   * @sideEffect setDataByYear, setAllBills, setLogsList, setDoctorsList,
   *   setStaffList, setRevenueTargets, setSpecialtyTargets, setPayrollStatuses,
   *   setJasaVerificationFiles, setJasaAccountMap, setBpjsSettingsHistory,
   *   setIsPaguLocked, setLastSync, setIsSyncing.
   * @sideEffect Calls toast.warning() kalau ada partial load failures.
   * @sideEffect Logs counts via console.log, warnings via console.warn.
   *
   * @schemaDrift Defensive: missing id, non-array rows, null data fields
   *   semua di-handle dengan fallback graceful.
   *
   * @see syncToCloud — inverse operation (state → DB)
   * @see lib/supabase.ts — envelope JSONB helpers + client init
   */
  useEffect(() => {
    const loadData = async () => {
      setIsSyncing(true);

      // [F2.4 v2] Granular per-entity loading: kalau 1 entity gagal,
      //   entity lain tetap di-load. Aggregate errors ke toast warning di akhir.
      const errors: string[] = [];
      const counts: Record<string, number> = {
        pagu: 0, bills: 0, claims: 0, doctors: 0, employees: 0,
        revenue_targets: 0, specialty_targets: 0, payroll_statuses: 0,
        jasa_verification_files: 0,
      };

      // [S3.2] Snapshot accumulators — di-populate per entity success branch,
      //   lalu di-write ke prevSnapshotRef.current di akhir loadData (sebagai
      //   diff baseline untuk syncToCloud Decision §F #9 sync-time logging).
      //   Initialized ke CURRENT STATE (bisa DUMMY) supaya kalau DB empty,
      //   snapshot tidak kosong dan diff cycle benar saat user pertama kali
      //   edit + sync (tidak emit "DUMMY ditambahkan" sebagai bulk_create palsu).
      let snapshotPagu:             PaguSection[]                          = (Object.values(dataByYear) as PaguSection[][]).flat();
      let snapshotBills:            Bill[]                                 = allBills;
      let snapshotClaims:           PatientClaim[]                         = logsList;
      let snapshotDoctors:          Doctor[]                               = doctorsList;
      let snapshotEmployees:        Employee[]                             = staffList;
      let snapshotRevenueTargets:   RevenueTarget[]                        = revenueTargets;
      let snapshotSpecialtyTargets: SpecialtyTarget[]                      = specialtyTargets;
      let snapshotPayrollStatuses:  Array<{ id: string; status: string }>  = (Object.entries(payrollStatuses) as Array<[string, string]>).map(([id, status]) => ({ id, status }));
      let snapshotJasaFiles:        Array<{ id: string; tks: unknown[]; nakes: unknown[]; pengelola: unknown[] }> = Object.entries(jasaVerificationFiles).map(([id, f]) => { const ff = (f ?? {}) as { tks?: unknown[]; nakes?: unknown[]; pengelola?: unknown[] }; return { id, tks: ff.tks ?? [], nakes: ff.nakes ?? [], pengelola: ff.pengelola ?? [] }; });
      let snapshotBpjsHistory:      Record<string, BPJSCalcSettings>       = bpjsSettingsHistory;
      let snapshotJasaMap:          Record<string, string>                 = jasaAccountMap;
      let snapshotPaguLock:         { locked: boolean }                    = { locked: isPaguLocked };
      let snapshotRabs:             RABCategory[]                          = rabCategories;
      let snapshotRpds:             RPDSection[]                           = rpdSections;

      // [F2.0 v2] PAGU: partition by year via id pattern `pagu-{year}-{slug}`
      try {
        const { data: pagu, error } = await supabase.from('pagu_sections').select('*');
        if (error) throw error;
        if (pagu && pagu.length > 0) {
          const fallbackYear = selectedYear === 'ALL' ? 2025 : selectedYear;
          const byYear: Record<number, PaguSection[]> = {};
          pagu.forEach((p: any) => {
            // [F2.4 v2] Schema drift detection
            if (!p?.id || typeof p.id !== 'string') {
              console.warn('⚠️ pagu_sections row missing id, skipped:', p);
              return;
            }
            const match = p.id.match(/^pagu-(\d{4})-/);
            const year = match ? parseInt(match[1], 10) : fallbackYear;
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({
              id: p.id,
              tahun: p.data?.tahun ?? year,  // [Sprint A3] backfill tahun dari ID pattern jika belum ada
              title: p.data?.title || '',
              rows: Array.isArray(p.data?.rows) ? p.data.rows : [],
            });
          });
          setDataByYear(byYear);
          counts.pagu = pagu.length;
          // [S3.2] Capture snapshot — flatten cross-year (id sudah unique)
          snapshotPagu = Object.values(byYear).flat();
        }
      } catch (err: any) {
        console.warn('⚠️ Load pagu_sections failed:', err?.message || err);
        errors.push('pagu_sections');
      }

      // [S3.3] RABS: envelope unwrap. ID pattern `rab-{linkedPaguSectionId}` = `rab-pagu-{year}-{slug}` (year-implicit via FK).
      // RABCategory shape: {id, title, showNarrative, viewMode, linkedPaguSectionId, narrative, items}.
      try {
        const { data: rabs, error } = await supabase.from('rabs').select('*');
        if (error) throw error;
        if (rabs && rabs.length > 0) {
          const unwrapped: RABCategory[] = rabs.map((r: any) => ({
            id:                  r?.id ?? '',
            title:               r?.data?.title ?? '',
            showNarrative:       r?.data?.showNarrative ?? false,
            viewMode:            r?.data?.viewMode ?? 'SEMUA',
            linkedPaguSectionId: r?.data?.linkedPaguSectionId ?? '',
            narrative:           r?.data?.narrative ?? {} as any,
            items:               Array.isArray(r?.data?.items) ? r.data.items : [],
          }));
          setRabCategories(unwrapped);
          counts.rabs = rabs.length;
          snapshotRabs = unwrapped; // [S3.3]
        }
      } catch (err: any) {
        console.warn('⚠️ Load rabs failed:', err?.message || err);
        errors.push('rabs');
      }

      // [S3.3] RPDS: envelope unwrap. ID pattern `rpd-{linkedPaguSectionId}` = `rpd-pagu-{year}-{slug}`.
      // [Sprint B.5] Renamed linkedSectionId → linkedPaguSectionId. Loader masih
      // accept old key untuk backward compat (untuk data Supabase yang belum di-migrate).
      try {
        const { data: rpds, error } = await supabase.from('rpds').select('*');
        if (error) throw error;
        if (rpds && rpds.length > 0) {
          const unwrapped: RPDSection[] = rpds.map((r: any) => ({
            id:                  r?.id ?? '',
            title:               r?.data?.title ?? '',
            linkedPaguSectionId: r?.data?.linkedPaguSectionId ?? r?.data?.linkedSectionId ?? '',
            rows:                Array.isArray(r?.data?.rows) ? r.data.rows : [],
          }));
          setRpdSections(unwrapped);
          counts.rpds = rpds.length;
          snapshotRpds = unwrapped; // [S3.3]
        }
      } catch (err: any) {
        console.warn('⚠️ Load rpds failed:', err?.message || err);
        errors.push('rpds');
      }

      // BILLS: unwrap envelope, preserve id
      try {
        const { data: bills, error } = await supabase.from('bills').select('*');
        if (error) throw error;
        if (bills && bills.length > 0) {
          const unwrapped: Bill[] = bills.map((b: any) => ({ ...(b?.data || {}), id: b?.id }));
          setAllBills(unwrapped);
          counts.bills = bills.length;
          snapshotBills = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load bills failed:', err?.message || err);
        errors.push('bills');
      }

      // PATIENT CLAIMS: unwrap envelope, preserve id
      try {
        const { data: claims, error } = await supabase.from('patient_claims').select('*');
        if (error) throw error;
        if (claims && claims.length > 0) {
          const unwrapped: PatientClaim[] = claims.map((c: any) => ({ ...(c?.data || {}), id: c?.id }));
          setLogsList(unwrapped);
          counts.claims = claims.length;
          snapshotClaims = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load patient_claims failed:', err?.message || err);
        errors.push('patient_claims');
      }

      // DOCTORS: load dari DB (kalau ada). Kalau kosong, keep DUMMY dari constants.
      try {
        const { data: docs, error } = await supabase.from('doctors').select('*');
        if (error) throw error;
        if (docs && docs.length > 0) {
          const unwrapped: Doctor[] = docs.map((d: any) => ({ ...(d?.data || {}), id: d?.id }));
          setDoctorsList(unwrapped);
          counts.doctors = docs.length;
          snapshotDoctors = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load doctors failed:', err?.message || err);
        errors.push('doctors');
      }

      // EMPLOYEES: same pattern
      try {
        const { data: emps, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        if (emps && emps.length > 0) {
          const unwrapped: Employee[] = emps.map((e: any) => ({ ...(e?.data || {}), id: e?.id }));
          setStaffList(unwrapped);
          counts.employees = emps.length;
          snapshotEmployees = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load employees failed:', err?.message || err);
        errors.push('employees');
      }

      // [F1.1 v2] REVENUE TARGETS: envelope unwrap
      try {
        const { data: rt, error } = await supabase.from('revenue_targets').select('*');
        if (error) throw error;
        if (rt && rt.length > 0) {
          const unwrapped: RevenueTarget[] = rt.map((r: any) => ({ ...(r?.data || {}), id: r?.id }));
          setRevenueTargets(unwrapped);
          counts.revenue_targets = rt.length;
          snapshotRevenueTargets = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load revenue_targets failed:', err?.message || err);
        errors.push('revenue_targets');
      }

      // [F1.2 v2] SPECIALTY TARGETS: envelope unwrap
      try {
        const { data: st, error } = await supabase.from('specialty_targets').select('*');
        if (error) throw error;
        if (st && st.length > 0) {
          const unwrapped: SpecialtyTarget[] = st.map((s: any) => ({ ...(s?.data || {}), id: s?.id }));
          setSpecialtyTargets(unwrapped);
          counts.specialty_targets = st.length;
          snapshotSpecialtyTargets = unwrapped; // [S3.2]
        }
      } catch (err: any) {
        console.warn('⚠️ Load specialty_targets failed:', err?.message || err);
        errors.push('specialty_targets');
      }

      // [F2.1 v2] PAYROLL STATUSES: load Record<key, status>
      try {
        const { data: ps, error } = await supabase.from('payroll_statuses').select('*');
        if (error) throw error;
        if (ps && ps.length > 0) {
          const psMap: Record<string, 'Lunas' | 'Belum Lunas'> = {};
          ps.forEach((p: any) => {
            if (p?.id) psMap[p.id] = p.data?.status || 'Belum Lunas';
          });
          setPayrollStatuses(psMap);
          counts.payroll_statuses = ps.length;
          // [S3.2] Convert Record → Array<ItemWithId> untuk diff compatibility
          snapshotPayrollStatuses = Object.entries(psMap).map(([id, status]) => ({ id, status }));
        }
      } catch (err: any) {
        console.warn('⚠️ Load payroll_statuses failed:', err?.message || err);
        errors.push('payroll_statuses');
      }

      // [F2.2 v2] JASA VERIFICATION FILES: 1 row per period
      try {
        const { data: jvf, error } = await supabase.from('jasa_verification_files').select('*');
        if (error) throw error;
        if (jvf && jvf.length > 0) {
          const jvfMap: JasaVerificationFiles = {};
          jvf.forEach((j: any) => {
            if (!j?.id) return;
            const periodKey = j.id.replace(/^jvf-/, '');
            jvfMap[periodKey] = {
              tks: Array.isArray(j.data?.tks) ? j.data.tks : [],
              nakes: Array.isArray(j.data?.nakes) ? j.data.nakes : [],
              pengelola: Array.isArray(j.data?.pengelola) ? j.data.pengelola : [],
            };
          });
          setJasaVerificationFiles(jvfMap);
          counts.jasa_verification_files = jvf.length;
          // [S3.2] Convert Record → Array<ItemWithId> untuk diff compatibility
          snapshotJasaFiles = Object.entries(jvfMap).map(([id, f]) => ({ id, tks: f.tks, nakes: f.nakes, pengelola: f.pengelola }));
        }
      } catch (err: any) {
        console.warn('⚠️ Load jasa_verification_files failed:', err?.message || err);
        errors.push('jasa_verification_files');
      }

      // SYSTEM SETTINGS: key/value
      try {
        const { data: settings, error } = await supabase.from('system_settings').select('*');
        if (error) throw error;
        if (settings) {
          settings.forEach((s: any) => {
            if (!s?.key) return;
            if (s.key === 'jasa_map' && s.value) {
              setJasaAccountMap(s.value);
              snapshotJasaMap = s.value; // [S3.2]
            }
            if (s.key === 'bpjs_history' && s.value) {
              setBpjsSettingsHistory(s.value);
              snapshotBpjsHistory = s.value; // [S3.2]
            }
            if (s.key === 'pagu_lock' && typeof s.value === 'boolean') {
              setIsPaguLocked(s.value);
              snapshotPaguLock = { locked: s.value }; // [S3.2]
            }
          });
        }
      } catch (err: any) {
        console.warn('⚠️ Load system_settings failed:', err?.message || err);
        errors.push('system_settings');
      }

      setLastSync(new Date().toLocaleTimeString());
      console.log('✅ Data loaded from Supabase:', counts);

      // [F2.4 v2] Toast feedback: warning kalau ada partial failures
      if (errors.length > 0) {
        toast.warning(`Beberapa data gagal dimuat: ${errors.join(', ')}. Lihat console untuk detail.`, 6000);
      }
      // Note: tidak ada toast.success di load — too noisy on every refresh.

      // [S3.2] Capture snapshot baseline untuk diff cycle next syncToCloud.
      // Per-entity yang gagal load akan keep current-state value (DUMMY atau
      // last-known-good) — diff cycle benar saat user akhirnya re-edit.
      prevSnapshotRef.current = {
        pagu:             snapshotPagu,
        bills:            snapshotBills,
        claims:           snapshotClaims,
        doctors:          snapshotDoctors,
        employees:        snapshotEmployees,
        revenueTargets:   snapshotRevenueTargets,
        specialtyTargets: snapshotSpecialtyTargets,
        payrollStatuses:  snapshotPayrollStatuses,
        jasaFiles:        snapshotJasaFiles,
        bpjsHistory:      snapshotBpjsHistory,
        jasaMap:          snapshotJasaMap,
        paguLock:         snapshotPaguLock,
        rabs:             snapshotRabs,
        rpds:             snapshotRpds,
      };

      setIsSyncing(false);
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fungsi Helper untuk Simpan (Bisa dipanggil manual atau otomatis)
  // Pattern: untuk setiap row, pisahkan id dari business fields → upsert {id, data: rest}
  /**
   * syncToCloud — Persist current state ke Supabase via upsert pattern.
   *
   * @summary Fail-fast pattern — kalau 1 entity fails, abort dengan specific
   *   entity context di toast.error. Use `currentEntity` tracker variable untuk
   *   trace exactly which entity failed (e.g., "pagu_sections", "bills",
   *   "system_settings (bpjs_history)").
   *
   * @sideEffect Upserts ke 9 transactional tables + 3 system_settings KV:
   *   - pagu_sections (multi-year, save SEMUA tahun)
   *   - bills, patient_claims (envelope unwrap)
   *   - doctors, employees (master data)
   *   - revenue_targets, specialty_targets (year-aware)
   *   - payroll_statuses (zero-padded keys)
   *   - jasa_verification_files (skip empty + auto-DELETE ghost rows)
   *   - system_settings: jasa_map, bpjs_history, pagu_lock
   * @sideEffect setIsSyncing, setLastSync.
   * @sideEffect Calls toast.success() on full success, toast.error() with
   *   specific entity context on failure.
   *
   * @ghostCleanup F2.2 v2.1: jasa_verification_files periods dengan semua
   *   3 categories empty di-DELETE supaya DB tidak punya orphan rows.
   *
   * @see loadData — inverse operation (DB → state)
   */
  const syncToCloud = async () => {
    setIsSyncing(true);
    // [F2.4 v2] Track which entity di-process untuk specific error context di toast
    let currentEntity = '';
    // [S3.2] Buffer audit entries from per-entity diff calls; flushed di
    //   finally block sebagai single bulk insert (Decision §F #9 sync-time
    //   logging, single roundtrip per syncToCloud call). Kalau syncToCloud
    //   gagal di tengah, audit untuk entity yang sudah commit tetap di-flush
    //   (best-effort fidelity dengan DB state aktual).
    const auditBuffer: AuditEntryInput[] = [];
    try {
      // [F2.0 v2] PAGU: save SEMUA tahun dari dataByYear (bukan cuma current selected).
      // ID pattern: pagu-{year}-{slug}. Legacy 'sec-*' ids akan di-prefix dengan year.
      currentEntity = 'pagu_sections';
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

        // [FIX 10 Mei 2026] Orphan cleanup for pagu_sections
        const paguCurrentIds = allSections.map(s => s.id);
        const { data: allPaguRows } = await supabase.from('pagu_sections').select('id');
        if (allPaguRows) {
          const orphanIds = allPaguRows.filter(r => !paguCurrentIds.includes(r.id)).map(r => r.id);
          if (orphanIds.length > 0) {
            await supabase.from('pagu_sections').delete().in('id', orphanIds);
            console.log(`🧹 Pagu orphan cleanup: removed ${orphanIds.length} stale records`, orphanIds);
          }
        }

        // [S3.2] Audit emit — diff dari last snapshot ke current flat state
        const paguFlat: PaguSection[] = (Object.values(dataByYear) as PaguSection[][]).flat();
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.pagu, paguFlat, 'section',
          (s) => 'Pagu ' + (s.title || s.id),
        ));
        prevSnapshotRef.current.pagu = paguFlat;
      }

      // [S3.3] RABS: envelope upsert. ID native dari INITIAL_RAB_CATEGORIES = `rab-{linkedPaguSectionId}` (year-implicit).
      // [FIX 10 Mei 2026] Orphan cleanup — same pattern as RPDs.
      currentEntity = 'rabs';
      if (rabCategories.length > 0) {
        const rabsPayload = rabCategories.map(r => {
          const { id, ...rest } = r;
          return { id, data: rest };
        });
        const { error: rabsErr } = await supabase.from('rabs').upsert(rabsPayload);
        if (rabsErr) throw rabsErr;

        // Orphan cleanup: hapus record di DB yang tidak ada di current state
        // [FIX 10 Mei 2026 v2] Year-safe: hanya hapus orphan dari tahun yang sedang aktif,
        // BUKAN dari tahun lain yang datanya valid tapi tidak ter-load di state.
        const rabCurrentIds = rabCategories.map(r => r.id);
        const yearPrefix = `rab-pagu-${currentRKKSYear}-`;
        const { data: allRabRows } = await supabase.from('rabs').select('id');
        if (allRabRows) {
          const orphanIds = allRabRows
            .filter(r => r.id.startsWith(yearPrefix) && !rabCurrentIds.includes(r.id))
            .map(r => r.id);
          if (orphanIds.length > 0) {
            await supabase.from('rabs').delete().in('id', orphanIds);
            console.log(`🧹 RAB orphan cleanup (${currentRKKSYear}): removed ${orphanIds.length} stale records`, orphanIds);
          }
        }

        // [S3.3] Audit emit — D-S3.3-4: title primary, FK fallback
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.rabs, rabCategories, 'rab',
          (c) => 'RAB ' + ((c as any).title || (c as any).linkedPaguSectionId || (c as any).id),
        ));
        prevSnapshotRef.current.rabs = rabCategories;
      }

      // [S3.3] RPDS: envelope upsert. ID native = `rpd-{linkedPaguSectionId}` (year-implicit via pagu FK).
      // [FIX 10 Mei 2026] Orphan cleanup — delete stale RPD records yang sudah tidak ada di state.
      // Bug: upsert() hanya INSERT/UPDATE, tidak DELETE record lama saat pagu di-restructure.
      currentEntity = 'rpds';
      if (rpdSections.length > 0) {
        const rpdsPayload = rpdSections.map(r => {
          const { id, ...rest } = r;
          return { id, data: rest };
        });
        const { error: rpdsErr } = await supabase.from('rpds').upsert(rpdsPayload);
        if (rpdsErr) throw rpdsErr;

        // Orphan cleanup: hapus record di DB yang tidak ada di current state
        // [FIX 10 Mei 2026 v2] Year-safe: hanya hapus orphan dari tahun aktif
        const rpdCurrentIds = rpdSections.map(r => r.id);
        const rpdYearPrefix = `rpd-pagu-${currentRKKSYear}-`;
        const { data: allRpdRows } = await supabase.from('rpds').select('id');
        if (allRpdRows) {
          const orphanIds = allRpdRows
            .filter(r => r.id.startsWith(rpdYearPrefix) && !rpdCurrentIds.includes(r.id))
            .map(r => r.id);
          if (orphanIds.length > 0) {
            await supabase.from('rpds').delete().in('id', orphanIds);
            console.log(`🧹 RPD orphan cleanup (${currentRKKSYear}): removed ${orphanIds.length} stale records`, orphanIds);
          }
        }

        // [S3.3] Audit emit — D-S3.3-4: title primary, FK fallback
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.rpds, rpdSections, 'rpd',
          (s) => 'RPD ' + ((s as any).title || (s as any).linkedPaguSectionId || (s as any).id),
        ));
        prevSnapshotRef.current.rpds = rpdSections;
      }

      // BILLS: envelope upsert
      currentEntity = 'bills';
      if (allBills.length > 0) {
        const billsPayload = allBills.map(b => {
          const { id, ...rest } = b;
          return { id, data: rest };
        });
        const { error: billsErr } = await supabase.from('bills').upsert(billsPayload);
        if (billsErr) throw billsErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.bills, allBills, 'bill',
          (b) => 'Tagihan ' + ((b as any).label || (b as any).description || (b as any).id),
        ));
        prevSnapshotRef.current.bills = allBills;
      }

      // PATIENT CLAIMS: envelope upsert
      currentEntity = 'patient_claims';
      if (logsList.length > 0) {
        const claimsPayload = logsList.map(c => {
          const { id, ...rest } = c;
          return { id, data: rest };
        });
        const { error: claimsErr } = await supabase.from('patient_claims').upsert(claimsPayload);
        if (claimsErr) throw claimsErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.claims, logsList, 'claim',
          (c) => 'Klaim ' + ((c as any).noKlaim || (c as any).namaPasien || (c as any).id),
        ));
        prevSnapshotRef.current.claims = logsList;
      }

      // DOCTORS: envelope upsert
      currentEntity = 'doctors';
      if (doctorsList.length > 0) {
        const doctorsPayload = doctorsList.map(d => {
          const { id, ...rest } = d;
          return { id, data: rest };
        });
        const { error: docsErr } = await supabase.from('doctors').upsert(doctorsPayload);
        if (docsErr) throw docsErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.doctors, doctorsList, 'doctor',
          (d) => 'Dr. ' + ((d as any).nama || (d as any).id),
        ));
        prevSnapshotRef.current.doctors = doctorsList;
      }

      // EMPLOYEES: envelope upsert
      currentEntity = 'employees';
      if (staffList.length > 0) {
        const staffPayload = staffList.map(e => {
          const { id, ...rest } = e;
          return { id, data: rest };
        });
        const { error: empsErr } = await supabase.from('employees').upsert(staffPayload);
        if (empsErr) throw empsErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.employees, staffList, 'employee',
          (e) => 'Staf ' + ((e as any).nama || (e as any).id),
        ));
        prevSnapshotRef.current.employees = staffList;
      }

      // [F1.1 v2] REVENUE TARGETS: envelope upsert
      currentEntity = 'revenue_targets';
      if (revenueTargets.length > 0) {
        const rtPayload = revenueTargets.map(r => {
          const { id, ...rest } = r;
          return { id, data: rest };
        });
        const { error: rtErr } = await supabase.from('revenue_targets').upsert(rtPayload);
        if (rtErr) throw rtErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.revenueTargets, revenueTargets, 'revenueTarget',
          (r) => 'Target ' + ((r as any).label || (r as any).id),
        ));
        prevSnapshotRef.current.revenueTargets = revenueTargets;
      }

      // [F1.2 v2] SPECIALTY TARGETS: envelope upsert
      currentEntity = 'specialty_targets';
      if (specialtyTargets.length > 0) {
        const stPayload = specialtyTargets.map(s => {
          const { id, ...rest } = s;
          return { id, data: rest };
        });
        const { error: stErr } = await supabase.from('specialty_targets').upsert(stPayload);
        if (stErr) throw stErr;
        // [S3.2] Audit emit
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.specialtyTargets, specialtyTargets, 'specialtyTarget',
          (s) => 'Target Spes. ' + ((s as any).specialty || (s as any).id),
        ));
        prevSnapshotRef.current.specialtyTargets = specialtyTargets;
      }

      // [F2.1 v2] PAYROLL STATUSES: upsert Record<key, status>
      // Key sudah zero-padded format dari PayrollSummary.tsx via normalizeKey helper.
      currentEntity = 'payroll_statuses';
      const psEntries = Object.entries(payrollStatuses);
      if (psEntries.length > 0) {
        const psPayload = psEntries.map(([key, status]) => ({
          id: key,
          data: { status }
        }));
        const { error: psErr } = await supabase.from('payroll_statuses').upsert(psPayload);
        if (psErr) throw psErr;
        // [S3.2] Audit emit — convert Record → Array<ItemWithId> untuk diffCollectionForAudit
        const psArray: ItemWithId[] = psEntries.map(([id, status]) => ({ id, status }));
        auditBuffer.push(...diffCollectionForAudit(
          prevSnapshotRef.current.payrollStatuses, psArray, 'payrollStatus',
          (p) => 'Status ' + p.id,
        ));
        prevSnapshotRef.current.payrollStatuses = psArray as Array<{ id: string; status: string }>;
      }

      // [F2.2 v2] JASA VERIFICATION FILES: 1 row per period.
      // ID pattern: 'jvf-YYYY-MM' (zero-padded). Data = { tks: ProcurementFile[], nakes: ..., pengelola: ... }
      // Note: actual file binary di Supabase Storage bucket 'jasa-verification'.
      // Tabel ini hanya simpan metadata (id, namaFile, tipe, size, url).
      // [F2.2 v2.1] Skip empty periods (semua 3 categories empty) untuk prevent ghost rows.
      currentEntity = 'jasa_verification_files';
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
      // [S3.2] Audit emit — current state filtered to non-empty (matches what
      //   actually exists in DB pasca-upsert + ghost-cleanup).
      const jvfArrayForAudit = jvfEntries.map(([periodKey, files]) => {
        const ff = (files ?? {}) as { tks?: unknown[]; nakes?: unknown[]; pengelola?: unknown[] };
        return {
          id:        periodKey,
          tks:       ff.tks ?? [],
          nakes:     ff.nakes ?? [],
          pengelola: ff.pengelola ?? [],
        };
      });
      auditBuffer.push(...diffCollectionForAudit(
        prevSnapshotRef.current.jasaFiles, jvfArrayForAudit, 'jasaFile',
        (j) => 'File Jasa periode ' + j.id,
      ));
      prevSnapshotRef.current.jasaFiles = jvfArrayForAudit;

      // SYSTEM SETTINGS: key-value
      currentEntity = 'system_settings (jasa_map)';
      await supabase.from('system_settings').upsert({ key: 'jasa_map', value: jasaAccountMap });
      // [S3.2] Audit emit — diffObjectForAudit (single config object)
      auditBuffer.push(...diffObjectForAudit(
        prevSnapshotRef.current.jasaMap, jasaAccountMap, 'jasaConfig',
      ));
      prevSnapshotRef.current.jasaMap = jasaAccountMap;

      currentEntity = 'system_settings (bpjs_history)';
      await supabase.from('system_settings').upsert({ key: 'bpjs_history', value: bpjsSettingsHistory });
      // [S3.2] Audit emit
      auditBuffer.push(...diffObjectForAudit(
        prevSnapshotRef.current.bpjsHistory, bpjsSettingsHistory, 'bpjsConfig',
      ));
      prevSnapshotRef.current.bpjsHistory = bpjsSettingsHistory;

      currentEntity = 'system_settings (pagu_lock)';
      await supabase.from('system_settings').upsert({ key: 'pagu_lock', value: isPaguLocked });
      // [S3.2] Audit emit — wrap boolean dalam object untuk diffObjectForAudit compatibility
      const paguLockNext = { locked: isPaguLocked };
      auditBuffer.push(...diffObjectForAudit(
        prevSnapshotRef.current.paguLock, paguLockNext, 'paguLock',
      ));
      prevSnapshotRef.current.paguLock = paguLockNext;
      
      setLastSync(new Date().toLocaleTimeString());
      console.log('✅ Sync to Supabase berhasil');
      // [F2.4 v2] Replace silent success → user-visible toast
      toast.success('✅ Sinkronisasi ke cloud berhasil');
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown error';
      console.error(`❌ Gagal sinkronisasi ke cloud (entity: ${currentEntity}):`, err);
      // [F2.4 v2] Toast error dengan specific entity context
      toast.error(`Sync gagal di ${currentEntity}: ${errMsg}`, 6000);
    } finally {
      // [S3.2] Best-effort audit flush. Errors di logAuditEntries di-swallow
      //   internal (return 0), tidak akan throw — aman di finally walau sync
      //   gagal di tengah. Decision §F #8: silent (no toast spam) — audit
      //   sukses tidak emit toast karena terlalu noisy untuk per-CRUD events.
      if (auditBuffer.length > 0) {
        await logAuditEntries(auditBuffer);
      }
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
    // [Sprint A2] RPD rows mirror Pagu rows (id, kode, description, level), tapi
    // budget tidak lagi disimpan di RPD — di-derive dari Pagu via paguByKode.
    // useEffect ini hanya pastikan struktur RPD sinkron dengan Pagu (rows ada).
    const rpdSectionsInitial = paguSections.map(sec => ({
      id: `rpd-${sec.id}`,
      title: sec.title,
      linkedPaguSectionId: sec.id,
      rows: sec.rows.map(r => ({
        id: r.id,
        kode: r.kode,
        description: r.description,
        level: r.level,
        monthly: { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0 }
      }))
    }));
    setRpdSections(prev => {
       if (prev.length === 0) return rpdSectionsInitial;
       return rpdSectionsInitial.map(newSec => {
          const existing = prev.find(p => p.linkedPaguSectionId === newSec.linkedPaguSectionId);
          if (existing) {
            // Preserve existing monthly distribution; struktur baru ikut Pagu
            return { ...newSec, rows: newSec.rows.map(nr => {
              const exRow = existing.rows.find(er => er.id === nr.id);
              return exRow ? { ...nr, monthly: exRow.monthly } : nr;
            })};
          }
          return newSec;
       });
    });
  }, [paguSections]);

  // ── P3: RealisasiBucket — coexistence primitive ──
  // Pre-compute jasa monthly data (bridge from BPJS module into bucket builder)
  const jasaMonthlyData = useMemo((): JasaMonthlyData[] => {
    const filterYearNum = selectedYear === 'ALL' ? 2025 : selectedYear;
    const result: JasaMonthlyData[] = [];
    for (let m = 1; m <= 12; m++) {
      const tksTotal = staffList.filter(s => s.status === 'TKS').reduce((sum, s) => sum + (s.baseHonor || 0), 0);
      const monthlyTransport = doctorsList.reduce((sum, d) => sum + (d.baseTransport || 0), 0);
      const monthlyLogs = logsList.filter(l => l.tahun === filterYearNum && l.bulan === m && l.status === 'Lunas');
      const nakesTotal = monthlyTransport + monthlyLogs.reduce((sum, l) => {
        const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
        const f = calculatePatientFees(l, s);
        return sum + (f.spesialis + f.anestesi + f.gp + f.konsul + f.paramOK + f.paramICU + f.paramGen + f.penataAnestesi);
      }, 0);
      const pengelolaTotal = monthlyLogs.reduce((sum, l) => {
        const s = getEffectiveSettings(l.tahun, l.bulan, bpjsSettingsHistory);
        const f = calculatePatientFees(l, s);
        return sum + (f.pengelola + f.manajemen + f.casemix);
      }, 0);
      result.push({ bulan: m, tksTotal, nakesTotal, pengelolaTotal });
    }
    return result;
  }, [logsList, doctorsList, staffList, selectedYear, bpjsSettingsHistory]);

  // Build bucket registry — replaces old absorptionMap with rich posting data + IV checks
  const bucketRegistry = useMemo((): BucketRegistry => {
    return buildBucketRegistry({
      paguSections, rpdSections, bills: allBills,
      jasaMonthlyData, jasaAccountMap,
      selectedYear, budgetViewMode,
    });
  }, [paguSections, rpdSections, allBills, jasaMonthlyData, jasaAccountMap, selectedYear, budgetViewMode]);

  // Backward-compatible alias (drop-in replacement for old realisasiMetrics)
  const realisasiMetrics = useMemo(() => ({
    totalPagu: bucketRegistry.totalPagu,
    totalReal: bucketRegistry.totalReal,
    absorptionMap: bucketRegistry.absorptionMap,
  }), [bucketRegistry]);

  const handleMainTabChange = (tab: MainTab) => {
    setMainTab(tab);
    if (tab === MainTab.RKKS) { setSubTab(SubTab.PAGU_ANGGARAN); setActiveTabType(TabType.PAGU); }
    else if (tab === MainTab.PENDAPATAN) { setSubTab(SubTab.TARGET_PENDAPATAN); setActiveTabType(TabType.REV_DASHBOARD); }
    else if (tab === MainTab.BELANJA) { setSubTab(SubTab.BELANJA_JASA); setActiveTabType(TabType.JASA_BPJS); }
    else { setSubTab(SubTab.LAPORAN_LRA); setActiveTabType(TabType.FINANCIAL_HEALTH); }
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
      // [S5.4] Tab 4 sub-tabs — both keep TabType.FINANCIAL_HEALTH (RevenueModule
      // and DeviationDashboard tidak share activeTabType-driven branching)
      case SubTab.LAPORAN_LRA: setActiveTabType(TabType.FINANCIAL_HEALTH); break;
      case SubTab.DEVIASI_TINJAUAN: setActiveTabType(TabType.FINANCIAL_HEALTH); break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* [F2.4 v2] Toast UI — render once at root, listens for toast.* calls anywhere in app */}
      <ToastContainer />
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

             {/* [S3.2.3] Settings gear icon — opens SettingsModule overlay (Riwayat Aktivitas + future config tabs) */}
             {/* [Komunikasi] Red dot badge untuk unread Komunikasi messages (D5 visual indicator) */}
             <button
               onClick={() => setIsSettingsOpen(true)}
               className="relative p-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl text-white transition-all"
               title={unreadCount > 0 ? `Pengaturan & Riwayat (${unreadCount} pesan baru di Komunikasi)` : 'Pengaturan & Riwayat Aktivitas'}
               aria-label="Buka pengaturan"
             >
               <SettingsIcon size={20} />
               {unreadCount > 0 && (
                 <span
                   className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-slate-900 shadow-lg"
                   aria-label={`${unreadCount} pesan baru`}
                 >
                   {unreadCount > 99 ? '99+' : unreadCount}
                 </span>
               )}
             </button>
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
            {/* [S5.4] Tab 4 sub-tabs */}
            {mainTab === MainTab.FINANCIAL_HEALTH && (
              <>
                <SubTabButton active={subTab === SubTab.LAPORAN_LRA} onClick={() => handleSubTabChange(SubTab.LAPORAN_LRA)} label="4.1 Pelaporan & LRA" icon={<HeartPulse size={14} />} />
                <SubTabButton active={subTab === SubTab.DEVIASI_TINJAUAN} onClick={() => handleSubTabChange(SubTab.DEVIASI_TINJAUAN)} label="4.2 Deviasi & Tinjauan" icon={<BarChart3 size={14} />} />
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
                <PaguAnggaran metrics={{ total: { budget: realisasiMetrics.totalPagu, real: realisasiMetrics.totalReal } }} sections={paguSections} onSectionsChange={s => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: s})} onAddSection={() => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: [...paguSections, { id: `pagu-${currentRKKSYear}-${Date.now()}`, tahun: currentRKKSYear, title: '', rows: [] }]})} onDeleteSection={id => !isPaguLocked && setDataByYear({...dataByYear, [currentRKKSYear]: paguSections.filter(s => s.id !== id)})} viewMode={budgetViewMode} selectedYear={currentRKKSYear} onYearChange={setSelectedYear} />
              )}
              {activeTabType === TabType.RAB && (
                <RAB paguSections={paguSections} categories={rabCategories} onCategoriesChange={setRabCategories} selectedYear={currentRKKSYear} />
              )}
              {activeTabType === TabType.RPD && (
                <RPD sections={rpdSections} paguSections={paguSections} onSectionsChange={setRpdSections} viewMode={budgetViewMode} selectedYear={currentRKKSYear} />
              )}
              {activeTabType === TabType.REALISASI && (
                <RealisasiRPD
                  sections={rpdSections.map(sec => ({
                    ...sec,
                    rows: sec.rows.map(row => ({
                      ...row,
                      monthly: {
                        m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0,
                        m7: 0, m8: 0, m9: 0, m10: 0, m11: 0, m12: 0,
                        ...(realisasiMetrics.absorptionMap[row.kode.trim()] || {})
                      }
                    }))
                  }))}
                  rpdPlannedSections={rpdSections}
                  paguSections={paguSections}
                  onSectionsChange={setRpdSections}
                  viewMode={budgetViewMode}
                  selectedYear={currentRKKSYear}
                />
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
                <OperationalBilling activeTabType={activeTabType} subTab={subTab} bills={allBills} onBillsChange={setAllBills} globalYear={selectedYear} logs={logsList} bpjsSettingsHistory={bpjsSettingsHistory} doctors={doctorsList} staff={staffList} jasaAccountMap={jasaAccountMap} onJasaAccountMapChange={setJasaAccountMap} onMinimizeForm={f => setMinimizedForms([...minimizedForms, f])} reopenedForm={activeFormFromMinimized} onReopenedFormHandled={() => setActiveFormFromMinimized(null)} paguSections={paguSections} />
              )}
              {/* Tab 3 Pendapatan + Tab 4 Pelaporan & LRA (default sub-tab 4.1) → RevenueModule */}
              {(mainTab === MainTab.PENDAPATAN ||
                (mainTab === MainTab.FINANCIAL_HEALTH && subTab === SubTab.LAPORAN_LRA)) && (
                <RevenueModule activeTabType={activeTabType} logs={logsList} targets={revenueTargets} onTargetsChange={setRevenueTargets} specialtyTargets={specialtyTargets} onSpecialtyTargetsChange={setSpecialtyTargets} selectedYear={selectedYear} doctors={doctorsList} bills={allBills} rpdData={rpdSections} />
              )}
              {/* [S5.4] Tab 4 sub-tab 4.2 → DeviationDashboard */}
              {mainTab === MainTab.FINANCIAL_HEALTH && subTab === SubTab.DEVIASI_TINJAUAN && (
                <DeviationDashboard
                  selectedYear={selectedYear}
                  paguSections={paguSections}
                  rpdSections={rpdSections}
                  allBills={allBills}
                  absorptionMap={realisasiMetrics.absorptionMap}
                />
              )}
           </div>
        </div>
      </main>

      {/* [S3.2.3] Settings overlay — Riwayat Aktivitas + future config tabs.
          Mounted at root level (z-100) so it sits above all main app content.
          [Komunikasi] onClose dirouted via handleSettingsClose untuk re-check unread count. */}
      {isSettingsOpen && (
        <SettingsModule onClose={handleSettingsClose} />
      )}
    </div>
  );
};

export default App;
