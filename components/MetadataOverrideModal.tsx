/**
 * MetadataOverrideModal — Tier 3 Phase 3
 *
 * Warning modal sebelum set row.metadata_review (force confidence ke HIGH).
 * Per Owner direction 11 Mei 2026: WAJIB tampilkan warning karena action
 * ini affects Tier 4 validation logic.
 *
 * Flow:
 *   - User klik "Tandai Manual Reviewed" di MetadataDetailRow
 *   - Modal muncul dengan warning text + optional note input + reviewed_by input
 *   - Confirm → set row.metadata_review = { reviewed_at, reviewed_by?, override_to: 'high', note? }
 *   - Cancel → no-op
 *
 * Also supports REMOVING override (clearing metadata_review field) jika sudah
 * di-set sebelumnya.
 */
import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import type { PaguRow } from '../types';

interface MetadataOverrideModalProps {
  row: PaguRow;
  onConfirm: (review: PaguRow['metadata_review'] | null) => void;
  onCancel: () => void;
}

const MetadataOverrideModal: React.FC<MetadataOverrideModalProps> = ({ row, onConfirm, onCancel }) => {
  const isAlreadyReviewed = row.metadata_review?.override_to === 'high';
  const [reviewedBy, setReviewedBy] = useState(row.metadata_review?.reviewed_by ?? '');
  const [note, setNote] = useState(row.metadata_review?.note ?? '');

  const handleConfirm = () => {
    const review: NonNullable<PaguRow['metadata_review']> = {
      reviewed_at: new Date().toISOString(),
      override_to: 'high',
      ...(reviewedBy.trim() && { reviewed_by: reviewedBy.trim() }),
      ...(note.trim() && { note: note.trim() }),
    };
    onConfirm(review);
  };

  const handleRemoveOverride = () => {
    onConfirm(null);  // clear metadata_review
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">
                {isAlreadyReviewed ? 'Edit Manual Review' : 'Tandai Manual Reviewed'}
              </h3>
              <p className="text-[10px] text-amber-100 mt-0.5 font-mono">{row.kode} — {row.description.slice(0, 50)}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-amber-100 hover:text-white p-1.5 hover:bg-amber-700 rounded-lg transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Warning body */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <p className="font-black uppercase tracking-wider text-[10px] mb-1.5">Warning — affects Tier 4 validation</p>
              <p>
                Marking this row as manually reviewed will <strong>override recommendation confidence to HIGH</strong> for
                all metadata fields. Tier 4 validation engine akan treat row ini sebagai high-confidence regardless of
                computed rules.
              </p>
              <p className="mt-2">
                Confirm only after verifying <strong>KRO / RO / Komponen / Sumber Dana</strong> mapping benar (cross-check
                dengan DIPA Petikan + RKKS 2025 §12.2).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Reviewed By <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={e => setReviewedBy(e.target.value)}
                placeholder="mis. Angga (Sie Renbang)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">
                Review Note <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="mis. Verified vs DIPA Petikan TA 2025 — RO 5 Pengadaan Alsintor confirmed"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-amber-400 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center gap-3 border-t border-slate-200 flex-wrap">
          {isAlreadyReviewed && (
            <button
              onClick={handleRemoveOverride}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remove manual review flag — kembali ke computed confidence"
            >
              <ShieldOff size={14} /> Remove Override
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-600 text-white hover:bg-amber-500 transition-colors"
          >
            <ShieldCheck size={14} /> {isAlreadyReviewed ? 'Update Override' : 'Confirm Override'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataOverrideModal;
