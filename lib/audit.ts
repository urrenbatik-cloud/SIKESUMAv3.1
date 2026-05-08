// ============================================================================
// SIKESUMA v3.1 - Audit Log Library (diff helpers + Supabase persistence)
// ============================================================================
// File          : lib/audit.ts
// Sub-Sequence  : S3.2 - Audit Log Foundation
// Date          : 7 Mei 2026
// Source        : Port dari POC sikesuma-app.jsx L378-453 (diffCollectionForAudit,
//                 diffObjectForAudit). Adaptasi:
//                   - Pure functions; tidak pakai singleton registerAuditLogger
//                     pattern dari POC (tidak perlu — sync-time logging di
//                     App.tsx punya direct access ke supabase client).
//                   - logAuditEntries() async, langsung insert ke Supabase
//                     audit_log table (envelope JSONB id/data pattern).
//                   - ID format: audit-{Date.now()}-{base36-6} sesuai
//                     §S3.2-D2 decision (matches v3.1 Toast/ServiceBill pattern).
//
// Architecture  : SYNC-TIME LOGGING (Decision §F #9)
//                   - prevSnapshot di-capture saat loadData
//                   - syncToCloud panggil diffCollection/diffObject per entity
//                     untuk produce AuditEntryInput[]
//                   - Buffer terkumpul, lalu logAuditEntries() bulk insert
//                     di akhir syncToCloud (single roundtrip).
//                   - Failure tidak boleh ganggu sync UX — error swallow ke
//                     console.warn, mirror Toast.tsx error philosophy.
// ============================================================================

import { supabase } from './supabase';
import type { AuditEntityId, AuditActionId, ReasoningCategory } from '../constants/audit';
import { AUDIT_ENTITIES, INITIAL_REASONING_CATEGORIES } from '../constants/audit';


// ─── §1. Types ─────────────────────────────────────────────────────────────

/**
 * Audit entry payload yang di-store di kolom `data` JSONB tabel `audit_log`.
 *
 * Snapshot shape varies by action:
 *   - create/delete         : full record snapshot
 *   - update                : { before, after } object pair
 *   - bulk_*                : { added: number, modified: number, removed: number,
 *                              sampleIds: string[] (max 5) }
 *   - config_update         : { [field]: { before, after } } untuk setiap key changed
 *   - reset/seed_load/...   : caller-defined (e.g., { count: 35 })
 *
 * [S5.1] Reasoning fields ditambah untuk midterm pagu revision workflow:
 *   - reasoning, reasoningCategory, dynamicsFactor: filled later via
 *     Tinjauan Audit UI (Phase 5.3 / UI placement Opsi C). null at-creation.
 *   - isReviewed/reviewedAt/reviewedBy: tracking review status.
 *   - Backward compat: existing entries pre-S5.1 punya fields = undefined.
 */
export interface AuditEntryData {
  entity:             AuditEntityId;
  action:             AuditActionId;
  entityId:           string;          // record id atau '-' untuk bulk/system
  description:        string;          // human-readable Indonesian (e.g., "Tambah Tagihan listrik Mei")
  snapshot:           unknown;         // diverse shapes per action — caller tahu structure
  user:               string;          // 'system-default' Phase 2; auth.uid() Phase 3 P3.1
  timestamp:          string;          // ISO 8601 (redundan dengan created_at, tapi explicit)
  // [S5.1] Reasoning fields — all optional/nullable. Backward compat:
  // existing entries pre-S5.1 don't have these fields (undefined).
  reasoning?:         string | null;
  reasoningCategory?: string | null;
  dynamicsFactor?:    string | null;
  isReviewed?:        boolean;
  reviewedAt?:        string | null;
  reviewedBy?:        string | null;
}

/**
 * Caller-side input untuk logAuditEntries — `user` dan `timestamp` di-fill
 * automatic oleh logAuditEntries (bukan responsibility caller).
 *
 * [S5.1] Caller bisa OPTIONAL pass reasoning at-creation. Default: null
 * (di-fill nanti via Tinjauan Audit UI). Mayoritas callers existing
 * (syncToCloud diff, Komunikasi inline, RsProfileEditor inline) NOT
 * pass reasoning — itu di-isi oleh Sie Renbang via review process.
 */
export interface AuditEntryInput {
  entity:             AuditEntityId;
  action:             AuditActionId;
  entityId:           string;
  description:        string;
  snapshot:           unknown;
  // [S5.1] Optional reasoning at-creation
  reasoning?:         string | null;
  reasoningCategory?: string | null;
  dynamicsFactor?:    string | null;
}

/**
 * Constraint untuk diffCollectionForAudit — item harus punya `id` field (string).
 * Mirror v3.1 envelope flatten pattern: `{ id, ...data }`.
 */
export interface ItemWithId {
  id: string;
  // Other fields tidak constrained — diff via JSON.stringify
}

/**
 * Row shape untuk insert ke tabel audit_log (envelope JSONB).
 *   - id        : audit-{Date.now()}-{base36-6}
 *   - data      : AuditEntryData (filled by logAuditEntries)
 *   - created_at: server-side default now()
 */
interface AuditLogRow {
  id:   string;
  data: AuditEntryData;
}


// ─── §2. ID Generation ─────────────────────────────────────────────────────
//
// Format: audit-{Date.now()}-{base36-6}
// Contoh: audit-1746626745123-kx3p9z
//
// Decision §S3.2-D2: pakai pattern existing v3.1 (Toast, ServiceBillRecap) —
// `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`. No new dependency.
// Entropy 36^6 ≈ 2.2 milyar, lebih dari cukup untuk single-tenant intranet.
// Date.now() ms-resolution memberikan natural sort + collision resistance
// dalam burst inserts (multiple entries dalam 1 syncToCloud akan punya ms
// berbeda meski random suffix sama).

export function generateAuditId(): string {
  const ts = Date.now();
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `audit-${ts}-${suffix}`;
}


// ─── §3. Diff Helpers (pure, no DB) ────────────────────────────────────────

/**
 * Hitung shallow slim-diff antara dua objects: hanya field yang berubah yang
 * masuk hasil. Shape: `{ field: { before, after } }`.
 *
 * Equality: JSON.stringify (deep value comparison, sederhana).
 * Scope    : top-level keys saja. Nested object yang berubah satu sub-field
 *            akan diserialize keseluruhan di before/after — acceptable dan
 *            konsisten dengan POC `diffObjectForAudit` semantic.
 *
 * Dipakai oleh:
 *   - diffCollectionForAudit (single update case) → snapshot slim
 *   - diffObjectForAudit (config_update) → snapshot slim
 *
 * Decision §S3.2-Review #4: snapshot update pakai slim diff (bukan full
 * before/after record) — mengurangi audit_log row size, dan menyatukan shape
 * dengan config_update untuk reusable AuditLogViewer rendering.
 */
function computeSlimDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { before: unknown; after: unknown }> {
  const result: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      result[k] = { before: before[k], after: after[k] };
    }
  }
  return result;
}


/**
 * Diff dua koleksi (prev, next) berdasar field `id`. Output:
 *   - 0 entries kalau tidak ada perubahan
 *   - 1 entry single-action (create/update/delete) kalau total perubahan = 1
 *   - 1 entry bulk-action (bulk_create/bulk_update/bulk_delete) kalau >1
 *
 * Equality check pakai JSON.stringify (deep, sederhana). Untuk koleksi besar
 * (>1000 items) ini bisa jadi bottleneck — sekarang OK untuk v3.1 (35 bills,
 * 60 claims, dll).
 *
 * @param prev         Snapshot sebelum perubahan (undefined/null = []).
 * @param next         State current sesudah perubahan (undefined/null = []).
 * @param entityName   Entity id dari constants/audit.ts AUDIT_ENTITIES.
 * @param descBuilder  Optional — fungsi build deskripsi singkat untuk 1 item
 *                     (e.g., `(b) => 'Tagihan ' + b.label`). Kalau tidak
 *                     diberikan, pakai item.id sebagai fallback. Errors di
 *                     descBuilder ditangkap (try/catch) supaya tidak ganggu
 *                     audit emission.
 *
 * Port dari POC sikesuma-app.jsx L381-429 dengan TypeScript types tambahan.
 */
export function diffCollectionForAudit<T extends ItemWithId>(
  prev: T[] | undefined | null,
  next: T[] | undefined | null,
  entityName: AuditEntityId,
  descBuilder?: (item: T) => string,
): AuditEntryInput[] {
  const prevArr: T[] = Array.isArray(prev) ? prev : [];
  const nextArr: T[] = Array.isArray(next) ? next : [];

  const prevById = new Map<string, T>(prevArr.map((x) => [x.id, x]));
  const nextById = new Map<string, T>(nextArr.map((x) => [x.id, x]));

  const added:    T[]                                = [];
  const modified: Array<{ before: T; after: T }>    = [];
  const removed:  T[]                                = [];

  for (const item of nextArr) {
    if (!prevById.has(item.id)) {
      added.push(item);
    } else {
      const before = prevById.get(item.id)!;
      if (JSON.stringify(before) !== JSON.stringify(item)) {
        modified.push({ before, after: item });
      }
    }
  }
  for (const item of prevArr) {
    if (!nextById.has(item.id)) removed.push(item);
  }

  const total = added.length + modified.length + removed.length;
  if (total === 0) return [];

  const safeDesc = (x: T): string => {
    try {
      return descBuilder ? descBuilder(x) : (x.id || '?');
    } catch {
      return x?.id || '?';
    }
  };

  // Single-action case — preferred over bulk for clarity.
  if (total === 1) {
    if (added.length === 1) {
      const x = added[0];
      return [{
        entity:      entityName,
        action:      'create',
        entityId:    x.id,
        description: 'Tambah ' + safeDesc(x),
        snapshot:    x,
      }];
    }
    if (removed.length === 1) {
      const x = removed[0];
      return [{
        entity:      entityName,
        action:      'delete',
        entityId:    x.id,
        description: 'Hapus ' + safeDesc(x),
        snapshot:    x,
      }];
    }
    if (modified.length === 1) {
      const m = modified[0];
      // Slim diff (Decision §S3.2-Review #4): snapshot hanya field yang
      // berubah, bukan full record. Shape jadi sama dengan config_update.
      const slimDiff = computeSlimDiff(
        m.before as Record<string, unknown>,
        m.after  as Record<string, unknown>,
      );
      return [{
        entity:      entityName,
        action:      'update',
        entityId:    m.after.id,
        description: 'Ubah ' + safeDesc(m.after),
        snapshot:    slimDiff,
      }];
    }
  }

  // Bulk case — collapse jadi 1 entry summary supaya audit log tidak banjir.
  const summary: string[] = [];
  if (added.length)    summary.push('+' + added.length + ' baru');
  if (modified.length) summary.push('~' + modified.length + ' ubah');
  if (removed.length)  summary.push('−' + removed.length + ' hapus');

  let action: AuditActionId = 'bulk_update';
  if (added.length > 0    && modified.length === 0 && removed.length === 0) action = 'bulk_create';
  else if (removed.length > 0 && added.length === 0 && modified.length === 0) action = 'bulk_delete';

  const entityLabel =
    AUDIT_ENTITIES.find((e) => e.id === entityName)?.label ?? entityName;

  // Sample id collection — max 5 untuk readability di Riwayat Aktivitas detail.
  const sampleIds = [
    ...added,
    ...modified.map((m) => m.after),
    ...removed,
  ].slice(0, 5).map((x) => x.id);

  return [{
    entity:      entityName,
    action,
    entityId:    '-',
    description: 'Bulk ' + entityLabel + ': ' + summary.join(', '),
    snapshot:    {
      added:    added.length,
      modified: modified.length,
      removed:  removed.length,
      sampleIds,
    },
  }];
}


/**
 * Diff config object (shallow). Bandingkan setiap top-level key, kumpulkan
 * yang berubah jadi { [key]: { before, after } }. Selalu 0 atau 1 entry.
 *
 * Cocok untuk:
 *   - bpjsConfig    (BPJS calculation settings — nested object, tapi shallow
 *                    diff sudah cukup karena seluruh config selalu replaced)
 *   - pnbpConfig    (eligibleCategories array, includeServiceBills boolean, ...)
 *   - rsProfile     (5 string fields)
 *
 * Tidak cocok untuk koleksi (gunakan diffCollectionForAudit).
 *
 * Port dari POC sikesuma-app.jsx L432-453.
 */
export function diffObjectForAudit<T extends Record<string, unknown>>(
  prev: T | undefined | null,
  next: T | undefined | null,
  entityName: AuditEntityId,
): AuditEntryInput[] {
  const before: Record<string, unknown> = (prev as Record<string, unknown>) || {};
  const after:  Record<string, unknown> = (next as Record<string, unknown>) || {};

  const changed = computeSlimDiff(before, after);

  if (Object.keys(changed).length === 0) return [];

  const fields = Object.keys(changed).join(', ');
  const entityLabel =
    AUDIT_ENTITIES.find((e) => e.id === entityName)?.label ?? entityName;

  return [{
    entity:      entityName,
    action:      'config_update',
    entityId:    '-',
    description: 'Ubah ' + entityLabel + (fields ? ' (' + fields + ')' : ''),
    snapshot:    changed,
  }];
}


// ─── §4. Persistence — Supabase Insert ─────────────────────────────────────

/**
 * Default user identifier untuk Phase 2 (single-user assumption). Akan
 * diganti dengan auth.uid() saat Phase 3 P3.1 (auth wiring).
 */
const DEFAULT_USER = 'system-default';

/**
 * Bulk insert audit entries ke tabel audit_log. Dipakai dari syncToCloud
 * di App.tsx — semua diff entries terkumpul lalu di-flush single roundtrip
 * di akhir.
 *
 * Failure handling: error TIDAK di-throw; di-log ke console.warn dan return
 * silently. Audit gagal seharusnya TIDAK menggagalkan syncToCloud — UX
 * data sync prioritas lebih tinggi daripada audit emission.
 *
 * @param entries  Array AuditEntryInput dari diff helpers atau caller-built.
 * @param user     Optional user identifier; default 'system-default'.
 *
 * @returns        Promise<number> — jumlah entries yang BERHASIL ter-insert
 *                 (untuk Toast feedback di syncToCloud). Kalau total error,
 *                 return 0.
 */
export async function logAuditEntries(
  entries: AuditEntryInput[],
  user: string = DEFAULT_USER,
): Promise<number> {
  if (!entries || entries.length === 0) return 0;

  const timestamp = new Date().toISOString();

  const rows: AuditLogRow[] = entries.map((e) => ({
    id: generateAuditId(),
    data: {
      entity:             e.entity,
      action:             e.action,
      entityId:           e.entityId,
      description:        e.description,
      snapshot:           e.snapshot,
      user,
      timestamp,
      // [S5.1] Reasoning fields — null at-creation per §S5.1-D-3.
      // Optional: caller bisa override (e.g., system actions yang tau alasannya).
      reasoning:          e.reasoning ?? null,
      reasoningCategory:  e.reasoningCategory ?? null,
      dynamicsFactor:     e.dynamicsFactor ?? null,
      isReviewed:         false,
      reviewedAt:         null,
      reviewedBy:         null,
    },
  }));

  try {
    const { error } = await supabase.from('audit_log').insert(rows);
    if (error) {
      console.warn('⚠️ logAuditEntries failed:', error.message);
      return 0;
    }
    return rows.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('⚠️ logAuditEntries exception:', msg);
    return 0;
  }
}


/**
 * Convenience: log a single audit entry. Wrapper di atas logAuditEntries.
 * Dipakai untuk system-level actions (reset, seed_load) yang single-shot.
 */
export async function logAuditEntry(
  entry: AuditEntryInput,
  user: string = DEFAULT_USER,
): Promise<number> {
  return logAuditEntries([entry], user);
}


// ─── §5. Reasoning Helpers (S5.1) ──────────────────────────────────────────
//
// Phase 5.1 — helpers untuk reasoning capture + review workflow.
// Origin: Sie Renbang verbal clarification 8 Mei 2026 (audit_log dipakai
// sebagai justifikasi midterm pagu revision).

/**
 * Update existing audit entry dengan reasoning + mark sebagai reviewed.
 * Dipakai oleh AuditLogViewer detail modal (Phase 5.3 — UI placement Opsi C).
 *
 * Pattern: fetch existing data envelope JSONB → merge fields → upsert.
 * Defensive: kalau entry tidak ditemukan atau update gagal, return false
 * tanpa exception (mirror logAuditEntries error philosophy).
 *
 * @param entryId - Audit entry id (e.g., 'audit-1715140847314-abc123')
 * @param updates - Reasoning + category + dynamics. Field yang null/undefined
 *                  preserve existing value (partial update). Note: kalau caller
 *                  PENGEN explicit clear field, pass empty string '' (akan
 *                  ter-stored sebagai non-null empty string).
 * @param reviewer - Role + name reviewer (e.g., 'Predecessor (Sie Renbang)')
 *                   — pattern dari Komunikasi feature.
 * @returns true kalau update success, false otherwise.
 */
export async function markAuditEntryReviewed(
  entryId: string,
  updates: {
    reasoning?:         string | null;
    reasoningCategory?: string | null;
    dynamicsFactor?:    string | null;
  },
  reviewer: string,
): Promise<boolean> {
  // Fetch existing data — envelope JSONB merge (preserve existing fields)
  const { data: existing, error: fetchErr } = await supabase
    .from('audit_log')
    .select('data')
    .eq('id', entryId)
    .single();

  if (fetchErr || !existing) {
    console.warn('⚠️ markAuditEntryReviewed: fetch failed for', entryId, fetchErr?.message);
    return false;
  }

  const existingData = (existing.data ?? {}) as AuditEntryData;

  // Merge: undefined updates preserve existing, defined updates (incl. null) override
  const merged: AuditEntryData = {
    ...existingData,
    reasoning:         updates.reasoning !== undefined         ? updates.reasoning         : (existingData.reasoning ?? null),
    reasoningCategory: updates.reasoningCategory !== undefined ? updates.reasoningCategory : (existingData.reasoningCategory ?? null),
    dynamicsFactor:    updates.dynamicsFactor !== undefined    ? updates.dynamicsFactor    : (existingData.dynamicsFactor ?? null),
    isReviewed:        true,
    reviewedAt:        new Date().toISOString(),
    reviewedBy:        reviewer,
  };

  const { error: updateErr } = await supabase
    .from('audit_log')
    .update({ data: merged })
    .eq('id', entryId);

  if (updateErr) {
    console.warn('⚠️ markAuditEntryReviewed: update failed for', entryId, updateErr.message);
    return false;
  }
  return true;
}


/**
 * Fetch reasoning categories dari system_settings.reasoning_categories.
 * Dipakai oleh AuditLogViewer detail modal untuk populate dropdown.
 *
 * Defensive cascade:
 *   1. Try fetch dari system_settings
 *   2. Validate shape (Array of {id, label, color})
 *   3. Fallback ke INITIAL_REASONING_CATEGORIES kalau:
 *      - Key tidak ada
 *      - Parsing gagal
 *      - Shape invalid
 *      - Empty array
 *
 * Cache: caller bertanggung jawab cache result (mis. di useState/useMemo).
 * Function ini fresh-fetch setiap call.
 *
 * @returns Array reasoning categories (minimum INITIAL fallback)
 */
export async function fetchReasoningCategories(): Promise<ReasoningCategory[]> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'reasoning_categories')
      .single();

    if (error || !data?.value) {
      console.warn('⚠️ fetchReasoningCategories: fallback to INITIAL', error?.message);
      return INITIAL_REASONING_CATEGORIES;
    }

    if (Array.isArray(data.value)) {
      // Validate shape — accept rows yang punya minimal {id, label}, normalize color
      const valid: ReasoningCategory[] = data.value
        .filter((c: unknown): c is { id: string; label: string; color?: string } => {
          if (!c || typeof c !== 'object') return false;
          const obj = c as Record<string, unknown>;
          return typeof obj.id === 'string'
              && typeof obj.label === 'string'
              && obj.id.length > 0
              && obj.label.length > 0;
        })
        .map((c) => ({
          id:    c.id,
          label: c.label,
          color: typeof c.color === 'string' ? c.color : 'gray',
        }));

      if (valid.length > 0) return valid;
    }

    return INITIAL_REASONING_CATEGORIES;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('⚠️ fetchReasoningCategories exception, fallback:', msg);
    return INITIAL_REASONING_CATEGORIES;
  }
}
