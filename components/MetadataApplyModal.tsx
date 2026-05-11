/**
 * MetadataApplyModal — Tier 3 Phase 3
 *
 * Modal preview untuk apply metadata recommendation ke pagu_row.
 * Per Decision E2 (Owner-approved 11 Mei 2026): user lihat dulu apa yang
 * akan di-apply, baru klik Confirm.
 *
 * Tampilan:
 *   - Header: row info (kode + description)
 *   - Diff table: 7 fields (kro, kegiatan, ro, komponen, sumber_dana,
 *     volume_ro, satuan_ro) dengan Current → Proposed + confidence badge
 *   - Footer: Cancel / Confirm & Apply
 *
 * Behavior: hanya non-null proposed values yang akan di-apply. Null values
 * (mis. RO untuk Alsatri) tidak di-set, user perlu Edit Manual.
 */
import React from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import type { PaguRow } from '../types';
import type { MetadataRecommendation, Confidence } from '../utils/metadataRecommender';

interface MetadataApplyModalProps {
  row: PaguRow;
  recommendation: MetadataRecommendation;
  onConfirm: (updates: Partial<PaguRow>) => void;
  onCancel: () => void;
}

const confidenceStyles: Record<Confidence, { bg: string; text: string; label: string }> = {
  high:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'High'   },
  medium: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Medium' },
  low:    { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'Low'    },
};

function ConfidenceBadge({ level }: { level: Confidence }) {
  const s = confidenceStyles[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

const MetadataApplyModal: React.FC<MetadataApplyModalProps> = ({ row, recommendation, onConfirm, onCancel }) => {
  // Compute updates: only set fields where recommendation has non-null code/value
  const updates: Partial<PaguRow> = {};
  if (recommendation.kro.code) {
    updates.kro_code = recommendation.kro.code;
    if (recommendation.kro.name) updates.kro_name = recommendation.kro.name;
  }
  if (recommendation.kegiatan.code) {
    updates.kegiatan_code = recommendation.kegiatan.code;
    if (recommendation.kegiatan.name) updates.kegiatan_name = recommendation.kegiatan.name;
  }
  if (recommendation.ro.code) {
    updates.ro_code = recommendation.ro.code;
  }
  if (recommendation.komponen.code) {
    updates.komponen_code = recommendation.komponen.code;
    if (recommendation.komponen.name) updates.komponen_name = recommendation.komponen.name;
  }
  if (recommendation.sumber_dana.kode) {
    updates.sumber_dana_kode = recommendation.sumber_dana.kode;
  }

  const fieldRows: Array<{
    label: string;
    currentCode: string | null | undefined;
    currentName?: string | null | undefined;
    proposedCode: string | null;
    proposedName?: string | null;
    confidence: Confidence;
  }> = [
    {
      label: 'KRO',
      currentCode: row.kro_code,
      currentName: row.kro_name,
      proposedCode: recommendation.kro.code,
      proposedName: recommendation.kro.name,
      confidence: recommendation.kro.confidence,
    },
    {
      label: 'Kegiatan',
      currentCode: row.kegiatan_code,
      currentName: row.kegiatan_name,
      proposedCode: recommendation.kegiatan.code,
      proposedName: recommendation.kegiatan.name,
      confidence: recommendation.kegiatan.confidence,
    },
    {
      label: 'RO',
      currentCode: row.ro_code,
      proposedCode: recommendation.ro.code,
      confidence: recommendation.ro.confidence,
    },
    {
      label: 'Komponen',
      currentCode: row.komponen_code,
      currentName: row.komponen_name,
      proposedCode: recommendation.komponen.code,
      proposedName: recommendation.komponen.name,
      confidence: recommendation.komponen.confidence,
    },
    {
      label: 'Sumber Dana',
      currentCode: row.sumber_dana_kode,
      proposedCode: recommendation.sumber_dana.kode,
      confidence: recommendation.sumber_dana.confidence,
    },
  ];

  const willApplyCount = Object.keys(updates).length;
  const skippedFields = fieldRows.filter(f => !f.proposedCode).map(f => f.label);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Apply Metadata Recommendation</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{row.kode} — {row.description.slice(0, 60)}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body — diff table */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">
            Preview perubahan ({willApplyCount} field akan ter-update)
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200">
                <th className="text-left py-2 pr-4 w-1/5">Field</th>
                <th className="text-left py-2 px-2">Current</th>
                <th className="text-left py-2 px-2">Proposed</th>
                <th className="text-center py-2 pl-2 w-20">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fieldRows.map(f => (
                <tr key={f.label} className={f.proposedCode ? '' : 'opacity-40'}>
                  <td className="py-2.5 pr-4 font-bold text-slate-700">{f.label}</td>
                  <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">
                    {f.currentCode ? (
                      <>
                        <div>{f.currentCode}</div>
                        {f.currentName && <div className="text-[9px] text-slate-400">{f.currentName}</div>}
                      </>
                    ) : (
                      <span className="italic text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-slate-900 font-mono text-[11px]">
                    {f.proposedCode ? (
                      <>
                        <div className="font-bold">{f.proposedCode}</div>
                        {f.proposedName && <div className="text-[9px] text-slate-500">{f.proposedName}</div>}
                      </>
                    ) : (
                      <span className="italic text-slate-300">— (manual fill)</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 text-center">
                    <ConfidenceBadge level={f.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {skippedFields.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[10px] text-amber-800">
                <p className="font-bold mb-1">{skippedFields.length} field tidak ada rekomendasi (null):</p>
                <p>{skippedFields.join(', ')} — perlu manual fill via tombol "Edit Manual" setelah Apply.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(updates)}
            disabled={willApplyCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Check size={14} /> Confirm &amp; Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataApplyModal;
