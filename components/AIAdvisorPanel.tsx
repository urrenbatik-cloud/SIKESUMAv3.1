// ============================================================================
// SIKESUMA v3.1 · S6.0 · AI Advisor Panel (Reusable)
// ============================================================================
// Displays AI analysis results in a structured, actionable format.
// Used in ServiceDetails (jasa efficiency) and DeviationDashboard (reallocation).
// ============================================================================

import React, { useState, useCallback } from 'react';
import { BrainCircuit, ArrowRight, AlertTriangle, CheckCircle2, Download, RefreshCw, ArrowRightLeft, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { AIAnalysisResult, BudgetBriefing, AnalysisMode } from '../utils/aiAdvisor';
import { runAIAnalysis, exportBriefingMarkdown } from '../utils/aiAdvisor';

interface AIAdvisorPanelProps {
  briefing: BudgetBriefing;
  mode: AnalysisMode;
  compact?: boolean;  // true = sidebar mode (ServiceDetails), false = full-width (DeviationDashboard)
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  tinggi:  { bg: 'bg-rose-50',  text: 'text-rose-700',  ring: 'ring-rose-200',  label: 'PRIORITAS TINGGI' },
  sedang:  { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'PRIORITAS SEDANG' },
  rendah:  { bg: 'bg-sky-50',   text: 'text-sky-700',   ring: 'ring-sky-200',   label: 'PRIORITAS RENDAH' },
};

const AIAdvisorPanel: React.FC<AIAdvisorPanelProps> = ({ briefing, mode, compact = false }) => {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRek, setExpandedRek] = useState<string | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await runAIAnalysis(mode, briefing);
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menjalankan analisis AI.');
    } finally {
      setLoading(false);
    }
  }, [mode, briefing]);

  const handleExportBriefing = useCallback(() => {
    const md = exportBriefingMarkdown(briefing);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_briefing_${briefing.tahun}_${briefing.bulan || 'annual'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [briefing]);

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

  // ─── Idle State ──────────────────────────────────────────────────
  if (!result && !loading && !error) {
    return (
      <div className={`bg-white border border-slate-200 shadow-xl ${compact ? 'p-8 rounded-[2rem]' : 'p-10 rounded-3xl'}`}>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
          <BrainCircuit size={18} className="text-blue-500" />
          {mode === 'budget_reallocation' ? 'AI Realokasi Anggaran' : 'AI Financial Advisory'}
        </h3>
        <p className={`${compact ? 'text-[11px]' : 'text-sm'} text-slate-500 leading-relaxed mb-6`}>
          {mode === 'budget_reallocation'
            ? 'Analisis pagu, RAB, RPD, dan realisasi untuk rekomendasi realokasi anggaran (revisi POK). Total pagu tetap sama.'
            : 'Analisis efisiensi operasional jasa pelayanan berdasarkan data klaim, beban, dan margin bulan ini.'
          }
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRunAnalysis}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-blue-600 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
          >
            <BrainCircuit size={16} /> Jalankan Analisis AI
          </button>
          <button
            onClick={handleExportBriefing}
            className="px-5 py-3 bg-white text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-wider shadow border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export Briefing
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading State ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white border border-slate-200 shadow-xl ${compact ? 'p-8 rounded-[2rem]' : 'p-10 rounded-3xl'}`}>
        <div className="py-12 text-center">
          <BrainCircuit className="mx-auto text-blue-500 mb-4 animate-spin" size={40} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Menganalisis data anggaran...
          </p>
          <p className="text-[10px] text-slate-400 mt-2">
            Mengirim {briefing.paguSections.length} kategori pagu + {briefing.rpdVsRealisasi.length} data deviasi + {briefing.earlyWarnings.length} peringatan
          </p>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────
  if (error) {
    return (
      <div className={`bg-white border border-rose-200 shadow-xl ${compact ? 'p-8 rounded-[2rem]' : 'p-10 rounded-3xl'}`}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700">Analisis AI Gagal</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  // ─── Result State ────────────────────────────────────────────────
  if (!result) return null;

  return (
    <div className={`bg-white border border-slate-200 shadow-xl ${compact ? 'p-8 rounded-[2rem]' : 'p-10 rounded-3xl'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
          <BrainCircuit size={18} className="text-blue-500" />
          {mode === 'budget_reallocation' ? 'Rekomendasi Realokasi' : 'Advisory Jasa'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase">
            {result.provider === 'claude' ? 'Claude AI' : 'Gemini AI'}
          </span>
          <button onClick={handleRunAnalysis} className="text-slate-400 hover:text-blue-500 transition-colors" title="Re-run analisis">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
        <p className={`${compact ? 'text-[11px]' : 'text-sm'} text-slate-700 leading-relaxed`}>
          {result.ringkasan}
        </p>
      </div>

      {/* Realokasi Suggestions (only for budget_reallocation mode) */}
      {result.realokasi && result.realokasi.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ArrowRightLeft size={14} /> Saran Realokasi Dana
          </h4>
          {result.realokasi.map((r, i) => (
            <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] truncate max-w-[120px]">{r.dari}</span>
                  <ArrowRight size={12} className="text-blue-500 flex-shrink-0" />
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] truncate max-w-[120px]">{r.ke}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2">{r.alasan}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-blue-700">Rp {formatRp(r.jumlah)}</p>
              </div>
            </div>
          ))}
          {result.totalPaguSebelum && result.totalPaguSesudah && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Total pagu tetap
              </span>
              <span className="text-xs font-black text-emerald-800">Rp {formatRp(result.totalPaguSesudah)}</span>
            </div>
          )}
        </div>
      )}

      {/* Rekomendasi */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Rekomendasi ({result.rekomendasi.length})
        </h4>
        {result.rekomendasi.map((rek) => {
          const style = PRIORITY_STYLES[rek.prioritas] || PRIORITY_STYLES.sedang;
          const isExpanded = expandedRek === rek.id;
          return (
            <div key={rek.id} className={`${style.bg} border ${style.ring} ring-1 rounded-xl overflow-hidden`}>
              <button
                className="w-full text-left px-4 py-3 flex items-center gap-3"
                onClick={() => setExpandedRek(isExpanded ? null : rek.id)}
              >
                <span className={`text-[8px] font-black ${style.text} uppercase tracking-wider flex-shrink-0`}>
                  {style.label}
                </span>
                <span className={`text-xs font-bold ${style.text} flex-1 truncate`}>{rek.judul}</span>
                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed">{rek.penjelasan}</p>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aksi:</p>
                    <p className="text-[11px] text-slate-700 font-medium">{rek.aksi}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catatan Risiko */}
      {result.catatanRisiko && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Catatan Risiko
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">{result.catatanRisiko}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleExportBriefing}
          className="px-4 py-2 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
        >
          <FileText size={12} /> Export Briefing (.md)
        </button>
        <button
          onClick={handleRunAnalysis}
          className="px-4 py-2 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Analisis Ulang
        </button>
      </div>
    </div>
  );
};

export default AIAdvisorPanel;
