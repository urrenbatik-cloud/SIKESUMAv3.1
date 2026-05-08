// ============================================================================
// SIKESUMA v3.1 · S5.3 · AuditEntryEditModal
// ============================================================================
// Tinjauan Audit — modal child component untuk review/edit reasoning fields
// pada audit_log entry.
//
// Decisions:
//   §S5.3-D1 A   : Extend AuditLogViewer (parent) — modal di-render di sana
//   §S5.3-D3 A   : Modal-based edit (mobile-friendly, no layout disruption)
//   §S5.3-D4     : 7 fields (existing 6 + reviewerNotes — internal commentary)
//   §S5.3-D6     : Factor out modal child component (this file)
//   §S5.3-T1 A   : Validation reasoning ≥10 chars + category required
//   §S5.3-T2 A   : Un-review with confirm dialog, reasoning preserved
//   §S5.3-T4 A   : Post-save: close modal + toast + parent refresh
//
// Props contract:
//   - row        : audit_log row (envelope shape from AuditLogViewer)
//   - categories : pre-loaded ReasoningCategory list (parent fetches once)
//   - onClose    : close modal (no save)
//   - onSaved    : success callback — parent triggers list refresh
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { X, AlertTriangle, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from './Toast';
import {
  markAuditEntryReviewed,
  markAuditEntryUnreviewed,
  getCurrentReviewer,
} from '../lib/audit';
import {
  getReasoningCategoryMeta,
  isReasoningValid,
  REASONING_MIN_LENGTH,
  getCategoryBadgeClasses,
  getAuditEntityLabel,
  getAuditActionMeta,
  type ReasoningCategory,
} from '../constants/audit';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Row shape mirror dari AuditLogViewer (kept loose karena envelope JSONB). */
export interface AuditLogRow {
  id: string;
  data: {
    entity:             string;
    action:             string;
    entityId:           string;
    user:               string;
    timestamp:          string;
    description:        string;
    snapshot:           unknown;
    reasoning?:         string | null;
    reasoningCategory?: string | null;
    dynamicsFactor?:    string | null;
    reviewerNotes?:     string | null;
    isReviewed?:        boolean;
    reviewedAt?:        string | null;
    reviewedBy?:        string | null;
  };
  created_at?: string;
}

interface AuditEntryEditModalProps {
  row:        AuditLogRow;
  categories: ReasoningCategory[];
  onClose:    () => void;
  onSaved:    () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

const AuditEntryEditModal: React.FC<AuditEntryEditModalProps> = ({
  row, categories, onClose, onSaved,
}) => {
  const [reasoning,      setReasoning]      = useState('');
  const [category,       setCategory]       = useState<string>('');
  const [dynamicsFactor, setDynamicsFactor] = useState('');
  const [reviewerNotes,  setReviewerNotes]  = useState('');
  const [isSaving,       setIsSaving]       = useState(false);
  const [showUnreviewConfirm, setShowUnreviewConfirm] = useState(false);
  const [showSnapshot,   setShowSnapshot]   = useState(false);

  const isAlreadyReviewed = row.data.isReviewed === true;

  // Hydrate form from row on mount
  useEffect(() => {
    setReasoning(row.data.reasoning ?? '');
    setCategory(row.data.reasoningCategory ?? '');
    setDynamicsFactor(row.data.dynamicsFactor ?? '');
    setReviewerNotes(row.data.reviewerNotes ?? '');
    setShowUnreviewConfirm(false);
  }, [row]);

  // Esc key → close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isSaving]);

  const valid = isReasoningValid(reasoning, category);
  const reasoningCharCount = reasoning.trim().length;
  const charDeficit = Math.max(0, REASONING_MIN_LENGTH - reasoningCharCount);

  const actionMeta = getAuditActionMeta(row.data.action);
  const entityLabel = getAuditEntityLabel(row.data.entity);

  const formattedTimestamp = useMemo(() => {
    try {
      return new Date(row.data.timestamp).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return row.data.timestamp;
    }
  }, [row.data.timestamp]);

  const formattedReviewedAt = useMemo(() => {
    if (!row.data.reviewedAt) return null;
    try {
      return new Date(row.data.reviewedAt).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return row.data.reviewedAt;
    }
  }, [row.data.reviewedAt]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!valid) return;
    setIsSaving(true);

    const ok = await markAuditEntryReviewed(
      row.id,
      {
        reasoning:         reasoning.trim(),
        reasoningCategory: category,
        dynamicsFactor:    dynamicsFactor.trim() || null,
        reviewerNotes:     reviewerNotes.trim() || null,
      },
      getCurrentReviewer(),
    );

    setIsSaving(false);

    if (ok) {
      toast.success('Tinjauan disimpan');
      onSaved();
      onClose();
    } else {
      toast.error('Gagal simpan tinjauan — cek koneksi atau RLS', 6000);
    }
  };

  const handleUnreview = async () => {
    setIsSaving(true);
    const ok = await markAuditEntryUnreviewed(row.id);
    setIsSaving(false);

    if (ok) {
      toast.success('Tinjauan dihapus, reasoning tetap tersimpan');
      onSaved();
      onClose();
    } else {
      toast.error('Gagal hapus tinjauan', 6000);
    }
  };

  const selectedCatMeta = getReasoningCategoryMeta(category, categories);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`shrink-0 inline-block w-2.5 h-2.5 rounded-full ${
                isAlreadyReviewed ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {isAlreadyReviewed ? 'Edit Tinjauan' : 'Tinjau Entry Audit'}
              </h2>
              <p className="text-xs text-slate-500 font-mono truncate">{row.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
            title="Tutup (Esc)"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">

          {/* Entry meta */}
          <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1.5 border border-slate-200">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 w-24 shrink-0">Entitas:</span>
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">{entityLabel}</span>
              <span className={`px-2 py-0.5 rounded font-medium ${
                actionMeta.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                actionMeta.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                actionMeta.color === 'rose' ? 'bg-rose-100 text-rose-800' :
                actionMeta.color === 'amber' ? 'bg-amber-100 text-amber-800' :
                'bg-stone-100 text-stone-700'
              }`}>{actionMeta.label}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 w-24 shrink-0">Entry ID:</span>
              <span className="font-mono text-slate-800 break-all">{row.data.entityId}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 w-24 shrink-0">Tanggal:</span>
              <span className="text-slate-800">{formattedTimestamp}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 w-24 shrink-0">User:</span>
              <span className="text-slate-800">{row.data.user}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 w-24 shrink-0">Deskripsi:</span>
              <span className="text-slate-900 font-medium">{row.data.description}</span>
            </div>
            {isAlreadyReviewed && (
              <div className="flex items-start gap-2 pt-1.5 mt-1.5 border-t border-slate-300">
                <span className="text-emerald-700 w-24 shrink-0">✓ Direview:</span>
                <span className="text-slate-800">
                  {row.data.reviewedBy ?? '—'}{formattedReviewedAt ? ` · ${formattedReviewedAt}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Snapshot collapsible */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowSnapshot(s => !s)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700 transition"
            >
              <span>Snapshot data</span>
              {showSnapshot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showSnapshot && (
              <pre className="px-4 py-3 text-xs bg-slate-900 text-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(row.data.snapshot, null, 2)}
              </pre>
            )}
          </div>

          {/* PUBLIC SECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span>📝 Penjelasan Publik</span>
              <span className="text-xs font-normal text-slate-500">
                (akan tampil di laporan / dashboard deviasi)
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Reasoning <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={3}
                disabled={isSaving}
                placeholder="mis: Pembelian obat anti-DBD untuk wabah trimester 2 di Pangkalpinang. Permintaan +72% dari RPD karena kasus DBD peak Mei 2024."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-300 outline-none resize-none disabled:bg-slate-50"
              />
              <div className="flex justify-between mt-1 text-xs">
                <span className={charDeficit > 0 ? 'text-amber-700 font-medium' : 'text-emerald-700'}>
                  {charDeficit > 0
                    ? `Min ${REASONING_MIN_LENGTH} karakter (kurang ${charDeficit})`
                    : '✓ Cukup'}
                </span>
                <span className="text-slate-400">{reasoningCharCount} / ∞</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-300 outline-none disabled:bg-slate-50"
              >
                <option value="">— Pilih Kategori —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {selectedCatMeta && (
                <span
                  className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${getCategoryBadgeClasses(selectedCatMeta.color)}`}
                >
                  🏷️ {selectedCatMeta.label}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Faktor Dinamika{' '}
                <span className="text-xs font-normal text-slate-400">(opsional)</span>
              </label>
              <input
                type="text"
                value={dynamicsFactor}
                onChange={(e) => setDynamicsFactor(e.target.value)}
                disabled={isSaving}
                placeholder="mis: Wabah DBD musim hujan, Inflasi BPS Q3 2024"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-300 outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* INTERNAL SECTION */}
          <div className="space-y-3 pt-3 border-t border-dashed border-slate-300">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <span>🔒 Catatan Internal</span>
              <span className="text-xs font-normal text-slate-500">
                (hanya internal Sie Renbang, opsional)
              </span>
            </div>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              rows={2}
              disabled={isSaving}
              placeholder="mis: Cross-checked dengan stok gudang 25 Apr — match. Approved for re-allocate per rapat 15 Mei."
              className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none disabled:bg-amber-50/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Hapus Tinjauan (only if reviewed) */}
          <div>
            {isAlreadyReviewed && !showUnreviewConfirm && (
              <button
                onClick={() => setShowUnreviewConfirm(true)}
                disabled={isSaving}
                className="px-3 py-2 text-sm text-red-700 hover:bg-red-50 border border-red-200 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                <Trash2 size={14} />
                Hapus Tinjauan
              </button>
            )}
            {showUnreviewConfirm && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                <AlertTriangle size={14} className="text-red-700 shrink-0" />
                <span className="text-xs text-red-800">Yakin? Reasoning akan tetap tersimpan.</span>
                <button
                  onClick={handleUnreview}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {isSaving ? 'Memproses...' : 'Ya, Hapus'}
                </button>
                <button
                  onClick={() => setShowUnreviewConfirm(false)}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs text-slate-700 hover:bg-slate-200 rounded-md disabled:opacity-50 transition"
                >
                  Batal
                </button>
              </div>
            )}
          </div>

          {/* Right: Cancel + Save */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!valid || isSaving}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 transition"
            >
              <Save size={14} />
              {isSaving ? 'Menyimpan...' : 'Simpan Tinjauan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditEntryEditModal;
