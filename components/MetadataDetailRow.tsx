/**
 * MetadataDetailRow — Tier 3 Phase 3
 *
 * Expandable row yang muncul di bawah leaf row saat "Status Metadata"
 * di-expand. Menampilkan 5 metadata fields (KRO, Kegiatan, RO, Komponen,
 * Sumber Dana) dengan current value + recommended value + confidence
 * badge, plus 2 action buttons.
 *
 * Per Decision D2 (Owner-approved 11 Mei 2026): row dengan aggregate
 * confidence MEDIUM/LOW auto-expanded saat mount untuk surface problem
 * rows. User bisa toggle collapse via chevron di kolom Status Metadata.
 *
 * Per Decision E2: tombol "Terima Rekomendasi" buka MetadataApplyModal
 * (preview perubahan → confirm). Tombol "Tandai Manual Reviewed" buka
 * override warning modal (per Owner direction 11 Mei 2026).
 */
import React from 'react';
import { Check, ShieldCheck, AlertCircle } from 'lucide-react';
import type { PaguRow } from '../types';
import type { MetadataRecommendation, Confidence } from '../utils/metadataRecommender';

interface MetadataDetailRowProps {
  row: PaguRow;
  recommendation: MetadataRecommendation;
  colSpan: number;                       // table column span (depends on viewMode)
  onOpenApplyModal: () => void;          // → MetadataApplyModal preview
  onOpenOverrideModal: () => void;       // → warning modal sebelum set metadata_review
}

const confidenceStyles: Record<Confidence, { bg: string; text: string; border: string; label: string }> = {
  high:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'High'   },
  medium: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Medium' },
  low:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'Low'    },
};

function FieldCard({
  label,
  currentCode,
  currentName,
  proposedCode,
  proposedName,
  confidence,
}: {
  label: string;
  currentCode: string | null | undefined;
  currentName?: string | null | undefined;
  proposedCode: string | null;
  proposedName?: string | null;
  confidence: Confidence;
}) {
  const s = confidenceStyles[confidence];
  const matches = currentCode === proposedCode && currentCode != null;
  return (
    <div className={`border ${s.border} rounded-xl p-3 ${s.bg} relative`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${s.text} bg-white/60`}>
          {s.label}
        </span>
      </div>
      <div className="text-[10px] text-slate-500 mb-0.5">Current:</div>
      <div className="font-mono font-bold text-slate-700 text-xs mb-2">
        {currentCode ? (
          <>
            {currentCode}
            {currentName && <div className="text-[9px] text-slate-500 font-normal mt-0.5">{currentName}</div>}
          </>
        ) : (
          <span className="italic text-slate-300 font-normal">— belum diisi</span>
        )}
      </div>
      <div className="text-[10px] text-slate-500 mb-0.5">Recommended:</div>
      <div className={`font-mono font-bold text-xs ${matches ? 'text-emerald-600' : 'text-slate-900'}`}>
        {proposedCode ? (
          <>
            {matches && <Check size={10} className="inline mr-1 text-emerald-600" />}
            {proposedCode}
            {proposedName && <div className="text-[9px] text-slate-500 font-normal mt-0.5">{proposedName}</div>}
          </>
        ) : (
          <span className="italic text-slate-400 font-normal">— manual fill required</span>
        )}
      </div>
    </div>
  );
}

const MetadataDetailRow: React.FC<MetadataDetailRowProps> = ({
  row,
  recommendation,
  colSpan,
  onOpenApplyModal,
  onOpenOverrideModal,
}) => {
  const isManuallyReviewed = row.metadata_review?.override_to === 'high';

  // Count fields that have non-null recommendation (apply-able)
  const applicableFields = [
    recommendation.kro.code,
    recommendation.kegiatan.code,
    recommendation.ro.code,
    recommendation.komponen.code,
    recommendation.sumber_dana.kode,
  ].filter(Boolean).length;

  return (
    <tr className="bg-slate-50/80 border-y-2 border-slate-200">
      <td colSpan={colSpan} className="px-8 py-5">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Metadata BAS Recommendation
              </h4>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Untuk validasi 12 hard constraints (C1-C12) Revisi POK • Per RKKS 2025 §12.2
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isManuallyReviewed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                  <ShieldCheck size={12} /> Manually Reviewed
                </span>
              )}
              <button
                onClick={onOpenApplyModal}
                disabled={applicableFields === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                title={applicableFields === 0 ? 'Tidak ada rekomendasi yang bisa di-apply' : `Apply ${applicableFields} field`}
              >
                <Check size={12} /> Terima Rekomendasi
              </button>
              <button
                onClick={onOpenOverrideModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${
                  isManuallyReviewed
                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
                title="Override recommendation confidence ke HIGH (manual review by Angga)"
              >
                <AlertCircle size={12} /> {isManuallyReviewed ? 'Edit Override' : 'Tandai Manual Reviewed'}
              </button>
            </div>
          </div>

          {/* 5 field cards in responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <FieldCard
              label="KRO"
              currentCode={row.kro_code}
              currentName={row.kro_name}
              proposedCode={recommendation.kro.code}
              proposedName={recommendation.kro.name}
              confidence={recommendation.kro.confidence}
            />
            <FieldCard
              label="Kegiatan"
              currentCode={row.kegiatan_code}
              currentName={row.kegiatan_name}
              proposedCode={recommendation.kegiatan.code}
              proposedName={recommendation.kegiatan.name}
              confidence={recommendation.kegiatan.confidence}
            />
            <FieldCard
              label="RO"
              currentCode={row.ro_code}
              proposedCode={recommendation.ro.code}
              confidence={recommendation.ro.confidence}
            />
            <FieldCard
              label="Komponen"
              currentCode={row.komponen_code}
              currentName={row.komponen_name}
              proposedCode={recommendation.komponen.code}
              proposedName={recommendation.komponen.name}
              confidence={recommendation.komponen.confidence}
            />
            <FieldCard
              label="Sumber Dana"
              currentCode={row.sumber_dana_kode}
              proposedCode={recommendation.sumber_dana.kode}
              confidence={recommendation.sumber_dana.confidence}
            />
          </div>

          {/* Manual review note (if any) */}
          {isManuallyReviewed && row.metadata_review?.note && (
            <div className="mt-3 bg-white border border-emerald-200 rounded-lg px-4 py-2.5 text-[10px] text-slate-600">
              <span className="font-bold text-emerald-700 mr-2">Review note:</span>
              {row.metadata_review.note}
              {row.metadata_review.reviewed_by && (
                <span className="ml-2 text-slate-400">— {row.metadata_review.reviewed_by}</span>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default MetadataDetailRow;
