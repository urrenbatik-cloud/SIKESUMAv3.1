// ============================================================================
// SIKESUMA v3.1 · S3.6 · Rs Profile Editor
// ============================================================================
// File          : components/RsProfileEditor.tsx
// Phase         : Step 3 / Session B / Sub-sequence S3.6
// Date          : 2026-05-08
// Source        : Per spec 02_SESSION_B_KICKOFF_BRIEF.md §3 S3.6 +
//                 Komunikasi feature self-contained pattern (D-S3.6-1 Opsi B).
//
// Purpose       : Editor untuk system_settings.rs_profile. Self-contained —
//                 fetch direct dari Supabase, manage own audit emit. Tidak
//                 di-wire ke App.tsx state (Pattern reusable untuk S3.5
//                 PNBP config dan future Settings tabs).
//
// Decisions encoded:
//   - D-S3.6-1 Opsi B: self-contained, direct supabase, direct audit
//   - D-S3.6-2: inline logAuditEntries, entity 'rsProfile', action 'config_update',
//                snapshot field-level diff {field: {before, after}} for changed only
//   - D-S3.6-3 Opsi MAX: 11 fields total (5 existing + 6 new: npwp, kodeSatker,
//                akreditasi, kepalaRS, nipKepalaRS, email)
//   - D-S3.6-4: replace ComingSoonStub di SettingsModule
//
// Audit pattern note: SAMA dengan Komunikasi (direct inline call), DIFFERENT
// dari Session A diff-based syncToCloud pattern.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logAuditEntries, type AuditEntryInput } from '../lib/audit';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RsProfile {
  // Existing 5 fields (S3.1 seed)
  namaInstansi: string;
  namaRS:       string;
  alamat:       string;
  telepon:      string;
  kota:         string;
  // 6 new fields (D-S3.6-3 Opsi MAX expansion)
  npwp:         string;     // NPWP institusional, untuk Laporan Kemenkeu
  kodeSatker:   string;     // Kode Satuan Kerja TNI AD
  akreditasi:   string;     // e.g., "Paripurna 2024-2027"
  kepalaRS:     string;     // Rank + nama Karumkit, e.g., "Letkol Ckm dr. Andi Wibowo, Sp.B"
  nipKepalaRS:  string;     // NIP/NRP Kepala RS
  email:        string;     // Email resmi institusional
}

const EMPTY_PROFILE: RsProfile = {
  namaInstansi: '',
  namaRS:       '',
  alamat:       '',
  telepon:      '',
  kota:         '',
  npwp:         '',
  kodeSatker:   '',
  akreditasi:   '',
  kepalaRS:     '',
  nipKepalaRS:  '',
  email:        '',
};

// ─── Field Definitions ─────────────────────────────────────────────────────

const FIELD_LABELS: Record<keyof RsProfile, string> = {
  namaInstansi: 'Nama Instansi',
  namaRS:       'Nama Rumah Sakit',
  alamat:       'Alamat Lengkap',
  telepon:      'Nomor Telepon',
  kota:         'Kota',
  npwp:         'NPWP Institusional',
  kodeSatker:   'Kode Satuan Kerja',
  akreditasi:   'Status Akreditasi',
  kepalaRS:     'Kepala RS (Karumkit)',
  nipKepalaRS:  'NIP / NRP Kepala RS',
  email:        'Email Resmi',
};

const FIELD_HINTS: Partial<Record<keyof RsProfile, string>> = {
  namaInstansi: 'Contoh: TNI Angkatan Darat',
  namaRS:       'Contoh: Rumah Sakit Tk.IV 02.07.03 Batin Tikal',
  alamat:       'Alamat lengkap dengan kode pos',
  telepon:      'Format: 0271-xxx atau +62xxx',
  kota:         'Kota / kabupaten',
  npwp:         'Format: 99.999.999.9-999.000',
  kodeSatker:   'Kode satker dari TNI AD',
  akreditasi:   'Contoh: Paripurna 2024-2027',
  kepalaRS:     'Contoh: Letkol Ckm dr. Andi Wibowo, Sp.B',
  nipKepalaRS:  'NIP atau NRP',
  email:        'Email resmi institusi',
};

const REQUIRED_FIELDS: (keyof RsProfile)[] = ['namaInstansi', 'namaRS', 'alamat'];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Compute field-level diff between baseline and current (changed fields only). */
function computeDiff(before: RsProfile, after: RsProfile): Record<string, { before: string; after: string }> {
  const diff: Record<string, { before: string; after: string }> = {};
  for (const k of Object.keys(after) as (keyof RsProfile)[]) {
    if (before[k] !== after[k]) {
      diff[k] = { before: before[k], after: after[k] };
    }
  }
  return diff;
}

/** Defensive merge: take baseline EMPTY_PROFILE, override with whatever DB has. */
function mergeWithDefaults(raw: any): RsProfile {
  const merged: RsProfile = { ...EMPTY_PROFILE };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(EMPTY_PROFILE) as (keyof RsProfile)[]) {
      if (typeof raw[k] === 'string') {
        merged[k] = raw[k];
      }
    }
  }
  return merged;
}

// ─── Component ──────────────────────────────────────────────────────────────

const RsProfileEditor: React.FC = () => {
  const [profile, setProfile] = useState<RsProfile>(EMPTY_PROFILE);
  const [baseline, setBaseline] = useState<RsProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation state
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const f of REQUIRED_FIELDS) {
      if (!profile[f].trim()) errs[f] = 'Wajib diisi';
    }
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errs.email = 'Format email tidak valid';
    }
    return errs;
  }, [profile]);

  const diff = useMemo(() => computeDiff(baseline, profile), [baseline, profile]);
  const hasChanges = Object.keys(diff).length > 0;
  const canSave = hasChanges && Object.keys(validationErrors).length === 0 && !saving;

  // ─── Load profile dari Supabase on mount ──────────────────────────────────

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'rs_profile')
        .single();
      if (e) throw e;
      const merged = mergeWithDefaults(data?.value);
      setProfile(merged);
      setBaseline(merged);
    } catch (err: any) {
      setError('Gagal memuat profil RS: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // ─── Save handler ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Upsert ke system_settings KV table
      const { error: upsertErr } = await supabase
        .from('system_settings')
        .upsert({ key: 'rs_profile', value: profile });
      if (upsertErr) throw upsertErr;

      // 2. Audit emit (D-S3.6-2: direct inline, field-level diff snapshot)
      const changedFieldLabels = Object.keys(diff)
        .map(k => FIELD_LABELS[k as keyof RsProfile])
        .filter(Boolean);
      const auditEntry: AuditEntryInput = {
        entity: 'rsProfile',
        action: 'config_update',
        entityId: '-',
        description: `Ubah Profil RS: ${changedFieldLabels.join(', ')}`,
        snapshot: diff,
      };
      try { await logAuditEntries([auditEntry]); } catch { /* best-effort */ }

      // 3. Update baseline supaya hasChanges = false setelah save
      setBaseline(profile);
      setSuccessMsg(`Profil RS tersimpan (${changedFieldLabels.length} field diubah).`);
      // Auto-hide success setelah 4 detik
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError('Gagal menyimpan: ' + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset (revert ke baseline) ──────────────────────────────────────────

  const handleReset = () => {
    setProfile(baseline);
    setError(null);
    setSuccessMsg(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">Memuat profil RS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg flex items-center gap-3">
        <Building2 size={24} className="text-amber-300 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">Editor Profil RS</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            11 field metadata institusional. Dipakai di Laporan Kemenkeu (S3.5), kuitansi (S3.4), header report.
          </p>
        </div>
        <button
          onClick={fetchProfile}
          className="p-2 hover:bg-white/10 rounded-lg transition"
          title="Reload dari server"
          disabled={loading || saving}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status banners */}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-sm rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form — 2-column grid pada desktop */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(EMPTY_PROFILE) as (keyof RsProfile)[]).map((field) => {
          const isRequired = REQUIRED_FIELDS.includes(field);
          const isWideField = field === 'alamat'; // alamat ambil 2-col
          const fieldErr = validationErrors[field];
          const isChanged = baseline[field] !== profile[field];
          return (
            <div key={field} className={isWideField ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {FIELD_LABELS[field]}
                {isRequired && <span className="text-rose-600 ml-1">*</span>}
                {isChanged && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Diubah
                  </span>
                )}
              </label>
              {field === 'alamat' ? (
                <textarea
                  value={profile[field]}
                  onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                  placeholder={FIELD_HINTS[field] ?? ''}
                  rows={2}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y ${
                    fieldErr ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
              ) : (
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  value={profile[field]}
                  onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
                  placeholder={FIELD_HINTS[field] ?? ''}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none ${
                    fieldErr ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
              )}
              {fieldErr && <p className="text-xs text-rose-600 mt-1">{fieldErr}</p>}
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          {hasChanges ? (
            <span>
              <strong className="text-blue-700">{Object.keys(diff).length} field</strong> diubah · siap simpan
            </span>
          ) : (
            <span>Tidak ada perubahan</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg transition"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition shadow"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RsProfileEditor;
