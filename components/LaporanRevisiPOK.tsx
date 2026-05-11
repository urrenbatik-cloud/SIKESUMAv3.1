// ============================================================================
// SIKESUMA v3.1 · Laporan Revisi POK — Phase 3 UX (Opsi D)
// ============================================================================
// File          : components/LaporanRevisiPOK.tsx
// Phase         : Sprint D Item #2 Phase 3 — Print-ready laporan untuk submit Palembang
// Date          : 11 Mei 2026
//
// Print-friendly tabular report dengan format nomenklatur untuk submit
// revisi POK ke Satker pengelola anggaran Palembang. Output portrait A4
// dengan kolom: Kode | Uraian | Vol | Semula | Revisi | Selisih | Sumber.
//
// Trigger via button "Cetak Laporan Revisi" di PaguAnggaran. Buka modal
// full-screen yang sudah print-styled — user tinggal klik print di browser.
// ============================================================================

import React, { useMemo } from 'react';
import type { PaguSection } from '../types';
import { classifyRow, computeSintesis } from '../utils/paguDiff';
import { formatIDR } from './Formatters';
import { X, Printer } from 'lucide-react';

interface LaporanRevisiPOKProps {
  sections: PaguSection[];
  selectedYear: number;
  onClose: () => void;
}

const LaporanRevisiPOK: React.FC<LaporanRevisiPOKProps> = ({ sections, selectedYear, onClose }) => {
  const sintesis = useMemo(() => computeSintesis(sections), [sections]);

  // Flatten all leaf rows yang berubah (BERTAMBAH | BERKURANG | BARU)
  const revisedRows = useMemo(() => [
    ...sintesis.bertambah.rows,
    ...sintesis.baru.rows,
    ...sintesis.berkurang.rows,
  ].sort((a, b) => {
    // Sort by section title, then by kode
    const secA = a.section.title || a.section.id;
    const secB = b.section.title || b.section.id;
    if (secA !== secB) return secA.localeCompare(secB);
    return a.row.kode.localeCompare(b.row.kode);
  }), [sintesis]);

  // Group by section for print-friendly rendering
  const rowsBySection = useMemo(() => {
    const map = new Map<string, typeof revisedRows>();
    for (const item of revisedRows) {
      const key = item.section.title || item.section.id;
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return Array.from(map.entries());
  }, [revisedRows]);

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

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
        {/* Toolbar — hide saat print */}
        <div className="no-print-laporan max-w-[210mm] mx-auto mb-3 flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-xl">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview Laporan</p>
            <p className="text-sm font-black text-slate-900">Laporan Revisi POK TA {selectedYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Printer size={14} /> Cetak / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="bg-slate-100 text-slate-500 hover:bg-slate-200 p-2.5 rounded-xl transition-all"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper */}
        <div className="print-laporan-paper bg-white max-w-[210mm] mx-auto p-12 shadow-2xl">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Tentara Nasional Indonesia Angkatan Darat<br/>
              Kesehatan Daerah Militer II/Sriwijaya
            </p>
            <h1 className="text-lg font-black text-slate-900 mt-2 uppercase">
              Laporan Revisi POK Tahun Anggaran {selectedYear}
            </h1>
            <p className="text-sm font-bold text-slate-700 mt-1">
              Rumah Sakit Tingkat IV 02.07.03 Batin Tikal
            </p>
          </div>

          {/* Ringkasan */}
          <table className="w-full mb-6 text-[10px]">
            <tbody>
              <tr>
                <td className="font-bold text-slate-700 pr-3 py-0.5">Tanggal Laporan</td>
                <td className="text-slate-700">: {today}</td>
              </tr>
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

          {/* Detail per section */}
          {rowsBySection.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8">
              Tidak ada revisi tercatat untuk TA {selectedYear}. Semua pagu masih sesuai baseline awal.
            </p>
          ) : (
            rowsBySection.map(([sectionTitle, items]) => (
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
                      const jenis = classification.category === 'BARU'      ? 'BARU'
                                  : classification.category === 'BERTAMBAH' ? 'TAMBAH'
                                  : classification.category === 'BERKURANG' ? 'KURANG'
                                  : 'TETAP';
                      const jenisColor = classification.category === 'BARU'      ? 'text-blue-700'
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
            ))
          )}

          {/* Footer signature block */}
          <div className="mt-12 grid grid-cols-2 gap-8 text-[10px] break-inside-avoid">
            <div className="text-center">
              <p className="font-bold text-slate-700">Dibuat oleh,<br/>Sie Renbang</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-4">.................................</p>
              <p className="text-[9px] text-slate-600 mt-1">NRP/NIP: ......................</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700">Disetujui oleh,<br/>Karumkit RS Tk.IV 02.07.03 Batin Tikal</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 border-t border-slate-700 pt-1 px-4">.................................</p>
              <p className="text-[9px] text-slate-600 mt-1">NRP/NIP: ......................</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[8px] text-slate-400">
            Dokumen ini di-generate dari SIKESUMA v3.1 — sikesumav31.vercel.app
          </div>
        </div>
      </div>
    </>
  );
};

export default LaporanRevisiPOK;
