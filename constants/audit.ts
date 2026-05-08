// ============================================================================
// SIKESUMA v3.1 - Audit Log Taxonomy (constants only, pure data)
// ============================================================================
// File          : constants/audit.ts
// Sub-Sequence  : S3.2 - Audit Log Foundation
// Date          : 7 Mei 2026
// Source        : Port dari POC sikesuma-app.jsx L329-366 (AUDIT_ENTITIES,
//                 AUDIT_ACTIONS), dengan adaptasi scope v3.1 (drop 4 entities
//                 yang tidak in-scope di Step 3 — lihat §SKIP NOTES).
//
// Purpose       : Single source of truth untuk taxonomy entity + action.
//                 Dipakai oleh:
//                   - lib/audit.ts            (diff + logAuditEntries)
//                   - components/AuditLogViewer.tsx  (filter dropdown + badge)
//                   - App.tsx                 (wire syncToCloud per entity)
//
// Design        : `as const` + literal type union → TypeScript exhaustive check
//                 saat kita tambah/hapus entity, compiler langsung flag tempat
//                 yang perlu update.
// ============================================================================

// ─── §1. Entity Taxonomy ───────────────────────────────────────────────────
//
// Daftar entity yang di-track di audit log. Mapping ke v3.1 storage:
//   - section, bill, claim, doctor, employee, kuitansi, rab, rpd, pnbp,
//     revenueTarget, specialtyTarget, payrollStatus, jasaFile
//     → public.<table_name> (envelope JSONB id/data pattern)
//   - bpjsConfig, pnbpConfig, rsProfile, jasaConfig, paguLock
//     → public.system_settings (key/value pattern, single row per key)
//   - system
//     → meta entity untuk system-level actions (reset, seed_load, dll)
//       tidak punya storage row — entityId selalu '-'.
//
// FUTURE-SCOPE entities (POC L335, L337, L341-342) — DEFINED tapi BELUM WIRE
// di Step 3, di-include di taxonomy untuk future-proof extensibility:
//   - bpjsTariff   : INA-CBG tariff CRUD (Phase 4+ scope)
//   - serviceBill  : Service bills concept (Phase 4+ scope)
//   - payroll      : Payroll full CRUD (Phase 4+ scope)
//   - payrollConfig: Payroll config (Phase 4+ scope)
// Wire pattern di App.tsx hanya emit untuk entities yang punya state di
// Step 3. 4 future-scope entities akan otomatis ter-cover saat fitur
// terkait di-build di phase berikutnya tanpa perlu update taxonomy.
//
// V3.1-SPECIFIC entities (6 entries — S3.2 full coverage §F #1):
//   POC tidak punya, tapi v3.1 syncToCloud emit ke 6 stores berikut.
//   Decision §S3.2-Coverage: Opsi B (full coverage) untuk honor §F #1
//   "All CRUD logged" strict. Naming follow POC camelCase convention.
//   - revenueTarget    : Target pendapatan tahunan (revenue_targets table)
//   - specialtyTarget  : Target per spesialis (specialty_targets table)
//   - payrollStatus    : Status pembayaran payroll (payroll_statuses table)
//   - jasaFile         : File verifikasi jasa (jasa_verification_files)
//   - jasaConfig       : Konfig akun jasa (system_settings.jasa_map)
//   - paguLock         : Kunci edit pagu (system_settings.pagu_lock)

export const AUDIT_ENTITIES = [
  // POC entities (17) — preserve POC L329-347 ordering for cross-reference
  { id: 'section',         label: 'Pagu / MAK' },
  { id: 'bill',            label: 'Tagihan' },
  { id: 'claim',           label: 'Klaim Pasien' },
  { id: 'doctor',          label: 'Dokter' },
  { id: 'employee',        label: 'Staf' },                 // → tabel `employees`; rename dari POC L334 'staff' supaya match v3.1 Employee type
  { id: 'bpjsTariff',      label: 'Tarif BPJS' },           // FUTURE — Phase 4+ scope
  { id: 'bpjsConfig',      label: 'Konfig BPJS' },          // → system_settings.bpjs_history
  { id: 'serviceBill',     label: 'Service Bill' },         // FUTURE — Phase 4+ scope
  { id: 'kuitansi',        label: 'Kuitansi' },             // → tabel `kuitansi` (S3.1 created, S3.4 wire)
  { id: 'rab',             label: 'RAB' },                  // → tabel `rabs` (S3.1 created, S3.3 wire)
  { id: 'rpd',             label: 'RPD' },                  // → tabel `rpds` (S3.1 created, S3.3 wire)
  { id: 'payroll',         label: 'Payroll' },              // FUTURE — Phase 4+ scope
  { id: 'payrollConfig',   label: 'Konfig Payroll' },       // FUTURE — Phase 4+ scope
  { id: 'pnbp',            label: 'Setoran PNBP' },         // → tabel `pnbp_setoran` (S3.1 created, S3.5 wire)
  { id: 'pnbpConfig',      label: 'Konfig PNBP' },          // → system_settings.pnbp_config (S3.1 seed, S3.5 wire)
  { id: 'rsProfile',       label: 'Profil RS' },            // → system_settings.rs_profile (S3.1 seed, S3.6 wire)
  { id: 'system',          label: 'Sistem' },               // meta — reset, seed_load, import_csv, dll

  // v3.1-specific entities (6) — Decision §S3.2-Coverage Opsi B
  { id: 'revenueTarget',   label: 'Target Pendapatan' },    // → tabel `revenue_targets`
  { id: 'specialtyTarget', label: 'Target Spesialis' },     // → tabel `specialty_targets`
  { id: 'payrollStatus',   label: 'Status Pembayaran' },    // → tabel `payroll_statuses`
  { id: 'jasaFile',        label: 'File Verifikasi Jasa' }, // → tabel `jasa_verification_files`
  { id: 'jasaConfig',      label: 'Konfig Akun Jasa' },     // → system_settings.jasa_map
  { id: 'paguLock',        label: 'Kunci Pagu' },           // → system_settings.pagu_lock

  // Komunikasi & Diskusi entities (2) — D4 selective audit (post-Session A feature)
  // Wired via direct logAuditEntries() inline call (NOT diff-based syncToCloud) di
  // PhaseDiscussionsModule.tsx. Events: discussion create/close/archive + file upload.
  // Routine text-only messages tidak di-audit (privacy + storage hygiene).
  { id: 'phaseDiscussion', label: 'Diskusi Phase' },        // → tabel `phase_discussions`
  { id: 'phaseMessage',    label: 'Pesan Diskusi' },        // → tabel `phase_messages`
] as const;

export type AuditEntity = typeof AUDIT_ENTITIES[number];
export type AuditEntityId = AuditEntity['id'];

/**
 * Lookup label untuk entity id. Fallback ke id mentah kalau tidak dikenal
 * (defensive — audit entry lama dengan entity id deprecated tetap ter-render).
 */
export const getAuditEntityLabel = (id: string): string => {
  const found = AUDIT_ENTITIES.find((e) => e.id === id);
  return found ? found.label : id;
};


// ─── §2. Action Taxonomy ───────────────────────────────────────────────────
//
// Daftar jenis aksi + warna badge UI. Color names cocok dengan Tailwind palette
// yang sudah dipakai di v3.1 (lucide-react + Tailwind).
//
// Single-item actions:
//   - create / update / delete
// Bulk actions (>1 perubahan dalam 1 sync):
//   - bulk_create / bulk_update / bulk_delete
// Object-level (config/KV) action:
//   - config_update          (untuk diffObjectForAudit)
// System actions:
//   - reset                  (admin reset data)
//   - seed_load              (initial data load — nice-to-have, not wired di S3.2)
//   - import_csv             (future feature placeholder, not wired di S3.2)

export const AUDIT_ACTIONS = [
  { id: 'create',        label: 'Tambah',      color: 'emerald' },
  { id: 'update',        label: 'Ubah',        color: 'blue'    },
  { id: 'delete',        label: 'Hapus',       color: 'rose'    },
  { id: 'bulk_create',   label: 'Bulk Tambah', color: 'emerald' },
  { id: 'bulk_update',   label: 'Bulk Ubah',   color: 'blue'    },
  { id: 'bulk_delete',   label: 'Bulk Hapus',  color: 'rose'    },
  { id: 'config_update', label: 'Ubah Konfig', color: 'amber'   },
  { id: 'reset',         label: 'Reset Data',  color: 'rose'    },
  { id: 'seed_load',     label: 'Muat Seed',   color: 'stone'   },
  { id: 'import_csv',    label: 'Import CSV',  color: 'blue'    },
] as const;

export type AuditAction = typeof AUDIT_ACTIONS[number];
export type AuditActionId = AuditAction['id'];
export type AuditActionColor = AuditAction['color'];

/**
 * Lookup metadata (label + color) untuk action id. Fallback ke stone color
 * kalau action tidak dikenal — defensive untuk audit entry lama.
 */
export const getAuditActionMeta = (id: string): AuditAction => {
  const found = AUDIT_ACTIONS.find((a) => a.id === id);
  if (found) return found;
  // Fallback for unknown actions — keep narrow union type by casting
  return { id: id as AuditActionId, label: id, color: 'stone' } as AuditAction;
};


// ─── §3. Reasoning Taxonomy (S5.1) ─────────────────────────────────────────
//
// Step 5.1 — Reasoning capture untuk midterm pagu revision workflow.
// Origin: Sie Renbang verbal clarification 8 Mei 2026 — audit_log dipakai
// sebagai justifikasi pengajuan revisi pagu sebelum masa pagu berakhir
// (trigger-based, bukan time-based; trigger = gejala deviasi mulai muncul).
//
// Decisions encoded:
//   §S5.1-D-1: 5 fields baru di audit_log envelope (reasoning,
//              reasoningCategory, dynamicsFactor, isReviewed, reviewedAt,
//              reviewedBy)
//   §S5.1-D-2: 6 initial categories (extensible — Sie Renbang akan refine
//              via learning-by-doing)
//   §S5.1-D-3: All reasoning fields OPTIONAL at-creation. Di-fill nanti
//              via Tinjauan Audit UI (Phase 5.3, UI placement Opsi C =
//              integrated di AuditLogViewer detail modal).
//   §S5.1-D-4: Backward compat — existing audit entries pre-S5.1 punya
//              reasoning fields = undefined/null. Defensive read everywhere.
//   §S5.1-D-5: UI placement Opsi C (integrated detail modal).
//
// Reasoning categories di-seed ke system_settings.reasoning_categories
// (KV pattern). Sie Renbang bisa adjust via Settings → "Konfig Kategori
// Alasan" (tab tambahan post-Phase 5.5).

/**
 * Reasoning category metadata — seeded di system_settings.reasoning_categories.
 * Color names cocok dengan Tailwind palette + AUDIT_ACTIONS color scheme.
 */
export interface ReasoningCategory {
  id:    string;        // canonical id (snake_case)
  label: string;        // display label (Indonesian)
  color: string;        // Tailwind color name (red/blue/amber/purple/gray/etc.)
}

/**
 * Initial 6 categories — di-seed via SQL Phase 5.1.1. Bisa di-extend by user
 * via Settings → "Konfig Kategori Alasan" (post-Phase 5.5).
 */
export const INITIAL_REASONING_CATEGORIES: ReasoningCategory[] = [
  { id: 'kebutuhan_darurat',   label: 'Kebutuhan Darurat',       color: 'red'    },
  { id: 'pertumbuhan_pasien',  label: 'Pertumbuhan Pasien',      color: 'blue'   },
  { id: 'perubahan_kebijakan', label: 'Perubahan Kebijakan',     color: 'amber'  },
  { id: 'harga_pasar',         label: 'Fluktuasi Harga Pasar',   color: 'purple' },
  { id: 'salah_input',         label: 'Koreksi Salah Input',     color: 'gray'   },
  { id: 'lainnya',             label: 'Lainnya',                 color: 'gray'   },
];

/**
 * Lookup metadata untuk reasoning category id. Defensive fallback:
 *   - Kalau id null/undefined → return null (no reasoning recorded)
 *   - Kalau id ada tapi tidak match available list → return placeholder
 *     (label = raw id, color = gray) supaya audit entries lama tetap render
 *     meskipun Sie Renbang hapus suatu kategori dari system_settings.
 *
 * @param id - reasoning category id (atau null/undefined dari old entries)
 * @param available - list dari fetchReasoningCategories() (override default)
 */
export const getReasoningCategoryMeta = (
  id: string | null | undefined,
  available: ReasoningCategory[] = INITIAL_REASONING_CATEGORIES,
): ReasoningCategory | null => {
  if (!id) return null;
  const found = available.find((c) => c.id === id);
  if (found) return found;
  return { id, label: id, color: 'gray' };
};
