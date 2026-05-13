import React, { useMemo, useState, useEffect } from 'react';
import { PaguRow, PaguSection, RPDSection } from '../types';
import { formatIDR } from './Formatters';
import { Plus, Trash2, TrendingUp, DollarSign, Wallet, ChevronDown, ChevronRight, Landmark, Calendar, Printer, FileSpreadsheet, ListChecks, ShieldCheck } from 'lucide-react';
import { YEARS } from '../constants';
import KodeAutocomplete from './KodeAutocomplete';
import { deriveKodeBas, lookupBas } from '../utils/basDictionary';
import PaguDiffDashboard from './PaguDiffDashboard';
import LaporanRevisi, { type LaporanMode } from './LaporanRevisi';
import { classifyRow, getHiddenRowIds, type RowFilterMode } from '../utils/paguDiff';
// [Tier 3 Phase 3] Metadata recommendation UI
import { recommendMetadata, aggregateConfidence } from '../utils/metadataRecommender';
import MetadataDetailRow from './MetadataDetailRow';
import MetadataApplyModal from './MetadataApplyModal';
import MetadataOverrideModal from './MetadataOverrideModal';
import { toast } from './Toast';
// [Konteks 1 TD Fix — Decision T8a, pre-Tier-4c flight]
// Re-derive jumlahBiayaRevisi via Konteks 1 fallback semantic supaya UI
// display consistent dengan validator semantics (hsr=0 fallback ke hsa,
// per normative logic Angga Sprint D Item #1).
import { getEffectiveValue } from '../utils/paguLookup';
// [Tier 4a Phase 3c] Inline validation indicators (colored dot per row)
import type { ConstraintId } from '../utils/validators/types';
import { runAllValidators } from '../utils/validators/runAllValidators';
import {
  buildRowConstraintMap,
  pickPriorityIndicator,
  buildTooltipText,
} from '../utils/validators/rowConstraintMap';

interface PaguAnggaranProps {
  sections: PaguSection[];
  onSectionsChange: (newSections: PaguSection[]) => void;
  onAddSection: () => void;
  onDeleteSection: (id: string) => void;
  viewMode: 'SEMULA' | 'REVISI' | 'SEMUA';
  selectedYear: number;
  onYearChange: (year: number) => void;
  /**
   * [Tier 4a Phase 3c] Callback saat user klik validation dot di kolom Kode.
   * Parent (App.tsx) handle navigate ke sub-tab 1.5 Validasi + auto-expand
   * detail panel untuk constraint yang priority. Optional — kalau tidak
   * passed, dot tetap visible tapi tidak clickable.
   */
  onNavigateToValidasi?: (constraintId: ConstraintId) => void;
  /**
   * [Tier 4a Phase 3d] Row yang harus di-scroll dan di-highlight saat
   * Pagu Anggaran tab di-mount (consumed dari pendingPaguRowHighlight di
   * App.tsx). Diset saat user klik "→ Pagu Anggaran" di Validasi detail
   * panel. UseEffect handle scrollIntoView + temporary highlight glow.
   * Silent no-op kalau row hidden (section collapsed/filtered).
   */
  pendingRowHighlight?: { sectionId: string; rowId: string } | null;
  /**
   * Callback untuk clear pendingPaguRowHighlight di parent setelah
   * di-consume. Mencegah re-trigger highlight saat re-render.
   */
  onRowHighlightConsumed?: () => void;
  /**
   * [Tier 4c Phase 3b] RPD sections untuk C11 cross-table check di
   * inline indicator path. Tanpa prop ini, C11 akan stuck pending dan
   * dot inline untuk C11 affected rows tidak akan muncul di kolom Kode.
   * Wajib pass dari App.tsx per Q5 default (konsistensi UX dengan
   * dashboard validation).
   */
  rpdSections?: RPDSection[];
  metrics: {
    total: { budget: number; real: number };
  };
}

const PaguAnggaran: React.FC<PaguAnggaranProps> = ({ 
  sections, onSectionsChange, onAddSection, onDeleteSection, 
  viewMode, selectedYear, onYearChange, metrics,
  onNavigateToValidasi, pendingRowHighlight, onRowHighlightConsumed,
  rpdSections,
}) => {

  // Sprint D Item #2 Phase 2 — Inline filter (Opsi A)
  const [rowFilter, setRowFilter] = useState<RowFilterMode>('all');
  // Sprint D Item #2 Phase 3 — Laporan Revisi modal (dual-mode per Sie Renbang)
  // 'pergeseran'   = Laporan Revisi POK (bulanan, net change 0)
  // 'tambah_pagu'  = Laporan Tambah Pagu (semesteran, net change positif)
  const [showLaporan, setShowLaporan] = useState<LaporanMode | null>(null);
  // Sprint D Item #2 Phase 4 — Ringkasan Pagu list view filter (Sie Renbang request)
  const [ringkasanFilter, setRingkasanFilter] = useState('');

  // [Tier 3 Phase 3] Metadata expandable rows — DERIVED STATE pattern (BARU 11 Mei 2026)
  //
  // Sejarah: Initial implementation pakai useEffect untuk auto-expand on first
  // mount (single-shot). Owner test 11 Mei 2026 menemukan bug: "auto-expand
  // bekerja sebentar, lalu menutup otomatis" — race condition antara useEffect
  // init dan downstream state update (kemungkinan multiple setDataByYear calls
  // saat initial load melalui dataByYear).
  //
  // Fix: Replace dengan derived state.
  //   - autoExpandedIds: set of row.id dengan aggregate confidence MEDIUM/LOW,
  //     re-computed setiap render via useMemo (deps: [sections]).
  //   - userToggledIds: explicit user click via chevron — independent state.
  //   - isExpanded(rowId) = XOR(auto, userToggled):
  //     * Row di autoExpanded, user tidak toggle → expanded (default per D2)
  //     * Row di autoExpanded, user TOGGLE (collapse) → collapsed
  //     * Row TIDAK autoExpanded, user TOGGLE (expand) → expanded
  //     * Row TIDAK autoExpanded, user tidak toggle → collapsed
  //
  // Manfaat: Tidak ada race condition. Auto-expand selalu konsisten dengan
  // recommender output. Manual toggle user persisted via explicit state.
  const autoExpandedIds = useMemo(() => {
    const ids = new Set<string>();
    sections.forEach(section => {
      section.rows.forEach((row, idx) => {
        const hasChildren = idx < section.rows.length - 1 && section.rows[idx + 1].level > row.level;
        if (hasChildren) return;
        if (!row.kode_bas && !row.kode) return; // skip empty rows
        const rec = recommendMetadata(row);
        if (aggregateConfidence(rec) !== 'high') ids.add(row.id);
      });
    });
    return ids;
  }, [sections]);

  const [userToggledIds, setUserToggledIds] = useState<Set<string>>(new Set());

  const isExpanded = (rowId: string): boolean =>
    autoExpandedIds.has(rowId) !== userToggledIds.has(rowId);

  // [Tier 3 Phase 3] Modal state untuk apply (E2: preview→confirm) + override
  // (warning sebelum set metadata_review per Owner direction 11 Mei 2026).
  const [modalState, setModalState] = useState<
    { type: 'apply' | 'override'; sectionId: string; row: PaguRow } | null
  >(null);

  // [Tier 3 Phase 3] Toggle expand untuk satu row (chevron click)
  const toggleRowExpand = (rowId: string) => {
    setUserToggledIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  // [Tier 3 Phase 3] Apply recommendation: merge updates ke row + close modal
  // + toast guidance (Decision K3 Owner-approved 11 Mei 2026)
  const handleApplyRecommendation = (sectionId: string, rowId: string, updates: Partial<PaguRow>) => {
    const newSections = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        rows: sec.rows.map(r => (r.id === rowId ? { ...r, ...updates } : r)),
      };
    });
    onSectionsChange(newSections);
    setModalState(null);
    toast.info('Rekomendasi diterapkan. Klik tombol Sync (☁️ di header) untuk persist ke database.');
  };

  // [Tier 3 Phase 3] Set / remove metadata_review (override flag)
  // + toast guidance (Decision K3)
  const handleSetMetadataReview = (
    sectionId: string,
    rowId: string,
    review: PaguRow['metadata_review'] | null
  ) => {
    const newSections = sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        rows: sec.rows.map(r => {
          if (r.id !== rowId) return r;
          if (review === null) {
            const { metadata_review: _omit, ...rest } = r;
            return rest as PaguRow;
          }
          return { ...r, metadata_review: review };
        }),
      };
    });
    onSectionsChange(newSections);
    setModalState(null);
    toast.info(
      review === null
        ? 'Override dihapus. Klik Sync (☁️) untuk persist.'
        : 'Override "Manually Reviewed" diset. Klik Sync (☁️) untuk persist.'
    );
  };

  // [Tier 3 Phase 3] colSpan untuk MetadataDetailRow (tergantung viewMode)
  // 4 fixed (Kode/Uraian/Vol/Satuan) + 2 if Semula + 2 if Revisi + 3 fixed
  // (Sumber/StatusMetadata/Delete) = 7-11 columns total.
  const computeDetailColSpan = (showSemula: boolean, showRevisi: boolean) =>
    4 + (showSemula ? 2 : 0) + (showRevisi ? 2 : 0) + 3;

  // FUNGSI UTAMA: Menghitung total biaya berdasarkan hierarki (Bubble Up)
  const processedSections = useMemo(() => {
    return sections.map(section => {
      let rows = [...section.rows];
      
      // Hitung Jumlah Biaya untuk baris rincian (yang tidak punya anak)
      rows = rows.map((row, idx) => {
        const hasChildren = idx < rows.length - 1 && rows[idx + 1].level > row.level;
        if (!hasChildren) {
          return {
            ...row,
            jumlahBiayaAwal: (row.volume || 0) * (row.hargaSatuanAwal || 0),
            jumlahBiayaRevisi: (row.volume || 0) * (row.hargaSatuanRevisi || 0)
          };
        }
        return row;
      });

      // Bubble up totals dari level terdalam ke level terluar (5 ke 0)
      for (let lvl = 5; lvl >= 0; lvl--) {
        rows = rows.map((row, idx) => {
          const hasChildren = idx < rows.length - 1 && rows[idx + 1].level > row.level;
          if (row.level === lvl && hasChildren) {
            let sumAwal = 0;
            let sumRevisi = 0;
            // Cari semua anak langsung (level + 1) sampai bertemu level yang sama atau lebih kecil
            for (let j = idx + 1; j < rows.length; j++) {
              if (rows[j].level <= row.level) break;
              if (rows[j].level === row.level + 1) {
                sumAwal += rows[j].jumlahBiayaAwal || 0;
                sumRevisi += rows[j].jumlahBiayaRevisi || 0;
              }
            }
            return { ...row, jumlahBiayaAwal: sumAwal, jumlahBiayaRevisi: sumRevisi };
          }
          return row;
        });
      }
      return { ...section, rows };
    });
  }, [sections]);

  // Ringkasan per Kode Akun (Menggabungkan semua seksi)
  const summaryByAccount = useMemo(() => {
    const map: Record<string, { awal: number, revisi: number, desc: string }> = {};
    processedSections.forEach(sec => {
      sec.rows.forEach(row => {
        const cleanCode = row.kode.trim();
        const hasChildren = processedSections.flatMap(s => s.rows).some((r, idx, arr) => {
            const myIdx = arr.findIndex(x => x.id === row.id);
            return idx === myIdx + 1 && r.level > row.level;
        });
        
        // Hanya hitung baris rincian (Leaf nodes) agar tidak double counting
        if (cleanCode && !hasChildren) {
          if (!map[cleanCode]) map[cleanCode] = { awal: 0, revisi: 0, desc: row.description };
          map[cleanCode].awal += row.jumlahBiayaAwal;
          map[cleanCode].revisi += row.jumlahBiayaRevisi;
        }
      });
    });
    return Object.entries(map).sort();
  }, [processedSections]);

  // [FIX 10 Mei 2026] Deteksi duplikasi kode akun lintas section
  // Mencegah kode akun yang sama muncul di >1 section (inflate total RPD/LRA)
  const duplicateKodeWarnings = useMemo(() => {
    const kodeToSections: Record<string, { sectionTitles: string[]; sectionIds: string[] }> = {};
    processedSections.forEach(sec => {
      sec.rows.forEach(row => {
        const cleanCode = row.kode.trim();
        if (!cleanCode) return;
        // Only check leaf nodes (non-parent rows)
        const allRows = processedSections.flatMap(s => s.rows);
        const myIdx = allRows.findIndex(r => r.id === row.id);
        const nextRow = allRows[myIdx + 1];
        const hasChildren = nextRow && nextRow.level > row.level;
        if (hasChildren) return;

        if (!kodeToSections[cleanCode]) kodeToSections[cleanCode] = { sectionTitles: [], sectionIds: [] };
        if (!kodeToSections[cleanCode].sectionIds.includes(sec.id)) {
          kodeToSections[cleanCode].sectionTitles.push(sec.title || sec.id);
          kodeToSections[cleanCode].sectionIds.push(sec.id);
        }
      });
    });
    // Only return entries that appear in >1 section
    const dupes: Record<string, string[]> = {};
    Object.entries(kodeToSections).forEach(([kode, info]) => {
      if (info.sectionIds.length > 1) dupes[kode] = info.sectionTitles;
    });
    return dupes;
  }, [processedSections]);

  // Deteksi duplikasi nama section
  const duplicateTitleWarnings = useMemo(() => {
    const titleCount: Record<string, number> = {};
    sections.forEach(sec => {
      const t = (sec.title || '').trim().toUpperCase();
      if (t) titleCount[t] = (titleCount[t] || 0) + 1;
    });
    const dupes = new Set<string>();
    Object.entries(titleCount).forEach(([t, count]) => { if (count > 1) dupes.add(t); });
    return dupes;
  }, [sections]);

  const hasDuplicateKodes = Object.keys(duplicateKodeWarnings).length > 0;
  const hasDuplicateTitles = duplicateTitleWarnings.size > 0;

  // ─── [Tier 4a Phase 3c] Inline validation indicators ─────────────────
  // Compute validation result + row→constraints map untuk render dot
  // di kolom Kode per leaf row. Light recompute on data changes (~5ms
  // for 304 leaves); useMemo memoize per sections + year change.
  // Per Decision Q7: full re-run on demand (no caching layer beyond
  // React memoization).
  //
  // [Tier 4c Phase 3b] rpdSections wajib di-pass untuk C11 cross-table
  // check di inline indicator path (Q5 default — konsistensi UX dengan
  // dashboard). c11Strategy default 'permisif' (read localStorage di
  // ValidasiRevisiPOK, untuk inline path biarkan default = baseline UX).
  const validationResult = useMemo(
    () => runAllValidators({
      ta: selectedYear,
      sections,
      evaluatedAt: new Date(),
      rpdsData: rpdSections,
    }),
    [sections, selectedYear, rpdSections]
  );
  const rowConstraintMap = useMemo(
    () => buildRowConstraintMap(validationResult),
    [validationResult]
  );

  // ─── [Tier 4a Phase 3d] Scroll + highlight row on cross-tab navigation ──
  // Saat user click "→ Pagu Anggaran" di Validasi detail panel, parent
  // (App.tsx) set pendingRowHighlight + switch sub-tab. Tab ini mount,
  // useEffect cari element via data-row-id, scroll into view + add ring
  // glow class ~2s, lalu clear.
  //
  // Silent no-op kalau:
  //   - pendingRowHighlight null (normal mount, tidak ada highlight request)
  //   - Element tidak ada di DOM (section/row hidden via filter atau collapse)
  useEffect(() => {
    if (!pendingRowHighlight) return;
    // Defer ke next tick supaya DOM stable setelah mount + filter logic
    const timeoutId = setTimeout(() => {
      const el = document.querySelector(
        `[data-row-id="${pendingRowHighlight.rowId}"]`
      ) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight glow — Tailwind ring + transition
        el.classList.add('ring-4', 'ring-emerald-400', 'ring-offset-2', 'transition-all', 'duration-500');
        // Remove highlight after 2s
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-emerald-400', 'ring-offset-2');
          onRowHighlightConsumed?.();
        }, 2000);
      } else {
        // Row not in DOM (hidden by filter/collapse) — silent clear
        onRowHighlightConsumed?.();
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [pendingRowHighlight, onRowHighlightConsumed]);

  const handleRowChange = (sectionId: string, rowId: string, field: keyof PaguRow, value: any) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const newRows = sec.rows.map(row => {
          if (row.id !== rowId) return row;
          
          // Build candidate updated row
          let updated: PaguRow = { ...row, [field]: value };
          
          // Sprint D Item #1 — Konteks 1 fix: auto-mirror Revisi ← Semula
          // Saat user input/edit hargaSatuanAwal, jika hargaSatuanRevisi belum
          // di-set explicit (0 atau equal ke old Awal), mirror Semula ke Revisi.
          // Rule normatif Angga: harga semula = baseline, revisi opsional.
          // Revisi=0 BUKAN drop — harus fallback ke Semula.
          if (field === 'hargaSatuanAwal') {
            const oldAwal = row.hargaSatuanAwal || 0;
            const oldRevisi = row.hargaSatuanRevisi || 0;
            const newAwal = Number(value) || 0;
            // Mirror only if Revisi was untouched (0) or mirrored to old Awal
            if (oldRevisi === 0 || oldRevisi === oldAwal) {
              updated.hargaSatuanRevisi = newAwal;
            }
          }
          
          // Sprint D Item #1 — Schema integrity sync:
          // Saat hargaSatuan{Awal,Revisi} atau volume berubah,
          // recompute jumlahBiaya{Awal,Revisi} = harga × volume.
          // Hanya untuk leaf row (yang tidak punya children).
          //
          // [Konteks 1 TD Fix — Decision T8a, 11 Mei 2026 pre-Tier-4c]
          // jumlahBiayaRevisi pakai getEffectiveValue (Konteks 1 fallback
          // semantic: hsr=0 → fallback ke hsa). Sebelumnya pakai raw
          // hsr×vol yang menghasilkan 0 saat hsr=0 — inconsistent dengan
          // validator effectiveRevisi semantic + display tampil 0
          // padahal effective value adalah hsa×vol.
          if (field === 'hargaSatuanAwal' || field === 'hargaSatuanRevisi' || field === 'volume') {
            const vol = updated.volume || 0;
            updated.jumlahBiayaAwal = (updated.hargaSatuanAwal || 0) * vol;
            updated.jumlahBiayaRevisi = getEffectiveValue(updated, 'REVISI');
          }
          
          return updated;
        });
        return { ...sec, rows: newRows };
      }
      return sec;
    });
    onSectionsChange(newSections);
  };

  const addRootRow = (sectionId: string) => {
    const newRow: PaguRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      kode: '', description: '', volume: 1, satuan: '',
      hargaSatuanAwal: 0, hargaSatuanRevisi: 0, jumlahBiayaAwal: 0,
      jumlahBiayaRevisi: 0, sumberDana: 'RM', level: 0
    };
    onSectionsChange(sections.map(sec => sec.id === sectionId ? { ...sec, rows: [...sec.rows, newRow] } : sec));
  };

  const addSubRow = (sectionId: string, parentRowId: string) => {
    const newSections = sections.map(sec => {
      if (sec.id === sectionId) {
        const parentIndex = sec.rows.findIndex(r => r.id === parentRowId);
        if (parentIndex === -1) return sec;
        const parent = sec.rows[parentIndex];
        const newRow: PaguRow = {
          id: `row-${Date.now()}-${Math.random()}`,
          kode: '', description: '', volume: 1, satuan: '',
          hargaSatuanAwal: 0, hargaSatuanRevisi: 0, jumlahBiayaAwal: 0,
          jumlahBiayaRevisi: 0, sumberDana: parent.sumberDana, level: Math.min(parent.level + 1, 5)
        };
        const newRows = [...sec.rows];
        newRows.splice(parentIndex + 1, 0, newRow);
        return { ...sec, rows: newRows };
      }
      return sec;
    });
    onSectionsChange(newSections);
  };

  const showSemula = viewMode === 'SEMULA' || viewMode === 'SEMUA';
  const showRevisi = viewMode === 'REVISI' || viewMode === 'SEMUA';

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full -mr-48 -mt-48 opacity-40"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-emerald-500" /> Pilih Tahun Anggaran
             </label>
             <div className="relative group">
                <select 
                  value={selectedYear} 
                  onChange={(e) => onYearChange(Number(e.target.value))} 
                  className="pl-6 pr-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xl outline-none cursor-pointer appearance-none shadow-lg hover:bg-emerald-600 transition-all border border-slate-800"
                >
                   {YEARS.map(y => <option key={y} value={y}>TA {y}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
             </div>
          </div>
          <div className="h-16 w-px bg-slate-100 mx-4 hidden md:block"></div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
               RKKS RUMAH SAKIT TK.IV 02.07.03 BATIN TIKAL
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                  Pagu Anggaran & Rencana Kerja Digital
               </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print relative z-10 flex-wrap justify-end">
          <button onClick={() => setShowLaporan('pergeseran')} className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 active:scale-95" title="Pergeseran antar akun (net change 0), biasanya bulanan">
            <Printer size={14} />
            Laporan Revisi POK
          </button>
          <button onClick={() => setShowLaporan('tambah_pagu')} className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 active:scale-95" title="Penambahan pagu (net change positif), biasanya semesteran">
            <Printer size={14} />
            Laporan Tambah Pagu
          </button>
          <button onClick={onAddSection} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95 group">
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Seksi Baru
          </button>
        </div>
      </div>

      {/* DUPLICATE WARNINGS */}
      {(hasDuplicateKodes || hasDuplicateTitles) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-lg">
          <p className="text-sm font-black text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            ⚠ Peringatan Duplikasi Data
          </p>
          {hasDuplicateKodes && (
            <div className="mb-3">
              <p className="text-xs font-bold text-amber-700 mb-2">Kode akun berikut muncul di lebih dari 1 section (menyebabkan double-count di RPD & LRA):</p>
              <div className="space-y-1">
                {/* [TS-cleanup 13 Mei 2026] Cast Object.entries — TS5 quirk dengan
                    Record<string, string[]> infer [string, unknown]. */}
                {(Object.entries(duplicateKodeWarnings) as [string, string[]][]).map(([kode, sectionNames]) => (
                  <p key={kode} className="text-xs font-mono bg-amber-100 rounded-lg px-3 py-1.5">
                    <span className="font-black text-amber-900">{kode}</span>
                    <span className="text-amber-600"> → </span>
                    <span className="font-bold text-amber-700">{sectionNames.join(' & ')}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
          {hasDuplicateTitles && (
            <div>
              <p className="text-xs font-bold text-amber-700">Nama section duplikat: {Array.from(duplicateTitleWarnings).join(', ')}</p>
            </div>
          )}
          <p className="text-[10px] text-amber-600 mt-3 font-bold">Pindahkan kode akun ke satu section saja, atau rename section yang duplikat.</p>
        </div>
      )}

      {/* Sprint D Item #2 — UX Pagu Diff Dashboard (Phase 1: Opsi B + Opsi C) */}
      <PaguDiffDashboard sections={processedSections} />

      {/* Sprint D Item #2 Phase 2 — Filter chips (Opsi A) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex items-center gap-2 flex-wrap no-print">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Tampilkan:</span>
        {([
          { key: 'all',     label: 'Semua' },
          { key: 'revised', label: 'Hanya Direvisi' },
          { key: 'new',     label: 'Item Baru Saja' },
        ] as { key: RowFilterMode; label: string }[]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setRowFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              rowFilter === opt.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {rowFilter !== 'all' && (
          <p className="text-[10px] font-bold text-slate-400 italic ml-auto">
            Filter aktif — row "Tidak Berubah" disembunyikan
          </p>
        )}
      </div>

      {/* BUDGET SECTIONS */}
      {processedSections.map((section, idx) => {
        const minLvl = section.rows.length > 0 ? Math.min(...section.rows.map(r => r.level)) : 0;
        const totalAwal = section.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaAwal || 0), 0);
        const totalRevisi = section.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaRevisi || 0), 0);
        
        return (
          <div key={section.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden mb-12">
            <div className="bg-slate-900 px-8 py-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-5 flex-1">
                <div className="bg-emerald-600 text-white text-lg font-black w-10 h-10 flex items-center justify-center rounded-xl shadow-lg ring-2 ring-slate-800">{idx + 1}</div>
                <div className="flex-1">
                  <input 
                    value={section.title} 
                    onChange={(e) => onSectionsChange(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))} 
                    className={`bg-transparent border-none focus:ring-0 p-0 text-lg font-black uppercase tracking-tight w-full outline-none ${duplicateTitleWarnings.has((section.title || '').trim().toUpperCase()) ? 'text-amber-400' : 'text-white'}`}
                    placeholder="Nama Seksi Anggaran..." 
                  />
                  {duplicateTitleWarnings.has((section.title || '').trim().toUpperCase()) && (
                    <p className="text-[9px] font-bold text-amber-400 mt-1">⚠ Nama section ini duplikat dengan section lain</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 no-print">
                <button onClick={() => addRootRow(section.id)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md active:scale-95">
                  <Plus size={14} /> Tambah Baris
                </button>
                <button onClick={() => onDeleteSection(section.id)} className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-xl flex items-center justify-center transition-all active:scale-75"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
                  <thead className="bg-[#1e293b] text-white text-[9px] font-black uppercase tracking-widest">
                    <tr>
                      <th rowSpan={2} className="px-5 py-5 w-32 border-r border-slate-700 text-center">Kode</th>
                      <th rowSpan={2} className="px-5 py-5 w-[35%] border-r border-slate-700">Uraian Komponen</th>
                      <th rowSpan={2} className="px-2 py-5 w-20 text-center border-r border-slate-700">Vol</th>
                      <th rowSpan={2} className="px-4 py-5 w-28 text-center border-r border-slate-700">Satuan</th>
                      <th colSpan={(showSemula ? 1 : 0) + (showRevisi ? 1 : 0)} className="px-4 py-3 text-center border-b border-r border-slate-700 bg-slate-800">Harga Satuan</th>
                      <th colSpan={(showSemula ? 1 : 0) + (showRevisi ? 1 : 0)} className="px-5 py-3 text-center border-b border-r border-slate-700 bg-emerald-900/20">Jumlah Biaya</th>
                      <th rowSpan={2} className="px-4 py-5 w-24 text-center border-r border-slate-700">Sumber</th>
                      <th rowSpan={2} className="px-3 py-5 w-32 text-center border-r border-slate-700">Status Metadata</th>
                      <th rowSpan={2} className="px-2 py-5 w-12 text-center no-print"></th>
                    </tr>
                    <tr className="bg-slate-800 text-[8px]">
                      {showSemula && <th className="px-2 py-2 text-center border-r border-slate-700">Semula</th>}
                      {showRevisi && <th className="px-2 py-2 text-center border-r border-slate-700 bg-emerald-900/40">Revisi</th>}
                      {showSemula && <th className="px-2 py-2 text-center border-r border-slate-700">Semula</th>}
                      {showRevisi && <th className="px-2 py-2 text-center border-r border-slate-700 bg-emerald-800/40">Revisi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      // Sprint D Item #2 Phase 2 — apply row filter (Opsi A)
                      const hiddenIds = getHiddenRowIds(section.rows, rowFilter);
                      return section.rows.filter(r => !hiddenIds.has(r.id));
                    })().map((row, rIdx, visibleRows) => {
                      const indentation = row.level * 1.5;
                      // Recompute hasChildren via original section.rows index (for correct hierarchy when filtering)
                      const origIdx = section.rows.findIndex(r => r.id === row.id);
                      const hasChildren = origIdx < section.rows.length - 1 && section.rows[origIdx + 1].level > row.level;
                      // Sprint D Item #2 Phase 2 — classify row for inline indicator
                      const classification = !hasChildren && row.kode.trim() ? classifyRow(row) : null;
                      const indicatorColor = classification ? ({
                        'BERTAMBAH':     'bg-emerald-500',
                        'BERKURANG':     'bg-red-500',
                        'BARU':          'bg-blue-500',
                        'TIDAK_BERUBAH': 'bg-slate-300',
                      } as const)[classification.category] : null;
                      const indicatorTitle = classification ? ({
                        'BERTAMBAH':     `Pagu Bertambah: +${formatIDR(Math.abs(classification.delta))} (+${classification.deltaPercent.toFixed(0)}%)`,
                        'BERKURANG':     `Pagu Berkurang: ${formatIDR(classification.delta)} (${classification.deltaPercent.toFixed(0)}%)`,
                        'BARU':          `Item Baru / Breakdown: +${formatIDR(classification.revisi)}`,
                        'TIDAK_BERUBAH': `Tidak Berubah: ${formatIDR(classification.revisi)}`,
                      } as const)[classification.category] : '';
                      // [Tier 4a Phase 3c] Validation indicator — dot color = highest severity
                      const rowConstraints = !hasChildren ? (rowConstraintMap.get(row.id) ?? []) : [];
                      const validationIndicator = pickPriorityIndicator(rowConstraints);
                      const validationTooltip = validationIndicator ? buildTooltipText(rowConstraints) : '';
                      return (
                        <React.Fragment key={row.id}>
                        <tr data-row-id={row.id} className={`${hasChildren ? 'bg-slate-50/70 font-black' : 'bg-white'} hover:bg-emerald-50/50 transition-colors group/row text-[11px]`}>
                          <td className="px-5 py-3 border-r border-slate-100 align-top">
                            <div className="flex items-start gap-2">
                              {/* Sprint D Item #2 Phase 2 — Inline indicator pill (diff) */}
                              {indicatorColor && (
                                <span
                                  className={`${indicatorColor} w-2 h-2 rounded-full mt-1.5 shrink-0`}
                                  title={indicatorTitle}
                                />
                              )}
                              {/* Tier 4a Phase 3c — Validation indicator dot */}
                              {validationIndicator && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToValidasi?.(validationIndicator.priorityConstraintId)}
                                  className={`${validationIndicator.color} w-2 h-2 rounded-full mt-1.5 shrink-0 hover:scale-150 transition-transform cursor-pointer ${onNavigateToValidasi ? '' : 'cursor-default'}`}
                                  title={validationTooltip}
                                  aria-label={`Validation issue: ${validationIndicator.topStatus.toUpperCase()}, klik untuk detail`}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                            <KodeAutocomplete
                              mode="bas"
                              basKategori={['BELANJA', 'PENDAPATAN']}
                              value={row.kode}
                              description={row.description}
                              onChange={v => handleRowChange(section.id, row.id, 'kode', v)}
                              onSelect={(sug) => {
                                // [Sprint B.6] Auto-fill kode_bas saat user pick dari autocomplete.
                                // [HITL] Kalau suggestion datang dari recommendation Angga,
                                // kode yang di-fill ke `kode` adalah kode_bas (6-digit), DAN
                                // kode_bas ter-set langsung. User bisa edit kode untuk tambah suffix .01 dst.
                                const newKode = sug.kode;
                                const kodeBas = sug.recommendation?.id ? sug.kode : (deriveKodeBas(newKode) || newKode);
                                const updatedRows = section.rows.map(r => r.id === row.id ? { ...r, kode: newKode, kode_bas: kodeBas } : r);
                                onSectionsChange(sections.map(s => s.id === section.id ? { ...s, rows: updatedRows } : s));
                              }}
                              placeholder="521115.01"
                              className={duplicateKodeWarnings[row.kode.trim()] ? 'text-amber-500' : ''}
                            />
                            {duplicateKodeWarnings[row.kode.trim()] && (
                              <p className="text-[8px] font-bold text-amber-500 mt-0.5" title={`Juga ada di: ${duplicateKodeWarnings[row.kode.trim()]?.join(', ')}`}>⚠ duplikat</p>
                            )}
                            {row.kode_bas && row.kode_bas !== row.kode.split('.')[0] && (
                              <p className="text-[8px] font-bold text-blue-500 mt-0.5" title={`BAS canonical: ${row.kode_bas}`}>BAS: {row.kode_bas}</p>
                            )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 border-r border-slate-100 align-top relative" style={{ paddingLeft: `${indentation + 1}rem` }}>
                            <div className="flex items-start gap-3 relative z-10">
                              {row.level < 5 && (
                                <button onClick={() => addSubRow(section.id, row.id)} className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all transform hover:scale-110 shadow-sm no-print"><Plus size={12} /></button>
                              )}
                              <textarea rows={1} className={`w-full bg-transparent border-none focus:ring-0 p-0 resize-none leading-relaxed outline-none ${hasChildren ? 'font-black text-slate-900 uppercase' : 'font-bold text-slate-700'}`} value={row.description} onChange={e => handleRowChange(section.id, row.id, 'description', e.target.value)} placeholder="..." />
                            </div>
                          </td>
                          <td className="px-2 py-3 border-r border-slate-100 text-center align-top">
                            {!hasChildren && <input type="number" className="w-full bg-slate-50/50 border-none rounded-lg text-center font-black" value={row.volume || ''} onChange={e => handleRowChange(section.id, row.id, 'volume', Number(e.target.value))} />}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-100 text-center align-top">
                            {!hasChildren && <input className="w-full bg-slate-50/50 border-none rounded-lg text-center font-bold uppercase text-slate-400" value={row.satuan} onChange={e => handleRowChange(section.id, row.id, 'satuan', e.target.value)} />}
                          </td>
                          {showSemula && (
                            <td className="px-2 py-3 border-r border-slate-100 text-right align-top bg-slate-50/30">
                              {!hasChildren && <input type="number" className="w-full bg-transparent border-none text-right font-mono font-bold text-slate-400" value={row.hargaSatuanAwal || ''} onChange={e => handleRowChange(section.id, row.id, 'hargaSatuanAwal', Number(e.target.value))} />}
                            </td>
                          )}
                          {showRevisi && (
                            <td className="px-2 py-3 border-r border-slate-100 text-right align-top bg-emerald-50/20">
                              {!hasChildren && <input type="number" className="w-full bg-transparent border-none text-right font-mono font-black text-slate-900 outline-none" value={row.hargaSatuanRevisi || ''} onChange={e => handleRowChange(section.id, row.id, 'hargaSatuanRevisi', Number(e.target.value))} />}
                            </td>
                          )}
                          {showSemula && <td className={`px-2 py-3 border-r border-slate-100 text-right align-top font-bold font-mono ${hasChildren ? 'text-slate-900' : 'text-slate-400'}`}>{formatIDR(row.jumlahBiayaAwal).replace('Rp', '').trim()}</td>}
                          {showRevisi && <td className={`px-2 py-3 border-r border-slate-100 text-right align-top font-black font-mono bg-emerald-50/40 ${hasChildren ? 'text-blue-700' : 'text-emerald-700'}`}>{formatIDR(row.jumlahBiayaRevisi).replace('Rp', '').trim()}</td>}
                          <td className="px-4 py-3 border-r border-slate-100 text-center align-top">
                            <input className="w-full bg-transparent border-none focus:ring-0 p-0 text-center font-black uppercase text-slate-300" value={row.sumberDana} onChange={e => handleRowChange(section.id, row.id, 'sumberDana', e.target.value)} />
                          </td>
                          <td className="px-2 py-3 border-r border-slate-100 text-center align-top no-print">
                            {hasChildren ? (
                              <span className="text-slate-300 text-xs">—</span>
                            ) : (() => {
                              const rec = recommendMetadata(row);
                              const agg = aggregateConfidence(rec);
                              const isReviewed = row.metadata_review?.override_to === 'high';
                              const expanded = isExpanded(row.id);
                              const stylesMap = {
                                high:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High'   },
                                medium: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Medium' },
                                low:    { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'Low'    },
                              } as const;
                              const s = stylesMap[agg];
                              return (
                                <button
                                  onClick={() => toggleRowExpand(row.id)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text} hover:opacity-80 transition-opacity`}
                                  title={`Aggregate confidence: ${s.label}${isReviewed ? ' (manually reviewed)' : ''} — klik untuk ${expanded ? 'tutup' : 'expand'}`}
                                >
                                  {isReviewed && <ShieldCheck size={10} />}
                                  {isReviewed ? 'Reviewed' : s.label}
                                  {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-2 py-3 text-center align-top no-print">
                            <button onClick={() => onSectionsChange(sections.map(s => s.id === section.id ? { ...s, rows: s.rows.filter(r => r.id !== row.id) } : s))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover/row:opacity-100 transition-all"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                        {!hasChildren && isExpanded(row.id) && (
                          <MetadataDetailRow
                            row={row}
                            recommendation={recommendMetadata(row)}
                            colSpan={computeDetailColSpan(showSemula, showRevisi)}
                            onOpenApplyModal={() => setModalState({ type: 'apply', sectionId: section.id, row })}
                            onOpenOverrideModal={() => setModalState({ type: 'override', sectionId: section.id, row })}
                          />
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white text-[11px] font-black">
                    <tr>
                      <td colSpan={4} className="px-8 py-5 text-right uppercase tracking-[0.2em] opacity-40">Subtotal Seksi TA {selectedYear}:</td>
                      {showSemula && <td className="px-5 py-5 text-right font-mono text-emerald-400 border-r border-slate-800" colSpan={2}>{formatIDR(totalAwal)}</td>}
                      {showRevisi && <td className="px-5 py-5 text-right font-mono text-emerald-300" colSpan={2}>{formatIDR(totalRevisi)}</td>}
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
            </div>
          </div>
        );
      })}

      {/* SUMMARY PER KODE AKUN - Dasar Utama Pembayaran */}
      {/* Sprint D Item #2 Phase 4 (Sie Renbang request 11 Mei 2026):
          refactor dari 4-col card grid → tabel list. Cards sulit dibaca
          saat ada 30+ kode akun. Tabel + search filter lebih praktis. */}
      <div className="bg-[#0f172a] rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><ListChecks size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><ListChecks size={28} /></div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Ringkasan Pagu Per Kode Akun</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Konsolidasi Mata Anggaran Dasar Pembayaran Tagihan</p>
              </div>
            </div>
            <input
              type="text"
              value={ringkasanFilter}
              onChange={e => setRingkasanFilter(e.target.value)}
              placeholder="Cari kode atau uraian..."
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-emerald-500/50 outline-none transition-all min-w-[260px]"
            />
          </div>

          {(() => {
            // Filter + classify
            const filter = ringkasanFilter.trim().toLowerCase();
            const filtered = filter
              ? summaryByAccount.filter(([code, data]) =>
                  code.toLowerCase().includes(filter) ||
                  (data.desc || '').toLowerCase().includes(filter))
              : summaryByAccount;

            const totalSemula = filtered.reduce((s, [, d]) => s + d.awal, 0);
            const totalRevisi = filtered.reduce((s, [, d]) => s + d.revisi, 0);
            const totalDelta = totalRevisi - totalSemula;

            const classify = (awal: number, revisi: number) => {
              if (awal === 0 && revisi > 0) return { label: 'BARU',   color: 'bg-blue-500/15 text-blue-300 border-blue-400/30' };
              const d = revisi - awal;
              if (d > 0) return { label: 'TAMBAH', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' };
              if (d < 0) return { label: 'KURANG', color: 'bg-red-500/15 text-red-300 border-red-400/30' };
              return         { label: 'TETAP',  color: 'bg-slate-500/15 text-slate-400 border-slate-400/30' };
            };

            return (
              <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden mb-10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-5 py-4 w-32 border-b border-white/10">Kode Akun</th>
                        <th className="px-4 py-4 border-b border-white/10">Uraian Komponen</th>
                        <th className="px-4 py-4 w-40 text-right border-b border-white/10">Target Semula</th>
                        <th className="px-4 py-4 w-40 text-right border-b border-white/10 bg-emerald-500/5">Target Revisi</th>
                        <th className="px-4 py-4 w-40 text-right border-b border-white/10">Δ Selisih</th>
                        <th className="px-4 py-4 w-24 text-center border-b border-white/10">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-500 italic text-sm">
                            Tidak ada kode yang cocok dengan "{ringkasanFilter}"
                          </td>
                        </tr>
                      ) : filtered.map(([code, data], idx) => {
                        const delta = data.revisi - data.awal;
                        const status = classify(data.awal, data.revisi);
                        const deltaColor = delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-red-300' : 'text-slate-500';
                        const deltaSign  = delta > 0 ? '+' : delta < 0 ? '−' : '';
                        return (
                          <tr key={code} className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'} hover:bg-emerald-500/5 transition-colors`}>
                            <td className="px-5 py-3.5 border-b border-white/5 font-mono text-sm font-black text-emerald-400">{code}</td>
                            <td className="px-4 py-3.5 border-b border-white/5 text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                              {data.desc || <span className="italic text-slate-500 normal-case">(tanpa uraian)</span>}
                            </td>
                            <td className="px-4 py-3.5 border-b border-white/5 font-mono text-[11px] text-slate-400 text-right">
                              {formatIDR(data.awal).replace('Rp','').trim()}
                            </td>
                            <td className="px-4 py-3.5 border-b border-white/5 font-mono text-[12px] font-black text-emerald-400 text-right bg-emerald-500/[0.03]">
                              {formatIDR(data.revisi).replace('Rp','').trim()}
                            </td>
                            <td className={`px-4 py-3.5 border-b border-white/5 font-mono text-[11px] font-black text-right ${deltaColor}`}>
                              {delta === 0 ? '0' : `${deltaSign}${formatIDR(Math.abs(delta)).replace('Rp','').trim()}`}
                            </td>
                            <td className="px-4 py-3.5 border-b border-white/5 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {filtered.length > 0 && (
                      <tfoot className="bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                          <td colSpan={2} className="px-5 py-4 text-slate-400">
                            Total {filtered.length} kode akun {filter && `(filter: "${ringkasanFilter}")`}
                          </td>
                          <td className="px-4 py-4 font-mono text-right text-slate-400">
                            {formatIDR(totalSemula).replace('Rp','').trim()}
                          </td>
                          <td className="px-4 py-4 font-mono text-right text-emerald-300 bg-emerald-500/5">
                            {formatIDR(totalRevisi).replace('Rp','').trim()}
                          </td>
                          <td className={`px-4 py-4 font-mono text-right ${totalDelta > 0 ? 'text-emerald-300' : totalDelta < 0 ? 'text-red-300' : 'text-slate-500'}`}>
                            {totalDelta === 0 ? '0' : `${totalDelta > 0 ? '+' : '−'}${formatIDR(Math.abs(totalDelta)).replace('Rp','').trim()}`}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })()}

          <div className="p-8 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30"><DollarSign size={32} /></div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Total Pagu Keseluruhan RS TA {selectedYear}</p>
                <h4 className="text-4xl font-black font-mono tracking-tighter">
                  {formatIDR(processedSections.reduce((acc, sec) => {
                    const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
                    return acc + sec.rows.filter(r => r.level === minLvl).reduce((s, r) => s + (r.jumlahBiayaRevisi || 0), 0);
                  }, 0))}
                </h4>
              </div>
            </div>
            <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Sinkronisasi</p>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">LIVE DATABASE AKTIF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint D Item #2 Phase 3 — Laporan Revisi modal (dual-mode) */}
      {showLaporan && (
        <LaporanRevisi
          sections={processedSections}
          selectedYear={selectedYear}
          mode={showLaporan}
          onClose={() => setShowLaporan(null)}
        />
      )}

      {/* [Tier 3 Phase 3] Metadata recommendation modals (apply preview / override warning) */}
      {modalState?.type === 'apply' && (
        <MetadataApplyModal
          row={modalState.row}
          recommendation={recommendMetadata(modalState.row)}
          onConfirm={(updates) => handleApplyRecommendation(modalState.sectionId, modalState.row.id, updates)}
          onCancel={() => setModalState(null)}
        />
      )}
      {modalState?.type === 'override' && (
        <MetadataOverrideModal
          row={modalState.row}
          onConfirm={(review) => handleSetMetadataReview(modalState.sectionId, modalState.row.id, review)}
          onCancel={() => setModalState(null)}
        />
      )}
    </div>
  );
};

export default PaguAnggaran;
