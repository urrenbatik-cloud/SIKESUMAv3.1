// ============================================================================
// SIKESUMA v3.1 · Komunikasi & Diskusi — Constants + Types
// ============================================================================
// File          : constants/komunikasi.ts
// Phase         : Komunikasi feature (post-Session A) — Phase 2 of 7
// Date          : 2026-05-08
// Source        : Per spec 02_TECHNICAL_DESIGN.md §2.9 + 01_FEATURE_SPEC §1.3
//
// Purpose       : Single source of truth untuk types, ROLE_REGISTRY, file
//                 upload limits, edit window, MIME whitelist, dan helpers.
//                 Dipakai oleh:
//                   - components/PhaseDiscussionsModule.tsx (main feature)
//                   - components/SettingsModule.tsx         (tab integration)
//
// Decisions encoded:
//   - D1 trust-based identity (role+name tuple, NOT verified)
//   - D2 topic-based threading (no nested replies)
//   - D3 25 MB/file × 5 attachments × MIME whitelist
//   - D5 30-min edit window enforcement (client-side, helpers below)
//   - 10-role registry with color/icon/suggestedNames per spec §1.3
//
// Storage backing:
//   - phase_discussions table   : envelope JSONB (id text PK + data jsonb)
//   - phase_messages table      : envelope JSONB
//   - phase-docs storage bucket : 25 MB limit, signed URLs (private bucket)
//
// IMPORTANT — pure data + helper module. NO React, NO Supabase imports here.
// Components yang import file ini juga butuh tahu storage path convention:
//   `phase-docs/{discussion_id}/{message_id}/{Date.now()}_{sanitizedFilename}`
// ============================================================================


// ─── §1. Storage Keys (localStorage) ────────────────────────────────────────
//
// 3 keys di localStorage browser per device:
//   - identity         : { role, name } JSON (D1 trust-based)
//   - read_state       : { global_last_read, per_discussion? } JSON (D5)
//   - caveat_dismissed : boolean session marker (re-show next session)

export const STORAGE_KEY_IDENTITY         = 'sikesuma_komunikasi_identity';
export const STORAGE_KEY_READ_STATE       = 'sikesuma_komunikasi_read_state';
export const STORAGE_KEY_CAVEAT_DISMISSED = 'sikesuma_komunikasi_caveat_dismissed';


// ─── §2. File Upload Limits (D3) ────────────────────────────────────────────

/** 25 MB per file, matches storage bucket file_size_limit. */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 26214400

/** Maks 5 attachments per single message. */
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;


// ─── §3. Edit Window (D5) ───────────────────────────────────────────────────

/** 30 menit dalam ms. After this, edit/delete UI hidden (client-side enforcement). */
export const EDIT_WINDOW_MS = 30 * 60 * 1000; // 1_800_000


// ─── §4. Length Limits (per spec §2.1 data shape) ───────────────────────────

export const MAX_TITLE_LENGTH       = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH     = 10000;


// ─── §5. Allowed MIME Types (D3) ────────────────────────────────────────────
// HARUS sync dengan storage bucket allowed_mime_types di SQL migration.
// Client-side validation di komposer; server-side enforcement via bucket config.

export const ALLOWED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword',                                                       // DOC
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // XLSX
  'application/vnd.ms-excel',                                                 // XLS
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/x-zip-compressed',
] as const;

/** Subset yang akan di-render sebagai inline image preview di MessageBubble. */
export const IMAGE_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
] as const;


// ─── §6. Types ──────────────────────────────────────────────────────────────

/** 10 roles per ROLE_REGISTRY §7 (spec §1.3). */
export type RoleId =
  | 'successor'
  | 'predecessor'
  | 'bagian_it'
  | 'karumkit'
  | 'verifikator'
  | 'bendahara'
  | 'asisten_successor'
  | 'additional_1'
  | 'additional_2'
  | 'additional_3';

/** Discussion status workflow: open → closed | archived. Re-open allowed. */
export type DiscussionStatus = 'open' | 'closed' | 'archived';

/** Trust-based identity (role + name tuple). Stored di localStorage. */
export interface UserIdentity {
  role: RoleId;
  name: string;
}

/** Role registry entry. */
export interface RoleSpec {
  id:                 RoleId;
  label:              string;        // display label (id-ID)
  color:              string;        // tailwind color base ('emerald', 'blue', etc)
  icon:               string;        // emoji untuk avatar
  suggestedNames:     string[];      // pre-populated names (sub-identities)
  description:        string;        // tooltip / role explanation
  defaultPlaceholder: boolean;       // true = generic slot, butuh user fill nama
}

/** Discussion data envelope (matches phase_discussions.data JSONB shape). */
export interface DiscussionData {
  title:                string;
  description:          string;
  phase_ref:            string | null;
  status:               DiscussionStatus;
  created_by_role:      RoleId;
  created_by_name:      string;
  participants:         RoleId[];
  message_count:        number;
  last_activity:        string;       // ISO timestamp
  last_message_preview: string;       // first 150 chars of latest message
}

/** Discussion full record (id + data flat + audit cols, post-unwrap from DB). */
export interface Discussion extends DiscussionData {
  id:         string;                 // 'disc-{Date.now()}-{base36-6}'
  created_at: string;
  updated_at: string;
}

/** Message data envelope (matches phase_messages.data JSONB shape). */
export interface MessageData {
  discussion_id: string;
  author_role:   RoleId;
  author_name:   string;
  content:       string;
  edited:        boolean;
  edited_at:     string | null;
  reply_to:      string | null;
  attachments:   Attachment[];
}

/** Message full record. */
export interface Message extends MessageData {
  id:         string;                 // 'msg-{Date.now()}-{base36-6}'
  created_at: string;
}

/** Attachment metadata embedded in message.attachments[]. */
export interface Attachment {
  id:           string;               // 'att-{Date.now()}-{base36-6}'
  name:         string;               // original filename (display)
  size:         number;               // bytes
  mime_type:    string;
  storage_path: string;               // 'phase-docs/{disc}/{msg}/{filename}'
  uploaded_at:  string;               // ISO timestamp
}

/** localStorage shape untuk read-tracking (D5 simplified MVP). */
export interface ReadState {
  global_last_read: string;                          // ISO timestamp
  per_discussion?:  Record<string, string>;          // optional Phase 3 granularity
}


// ─── §7. ROLE_REGISTRY (10 roles per spec §1.3) ─────────────────────────────
// Color uniqueness: 7 distinct colors for 7 specific roles + slate untuk 3
// placeholder slots (visually deprioritized).

export const ROLE_REGISTRY: Record<RoleId, RoleSpec> = {
  successor: {
    id:                 'successor',
    label:              'Successor',
    color:              'emerald',
    icon:               '🧑‍💻',
    suggestedNames:     ['Ferry'],
    description:        'Current owner, lead developer (Phase 2 onward)',
    defaultPlaceholder: false,
  },
  predecessor: {
    id:                 'predecessor',
    label:              'Predecessor',
    color:              'blue',
    icon:               '👤',
    suggestedNames:     ['Sie Renbang'],
    description:        'Original developer, current advisor',
    defaultPlaceholder: false,
  },
  bagian_it: {
    id:                 'bagian_it',
    label:              'Bagian IT',
    color:              'violet',
    icon:               '💻',
    suggestedNames:     ['Panji', 'Asisten Panji 1', 'Asisten Panji 2'],
    description:        'Tim IT RS Tk.IV Batin Tikal',
    defaultPlaceholder: false,
  },
  karumkit: {
    id:                 'karumkit',
    label:              'Karumkit',
    color:              'amber',
    icon:               '🎖️',
    suggestedNames:     [], // user types specific name (e.g., rank + name)
    description:        'Kepala Rumah Sakit, decision authority',
    defaultPlaceholder: false,
  },
  verifikator: {
    id:                 'verifikator',
    label:              'Verifikator',
    color:              'rose',
    icon:               '✅',
    suggestedNames:     [],
    description:        'Verifikator klaim/keuangan',
    defaultPlaceholder: false,
  },
  bendahara: {
    id:                 'bendahara',
    label:              'Bendahara',
    color:              'pink',
    icon:               '💰',
    suggestedNames:     [],
    description:        'Bendahara RS, kuasa keuangan',
    defaultPlaceholder: false,
  },
  asisten_successor: {
    id:                 'asisten_successor',
    label:              'Asisten Successor',
    color:              'teal',
    icon:               '🩺',
    suggestedNames:     ['dr Max'],
    description:        'Asisten developer / successor team member',
    defaultPlaceholder: false,
  },
  additional_1: {
    id:                 'additional_1',
    label:              'Tambahan 1',
    color:              'slate',
    icon:               '👥',
    suggestedNames:     [],
    description:        'Slot tambahan team member 1',
    defaultPlaceholder: true,
  },
  additional_2: {
    id:                 'additional_2',
    label:              'Tambahan 2',
    color:              'slate',
    icon:               '👥',
    suggestedNames:     [],
    description:        'Slot tambahan team member 2',
    defaultPlaceholder: true,
  },
  additional_3: {
    id:                 'additional_3',
    label:              'Tambahan 3',
    color:              'slate',
    icon:               '👥',
    suggestedNames:     [],
    description:        'Slot tambahan team member 3',
    defaultPlaceholder: true,
  },
};

/** Ordered RoleId array (untuk dropdown rendering). Stable order per registry. */
export const ROLE_ORDER: RoleId[] = [
  'successor',
  'predecessor',
  'bagian_it',
  'karumkit',
  'verifikator',
  'bendahara',
  'asisten_successor',
  'additional_1',
  'additional_2',
  'additional_3',
];


// ─── §8. Helpers ────────────────────────────────────────────────────────────

/** Lookup RoleSpec by id. Returns undefined kalau id tidak dikenal. */
export function getRoleSpec(id: string): RoleSpec | undefined {
  return ROLE_REGISTRY[id as RoleId];
}

/** Lookup label dengan fallback ke id mentah. Defensive untuk legacy entries. */
export function getRoleLabel(id: string): string {
  return getRoleSpec(id)?.label ?? id;
}

/** Lookup color (tailwind base name). Fallback 'slate' kalau tidak dikenal. */
export function getRoleColor(id: string): string {
  return getRoleSpec(id)?.color ?? 'slate';
}

/** Lookup emoji icon. Fallback '👤' kalau tidak dikenal. */
export function getRoleIcon(id: string): string {
  return getRoleSpec(id)?.icon ?? '👤';
}

/**
 * Format bytes → human-readable string.
 *   1024            → "1.0 KB"
 *   1_048_576       → "1.0 MB"
 *   25 * 1024^2     → "25.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** True kalau MIME masuk di IMAGE_MIME_TYPES (PNG/JPG → inline preview). */
export function isImageMime(mime: string): boolean {
  return IMAGE_MIME_TYPES.includes(mime);
}

/** True kalau message masih di dalam edit window 30 menit. */
export function isWithinEditWindow(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs < EDIT_WINDOW_MS;
}

/**
 * Edit/delete eligibility check:
 *   - Same author (role + name match)
 *   - Within 30-min window
 * NOTE: Trust-based — client-side only. Phase 3 P3.1 (TD-13) akan add server check.
 */
export function canEditMessage(message: Message, identity: UserIdentity): boolean {
  if (message.author_role !== identity.role) return false;
  if (message.author_name !== identity.name) return false;
  return isWithinEditWindow(message.created_at);
}

/** Same rule as canEditMessage. Separate function untuk semantic clarity di UI. */
export function canDeleteMessage(message: Message, identity: UserIdentity): boolean {
  return canEditMessage(message, identity);
}

/** Validate single file untuk upload. Returns error message string OR null kalau OK. */
export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File "${file.name}" terlalu besar. Maks ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipe file "${file.name}" tidak diizinkan. Hanya PDF/DOCX/XLSX/PNG/JPG/ZIP.`;
  }
  return null;
}

/** Sanitize filename untuk storage path (replace non-alphanumeric kecuali . _ -). */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Generate id dengan pattern '{prefix}-{Date.now()}-{base36-6}'.
 * Match v3.1 convention (lib/audit.ts generateAuditId pattern).
 *   prefix='disc' → 'disc-1746626745123-kx3p9z'  (discussions)
 *   prefix='msg'  → 'msg-1746626745124-a1b2c3'   (messages)
 *   prefix='att'  → 'att-1746626745125-d4e5f6'   (attachments)
 */
export function generateKomunikasiId(prefix: 'disc' | 'msg' | 'att'): string {
  const ts = Date.now();
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${prefix}-${ts}-${suffix}`;
}

/** Truncate text ke N chars + ellipsis. Untuk last_message_preview di list view. */
export function truncatePreview(text: string, maxChars: number = 150): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trimEnd() + '…';
}

/** Merge new participant role ke existing list (unique). */
export function addParticipant(participants: RoleId[], newRole: RoleId): RoleId[] {
  if (participants.includes(newRole)) return participants;
  return [...participants, newRole];
}
