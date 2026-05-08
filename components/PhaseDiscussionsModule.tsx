// ============================================================================
// SIKESUMA v3.1 · Komunikasi & Diskusi — Main Feature Component
// ============================================================================
// File          : components/PhaseDiscussionsModule.tsx
// Phase         : Komunikasi feature — Phase 3 of 7
// Date          : 2026-05-08
// Source        : Per spec 02_TECHNICAL_DESIGN.md §2.2 component architecture
//
// Single-file MVP — all sub-components inline. Split ke multi-file di Phase 3
// hardening kalau perlu. Default export = PhaseDiscussionsModule yang di-mount
// di SettingsModule.tsx tab "Komunikasi & Diskusi".
//
// Layout overview (in render order):
//   1. CaveatBanner (top, dismissible per session)
//   2. IdentityHeader (current role+name + "Ganti Identitas" button)
//   3. View router:
//      - view='list'   → DiscussionList + "+ Diskusi Baru" button
//      - view='thread' → DiscussionThread (header + messages + composer)
//   4. Modals overlay: IdentitySelector, NewDiscussionModal
//
// Audit emission (D4 selective) via direct logAuditEntries() inline call:
//   - Discussion create  → entity 'phaseDiscussion', action 'create'
//   - Status change      → entity 'phaseDiscussion', action 'update'
//   - File upload        → entity 'phaseMessage', action 'update'
//   - Routine text msgs  → NOT audited (privacy + storage hygiene)
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle, MessageSquarePlus, ArrowLeft, Send, Paperclip, X,
  UserCircle, Edit2, Trash2, Download, Image as ImageIcon, FileText,
  CheckCircle2, Archive, RotateCcw, Reply, RefreshCw, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logAuditEntries, type AuditEntryInput } from '../lib/audit';
import { ROADMAP } from '../constants/devLog';
import {
  type RoleId, type UserIdentity, type Discussion, type DiscussionData,
  type Message, type MessageData, type Attachment, type DiscussionStatus,
  ROLE_REGISTRY, ROLE_ORDER,
  STORAGE_KEY_IDENTITY, STORAGE_KEY_READ_STATE, STORAGE_KEY_CAVEAT_DISMISSED,
  MAX_FILE_SIZE_BYTES, MAX_ATTACHMENTS_PER_MESSAGE, EDIT_WINDOW_MS,
  MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_MESSAGE_LENGTH,
  ALLOWED_MIME_TYPES,
  getRoleSpec, getRoleLabel, getRoleColor, getRoleIcon,
  formatFileSize, isImageMime, isWithinEditWindow, canEditMessage,
  validateAttachmentFile, sanitizeFilename, generateKomunikasiId,
  truncatePreview, addParticipant,
} from '../constants/komunikasi';

// ─── Tailwind Static Class Tables (JIT-friendly) ────────────────────────────
// Tailwind purge cannot detect dynamic class names like `bg-${color}-100`.
// Pakai static lookup tables sehingga class names eksplisit di source.

const ROLE_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', ring: 'ring-emerald-500' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    ring: 'ring-blue-500'    },
  violet:  { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300',  ring: 'ring-violet-500'  },
  amber:   { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   ring: 'ring-amber-500'   },
  rose:    { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300',    ring: 'ring-rose-500'    },
  pink:    { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-300',    ring: 'ring-pink-500'    },
  teal:    { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-300',    ring: 'ring-teal-500'    },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-300',   ring: 'ring-slate-400'   },
};

const STATUS_BADGE_CLASSES: Record<DiscussionStatus, string> = {
  open:     'bg-emerald-100 text-emerald-800 border border-emerald-300',
  closed:   'bg-slate-100 text-slate-700 border border-slate-300',
  archived: 'bg-stone-100 text-stone-600 border border-stone-300',
};

const STATUS_LABEL: Record<DiscussionStatus, string> = {
  open:     'Aktif',
  closed:   'Ditutup',
  archived: 'Diarsipkan',
};

function getRoleClasses(roleId: string) {
  return ROLE_COLOR_CLASSES[getRoleColor(roleId)] || ROLE_COLOR_CLASSES.slate;
}

// ─── Time Formatting ────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);
  if (diffMin < 1) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Avatar (role icon + color) ─────────────────────────────────────────────

const Avatar: React.FC<{ roleId: string; size?: 'sm' | 'md' | 'lg' }> = ({ roleId, size = 'md' }) => {
  const c = getRoleClasses(roleId);
  const dim = size === 'sm' ? 'w-7 h-7 text-sm' : size === 'lg' ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-base';
  return (
    <div className={`${dim} ${c.bg} ${c.text} ${c.border} border-2 rounded-full flex items-center justify-center flex-shrink-0`}>
      <span>{getRoleIcon(roleId)}</span>
    </div>
  );
};

// ─── CaveatBanner ───────────────────────────────────────────────────────────

const CaveatBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 mb-4">
    <AlertTriangle size={20} className="text-amber-700 flex-shrink-0 mt-0.5" />
    <div className="flex-1 text-sm text-amber-900">
      <strong>Identitas tidak diverifikasi</strong> (trust-based). Untuk pesan formal/official,
      pastikan identity yang dipilih akurat. Real auth = roadmap Phase 3 (TD-13).
    </div>
    <button
      onClick={onDismiss}
      className="text-amber-700 hover:text-amber-900 p-1 rounded transition flex-shrink-0"
      title="Sembunyikan untuk sesi ini"
    >
      <X size={16} />
    </button>
  </div>
);

// ─── IdentitySelector Modal ─────────────────────────────────────────────────

const IdentitySelector: React.FC<{
  initialRole?: RoleId;
  initialName?: string;
  onSave: (id: UserIdentity) => void;
  onCancel?: () => void;
  required?: boolean; // first-load: cannot cancel
}> = ({ initialRole, initialName, onSave, onCancel, required }) => {
  const [role, setRole] = useState<RoleId>(initialRole ?? 'successor');
  const [name, setName] = useState<string>(initialName ?? '');
  const [customName, setCustomName] = useState<string>(initialName && !initialRole ? initialName : '');

  const spec = ROLE_REGISTRY[role];
  const usingSuggested = spec.suggestedNames.includes(name);

  useEffect(() => {
    // When role changes: if current name not valid for new role, reset to first suggestion or empty
    const newSpec = ROLE_REGISTRY[role];
    if (!newSpec.suggestedNames.includes(name)) {
      setName(newSpec.suggestedNames[0] ?? '');
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalName = name === '__custom__' ? customName.trim() : name;
  const canSave = finalName.length > 0 && finalName.length <= 80;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <UserCircle size={24} className="text-slate-700" />
            <div>
              <h3 className="font-bold text-slate-900">Pilih Identitas</h3>
              <p className="text-xs text-slate-500">Untuk attribution di diskusi (trust-based)</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Peran (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleId)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {ROLE_ORDER.map((rid) => {
                const s = ROLE_REGISTRY[rid];
                return <option key={rid} value={rid}>{s.icon} {s.label}</option>;
              })}
            </select>
            <p className="text-xs text-slate-500 mt-1">{spec.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama</label>
            {spec.suggestedNames.length > 0 ? (
              <select
                value={usingSuggested || name === '__custom__' ? name : '__custom__'}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (v !== '__custom__') setCustomName('');
                }}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none mb-2"
              >
                {spec.suggestedNames.map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="__custom__">— Lainnya (ketik manual) —</option>
              </select>
            ) : null}
            {(name === '__custom__' || spec.suggestedNames.length === 0) && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={spec.defaultPlaceholder ? 'Contoh: dr. Andi Wibowo' : 'Ketik nama lengkap'}
                maxLength={80}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          {!required && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >Batal</button>
          )}
          <button
            onClick={() => canSave && onSave({ role, name: finalName })}
            disabled={!canSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
          >Simpan Identitas</button>
        </div>
      </div>
    </div>
  );
};

// ─── PhaseRefDropdown ───────────────────────────────────────────────────────

const PhaseRefDropdown: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const options = useMemo(() => [
    { value: '', label: '— Tanpa phase ref —' },
    { value: 'general', label: 'General Discussion' },
    ...ROADMAP.map((item) => ({ value: item.id, label: `${item.id}: ${item.goal}` })),
  ], []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
    >
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
};

// ─── NewDiscussionModal ─────────────────────────────────────────────────────

const NewDiscussionModal: React.FC<{
  identity: UserIdentity;
  onCreate: (title: string, description: string, phaseRef: string) => Promise<void>;
  onCancel: () => void;
}> = ({ identity, onCreate, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phaseRef, setPhaseRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = title.trim().length > 0 && title.length <= MAX_TITLE_LENGTH && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate(title.trim(), description.trim(), phaseRef);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Diskusi Baru</h3>
            <p className="text-xs text-slate-500">Sebagai {identity.name} · {ROLE_REGISTRY[identity.role].label}</p>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded transition" title="Batal">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Judul <span className="text-rose-600">*</span> <span className="text-slate-400 font-normal">({title.length}/{MAX_TITLE_LENGTH})</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              placeholder="Contoh: Klarifikasi format Laporan Kemenkeu untuk S3.5"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi <span className="text-slate-400 font-normal">({description.length}/{MAX_DESCRIPTION_LENGTH})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              placeholder="Konteks awal diskusi (opsional)"
              rows={4}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phase / Roadmap Reference (opsional)</label>
            <PhaseRefDropdown value={phaseRef} onChange={setPhaseRef} />
          </div>
        </div>
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquarePlus size={16} />}
            Buat Diskusi
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── DiscussionCard (item in list) ──────────────────────────────────────────

const DiscussionCard: React.FC<{
  discussion: Discussion;
  hasUnread: boolean;
  onClick: () => void;
}> = ({ discussion: d, hasUnread, onClick }) => {
  const creatorClasses = getRoleClasses(d.created_by_role);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md rounded-xl p-4 transition group"
    >
      <div className="flex items-start gap-3">
        <Avatar roleId={d.created_by_role} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">{d.title}</h4>
            {hasUnread && <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" title="Pesan baru" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
            <span className={`px-2 py-0.5 rounded font-semibold ${STATUS_BADGE_CLASSES[d.status]}`}>{STATUS_LABEL[d.status]}</span>
            {d.phase_ref && (
              <span className="px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-700 border border-slate-300">{d.phase_ref}</span>
            )}
            <span className={`px-2 py-0.5 rounded font-semibold ${creatorClasses.bg} ${creatorClasses.text}`}>
              {ROLE_REGISTRY[d.created_by_role].label}
            </span>
            <span className="text-slate-500">· {formatRelativeTime(d.last_activity || d.updated_at)}</span>
          </div>
          {d.last_message_preview && (
            <p className="text-sm text-slate-600 line-clamp-2">{d.last_message_preview}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{d.message_count} pesan</span>
            {d.participants.length > 0 && (
              <span className="flex items-center gap-1">
                {d.participants.slice(0, 5).map((rid) => (
                  <span key={rid} title={ROLE_REGISTRY[rid].label}>{getRoleIcon(rid)}</span>
                ))}
                {d.participants.length > 5 && <span>+{d.participants.length - 5}</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ─── AttachmentItem (used in MessageBubble + Composer preview) ──────────────

const AttachmentItem: React.FC<{
  attachment: Attachment;
  mode: 'preview' | 'message';
  onRemove?: () => void;
  onDownload?: (att: Attachment) => Promise<void>;
}> = ({ attachment: a, mode, onRemove, onDownload }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  // Auto-fetch signed URL untuk image preview di message mode
  useEffect(() => {
    if (mode === 'message' && isImageMime(a.mime_type) && !imgUrl && !imgLoading) {
      setImgLoading(true);
      supabase.storage.from('phase-docs').createSignedUrl(a.storage_path, 3600).then(({ data, error }) => {
        if (!error && data) setImgUrl(data.signedUrl);
      }).catch(() => { /* swallow */ }).finally(() => setImgLoading(false));
    }
  }, [mode, a.storage_path, a.mime_type, imgUrl, imgLoading]);

  const isImg = isImageMime(a.mime_type);

  if (mode === 'message' && isImg && imgUrl) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
        <a href={imgUrl} target="_blank" rel="noopener noreferrer">
          <img src={imgUrl} alt={a.name} className="max-w-xs max-h-64 object-contain" />
        </a>
        <div className="px-2 py-1 text-xs text-slate-600 flex justify-between items-center bg-white border-t border-slate-200">
          <span className="truncate" title={a.name}>{a.name}</span>
          <span className="flex-shrink-0 ml-2 text-slate-400">{formatFileSize(a.size)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
      {isImg ? <ImageIcon size={16} className="text-slate-500 flex-shrink-0" /> : <FileText size={16} className="text-slate-500 flex-shrink-0" />}
      <span className="truncate flex-1" title={a.name}>{a.name}</span>
      <span className="text-xs text-slate-500 flex-shrink-0">{formatFileSize(a.size)}</span>
      {mode === 'preview' && onRemove && (
        <button onClick={onRemove} className="text-rose-600 hover:text-rose-800 p-1 rounded transition flex-shrink-0" title="Hapus">
          <X size={14} />
        </button>
      )}
      {mode === 'message' && onDownload && (
        <button onClick={() => onDownload(a)} className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition flex-shrink-0" title="Download">
          <Download size={14} />
        </button>
      )}
    </div>
  );
};

// ─── MessageBubble ──────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
  message: Message;
  identity: UserIdentity;
  onEdit: (id: string, newContent: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply: (msg: Message) => void;
  parentMessage?: Message; // for "Re:" indicator
}> = ({ message: m, identity, onEdit, onDelete, onReply, parentMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(m.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const isOwn = m.author_role === identity.role && m.author_name === identity.name;
  const editable = canEditMessage(m, identity);
  const classes = getRoleClasses(m.author_role);

  const handleDownload = async (a: Attachment) => {
    const { data, error } = await supabase.storage.from('phase-docs').createSignedUrl(a.storage_path, 3600);
    if (error || !data) {
      alert('Gagal generate signed URL: ' + (error?.message || 'unknown'));
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleSaveEdit = async () => {
    if (editText.trim() === m.content) { setIsEditing(false); return; }
    if (editText.length > MAX_MESSAGE_LENGTH) return;
    setBusy(true);
    try {
      await onEdit(m.id, editText.trim());
      setIsEditing(false);
    } finally { setBusy(false); }
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete(m.id);
    } finally { setBusy(false); setConfirmDelete(false); }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar roleId={m.author_role} size="md" />
      <div className={`flex-1 min-w-0 max-w-[85%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 text-xs mb-1">
          <span className="font-bold text-slate-900">{m.author_name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${classes.bg} ${classes.text}`}>
            {ROLE_REGISTRY[m.author_role].label}
          </span>
          <span className="text-slate-500" title={new Date(m.created_at).toLocaleString('id-ID')}>
            {formatRelativeTime(m.created_at)}
          </span>
          {m.edited && <span className="text-slate-400 italic">(diedit)</span>}
        </div>

        {parentMessage && (
          <div className="bg-slate-100 border-l-4 border-slate-300 rounded text-xs p-2 mb-1 text-slate-600 max-w-full">
            <div className="font-semibold text-[10px] uppercase tracking-wide text-slate-500">Re: {parentMessage.author_name}</div>
            <div className="line-clamp-2">{parentMessage.content || '(tanpa teks)'}</div>
          </div>
        )}

        <div className={`rounded-2xl p-3 ${isOwn ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-200'} max-w-full`}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                rows={3}
                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              />
              <div className="flex justify-end gap-1">
                <button onClick={() => { setIsEditing(false); setEditText(m.content); }} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded">Batal</button>
                <button onClick={handleSaveEdit} disabled={busy} className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded font-semibold">
                  {busy ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">{m.content || <em className="text-slate-400">(tanpa teks)</em>}</div>
          )}

          {!isEditing && m.attachments && m.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {m.attachments.map((a) => (
                <AttachmentItem key={a.id} attachment={a} mode="message" onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            <button onClick={() => onReply(m)} className="text-slate-500 hover:text-emerald-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition flex items-center gap-1" title="Balas">
              <Reply size={12} /> Balas
            </button>
            {editable && (
              <>
                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition flex items-center gap-1" title={`Edit (window ${Math.floor(EDIT_WINDOW_MS/60000)} menit)`}>
                  <Edit2 size={12} /> Edit
                </button>
                {confirmDelete ? (
                  <>
                    <span className="text-rose-700 font-semibold ml-1">Yakin hapus?</span>
                    <button onClick={handleConfirmDelete} disabled={busy} className="text-rose-700 hover:bg-rose-100 px-1.5 py-0.5 rounded font-bold">Ya</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-slate-600 hover:bg-slate-100 px-1.5 py-0.5 rounded">Batal</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="text-slate-500 hover:text-rose-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition flex items-center gap-1" title="Hapus">
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MessageComposer ────────────────────────────────────────────────────────

interface ComposerDraft {
  content: string;
  attachments: Attachment[];
  replyTo: Message | null;
}

const MessageComposer: React.FC<{
  identity: UserIdentity;
  discussionId: string;
  onSend: (content: string, attachments: Attachment[], replyTo: string | null) => Promise<void>;
  replyToMessage: Message | null;
  onCancelReply: () => void;
}> = ({ identity, discussionId, onSend, replyToMessage, onCancelReply }) => {
  const [draft, setDraft] = useState<ComposerDraft>({ content: '', attachments: [], replyTo: null });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync replyTo prop into draft
  useEffect(() => {
    setDraft((d) => ({ ...d, replyTo: replyToMessage }));
  }, [replyToMessage]);

  const canSend = (draft.content.trim().length > 0 || draft.attachments.length > 0)
    && !sending && !uploading
    && draft.content.length <= MAX_MESSAGE_LENGTH;

  const handleFilePick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const fileArr = Array.from(files);

    // Cap total attachments
    if (draft.attachments.length + fileArr.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setUploadError(`Maks ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per pesan.`);
      return;
    }

    // Validate all files first
    for (const f of fileArr) {
      const err = validateAttachmentFile(f);
      if (err) { setUploadError(err); return; }
    }

    setUploading(true);
    const newAttachments: Attachment[] = [];
    // Generate placeholder message id untuk path partition (akan jadi aktual saat send)
    const tempMsgId = generateKomunikasiId('msg');
    try {
      for (const f of fileArr) {
        const safeName = sanitizeFilename(f.name);
        const path = `${discussionId}/${tempMsgId}/${Date.now()}_${safeName}`;
        const { data, error } = await supabase.storage
          .from('phase-docs')
          .upload(path, f, { cacheControl: '3600', upsert: false });
        if (error || !data) throw new Error(error?.message || 'Upload failed');
        newAttachments.push({
          id: generateKomunikasiId('att'),
          name: f.name,
          size: f.size,
          mime_type: f.type,
          storage_path: data.path,
          uploaded_at: new Date().toISOString(),
        });
      }
      setDraft((d) => ({ ...d, attachments: [...d.attachments, ...newAttachments] }));
    } catch (err: any) {
      setUploadError('Upload gagal: ' + (err?.message || String(err)));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = async (idx: number) => {
    const a = draft.attachments[idx];
    // Best-effort cleanup di storage
    try { await supabase.storage.from('phase-docs').remove([a.storage_path]); } catch { /* swallow */ }
    setDraft((d) => ({ ...d, attachments: d.attachments.filter((_, i) => i !== idx) }));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(draft.content.trim(), draft.attachments, draft.replyTo?.id ?? null);
      setDraft({ content: '', attachments: [], replyTo: null });
      if (replyToMessage) onCancelReply();
    } catch (err: any) {
      setUploadError('Gagal kirim: ' + (err?.message || String(err)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 space-y-2">
      {draft.replyTo && (
        <div className="bg-slate-100 border-l-4 border-emerald-500 rounded p-2 flex items-start justify-between gap-2 text-xs">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-700">Membalas {draft.replyTo.author_name}</div>
            <div className="text-slate-500 line-clamp-1">{draft.replyTo.content || '(tanpa teks)'}</div>
          </div>
          <button onClick={onCancelReply} className="text-slate-500 hover:text-rose-600 p-1 rounded" title="Batal balasan">
            <X size={14} />
          </button>
        </div>
      )}

      {draft.attachments.length > 0 && (
        <div className="space-y-1">
          {draft.attachments.map((a, idx) => (
            <AttachmentItem key={a.id} attachment={a} mode="preview" onRemove={() => removeAttachment(idx)} />
          ))}
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded p-2">{uploadError}</div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={draft.content}
          onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value.slice(0, MAX_MESSAGE_LENGTH) }))}
          placeholder={`Ketik pesan sebagai ${identity.name}…`}
          rows={2}
          className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y min-h-[60px]"
        />
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || draft.attachments.length >= MAX_ATTACHMENTS_PER_MESSAGE}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg transition"
            title={`Lampirkan file (maks ${MAX_ATTACHMENTS_PER_MESSAGE} × ${formatFileSize(MAX_FILE_SIZE_BYTES)})`}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition"
            title="Kirim"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={(e) => handleFilePick(e.target.files)}
          className="hidden"
        />
      </div>
      <div className="text-xs text-slate-400 flex justify-between items-center">
        <span>{draft.content.length}/{MAX_MESSAGE_LENGTH} karakter</span>
        <span>{draft.attachments.length}/{MAX_ATTACHMENTS_PER_MESSAGE} lampiran</span>
      </div>
    </div>
  );
};

// ─── DiscussionThread ───────────────────────────────────────────────────────

const DiscussionThread: React.FC<{
  discussion: Discussion;
  messages: Message[];
  identity: UserIdentity;
  onBack: () => void;
  onStatusChange: (newStatus: DiscussionStatus) => Promise<void>;
  onSendMessage: (content: string, attachments: Attachment[], replyTo: string | null) => Promise<void>;
  onEditMessage: (msgId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onRefresh: () => void;
}> = ({ discussion: d, messages, identity, onBack, onStatusChange, onSendMessage, onEditMessage, onDeleteMessage, onRefresh }) => {
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesById = useMemo(() => {
    const m: Record<string, Message> = {};
    for (const msg of messages) m[msg.id] = msg;
    return m;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 bg-white p-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition flex-shrink-0" title="Kembali ke daftar">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-slate-900 text-lg">{d.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE_CLASSES[d.status]}`}>{STATUS_LABEL[d.status]}</span>
              {d.phase_ref && (
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-300">{d.phase_ref}</span>
              )}
            </div>
            {d.description && <p className="text-sm text-slate-600 mb-2">{d.description}</p>}
            <div className="text-xs text-slate-500">
              Dibuat oleh <strong>{d.created_by_name}</strong> · {ROLE_REGISTRY[d.created_by_role].label} · {formatRelativeTime(d.created_at)}
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
              title="Refresh pesan"
            >
              <RefreshCw size={16} />
            </button>
            {d.status === 'open' && (
              <button
                onClick={() => onStatusChange('closed')}
                className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1"
                title="Tutup diskusi"
              >
                <CheckCircle2 size={12} /> Tutup
              </button>
            )}
            {d.status === 'closed' && (
              <button
                onClick={() => onStatusChange('open')}
                className="px-3 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition flex items-center gap-1"
                title="Buka kembali"
              >
                <RotateCcw size={12} /> Buka
              </button>
            )}
            {d.status !== 'archived' && (
              <button
                onClick={() => { if (confirm('Arsipkan diskusi ini? Bisa dibuka kembali oleh admin.')) onStatusChange('archived'); }}
                className="px-3 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition flex items-center gap-1"
                title="Arsipkan"
              >
                <Archive size={12} /> Arsipkan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 min-h-[300px] max-h-[50vh]">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Belum ada pesan. Mulai percakapan di bawah.
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              identity={identity}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onReply={(msg) => setReplyTarget(msg)}
              parentMessage={m.reply_to ? messagesById[m.reply_to] : undefined}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {d.status === 'archived' ? (
        <div className="border-t border-slate-200 bg-stone-50 p-4 text-center text-sm text-stone-600">
          Diskusi diarsipkan. Tidak dapat menambah pesan baru.
        </div>
      ) : d.status === 'closed' ? (
        <div className="border-t border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Diskusi ditutup. Buka kembali untuk lanjut chat.
        </div>
      ) : (
        <MessageComposer
          identity={identity}
          discussionId={d.id}
          onSend={onSendMessage}
          replyToMessage={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
        />
      )}
    </div>
  );
};

// ─── Main: PhaseDiscussionsModule ───────────────────────────────────────────

type StatusFilter = 'all' | DiscussionStatus;

const PhaseDiscussionsModule: React.FC = () => {
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [showIdentitySelector, setShowIdentitySelector] = useState(false);
  const [identitySelectorRequired, setIdentitySelectorRequired] = useState(false);
  const [caveatDismissed, setCaveatDismissed] = useState(false);
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messagesByDisc, setMessagesByDisc] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [readState, setReadState] = useState<string>('1970-01-01T00:00:00.000Z'); // global_last_read

  const activeDiscussion = useMemo(
    () => discussions.find((d) => d.id === activeDiscussionId) || null,
    [discussions, activeDiscussionId],
  );
  const activeMessages = activeDiscussionId ? (messagesByDisc[activeDiscussionId] ?? []) : [];

  // ─── Bootstrap: load identity, caveat state, read state from localStorage ─

  useEffect(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEY_IDENTITY);
      if (storedId) {
        const parsed = JSON.parse(storedId);
        if (parsed && parsed.role && parsed.name) {
          setIdentity(parsed as UserIdentity);
        } else {
          setIdentitySelectorRequired(true);
          setShowIdentitySelector(true);
        }
      } else {
        setIdentitySelectorRequired(true);
        setShowIdentitySelector(true);
      }
    } catch {
      setIdentitySelectorRequired(true);
      setShowIdentitySelector(true);
    }

    // CaveatBanner state — re-show per session (not persisted to localStorage)
    try {
      const sessionDismiss = sessionStorage.getItem(STORAGE_KEY_CAVEAT_DISMISSED);
      setCaveatDismissed(sessionDismiss === 'true');
    } catch { /* swallow */ }

    // Read state
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ_STATE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.global_last_read) setReadState(parsed.global_last_read);
      }
    } catch { /* swallow */ }
  }, []);

  // ─── Fetch discussions (depends on identity ready) ──────────────────────────

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('phase_discussions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (e) throw e;
      const unwrapped: Discussion[] = (data ?? []).map((r: any) => ({
        ...(r?.data ?? {}),
        id: r.id,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
      setDiscussions(unwrapped);
    } catch (err: any) {
      setError('Gagal memuat diskusi: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (discussionId: string) => {
    try {
      const { data, error: e } = await supabase
        .from('phase_messages')
        .select('*')
        .eq('data->>discussion_id', discussionId)
        .order('created_at', { ascending: true });
      if (e) throw e;
      const unwrapped: Message[] = (data ?? []).map((r: any) => ({
        ...(r?.data ?? {}),
        id: r.id,
        created_at: r.created_at,
        attachments: r?.data?.attachments ?? [],
      }));
      setMessagesByDisc((prev) => ({ ...prev, [discussionId]: unwrapped }));
    } catch (err: any) {
      setError('Gagal memuat pesan: ' + (err?.message || String(err)));
    }
  }, []);

  useEffect(() => {
    if (identity) fetchDiscussions();
  }, [identity, fetchDiscussions]);

  useEffect(() => {
    if (view === 'thread' && activeDiscussionId) fetchMessages(activeDiscussionId);
  }, [view, activeDiscussionId, fetchMessages]);

  // ─── Identity persistence ──────────────────────────────────────────────────

  const saveIdentity = (id: UserIdentity) => {
    setIdentity(id);
    setShowIdentitySelector(false);
    setIdentitySelectorRequired(false);
    try {
      localStorage.setItem(STORAGE_KEY_IDENTITY, JSON.stringify(id));
    } catch { /* swallow */ }
  };

  const dismissCaveat = () => {
    setCaveatDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY_CAVEAT_DISMISSED, 'true'); } catch { /* swallow */ }
  };

  const updateReadState = useCallback(() => {
    const now = new Date().toISOString();
    setReadState(now);
    try {
      localStorage.setItem(STORAGE_KEY_READ_STATE, JSON.stringify({ global_last_read: now }));
    } catch { /* swallow */ }
  }, []);

  // ─── Audit emission helpers (D4 selective) ─────────────────────────────────

  const emitDiscussionCreate = async (d: Discussion) => {
    const entry: AuditEntryInput = {
      entity: 'phaseDiscussion',
      action: 'create',
      entityId: d.id,
      description: `Diskusi baru: ${d.title}`,
      snapshot: {
        title: d.title,
        status: d.status,
        phase_ref: d.phase_ref,
        created_by_role: d.created_by_role,
        created_by_name: d.created_by_name,
      },
    };
    try { await logAuditEntries([entry]); } catch { /* best-effort */ }
  };

  const emitDiscussionStatusChange = async (d: Discussion, prevStatus: DiscussionStatus, nextStatus: DiscussionStatus) => {
    const verb = nextStatus === 'closed' ? 'ditutup' : nextStatus === 'archived' ? 'diarsipkan' : 'dibuka kembali';
    const entry: AuditEntryInput = {
      entity: 'phaseDiscussion',
      action: 'update',
      entityId: d.id,
      description: `Diskusi ${verb}: ${d.title}`,
      snapshot: { status: { before: prevStatus, after: nextStatus } },
    };
    try { await logAuditEntries([entry]); } catch { /* best-effort */ }
  };

  const emitFileUpload = async (msg: Message) => {
    if (!msg.attachments || msg.attachments.length === 0) return;
    const filenames = msg.attachments.map((a) => a.name).join(', ');
    const entry: AuditEntryInput = {
      entity: 'phaseMessage',
      action: 'update',
      entityId: msg.id,
      description: `File diunggah (${msg.attachments.length}): ${truncatePreview(filenames, 80)}`,
      snapshot: {
        discussion_id: msg.discussion_id,
        author: { role: msg.author_role, name: msg.author_name },
        attachments: msg.attachments.map((a) => ({ name: a.name, size: a.size, mime_type: a.mime_type })),
      },
    };
    try { await logAuditEntries([entry]); } catch { /* best-effort */ }
  };

  // ─── Discussion CRUD ────────────────────────────────────────────────────────

  const createDiscussion = async (title: string, description: string, phaseRef: string) => {
    if (!identity) return;
    const id = generateKomunikasiId('disc');
    const data: DiscussionData = {
      title,
      description,
      phase_ref: phaseRef || null,
      status: 'open',
      created_by_role: identity.role,
      created_by_name: identity.name,
      participants: [identity.role],
      message_count: 0,
      last_activity: new Date().toISOString(),
      last_message_preview: '',
    };
    try {
      const { error: e } = await supabase.from('phase_discussions').insert({ id, data });
      if (e) throw e;
      const newDisc: Discussion = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDiscussions((prev) => [newDisc, ...prev]);
      setShowNewModal(false);
      setActiveDiscussionId(id);
      setView('thread');
      // Audit emit (D4 #1)
      await emitDiscussionCreate(newDisc);
    } catch (err: any) {
      setError('Gagal membuat diskusi: ' + (err?.message || String(err)));
    }
  };

  const changeDiscussionStatus = async (newStatus: DiscussionStatus) => {
    if (!identity || !activeDiscussion) return;
    const prevStatus = activeDiscussion.status;
    const updated: Discussion = { ...activeDiscussion, status: newStatus, updated_at: new Date().toISOString() };
    const { id, created_at, updated_at, ...dataFields } = updated;
    try {
      const { error: e } = await supabase.from('phase_discussions').update({ data: dataFields }).eq('id', id);
      if (e) throw e;
      setDiscussions((prev) => prev.map((d) => (d.id === id ? updated : d)));
      // Audit emit (D4 #2)
      await emitDiscussionStatusChange(updated, prevStatus, newStatus);
    } catch (err: any) {
      setError('Gagal ubah status: ' + (err?.message || String(err)));
    }
  };

  // ─── Message CRUD ───────────────────────────────────────────────────────────

  const sendMessage = async (content: string, attachments: Attachment[], replyTo: string | null) => {
    if (!identity || !activeDiscussion) return;
    const msgId = generateKomunikasiId('msg');
    const msgData: MessageData = {
      discussion_id: activeDiscussion.id,
      author_role: identity.role,
      author_name: identity.name,
      content,
      edited: false,
      edited_at: null,
      reply_to: replyTo,
      attachments,
    };
    try {
      const { error: e } = await supabase.from('phase_messages').insert({ id: msgId, data: msgData });
      if (e) throw e;
      const newMsg: Message = { ...msgData, id: msgId, created_at: new Date().toISOString() };

      setMessagesByDisc((prev) => ({
        ...prev,
        [activeDiscussion.id]: [...(prev[activeDiscussion.id] ?? []), newMsg],
      }));

      // Update discussion meta (last_activity, message_count, participants, preview)
      const updatedDisc: Discussion = {
        ...activeDiscussion,
        message_count: activeDiscussion.message_count + 1,
        last_activity: newMsg.created_at,
        last_message_preview: truncatePreview(content || (attachments.length > 0 ? `📎 ${attachments.length} lampiran` : ''), 150),
        participants: addParticipant(activeDiscussion.participants, identity.role),
        updated_at: new Date().toISOString(),
      };
      const { id: _id, created_at: _c, updated_at: _u, ...dataOnly } = updatedDisc;
      void _id; void _c; void _u;
      try {
        await supabase.from('phase_discussions').update({ data: dataOnly }).eq('id', activeDiscussion.id);
      } catch { /* swallow — discussion meta drift acceptable di MVP */ }
      setDiscussions((prev) => prev.map((d) => (d.id === activeDiscussion.id ? updatedDisc : d)));

      // Audit emit (D4 #3) — only if attachments (text-only NOT audited)
      if (attachments.length > 0) {
        await emitFileUpload(newMsg);
      }
    } catch (err: any) {
      setError('Gagal kirim pesan: ' + (err?.message || String(err)));
      throw err;
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    if (!identity || !activeDiscussion) return;
    const list = messagesByDisc[activeDiscussion.id] ?? [];
    const target = list.find((m) => m.id === msgId);
    if (!target) return;
    if (!isWithinEditWindow(target.created_at)) {
      setError('Tidak dapat edit: pesan sudah > 30 menit.');
      return;
    }
    const updatedMsg: Message = { ...target, content: newContent, edited: true, edited_at: new Date().toISOString() };
    const { id, created_at, ...dataOnly } = updatedMsg;
    void id; void created_at;
    try {
      const { error: e } = await supabase.from('phase_messages').update({ data: dataOnly }).eq('id', msgId);
      if (e) throw e;
      setMessagesByDisc((prev) => ({
        ...prev,
        [activeDiscussion.id]: (prev[activeDiscussion.id] ?? []).map((m) => (m.id === msgId ? updatedMsg : m)),
      }));
      // No audit per D4 selective
    } catch (err: any) {
      setError('Gagal edit pesan: ' + (err?.message || String(err)));
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!identity || !activeDiscussion) return;
    const list = messagesByDisc[activeDiscussion.id] ?? [];
    const target = list.find((m) => m.id === msgId);
    if (!target) return;
    if (!isWithinEditWindow(target.created_at)) {
      setError('Tidak dapat hapus: pesan sudah > 30 menit.');
      return;
    }
    try {
      // Cascade delete attachments dari storage
      if (target.attachments && target.attachments.length > 0) {
        const paths = target.attachments.map((a) => a.storage_path);
        try { await supabase.storage.from('phase-docs').remove(paths); } catch { /* swallow */ }
      }
      const { error: e } = await supabase.from('phase_messages').delete().eq('id', msgId);
      if (e) throw e;
      setMessagesByDisc((prev) => ({
        ...prev,
        [activeDiscussion.id]: (prev[activeDiscussion.id] ?? []).filter((m) => m.id !== msgId),
      }));
      // Update discussion message_count
      const updatedDisc: Discussion = {
        ...activeDiscussion,
        message_count: Math.max(0, activeDiscussion.message_count - 1),
        updated_at: new Date().toISOString(),
      };
      const { id: _id, created_at: _c, updated_at: _u, ...dataOnly } = updatedDisc;
      void _id; void _c; void _u;
      try {
        await supabase.from('phase_discussions').update({ data: dataOnly }).eq('id', activeDiscussion.id);
      } catch { /* swallow */ }
      setDiscussions((prev) => prev.map((d) => (d.id === activeDiscussion.id ? updatedDisc : d)));
    } catch (err: any) {
      setError('Gagal hapus pesan: ' + (err?.message || String(err)));
    }
  };

  // ─── Render gates ───────────────────────────────────────────────────────────

  if (showIdentitySelector || !identity) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <IdentitySelector
          required={identitySelectorRequired || !identity}
          initialRole={identity?.role}
          initialName={identity?.name}
          onSave={(id) => { saveIdentity(id); updateReadState(); }}
          onCancel={() => { if (identity) setShowIdentitySelector(false); }}
        />
      </div>
    );
  }

  // ─── Filter discussions by status filter ────────────────────────────────────

  const visibleDiscussions = discussions.filter((d) => statusFilter === 'all' || d.status === statusFilter);
  const lastReadMs = new Date(readState).getTime();

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {!caveatDismissed && <CaveatBanner onDismiss={dismissCaveat} />}

      {/* Identity bar */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <Avatar roleId={identity.role} size="md" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{identity.name}</div>
            <div className="text-xs text-slate-500">{ROLE_REGISTRY[identity.role].label}</div>
          </div>
        </div>
        <button
          onClick={() => setShowIdentitySelector(true)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
        >
          Ganti Identitas
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-sm rounded-lg p-3 flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 flex-shrink-0"><X size={16} /></button>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(['open', 'closed', 'archived', 'all'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    statusFilter === f ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'open' ? 'Aktif' : f === 'closed' ? 'Ditutup' : 'Diarsipkan'}
                  <span className="ml-1 text-slate-400">({discussions.filter((d) => f === 'all' || d.status === f).length})</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDiscussions}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow"
              >
                <MessageSquarePlus size={16} /> Diskusi Baru
              </button>
            </div>
          </div>

          {loading && discussions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin" />
              Memuat diskusi…
            </div>
          ) : visibleDiscussions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <MessageSquarePlus size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold mb-1">
                {statusFilter === 'all' ? 'Belum ada diskusi' : `Tidak ada diskusi ${statusFilter === 'open' ? 'aktif' : statusFilter === 'closed' ? 'ditutup' : 'diarsipkan'}`}
              </p>
              <p className="text-xs">Klik &ldquo;Diskusi Baru&rdquo; untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleDiscussions.map((d) => {
                const lastActMs = new Date(d.last_activity || d.updated_at).getTime();
                const hasUnread = lastActMs > lastReadMs;
                return (
                  <DiscussionCard
                    key={d.id}
                    discussion={d}
                    hasUnread={hasUnread}
                    onClick={() => { setActiveDiscussionId(d.id); setView('thread'); updateReadState(); }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {view === 'thread' && activeDiscussion && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
          <DiscussionThread
            discussion={activeDiscussion}
            messages={activeMessages}
            identity={identity}
            onBack={() => { setView('list'); setActiveDiscussionId(null); updateReadState(); }}
            onStatusChange={changeDiscussionStatus}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onRefresh={() => fetchMessages(activeDiscussion.id)}
          />
        </div>
      )}

      {showNewModal && identity && (
        <NewDiscussionModal
          identity={identity}
          onCreate={createDiscussion}
          onCancel={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
};

export default PhaseDiscussionsModule;
