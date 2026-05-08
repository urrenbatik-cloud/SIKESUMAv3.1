// ============================================================================
// SIKESUMA v3.1 · S5.6 · RevisionProposalGenerator
// ============================================================================
// File          : components/RevisionProposalGenerator.tsx
// Phase         : Step 5 / Phase 5.6 — Revision Proposal Generator
// Date          : 9 Mei 2026
// Purpose       : Auto-generate draft proposal revisi pagu dari deviation
//                 analysis (Phase 5.4) + early warning (Phase 5.5) + reasoning
//                 context dari audit_log (Phase 5.1/5.3).
//
// Decisions     :
//   §S5.6-D1    : In-app modal view + copy-to-clipboard (surat dinas text)
//   §S5.6-D2    : 5 sections: Latar Belakang, Ringkasan Deviasi, Faktor
//                 Dinamika, Detail per Kategori, Rekomendasi Revisi Pagu
//   §S5.6-D3    : Trigger via button di EarlyWarningPanel
//   §S5.6-D4    : Print-ready HTML modal, RS TNI AD layout
//
// Data flow     :
//   DeviationDashboard passes deviationData + warningResult + auditEntries
//   → RevisionProposalGenerator builds structured proposal text
//   → User can copy to clipboard or print
// ============================================================================

import React, { useMemo, useRef, useState } from 'react';
import {
  X, Copy, Printer, Check, FileText,
} from 'lucide-react';
import type { DeviationData, CategoryDeviation, AuditLogRow } from '../utils/deviationMetrics';
import { formatRpFull, formatDeviationPct, MONTH_LABELS_FULL } from '../utils/deviationMetrics';
import type { EarlyWarningResult, WarningAlert } from '../utils/earlyWarning';
import { PATTERN_LABELS, SEVERITY_CONFIG } from '../utils/earlyWarning';
import { getReasoningCategoryMeta, type ReasoningCategory } from '../constants/audit';

// ─── Props ─────────────────────────────────────────────────────────────────

interface RevisionProposalGeneratorProps {
  deviationData:       DeviationData;
  warningResult:       EarlyWarningResult;
  auditEntries:        AuditLogRow[];
  reasoningCategories: ReasoningCategory[];
  rsName?:             string;    // default from system
  onClose:             () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

const RevisionProposalGenerator: React.FC<RevisionProposalGeneratorProps> = ({
  deviationData,
  warningResult,
  auditEntries,
  reasoningCategories,
  rsName = 'RS Tk.IV 02.07.03 Batin Tikal',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Compute proposal sections (memoized)
  const proposal = useMemo(
    () => buildProposal(deviationData, warningResult, auditEntries, reasoningCategories, rsName),
    [deviationData, warningResult, auditEntries, reasoningCategories, rsName],
  );

  // Copy to clipboard (plain text)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposal.plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select content
      if (contentRef.current) {
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Proposal Revisi Pagu ${deviationData.year} — ${rsName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
          h1 { text-align: center; font-size: 16pt; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
          h2 { font-size: 13pt; border-bottom: 1px solid #333; padding-bottom: 4px; margin-top: 24px; }
          h3 { font-size: 12pt; margin-top: 16px; }
          .kop { text-align: center; border-bottom: 3px double #333; padding-bottom: 12px; margin-bottom: 24px; }
          .kop p { margin: 2px 0; }
          .kop .instansi { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
          .kop .alamat { font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
          th, td { border: 1px solid #666; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          td.right { text-align: right; }
          .section { margin-bottom: 16px; }
          .footer { margin-top: 48px; text-align: right; }
          .footer .ttd { margin-top: 60px; }
          .alert-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
          .alert-critical { background: #fee2e2; color: #991b1b; }
          .alert-warning { background: #fef3c7; color: #92400e; }
          .alert-info { background: #e0f2fe; color: #075985; }
          @media print { body { margin: 0; padding: 20px; } }
        </style>
      </head><body>${proposal.html}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Close on Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col max-w-4xl w-full max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-3xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white">Proposal Revisi Pagu {deviationData.year}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Draft otomatis berdasarkan analisis deviasi & early warning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Tersalin!' : 'Salin Teks'}
              </button>
              <button
                onClick={handlePrint}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition flex items-center gap-1.5"
              >
                <Printer size={12} />
                Cetak
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition text-white"
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content — scrollable preview */}
        <div className="overflow-y-auto flex-1 p-6">
          <div
            ref={contentRef}
            className="prose prose-sm max-w-none font-serif text-slate-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: proposal.html }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between">
          <p className="text-[11px] text-slate-500 italic">
            Draft otomatis — review dan sesuaikan sebelum diajukan resmi.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
            >
              <Copy size={14} />
              Salin
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ─── Proposal Builder ──────────────────────────────────────────────────────

interface ProposalOutput {
  html:      string;
  plainText: string;
}

function buildProposal(
  data: DeviationData,
  warnings: EarlyWarningResult,
  auditEntries: AuditLogRow[],
  reasoningCategories: ReasoningCategory[],
  rsName: string,
): ProposalOutput {
  const year = data.year;
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Gather reviewed audit entries with reasoning
  const reviewedEntries = auditEntries.filter(
    (e) => e.data.isReviewed && e.data.reasoning && e.data.reasoningCategory,
  );

  // ── Gather reasoning category distribution
  const categoryDist: Record<string, number> = {};
  for (const e of reviewedEntries) {
    const cat = e.data.reasoningCategory!;
    categoryDist[cat] = (categoryDist[cat] || 0) + 1;
  }

  // ── Build sections ────────────────────────────────────────

  // §1. KOP SURAT
  const kopHtml = `
    <div class="kop">
      <p class="instansi">MARKAS BESAR ANGKATAN DARAT</p>
      <p class="instansi">${rsName.toUpperCase()}</p>
      <p class="alamat">Jl. Batin Tikal No. 10, Bangka Belitung</p>
    </div>
    <h1>USULAN REVISI PAGU ANGGARAN<br/>TAHUN ANGGARAN ${year}</h1>
    <p style="text-align:center;font-size:10pt;color:#666;margin-bottom:24px;">
      Nomor: ......./......../${year} &nbsp;&nbsp;|&nbsp;&nbsp; Tanggal: ${dateStr}
    </p>
  `;

  // §2. LATAR BELAKANG
  const latarBelakangHtml = `
    <h2>I. LATAR BELAKANG</h2>
    <div class="section">
      <p>Berdasarkan hasil monitoring dan evaluasi pelaksanaan anggaran ${rsName} Tahun Anggaran ${year}, telah teridentifikasi deviasi antara Rencana Penarikan Dana (RPD) dengan realisasi belanja yang memerlukan perhatian.</p>
      <p>Sistem Informasi Keuangan & Manajemen (SIKESUMA) telah mendeteksi <strong>${warnings.totalAlerts} peringatan</strong> melalui Early Warning Engine, dengan status kesehatan anggaran: <strong>${warnings.overallHealth === 'critical' ? 'KRITIS' : warnings.overallHealth === 'at_risk' ? 'BERISIKO' : warnings.overallHealth === 'watch' ? 'PERLU DIPANTAU' : 'SEHAT'}</strong>.</p>
      <p>Total RPD Tahun ${year}: <strong>Rp ${formatRpFull(data.yearTotalRpd)}</strong><br/>
         Total Realisasi: <strong>Rp ${formatRpFull(data.yearTotalReal)}</strong><br/>
         Deviasi Keseluruhan: <strong>${formatDeviationPct(data.yearDeviationPct)}</strong></p>
    </div>
  `;

  // §3. RINGKASAN DEVIASI PER KATEGORI
  const deviationTableRows = data.categories.map((cat) => {
    const isOver = cat.yearDeviationPct > 0;
    return `<tr>
      <td>${cat.shortLabel}</td>
      <td class="right">Rp ${formatRpFull(cat.yearTotalRpd)}</td>
      <td class="right">Rp ${formatRpFull(cat.yearTotalReal)}</td>
      <td class="right">Rp ${formatRpFull(cat.yearTotalReal - cat.yearTotalRpd)}</td>
      <td class="right" style="color:${isOver ? '#dc2626' : cat.yearDeviationPct < -10 ? '#2563eb' : '#16a34a'};font-weight:bold;">
        ${formatDeviationPct(cat.yearDeviationPct)}
      </td>
    </tr>`;
  }).join('\n');

  const ringkasanHtml = `
    <h2>II. RINGKASAN DEVIASI PER KATEGORI BELANJA</h2>
    <div class="section">
      <table>
        <thead>
          <tr>
            <th>Kategori Belanja</th>
            <th>RPD (Rencana)</th>
            <th>Realisasi</th>
            <th>Selisih</th>
            <th>Deviasi %</th>
          </tr>
        </thead>
        <tbody>
          ${deviationTableRows}
          <tr style="font-weight:bold;background:#f8fafc;">
            <td>TOTAL</td>
            <td class="right">Rp ${formatRpFull(data.yearTotalRpd)}</td>
            <td class="right">Rp ${formatRpFull(data.yearTotalReal)}</td>
            <td class="right">Rp ${formatRpFull(data.yearTotalReal - data.yearTotalRpd)}</td>
            <td class="right">${formatDeviationPct(data.yearDeviationPct)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // §4. PERINGATAN DINI (EARLY WARNING)
  const warningRows = warnings.alerts
    .filter((a) => a.severity !== 'info') // only warning + critical in formal doc
    .map((a) => {
      const sevLabel = a.severity === 'critical' ? 'KRITIS' : 'PERINGATAN';
      const sevClass = a.severity === 'critical' ? 'alert-critical' : 'alert-warning';
      return `<tr>
        <td><span class="alert-badge ${sevClass}">${sevLabel}</span></td>
        <td>${a.categoryLabel}</td>
        <td>${PATTERN_LABELS[a.pattern]}</td>
        <td>${a.message}</td>
      </tr>`;
    }).join('\n');

  const warningHtml = warningRows.length > 0 ? `
    <h2>III. PERINGATAN DINI (EARLY WARNING)</h2>
    <div class="section">
      <p>Berdasarkan analisis pola deviasi bulanan, sistem mendeteksi peringatan berikut:</p>
      <table>
        <thead>
          <tr><th>Tingkat</th><th>Kategori</th><th>Pola</th><th>Keterangan</th></tr>
        </thead>
        <tbody>${warningRows}</tbody>
      </table>
    </div>
  ` : '';

  // §5. FAKTOR DINAMIKA & REASONING
  const reasoningSummaryRows = Object.entries(categoryDist)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, count]) => {
      const meta = getReasoningCategoryMeta(catId, reasoningCategories);
      return `<tr><td>${meta?.label ?? catId}</td><td class="right">${count} entry</td></tr>`;
    }).join('\n');

  // Collect unique dynamics factors
  const dynamicsFactors = [...new Set(
    reviewedEntries
      .filter((e) => e.data.dynamicsFactor)
      .map((e) => e.data.dynamicsFactor!),
  )];

  const faktorHtml = `
    <h2>IV. FAKTOR DINAMIKA & KONTEKS ALASAN</h2>
    <div class="section">
      <p>Dari ${auditEntries.length} entry audit log, <strong>${reviewedEntries.length} (${auditEntries.length > 0 ? ((reviewedEntries.length / auditEntries.length) * 100).toFixed(0) : 0}%)</strong> telah ditinjau dengan reasoning.</p>
      
      ${reasoningSummaryRows.length > 0 ? `
        <h3>Distribusi Kategori Alasan</h3>
        <table>
          <thead><tr><th>Kategori</th><th>Jumlah</th></tr></thead>
          <tbody>${reasoningSummaryRows}</tbody>
        </table>
      ` : '<p><em>Belum ada audit entry yang ditinjau dengan reasoning.</em></p>'}
      
      ${dynamicsFactors.length > 0 ? `
        <h3>Faktor Dinamika Eksternal yang Tercatat</h3>
        <ul>${dynamicsFactors.map((f) => `<li>${f}</li>`).join('\n')}</ul>
      ` : ''}
    </div>
  `;

  // §6. DETAIL PER KATEGORI — monthly breakdown for categories with significant deviation
  const significantCategories = data.categories.filter(
    (c) => Math.abs(c.yearDeviationPct) >= 10 && Number.isFinite(c.yearDeviationPct),
  );

  const detailHtml = significantCategories.length > 0 ? `
    <h2>V. DETAIL DEVIASI PER KATEGORI</h2>
    ${significantCategories.map((cat) => buildCategoryDetail(cat, auditEntries, reasoningCategories)).join('\n')}
  ` : '';

  // §7. REKOMENDASI
  const rekomendasi = buildRekomendasi(data, warnings, reviewedEntries);
  const rekomendasiHtml = `
    <h2>${significantCategories.length > 0 ? 'VI' : 'V'}. REKOMENDASI</h2>
    <div class="section">
      ${rekomendasi.map((r, i) => `<p>${i + 1}. ${r}</p>`).join('\n')}
    </div>
  `;

  // §8. PENUTUP
  const penutupHtml = `
    <h2>${significantCategories.length > 0 ? 'VII' : 'VI'}. PENUTUP</h2>
    <div class="section">
      <p>Demikian usulan revisi pagu anggaran ini disampaikan. Dengan adanya early warning system dan analisis deviasi berbasis data, diharapkan proses pengajuan revisi dapat dilakukan lebih dini, terukur, dan akuntabel.</p>
      <p>Atas perhatian dan perkenan Pimpinan, kami ucapkan terima kasih.</p>
    </div>
    <div class="footer">
      <p>............, ${dateStr}</p>
      <p>Kepala ${rsName}</p>
      <div class="ttd">
        <p>_____________________________</p>
        <p>NRP. ........................</p>
      </div>
    </div>
  `;

  // ── Assemble
  const fullHtml = [
    kopHtml, latarBelakangHtml, ringkasanHtml, warningHtml,
    faktorHtml, detailHtml, rekomendasiHtml, penutupHtml,
  ].filter(Boolean).join('\n');

  // ── Plain text version (strip HTML tags)
  const plainText = buildPlainText(data, warnings, reviewedEntries, dynamicsFactors, categoryDist, reasoningCategories, rsName, dateStr, significantCategories);

  return { html: fullHtml, plainText };
}


// ─── Detail builder per category ───────────────────────────────────────────

function buildCategoryDetail(
  cat: CategoryDeviation,
  auditEntries: AuditLogRow[],
  reasoningCategories: ReasoningCategory[],
): string {
  const monthRows = cat.monthly
    .filter((_, i) => cat.monthly[i].rpdPlanned > 0 || cat.monthly[i].realisasiActual > 0)
    .map((cell, idx) => {
      const m = cell.month;
      const mLabel = MONTH_LABELS_FULL[m - 1];
      const isSignificant = Math.abs(cell.deviationPct) >= 20 && Number.isFinite(cell.deviationPct);
      return `<tr${isSignificant ? ' style="background:#fff7ed;"' : ''}>
        <td>${mLabel}</td>
        <td class="right">Rp ${formatRpFull(cell.rpdPlanned)}</td>
        <td class="right">Rp ${formatRpFull(cell.realisasiActual)}</td>
        <td class="right" style="${isSignificant ? 'font-weight:bold;color:#dc2626;' : ''}">
          ${formatDeviationPct(cell.deviationPct)}
        </td>
        <td>${cell.dominantReasoningCategory
          ? getReasoningCategoryMeta(cell.dominantReasoningCategory, reasoningCategories)?.label ?? '-'
          : '-'}</td>
      </tr>`;
    }).join('\n');

  return `
    <div class="section">
      <h3>${cat.shortLabel} (${cat.paguSectionTitle})</h3>
      <p>Total RPD: Rp ${formatRpFull(cat.yearTotalRpd)} | Total Realisasi: Rp ${formatRpFull(cat.yearTotalReal)} | Deviasi: ${formatDeviationPct(cat.yearDeviationPct)}</p>
      <table>
        <thead>
          <tr><th>Bulan</th><th>RPD</th><th>Realisasi</th><th>Deviasi</th><th>Kategori Alasan</th></tr>
        </thead>
        <tbody>${monthRows}</tbody>
      </table>
    </div>
  `;
}


// ─── Rekomendasi builder ───────────────────────────────────────────────────

function buildRekomendasi(
  data: DeviationData,
  warnings: EarlyWarningResult,
  reviewedEntries: AuditLogRow[],
): string[] {
  const reks: string[] = [];

  // Overspend categories
  const overCats = data.categories.filter((c) => c.yearDeviationPct > 20 && Number.isFinite(c.yearDeviationPct));
  if (overCats.length > 0) {
    const names = overCats.map((c) => c.shortLabel).join(', ');
    reks.push(
      `Mengajukan revisi pagu ke atas untuk kategori ${names} yang mengalami overspend signifikan (>20%).`,
    );
  }

  // Underspend categories
  const underCats = data.categories.filter((c) => c.yearDeviationPct < -20 && Number.isFinite(c.yearDeviationPct));
  if (underCats.length > 0) {
    const names = underCats.map((c) => c.shortLabel).join(', ');
    reks.push(
      `Evaluasi penyebab underspend pada kategori ${names} — pertimbangkan realokasi ke pos yang membutuhkan atau percepatan pengadaan.`,
    );
  }

  // Sustained warnings
  const sustained = warnings.alerts.filter((a) => a.pattern === 'sustained_overspend');
  if (sustained.length > 0) {
    reks.push(
      'Pola overspend berkelanjutan terdeteksi — segera koordinasi dengan Pejabat Pembuat Komitmen (PPK) untuk evaluasi kebutuhan anggaran sisa periode.',
    );
  }

  // Spike warnings
  const spikes = warnings.alerts.filter((a) => a.pattern === 'spike' && a.severity === 'critical');
  if (spikes.length > 0) {
    reks.push(
      'Lonjakan belanja mendadak terdeteksi — lakukan verifikasi apakah disebabkan kebutuhan darurat atau anomali pencatatan.',
    );
  }

  // Unreviewed audit entries
  const unreviewedCount = reviewedEntries.length;
  const totalAudit = unreviewedCount; // the reviewedEntries passed in are already filtered
  if (totalAudit < 10) {
    reks.push(
      'Tingkatkan kelengkapan tinjauan audit — semakin banyak entry yang ditinjau dengan reasoning, semakin kuat justifikasi proposal revisi.',
    );
  }

  // Default if empty
  if (reks.length === 0) {
    reks.push(
      'Meskipun deviasi masih dalam batas toleransi, tetap lakukan monitoring berkala melalui dashboard SIKESUMA.',
    );
  }

  reks.push(
    'Menyusun rapat koordinasi internal Sie Renbang untuk membahas opsi realokasi antar-pos sebelum pengajuan revisi pagu resmi ke satuan atas.',
  );

  return reks;
}


// ─── Plain text builder ────────────────────────────────────────────────────

function buildPlainText(
  data: DeviationData,
  warnings: EarlyWarningResult,
  reviewedEntries: AuditLogRow[],
  dynamicsFactors: string[],
  categoryDist: Record<string, number>,
  reasoningCategories: ReasoningCategory[],
  rsName: string,
  dateStr: string,
  significantCategories: CategoryDeviation[],
): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`USULAN REVISI PAGU ANGGARAN TAHUN ${data.year}`);
  lines.push(rsName.toUpperCase());
  lines.push(`Tanggal: ${dateStr}`);
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  lines.push('I. LATAR BELAKANG');
  lines.push(`   Total RPD: Rp ${formatRpFull(data.yearTotalRpd)}`);
  lines.push(`   Total Realisasi: Rp ${formatRpFull(data.yearTotalReal)}`);
  lines.push(`   Deviasi Keseluruhan: ${formatDeviationPct(data.yearDeviationPct)}`);
  lines.push(`   Status Early Warning: ${warnings.overallHealth.toUpperCase()}`);
  lines.push(`   Jumlah Peringatan: ${warnings.totalAlerts}`);
  lines.push('');

  lines.push('II. RINGKASAN DEVIASI PER KATEGORI');
  for (const cat of data.categories) {
    lines.push(`   ${cat.shortLabel}: RPD Rp ${formatRpFull(cat.yearTotalRpd)} → Realisasi Rp ${formatRpFull(cat.yearTotalReal)} (${formatDeviationPct(cat.yearDeviationPct)})`);
  }
  lines.push('');

  if (warnings.alerts.filter((a) => a.severity !== 'info').length > 0) {
    lines.push('III. PERINGATAN DINI');
    for (const a of warnings.alerts.filter((a) => a.severity !== 'info')) {
      const sev = a.severity === 'critical' ? '[KRITIS]' : '[PERINGATAN]';
      lines.push(`   ${sev} ${a.message}`);
    }
    lines.push('');
  }

  lines.push('IV. FAKTOR DINAMIKA');
  lines.push(`   Audit ditinjau: ${reviewedEntries.length} entry`);
  for (const [catId, count] of Object.entries(categoryDist)) {
    const meta = getReasoningCategoryMeta(catId, reasoningCategories);
    lines.push(`   - ${meta?.label ?? catId}: ${count} entry`);
  }
  if (dynamicsFactors.length > 0) {
    lines.push('   Faktor Eksternal:');
    for (const f of dynamicsFactors) {
      lines.push(`   - ${f}`);
    }
  }
  lines.push('');

  if (significantCategories.length > 0) {
    lines.push('V. DETAIL PER KATEGORI');
    for (const cat of significantCategories) {
      lines.push(`   ${cat.shortLabel}: ${formatDeviationPct(cat.yearDeviationPct)}`);
      for (const cell of cat.monthly) {
        if (cell.rpdPlanned > 0 || cell.realisasiActual > 0) {
          lines.push(`     ${MONTH_LABELS_FULL[cell.month - 1]}: RPD Rp ${formatRpFull(cell.rpdPlanned)} → Real Rp ${formatRpFull(cell.realisasiActual)} (${formatDeviationPct(cell.deviationPct)})`);
        }
      }
    }
    lines.push('');
  }

  const reks = buildRekomendasi(data, warnings, reviewedEntries);
  lines.push(`${significantCategories.length > 0 ? 'VI' : 'V'}. REKOMENDASI`);
  reks.forEach((r, i) => lines.push(`   ${i + 1}. ${r}`));
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`Dibuat oleh SIKESUMA — ${dateStr}`);

  return lines.join('\n');
}

export default RevisionProposalGenerator;
