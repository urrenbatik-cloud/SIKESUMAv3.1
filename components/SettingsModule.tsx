// ============================================================================
// SIKESUMA v3.1 · S3.2.3 · SettingsModule
// ============================================================================
// Pengaturan — full-page overlay dengan tab navigation.
//
// Decision §S3.2-D1 Opsi A: minimal shell. AuditLogViewer wired,
// other tabs (Profil RS, BPJS Config, PNBP Config) jadi placeholder
// "Coming Soon" yang akan di-wire di S3.5+ / S3.6.
//
// Entry point: gear icon di App.tsx header. Mounted as fixed-position
// overlay (z-100) — sticky di atas main app content.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  X, ClipboardList, Building2, Calculator, Coins, Construction,
} from 'lucide-react';
import AuditLogViewer from './AuditLogViewer';

interface SettingsModuleProps {
  onClose: () => void;
}

type SettingsTab = 'audit' | 'profil_rs' | 'bpjs_config' | 'pnbp_config';

interface TabSpec {
  id:     SettingsTab;
  label:  string;
  icon:   React.ReactNode;
  status: 'live' | 'soon';
  /** Future-wire reference — sub-sequence yang akan implement */
  futureRef?: string;
}

const TABS: TabSpec[] = [
  { id: 'audit',       label: 'Riwayat Aktivitas', icon: <ClipboardList size={18} />, status: 'live' },
  { id: 'profil_rs',   label: 'Profil RS',          icon: <Building2 size={18} />,    status: 'soon', futureRef: 'S3.6' },
  { id: 'bpjs_config', label: 'Konfig BPJS',        icon: <Calculator size={18} />,   status: 'soon', futureRef: 'Phase 4+' },
  { id: 'pnbp_config', label: 'Konfig PNBP',        icon: <Coins size={18} />,        status: 'soon', futureRef: 'S3.5' },
];

// ─── Component ──────────────────────────────────────────────────────────────

const SettingsModule: React.FC<SettingsModuleProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audit');

  // Esc key → close (a11y nicety)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl my-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pengaturan</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Audit trail, konfigurasi sistem, profil RS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition"
            title="Tutup (Esc)"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex flex-wrap gap-1 p-3 border-b border-slate-200 bg-slate-50">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.status === 'soon';
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition',
                  isActive
                    ? 'bg-slate-900 text-white shadow'
                    : isDisabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-200',
                ].join(' ')}
                title={isDisabled ? `Akan dibangun di ${tab.futureRef}` : tab.label}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.status === 'soon' && (
                  <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'audit' && <AuditLogViewer />}
          {activeTab === 'profil_rs'   && <ComingSoonStub feature="Editor Profil RS"   subRef="S3.6" />}
          {activeTab === 'bpjs_config' && <ComingSoonStub feature="Editor Konfig BPJS" subRef="Phase 4+" />}
          {activeTab === 'pnbp_config' && <ComingSoonStub feature="Editor Konfig PNBP" subRef="S3.5" />}
        </div>
      </div>
    </div>
  );
};

// ─── ComingSoonStub Helper ──────────────────────────────────────────────────

const ComingSoonStub: React.FC<{ feature: string; subRef: string }> = ({ feature, subRef }) => (
  <div className="text-center py-16">
    <div className="inline-flex bg-amber-100 p-4 rounded-full mb-4">
      <Construction size={32} className="text-amber-700" />
    </div>
    <p className="text-lg font-bold text-slate-900 mb-2">{feature}</p>
    <p className="text-sm text-slate-600 mb-1">Akan dibangun di sub-sequence <strong>{subRef}</strong>.</p>
    <p className="text-xs text-slate-500">
      Sementara ini, edit melalui modul utama atau langsung di Supabase.
    </p>
  </div>
);

export default SettingsModule;
