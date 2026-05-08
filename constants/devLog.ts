// ============================================================================
// SIKESUMA v3.1 · Development Log — Constants + Data
// ============================================================================
// File          : constants/devLog.ts
// Purpose       : Self-documenting development journal untuk transparansi
//                 antara successor (Ferry) dan predecessor (Sie Renbang
//                 original developer) tanpa kontak langsung.
// Update method : Edit file → commit → push → Vercel auto-deploy.
//                 Predecessor lihat live updates di production.
// Audit trail   : Setiap edit ke file ini ter-record di Git history
//                 (`git log -- constants/devLog.ts`) sebagai bukti
//                 kontribusi + timing untuk independent audit.
// ============================================================================

// ─── §1. Types ───────────────────────────────────────────────────────────────

export type DevLogType =
  | 'feature'      // New user-facing capability added
  | 'bugfix'       // Defect resolved
  | 'refactor'     // Code restructure, no functional change
  | 'schema'       // DB schema change
  | 'decision'     // Architectural / scope decision recorded
  | 'milestone'    // Sub-sequence or phase complete marker
  | 'docs'         // Documentation update
  | 'release';     // Production release marker

export type DevLogAuthor =
  | 'Sie Renbang (Original)'         // Pengembang asli proyek (v1.0 source)
  | 'Predecessor SS'                  // Spoke session predecessor AI assistants (SS-001/002/003)
  | 'Predecessor Step 2 v2'           // AI assistant yang handle Step 2 sequences
  | 'Predecessor Step 3 Kickoff'      // AI assistant yang prepare Step 3 bundle
  | 'Ferry (Successor)'               // User Ferry, current owner
  | 'AI Assistant Session A'          // Claude Opus 4.7 — Session A (S3.0/S3.1/S3.2)
  | 'AI Assistant Session B'          // Claude Opus 4.7 — Session B (S3.3-S3.6, future)
  | 'Stakeholder';                    // BPK, Itjenad, Karumkit input

export interface DevLogEntry {
  id:           string;       // unique stable id, format: 'log-YYYY-MM-DD-{slug}'
  date:         string;       // ISO date YYYY-MM-DD
  phase:        string;       // 'Phase 1', 'Phase 2 / SS-002', 'Step 3 / S3.0', etc.
  title:        string;       // one-liner summary (id-ID)
  type:         DevLogType;
  author:       DevLogAuthor;
  description:  string;       // multi-paragraph narrative (id-ID)
  files?:       string[];     // related files modified (path relatif)
  decisions?:   string[];     // decision references, e.g., '§S3.0-Path B-narrow'
  related?:     string[];     // related entry ids
}

// ─── §2. Type Color Mapping (untuk badge UI) ─────────────────────────────────

export const DEV_LOG_TYPE_META: Record<DevLogType, { label: string; color: string; icon: string }> = {
  feature:   { label: 'Fitur Baru',     color: 'emerald', icon: '✨' },
  bugfix:    { label: 'Perbaikan Bug',  color: 'rose',    icon: '🐞' },
  refactor:  { label: 'Refactor',       color: 'amber',   icon: '🔧' },
  schema:    { label: 'Skema DB',       color: 'blue',    icon: '🗄️' },
  decision:  { label: 'Keputusan',      color: 'violet',  icon: '🧭' },
  milestone: { label: 'Milestone',      color: 'indigo',  icon: '🏁' },
  docs:      { label: 'Dokumentasi',    color: 'stone',   icon: '📝' },
  release:   { label: 'Rilis',          color: 'pink',    icon: '🚀' },
};

// ─── §3. Project Metadata (untuk header section) ─────────────────────────────

export const PROJECT_METADATA = {
  name:        'SIKESUMA v3.1',
  description: 'Sistem Informasi Keuangan & Sumber Daya Medis · RS Tk.IV 02.07.03 Batin Tikal',
  liveURL:     'https://sikesumav31.vercel.app',
  repoURL:     'https://github.com/urrenbatik-cloud/SIKESUMAv3.1',
  startDate:   '2026-04-01',  // approximate v1.0 start
  currentPhase: 'Step 3 — Audit Log Foundation Complete, Session B Pending',
};

// ─── §4. Roadmap (Future Goals — Decision §F #1 Visibility) ──────────────────

export interface RoadmapItem {
  id:           string;
  goal:         string;       // short title
  detail:       string;       // longer description
  estimate:     string;       // effort, e.g., '~4-5 jam'
  priority:     'high' | 'medium' | 'low' | 'deferred';
  dependsOn?:   string[];     // other roadmap ids
}

export const ROADMAP: RoadmapItem[] = [
  // ─── Session B (Step 3 remaining) ─────────────────────────────────────────
  {
    id:       'S3.3',
    goal:     'RAB + RPD Persist',
    detail:   'Wire RAB (Rencana Anggaran Biaya) module + RPD (Rencana Penarikan Dana) module ke Supabase tables `rabs` + `rpds` (sudah dibuat di S3.1). Audit emission entity `rab` dan `rpd` sudah ter-define di taxonomy. Pattern follow pagu_sections (envelope JSONB).',
    estimate: '~4-5 jam',
    priority: 'high',
  },
  {
    id:       'S3.4',
    goal:     'Modul Kuitansi',
    detail:   'Module baru untuk track + print kuitansi (receipts dinas). Standalone, tanpa FK ke bills (per §C 5 schema decision D.4). Table `kuitansi` sudah ada. Need: UI design, print template, number generator pattern.',
    estimate: '~3-4 jam',
    priority: 'high',
  },
  {
    id:       'S3.5',
    goal:     'PNBP Setoran + Laporan Kemenkeu',
    detail:   'PNBP (Penerimaan Negara Bukan Pajak) — track setoran ke kas negara, eligibility calculator, generate Laporan Kemenkeu format. Most complex sub-seq Session B karena ada aggregation logic + export format. Tables `pnbp_setoran` + `pnbp_config` sudah ada.',
    estimate: '~6-8 jam',
    priority: 'high',
    dependsOn: [],
  },
  {
    id:       'S3.6',
    goal:     'Profil RS Editable',
    detail:   'Allow editing system_settings.rs_profile via Settings → tab "Profil RS" (currently placeholder). Quick win, ~1-2 jam. Foundation untuk future header rendering yang dynamic dari profile data.',
    estimate: '~1-2 jam',
    priority: 'high',
  },

  // ─── Phase 3 Hardening (post-Session B) ───────────────────────────────────
  {
    id:       'TD-1',
    goal:     'Refactor DoctorData + StaffData',
    detail:   'Latent architectural anti-pattern — same struktur internal sebagai ServiceLog (yang sudah di-fix di S3.0 wrapper). Currently safe karena BPJSModule passes full state. Refactor ke pattern Option B (child receives full list + filterFn) untuk eliminate fragility.',
    estimate: '~3-4 jam',
    priority: 'medium',
  },
  {
    id:       'TD-2',
    goal:     'Fix 7 Pre-existing TS Errors',
    detail:   'Object.entries/values + Record<K,V> typing limitations di App.tsx (7 lokasi). Vite skip type-check di build, jadi non-blocking. Tapi noisy di IDE + masks real errors. Mechanical fix dengan explicit casts.',
    estimate: '~1 jam',
    priority: 'medium',
  },
  {
    id:       'TD-3',
    goal:     'Multi-user Auth Migration',
    detail:   'Replace `"system-default"` user literal di audit_log dengan `auth.uid()`. Implement role-based RLS policies (admin/user/viewer). Phase 3 P3.1 scope.',
    estimate: '~4-6 jam',
    priority: 'medium',
  },
  {
    id:       'TD-4',
    goal:     'AuditLogViewer — Side-by-side Diff Viewer',
    detail:   'Upgrade detail modal dari plain JSON (Opsi A) ke side-by-side diff viewer (Opsi B) untuk update entries dengan before/after pairs. More readable untuk auditor.',
    estimate: '~2-3 jam',
    priority: 'low',
  },
  {
    id:       'TD-5',
    goal:     'AuditLogViewer — Export CSV',
    detail:   'Untuk audit reporting offline (BPK handover, periodic compliance reports). Generate CSV in-browser via papaparse, apply current filters.',
    estimate: '~1 jam',
    priority: 'low',
  },
  {
    id:       'TD-7',
    goal:     'Audit Log Retention Strategy',
    detail:   'Currently audit_log grows unbounded. Implement FIFO trim — delete entries older than 1 year (BPK audit horizon). Single SQL trigger atau Supabase cron function.',
    estimate: '~1 jam',
    priority: 'low',
  },

  // ─── De-scoped (Future Roadmap, requires user input) ──────────────────────
  {
    id:       'OOS-1',
    goal:     'BPJS Tariffs INA-CBG Editor',
    detail:   'Out-of-Scope Step 3. Currently BPJS tariffs read dari system_settings.bpjs_history (per period config). No master tariff library editor. Need product decision before implementation.',
    estimate: '~5-8 jam',
    priority: 'deferred',
  },
  {
    id:       'OOS-2',
    goal:     'Service Bills Concept',
    detail:   'POC architecture punya konsep service_bills sebagai entity terpisah dari bills. Tidak ter-translate clean ke v3.1 invoice flow. Need user input untuk re-design atau retire.',
    estimate: 'TBD',
    priority: 'deferred',
  },
  {
    id:       'OOS-3',
    goal:     'Payroll Full CRUD',
    detail:   'Currently hanya payroll_statuses (paid/unpaid flags). Full payroll record CRUD UI belum ada. Out-of-scope Step 3 per scope decision.',
    estimate: '~5-10 jam',
    priority: 'deferred',
  },
];

// ─── §5. Development Log Entries (newest first) ──────────────────────────────
//
// CONVENTION: Latest entries di atas. Saat add new entry, prepend ke array.
// Stable ids untuk cross-reference. Author field strict per DevLogAuthor union.
//
// Update schedule: edit setiap kali ada milestone, decision penting, atau
// observable change yang relevan untuk predecessor visibility.
// ============================================================================

export const DEV_LOG_ENTRIES: DevLogEntry[] = [
  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 — SESSION A (Ferry + AI Assistant, 7-8 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-08-devlog-init',
    date:  '2026-05-08',
    phase: 'Step 3 / Post-Session A',
    title: 'Inisialisasi Development Log untuk Transparansi Predecessor',
    type:  'docs',
    author: 'Ferry (Successor)',
    description:
`Membuat menu "Riwayat Pengembangan" di Settings supaya predecessor (Sie Renbang asli) bisa observe progress walaupun tidak kontak langsung.

**Konteks:** Successor dan predecessor tidak sering kontak langsung. Predecessor perlu cara passive untuk track:
- Versi log + historical changes
- Fitur ditambah + bug yang diatasi
- Next development goals (roadmap visibility)
- Decisions taken (kenapa pilih A vs B)

**Implementasi:**
- File data: \`constants/devLog.ts\` — static, version-controlled di Git
- Component: \`components/DevLogViewer.tsx\` — display dengan filter + roadmap
- UI: tab baru di SettingsModule (samping tab "Riwayat Aktivitas")
- Update workflow: edit file → commit → push → live di production

**Audit trail:** Setiap edit ke devLog.ts ter-record otomatis di \`git log\`. Predecessor bisa cross-check Git history dengan UI display.`,
    files: ['constants/devLog.ts', 'components/DevLogViewer.tsx', 'components/SettingsModule.tsx'],
  },

  {
    id:    'log-2026-05-08-s3_2_3',
    date:  '2026-05-08',
    phase: 'Step 3 / S3.2.3',
    title: 'Settings Module Shell + AuditLogViewer (S3.2.3)',
    type:  'milestone',
    author: 'AI Assistant Session A',
    description:
`Sub-sequence S3.2.3 selesai. **Sub-sequence S3.2 Audit Log Foundation: FULLY CLOSED.**

**Files:**
- NEW \`components/AuditLogViewer.tsx\` (469 baris) — filter (entity, action, date range), pagination 100/page, detail modal JSON, clear-all double-confirm
- NEW \`components/SettingsModule.tsx\` (141 baris) — full-page overlay dengan 4-tab (Audit live, Profil RS / BPJS / PNBP marked Soon)
- App.tsx (+21 baris) — gear icon di header, isSettingsOpen state, mount overlay

**Smoke test results:** 6/6 testable PASS. Test 5 (pagination) N/A karena <100 entries; Test 6 (clear-all) skipped reasonably (destructive).

**Decisions:**
- Settings entry: gear icon (Opsi A) — bukan tab utama
- Detail modal: pretty-print JSON (Opsi A) — Phase 3 upgrade ke side-by-side diff
- Clear-all: hard delete dengan double-confirm (Opsi A)`,
    files: ['components/AuditLogViewer.tsx', 'components/SettingsModule.tsx', 'App.tsx'],
    decisions: ['§S3.2-D1 Opsi A', '§S3.2-Detail Opsi A', '§S3.2-Clear Opsi A'],
    related: ['log-2026-05-08-s3_0', 'log-2026-05-08-s3_2_2'],
  },

  {
    id:    'log-2026-05-08-s3_0',
    date:  '2026-05-08',
    phase: 'Step 3 / S3.0',
    title: 'BPJSModule Reconcile Wrapper — Architectural Fix (Inserted)',
    type:  'bugfix',
    author: 'AI Assistant Session A',
    description:
`Pre-existing v3.1 architectural anti-pattern di-discover saat smoke test S3.2.2 dan di-fix.

**Bug:** Saat user edit 1 claim di filtered view (e.g., BPJS Mei 2025), audit log emit \`bulk_update\` dengan \`removed: 57\` palsu. Root cause: BPJSModule.tsx:104 passes \`filteredLogs\` (subset) sebagai \`logs\` prop ke ServiceLog, tapi juga passes \`props.onLogsChange\` (full setter dari App.tsx). ServiceLog modify subset lalu call setter → App.tsx state direplace dengan subset → audit diff sees 57 phantom "removed".

**Severity:** MEDIUM (state corruption only, DB safe karena patient_claims upsert-only — tidak ada data loss aktual).

**Fix:** Tambahkan \`handleFilteredLogsChange\` reconcile wrapper di BPJSModule yang merge filtered subset back ke full list via 3-step merge:
1. Items dalam filter window: replace dengan modified values atau drop
2. Items di luar filter window: preserve as-is (THE FIX)
3. New items: append

**Validation:** 10/10 behavioral tests pass + live verification. Audit entry post-fix: \`{ action: "update", snapshot: { 5 fields with before/after } }\` — clean.

**Latent issue:** DoctorData.tsx + StaffData.tsx punya struktur internal sama. Currently safe karena BPJSModule passes full state. Defer ke Phase 3 P3.x cleanup (TD-1 di roadmap).`,
    files: ['components/BPJSModule.tsx'],
    decisions: ['§S3.0-Path B-narrow', 'Predecessor MEMO §4.2 verified'],
    related: ['log-2026-05-08-memo-s3_0'],
  },

  {
    id:    'log-2026-05-08-memo-s3_0',
    date:  '2026-05-07',
    phase: 'Step 3 / S3.0',
    title: 'Memo S3.0 Architectural Fix dari Predecessor',
    type:  'decision',
    author: 'Predecessor Step 2 v2',
    description:
`Predecessor session sebelumnya (yang prepare Step 3 kickoff bundle) reply dengan memo \`MEMO_S3_0_ARCHITECTURAL_FIX.md\` setelah successor (Session A) discover phantom-57 anomaly.

**Memo content:**
- Acknowledge forensic debugging quality (math invariants approach)
- Re-assess severity: bukan MEDIUM saja, audit log integrity = HIGH (Step 3 PRIMARY feature compromised kalau false-positive shipping)
- Recommend insert sub-sequence S3.0 sebelum lanjut S3.2.3
- Provide investigation checklist (§4.1 ghost cleanup, §4.2 module inventory) + fix patterns (Option A reconcile in parent, Option B refactor child)

**Successor decision:** Path B-narrow — apply wrapper di BPJSModule only (~1.5 jam), defer 2 latent (DoctorData, StaffData) ke Phase 3.

**Outcome:** Memo's recommendation honored, scope manageable, audit log accuracy restored.`,
    files: ['reference/MEMO_S3_0_ARCHITECTURAL_FIX.md'],
    decisions: ['§S3.0-Path B-narrow approved'],
  },

  {
    id:    'log-2026-05-07-s3_2_2',
    date:  '2026-05-07',
    phase: 'Step 3 / S3.2.2',
    title: 'App.tsx Audit Wire — 12 Sync-Time Emission Points',
    type:  'feature',
    author: 'AI Assistant Session A',
    description:
`Wire 12 audit emission points ke syncToCloud function dengan diff-based sync-time logging (Decision §F #9).

**Architecture:** \`prevSnapshotRef\` baseline ditandai di akhir loadData. Saat syncToCloud, per-entity diff vs baseline → push ke \`auditBuffer\`. Bulk insert \`logAuditEntries\` di finally block (best-effort, error-swallowed).

**12 emission points:**
- 9 collections: pagu_sections, bills, patient_claims, doctors, employees, revenue_targets, specialty_targets, payroll_statuses (Record→Array), jasa_verification_files (Record→Array filtered)
- 3 configs: bpjs_history, jasa_map, pagu_lock (boolean wrapped)

**Result:** App.tsx 721 → 932 baris (+211). 0 new TypeScript errors. Existing partial-failure resilience preserved.

**Discovery:** Smoke test reveal phantom 57 removed → trigger S3.0 architectural detour.`,
    files: ['App.tsx'],
    decisions: ['§F #9 sync-time logging', '§S3.2-D2 reuse v3.1 ID gen', '§S3.2-D3 useRef'],
    related: ['log-2026-05-08-s3_0'],
  },

  {
    id:    'log-2026-05-07-s3_2_1',
    date:  '2026-05-07',
    phase: 'Step 3 / S3.2.1',
    title: 'TypeScript Port — constants/audit.ts + lib/audit.ts',
    type:  'feature',
    author: 'AI Assistant Session A',
    description:
`Port POC audit functions ke v3.1 TypeScript dengan strict types.

**Files:**
- \`constants/audit.ts\` (139 baris) — 23 entities (17 POC + 6 v3.1-specific) + 10 actions + helpers (\`getAuditEntityLabel\`, \`getAuditActionMeta\`)
- \`lib/audit.ts\` (387 baris) — \`generateAuditId()\`, \`diffCollectionForAudit()\`, \`diffObjectForAudit()\`, \`logAuditEntries()\`

**Decision:** Coverage Opsi B (full coverage §F #1 — 23 entities total). 6 v3.1-specific tambahan: revenueTarget, specialtyTarget, payrollStatus, jasaFile, jasaConfig, paguLock.

**ID format revised:** \`audit-{Date.now()}-{base36-6}\` (bukan POC's YYYYMMDDhhmmss). Reuse v3.1 existing pattern \`Math.random().toString(36).slice(2,8)\` + \`Date.now()\` prefix.

**Tests:** 26/26 behavioral tests pass.`,
    files: ['constants/audit.ts', 'lib/audit.ts'],
    decisions: ['§S3.2-Coverage Opsi B', '§S3.2-D2 ID format'],
  },

  {
    id:    'log-2026-05-07-s3_1',
    date:  '2026-05-07',
    phase: 'Step 3 / S3.1',
    title: 'Schema Setup — 5 Tables Baru + RLS + Seeds',
    type:  'schema',
    author: 'AI Assistant Session A',
    description:
`5 tabel baru dibuat di Supabase canonical project untuk support Step 3 features.

**Tables created (envelope JSONB pattern):**
- \`audit_log\` — audit trail primary deliverable, dengan index \`audit_log_created_at_desc_idx\`
- \`rabs\` — untuk S3.3 RAB persist
- \`rpds\` — untuk S3.3 RPD persist
- \`kuitansi\` — untuk S3.4 Kuitansi module
- \`pnbp_setoran\` — untuk S3.5 PNBP module

**RLS:** PERMISSIVE ALL untuk semua role (POC). Phase 3 P3.1 akan replace dengan role-based.

**Seeds (system_settings KV):**
- \`rs_profile\` (218 bytes) — POC values
- \`pnbp_config\` (94 bytes) — eligibleCategories=["Umum","IKS"], includeServiceBills=false, onlyPaidClaims=false

**Schema drift discovery:** \`system_settings\` actual = 3-col KV (\`{key, value, updated_at}\`), bukan 6-col envelope seperti yang awalnya di-handover. Adjusted: 2 INSERT seeds pakai (key, value) + ON CONFLICT.

**Verification:** 9 verify queries pass.`,
    files: ['s3_1/*.sql (17 SQL files)'],
    decisions: ['§C 5 schema decisions D.1-D.5'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3 KICKOFF (Predecessor, 7 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-07-step3-kickoff',
    date:  '2026-05-07',
    phase: 'Step 3 / Kickoff',
    title: 'Step 3 Kickoff Bundle — Audit Log Scope + 5 Decisions',
    type:  'docs',
    author: 'Predecessor Step 3 Kickoff',
    description:
`Predecessor prepare Step 3 kickoff bundle (\`SIKESUMA_STEP_3_KICKOFF_BUNDLE.zip\`) dengan handover doc v1.4 + current source code v3.1 post-Step-2.

**5 features in scope Step 3:**
1. Audit log + Riwayat Aktivitas UI (PRIMARY)
2. RAB + RPD persist
3. Kuitansi printing
4. PNBP setoran + Laporan Kemenkeu
5. Profil RS editable

**Out of scope:** Payroll full CRUD, BPJS Tariffs INA-CBG, Service Bills.

**§C 5 schema decisions D.1-D.5 approved:**
- Envelope JSONB untuk transactional tables
- Audit ID format YYYYMMDDhhmmss-N (later revised di S3.2.1)
- Kuitansi standalone (no FK to bills)
- system_settings KV untuk rs_profile + pnbp_config

**§F 10 open questions defaults all approved**, terutama #9 sync-time logging dan #10 label "Riwayat Aktivitas" sub-tab di Settings.

**Session split:** Session A (S3.0+S3.1+S3.2) + Session B (S3.3+S3.4+S3.5+S3.6).`,
    files: ['SIKESUMA_STEP_3_KICKOFF_BUNDLE.zip'],
    decisions: ['§C D.1-D.5', '§F #1-#10 defaults'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2 v2 (Predecessor, ~Apr-Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-06-step2-v2-seq4',
    date:  '2026-05-06',
    phase: 'Step 2 v2 / Sequence 4',
    title: 'F3.6 v2 Revenue Calc Fixes + Toast UI Final Polish',
    type:  'feature',
    author: 'Predecessor Step 2 v2',
    description:
`Sequence 4 finalisasi Step 2 v2:
- F3.6 v2 — Revenue calc fixes (multiple categorization edge cases)
- Toast UI final polish (per-entity error context, granular partial-failure handling)
- F3.6 v2 — RevenueModule patches`,
    files: ['components/RevenueModule.tsx', 'components/Toast.tsx'],
  },

  {
    id:    'log-2026-05-06-step2-v2-seq3',
    date:  '2026-05-06',
    phase: 'Step 2 v2 / Sequence 3',
    title: 'F3.x Sequences (Revenue + Visualization)',
    type:  'feature',
    author: 'Predecessor Step 2 v2',
    description:
`Sequence 3 fokus ke F3.x — revenue dashboard, charts, KPI cards.`,
  },

  {
    id:    'log-2026-05-06-step2-v2-seq2',
    date:  '2026-05-06',
    phase: 'Step 2 v2 / Sequence 2',
    title: 'F2.x Sequences — Pagu Multi-year + Payroll + Jasa Files + Toast',
    type:  'feature',
    author: 'Predecessor Step 2 v2',
    description:
`Sequence 2 implementasi:
- **F2.0** — Pagu sections multi-year support (id pattern \`pagu-{year}-{slug}\` cross-year unique)
- **F2.1** — Payroll statuses dengan zero-padded month key (\`YYYY-MM-personId\`) untuk avoid Watchpoint v1.0 #6
- **F2.2** — Jasa verification files: 1 row per period (\`jvf-YYYY-MM\`), data = { tks, nakes, pengelola }, dengan v2.1 ghost cleanup pattern
- **F2.4** — Toast UI v2 dengan per-entity error context di syncToCloud catch block`,
    files: ['App.tsx', 'components/Toast.tsx', 'components/PayrollSummary.tsx', 'components/ServiceBillRecap.tsx'],
  },

  {
    id:    'log-2026-05-06-step2-v2-seq1',
    date:  '2026-05-06',
    phase: 'Step 2 v2 / Sequence 1',
    title: 'F1.0 Schema Konsolidasi — Drop 18 Grup B Tables',
    type:  'schema',
    author: 'Predecessor Step 2 v2',
    description:
`Schema konsolidasi besar di Sequence 1:
- **F1.0** — Drop 18 "Grup B" tables (legacy v3.0/POC duplicates yang coexist sebagai dual schema)
- **F1.0.5** — RLS fix untuk surviving 9 transactional tables + system_settings + auth tables
- **F1.1** — Wire revenue_targets ke Supabase (was DUMMY hardcoded)
- **F1.2** — Wire specialty_targets ke Supabase

**Hasil:** 27 tables → 9 surviving + system_settings = 10 tables stabilized untuk Step 3 baseline.

**Catatan untuk successor:** Drop ini critical — kalau dual-schema masih coexist, audit log baru di Step 3 akan ambigu (claim mana yang di-track? \`patient_claims\` atau \`claims\`?).`,
    files: ['App.tsx', 'multiple SQL migrations'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 2 (Predecessor SS, 6 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-06-ss003',
    date:  '2026-05-06',
    phase: 'Phase 2 / SS-003',
    title: '4 Bugs Fixed — Full CRUD Cycle Verified Working',
    type:  'bugfix',
    author: 'Predecessor SS',
    description:
`SS-003 menyelesaikan Phase 2 (database integration) dengan fix 4 bugs di v3.1 source:
- **Bug #1:** \`loadData()\` parsing wrong (asumsikan kolom top-level yang tidak ada)
- **Bug #2:** \`syncToCloud()\` write ke kolom yang tidak ada → HTTP 400
- **Bug #3:** doctors/employees not loaded (missing dari loadData)
- **Bug #4:** \`id\` hilang saat unwrap envelope JSONB

**Schema reality confirmed:** Pure envelope JSONB \`{id text PK, data jsonb, audit cols}\` — semua field business di dalam \`data\` JSONB. Tidak ada kolom auxiliary.

**Verification:** Full CRUD cycle tested working (Load + Edit + Save + Refresh = data persisted ✅).

**Status sistem post-SS-003:** Phase 2 SELESAI — App fully functional dengan database persistence.`,
    files: ['App.tsx', 'lib/supabase.ts'],
  },

  {
    id:    'log-2026-05-06-ss002',
    date:  '2026-05-06',
    phase: 'Phase 2 / SS-002',
    title: 'Discovery — Dual Schema Coexist + 27 Tables',
    type:  'docs',
    author: 'Predecessor SS',
    description:
`SS-002 melakukan verifikasi state Supabase canonical project:
- **27 tabel** ditemukan di project \`qjijsftbytozcoyrtric\`
- Dual schema coexist: v3.0 (\`claims\`, \`sections\`) + v1.0 (\`patient_claims\`, \`pagu_sections\`)
- \`audit_log\` (8 kol legacy dengan auto-trigger) ditemukan — later di-drop di Step 2 v2 F1.0
- 2 project Supabase: #1 \`qjijsftbytozcoyrtric\` (canonical, dipilih) + #2 \`bddncaahyxkjozresvvg\` (terpisah, di-archive)

**Implication:** v3.1 source code asumsikan kolom top-level yang tidak ada — explain Bug #1-#2 di SS-003.`,
    files: ['SIKESUMA-AUDIT-HANDOVER-v1.3.md'],
  },

  {
    id:    'log-2026-05-06-ss001',
    date:  '2026-05-06',
    phase: 'Phase 2 / SS-001',
    title: 'Schema Generation — 27 Tabel Awal',
    type:  'schema',
    author: 'Predecessor SS',
    description:
`SS-001 generate schema awal Supabase. 27 tabel dibuat dengan envelope JSONB pattern. Termasuk:
- 14 entity tables + profiles + audit_log + system_settings (16+ utama)
- Plus duplicates dari evolusi schema v3.0 → v1.0`,
    files: ['multiple SQL migration files'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // PHASE 1 (Sie Renbang Original, ~Apr 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-04-original-v3_1',
    date:  '2026-04-15',
    phase: 'Phase 1',
    title: 'Build v3.1 — TypeScript + Vercel + Supabase Migration',
    type:  'milestone',
    author: 'Sie Renbang (Original)',
    description:
`Pengembang asli (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal, supervisi Karumkit) memulai migrasi dari v1.0 TypeScript AI Studio ke v3.1 (Vercel + Supabase production).

**Lineage (per Spoke A v1.3 reframing):**
- **v1.0 TypeScript AI Studio** — Sie Renbang's original build (code rich, save broken, trigger migrasi)
- **v2.3 Claude Artifact** — first migration attempt, CANCELLED
- **v3.0 Vite + Supabase scaffold** — second attempt (only 2 of 14 modules ported), CANCELLED
- **v3.1 TypeScript + Vercel + Supabase** — Sie Renbang start, Ferry selesaikan

**Status saat Sie Renbang hand-off:** Phase 1 selesai (UI + types + components di GitHub), tapi save ke Supabase broken karena schema mismatch (Bug #1-#4 nanti di-fix di SS-003).`,
  },

  {
    id:    'log-2026-04-original-v1_0',
    date:  '2026-04-01',
    phase: 'Phase 0',
    title: 'Build v1.0 — Original SIKESUMA / RKKS Digital di AI Studio',
    type:  'milestone',
    author: 'Sie Renbang (Original)',
    description:
`Pengembang asli build SIKESUMA v1.0 di Google AI Studio (aistudio.google.com) sebagai proyek internal RS Tk.IV 02.07.03 Batin Tikal di bawah supervisi Karumkit.

**Skala data target (per audit handover v1.3):**
- 369 klaim pasien Q1 2026 (Januari–Maret), total Rp 1.902.647.100
- 16 dokter spesialis aktif
- ~30-100 staf RS
- Daftar mata anggaran ~6-30 row tergantung tahun
- Rekap bulanan ~120 klaim/bulan rata-rata

**Modules:** Pagu anggaran (RKKS), klaim BPJS/Umum/IKS, tagihan operasional, payroll, PNBP, BPJS tariffs INA-CBG.

**Status:** Code complete, save trigger v1.0 → v3.1 migration karena AI Studio limitation.`,
  },
];

// ─── §6. Helpers ──────────────────────────────────────────────────────────────

/** Get latest N entries (sorted by date desc, then by array order). */
export function getLatestEntries(n: number = 10): DevLogEntry[] {
  return [...DEV_LOG_ENTRIES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, n);
}

/** Filter entries by type. */
export function filterByType(type: DevLogType | 'all'): DevLogEntry[] {
  if (type === 'all') return DEV_LOG_ENTRIES;
  return DEV_LOG_ENTRIES.filter((e) => e.type === type);
}

/** Aggregate stats untuk header summary. */
export function getDevLogStats() {
  const byType: Record<DevLogType, number> = {
    feature: 0, bugfix: 0, refactor: 0, schema: 0,
    decision: 0, milestone: 0, docs: 0, release: 0,
  };
  const authorsSet = new Set<string>();
  for (const entry of DEV_LOG_ENTRIES) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
    authorsSet.add(entry.author);
  }
  const dates = DEV_LOG_ENTRIES.map((e) => e.date).sort();
  return {
    totalEntries:    DEV_LOG_ENTRIES.length,
    byType,
    contributorsCount: authorsSet.size,
    contributors:    Array.from(authorsSet),
    earliestDate:    dates[0],
    latestDate:      dates[dates.length - 1],
  };
}
