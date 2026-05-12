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
  // SSOT REFACTOR — Tier 3 + Tier 4 (11 Mei 2026)
  // ════════════════════════════════════════════════════════════════════════
  // Workstream paralel terhadap Step 3/5/6. Tier 3-6 fokus ke validasi
  // Revisi POK kewenangan KPA per Perdirjen Renhan Kemhan 7/2025. Lihat
  // SSOT-REFACTOR-LOG.md §0.8 (Tier 3) + §0.9 (Tier 4a) + §0.10 (Tier 4b)
  // + §0.11 (Tier 4c) untuk full decision log.

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
