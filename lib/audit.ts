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
import type { AuditEntityId, AuditActionId } from '../constants/audit';
import { AUDIT_ENTITIES } from '../constants/audit';


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
 */
export interface AuditEntryData {
  entity:      AuditEntityId;
  action:      AuditActionId;
  entityId:    string;          // record id atau '-' untuk bulk/system
  description: string;          // human-readable Indonesian (e.g., "Tambah Tagihan listrik Mei")
  snapshot:    unknown;         // diverse shapes per action — caller tahu structure
  user:        string;          // 'system-default' Phase 2; auth.uid() Phase 3 P3.1
  timestamp:   string;          // ISO 8601 (redundan dengan created_at, tapi explicit)
}

/**
 * Caller-side input untuk logAuditEntries — `user` dan `timestamp` di-fill
 * automatic oleh logAuditEntries (bukan responsibility caller).
 */
export interface AuditEntryInput {
  entity:      AuditEntityId;
  action:      AuditActionId;
  entityId:    string;
  description: string;
  snapshot:    unknown;
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
      entity:      e.entity,
      action:      e.action,
      entityId:    e.entityId,
      description: e.description,
      snapshot:    e.snapshot,
      user,
      timestamp,
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
