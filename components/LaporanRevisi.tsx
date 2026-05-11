// ============================================================================
// SIKESUMA v3.1 · Laporan Revisi — Phase 3 (Opsi D, dual-mode)
// ============================================================================
// File          : components/LaporanRevisi.tsx
// Phase         : Sprint D Item #2 Phase 3 — Print-ready laporan
// Date          : 11 Mei 2026 (revised dual-mode)
//
// Per masukan Sie Renbang via dr Ferry: ADA DUA jenis laporan revisi:
//
//   1. Laporan Revisi POK (mode='pergeseran')
//      - Net change = 0 (pergeseran antar akun: pengurangan + penambahan
//        harus balance)
//      - Frekuensi: bisa kapan saja sesuai kebutuhan, biasanya per BULAN
//      - Approval: internal RS (Sie Renbang + Karumkit)
//      - Format: 2 tabel side-by-side — "Dari Akun (Pengurangan)" +
//        "Ke Akun (Penambahan)"
//
//   2. Laporan Tambah Pagu (mode='tambah_pagu')
//      - Net change > 0 (penambahan pagu total)
//      - Frekuensi: setelah habis 1 SEMESTER
//      - Approval: Karumkit + diketahui Palembang Satker pengelola anggaran
//      - Format: per-section breakdown dengan kolom Selisih (Δ)
// ============================================================================

import React, { useMemo } from 'react';
import type { PaguSection } from '../types';
import { computeSintesis } from '../utils/paguDiff';
import { formatIDR } from './Formatters';
import { X, Printer, AlertTriangle } from 'lucide-react';

export type LaporanMode = 'pergeseran' | 'tambah_pagu';

interface LaporanRevisiProps {
  sections: PaguSection[];
  selectedYear: number;
  mode: LaporanMode;
  onClose: () => void;
}

const LaporanRevisi: React.FC<LaporanRevisiProps> = ({ sections, selectedYear, mode, onClose }) => {
  const sintesis = useMemo(() => computeSintesis(sections), [sections]);
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const validationWarning = useMemo(() => {
    if (mode === 'pergeseran') {
      if (Math.abs(sintesis.netChange) > 1) {
        return `Mode "Revisi POK" mengharuskan net change = 0 (pergeseran antar akun seimbang). Saat ini net change = ${sintesis.netChange >= 0 ? '+' : '−'}${formatIDR(Math.abs(sintesis.netChange))}. Pertimbangkan pakai "Laporan Tambah Pagu" atau verifikasi data sebelum cetak.`;
      }
    } else {
      if (sintesis.netChange <= 1) {
        return `Mode "Tambah Pagu" mengharuskan net change > 0 (ada penambahan pagu). Saat ini net change = ${sintesis.netChange >= 0 ? '+' : '−'}${formatIDR(Math.abs(sintesis.netChange))}. Pertimbangkan pakai "Laporan Revisi POK" untuk pergeseran murni.`;
      }
    }
    return null;
  }, [mode, sintesis.netChange]);

  const titleMain = mode === 'pergeseran'
    ? `Usulan Revisi POK Tahun Anggaran ${selectedYear}`
    : `Usulan Revisi Anggaran (Penambahan Pagu) Tahun Anggaran ${selectedYear}`;
  const titleSub = mode === 'pergeseran'
    ? 'Pagu Tetap (Net Change = 0) — Penetapan oleh Kakesdam II/Sriwijaya selaku KPA'
    : 'Pagu Berubah — Diteruskan ke Kanwil DJPb / DJA via Kakesdam II/Sriwijaya selaku KPA';

  return (
    <>
      <style>{`
        @media print {
          .no-print-laporan { display: none !important; }
          .print-laporan-container {
            position: static !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .print-laporan-paper {
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page { size: A4 portrait; margin: 1.5cm 1cm; }
          body { background: white !important; }
        }
      `}</style>

      <div className="print-laporan-container fixed inset-0 z-50 bg-slate-900/80 overflow-auto p-4 sm:p-8">
        <div className="no-print-laporan max-w-[210mm] mx-auto mb-3 flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-xl">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview Laporan</p>
            <p className="text-sm font-black text-slate-900">{titleMain}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md active:scale-95 flex items-center gap-2">
              <Printer size={14} /> Cetak / Save as PDF
            </button>
            <button onClick={onClose} className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2.5 rounded-xl transition-all" aria-label="Tutup">
              <X size={18} />
            </button>
          </div>
        </div>

        {validationWarning && (
          <div className="no-print-laporan max-w-[210mm] mx-auto mb-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-bold">{validationWarning}</p>
          </div>
        )}

        {/* Tier 2 (vKoreksi v2) — Disclaimer C2-C10 belum dicek otomatis */}
        {mode === 'pergeseran' && (
          <div className="no-print-laporan max-w-[210mm] mx-auto mb-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-5 py-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-800">
              <p className="font-black mb-1">⚠ Verifikasi Manual Diperlukan (10 Hard Constraints per PMK 62/2023):</p>
              <p className="leading-relaxed">
                SIKESUMA saat ini hanya cek <strong>C1 (net change = 0)</strong>. Sebelum diajukan ke Kakesdam II/Sriwijaya selaku KPA, Sie Renbang <strong>wajib verifikasi manual</strong>:
                C2 (1 KRO sama), C3 (1 Kegiatan), C4 (1 Satker), C5 (volume RO tidak berubah),
                C6 (1 jenis belanja: 2 digit pertama akun sama), C7 (sumber dana sama),
                C8 (1 komponen sama untuk belanja operasional), C9 (tidak ada pagu minus pasca-revisi), C10 (patuh SBM).
                Rujukan: <code className="font-mono bg-blue-100 px-1 rounded">docs/REVISI-POK-PAGU-vKoreksi.md §3.2</code>.
              </p>
            </div>
          </div>
        )}

        <div className="print-laporan-paper bg-white max-w-[210mm] mx-auto p-12 shadow-2xl">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Tentara Nasional Indonesia Angkatan Darat<br/>
              Kesehatan Daerah Militer II/Sriwijaya
            </p>
            <h1 className="text-lg font-black text-slate-900 mt-2 uppercase">{titleMain}</h1>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5 italic">{titleSub}</p>
            <p className="text-sm font-bold text-slate-700 mt-2">Rumah Sakit Tingkat IV 02.07.03 Batin Tikal</p>
          </div>

          <table className="w-full mb-6 text-[10px]">
            <tbody>
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5 w-40">Tanggal Laporan</td>
                <td className="text-slate-700">: {today}</td>
              </tr>
              {mode === 'pergeseran' ? (
                <tr>
                  <td className="font-bold text-slate-700 pr-3 py-0.5">Periode (Bulan)</td>
                  <td className="text-slate-700">: ........................................................ (diisi manual)</td>
                </tr>
              ) : (
                <tr>
                  <td className="font-bold text-slate-700 pr-3 py-0.5">Periode Semester</td>
                  <td className="text-slate-700">: Semester ........ TA {selectedYear} (diisi manual)</td>
                </tr>
              )}
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5">Pagu Semula</td>
                <td className="text-slate-700 font-mono">: {formatIDR(sintesis.totalSemula)}</td>
              </tr>
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5">Pagu Revisi</td>
                <td className="text-slate-700 font-mono">: {formatIDR(sintesis.totalRevisi)}</td>
              </tr>
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5">Net Change</td>
                <td className={`font-mono font-black ${sintesis.netChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  : {sintesis.netChange >= 0 ? '+' : '−'}{formatIDR(Math.abs(sintesis.netChange))} ({sintesis.netChange >= 0 ? '+' : '−'}{Math.abs(sintesis.netChangePercent).toFixed(1)}%)
                </td>
              </tr>
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5">Rows Affected</td>
                <td className="text-slate-700">
                  : {sintesis.rowsAffected} dari {sintesis.totalRows} ({sintesis.bertambah.rows.length} bertambah · {sintesis.baru.rows.length} baru · {sintesis.berkurang.rows.length} berkurang)
                </td>
              </tr>
            </tbody>
          </table>

          {mode === 'pergeseran' ? (
            <PergeseranLayout sintesis={sintesis} />
          ) : (
            <TambahPaguLayout sintesis={sintesis} />
          )}

          <div className="mt-6 border-t border-slate-300 pt-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase mb-2">
              Justifikasi {mode === 'pergeseran' ? 'Pergeseran' : 'Penambahan Pagu'}:
            </h4>
            <div className="border border-slate-300 rounded p-3 min-h-[60px] text-[10px] text-slate-500 italic">
              (Diisi manual oleh Sie Renbang — alasan operasional, urgensi, dampak ke pelayanan{mode === 'tambah_pagu' ? ', sumber pendanaan tambahan' : ''})
            </div>
          </div>

          {mode === 'pergeseran' ? (
            <div className="mt-12 grid grid-cols-3 gap-6 text-[9px] break-inside-avoid">
              <div className="text-center">
                <p className="font-bold text-slate-700">Disusun oleh,<br/>Sie Renbang RS Batin Tikal</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">Direkomendasikan oleh,<br/>Karumkit RS Tk.IV 02.07.03 Batin Tikal</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
                <p className="text-[7px] text-slate-500 italic mt-1">(rekomendasi internal — bukan penetap)</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">Ditetapkan oleh,<br/>Kakesdam II/Sriwijaya selaku KPA</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
                <p className="text-[7px] text-slate-500 italic mt-1">(SK Revisi POK — penetapan formal)</p>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-3 gap-6 text-[9px] break-inside-avoid">
              <div className="text-center">
                <p className="font-bold text-slate-700">Disusun oleh,<br/>Sie Renbang RS Batin Tikal</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">Direkomendasikan oleh,<br/>Karumkit RS Tk.IV 02.07.03 Batin Tikal</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
                <p className="text-[7px] text-slate-500 italic mt-1">(rekomendasi internal)</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700">Diteruskan oleh,<br/>Kakesdam II/Sriwijaya selaku KPA</p>
                <div className="h-14"></div>
                <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-2">.........................</p>
                <p className="text-[8px] text-slate-600 mt-1">NRP/NIP: ..............</p>
                <p className="text-[7px] text-slate-500 italic mt-1">(pengaju ke Kanwil DJPb / DJA — penetap formal di tingkat Kemenkeu)</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-[8px] text-slate-400">
            Dokumen ini di-generate dari SIKESUMA v3.1 — sikesumav31.vercel.app
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Sub-component: Pergeseran Layout (Mode POK) ────────────────────────────

interface SubLayoutProps { sintesis: ReturnType<typeof computeSintesis>; }

const PergeseranLayout: React.FC<SubLayoutProps> = ({ sintesis }) => {
  const pengurangan = sintesis.berkurang.rows;
  const penambahan = [...sintesis.bertambah.rows, ...sintesis.baru.rows];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="text-[11px] font-black text-red-900 uppercase mb-2 bg-red-50 px-3 py-1.5 rounded">
          Dari Akun (Pengurangan)
        </h3>
        <table className="w-full text-[9px] border-collapse">
          <thead className="bg-slate-50 text-slate-700">
            <tr className="text-left border border-slate-300">
              <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase">Kode</th>
              <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase">Uraian</th>
              <th className="px-2 py-1.5 font-black text-[8px] uppercase text-right">Pengurangan</th>
            </tr>
          </thead>
          <tbody>
            {pengurangan.length === 0 ? (
              <tr className="border border-slate-300">
                <td colSpan={3} className="px-2 py-3 text-center italic text-slate-400 text-[9px]">Tidak ada pengurangan</td>
              </tr>
            ) : pengurangan.map(({ row, classification }) => (
              <tr key={row.id} className="border border-slate-300">
                <td className="px-2 py-1 border-r border-slate-300 font-mono text-[8px]">{row.kode}</td>
                <td className="px-2 py-1 border-r border-slate-300">{row.description}</td>
                <td className="px-2 py-1 text-right font-mono font-bold text-red-700">
                  −{Math.abs(classification.delta).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-red-50 border border-slate-300 font-black">
              <td colSpan={2} className="px-2 py-1 border-r border-slate-300 text-right">Total:</td>
              <td className="px-2 py-1 text-right font-mono text-red-700">
                −{Math.abs(pengurangan.reduce((s, i) => s + i.classification.delta, 0)).toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <h3 className="text-[11px] font-black text-emerald-900 uppercase mb-2 bg-emerald-50 px-3 py-1.5 rounded">
          Ke Akun (Penambahan)
        </h3>
        <table className="w-full text-[9px] border-collapse">
          <thead className="bg-slate-50 text-slate-700">
            <tr className="text-left border border-slate-300">
              <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase">Kode</th>
              <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase">Uraian</th>
              <th className="px-2 py-1.5 font-black text-[8px] uppercase text-right">Penambahan</th>
            </tr>
          </thead>
          <tbody>
            {penambahan.length === 0 ? (
              <tr className="border border-slate-300">
                <td colSpan={3} className="px-2 py-3 text-center italic text-slate-400 text-[9px]">Tidak ada penambahan</td>
              </tr>
            ) : penambahan.map(({ row, classification }) => (
              <tr key={row.id} className="border border-slate-300">
                <td className="px-2 py-1 border-r border-slate-300 font-mono text-[8px]">{row.kode}</td>
                <td className="px-2 py-1 border-r border-slate-300">
                  {row.description}
                  {classification.category === 'BARU' && <span className="ml-1 text-[7px] text-blue-700 font-black">[BARU]</span>}
                </td>
                <td className="px-2 py-1 text-right font-mono font-bold text-emerald-700">
                  +{(classification.category === 'BARU' ? classification.revisi : classification.delta).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-50 border border-slate-300 font-black">
              <td colSpan={2} className="px-2 py-1 border-r border-slate-300 text-right">Total:</td>
              <td className="px-2 py-1 text-right font-mono text-emerald-700">
                +{penambahan.reduce((s, i) => s + (i.classification.category === 'BARU' ? i.classification.revisi : i.classification.delta), 0).toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ─── Sub-component: Tambah Pagu Layout ─────────────────────────────────────

const TambahPaguLayout: React.FC<SubLayoutProps> = ({ sintesis }) => {
  const revisedRows = [...sintesis.bertambah.rows, ...sintesis.baru.rows, ...sintesis.berkurang.rows]
    .sort((a, b) => {
      const secA = a.section.title || a.section.id;
      const secB = b.section.title || b.section.id;
      if (secA !== secB) return secA.localeCompare(secB);
      return a.row.kode.localeCompare(b.row.kode);
    });

  const rowsBySection = new Map<string, typeof revisedRows>();
  for (const item of revisedRows) {
    const key = item.section.title || item.section.id;
    const existing = rowsBySection.get(key) || [];
    existing.push(item);
    rowsBySection.set(key, existing);
  }

  if (rowsBySection.size === 0) {
    return <p className="text-center text-slate-500 italic py-8">Tidak ada revisi tercatat. Semua pagu masih sesuai baseline awal.</p>;
  }

  return (
    <>
      {Array.from(rowsBySection.entries()).map(([sectionTitle, items]) => (
        <div key={sectionTitle} className="mb-6 break-inside-avoid">
          <h3 className="text-[11px] font-black text-slate-900 uppercase mb-2 bg-slate-100 px-3 py-1.5 rounded">
            {sectionTitle.replace(/^PAGU ANGGARAN /i, '')}
          </h3>
          <table className="w-full text-[9px] border-collapse">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="text-left border border-slate-300">
                <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase w-[8%]">Kode</th>
                <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase w-[33%]">Uraian Komponen</th>
                <th className="px-1 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase text-center w-[5%]">Vol</th>
                <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase text-right w-[16%]">Semula (Rp)</th>
                <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase text-right w-[16%]">Revisi (Rp)</th>
                <th className="px-2 py-1.5 border-r border-slate-300 font-black text-[8px] uppercase text-right w-[14%]">Selisih (Rp)</th>
                <th className="px-2 py-1.5 font-black text-[8px] uppercase text-center w-[8%]">Jenis</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ row, classification }) => {
                const jenis = classification.category === 'BARU' ? 'BARU'
                            : classification.category === 'BERTAMBAH' ? 'TAMBAH'
                            : classification.category === 'BERKURANG' ? 'KURANG'
                            : 'TETAP';
                const jenisColor = classification.category === 'BARU' ? 'text-blue-700'
                                 : classification.category === 'BERTAMBAH' ? 'text-emerald-700'
                                 : classification.category === 'BERKURANG' ? 'text-red-700'
                                 : 'text-slate-600';
                return (
                  <tr key={row.id} className="border border-slate-300">
                    <td className="px-2 py-1 border-r border-slate-300 font-mono text-[8px]">{row.kode}</td>
                    <td className="px-2 py-1 border-r border-slate-300">{row.description}</td>
                    <td className="px-1 py-1 border-r border-slate-300 text-center">{row.volume}</td>
                    <td className="px-2 py-1 border-r border-slate-300 text-right font-mono">{classification.semula.toLocaleString('id-ID')}</td>
                    <td className="px-2 py-1 border-r border-slate-300 text-right font-mono font-bold">{classification.revisi.toLocaleString('id-ID')}</td>
                    <td className={`px-2 py-1 border-r border-slate-300 text-right font-mono font-bold ${classification.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {classification.delta >= 0 ? '+' : '−'}{Math.abs(classification.delta).toLocaleString('id-ID')}
                    </td>
                    <td className={`px-2 py-1 text-center font-black text-[8px] ${jenisColor}`}>{jenis}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border border-slate-300 font-black">
                <td colSpan={3} className="px-2 py-1 border-r border-slate-300 text-right">Subtotal Section:</td>
                <td className="px-2 py-1 border-r border-slate-300 text-right font-mono">
                  {items.reduce((s, i) => s + i.classification.semula, 0).toLocaleString('id-ID')}
                </td>
                <td className="px-2 py-1 border-r border-slate-300 text-right font-mono">
                  {items.reduce((s, i) => s + i.classification.revisi, 0).toLocaleString('id-ID')}
                </td>
                <td className="px-2 py-1 border-r border-slate-300 text-right font-mono">
                  {(() => {
                    const delta = items.reduce((s, i) => s + i.classification.delta, 0);
                    return `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('id-ID')}`;
                  })()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </>
  );
};

export default LaporanRevisi;
