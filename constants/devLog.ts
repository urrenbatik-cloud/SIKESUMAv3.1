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
  | 'Sie Renbang (Original)'             // Pengembang asli proyek (v1.0 source)
  | 'Predecessor SS'                      // Spoke session predecessor AI assistants (SS-001/002/003)
  | 'Predecessor Step 2 v2'               // AI assistant yang handle Step 2 sequences
  | 'Predecessor Step 3 Kickoff'          // AI assistant yang prepare Step 3 bundle
  | 'Ferry (Successor)'                   // User Ferry, current owner
  | 'AI Assistant Session A'              // Claude Opus 4.7 — Session A (S3.0/S3.1/S3.2)
  | 'AI Assistant Session B'              // Claude Opus 4.7 — Session B (S3.3-S3.6, future)
  | 'AI Assistant (Successor Session)'    // Claude Opus 4.7 — generic successor session (Step 5, Tier 3/4)
  | 'Stakeholder';                        // BPK, Itjenad, Karumkit input

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
  // ─── Session B remaining (Step 3) ─────────────────────────────────────────
  // S3.3 + S3.6 sudah LIVE via B.1 (8 Mei 2026). Lihat DEV_LOG_ENTRIES
  // entry 'log-2026-05-08-b1-launch' untuk detail.
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

  // ─── Step 5 — Decision Support Module untuk Adaptive Planning ─────────────
  // Origin: Sie Renbang verbal clarification 8 Mei 2026. Audit_log akan dipakai
  // untuk justifikasi pengajuan revisi pagu sebelum masa pagu berakhir
  // (trigger-based, bukan time-based — trigger = gejala deviasi mulai muncul).
  // Phasing Opsi B+ adaptive: sisip 5.1 setelah B.1, lanjut B.2/B.3 paralel
  // dengan 5.2. Lihat 'log-2026-05-08-b1-launch' untuk konteks lengkap.
  {
    id:       'S5.1',
    goal:     'Reasoning Capture di audit_log',
    detail:   'Add fields: reasoning (string, free-text), reasoningCategory (enum extensible — initial: kebutuhan_darurat, pertumbuhan_pasien, perubahan_kebijakan, harga_pasar, salah_input, lainnya), dynamicsFactor (free-text "faktor ketiga" eksternal: wabah, kebijakan Pusat, fluktuasi harga, redistribusi pasien antar RS), isReviewed, reviewedAt, reviewedBy. Stored di JSONB envelope, optional fields. Reasoning categories di-store di system_settings.reasoning_categories supaya Sie Renbang bisa adjust via Settings.',
    estimate: '~2-3 jam',
    priority: 'high',
  },
  {
    id:       'S5.2',
    goal:     'Audit Review UI',
    detail:   'New tab di Settings: "Tinjauan Audit". List unreviewed audit entries dengan reasoning input form (textarea + category dropdown + dynamics field). Backfill capability: existing entries (created sebelum 5.1 deploy) bisa di-review later. Mark-as-reviewed untuk filter.',
    estimate: '~4-6 jam',
    priority: 'high',
    dependsOn: ['S5.1'],
  },
  {
    id:       'S5.3',
    goal:     'Deviation Dashboard',
    detail:   'New sub-tab di Pelaporan: "Analisa Deviasi". Per pos anggaran tampilkan: Pagu YTD vs Realisasi YTD vs RPD YTD, % terpakai vs % waktu (severity color), trend mini-chart per bulan, drill-down ke audit entries reviewed. Butuh Realisasi data complete (Session B selesai).',
    estimate: '~6-8 jam',
    priority: 'high',
    dependsOn: ['S3.3', 'S3.5', 'S5.2'],
  },
  {
    id:       'S5.4',
    goal:     'Early Warning Engine',
    detail:   'Pattern-based, BUKAN time-based. Sinyal trigger: deviasi RPD vs Realisasi > 20% di pos manapun (configurable di Settings), burn rate Pagu > 1.5× % waktu, trend 3 bulan over-spend di pos sama, kategori kebutuhan_darurat ≥ 2× di 30 hari. Notification via Komunikasi feature (kirim ke role bendahara + successor + karumkit). Threshold semua configurable di Settings → "Konfig Warning".',
    estimate: '~3-4 jam',
    priority: 'medium',
    dependsOn: ['S5.3'],
  },
  {
    id:       'S5.5',
    goal:     'Revision Proposal Generator',
    detail:   'Output tombol "Generate Draft Revisi Pagu" di Tab Pelaporan. Aggregate semua reviewed audit entries dalam window (default 6 bulan, adjustable), group by pos, generate text template proposal dengan kumpulan reasoning + dynamics factor sebagai justifikasi. Output sebagai .docx via skill-docx.',
    estimate: '~4-6 jam',
    priority: 'medium',
    dependsOn: ['S5.2'],
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
  {
    id:       'TD-18',
    goal:     'RAB Snapshot Baseline Misalignment First-Sync',
    detail:   'Cosmetic audit issue first-sync after deploy: rabCategories initial state = INITIAL_RAB_CATEGORIES (DUMMY data dengan ID `rab-sec-jasa` style). loadData snapshot capture this dummy state karena DB rabs masih kosong. Lalu useEffect line 846 re-map IDs ke year-prefixed (`rab-pagu-{year}-{slug}`) setelah pagu loaded. First sync diff hasilkan `+4 baru, −4 hapus` (false delete + create). DB state correct, hanya audit description "dramatic". Subsequent syncs clean karena prevSnapshotRef.rabs = DB state. Fix: change initial value `let snapshotRabs = rabCategories` jadi `let snapshotRabs: RABCategory[] = []` di App.tsx loadData. Same fix mungkin applicable ke pagu kalau ada similar mismatch. Detected via Test 2 smoke test B.1 (8 Mei 2026).',
    estimate: '~30 menit',
    priority: 'low',
  },

  // ─── Komunikasi & Diskusi Hardening (TD-13..TD-17) ────────────────────────
  // Ditambahkan post-Komunikasi launch (8 Mei 2026). Lihat DEV_LOG_ENTRIES
  // entry 'log-2026-05-08-komunikasi-launch' untuk konteks fitur.
  {
    id:       'TD-13',
    goal:     'Komunikasi — Real Auth Migration',
    detail:   'Replace trust-based identity dropdown dengan Supabase Auth real verification. Currently localStorage-stored {role, name} bisa di-tamper user (read-only di UI tapi devtool accessible). Akan reuse infrastructure dari TD-3 untuk audit_log.user. Existing discussions + messages preserve attribution (immutable historical record).',
    estimate: '~2-3 jam',
    priority: 'medium',
    dependsOn: ['TD-3'],
  },
  {
    id:       'TD-14',
    goal:     'Komunikasi — Email Notifications',
    detail:   'Email digest harian/mingguan ke stakeholder yang punya unread di discussions yang mereka participate. Butuh Supabase Edge Function + email provider (SendGrid/Resend). User opt-in via Settings → preferences. Templating: list of new messages per discussion + click-through link ke production app.',
    estimate: '~4-6 jam',
    priority: 'low',
  },
  {
    id:       'TD-15',
    goal:     'Komunikasi — Realtime Updates',
    detail:   'Replace polling + manual refresh dengan Supabase Realtime channel subscription untuk phase_messages INSERTs. Auto-prepend new messages ke open thread, auto-update unread badge tanpa user action. Storage cost minimal (small payloads). Akan eliminate Refresh button kebutuhan.',
    estimate: '~2-3 jam',
    priority: 'low',
  },
  {
    id:       'TD-16',
    goal:     'Komunikasi — Storage Retention + Quota Monitoring',
    detail:   'Worst case 25 MB × 5 attachments × 100 messages = 12.5 GB > 5 GB Supabase free tier. Implement: (a) auto-orphan cleanup saat discussion archived/deleted (cascade ke storage objects), (b) dashboard widget untuk monitor storage usage real-time, (c) optional retention policy 1 tahun match BPK audit horizon. Share infrastructure dengan TD-7 audit retention.',
    estimate: '~2-3 jam',
    priority: 'medium',
    dependsOn: ['TD-7'],
  },
  {
    id:       'TD-17',
    goal:     'Komunikasi — Per-Discussion Unread Granularity',
    detail:   'Currently MVP unread = single global last_read timestamp di localStorage. Upgrade ke per-discussion last_read map (sudah punya optional field di ReadState type). Effect: badge count per-card lebih akurat (sekarang false-positive kalau user baca diskusi A tapi belum diskusi B — both flagged unread sampai global timestamp updated). Juga add gear icon badge breakdown ("3 baru di 2 diskusi") via tooltip.',
    estimate: '~1-2 jam',
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
  // SSOT REFACTOR — Tier 3 + Tier 4 + Tier 5 (11-13 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════
  // Workstream paralel terhadap Step 3/5/6. Tier 3-6 fokus ke validasi
  // Revisi POK kewenangan KPA per Perdirjen Renhan Kemhan 7/2025. Lihat
  // SSOT-REFACTOR-LOG.md §0.8 (Tier 3) + §0.9 (Tier 4a) + §0.10 (Tier 4b)
  // + §0.11 (Tier 4c) + §0.12 (Tier 5) untuk full decision log.

  {
    id:    'log-2026-05-13-ts-baseline-cleanup',
    date:  '2026-05-13',
    phase: 'Maintenance / Type Baseline Cleanup',
    title: 'TS Baseline Cleanup — 8 errors → 0 (commit 999a46f)',
    type:  'refactor',
    author: 'AI Assistant (Successor Session)',
    description:
`Candidate D dari post-Tier-5a work candidates Owner-selected 13 Mei 2026 dini hari (Sie Renbang busy rikkes Secaba, Vercel dashboard sudah reaccess). Pure type-narrowing maintenance — NO runtime behavior change.

**Root cause:** TS5 quirk dengan \`Object.entries()\` pada \`Record<K, V>\` types dan index signature types — infer \`[string, unknown][]\` alih-alih \`[string, V][]\`. Tidak terkait \`strict\` flag (tsconfig tidak punya). Pattern workaround sudah exist di codebase sejak Tier 4 era (App.tsx line 303 + 661 cast \`Object.values(dataByYear) as PaguSection[][]\`, line 894 destructure cast tks/nakes/pengelola).

**Fix scope (2 files, 16 lines net):**

| File | Site | Errors fixed | Cast applied |
|---|---|---|---|
| App.tsx | line 636 (\`sections.forEach\`) | 1 | \`as [string, PaguSection[]][]\` |
| App.tsx | line 867 jvfEntries filter + line 879 emptyPeriodKeys filter | 6 (tks/nakes/pengelola × 2) | \`as [string, JvfPeriod][]\` dengan local type alias \`type JvfPeriod = JasaVerificationFiles[string]\` |
| components/PaguAnggaran.tsx | line 512 \`sectionNames.join(' & ')\` | 1 | \`as [string, string[]][]\` |

Inline cast pattern dipilih daripada helper function untuk konsistensi dengan existing convention di App.tsx. Comment marker \`[TS-cleanup 13 Mei 2026]\` di-attach untuk traceability di future audits.

**Baseline:**
- TS errors: **8 → 0** ✅ (target achieved)
- Vitest: 610 pass (unchanged — pure type narrowing has zero runtime impact)
- Vite build: success ~6s, bundle size identical 1.6MB minified
- Working directly di main per OWNER-POLICY §B (low-risk cleanup, no schema/feature change)

**Tidak ada follow-up needed.** Baseline 0 sekarang going-forward target — fresh AI session di Phase 5b/Tier 6 nanti harus preserve baseline 0 atau ada justifikasi explicit.`,
    files: [
      'App.tsx',
      'components/PaguAnggaran.tsx',
      'HANDOVER.md',
      'SESSION-START-HERE.md',
      'constants/devLog.ts',
    ],
    decisions: [
      'Inline cast pattern (bukan helper function) untuk konsistensi codebase',
      'Working directly di main (low-risk cleanup, NO feature branch needed)',
      'Local type alias JvfPeriod = JasaVerificationFiles[string] untuk readability',
      'Baseline 0 sekarang going-forward expectation — preserve di future tier work',
    ],
    related: [
      'log-2026-05-13-tier-5a-merged-to-main',
    ],
  },

  {
    id:    'log-2026-05-13-tier-5a-merged-to-main',
    date:  '2026-05-13',
    phase: 'SSOT Refactor / Tier 5a / Phase 4 — Squash Merge to Main',
    title: 'Tier 5a MERGED TO MAIN — Audit Trail Backend Complete (squash commit d55f0d0)',
    type:  'release',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 5a (Audit Trail Backend untuk Revisi POK kewenangan KPA) full stack merged ke main sebagai squash commit \`d55f0d0\`. Owner E2E test PASSED 13 Mei 2026 (4-check smoke: banner toggle / persisted state / uncheck persist / tied audit Submit) di Vercel Preview URL untuk feature/tier-5a-audit-trail-backend.

**Scope merged (8 commits consolidated):**
- Phase 1.5 DDL (3 tabel + RLS + R7c trigger LIVE di Supabase, commit \`b834415\` + \`06acf47\`)
- Phase 2.1+2.2 Types + State machine (commit \`8ad4e40\`, 46 tests)
- Phase 2.3 Service layer (commit \`4990059\`, 41 tests)
- Phase 2.4 Submit flow UI integration (commit \`958e426\`, 25 tests)
- Phase 2.5 LHR APIP R3c migration + Banner V1 (commit \`93d9155\`, 12 tests)
- Plus 3 docs commits (\`05a4ac3\`, \`b7f4164\`, \`fedfca5\`, \`aa53c3e\`)

**Baseline post-merge:**
- main HEAD: \`d55f0d0\` (2 commits ahead of production)
- Tests: **610 pass** (486 prior + 124 Tier 5a)
- TS errors: 8/8 maintained (7 App.tsx + 1 PaguAnggaran.tsx — pre-existing, not regression)
- Vite build: success ~8.8s, 1.6MB minified

**Cleanup post-merge (pattern Tier 4a/4b/4c):**
- ✅ feature/tier-5a-audit-trail-backend DELETED (local + remote, 13 Mei 2026)

**Branches summary:**
- main: \`d55f0d0\` (Tier 5a MERGED, Vercel Preview environment)
- production: \`90a0278\` (Tier 4c, Vercel Production deployment — **belum ada Tier 5**, awaiting Owner promotion decision)

**Next work candidates (Owner pilih sebelum AI mulai):**
- (A) Production promotion main → production (Owner-driven, trivial 1-click via Vercel Dashboard)
- (B) Tier 5b audit trail viewer UI tab (R8c partition 2, fresh AI session)
- (C) Tier 6 Template SK Revisi POK generator (fresh AI session)
- (D) TS error cleanup 8 → 0 (minor, 1-2 turns)`,
    files: [
      'main branch squash commit d55f0d0',
      'HANDOVER.md',
      'SESSION-START-HERE.md',
      'constants/devLog.ts',
    ],
    decisions: [
      'Tier 5a MERGED via squash merge (1 commit per tier per branching strategy)',
      'Feature branch DELETED post-merge (cleanup pattern Tier 4a/4b/4c)',
      'Production promotion DEFERRED — separate Owner-driven decision (v3.2 strategy)',
      'Owner E2E test 4-check pattern proven — repeat untuk Tier 5b + Tier 6 future merges',
    ],
    related: [
      'log-2026-05-13-tier-5a-phase-2.5-lhr-apip-r3c-complete',
      'log-2026-05-12-tier-5a-phase-2.4-submit-flow-complete',
    ],
  },

  {
    id:    'log-2026-05-13-tier-5a-phase-2.5-lhr-apip-r3c-complete',
    date:  '2026-05-13',
    phase: 'SSOT Refactor / Tier 5a / Phase 2.5 — LHR APIP R3c Migration',
    title: 'Tier 5a Phase 2.5 COMPLETE — LHR APIP R3c Persistence + Tied Audit + Banner V1 (commit 93d9155)',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Phase 2.5 deliverable per docs/TIER-5-DESIGN.md §3.3 + §5 + PHASE-2-BACKEND-API-REFERENCE.md Recipe D + E. Strategy A (V1 minimal) per Owner-decision 13 Mei 2026 — checkbox-only UX, placeholder tied audit values, forward-compat ke Strategy B richer V2.

**Three deliverables Phase 2.5:**

1. **R3c Global Persistence** — \`lhrApipAcknowledgedByYear\` state shape migrate dari \`Record<number, boolean>\` ke \`LhrApipGlobalState\` (per-year entry dengan acknowledged + acknowledged_at + optional V2 nomor/tanggal). Load on mount via \`getSetting<LhrApipGlobalState>('lhr_apip_global')\` (existing helpers di lib/supabase.ts:194-207). Save on checkbox change via \`saveSetting\` — best-effort error handling (banner V1 re-show kalau save fail). JSONB-native AP-8 — TIDAK tambah service module baru, pakai existing system_settings pattern.

2. **R3c Tied Audit** — \`deriveLhrApipForSubmission(state, year)\` pure helper derive \`UsulanLhrApip\` payload (Strategy A placeholder: nomor="(belum diisi)", tanggal=acknowledged_at.slice(0,10), acknowledged_at). \`executeSubmitRevisiPOK\` extended args accept \`lhrApipForYear?: UsulanLhrApip\` — kalau provided, populate \`usulan_revisi.data.lhr_apip\` saat \`createUsulanDraft\` call. Itjenad audit trail: "Usulan X memang acknowledge LHR Y pada tanggal Z saat Submit".

3. **Banner V1 UI** (R4a Owner choice — text-only, no link) — di top \`<ValidasiRevisiPOK>\` (sebelum ValidationDashboardHeader). Conditional \`{!lhrApipAcknowledged && ...}\` — amber color scheme, alert role + aria-live=polite, citation Pasal 22 huruf b angka 2 Perdirjen Renhan Kemhan 7/2025. Predicate inline (consume existing \`lhrApipAcknowledged: boolean\` prop yang sudah carry info, tidak butuh extra prop).

**Files MOD (4):**

- \`utils/submitRevisiHelpers.ts\` (+137 lines): NEW types \`LhrApipYearEntry\` + \`LhrApipGlobalState\`, NEW const \`LHR_APIP_GLOBAL_KEY\`, NEW pure helpers \`shouldShowLhrApipBanner\` + \`deriveLhrApipForSubmission\`, EXTEND \`executeSubmitRevisiPOK\` args (\`lhrApipForYear?\`) + conditional spread to initialData.lhr_apip.

- \`utils/submitRevisiHelpers.test.ts\` (+156 lines, +12 tests): 3 \`executeSubmitRevisiPOK\` propagation tests (undefined / Strategy A / Strategy B); 4 \`shouldShowLhrApipBanner\` tests (null state / no entry / unack / ack); 5 \`deriveLhrApipForSubmission\` tests (null / missing / unack / Strategy A placeholder / Strategy B real).

- \`App.tsx\` (+90 / -16 lines): import extension (helpers + getSetting/saveSetting + 2 types), state shape migration (line 105), useEffect mount-load best-effort (line 152), \`handleLhrApipChange\` callback persist via saveSetting (line ~1077, post-currentRKKSYear declaration), \`handleSubmitRevisiPOK\` extended derive lhrApipForYear + pass orchestrator, prop pass-through update (line ~1339).

- \`components/ValidasiRevisiPOK.tsx\` (+30 lines): Banner JSX block sebelum \`<ValidationDashboardHeader>\`, conditional render, amber styling, role="alert" aria-live="polite".

**Forward-compat ke Strategy B V2:**
Schema \`LhrApipYearEntry\` sudah include optional \`nomor?\` + \`tanggal?\` fields sejak V1, sehingga UI upgrade Strategy B tinggal tambah form input fields ke ValidationDashboardHeader (sebelah checkbox C8) tanpa JSONB schema migration. Spread bersyarat di \`handleLhrApipChange\` preserve existing V2 fields kalau user pernah isi.

**Test baseline:** 598 → **610 pass** (+12). TS errors 8/8 maintained (7 App.tsx + 1 PaguAnggaran.tsx:512). Vite build success ~8.8s, 1.6MB minified.

**Commit:** \`93d9155\` paired commit→push (single atomic, in-session per OWNER-POLICY v1.4 §P).

**Next steps:**
- **Phase 3** = Owner manual E2E test di Vercel Preview URL untuk \`feature/tier-5a-audit-trail-backend\` (auto-deployed post push). Smoke test flow: toggle checkbox C8 → banner toggle + Supabase write verify, refresh browser → state persisted, Submit dengan changed row → \`usulan_revisi.data.lhr_apip\` populated verify.
- **Phase 4** = squash merge feature → main setelah Owner approve. Production update separate via \`main → production\` merge.`,
    files: [
      'utils/submitRevisiHelpers.ts',
      'utils/submitRevisiHelpers.test.ts',
      'App.tsx',
      'components/ValidasiRevisiPOK.tsx',
      'SSOT-REFACTOR-LOG.md',
      'HANDOVER.md',
      'constants/devLog.ts',
    ],
    decisions: [
      'Strategy A (V1 minimal) chosen per Owner-decision 13 Mei 2026 — checkbox-only UX, placeholder tied audit',
      'Forward-compat ke Strategy B preserved sejak V1 — optional nomor/tanggal di schema',
      'Banner placement di ValidasiRevisiPOK (bukan App-level) — scope C8 gate hanya di tab Validasi',
      'JSONB-native persistence pakai existing getSetting/saveSetting (BUKAN tambah service module baru) per AP-8',
      'Pure helpers di submitRevisiHelpers.ts (BUKAN types.ts) — local scope, types.ts canonical untuk DB shapes',
      'In-session commit + docs sync per OWNER-POLICY v1.4 §P (budget cukup, BUKAN handover)',
    ],
    related: ['log-2026-05-12-tier-5a-phase-2.5-handover-prep', 'log-2026-05-12-tier-5a-phase-2.4-submit-flow-complete'],
  },
  {
    id:    'log-2026-05-12-tier-5a-phase-2.5-handover-prep',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 5a / Phase 2.5 Handover Prep',
    title: 'Tier 5a Phase 2.4 COMPLETE + Phase 2.5 Handover Bundle SIAP — OWNER-POLICY v1.4',
    type:  'docs',
    author: 'AI Assistant (Successor Session)',
    description:
`Post Phase 2.4 commit \`958e426\` di sesi ini, prep handover ke fresh session untuk Phase 2.5 + Phase 3 Owner E2E test prep. Skenario B chosen per Owner direction (12 Mei 2026) — budget mid-session tipis (~35% remaining vs Phase 2.5 estimate ~30%), handover bundle pattern (recovery dari context loss, BUKAN primary path per OWNER-POLICY v1.4 §P).

**OWNER-POLICY Addendum v1.4 ADDED (post v1.3):**
- §P: In-Session Commit Principle — spoke session yang complete kerja substantif WAJIB commit + push di sesi yang sama, BUKAN handover ke fresh session. Bundle handover = recovery mechanism, BUKAN primary path. Owner correction real-time setelah AI bias toward "split aggressively" pattern (mid-session, hampir selesai vs precedent fresh-session-bootstrap konteks).
- §Q: Phase 2.4 Success Template — DI orchestrator pattern, ~6-7 turn profile, in-session commit working as expected
- §R: Phase 2.5 Handoff Specifics — Strategy A (V1 minimal) vs B (richer) decision framing untuk fresh session first turn

**Handover bundle composition:**
- BUNDLE-README.md (bootstrap)
- OWNER-POLICY-FOR-AI-SESSIONS.md (v1.4 latest)
- HANDOVER.md (Phase 2.4 COMPLETE \`958e426\` flag)
- SESSION-START-HERE.md (Phase 2.5 orientation)
- SSOT-REFACTOR-LOG.md (§0.12.10 Phase 2.4 execution log)
- PHASE-2-BACKEND-API-REFERENCE.md (existing — service API + state machine reference)
- docs/ (TIER-5-DESIGN.md, REVISI-POK-PAGU-vKoreksi.md, glossary.md)
- constants/devLog.ts (this entry)

Bundle ~500 KB target, self-contained — fresh session bootstrap dengan zero drift expected (pattern proven Phase 1.5 + 2.1-2.3 + 2.4 = 3 fresh sessions executed clean).`,
    files: [
      'HANDOVER.md',
      'OWNER-POLICY-FOR-AI-SESSIONS.md',
      'SESSION-START-HERE.md',
      'SSOT-REFACTOR-LOG.md',
      'constants/devLog.ts',
    ],
    decisions: [
      'OWNER-POLICY v1.4 §P — in-session commit principle (codified Owner direction 12 Mei 2026)',
      'Skenario B chosen mid-session — handover Phase 2.5 ke fresh session (budget tipis)',
      'Strategy A default recommend untuk Phase 2.5 (V1 minimal, safer)',
    ],
    related: ['log-2026-05-12-tier-5a-phase-2.4-submit-flow-complete'],
  },

  {
    id:    'log-2026-05-12-tier-5a-phase-2.4-submit-flow-complete',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 5a / Phase 2.4 — Submit Flow UI Integration',
    title: 'Tier 5a Phase 2.4 COMPLETE — Submit Button Wired via DI Orchestrator (commit 958e426)',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Phase 2.4 deliverable per docs/TIER-5-DESIGN.md §8.1 #4. Submit Revisi POK button (di ValidationDashboardHeader.tsx) wired ke service layer Phase 2.3 via pure orchestrator + dependency injection pattern.

**Architecture decision (codified SSOT §0.12.10):**
Project tidak punya React Testing Library (verified package.json grep) → handler-level testing tidak feasible langsung. Solusi: extract orchestration logic ke pure async function \`executeSubmitRevisiPOK\` dengan \`SubmitRevisiServices\` interface DI. UI handler jadi thin wrapper untuk side effects (toast + setState).

**Files (5 changed/created):**
- NEW \`utils/submitRevisiHelpers.ts\` (+225 lines): 3 helpers — \`collectChangedRowsWithSection\` (pakai existing \`isChangedRow\` dari validators/helpers — AP-4 single source), \`summarizeChangedRows\`, \`executeSubmitRevisiPOK\` (returns discriminated \`SubmitRevisiResult\`: no_changes | state_rejected | service_error per phase | success)
- NEW \`utils/submitRevisiHelpers.test.ts\` (+370 lines, 25 tests): 8 collect + 4 summarize + 13 orchestrator (happy path, no_changes, state_rejected ±reason, service_error per phase, non-Error rejection, multi-row, custom diusulkanOleh, lhrApip propagation)
- MOD \`components/ValidationDashboardHeader.tsx\`: +\`onSubmit?\` + \`isSubmitting?\` props, wire \`onClick={onSubmit}\`, "Submitting..." label saat in-flight
- MOD \`components/ValidasiRevisiPOK.tsx\`: pass-through props
- MOD \`App.tsx\`: import service + orchestrator, +useState \`isSubmittingRevisi\`, +handleSubmitRevisiPOK (useCallback) thin UI wrapper, pass props ke \`<ValidasiRevisiPOK>\`

**Submit sequence (per PHASE-2-BACKEND-API-REFERENCE.md Recipe A):**
1. Extract changed rows; kalau 0 → toast.error "Tidak ada row..."
2. createUsulanDraft(tahun, 'revisi_pok', {tanggal_pengajuan, diusulkan_oleh: 'Sie Renbang (R5a proxy)', justifikasi})
3. addPerubahan × N parallel via Promise.all
4. recordValidationAttempt(usulanId, 'pass') — audit Itjenad trail
5. transitionUsulan(usulanId, 'direkomendasi', {validatorsPassed: true, lhrApipAcknowledged}) — gated state machine
6. toast.success "Submit berhasil — N row di M section. Status: direkomendasi."

**Phase 2.4 deliberately deferred (Phase 2.5 scope):**
- \`data.lhr_apip\` belum di-populate (UsulanLhrApip butuh nomor+tanggal yang UI belum capture)
- \`lhrApipAcknowledgedByYear\` masih ephemeral useState (Phase 2.5 migrate ke system_settings)
- Banner V1 UI (Phase 2.5)

**Commit + push paired (12 Mei 2026):**
- Commit sha: \`958e426\`
- Push status: ✅ \`b7f4164..958e426\` di feature/tier-5a-audit-trail-backend
- PAT hygiene: ✅ verified clean post-push
- Co-authored-by: AI Assistant <claude-ai@anthropic.local>

**Baseline maintained:**
- TS errors: 8/8 (7 App.tsx existing + 1 PaguAnggaran.tsx:512)
- Tests: 573 → 598 (+25 new pass)
- Vite build: success ~7.6s, 1.6MB minified

In-session commit principle applied (OWNER-POLICY v1.4 §P) — committed di sesi yang lakukan kerja, BUKAN handover ke fresh session untuk task trivial-cost (commit/push = 2-3 bash call). Owner correction real-time setelah AI initial recommendation "split aggressively".`,
    files: [
      'utils/submitRevisiHelpers.ts',
      'utils/submitRevisiHelpers.test.ts',
      'components/ValidationDashboardHeader.tsx',
      'components/ValidasiRevisiPOK.tsx',
      'App.tsx',
    ],
    decisions: [
      'DI orchestrator pattern (codified §0.12.10) — handler testable tanpa React Testing Library',
      'Defer data.lhr_apip populate + banner ke Phase 2.5 (UI capture nomor+tanggal belum ada)',
      'Strategy A vs B untuk Phase 2.5 LHR APIP capture — Owner decide di fresh session first turn',
    ],
    related: ['log-2026-05-12-tier-5a-phase-2-handover-prep'],
  },

  {
    id:    'log-2026-05-12-tier-5a-phase-2-handover-prep',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 5a / Phase 2 Handover Prep',
    title: 'Tier 5a Phase 2 Handover Bundle SIAP — OWNER-POLICY v1.3 + Vercel Verified',
    type:  'docs',
    author: 'AI Assistant (Successor Session)',
    description:
`Post Phase 1.5 success, current session prep handover untuk Phase 2 (significant scope split per Owner Konteks 14/15). Pattern mirror Tier 5 bundle yang sukses bawa fresh session execute Phase 1.5 dengan zero drift.

**Foundation finding #2 (Vercel switch pending) CLOSED:**
Owner share screenshot \`vercel.com/.../settings/environments\` menunjukkan Vercel UI sudah update (replace lama \`Settings → Git → Production Branch\` jadi \`Settings → Environments\` 3-tier model). Production environment Branch Tracking = \`production\` ✅. Preview = all unassigned (catches main + feature/*). Domain sikesumav31.vercel.app mapped to Production environment. v3.2 strategy **FULLY OPERATIONAL**.

**Implikasi untuk Phase 2 dev:**
- feature/tier-5a-* branches → Vercel Preview environment (preview URL terpisah, production untouched)
- main commits → ALSO Preview (NOT production deployment auto)
- Production update HANYA via explicit merge \`main → production\` (atau Vercel Dashboard "Promote to Production")
- Phase 4 squash merge ke main aman, tidak akan accidentally publish ke production

**OWNER-POLICY Addendum v1.3 ADDED (post v1.2):**
- §L: Supabase Management API pattern — sbp_ token vs eyJ JWT distinction, endpoint /v1/projects/{ref}/database/query, AI verify token type protocol
- §M: Vercel Environments page (UI update verified 12 Mei 2026)
- §N: Phase 1.5 success template — pattern that worked (foundation findings reporting, pre-execute commit + display + execute + log, ~6 turn profile stayed below compaction)

**Bundle prep deliverables (this turn):**
- HANDOVER.md — Vercel CONFIRMED status updated, Phase 1.5 EXECUTED + Phase 2 PENDING markers
- OWNER-POLICY-FOR-AI-SESSIONS.md — Addendum v1.3 appended (3 new sections L/M/N)
- SESSION-START-HERE.md — rewritten for Phase 2 fresh session orientation (Phase 2.1-2.6 sub-phase guidance, state snapshot, anti-pattern reminders including new Tier 5-specific items #9-12)
- constants/devLog.ts — this entry
- tier5a-phase2-handover-bundle.zip — generated separately, presented to Owner

**Bundle composition matches predecessor Tier 5 bundle (~500 KB target):**
- Bootstrap docs (BUNDLE-README, SESSION-START-HERE, OWNER-POLICY)
- Project state (HANDOVER, SSOT, devLog)
- Design docs (TIER-5-DESIGN, TIER-3-PLUS-PLAN, TIER-4C-* predecessor refs, REVISI-POK-PAGU master domain, glossary)
- NEW: migrations/*.sql (executed Phase 1.5 reference)
- README

**Next session expected workflow (per SESSION-START-HERE Phase 2 plan):**
1. Bootstrap 5-step + verify state (likely 1 turn)
2. Foundation Q&A kalau perlu surface finding (likely no findings — state stable)
3. Phase 2.1: types module (1 turn)
4. Phase 2.2: state machine + tests (1-2 turn)
5. Phase 2.3: service layer + tests (1-2 turn)
6. Phase 2.4: Submit flow integration (1 turn)
7. Phase 2.5: LHR APIP R3c migration (1 turn)
8. Phase 4: Owner E2E test → squash merge (gated by explicit main→production for prod deploy)

Total estimate: 6-9 turn fresh session = within compaction-safe budget.`,
    files: [
      'HANDOVER.md',
      'OWNER-POLICY-FOR-AI-SESSIONS.md',
      'SESSION-START-HERE.md',
      'constants/devLog.ts',
    ],
    related: [
      'log-2026-05-12-tier-5a-phase-1-5-executed',
      'log-2026-05-12-tier-5-design-phase-1-ready',
    ],
  },

  {
    id:    'log-2026-05-12-tier-5a-phase-1-5-executed',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 5a / Phase 1.5',
    title: 'Tier 5a Phase 1.5 EXECUTED — 3 Tabel Audit Trail LIVE di Supabase',
    type:  'schema',
    author: 'AI Assistant (Successor Session)',
    description:
`Fresh AI session melanjutkan Tier 5 via handover bundle. Bootstrap 5-step + foundation consistency check selesai. Owner share Supabase Management API token (sbp_*) untuk AI auto-execute DDL Phase 1.5.

**Branch:** \`feature/tier-5a-audit-trail-backend\` (created dari main \`535085f\`)

**Pre-execute commit \`b834415\`** (chore tier-5a init):
- migrations/tier-5-001-usulan-revisi-schema.sql (sha256:0f83edb49bd7)
- migrations/tier-5-002-usulan-revisi-rls-policies.sql (sha256:18c3ee21e1a9)
- migrations/tier-5-003-snapshot-pok-immutability.sql (sha256:a79e3dcc9cf8)
- migrations/tier-5-004-rollback.sql (sha256:7e4c95839293)
- HANDOVER.md (1-line sync 90a0278 → 535085f)

**Execution result (timestamp UTC 2026-05-12T13:14:45Z):**
- 001 → HTTP 201, 3 tables created: usulan_revisi (7 cols), usulan_revisi_perubahan (5 cols), snapshot_pok (6 cols). 7 custom indexes + 3 primary keys verified.
- 002 → HTTP 201, RLS enabled di 3 tabel, 10 policies (4 usulan_revisi + 4 perubahan + 2 snapshot_pok permissive anon V1 mirror existing envelope pattern).
- 003 → HTTP 201, trigger \`snapshot_pok_immutable\` BEFORE UPDATE + function \`snapshot_pok_prevent_update\` active.

**Smoke test negative (R7c immutability):**
1. INSERT dummy usulan_revisi row → 201 ✓
2. INSERT dummy snapshot_pok (FK ref) → 201 ✓
3. UPDATE snapshot_pok attempt → **HTTP 400 dengan custom exception verbatim**:
   "ERROR: P0001: snapshot_pok records are immutable per Tier 5 R7c — cannot UPDATE row id=ee350856-..."
4. ✅ Trigger fires as designed. Cleanup DELETE successful, row counts (0,0,0) final.

**Credential audit:**
- Token type: Supabase Management API PAT (\`sbp_*\`), bukan service_role JWT — beda mekanisme tapi sama-sama bisa execute DDL via endpoint \`POST /v1/projects/{ref}/database/query\`
- Loaded ke env variable saja, tidak persisted di disk, tidak di-commit, unset setelah setiap call.

**Foundation verification this session:**
- 486/486 tests pass ✓
- TS 8/8 baseline maintained ✓
- Working tree clean ✓
- Triple-source consistency (HANDOVER + SSOT + devLog) ✓
- PAT hygiene clean (no leak di .git/config) ✓

**Yang Tier 5a Phase 2 perlu lanjut (fresh session direkomendasikan):**
1. TypeScript types untuk UsulanRevisi/UsulanRevisiPerubahan/SnapshotPok
2. State machine module utils/usulanRevisiStateMachine.ts (transition rules + R6+ override)
3. Supabase CRUD layer services/usulanRevisiService.ts (mirror lib/supabase.ts envelope pattern)
4. Submit flow integration: ValidationDashboardHeader.tsx (wire onClick) → ValidasiRevisiPOK.tsx → App.tsx
5. State machine tests ~30-40 tests
6. LHR APIP migration ephemeral → system_settings + usulan_revisi.data.lhr_apip (R3c)

Estimasi 5-7 substantive turn — significant per Owner Konteks 14. Direkomendasikan split ke fresh session via tier5a-phase2-handover-bundle.zip.

**Owner Konteks 11 (v3.2 strategy) status:**
- Branch production exists di GitHub di hash 90a0278 (Tier 4c MERGED stable)
- Branch main di 535085f (1 commit ahead, Tier 5 docs)
- Vercel Production Branch config switch ke 'production' = pending Owner action — AI proceed di feature branch saja (Vercel auto-create preview URL, production stays untouched until Owner explicitly merges).`,
    files: [
      'migrations/tier-5-001-usulan-revisi-schema.sql',
      'migrations/tier-5-002-usulan-revisi-rls-policies.sql',
      'migrations/tier-5-003-snapshot-pok-immutability.sql',
      'migrations/tier-5-004-rollback.sql',
      'HANDOVER.md',
      'SSOT-REFACTOR-LOG.md',
    ],
    decisions: ['R1c', 'R2b', 'R5a', 'R7c', 'R8c'],
    related: [
      'log-2026-05-12-tier-5-design-phase-1-ready',
      'log-2026-05-12-tier-4c-merged-to-main',
    ],
  },

  {
    id:    'log-2026-05-12-tier-5-design-phase-1-ready',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 5 / Phase 1 Design',
    title: 'Tier 5 Phase 1 Design READY — R1-R8 + R6+ Manual Override + v3.2 Strategy',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Foundation work untuk Tier 5 (Workflow Audit Trail + State Machine) complete di main. Owner approve all R1-R8 defaults + R6 enhancement (R6+ manual override mechanism) batch. Implementation work (Phase 1.5 DDL + Phase 2-3 logic + UI) di-split ke **fresh AI session** untuk avoid context budget exhaustion + drift/bias.

**Owner direction batched (Konteks 1-15, 12 Mei 2026):**

R1c — Schema convention: Hybrid (status + tahun_anggaran + jenis columned, rest JSONB \`data\`)
R2b — Snapshot scope: Full POK snapshot per tanggal_efektif
R3c — LHR APIP: Both system_settings (global) + usulan_revisi tied
R4a — Deadline reminder: Banner V1 (R4b email defer V2)
R5a — Multi-user: Single-user Sie Renbang proxy
R6+ — State transitions: Permissive + manual override mechanism (NEW Owner direction)
R7c — Snapshot immutability: DB trigger + app enforcement
R8c — Partition: Tier 5a (backend) + Tier 5b (frontend)

**Scope additions Owner-approved:**
- Tier 5+6 overlap β: forward-compat schema (template_sk_metadata), Tier 6 implementation defer
- Validation history audit β: JSONB-embedded validation_attempts[] di usulan_revisi.data

**R6+ Manual Override (NEW critical addition):**

Owner direction "sistem tidak boleh stuck karena terlalu strict. SIKESUMA adalah project pengembangan breakthrough — pattern 'learning by doing'." Mechanism:
- Setiap state transition normal punya validation rules
- PLUS escape hatch "Override + reason" catch-all transition any → any
- Audit: log entry dengan \`manual_override\` flag + actor + reason + timestamp
- V1 permissions: anyone (R5a single-user), V2: role-based restrict

**v3.2 Production Branch Strategy (Opsi A Owner-approved):**

- Branch \`production\` created from main HEAD \`90a0278\` (Tier 4c MERGED state)
- Owner Vercel config pending: Settings → Git → Production Branch = \`production\`
- main = dev (Vercel preview deployments only)
- production = explicit promote (Vercel production URL update)
- Codified di OWNER-POLICY-FOR-AI-SESSIONS.md Addendum v1.2 §I

**Procedural rules formalized (NEW):**

- Paired commit→push action: setiap commit WAJIB diikuti push dalam same turn (REINFORCED dari Phase 3c incident commit \`4cf3341\` lupa push)
- Supabase access policy: read bebas, DDL butuh explicit per-operation Owner approval, AI-auto-execute Tier 5 allowed dengan audit safeguards
- Handover bundle pattern: ZIP self-contained mirror tier4c-handover-bundle.zip untuk fresh session continuity

Codified di OWNER-POLICY-FOR-AI-SESSIONS.md Addendum v1.2.

**Files created/modified (foundation):**

Created (1):
- docs/TIER-5-DESIGN.md (~600 LOC comprehensive Phase 1 design)

Modified (5):
- docs/TIER-3-PLUS-PLAN.md (Tier 5 section update with v1.2 supersedes note)
- OWNER-POLICY-FOR-AI-SESSIONS.md (Addendum v1.2: Supabase + v3.2 + paired commit-push + Tier 5 handover)
- HANDOVER.md (status: Tier 4c MERGED + Tier 5 Design Ready, branch tree dengan production branch)
- SESSION-START-HERE.md (revamped untuk Tier 5 fresh session context)
- SSOT-REFACTOR-LOG.md (§0.12 Tier 5 entries + decisions log)
- constants/devLog.ts (this entry)

**Handover bundle preparation:**
- \`tier5-handover-bundle.zip\` siap untuk Owner download + attach saat fresh session
- Self-contained dengan all required context (mirror tier4c-handover-bundle.zip pattern)
- 5-step bootstrap untuk fresh AI session

**Smoke test (docs + branch creation only):**
- TS errors: 8 maintained (no code change)
- Vitest: 486 maintained
- Vite build: success
- production branch: created + pushed (90a0278)

**Next milestones (fresh AI session):**

1. Bootstrap: Read handover bundle 5-step mandatory
2. Branch create: \`feature/tier-5a-audit-trail-backend\`
3. Phase 1.5: DDL preparation + Owner execute (3 tables + indexes + R7c trigger)
4. Phase 2 Tier 5a: TypeScript types + state machine + Supabase CRUD + Submit integration
5. Phase 3 Tier 5b (separate branch): UI tab + modal + snapshot viewer + deadline banner
6. Phase 4: Squash merge 5a + 5b

Estimasi 11-16 turn fresh session (split 5a ~5-7 turn + 5b ~5-7 turn).

**Cross-references:**

- Phase 1 design authoritative: \`docs/TIER-5-DESIGN.md\`
- Original blueprint: \`docs/TIER-3-PLUS-PLAN.md\` §Tier-5 (with v1.2 supersedes note)
- Owner Policy: \`OWNER-POLICY-FOR-AI-SESSIONS.md\` Addendum v1.2
- Predecessor: \`log-2026-05-12-tier-4c-merged-to-main\`
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.6 + §6 + §13`,
    files: [
      'docs/TIER-5-DESIGN.md',
      'docs/TIER-3-PLUS-PLAN.md',
      'OWNER-POLICY-FOR-AI-SESSIONS.md',
      'HANDOVER.md',
      'SESSION-START-HERE.md',
      'SSOT-REFACTOR-LOG.md',
      'constants/devLog.ts',
    ],
    decisions: [
      '§Tier5-R1c', '§Tier5-R2b', '§Tier5-R3c', '§Tier5-R4a',
      '§Tier5-R5a', '§Tier5-R6+ (BARU manual override)', '§Tier5-R7c', '§Tier5-R8c',
      '§Tier5-OverlapBeta', '§Tier5-ValidationHistoryBeta',
      '§Procedural-SupabaseAccess (BARU)',
      '§Procedural-v32Strategy (BARU)',
      '§Procedural-PairedCommitPush (REINFORCED)',
    ],
    related: [
      'log-2026-05-12-tier-4c-merged-to-main',
      'log-2026-05-12-tier-4c-phase-3-complete',
      'log-2026-05-12-c11-toggle-feature',
    ],
  },

  {
    id:    'log-2026-05-12-tier-4c-merged-to-main',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 4c / Phase 4',
    title: 'Tier 4c MERGED TO MAIN — All 12 Validators LIVE, Submit Button UNLOCKED',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 4c sub-branch \`feature/tier-4c-procedural-references\` **MERGED TO MAIN** sebagai squash commit \`9174782\`. Owner Vercel preview E2E test ✅ APPROVED 12 Mei 2026 sebelum authorize merge. Feature branch dihapus (remote + local cleanup).

**Squash audit trail (9 commits → 1):**

- \`7a1582e\` feat phase 2a: fixture validation-scenarios-4c.json (18 scenarios)
- \`1315914\` feat phase 2b Turn 1: C12 Deadline validator + 17 tests
- \`e4f1405\` feat phase 2b Turn 2: C10 SBM/SBK validator + 32 tests (FIRST warn severity)
- \`edc8f15\` feat phase 2b Turn 3: C11 RPD validator + 35 tests (CROSS-TABLE)
- \`cb0435e\` feat phase 2b Turn 4: T9 toggle architecture + 10 tests (BARU 12 Mei)
- \`0e8853d\` docs phase 3a: UI integration design delta brief
- \`c440b29\` feat phase 3b: cards C10/C11/C12 LIVE + ValidationContext wiring
- \`4cf3341\` feat phase 3c: cross-tab nav refactor + C11 toggle UI absorbed
- \`34a8bed\` docs phase 3d: triple-source sync — SSOT T9 + devLog + HANDOVER + README + SESSION-START-HERE

**Final state post-merge:**

- 12/12 validators LIVE (C1-C5 Tier 4a + C6-C9 Tier 4b + C10-C12 Tier 4c)
- 486 tests pass (201 Tier 3 + 103 Tier 4a + 88 Tier 4b + 94 Tier 4c)
- TS errors: 8 maintained (baseline)
- Vite build: success ~7s
- Submit Revisi POK button: **ENABLES first time** in project history
  (triple-gate satisfied: canSubmit AND lhrApipAcknowledged AND allImplemented)

**T9 BARU (12 Mei 2026 Owner-direction):**

C11 strategy toggle — user-configurable validator mode \`permisif\` (default) / \`ketat\` (opt-in) untuk edge case "0 changed leaves + rpdsData undefined". Toggle banner UI in-context discoverability di top dashboard (Opsi A soft interpretation). Pattern "learning by doing" untuk Sie Renbang eksplorasi kedua mode + pilih preference akhirnya.

**Cross-tab navigation refactor (T7):**

\`onNavigate(target: 'pagu' | 'rpd', sectionId?, rowId?)\` signature baru. C11 violations punya dual nav button (→ Pagu emerald + → RPD blue). RPD.tsx implementasi scroll/highlight mirror PaguAnggaran Tier 4a Phase 3d pattern. Backward-compat \`onNavigateToPagu\` @deprecated marker (akan dihapus saat Tier 5+).

**Branch cleanup confirmed:**

- \`feature/tier-4c-procedural-references\` DELETED (remote ✓ + local ✓)
- Local = Remote sync clean
- Only \`main\` branch exists remote (semua feature branches deleted)

**Cross-references:**

- SSOT decisions log: \`SSOT-REFACTOR-LOG.md\` §0.11.1 T1-T8 + §0.11.1a T9 BARU + §0.11 closure FINAL
- Predecessor milestone: \`log-2026-05-12-tier-4c-phase-3-complete\` (pre-merge state)
- Tier 4b predecessor squash: \`d13be80\`
- Tier 4a predecessor squash: \`abe193c\`
- Tier 3 predecessor squash: \`6c8f640\`
- Design docs: \`docs/TIER-4C-DESIGN.md\` (foundation) + \`docs/TIER-4C-PHASE-3-UI-DESIGN.md\` (delta brief)
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 + §3.5

**Predecessor squash hashes (cumulative Tier 3 + Tier 4):**

| Tier | Squash hash | Date | Validators |
|---|---|---|---|
| Tier 3 (Metadata) | \`6c8f640\` | 11 Mei | (foundation untuk validators) |
| Tier 4a (Pagu Structure) | \`abe193c\` | 11 Mei | C1-C5 |
| Tier 4b (Revisi Mechanism) | \`d13be80\` | 11 Mei | C6-C9 |
| Tier 4c (Procedural & References) | \`9174782\` | 12 Mei | C10-C12 |

**Procedural rule introduced (BARU 12 Mei 2026):**

Paired commit→push action MANDATORY — setiap \`git commit\` WAJIB diikuti \`git push origin <branch>\` dalam turn yang sama. Justifikasi: Owner mengandalkan GitHub state untuk visibility. Pattern: commit + push = atomic action pair. Detail di HANDOVER.md "Workflow procedural rules".

**Next milestones available:**

1. **Tier 5 (Audit Trail)** — butuh Owner DDL action \`CREATE TABLE usulan_revisi\`
2. **LHR APIP persistence v2** (currently in-memory per S6 — move to Supabase di Tier 5)
3. **Submission deadline reminder** (email/notification 30 hari before C12 deadline)
4. **C10 V2** — full SBM lookup table integration (currently V1 via hargaSatuanAwal proxy)
5. **C11 V2/V3** — numerical sum verification + remediation guide
6. **Bug-fix / refinement** berdasarkan Sie Renbang feedback Tier 4c production use

Tier 4 fully complete. SIKESUMA validation engine = production-ready untuk Revisi POK kewenangan KPA workflow per Perdirjen Renhan 7/2025.`,
    files: [
      'utils/validators/c10.ts',
      'utils/validators/c11.ts',
      'utils/validators/c12.ts',
      'utils/validators/runAllValidators.ts',
      'utils/validators/types.ts',
      'utils/fixtures/validation-scenarios-4c.json',
      'components/ValidasiRevisiPOK.tsx',
      'components/PaguAnggaran.tsx',
      'components/RPD.tsx',
      'App.tsx',
      'docs/TIER-4C-PHASE-3-UI-DESIGN.md',
      'HANDOVER.md',
      'README.md',
      'SESSION-START-HERE.md',
      'SSOT-REFACTOR-LOG.md',
      'constants/devLog.ts',
    ],
    decisions: [
      '§Tier4c-T1', '§Tier4c-T2', '§Tier4c-T3', '§Tier4c-T4',
      '§Tier4c-T5', '§Tier4c-T6', '§Tier4c-T7', '§Tier4c-T8',
      '§Tier4c-T9 (BARU)',
      '§Procedural-PairedCommitPush (BARU)',
    ],
    related: [
      'log-2026-05-12-tier-4c-phase-3-complete',
      'log-2026-05-12-c11-toggle-feature',
      'log-2026-05-11-tier-4c-foundation-phase',
      'log-2026-05-11-tier-4b-merged-to-main',
    ],
  },

  {
    id:    'log-2026-05-12-tier-4c-phase-3-complete',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 4c',
    title: 'Tier 4c Phase 3 COMPLETE — All 12 Validators Live + Cross-Tab Nav + C11 Toggle',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 4c sub-branch \`feature/tier-4c-procedural-references\` Phase 2 (validators) + Phase 3 (UI integration) **selesai**. Branch siap untuk Phase 4 (Owner Vercel preview E2E test → squash merge ke main).

**Branch state:** \`feature/tier-4c-procedural-references\` (9 commits ahead of main \`9c82265\`)

**Tier 4c commits audit trail (9 commits squashable):**
- \`114ad4e\` docs(handover): sync branch state tree post-foundation (drift patch)
- \`7a1582e\` feat phase 2a: fixture validation-scenarios-4c.json — 18 skenario C10/C11/C12 + toggle
- \`1315914\` feat phase 2b Turn 1: C12 Deadline validator + 17 tests
- \`e4f1405\` feat phase 2b Turn 2: C10 SBM/SBK validator + 32 tests (FIRST warn severity)
- \`edc8f15\` feat phase 2b Turn 3: C11 RPD validator + 35 tests (CROSS-TABLE)
- \`cb0435e\` feat phase 2b Turn 4: T9 toggle architecture (permisif/ketat) + 10 tests
- \`0e8853d\` docs phase 3a: UI integration design delta brief — D1+D2+D3 plan
- \`c440b29\` feat phase 3b: cards C10/C11/C12 LIVE + ValidationContext wiring
- \`4cf3341\` feat phase 3c: cross-tab nav refactor + C11 toggle UI absorbed

**12 validators live final state (post-Phase-3b):**

| Constraint | Status | Tests | Special note |
|---|---|---|---|
| C1-C5 (Tier 4a) | ✅ live | 103 | Pagu structure |
| C6-C9 (Tier 4b) | ✅ live | 88 | Revisi mechanism + LHR APIP |
| **C10 SBM** | ✅ live | **32** | First WARN severity (amber dot 10-25%) |
| **C11 RPD** | ✅ live | **45** | Cross-table check + T9 strategy toggle |
| **C12 Deadline** | ✅ live | **17** | Procedural date check, dashboard-only |

**Test baseline:** 392 (post-Tier-4b) → **486 pass** (94 Tier 4c added: C12 17 + C10 32 + C11 45). Target estimasi 57; actual +65% over because T9 toggle scope addition (10 tests + 2 fixture scenarios mid-Phase-2b per Owner direction).

**UI deltas Phase 3 (3 sub-phases):**

Phase 3b — Cards Live + ValidationContext Wiring:
- \`runAllValidators.ts\` flip C10/C11/C12 placeholder ('4c') → null (live)
- \`ValidasiRevisiPOK.tsx\` accept \`rpdSections\` + \`c11Strategy\` props
- \`PaguAnggaran.tsx\` accept \`rpdSections\` (Q5 default — konsistensi UX inline indicators)
- \`App.tsx\` pass \`rpdSections\` ke 2 children
- Implemented counter 9/12 → **12/12 (100% progress bar)**

Phase 3c — Cross-Tab Nav Refactor + C11 Toggle (absorbed):
- T7 signature change: \`onNavigate(target: 'pagu' | 'rpd', sectionId, rowId)\` new unified callback
- \`onNavigateToPagu\` @deprecated marker (Q3 default — keep selama transition)
- \`DetailPanel\` dual buttons untuk C11 violations (→ Pagu emerald + → RPD blue)
- \`App.tsx\` new state \`pendingRpdRowHighlight\` + \`handleValidationNavigate\` route handler
- \`RPD.tsx\` scroll/highlight implementation (mirror PaguAnggaran Tier 4a Phase 3d):
  * \`data-rpd-row-id\` attribute (avoid namespace collision dengan PaguAnggaran)
  * useEffect scrollIntoView + Tailwind ring-4 emerald glow + 2s auto-clear
- T9 toggle banner UI (Q1 Opsi A soft — Banner BETWEEN header dan card grid):
  * Native radio (accent-emerald permisif / accent-amber ketat)
  * Lucide Info icon hover tooltip 3-paragraph trade-off explainer
  * Right-aligned status note (default pengembangan / strict mode aktif)
  * localStorage key \`c11PendingStrategy\` per device

**Submit button finally ENABLES** for first time in project history (allImplemented = true). Triple-gating preserved: canSubmit AND lhrApipAcknowledged AND allImplemented.

**Owner direction received during implementation:**
- 12 Mei 2026: T9 BARU (C11 strategy toggle) — insert as Phase 2b Turn 4 architecture, UI absorbed di Phase 3c
- Mode B Phase 3 execution: batch-approve Q1-Q5 defaults, aggressive 2-3 turn pacing
- Procedural fix: paired commit→push rule untuk avoid missed pushes

**Tests added Phase 2b breakdown (94):**
- C12 (Turn 1, 17 tests): fixture-driven 5 + edge cases 12 covering year boundary, timezone WIB, leap year, etc.
- C10 (Turn 2, 32 tests): first WARN severity verification, threshold boundary (10%/25%), float-precision multiplier comparison (avoid IEEE-754 \`10.000000000000002\` artifact)
- C11 (Turn 3+4, 45 tests): cross-table validator pertama, Konteks 1 PAKAI (vs C9/C10 bypass), pending vs vacuous decision tree, T5a strict match precision, multi-section/multi-RPD aggregation, violation detail content untuk Phase 3c cross-tab nav, c11Strategy toggle behavior

**Smoke test final state:**
- TS errors: 8 maintained (baseline, no new errors)
- Vitest: 486 pass (no regression)
- Vite build: success ~6-7s

**Cross-references:**
- SSOT decisions log: \`SSOT-REFACTOR-LOG.md\` §0.11.1 T1-T8 + §0.11.1a T9 BARU + §0.11 closure update
- Predecessor milestone: \`log-2026-05-11-tier-4c-foundation-phase\`
- Tier 4b predecessor squash: \`d13be80\`
- Design docs: \`docs/TIER-4C-DESIGN.md\` (foundation) + \`docs/TIER-4C-PHASE-3-UI-DESIGN.md\` (delta brief)
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 + §3.5

**Next milestones:**
1. Owner Vercel preview E2E test pada feature branch
2. Squash merge ke main (1 commit per tier convention)
3. Feature branch cleanup (remote + local delete)
4. Post-merge sync commit (HANDOVER + SESSION-START-HERE update)

Setelah merge, Tier 4 fully complete (12/12 validators live, Submit unlocked). Ready Tier 5 (Audit Trail) — butuh Owner DDL action untuk CREATE TABLE \`usulan_revisi\`.`,
    files: [
      'utils/validators/c10.ts',
      'utils/validators/c11.ts',
      'utils/validators/c12.ts',
      'utils/validators/runAllValidators.ts',
      'utils/validators/types.ts',
      'utils/fixtures/validation-scenarios-4c.json',
      'components/ValidasiRevisiPOK.tsx',
      'components/PaguAnggaran.tsx',
      'components/RPD.tsx',
      'App.tsx',
      'docs/TIER-4C-PHASE-3-UI-DESIGN.md',
    ],
    decisions: [
      '§Tier4c-T1', '§Tier4c-T2', '§Tier4c-T3', '§Tier4c-T4',
      '§Tier4c-T5', '§Tier4c-T6', '§Tier4c-T7', '§Tier4c-T8',
      '§Tier4c-T9 (BARU)',
      '§Tier4c-Phase3a-Q1', '§Tier4c-Phase3a-Q2', '§Tier4c-Phase3a-Q3',
      '§Tier4c-Phase3a-Q4', '§Tier4c-Phase3a-Q5',
    ],
    related: [
      'log-2026-05-11-tier-4c-foundation-phase',
      'log-2026-05-12-c11-toggle-feature',
      'log-2026-05-11-tier-4b-merged-to-main',
    ],
  },

  {
    id:    'log-2026-05-12-c11-toggle-feature',
    date:  '2026-05-12',
    phase: 'SSOT Refactor / Tier 4c / T9',
    title: 'C11 Strategy Toggle — Permisif/Ketat User-Configurable Validator Mode',
    type:  'feature',
    author: 'AI Assistant (Successor Session)',
    description:
`Architecture + UI baru untuk C11 RPD validator. Owner direction 12 Mei 2026 di tengah Phase 2b Turn 3 — saat AI assistant report "vacuous-wins-over-pending" sebagai custom interpretation (NOT pre-locked T1-T8) untuk edge case "0 changed leaves + rpdsData undefined".

**Background:**

Saat implementasi C11 (cross-table check Pagu vs RPD), discovered edge case dengan dua interpretasi semantic yang sama-sama defensible:
- Interpretasi A (vacuous-wins): kalau 0 changed leaves, tidak ada yang perlu di-evaluate, missing rpdsData irrelevant → \`pass\`
- Interpretasi B (pending-first): kalau rpdsData undefined, validator tidak bisa evaluate, regardless changed count → \`pending\`

Daripada lock-in di salah satu, Owner direction: jadikan **user-configurable toggle** supaya Sie Renbang dapat eksperimen kedua mode + pilih preference akhirnya based on workflow experience ("learning by doing" pattern, Owner-explicit di SESSION-START-HERE).

**Decision T9 (BARU 12 Mei 2026):**

\`ValidationContext.c11Strategy?: 'permisif' | 'ketat'\` field baru. Validator decision tree branch berdasarkan strategy:

\`\`\`typescript
if (strategy === 'permisif') {
  if (changedLeaves.length === 0) return pass;   // vacuous
  if (rpdsData === undefined)      return pending;
  // ... continue to cross-table eval
}
if (strategy === 'ketat') {
  if (rpdsData === undefined)      return pending;  // pending-first
  if (changedLeaves.length === 0) return pass;
  // ... continue
}
\`\`\`

**Diff antara 2 mode HANYA muncul di edge case spesifik tersebut.** Semua kasus lain (changed > 0, atau rpdsData defined) output identical di kedua mode.

**Naming Indonesian** per Owner preference (RS TNI AD primary language; alternative pair 'vacuous'/'strict' = technical jargon ditolak).

**Default 'permisif'** untuk backward compat + natural UX. Toggle ke 'ketat' = opt-in via UI.

**Implementation phases:**

Phase 2b Turn 4 (commit \`cb0435e\`) — Architecture:
- Extend \`ValidationContext\` dengan field
- Refactor \`validateC11\` decision tree
- Extract \`buildPendingResult\` helper (DRY)
- Append strategyNote ke setiap summary (pattern soft-onboarding)
- 8 new tests + 2 fixture scenarios = 10 tests added (45 total C11)

Phase 3c absorbed (commit \`4cf3341\`) — UI:
- Toggle banner BETWEEN \`ValidationDashboardHeader\` dan card grid
  (Q1 Opsi A soft interpretation — \`ValidationConstraintCard\` adalah
  \`<button>\` element, nested radio invalid HTML; banner pre-grid satisfy
  discoverability intent)
- Compact 1-line layout:
  \`Mode evaluasi C11: ⓘ ◉ Permisif ○ Ketat   (status note)\`
- Lucide Info icon hover tooltip dengan 3-paragraph trade-off explainer
- Native radio dengan accent-emerald (permisif) / accent-amber (ketat)
- localStorage key \`c11PendingStrategy\` per device per user
- Right-aligned status note: \`(default pengembangan — fitur dapat di-upgrade)\` / \`(strict mode aktif)\`
- Re-validate auto-trigger via \`useCallback\` deps include \`c11Strategy\`

**User-facing note di validator summary:**

Setiap C11 result punya strategyNote appendix di summary string (semua status pass/fail/pending):

- Permisif: \`[Mode: PERMISIF — default pengembangan, vacuous pass aktif. Mode KETAT (validate-first) tersedia via toggle UI Phase 3c.]\`
- Ketat:    \`[Mode: KETAT — strict pending-first aktif. Mode PERMISIF (default, lebih lenient) tersedia via toggle.]\`

Tujuan: drive eksplorasi tanpa intrusif. Pattern "soft-onboarding".

**UX flow yang Sie Renbang akan rasakan:**

1. Open tab Validasi → see compact toggle banner di top
2. Hover ⓘ → tooltip muncul, baca trade-off penjelasan
3. (Optional) Klik radio "Ketat" → C11 card flip behavior (pending muncul saat 0 changed + RPD belum loaded)
4. Refresh halaman → setting persist dari localStorage
5. Field-test selama beberapa hari, decide preference
6. (Optional V2 future) Kalau konvergen ke salah satu mode, simplification = hardcode

**Files modified:**

Phase 2b Turn 4:
- \`utils/validators/types.ts\` (+18 LOC) — ValidationContext field
- \`utils/validators/c11.ts\` (+183/-53) — refactor decision tree + helper
- \`utils/validators/c11.test.ts\` (+113) — 8 new tests
- \`utils/fixtures/validation-scenarios-4c.json\` (+46) — 2 new scenarios

Phase 3c absorbed:
- \`components/ValidasiRevisiPOK.tsx\` (+264/-51) — toggle banner + DetailPanel refactor + setC11Strategy
- (RPD.tsx + App.tsx changes are nav-related, separate concerns)

**Cross-references:**

- SSOT decision log: \`SSOT-REFACTOR-LOG.md\` §0.11.1a T9 (BARU)
- Architecture: validator file docblock \`utils/validators/c11.ts\`
- Related milestone: \`log-2026-05-12-tier-4c-phase-3-complete\`
- UI design rationale: \`docs/TIER-4C-PHASE-3-UI-DESIGN.md\` §5

**Reversibility:** Kalau Sie Renbang feedback indicates konvergen ke salah satu mode (mis. all-permisif lebih natural), V2 simplification = remove toggle + hardcode chosen default. Tetapi keep architecture inside validator untuk reversibility kalau preferences shift di future. Cost reversal: ~2 line code change di c11.ts + 1 line removal di types.ts.`,
    files: [
      'utils/validators/c11.ts',
      'utils/validators/c11.test.ts',
      'utils/validators/types.ts',
      'utils/fixtures/validation-scenarios-4c.json',
      'components/ValidasiRevisiPOK.tsx',
    ],
    decisions: [
      '§Tier4c-T9 (BARU 12 Mei 2026)',
      '§Tier4c-Phase3a-Q1 (Opsi A soft interpretation — banner placement)',
    ],
    related: [
      'log-2026-05-12-tier-4c-phase-3-complete',
      'log-2026-05-11-tier-4c-foundation-phase',
    ],
  },

  {
    id:    'log-2026-05-11-tier-4c-foundation-phase',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4c',
    title: 'Tier 4c Foundation Phase — Design + Konteks 1 TD Fix + Phase 1.5 + Handover Prep',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Foundation work untuk Tier 4c (final 3 of 12 constraints) — design + pre-flight + Phase 1.5 + handover prep complete di main. Owner approve all T1-T8 defaults batch. Implementation work (Phase 2a fixture + Phase 2b validators + Phase 3 UI + Phase 4 merge) di-split ke **fresh AI session** untuk avoid 2nd compaction risk per Owner policy (\`OWNER-POLICY-FOR-AI-SESSIONS.md\` Addendum v1.1).

**Foundation commits (this session):**

- \`230ba43\` docs(tier-4c phase 1): draft design doc \`docs/TIER-4C-DESIGN.md\` (~424 lines, 11 sections, T1-T8 decisions)
- \`303df65\` fix(konteks-1 TD): UI display jumlahBiayaRevisi pakai Konteks 1 fallback semantic (T8a applied di PaguAnggaran.tsx line 368 via getEffectiveValue)
- \`857e98c\` feat(tier-4c phase 1.5): types narrow rpdsData unknown[] → RPDSection[] untuk C11 cross-table check
- (this commit) docs(tier-4c handover prep): SSOT §0.11 + HANDOVER + README + SESSION-START-HERE + OWNER-POLICY Addendum v1.1 + devLog

**Decisions T1-T8 Owner-approved:**

- T1 (C12 timezone): Client \`new Date()\` browser WIB
- T2 (C10 SBM source): \`hargaSatuanAwal\` baseline proxy (v1 pragmatic)
- T3 (C11 cross-table depth): V1 simplified — flag affected RPD rows
- T4 (C10 thresholds): Warn 10%, Fail 25%
- T5 (C11 link method): Strict \`linkedPaguSectionId\` + \`kode\` exact
- T6 (C12 violation message): Full Pasal cite + TA+1 action guidance
- T7 (Cross-tab nav signature): \`onNavigate(target: 'pagu' | 'rpd', sectionId, rowId)\`
- T8 (Konteks 1 TD fix): T8a re-derive via \`getEffectiveValue\` ✅ APPLIED \`303df65\`

**Architectural finding preserved:**
\`RPDRow.monthly\` adalah SINGLE snapshot (per Sprint A2) — no Awal/Revisi separation. Simplifies C11 V1 algorithm: hanya detect "affected" RPD rows (via linkedPaguSectionId + kode match) tanpa numerical sum verification. V2 strict enhancement defer ke future Tier 5+ when audit trail tracks RPD update workflow.

**Implementation work split ke fresh AI session:**

| Phase | Deliverable | Estimated |
|---|---|---|
| Branch creation | \`feature/tier-4c-procedural-references\` | 0 turn |
| Phase 2a | Fixture \`validation-scenarios-4c.json\` ~15 scenarios | 1 turn |
| Phase 2b Turn 1 | C12 Deadline + ~12 tests | 1 turn |
| Phase 2b Turn 2 | C10 SBM (first WARN severity) + ~20 tests | 1 turn |
| Phase 2b Turn 3 | C11 RPD (cross-table) + ~25 tests | 1-2 turns |
| Phase 3a-d | UI + cross-tab navigation refactor | 3-4 turns |
| Phase 4 | Owner E2E test → squash merge | 1 turn |
| **TOTAL fresh session** | | **~7-10 turns** |

**Expected final state post Tier 4c implementation:**
- All 12 validators live (C1-C12)
- Test baseline: ~449 tests (392 + 57 Tier 4c)
- Submit Revisi POK button FINALLY enables (12/12 implemented + LHR ack + canSubmit)
- Tier 5 audit trail jadi clear next priority (butuh Owner DDL CREATE TABLE usulan_revisi)

**Self-contained handover artifacts untuk fresh AI session:**
- \`HANDOVER.md\` updated
- \`SESSION-START-HERE.md\` banner directive
- \`SSOT-REFACTOR-LOG.md §0.11\` decisions log
- \`docs/TIER-4C-DESIGN.md\` the plan
- \`OWNER-POLICY-FOR-AI-SESSIONS.md\` Addendum v1.1 (compaction-aware verification, session split protocol, Tier 4c specific guidance)
- Zip bundle di \`/mnt/user-data/outputs/\` untuk Owner share ke fresh session

**Verification baseline maintained:**
- TS errors: 8 (zero regression dari Konteks 1 TD fix)
- Vitest: 392 tests pass (no test changes — types narrow + bugfix tidak affect test count)
- Vite build: success
- Working tree clean post all commits

**Cross-references:**
- Tier 4c design: \`docs/TIER-4C-DESIGN.md\` (commit \`230ba43\`)
- Konteks 1 TD fix: \`303df65\` (resolves §0.10.4 entry)
- Phase 1.5 types: \`857e98c\`
- Owner policy: \`OWNER-POLICY-FOR-AI-SESSIONS.md\` Addendum v1.1
- Predecessor milestone: \`log-2026-05-11-tier-4b-merged-to-main\`
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 (C10-C12)`,
    decisions: ['§Tier4c-T1', '§Tier4c-T2', '§Tier4c-T3', '§Tier4c-T4', '§Tier4c-T5', '§Tier4c-T6', '§Tier4c-T7', '§Tier4c-T8'],
    related: ['log-2026-05-11-tier-4b-merged-to-main', 'log-2026-05-11-tier-4b-phase-3-complete', 'log-2026-05-11-tier-4-design'],
  },

  {
    id:    'log-2026-05-11-tier-4b-merged-to-main',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4b',
    title: 'Tier 4b MERGED TO MAIN — Phase 4 Squash Merge Complete',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 4b sub-branch \`feature/tier-4b-revisi-mechanism\` **MERGED TO MAIN** sebagai squash commit \`d13be80\`. Post-merge docs sync sebagai \`882bb58\`. Feature branch dihapus (remote + local). Owner Vercel preview E2E test all 10 cases ✅ PASS sebelum authorize merge.

**Merge state (verified post-compaction):**
- Main HEAD: \`882bb58\` (post-merge docs sync)
- Tier 4b squash commit: \`d13be80\`
- Local = Remote sync clean
- Only \`main\` branch exists remote (semua feature branches deleted)

**Squash audit trail (11 commits → 1):**
- \`51fab33\` docs phase 1: design document — C6-C9 algoritma + S1-S6
- \`fd59031\` feat phase 1.5: C1 message enhancement + types + §0.10
- \`105a7f0\` feat phase 2a: fixture 15 scenarios C6-C9
- \`1660446\` feat phase 2b Turn 1: C6 Jenis Belanja + 27 tests
- \`c2fcadb\` feat phase 2b Turn 2: C7 Sumber Dana + 28 tests
- \`08b7066\` feat phase 2b Turn 3: C9 Akun Minus + 18 tests
- \`26b165d\` feat phase 2b Turn 4: C8 LHR APIP + 15 tests
- \`35d661f\` docs phase 3a: UI design delta
- \`0e3595a\` feat phase 3b: C6-C9 cards live transition
- \`ec667fd\` feat phase 3c: LHR APIP checkbox NEW UX + Submit gating
- \`1e333cd\` docs phase 3d: docs sync Phase 3 COMPLETE

**Squash result (\`d13be80\`):**
- 21 files changed (+3,288 / -31 lines)
- 4 validators delivered: C6 + C7 + C8 + C9 (88 new tests)
- C1 violation message UX enhancement batched
- ValidationContext.lhrApipAcknowledged field reused (forward-compat dari Tier 4a)
- UI integration: cards C6-C9 live + LHR APIP checkbox + Submit triple gating

**Owner Vercel preview E2E test results (11 Mei 2026):**
1. ✅ Visual: 9 live cards (C1-C9) + 3 todo (C10-C12) — colored borders correct
2. ✅ Counter chips reflect 3 todo + 9 implemented (75% progress bar)
3. ✅ LHR APIP checkbox visible + interactive (amber → emerald)
4. ✅ C8 state flip pending → pass saat checkbox checked
5. ✅ Submit button triple gating verified
6. ✅ Inline indicators di Pagu Anggaran kolom Kode
7. ✅ Click validation dot → navigate Validasi tab + auto-expand detail
8. ✅ "→ Pagu Anggaran" navigation back + scroll + 2s emerald glow
9. ✅ Cross-year LHR state isolation (per-year Record)
10. ✅ Browser DevTools console clean

**Post-merge state cumulative:**

| Tier | Tests | Squash commit |
|---|---|---|
| Tier 3 metadataRecommender | 201 | \`6c8f640\` |
| Tier 4a C1-C5 + UI | 103 | \`abe193c\` |
| Tier 4b C6-C9 + UI | 88 | \`d13be80\` |
| **TOTAL** | **392 tests** | |

Plus production state:
- TS baseline: 8 errors maintained (pre-existing tech debt)
- Vite build: success ~5.76s, ~1.53MB bundle
- 9 of 12 validators functional production (C1-C9 live, C10-C12 todo placeholder)

**Branch hygiene final state:**
- main: \`882bb58\` ✓
- feature/tier-3-metadata-schema: DELETED ✓
- feature/tier-4a-pagu-structure: DELETED ✓
- feature/tier-4b-revisi-mechanism: DELETED ✓ (this milestone)
- feature/tier-4c-procedural-references: TBD (next sub-branch)
- feature/tier-5-audit-trail: TBD (butuh Owner DDL CREATE TABLE usulan_revisi)

**Architectural highlights yang preserve di permanent docs:**

1. **Algorithm pattern diversity (4 patterns dari Tier 4b):**
   - C6: Grouping with preprocessing (derive 2-digit kode_bas)
   - C7: Grouping with direct field (no preprocessing)
   - C9: Per-leaf direct check (BYPASS Konteks 1 fallback)
   - C8: Procedural state check (no sections traversal, boolean only)

2. **C9 critical bug catch + fix during dev** — Konteks 1 fallback semantic
   divergence captured + documented permanent di c9.ts docblock. Initial
   implementation pakai effectiveRevisi helper masked negative typo karena
   condition \`hsr > 0 ? hsr : hsa\` fallback. Fix: row.jumlahBiayaRevisi
   direct per spec literal. Semantic divergence: C9 BYPASS Konteks 1
   fallback (intentional, untuk catch raw typo input).

3. **Forward-compatible Tier 4a payoff** — Phase 1.5 zero structural type
   changes karena lhrApipAcknowledged field sudah ada dari Phase 1 Tier 4a
   sebagai forward-compat placeholder. Saved implementation effort.

4. **C1 message UX enhancement batched** — DIPA Hal III pathway guidance
   di FAIL violation message. Case study RS Batin Tikal 2025 (layanan
   bedah saraf full operasional, add pagu Rp 1.7M → C1 FAIL correctly
   flagged → DIPA Hal III correct pathway, NOT revisi POK kewenangan KPA).

**Open items carry-forward (SSOT §0.10.4):**
- C10 SBM dictionary shape (Tier 4c Phase 1 decision)
- C11 cross-tab navigation — RPD tab 1.3 routing (Tier 4c implementation)
- C12 deadline 27 Des semantics (Tier 4c Phase 1 decision)
- Konteks 1 finding \`PaguAnggaran.tsx:50-51\` (UNRESOLVED pre-existing TD)

**Cross-references:**
- Squash commit hash: \`d13be80\`
- Post-merge docs sync: \`882bb58\`
- Design parent: \`docs/TIER-4B-DESIGN.md\` (Phase 1)
- Phase 3 delta: \`docs/TIER-4B-PHASE-3-UI-DESIGN.md\`
- SSOT decisions log: \`SSOT-REFACTOR-LOG.md\` §0.10.1-§0.10.5
- Predecessor milestone: \`log-2026-05-11-tier-4b-phase-3-complete\`
- Tier 4a predecessor squash: \`abe193c\`
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 + §3.5`,
    decisions: ['§Tier4b-S1', '§Tier4b-S2', '§Tier4b-S3', '§Tier4b-S4', '§Tier4b-S5', '§Tier4b-S6'],
    related: ['log-2026-05-11-tier-4b-phase-3-complete', 'log-2026-05-11-tier-4a-phase-3-complete', 'log-2026-05-11-tier-4-design'],
  },

  {
    id:    'log-2026-05-11-tier-4b-phase-3-complete',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4b',
    title: 'Tier 4b Phase 3 COMPLETE — Cards C6-C9 Live + LHR APIP Checkbox',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 4b sub-branch \`feature/tier-4b-revisi-mechanism\` Phase 1+2a+2b+3 **selesai**. Branch siap untuk Phase 4 (Owner Vercel preview E2E test → squash merge ke main).

**Branch state:** \`feature/tier-4b-revisi-mechanism\` (10 commits ahead of main)

**Tier 4b commits audit trail (10 commits squashable):**
- \`51fab33\` docs phase 1: design document — C6-C9 algoritma + decisions S1-S6
- \`fd59031\` feat phase 1.5: C1 message enhancement + types confirmation + SSOT §0.10
- \`105a7f0\` feat phase 2a: fixture validation-scenarios-4b.json — 15 scenarios C6-C9
- \`1660446\` feat phase 2b Turn 1: C6 Jenis Belanja validator + 27 tests
- \`c2fcadb\` feat phase 2b Turn 2: C7 Sumber Dana validator + 28 tests
- \`08b7066\` feat phase 2b Turn 3: C9 Akun Minus validator + 18 tests
- \`26b165d\` feat phase 2b Turn 4: C8 LHR APIP validator + 15 tests
- \`35d661f\` docs phase 3a: UI design delta — 4 sub-phases plan
- \`0e3595a\` feat phase 3b: C6-C9 cards live transition di dashboard
- \`ec667fd\` feat phase 3c: LHR APIP checkbox NEW UX + Submit gating

**Tier 4b functional scope delivered:**

4 Validators (Phase 2b):
- **C6 Jenis Belanja** (Pasal 22 b angka 1): Group changed leaves by 2-digit kode_bas (jenis 51/52/53/57); ≥2 distinct → fail. 27 tests.
- **C7 Sumber Dana** (Pasal 22 b angka 1): Group changed leaves by sumber_dana_kode direct (RM/PNBP/PHLN/PLN/PDN/SBSN/HIBAH); ≥2 distinct → fail. 28 tests.
- **C8 LHR APIP** (Pasal 22 b angka 2 BARU): Boolean state check via ctx.lhrApipAcknowledged. Procedural — no sections traversal. 15 tests.
- **C9 Akun Minus** (Prinsip umum APBN): Per-leaf check leaf.jumlahBiayaRevisi < 0. SEMANTIC DIVERGENCE — BYPASS Konteks 1 fallback (yang akan MASK negative typo). 18 tests.

Total Phase 2b Tier 4b: 88 tests cumulative. Combined dengan Tier 4a (103) + Tier 3 (201) = **392 total tests baseline**.

UI Integration (Phase 3):
- **3a (Design):** \`docs/TIER-4B-PHASE-3-UI-DESIGN.md\` brief delta dokumen
- **3b (Cards live):** \`runAllValidators.ts\` — C6-C9 transition todo → live. Cards C6-C9 di dashboard sekarang render real validator output. Sub-branch group "4b" subtitle: 'BELUM TERSEDIA' → 'IMPLEMENTED'. Aggregate counter implemented: 5/12 → 9/12. Progress bar fill auto-extends.
- **3c (LHR APIP checkbox NEW UX):** Checkbox di \`ValidationDashboardHeader\` antara progress bar dan submit button. Visual: amber accent saat unchecked, emerald saat checked. Triple gating Submit button: canSubmit + allImplemented + lhrApipAcknowledged. Per-year state Record<number, boolean> di App.tsx, in-memory v1 (per Decision S6).
- **3d (this milestone):** Docs sync untuk anti-drift handover.

**Key architectural insights:**

1. **Algorithm pattern diversity** — Tier 4b demonstrate 4 distinct patterns:
   - C6: Grouping with preprocessing (derive 2-digit dari kode_bas)
   - C7: Grouping with direct field (no preprocessing)
   - C9: Per-leaf direct check (sanity scan, BYPASS Konteks 1 fallback)
   - C8: Procedural state check (no sections traversal, boolean only)

2. **C9 critical bug catch + fix during dev** — Initial implementation pakai effectiveRevisi helper, 7 expected-fail tests incorrectly returned pass karena Konteks 1 fallback (\`hsr > 0 ? hsr : hsa\`) masks negative typo. Fix: switch to row.jumlahBiayaRevisi direct per types.ts spec literal. SEMANTIC DIVERGENCE documented di c9.ts docblock — Konteks 1 fallback cocok untuk pergeseran/grouping (C1/C6/C7) BUKAN untuk typo detection.

3. **Forward-compatible design Tier 4a payoff** — Phase 1.5 expected types extension turned out **zero changes** karena \`lhrApipAcknowledged\` field SUDAH ADA di types.ts dari Phase 1 Tier 4a (forward-compatible placeholder). Saved implementation effort.

4. **C1 violation message UX enhancement batched** — Per §0.9.5 backlog item. Append DIPA Halaman III pathway guidance ke C1 FAIL violation message. Done di Phase 1.5 bersama types confirmation.

**Verification post Phase 3:**
- TS baseline: 8 errors maintained (zero new errors di Tier 4b files)
- Vitest baseline: 392 tests pass (304 Tier 4a baseline + 88 Tier 4b new)
- Vite build: success ~6.35s, ~1.53MB bundle
- LHR checkbox UX verified — state change triggers re-validate, C8 transition pending→pass

**Phase 4 readiness:**
- All 9 validators functional di production data (C1-C9, 4c pending)
- UI integration complete: 9 cards live + 3 cards todo placeholder + LHR APIP checkbox + Submit gating triple condition
- Owner action: Vercel preview E2E test → authorize squash merge

**Open items carry-forward dari §0.9.5/§0.10.4:**
- C10 SBM dictionary shape (Tier 4c Phase 1 decision)
- C11 cross-tab navigation (Tier 4c — RPD tab 1.3 routing)
- C12 deadline 27 Des semantics (Tier 4c Phase 1 decision)
- Konteks 1 finding \`PaguAnggaran.tsx:50-51\` (UNRESOLVED, pre-existing TD)

**Cross-references:**
- Design parent: \`docs/TIER-4B-DESIGN.md\` (Phase 1)
- Phase 3 delta: \`docs/TIER-4B-PHASE-3-UI-DESIGN.md\` (Phase 3a)
- Tier 4a UI baseline: \`docs/TIER-4A-PHASE-3-UI-DESIGN.md\` (reference)
- SSOT decisions log: \`SSOT-REFACTOR-LOG.md\` §0.10 (Tier 4b S1-S6)
- Predecessor: \`log-2026-05-11-tier-4a-phase-3-complete\` (Tier 4a milestone)
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 (12 constraints)`,
    decisions: ['§Tier4b-S1', '§Tier4b-S2', '§Tier4b-S3', '§Tier4b-S4', '§Tier4b-S5', '§Tier4b-S6'],
    related: ['log-2026-05-11-tier-4a-phase-3-complete', 'log-2026-05-11-tier-4a-phase-2b-complete', 'log-2026-05-11-tier-4-design'],
  },

  {
    id:    'log-2026-05-11-tier-4a-phase-3-complete',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4a',
    title: 'Tier 4a Phase 3 COMPLETE — UI Integration (Dashboard + Inline Indicators + Bidirectional Nav)',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Phase 3 UI integration **selesai** sub-phase 3a (design) + 3b (dashboard) + 3c (inline indicators) + 3d (wiring polish). Branch \`feature/tier-4a-pagu-structure\` siap untuk Phase 4 (Owner Vercel preview E2E test → squash merge ke main).

**Branch state:** \`feature/tier-4a-pagu-structure\` (HEAD post Phase 3d, 13 commits ahead of main)

**Phase 3 commits (audit trail):**
- \`9c836b8\` Phase 3a: UI design draft \`docs/TIER-4A-PHASE-3-UI-DESIGN.md\` (421 lines)
- \`25adbd5\` Phase 3b: Dashboard tab "Validasi Revisi POK" + 12-card grid + 4 file baru (901 insertions)
- \`2246b3c\` Phase 3c: Inline validation indicators di Pagu Anggaran + bidirectional Pagu↔Validasi nav (269 insertions)
- HEAD next: Phase 3d wiring polish — row-level scroll/highlight + auto-revalidate

**Functional scope delivered Phase 3:**

UI Architecture (Phase 3a design, all Q-UI-1..Q-UI-7 defaults approved):
- New sub-tab "1.5 Validasi Revisi POK" di MainTab 1 (sibling 1.1 Pagu / 1.2 RAB / 1.3 RPD / 1.4 LRA)
- 6 card visual states: pass (emerald) / warn (amber) / fail (red) / pending (blue) / na (slate solid) / todo (slate dashed)
- 12-card grid grouped by sub-branch 4a/4b/4c — current state: 5 implemented (C1-C5) + 7 placeholder "Belum Tersedia"
- Inline detail panel below grid (per Q-UI-2 default — not modal)
- Submit Revisi POK button disabled selama todo > 0 (visibility roadmap)

Components delivered (Phase 3b — 4 file baru, 901 lines):
- \`utils/validators/runAllValidators.ts\` — orchestrator: run C1-C5 + placeholder C6-C12 dengan TODO_MARKER. Helpers isTodoState/getTodoSubBranch
- \`components/ValidationConstraintCard.tsx\` — single card 6 visual states (STATE_STYLES Record)
- \`components/ValidationDashboardHeader.tsx\` — 5 counter chips + progress bar + Validate Now + Submit button
- \`components/ValidasiRevisiPOK.tsx\` — main orchestrator + inline DetailPanel sub-component
- Integration: \`types.ts\` SubTab.VALIDASI + TabType.VALIDASI; \`App.tsx\` SubTabButton + render branch

Inline Indicators (Phase 3c — 1 file baru + 4 modified, 269 lines):
- \`utils/validators/rowConstraintMap.ts\` — buildRowConstraintMap + pickPriorityIndicator + buildTooltipText helpers
- \`components/PaguAnggaran.tsx\` — validation dot di kolom Kode (right of existing Sprint D diff dot, 2 dots side-by-side); useMemo auto-recompute on sections change; click → onNavigateToValidasi(priorityConstraintId)
- Severity priority: fail > warn > pending; tie-break by canonical ConstraintId order
- Hover tooltip multi-line: list affected constraints dengan status icons (❌/⚠️/⏸️)
- Bidirectional navigation: Pagu dot click → Validasi tab dengan detail panel auto-expand; Validasi "→ Pagu Anggaran" → back ke tab 1.1

Wiring Polish (Phase 3d):
- Row-level scroll + highlight glow saat navigate dari Validasi DetailPanel → Pagu Anggaran tab (~2s emerald ring glow, scrollIntoView smooth center)
- data-row-id attribute pada \`<tr>\` element untuk DOM query target
- Silent no-op kalau row hidden (section collapsed/filtered)
- ValidasiRevisiPOK useEffect deps cleanup: [handleValidate] lint-correct
- Auto-revalidate setelah Apply Recommendation / Override Modal commit sudah implicit via useMemo PaguAnggaran (Phase 3c) — Phase 3d formalize lint correctness

**State management architecture:**
- \`pendingValidasiConstraint\` (App state) — Pagu dot → Validasi auto-select handoff
- \`pendingPaguRowHighlight\` (App state) — Validasi → Pagu scroll target handoff
- Both consumed via useEffect + cleared via callback (one-shot pattern)
- PaguAnggaran validation: local useMemo on (sections + selectedYear)
- ValidasiRevisiPOK validation: local useState + useEffect on mount (component unmount/remount preserve fresh data fetch)
- Slight duplicate computation (~5ms × 2) acceptable; lift to App.tsx noted as future cleanup post-merge

**Verification post Phase 3d:**
- TS baseline: 8 errors maintained (7 App.tsx + 1 PaguAnggaran.tsx pre-existing — Konteks 1 finding line 434 ".join() on unknown" carried)
- Vitest baseline: 304 tests pass maintained (UI components no coverage per existing pattern)
- Vite build: success, 5.82s, ~1.53MB bundle (~294KB gzipped)
- Functional E2E flow verified Owner Vercel preview Phase 3b + 3c (confirmation 11 Mei 2026)

**Real-world signal validation (RS Batin Tikal 2025 case study):**
- C1 FAIL detection di production data — total pagu satker net change != 0 karena Sie Renbang trial mencoba add pagu Rp 1.7M untuk service expansion (layanan bedah saraf full operasional Trisemester 2-3 2025: equipment Alsintor/Alkes + BMHP/Obat + jasa nakes)
- Validator catch wrong-mechanism risk — pathway harus DIPA Halaman III via KAPK Kakesdam II/Sriwijaya, BUKAN revisi POK kewenangan KPA (Pasal 22 b angka 1 prohibit total ubah pagu)
- Pertumbuhan signifikan pasien BPJS post-operasionalisasi bedah saraf langka di Pulau Bangka (dr Ferry neurosurgeon, full-operational Tr 2-3 2025)
- High-value Tier 4 outcome — validator working as intended, catch risk BEFORE dokumen di-submit oleh KPA
- C1 violation message UX enhancement captured §0.9.5 sebagai low-priority post-merge task

**Open items captured §0.9.5:**
- C1 violation message helper text (alternative pathway guidance) — defer post-Tier-4a-merge
- C11 cross-tab navigation note — Tier 4c implementation harus support RPD tab 1.3 routing
- Konteks 1 finding PaguAnggaran:50-51 (UNRESOLVED, UI display bug carry)
- C8 LHR APIP storage shape (Tier 4b)
- C10 SBM dictionary shape (Tier 4c)

**Phase 4 readiness:**
- All 5 validators functional di production data
- UI integration complete: dashboard + inline indicators + bidirectional navigation + scroll/highlight
- Decision H1 single-squash-merge pattern preserved
- Owner action items: visual E2E test Vercel preview → authorize squash merge \`feature/tier-4a-pagu-structure\` → main → start \`feature/tier-4b-revisi-mechanism\` (C6-C9)

**Cross-references:**
- Design doc: \`docs/TIER-4A-PHASE-3-UI-DESIGN.md\` §1-13 (placement, states, panels, indicators, Q-UI-1..7)
- SSOT log: \`SSOT-REFACTOR-LOG.md\` §0.9.5 open items
- Predecessor: \`log-2026-05-11-tier-4a-phase-2b-complete\` (5 validators)
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 + §12.2`,
    decisions: ['§Tier4-O3', '§Tier4-Q1', '§Tier4-Q2', '§Tier4-Q3', '§Tier4-Q4', '§Tier4-Q5', '§Tier4-Q6', '§Tier4-Q7', '§Tier4-UI1', '§Tier4-UI2', '§Tier4-UI3', '§Tier4-UI4', '§Tier4-UI5', '§Tier4-UI6', '§Tier4-UI7'],
    related: ['log-2026-05-11-tier-4a-phase-2b-complete', 'log-2026-05-11-tier-4a-foundation', 'log-2026-05-11-tier-4-design'],
  },

  {
    id:    'log-2026-05-11-tier-4a-phase-2b-complete',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4a',
    title: 'Tier 4a Phase 2b COMPLETE — All 5 Validators (C1-C5) + 103 Tests',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Phase 2b sub-branch 4a (Pagu Structure C1-C5) **selesai sepenuhnya** dengan kelima validator implementeed + comprehensive test coverage. Branch \`feature/tier-4a-pagu-structure\` siap untuk Phase 3 (UI integration dashboard "Validasi Revisi POK") sebelum eventual squash merge ke main.

**Branch state:** \`feature/tier-4a-pagu-structure\` (HEAD \`e76284a\`, 8 commits ahead of main)

**Turn 1-4 Phase 2b commits (audit trail):**
- \`4191915\` Phase 1: validation types + 12-constraint specs catalogue
- \`ed4650b\` Phase 2a: validation fixture 13 scenarios C1-C5
- \`52ed3a3\` Phase 2b: validators C1 + C4 + 32 tests (Turn 1)
- \`a5e9d0b\` Phase 2b Turn 2: C3 + helpers extraction (+ 20 tests)
- \`f94b27f\` State-sync merge main → feature (bring §0.9 + devLog cleanup)
- \`f7ccfc3\` SSOT §0.9 R1-R5 decisions + Turn 2 status sync pre-Turn 3
- \`ab83c06\` Phase 2b Turn 3: C2 validator + 27 tests (Pergeseran 1 KRO)
- \`86fff4c\` Phase 2b Turn 4: C5 validator + helpers.collectAllLeaves + 24 tests
- \`e76284a\` SSOT §0.9 batch update post Phase 2b complete + R4 fix (8 akun)

**5 Validators delivered (utils/validators/):**

| File | Lines | Tests | Algorithm |
|---|---|---|---|
| \`c1.ts\` | 127 | 24 | Sum-based: totalAwal vs totalRevisi via leaf traversal + epsilon Rp 0.50 |
| \`c2.ts\` | 213 | 27 | Group by kro_code distinct count (skema 5.a, v1) |
| \`c3.ts\` | 164 | 20 | Group by kegiatan_code distinct count |
| \`c4.ts\` | 62 | 8 | Deterministic pass (single-satker app scope) |
| \`c5.ts\` | 270 | 24 | Group by ro_code, NA strict + MIXED warn per R5 |
| \`helpers.ts\` | 153 | — | isLeaf §0.7.2, effectiveAwal/Revisi §0.7.3, isChangedRow, collectAllLeaves, collectChangedLeaves, formatRupiah, EPSILON_RUPIAH |

**Test baseline progress:**
- Pre-Turn 1: 201 tests (Tier 3 only)
- Post-Turn 1 (52ed3a3): 233 tests (+24 C1, +8 C4)
- Post-Turn 2 (a5e9d0b): 253 tests (+20 C3)
- Post-Turn 3 (ab83c06): 280 tests (+27 C2)
- **Post-Turn 4 (86fff4c): 304 tests (+24 C5)** ← current baseline

**Phase 2b cumulative validator tests: 103** (24+27+20+8+24)

**TS baseline maintained:** 8 errors (7 App.tsx + 1 PaguAnggaran.tsx pre-existing — unrelated ke Tier 4 work)

**Governance decisions captured (§0.9.1 R1-R5):**
- R1: "changed row" pakai effective values via \`helpers.isChangedRow\` (Konteks 1 consistent)
- R2: strict pending (ANY changed row missing grouping field → pending)
- R3: \`metadata_review.override_to='high'\` only forces confidence, BUKAN fill data fields
- R4: C5 grouping per leaf row dalam ro_code yang sama (verified 8 akun BAS RO 962 per §12.2)
- R5: C5 NA strict (ALL missing → na); MIXED → warn evaluate yang ada

**Architectural patterns established:**
- **Plain-language docblock** dengan analogi medis di tiap validator (Owner background friendly)
- **Mirror pattern**: c2/c3 grouping logic share struktur, c5 extends untuk multi-field check
- **Shared helpers** di \`helpers.ts\` — reuse across C1-C5 + ready untuk future C6/C7/C9 (jenis belanja, sumber dana, akun minus)
- **Fixture-driven baseline tests** + inline edge cases (defensive coverage pattern Tier 3 \`metadataRecommender\`)
- **JSONB-native zero-DDL** maintained — semua field consumption via existing PaguRow optional metadata fields

**Next steps:**
- **Phase 3** — UI integration dashboard "Validasi Revisi POK" 12-card grid + inline indicators di Pagu Anggaran tab (per Decision O3)
- **Phase 4** — Owner Vercel preview test → squash merge \`feature/tier-4a-pagu-structure\` → main
- **Sub-branch 4b** — C6-C9 (Revisi Mechanism) sequential setelah 4a merged

**Open finding (carry-forward dari §0.9.5):**
- \`components/PaguAnggaran.tsx:50-51\` Konteks 1 overwrite bug — affecting UI display, BUKAN validator logic (C1 handle correctly via \`effectiveRevisi\`). Worth investigating saat Phase 3 UI work.

**Cross-references:**
- SSOT log: \`SSOT-REFACTOR-LOG.md\` §0.9.1-§0.9.7 (decisions + technical + open items)
- Design doc: \`docs/TIER-4-DESIGN.md\` §3.1 Tier 4a constraint specs
- Master domain: \`docs/REVISI-POK-PAGU-vKoreksi.md\` §3.3 C1-C12 verbatim + §3.5 skema 5.a/b/c + §12.2 BAS RKKS Batin Tikal
- Predecessor entries: \`log-2026-05-11-tier-4a-foundation\` (Phase 1+2a+2b partial), \`log-2026-05-11-tier-4-design\` (architecture spec), \`log-2026-05-11-tier-3-metadata-merge\` (Tier 3 consumer)`,
    decisions: ['§Tier4-R1', '§Tier4-R2', '§Tier4-R3', '§Tier4-R4', '§Tier4-R5'],
    related: ['log-2026-05-11-tier-4a-foundation', 'log-2026-05-11-tier-4-design', 'log-2026-05-11-tier-3-metadata-merge'],
  },

  {
    id:    'log-2026-05-11-tier-4a-foundation',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4a',
    title: 'Tier 4a — Foundation Phase 1+2a+2b Partial (C1+C4 Validators)',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Foundation untuk validation engine 12 hard constraints (C1-C12) Revisi POK kewenangan KPA. Sub-branch 4a (Pagu Structure C1-C5) di-implement sequential per Decision N2; Phase 1+2a complete + Phase 2b partial (2 dari 5 validators selesai).

**Branch:** \`feature/tier-4a-pagu-structure\` (3 commits ahead of main)

**Phase 1 (4191915) — Validation Types Catalogue:**
- \`utils/validators/types.ts\` (336 lines)
- Type definitions inclusive untuk ALL 12 constraint (avoid drift antar sub-branches)
- \`CONSTRAINT_SPECS\` catalogue: 12 entries dengan canonical title + pasal + severity verbatim dari vKoreksi v3 §3.3
- Types: ConstraintId, SubBranch, ConstraintStatus (pass/warn/fail/pending/na), ConstraintSeverity, ConstraintSpec, ConstraintViolation, ConstraintResult, ValidationResult, ValidationContext, Validator

**Phase 2a (ed4650b) — Ground Truth Fixture:**
- \`utils/fixtures/validation-scenarios-4a.json\` (475 lines, 13 scenarios)
- Coverage: C1 (4), C2 (3), C3 (2), C4 (1), C5 (3) — total 6 pass + 5 fail + 1 pending + 1 na
- Pattern: simulated-patient training cases — mock revisi POK dengan expected verdict pasti

**Phase 2b partial (52ed3a3) — C1 + C4 Validators (per Decision Q3):**
- \`utils/validators/c4.ts\` (60 lines) — Deterministic single-satker pass
- \`utils/validators/c1.ts\` (170 lines) — Total Pagu Net Change check dengan Konteks 1 fallback (hargaSatuanRevisi=0 → fallback ke Awal per Sprint D Item #1)
- Helper functions: \`isLeaf\` (traversal §0.7.2), \`effectiveAwal\`, \`effectiveRevisi\`, \`formatRupiah\`
- \`c1.test.ts\` (24 tests) + \`c4.test.ts\` (8 tests) = 32 new tests
- Test framework: Vitest 2.1.9 (reuse dari Tier 3)
- Verification: 233 tests pass cumulative (201 Tier 3 + 32 Tier 4a partial)

**Decisions Owner-approved (11 Mei 2026):**
- M1: Draft design doc first → Phase 1 start (done)
- N2: 3 sub-branches sequential (4a/4b/4c)
- O3: UI dashboard + inline indicators (Phase 3 berikutnya)
- P3: Start Phase 1 sekarang dengan assumption defaults
- Q1-Q6: All defaults accepted (simple boolean C8, V1 simplified SBM, dll.)
- Q3: Phase 2b — C1 + C4 saja dulu (sederhana, langsung verify); C2/C3/C5 next session

**Plain language untuk Owner (analogi medis):**
- Constraint C1 = "Conservation of mass" check (total cairan masuk = keluar)
- Constraint C4 = "Patient identity check" (selalu RS Batin Tikal — deterministic)
- Fixture = simulated training cases sebelum tested di pasien beneran
- Validator = diagnostic algorithm yang return verdict per kasus

**Next session untuk complete Phase 2b:**
- c2.ts (group by kro_code, handling pending untuk Tier 3 LOW confidence)
- c3.ts (group by kegiatan_code)
- c5.ts (group by ro_code dengan na handling)
- Lalu Phase 3 (UI dashboard + indicators) + Phase 4 (squash merge)`,
    files: [
      'utils/validators/types.ts',
      'utils/validators/c1.ts',
      'utils/validators/c4.ts',
      'utils/validators/c1.test.ts',
      'utils/validators/c4.test.ts',
      'utils/fixtures/validation-scenarios-4a.json',
    ],
    decisions: ['§Tier4-M1', '§Tier4-N2', '§Tier4-O3', '§Tier4-P3', '§Tier4-Q3'],
    related: ['log-2026-05-11-tier-4-design', 'log-2026-05-11-tier-3-metadata-merge'],
  },

  {
    id:    'log-2026-05-11-tier-4-design',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 4 Planning',
    title: 'Tier 4 — Validation Engine C1-C12 Design Document',
    type:  'docs',
    author: 'AI Assistant (Successor Session)',
    description:
`Design document untuk Tier 4 Validation Engine — implement 12 hard constraints (C1-C12) Revisi POK kewenangan KPA per Perdirjen Renhan Kemhan 7/2025 Pasal 22.

**Document:** \`docs/TIER-4-DESIGN.md\` (251 lines, commit 32bb1d7)

**Sections:**
- §1 Goal: validation engine 12 constraints menggunakan Tier 3 metadata fields
- §2 Branch strategy N2: 3 sub-branches sequential (4a Pagu Structure C1-C5, 4b Revisi Mechanism C6-C9, 4c Procedural/Reference C10-C12)
- §3 Canonical constraint specs verbatim dari vKoreksi v3 §3.3:
  - C1: Total Pagu Net Change = 0
  - C2: 1 KRO/RO sama
  - C3: 1 Kegiatan sama
  - C4: 1 Satker sama
  - C5: Volume + Satuan RO tidak berubah
  - C6: Jenis belanja tidak berubah
  - C7: Sumber dana tidak berubah
  - C8: Memperhatikan LHR APIP (BARU Perdirjen 7/2025)
  - C9: Tidak boleh akun minus
  - C10: Sesuai SBM/SBK
  - C11: Tidak ubah Halaman III DIPA (RPD)
  - C12: Deadline 27 Desember
- §4 Phasing per sub-branch (mirror Tier 3 pattern)
- §5 UI design O3: dashboard 12-card grid + inline indicators
- §6 Test framework reuse Vitest 2.1.9
- §7 6 Open Questions Q1-Q6 dengan default recommendations
- §8 Cross-references
- §9 Next actions

**Decisions captured (Owner-approved 11 Mei 2026):**
- M1: Draft design doc dulu, lalu Phase 1 start (this commit)
- N2: 3 sub-branches sequential
- O3: Both dashboard + inline indicators

**Open Questions defaults accepted:**
- Q1 C8 LHR APIP: simple boolean v1 (extend later jika perlu cross-ref items)
- Q2 C10 SBM/SBK: V1 simplified (flag deviasi %, V2 full lookup later)
- Q3 C11 Hal III DIPA: simplified detection v1 (flag affected linkedRpdId, defer detailed diff)
- Q4 Validation timing: manual button + auto-refresh setelah Apply
- Q5 Sub-branch sequence: sequential (4a → merge → 4b → merge → 4c)
- Q6 UI tab name: "Validasi Revisi POK"`,
    files: ['docs/TIER-4-DESIGN.md'],
    decisions: ['§Tier4-M1', '§Tier4-N2', '§Tier4-O3', '§Tier4-Q1', '§Tier4-Q2', '§Tier4-Q3', '§Tier4-Q4', '§Tier4-Q5', '§Tier4-Q6'],
    related: ['log-2026-05-11-tier-3-metadata-merge', 'log-2026-05-11-tier-4a-foundation'],
  },

  {
    id:    'log-2026-05-11-tier-3-metadata-merge',
    date:  '2026-05-11',
    phase: 'SSOT Refactor / Tier 3',
    title: 'Tier 3 — Metadata Schema + Recommender + UI MERGED to main',
    type:  'milestone',
    author: 'AI Assistant (Successor Session)',
    description:
`Tier 3 Metadata Schema Extension squash-merged ke main sebagai commit 6c8f640. 5 phase commits di feature/tier-3-metadata-schema branch flattened jadi 1 commit. Feature branch dihapus post-merge cleanup.

**Squash commit:** 6c8f640 (main)
**Phase commits (audit trail):**
- 91c5691 phase 1: types.ts PaguRow + 10 metadata fields + metadata_review
- 7b55d3c phase 2a: fixture 38 leaves, 92.1% high acceptance
- e0480ef phase 2b: metadataRecommender + Vitest framework (201 tests)
- 4bcffc1 phase 3: UI integration (column + expandable + Apply/Override modals)
- 4a3ad75 fix phase 3: auto-expand derived state pattern + toast K3 (post-Owner-test)

**Scope:** Enable validasi 12 hard constraints (C1-C12) Revisi POK kewenangan KPA dengan menambahkan master metadata BAS di setiap PaguRow.

**Architecture:**
- JSONB-Native (NO DDL) per SSOT §0.7.5 AP-8 — types.ts extension only, JSONB pass-through via existing App.tsx upsert (pagu_sections.data.rows). Zero DDL, zero data migration, zero Owner Dashboard action.
- Pre-existing rows: 10 metadata fields = undefined (optional via Tier 3 types)

**Recommender Pattern Matching (per RKKS 2025 §12.2):**
- 521xxx/522112/522113/524111 → EBA/962/Komp 3 (all HIGH)
- 523111 (Pemeliharaan Gedung) → CCB/4/Komp 3 (all HIGH)
- 523122 (BMP) → CCB med / RO low / Komp 3 high
- 532111.*.A (Alsintor) → CAB/5/Komp 52 (all HIGH)
- 532111.*.B (Alkes) → CAB/1/Komp 52 (all HIGH)
- 532111.C (Alsatri) → CAB med / RO low / Komp 52 high
- 536111 (Modal Lainnya) → CAB med / RO low / Komp 52 high
- Sumber Dana: BPJS/YANMASUM keyword → PNBP HIGH

**Override Mechanism:**
- row.metadata_review.override_to = 'high' forces all confidence HIGH
- Preserves null codes (Alsatri RO stays null, only confidence override)
- UI warning modal sebelum set

**UI Behavior (per Owner-approved Decisions D2/E2/F2/K3):**
- D2: Auto-expand rows MEDIUM/LOW aggregate (derived state via useMemo + XOR userToggled — bulletproof terhadap race condition yang found di Owner test 11 Mei 2026)
- E2: Modal preview with diff table before Apply
- F2: Separate 'Status Metadata' column setelah Sumber Dana
- K3: Toast info "Klik Sync (☁️) untuk persist" setelah Apply/Override

**Acceptance Metrics (Owner-verified 11 Mei 2026):**
- 92.1% aggregate HIGH confidence (35/38 leaves, ≥80% threshold) ✓
- 201 Vitest tests pass (2 fixture + 190 per-row × per-field + 9 unit) ✓
- TS baseline 11 errors maintained ✓
- Owner Vercel preview 4 verification points PASSED:
  1. Auto-expand 3 LOW rows persistent (523122 BMP, 532111.C ALSATRI, 536111 XDR)
  2. Toast muncul setelah Apply / Tandai Reviewed
  3. Manual chevron toggle berfungsi
  4. Persistence post-sync verified

**Decisions A-I + J1/K3/L Owner-approved (11 Mei 2026):**
- A: Seed = RKKS 2025 §12.2 + 14 HITL + Supabase ground truth
- B (corrected): Confidence threshold per kode_bas family
- C: Test fixture-first approach (≥80% acceptance)
- D2: Auto-expand MEDIUM/LOW
- E2: Modal preview
- F2: Separate column
- G1: Wait Owner Vercel preview test
- H1: Squash merge (done)
- I1: Next = Tier 4 Validation Engine
- J1: Auto-expand bug fix via derived state pattern (post-Owner-test)
- K3: Toast guidance after Apply/Override
- L: Persistence post-sync verified

**Lihat SSOT-REFACTOR-LOG.md §0.8 untuk full decision log + audit trail.**`,
    files: [
      'types.ts',
      'components/PaguAnggaran.tsx',
      'components/MetadataApplyModal.tsx',
      'components/MetadataDetailRow.tsx',
      'components/MetadataOverrideModal.tsx',
      'utils/metadataRecommender.ts',
      'utils/metadataRecommender.test.ts',
      'utils/fixtures/pagu-leaves-ta2025.json',
      'utils/fixtures/README.md',
      'vitest.config.ts',
    ],
    decisions: ['§Tier3-A', '§Tier3-B', '§Tier3-C', '§Tier3-D2', '§Tier3-E2', '§Tier3-F2', '§Tier3-G1', '§Tier3-H1', '§Tier3-I1', '§Tier3-J1', '§Tier3-K3', '§Tier3-L'],
    related: ['log-2026-05-11-tier-4-design', 'log-2026-05-11-tier-4a-foundation'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // STEP 5 — DECISION SUPPORT MODULE (8-9 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-09-phase-5-6-revision-proposal',
    date:  '2026-05-09',
    phase: 'Step 5 / Phase 5.6',
    title: 'Phase 5.6 — Revision Proposal Generator LIVE',
    type:  'feature',
    author: 'AI Assistant (Successor Session)',
    description:
`Auto-generate draft proposal revisi pagu dari analisis deviasi + early warning. Sie Renbang bisa langsung klik "Buat Proposal Revisi" dari EarlyWarningPanel.

**Output format:**
- In-app modal preview (surat dinas RS TNI AD layout)
- Copy-to-clipboard (plain text version)
- Print-ready HTML (opens new window with proper styling)

**5 section proposal:**
1. KOP Surat (RS TNI AD header)
2. Latar Belakang (summary deviasi + early warning status)
3. Ringkasan Deviasi per Kategori (tabel RPD vs Realisasi)
4. Peringatan Dini (tabel warning + critical alerts)
5. Faktor Dinamika & Konteks Alasan (reasoning distribution + faktor eksternal)
6. Detail per Kategori (monthly breakdown untuk kategori signifikan)
7. Rekomendasi (auto-generated berdasarkan pattern + severity)

**Files:** components/RevisionProposalGenerator.tsx (608 LOC)
**Bundle:** +38 KB total Phase 5.5+5.6 combined.`,
  },

  {
    id:    'log-2026-05-09-phase-5-5-early-warning',
    date:  '2026-05-09',
    phase: 'Step 5 / Phase 5.5',
    title: 'Phase 5.5 — Early Warning Engine LIVE',
    type:  'feature',
    author: 'AI Assistant (Successor Session)',
    description:
`Early Warning Engine shipped — pattern detection otomatis dari deviation data. Integrated sebagai panel di DeviationDashboard antara header strip dan charts.

**3-tier severity:** Info (≥10%), Warning (≥20%), Critical (≥50%).

**4 pattern types:**
- Spike: lonjakan belanja >30% month-to-month
- Gradual Inflation: 3+ bulan berturut naik
- Cliff Drop: penurunan tajam >40% month-to-month
- Sustained Overspend: 3+ bulan di atas warning threshold

**Health assessment:** healthy / watch / at_risk / critical — dengan badge + message di panel header.

**UI features:**
- Collapsible panel (expand/collapse)
- Severity filter tabs (Semua/Kritis/Peringatan/Info)
- Alert cards dengan pattern badge, recommendation, deviation %
- "Buat Proposal Revisi" button → triggers Phase 5.6

**Architecture:** Pure compute \`utils/earlyWarning.ts\` (540 LOC) + UI \`components/EarlyWarningPanel.tsx\` (310 LOC). 0 external deps, configurable thresholds via system_settings (fallback defaults).`,
  },

  {
    id:    'log-2026-05-09-phase-5-4-deviation-dashboard',
    date:  '2026-05-09',
    phase: 'Step 5 / Phase 5.4',
    title: 'Phase 5.4 — Deviation Dashboard LIVE (Pure SVG Charts)',
    type:  'feature',
    author: 'AI Assistant Session B',
    description:
`Deviation Dashboard shipped sebagai sub-tab baru "4.2 Deviasi & Tinjauan" di Tab 4 (Pelaporan & LRA). Sie Renbang sekarang bisa visualisasi deviasi RPD vs Realisasi per kategori per bulan dengan color-coding by reasoning category.

**2 Pure SVG Charts (0 KB external deps):**
- Stacked Bar Chart: 4 kategori stacked per bulan, bar height = realisasi, dashed overlay = RPD plan. Warna hybrid — reasoning category color kalau ada audit entry, fallback muted category base color.
- Line Chart: 4 lines (% deviasi per kategori), zero-line prominent, positive = overspend, negative = underspend.

**Drill-down modal** (click bar/point): header + realisasi breakdown per bill + RPD plan + reasoning context dari audit entries terkait.

**Sub-tab navigation** di Tab 4: types.ts +2 SubTab enum (LAPORAN_LRA, DEVIASI_TINJAUAN). App.tsx handleMainTabChange default ke LAPORAN_LRA, handleSubTabChange routes both to FINANCIAL_HEALTH. Sub-tab button bar conditionally rendered.

**Pure compute utility** \`utils/deviationMetrics.ts\` (381 LOC): computeDeviationMetrics, buildCategoryCodeMap, aggregateBillsByMonth, extractRpdMonthly, matchAuditToDeviation, pickDominantCategory.

**Build:** 979 KB bundle (+23 KB vs Phase 5.3 baseline, +2.4%). 0 new TS errors.`,
    files: [
      'components/DeviationDashboard.tsx (NEW, 851 LOC)',
      'utils/deviationMetrics.ts (NEW, 381 LOC)',
      'App.tsx (+42 LOC: import, subtab nav, conditional render)',
      'types.ts (+3 LOC: SubTab.LAPORAN_LRA, SubTab.DEVIASI_TINJAUAN)',
    ],
    decisions: [
      '§S5.4-D1 A: Sub-tab di Tab 4 (Pelaporan & LRA)',
      '§S5.4-D2 A: Pure SVG (no recharts/chart.js — 0 KB bundle impact)',
      '§S5.4-D3: Stacked Bar + Line Chart combo',
      '§S5.4-D4: 4-section drill-down modal',
      '§S5.4-D5 A: Year filter respect main app dropdown',
      '§S5.4-D6 A: Hybrid color coding (reasoning category + fallback muted)',
      '§S5.4-D7: 3-file deliverable (dashboard + metrics + App.tsx patches)',
    ],
    related: ['log-2026-05-09-phase-5-3-tinjauan-audit', 'log-2026-05-08-phase-5-2-dummy-2024'],
  },

  {
    id:    'log-2026-05-09-phase-5-3-tinjauan-audit',
    date:  '2026-05-09',
    phase: 'Step 5 / Phase 5.3',
    title: 'Phase 5.3 — Tinjauan Audit UI LIVE (Review + Reasoning Editor)',
    type:  'feature',
    author: 'AI Assistant Session B',
    description:
`Tinjauan Audit UI shipped. Sie Renbang sekarang bisa klik row audit_log → modal terbuka dengan form: reasoning (min 10 chars), kategori (6 opsi), dynamicsFactor (opsional), reviewerNotes (opsional, internal-only).

**Visual indicators:** Status column dengan colored dot (amber=unreviewed, emerald=reviewed). Inline reasoning badge + dynamicsFactor preview saat reviewed. 3 summary chips clickable untuk filter shortcut (🟡 Belum / 🟢 Direview / 📊 Total).

**Semantic split:** reasoning = external-facing (laporan BPK/Karumkit), reviewerNotes = internal Sie Renbang commentary (audit-of-audit). Modal UI menampilkan 2 section terpisah: "📝 Penjelasan Publik" dan "🔒 Catatan Internal".

**Validation gate:** Tombol "Simpan Tinjauan" disabled sampai reasoning ≥10 chars + kategori dipilih. Un-review allowed dengan 2-step confirm dialog (reasoning preserved, review metadata cleared).

**Tab rename:** "Riwayat Aktivitas" → "Tinjauan Audit". Default filter Status="Belum Direview" untuk drives backfill workflow.

**Smoke test 7/7 PASS** against 32 entries 2024 (16 reviewed + 15 unreviewed + 2 extra from recent activity).`,
    files: [
      'components/AuditEntryEditModal.tsx (NEW, 422 LOC)',
      'components/AuditLogViewer.tsx (+203 LOC: chips, filters, status column, modal trigger)',
      'components/SettingsModule.tsx (+1 LOC: tab label rename)',
      'constants/audit.ts (+49 LOC: REASONING_MIN_LENGTH, isReasoningValid, getCategoryBadgeClasses)',
      'lib/audit.ts (+78 LOC: markAuditEntryUnreviewed, getCurrentReviewer signature)',
    ],
    decisions: [
      '§S5.3-D1 A: Extend AuditLogViewer (re-use scaffolding)',
      '§S5.3-D2 A+B: Status column dot + clickable summary chips combined',
      '§S5.3-D3 A: Modal-based edit (mobile-friendly)',
      '§S5.3-D4: +reviewerNotes 7th field — semantic split public vs internal',
      '§S5.3-D5: State-only filter (URL hash deferred)',
      '§S5.3-D6: AuditEntryEditModal child component factored out',
      '§S5.3-T1 A: Validation reasoning ≥10 + category required',
      '§S5.3-T2 A: Un-review with confirm, reasoning preserved',
      '§S5.3-T5 A: Default filter "Belum Direview" — backfill workflow',
    ],
    related: ['log-2026-05-08-phase-5-2-dummy-2024', 'log-2026-05-08-phase-5-1-reasoning-foundation'],
  },

  {
    id:    'log-2026-05-08-phase-5-2-dummy-2024',
    date:  '2026-05-08',
    phase: 'Step 5 / Phase 5.2',
    title: 'Phase 5.2 — 2024 Dummy Data Generation SEALED (4 Scenarios, 90 Records)',
    type:  'schema',
    author: 'AI Assistant Session B',
    description:
`2024 dummy data seeded via SQL bulk INSERT ke Supabase SQL Editor. 4 skenario realistis untuk RS Tk.IV Batin Tikal:

**Q1 Normal** (Jan-Mar): Semua pos ~RPD, deviasi <5%. Bekkes 63.5M→67M→70M. 0 audit entries reviewed.
**Q2 Wabah DBD** (Apr-Jun): Bekkes spike +42%→+72%→+27%. 8/10 audit entries reviewed, category kebutuhan_darurat.
**Q3 Inflasi** (Jul-Sep): Semua pos gradual +10-15%. Bekkes 75M→78M→80M. 5/8 reviewed, category harga_pasar.
**Q4 Underspend** (Oct-Dec): Bekkes supplier delay, descending 35M→25M→15M. 3/6 reviewed, category lainnya.

**Budget:** Total Pagu Rp 4.0 Miliar (Pegawai 2M + Bekkes 800jt + Lainnya 400jt + Pemeliharaan 800jt).
**Records:** 4 pagu + 4 RAB + 4 RPD + 48 bills + 30 audit = 90 total. All idempotent (ON CONFLICT DO NOTHING).
**Reasoning split:** 16 reviewed (53%) / 14 unreviewed — sesuai "Mixed 60%" strategy target.

**POST-SEED verification §7a-§7g: 7/7 PASS.** Bekkes trajectory confirmed: Normal→Spike→Inflasi→Underspend.
**App smoke test: PASS** — switch ke tahun 2024, 4 pagu categories tampil, total Rp 4.0 Miliar.

Companion cleanup SQL tersedia untuk re-generate atau switch ke real 2024 data.`,
    files: [
      'PHASE_5_2_PLAN.md (plan document — project knowledge)',
      'phase_5_2_seed_2024_scenarios.sql (executed via Supabase SQL Editor)',
      'phase_5_2_cleanup_2024.sql (companion cleanup)',
    ],
    decisions: [
      '§D-5.2-1 A: SQL bulk INSERT script (pragmatic, replayable)',
      '§D-5.2-2: ~150 records scope (actual: 90 records)',
      '§D-5.2-3: Mixed 60% reviewed strategy (actual: 53%)',
      '§D-5.2-4: Cleanup SQL companion script',
      '§D-5.2-5: 3 deliverables (plan + seed + cleanup)',
    ],
    related: ['log-2026-05-08-phase-5-1-reasoning-foundation'],
  },

  {
    id:    'log-2026-05-08-phase-5-1-reasoning-foundation',
    date:  '2026-05-08',
    phase: 'Step 5 / Phase 5.1',
    title: 'Phase 5.1 — Reasoning Capture Foundation SEALED (Schema + 6 Helpers)',
    type:  'feature',
    author: 'AI Assistant Session B',
    description:
`Reasoning capture foundation shipped. audit_log sekarang support 7 additional fields untuk midterm pagu revision workflow:

**6+1 Fields:** reasoning (WHY), reasoningCategory (6 taxonomy tags), dynamicsFactor (external factor), isReviewed/reviewedAt/reviewedBy (review tracking), reviewerNotes (internal commentary, added Phase 5.3).

**6 Initial Categories:** kebutuhan_darurat (red), pertumbuhan_pasien (blue), perubahan_kebijakan (purple), harga_pasar (amber), salah_input (gray), lainnya (gray). Extensible via system_settings key 'reasoning_categories'.

**5 Helpers:** markAuditEntryReviewed (merge+persist), markAuditEntryUnreviewed (reset review, keep reasoning), getCurrentReviewer (from Komunikasi localStorage, fallback "Sie Renbang"), fetchReasoningCategories (from DB, fallback INITIAL), getReasoningCategoryMeta (label+color lookup).

**Backward compat:** Existing entries pre-5.1 punya new fields = undefined (no migration needed, JSONB flexible). New entries created with fields = null, populated via Phase 5.3 Tinjauan Audit UI.

**Verified:** 13 audit_log keys confirmed intact (7 baseline + 6 S5.1). isReviewed stored as boolean string per design.`,
    files: [
      'lib/audit.ts (+178 LOC: AuditEntryData extension, 4 helpers)',
      'constants/audit.ts (+80 LOC: INITIAL_REASONING_CATEGORIES, getReasoningCategoryMeta, ReasoningCategory type)',
    ],
    decisions: [
      '§D-5.1-1: Reasoning fields embedded in data JSONB (not separate table)',
      '§D-5.1-2: 6 initial categories, extensible via system_settings',
      '§D-5.1-3: UI placement defer to Phase 5.3 (Opsi C)',
    ],
    related: ['log-2026-05-08-b1-launch'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // SESSION B B.1 — S3.3 RAB+RPD PERSIST + S3.6 PROFIL RS EDITABLE (8 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-08-b1-launch',
    date:  '2026-05-08',
    phase: 'Step 3 / Session B',
    title: 'Session B B.1 — S3.3 RAB+RPD Persist + S3.6 Profil RS Editable LIVE',
    type:  'feature',
    author: 'AI Assistant Session B',
    description:
`Session B sub-sequence B.1 LIVE. Dua sub-sequence delivered dalam satu deploy bundle, total ~5 jam work + ~30 menit smoke test.

**S3.3 — RAB + RPD Persistence ke Cloud:**
- App.tsx 5 surgical patches (+86 baris): prevSnapshotRef typing extension (rabs: RABCategory[], rpds: RPDSection[]), snapshot accumulator init di loadData, 2 try blocks fetch+unwrap rabs/rpds dengan defensive fallback (empty arrays kalau row missing fields), snapshot writeback, 2 syncToCloud entity wires (after pagu_sections, before bills).
- ID native pattern: \`rab-{linkedPaguSectionId}\` (= \`rab-pagu-{year}-{slug}\`) dan \`rpd-{linkedSectionId}\`. Year-implicit via FK ke pagu, NO transformation needed di sync code.
- Audit emission via diffCollectionForAudit dengan description builder D-S3.3-4: title primary, FK fallback (\`'RAB ' + (title || linkedPaguSectionId || id)\`, sama pattern untuk RPD).
- Sync timing follow Session A pattern (batch via syncToCloud + diff helper, NOT inline per-edit Komunikasi pattern). User edit RAB/RPD → state change → click Sinkronisasi Cloud → batch persist + audit emit.

**S3.6 — Profil RS Editable (Settings tab "Profil RS" sekarang LIVE):**
- New file \`components/RsProfileEditor.tsx\` (344 baris): self-contained module per Komunikasi-pattern (D-S3.6-1 Opsi B), tidak di-wire ke App.tsx state, fetch direct ke supabase, manage own audit emit.
- 11 fields total per D-S3.6-3 Opsi MAX: 5 existing (namaInstansi, namaRS, alamat, telepon, kota) + 6 baru (npwp, kodeSatker, akreditasi, kepalaRS, nipKepalaRS, email).
- Defensive load via \`mergeWithDefaults()\` — toleran terhadap incomplete seed (auto-fill empty string untuk 6 field baru). Pertama save akan organic-upgrade DB ke full 11-field schema. Tidak perlu SQL migration explicit.
- Field-level "Diubah" badge real-time per field saat user edit. Action bar bottom show "N field diubah · siap simpan".
- Validation: 3 required (namaInstansi, namaRS, alamat) + email regex. Save button disabled kalau ada error atau no changes.
- Audit emit per D-S3.6-2: direct \`logAuditEntries([entry])\` inline, entity 'rsProfile', action 'config_update', snapshot = field-level diff \`{field: {before, after}}\` for changed fields ONLY (not full profile dump). Description builder: \`'Ubah Profil RS: ' + changedFieldLabels.join(', ')\`.
- SettingsModule.tsx 3 patches: import RsProfileEditor, tab status \`'soon'\`→\`'live'\`, replace \`<ComingSoonStub>\` dengan \`<RsProfileEditor />\` render.

**Smoke test: 9/9 PASS** (8 wajib + 1 optional, ~30 menit).
- Test 1: Initial load — rabs=0, rpds=0 baseline ✅
- Test 2: RAB persist + audit — bulk_update entry "+4 baru, −4 hapus" (cosmetic, lihat TD-18; DB state correct)
- Test 3: RPD persist + audit — bulk_create + update, clean diff descriptions ("Ubah RPD PAGU ANGGARAN JASA (HONOR OPERASIONAL SATKER)")
- Test 4: Open Profil RS tab (sekarang live, 11 fields rendered, 5 populated + 6 empty as expected)
- Test 5: Edit + Save full flow — audit entity 'rsProfile' action 'config_update' dengan field-level diff snapshot \`{kepalaRS: {before:"", after:"Mayor dr Yogi SpB"}, email: {before:"", after:"rsbatintikal@tniad.mil.id"}}\` ✅
- Test 6: Required validation works
- Test 7: Email regex works (invalid → error, valid → cleared)
- Test 8: Reset button works (no audit emit, correct — reset adalah pure UI state revert)
- Test 9 optional: AuditLogViewer filter integration cross-feature works (Profil RS, RAB, RPD entries semua muncul dengan benar)

**Sie Renbang Verbal Clarification (8 Mei 2026):**

Following written exchange ambiguity di awal sesi (Sie Renbang feedback "RPD belum mengikuti RAB" + "Realisasi terintegrasi dengan RPD"), Ferry telepon langsung dengan Sie Renbang. Klarifikasi penting: **behavior current SUDAH BENAR**. Tidak ada bug Issue 3 (RPD ← RAB) maupun Issue 4 (Realisasi mix). Sie Renbang's perspective:

1. Rencana (RPD) dan realisasi belum tentu sama, tergantung dinamika — itu **normal**, bukan bug
2. Audit_log akan dipakai untuk justifikasi pengajuan **revisi pagu sebelum masa pagu berakhir** (trigger-based, bukan time-based — trigger = gejala deviasi mulai muncul, manual decision oleh Sie Rembang/rapat koordinasi/Karumkit)
3. Perlu sistem **early analysis + early audit + early warning** untuk support midterm revision workflow

**"Faktor ketiga dinamika"** yang Sie Renbang sebut = faktor eksternal yang bukan plan (RPD) atau execution (Realisasi), tapi konteks lingkungan yang menjelaskan deviasi: wabah, perubahan kebijakan Pusat, fluktuasi harga, penambahan jumlah pasien karena pengembangan layanan spesifik RS, redistribusi pasien akibat penambahan RS lain di area yang sama.

**Konteks project nature (Ferry clarification):** SIKESUMA + RS Batin Tikal sedang TRANSISI ke digitalisasi. Belum ada formal best practice (PMK/DJA/BPK reference belum di-anchor). RS skala kecil under developed sedang DEFINE workflow mereka sendiri berdasarkan general concept digitalisasi. Implikasi untuk design: keep flexibility (extensible categories, configurable thresholds, NO hardcoded enum). Sie Rembang akan refine via learning-by-doing.

**Implication untuk roadmap:**

New scope **Step 5 — Decision Support Module untuk Adaptive Planning** ditambahkan ke ROADMAP, dengan 5 sub-sequences (5.1 reasoning capture, 5.2 audit review UI, 5.3 deviation dashboard, 5.4 early warning engine pattern-based, 5.5 revision proposal generator).

**Phasing Opsi B+ Adaptive (Ferry approved 8 Mei 2026):**
1. NOW: Deploy B.1 ✅ (this entry)
2. NEXT: Step 5.1 (reasoning capture) — supaya audit_log mulai capture reasoning data ASAP
3. THEN: Generate 2024 dummy data (4 scenarios: Q1 normal, Q2 wabah, Q3 harga naik, Q4 underspend) untuk multi-scenario testing
4. PARALLEL: Session B.2 (Kuitansi) ┃ Step 5.2 (Audit Review UI) — independent scope, bisa simultaneous atau sequential
5. THEN: Session B.3 (PNBP Setoran + Laporan Kemenkeu)
6. THEN: Step 5.3 (Deviation Dashboard) — butuh B.3 done untuk pendapatan vs belanja complete
7. THEN: Step 5.4 (Early Warning Engine, configurable thresholds)
8. LAST: Step 5.5 (Revision Proposal Generator)

Total estimasi sisa proyek: ~30-40 jam productive, ~7-9 chat sessions, ~4-6 minggu wall-clock.

**Data strategy (Ferry constraint):**
- 2024 dan sebelumnya: BOLEH dummy untuk multi-scenario analysis (Step 5 testing)
- 2025: BOLEH dummy TAPI **reserved for further analysis** — jangan dipakai untuk current testing
- 2026: real production data, learn-by-doing dengan Sie Renbang

**Tech debt added:**
- TD-18 (RAB snapshot baseline misalignment first-sync — cosmetic, harmless after first sync, see Test 2 result + ROADMAP entry untuk fix detail)

**Files changed di deploy ini:**
- App.tsx (+86 baris, 5 patches)
- components/RsProfileEditor.tsx (NEW, 344 baris)
- components/SettingsModule.tsx (+1 baris effective: 3 patches)`,
    files: [
      'App.tsx',
      'components/RsProfileEditor.tsx',
      'components/SettingsModule.tsx',
    ],
    decisions: [
      '§S3.3-D-1 Opsi A: ID pattern rab-{linkedPaguSectionId} (native, no transformation)',
      '§S3.3-D-2 ID pattern rpd-{linkedSectionId}',
      '§S3.3-D-3 Opsi A: Sync timing follow Session A pattern (loadData + syncToCloud diff)',
      '§S3.3-D-4 Audit description builder: title primary, FK fallback',
      '§S3.3-D-5 Multi-year: defer (current flat array works year-implicit via FK)',
      '§S3.6-D-1 Opsi B: Self-contained module (Komunikasi pattern, not App.tsx state)',
      '§S3.6-D-2 Direct inline logAuditEntries, action config_update, field-level diff snapshot',
      '§S3.6-D-3 Opsi MAX: 11 fields (5 existing + 6 new)',
      '§S3.6-D-4 Replace ComingSoonStub dengan RsProfileEditor render',
      'Sie Rembang verbal clarification 8 Mei 2026: tidak ada bug Issue 3/4, behavior current correct',
      'New scope Step 5 (Decision Support Module): adaptive phasing Opsi B+, sisip 5.1 setelah B.1',
      'Project nature: SIKESUMA + RS Batin Tikal transisi digitalisasi, define-the-practice mode (no formal PMK/DJA grounding)',
      'Data strategy: 2024 dummy OK, 2025 reserved, 2026 real',
    ],
    related: ['log-2026-05-08-komunikasi-launch'],
  },

  // ════════════════════════════════════════════════════════════════════════
  // KOMUNIKASI & DISKUSI FEATURE (post-Session A insert, 8 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════

  {
    id:    'log-2026-05-08-komunikasi-launch',
    date:  '2026-05-08',
    phase: 'Step 3 / Komunikasi',
    title: 'Komunikasi & Diskusi — Multi-Stakeholder Async Coordination LIVE',
    type:  'feature',
    author: 'AI Assistant Session B',
    description:
`Fitur **Komunikasi & Diskusi** LIVE di Settings → tab "Komunikasi & Diskusi" (position 3, antara Riwayat Pengembangan dan Profil RS).

**Tujuan:** Media async untuk koordinasi pengembangan antara stakeholder (Successor, Predecessor, Bagian IT, Karumkit, Verifikator, Bendahara, Asisten Successor + 3 slot tambahan) yang tidak sering kontak langsung. GitHub-issues-style threading dengan attachment support.

**Decisions encoded (D1-D6, all locked sebelum eksekusi):**
- **D1** Trust-based identity (10-role registry, suggestedNames per role, custom name fallback). Real auth = TD-13 Phase 3 P3.1.
- **D2** Topic-based threading (flat chronological, no nested replies). Reply-to via "Re:" indicator.
- **D3** File limits: 25 MB/file × 5 attachments/message × 9 MIME types (PDF/DOC(X)/XLS(X)/PNG/JPG/ZIP).
- **D4** Selective audit: hanya discussion create/close/archive + file upload yang masuk audit_log. Routine text messages **tidak** di-audit (privacy + storage hygiene).
- **D5** Visual unread badge: red dot + count di gear icon ⚙️ header, refresh saat Settings ditutup. Per-device global granularity (per-discussion = TD-17).
- **D6** Placement: new tab di SettingsModule (position 3, antara Riwayat Pengembangan dan Profil RS).

**Schema (Phase 1):**
- 2 tabel envelope JSONB: \`phase_discussions\` (title, status, phase_ref, participants, message_count, last_activity, last_message_preview) + \`phase_messages\` (discussion_id, author_role+name, content, edited, reply_to, attachments[]).
- 1 storage bucket: \`phase-docs\` private (signed URLs untuk download), 25 MB limit, MIME whitelist.
- RLS PERMISSIVE ALL untuk POC; role-based di TD-13.

**Constants (Phase 2):** \`constants/komunikasi.ts\` (395 baris) — types, ROLE_REGISTRY (10 roles dengan color/icon/suggestedNames), MIME whitelist, edit window 30 menit, helpers (validateAttachmentFile, canEditMessage, formatFileSize, generateKomunikasiId, sanitizeFilename, addParticipant, dll). 2 audit entities ditambah ke \`constants/audit.ts\`: \`phaseDiscussion\` + \`phaseMessage\`.

**Component (Phase 3+4):** \`components/PhaseDiscussionsModule.tsx\` (1354 baris) single-file MVP dengan 7 sub-components inline (Avatar, CaveatBanner, IdentitySelector, NewDiscussionModal, DiscussionCard, MessageBubble, MessageComposer + DiscussionThread wrapper). \`components/SettingsModule.tsx\` +5 baris (tab integration). \`App.tsx\` +43 baris (unread badge logic + handleSettingsClose dengan 500ms-delay refresh).

**Audit emission pattern:** Direct \`logAuditEntries([entry])\` inline calls — DIFFERENT dari Session A diff-based syncToCloud pattern. Comment di kode untuk future-successor clarity.

**Smoke test:** **10/10 PASS** (8 wajib + 2 optional). Test 1-8 = identity flow, discussion CRUD, message text-only no-audit, file upload + audit, validation, edit window 30-min, identity switch. Test 9-10 = status workflow + unread badge.

**Tech debt added:** TD-13 (real auth migration), TD-14 (email notifications), TD-15 (realtime updates), TD-16 (storage retention + quota monitoring), TD-17 (per-discussion unread granularity). Lihat ROADMAP section above.

**Caveat banner:** Identity tidak diverifikasi (trust-based). Untuk pesan formal, pastikan identity dipilih akurat. Real auth = roadmap Phase 3 (TD-13).

**Out-of-band:** Ferry akan personally inform stakeholders (Sie Renbang, Panji IT, dll) via existing trust channels untuk start pakai fitur ini.`,
    files: [
      'constants/komunikasi.ts',
      'constants/audit.ts',
      'constants/devLog.ts',
      'components/PhaseDiscussionsModule.tsx',
      'components/SettingsModule.tsx',
      'App.tsx',
    ],
    decisions: [
      '§Komunikasi-D1 Trust-based identity (10-role registry)',
      '§Komunikasi-D2 Topic-based threading (no nested replies)',
      '§Komunikasi-D3 25 MB × 5 attachments × MIME whitelist',
      '§Komunikasi-D4 Selective audit (create/close/file_upload only)',
      '§Komunikasi-D5 Visual unread badge global granularity',
      '§Komunikasi-D6 SettingsModule tab position 3',
    ],
    related: ['log-2026-05-08-devlog-init', 'log-2026-05-08-s3_2_3'],
  },

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

  {
    id:    'log-2026-05-09-phase-6-0-ai-advisor',
    date:  '2026-05-09',
    phase: 'Step 6 / Phase 6.0',
    title: 'Phase 6.0 — AI Advisory Optimization (Gemini→Claude, Enriched Prompts)',
    type:  'feature',
    author: 'AI Assistant (Successor Session)',
    description:
`AI analysis engine rewritten from scratch. Previous: Gemini API with 2-number prompt (klaim + beban). Now: dual-provider (Claude primary, Gemini fallback), structured JSON output, full budget context.

**Files created:**
- utils/aiAdvisor.ts (290 LOC) — Core: collectBudgetBriefing, prompt engineering, dual API, JSON parsing, Markdown export
- components/AIAdvisorPanel.tsx (230 LOC) — Reusable UI: idle/loading/error/result states, reallocation cards, priority badges

**Files modified:**
- components/ServiceDetails.tsx — Replaced raw Gemini call with AIAdvisorPanel (jasa_efficiency mode)
- components/DeviationDashboard.tsx — Added AIAdvisorPanel (budget_reallocation mode) after EarlyWarningPanel
- vite.config.ts — Added ANTHROPIC_API_KEY env var support

**Data sent to AI (before vs after):**
Before: Total Klaim + Total Beban (2 numbers)
After: Pagu per kategori + RAB breakdown + RPD vs Realisasi bulanan + Deviasi trend + Early Warning alerts + Jasa pools + Margin + Jumlah pasien (~20+ data points)

**Two analysis modes:**
1. jasa_efficiency (ServiceDetails) — margin optimization, pool analysis, efficiency strategy
2. budget_reallocation (DeviationDashboard) — POK revision, zero-sum reallocation suggestions

**Bundle impact:** -275 KB (1019→744 KB) — Gemini SDK moved to dynamic import.`,
    files: [
      'utils/aiAdvisor.ts',
      'components/AIAdvisorPanel.tsx',
      'components/ServiceDetails.tsx',
      'components/DeviationDashboard.tsx',
      'vite.config.ts',
    ],
    decisions: [
      '§S6.0-D1: Dual provider — Claude primary, Gemini fallback (auto-detect API key)',
      '§S6.0-D2: Structured JSON output (not free-text)',
      '§S6.0-D3: Two modes — jasa_efficiency + budget_reallocation',
      '§S6.0-D4: Full context briefing (pagu+RAB+RPD+realisasi+deviasi+earlyWarning)',
    ],
    related: ['log-2026-05-08-phase-5-5-6-early-warning-revision'],
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
