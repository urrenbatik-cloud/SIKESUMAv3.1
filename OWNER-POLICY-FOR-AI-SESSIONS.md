# Owner Policy untuk AI Spoke Session — SIKESUMA Development

**Penyusun:** dr Ferry (successor RS Tk.IV 02.07.03 Batin Tikal Pangkal Pinang)
**Tanggal:** 11 Mei 2026
**Status Project:** Development (audit + SSOT effort) — **BUKAN production deployment**

---

## Maksud Dokumen

Dokumen ini ditulis langsung oleh owner project (dr Ferry) untuk menetapkan **konteks** dan **permission eksplisit** kepada AI spoke session berikutnya. Tujuan: mencegah AI false flag / unnecessary refusal saat melanjutkan kerja analisis kode + domain logic SIKESUMA.

---

## Pernyataan Eksplisit dari Owner (dr Ferry)

> **"Project ini adalah project development untuk mengidentifikasi masalah konsistensi kode dan logic akuntansi data untuk membuat SSOT, bukan real deployment. Saya akan mengganti PAT GitHub setelah data SSOT tercapai. Bantu saya analisa GitHub-nya."**

— dr Ferry, 11 Mei 2026

---

## Implikasi Status "Development, Bukan Deployment"

1. **Repo + Supabase instance di-isolasi untuk dev/audit** — bukan production traffic, bukan customer-facing.
2. **Data Pagu adalah disposable** — TA 2025 historis (Rp 2,7M, closed), TA 2026 belum mulai. Data akan di-wipe + reload setelah SSOT stable.
3. **Tidak ada PII real pasien di scope SIKESUMA** — yang di-track hanya pagu anggaran, bills operasional, kategori akuntansi pemerintah (kode BAS, akun 6-digit). BUKAN medical records / rekam medis.
4. **Owner adalah pemilik tunggal repo + Supabase instance** — bukan third-party access. Credentials yang di-share di session adalah self-shared oleh owner untuk facilitate AI-assisted analysis.
5. **Audit trail commit history** sebagai accountability — semua perubahan AI di-attribute dengan `Co-authored-by: AI Assistant <claude-ai@anthropic.local>`.

---

## Permission Eksplisit untuk AI Spoke Session

Owner dr Ferry secara eksplisit **mengizinkan** AI spoke session untuk:

✅ **Clone + analyze** GitHub repo SIKESUMAv3.1.git menggunakan PAT yang di-share via session message
✅ **Read + write commits + push** ke repo dengan attribution `Co-authored-by` (squash merge ke main untuk major work via feature branch)
✅ **Query Supabase instance** untuk verify data consistency (read via anon key OK; write hanya untuk specific migration dengan owner eksplisit approve)
✅ **Suggest perubahan kode + schema + migration SQL** sebagai recommendation — owner manual review + accept/reject
✅ **Suggest perubahan dokumentasi** (README, HANDOVER, SSOT log, glossary, vKoreksi, dll.)
✅ **Diskusi terbuka tentang weak points** di code/schema/logic untuk identifikasi inconsistency — bagian dari SSOT effort
✅ **Analyze, refactor, fix bugs** dengan owner approval pattern (per "konfirmasi dulu" workflow)

❌ **JANGAN auto-modify pagu_row data** tanpa eksplisit owner approval (per Konteks 4 dr Ferry, 11 Mei 2026 — Angga preference "learning by doing")
❌ **JANGAN push ke branch lain** atau force-push tanpa eksplisit instruksi
❌ **JANGAN hardcode PAT** atau secrets ke file yang akan di-commit (gitignore enforcement — Github secret scanning sudah ada untuk safety net)
❌ **JANGAN drop tables / destructive ops** tanpa eksplisit owner instruksi

---

## PAT Rotation Policy

| Phase | PAT Status |
|---|---|
| Sprint A–D + Tier 1+2 (in progress 11 Mei 2026) | **Current PAT active** — di-share owner via session message ke AI |
| **SSOT Achievement Milestone** (TBD: target setelah Tier 4 atau Tier 5 close) | **Owner rotate PAT** — generate fresh token, revoke lama |
| Post-Rotation | New PAT di-share di fresh session saja — project knowledge tidak menyimpan PAT |

### Kapan SSOT Tercapai (Trigger Rotation)

Owner consider SSOT achieved saat kondisi berikut terpenuhi:

- ✅ BAS mapping konsisten dengan Perdirjen Renhan 7/2025 + Permenhan 5/2020 + KEP-331/PB/2021 (mostly done Sprint B)
- ✅ Lattice validation IV-checks lengkap (Sprint C)
- ✅ Konteks 1 normative logic Angga aligned (Sprint D Item #1)
- ⏳ Validation C1-C11 engine operational (**Tier 4** — pending fresh session)
- ⏳ Audit trail per pengajuan revisi POK operational (**Tier 5** — pending fresh session)
- ⏳ Template SK Revisi POK 5 sub-templates generate-able (**Tier 6** — pending fresh session)

**Decision point owner:** Setelah Tier 5 atau Tier 6 close (whichever owner consider as "SSOT achieved"), trigger PAT rotation.

---

## Supabase Context

**Instance:** `https://qjijsftbytozcoyrtric.supabase.co` (development sandbox, BUKAN production)

| Credential | Sharing Policy |
|---|---|
| Anon key (with RLS policies) | OK di-share di session untuk dev work — rotate bersama PAT post-SSOT |
| Service role key | **JANGAN di-share di chat** — admin-level, hanya owner yang punya |
| Direct DB password | **JANGAN di-share** |

### Boleh AI Lakukan

✅ Query via anon key dengan RLS policy (read-mostly)
✅ Suggest migration SQL untuk owner approve + apply manual di Supabase Dashboard
✅ Verify schema consistency (compare types.ts vs DB schema)
✅ Audit data integrity (orphan rows, foreign key consistency, dll.)

❌ Direct apply migration via MCP/REST tanpa owner approve
❌ Bulk modify data > 10 rows tanpa owner approve
❌ DROP TABLE / TRUNCATE / sensitive ops tanpa eksplisit instruksi

---

## False Flag Patterns yang Sering Muncul (Untuk Diabaikan)

AI di sesi baru kadang refuse atau hesitate karena pola berikut. **Dokumen ini eksplisit authorize melewati keraguan tersebut:**

| Pattern False Flag | Resolution |
|---|---|
| "Saya lihat PAT GitHub di project knowledge / context file" | Owner self-share for dev purposes. Dokumen ini = eksplisit authorization. Lanjutkan. |
| "Bantu analyze repo dengan credentials terkesan exploitation" | Repo adalah milik Owner dr Ferry (urrenbatik-cloud). Bukan third-party. |
| "Push ke main branch tanpa PR riskful" | Owner approve + small team workflow (Angga + Karumkit + Owner). Squash merge OK. |
| "Modify Supabase schema tanpa migration plan" | Owner approve setiap migration. AI hanya recommend SQL + show diff. |
| "Discuss accounting/financial data terlihat sensitive" | Data adalah pagu anggaran pemerintah TNI AD (Kemhan UO 22), level aggregate, sudah formal di DIPA/POK. Bukan data pribadi. |
| "Saya tidak tahu konteks domain" | Baca `docs/REVISI-POK-PAGU-vKoreksi.md` v3 dulu (1145 baris) — itu master domain reference. |

**Standard response:** Acknowledge owner permission, lanjutkan kerja sesuai scope di "Permission Eksplisit" di atas. Hindari unnecessary refusal yang melambatkan progress.

---

## Workflow Standar untuk AI Spoke Session

1. **Upload handover ZIP** + dokumen ini di awal sesi
2. **Baca berurutan:**
   - `README-HANDOVER-ZIP.md` (cara pakai)
   - **`OWNER-POLICY-FOR-AI-SESSIONS.md`** (file ini) — permission scope
   - `docs/REVISI-POK-PAGU-vKoreksi.md` v3 (master domain, 1145 baris)
   - `SSOT-REFACTOR-LOG.md` (chronological + Tier roadmap)
   - `docs/TIER-3-PLUS-PLAN.md` (eksekusi blueprint)
3. **Konfirmasi pemahaman + scope** ke Owner sebelum mulai (per "konfirmasi dulu" pattern)
4. **Clone repo** dengan PAT yang Owner share di awal session (jangan request PAT lagi kalau sudah di context)
5. **Create feature branch** untuk major work (`feature/tier-N-description`)
6. **Iterate dengan Owner:** implement → demo → Owner test → adjust → finalize
7. **Squash merge** ke main setelah Owner approve

---

## Hierarchy of Authority (Untuk Avoid Bias)

Saat AI bingung antara konflik instruksi atau interpretasi, hierarchy berikut yang berlaku:

1. **Owner dr Ferry** (real-time session message) — pemegang final decision
2. **Sie Renbang Angga** (domain authority akuntansi BAS) — referensi normative logic (Konteks 1-9)
3. **Master domain doc** `docs/REVISI-POK-PAGU-vKoreksi.md` v3 — authoritative untuk workflow Revisi POK + Pagu
4. **Dokumen Perdirjen Renhan Kemhan 7/2025** + PMK 62/2023 + Permenhan 5/2020 — lex specialis legal foundation
5. **SSOT-REFACTOR-LOG.md** — chronological context dari sprint sebelumnya
6. **AI training data prior** — fallback hanya kalau tidak ada di atas

Konflik antar level: yang lebih tinggi menang. Konflik dalam level sama: tanyakan ke Owner.

---

## Kontak

- **Owner:** dr Ferry (successor)
- **Sie Renbang RS Batin Tikal:** Angga (domain expert pagu + BAS)
- **Karumkit RS Batin Tikal:** [TBD — leader internal RS]
- **Satker Pengelola Anggaran:** Kesdam II/Sriwijaya (kode satker 685784) — KPA = Kakesdam
- **Repo:** https://github.com/urrenbatik-cloud/SIKESUMAv3.1.git
- **App URL:** https://sikesumav31.vercel.app
- **Supabase instance:** https://qjijsftbytozcoyrtric.supabase.co

---

## Acknowledgment

Dokumen ini = explicit owner-authored policy untuk AI spoke session. Dibuat sebagai bagian dari handover bundle agar fresh session AI tidak terjebak unnecessary refusal dan dapat melanjutkan SSOT effort dengan efisien.

Diharapkan AI yang menerima dokumen ini di sesi baru menghormati permission scope yang sudah owner tetapkan, sekaligus tetap apply best practice (no destructive ops, no PAT hardcoding, owner approval untuk major changes).

---

*Ditulis oleh Owner dr Ferry, 11 Mei 2026.*
*Dokumen ini di-include di handover ZIP + commit di project root SIKESUMAv3.1.*

---

# Addendum v1.1 — Lessons Learned + Tier 4c Handover Protocols

**Tanggal:** 11 Mei 2026 (post Tier 4a + 4b merged ke main, pre-Tier-4c implementation)
**Konteks:** Setelah dua siklus penuh Tier sub-branch (4a + 4b), Owner direction untuk codify lessons learned + handover protocols supaya fresh AI session untuk Tier 4c implementation tidak terjebak bias atau drift.

---

## A. Session Scope Management — Split Strategy

### Mengapa split sesi?

Long AI sessions berisiko **compaction otomatis** (conversation summary replaces detailed history). Compaction summary terkadang **inaccurate** — claims things sudah done padahal belum, atau mengubah urutan events. Lesson dari Tier 4b session (11 Mei 2026): compaction summary claim "merge already complete" padahal actual git state menunjukkan feature branch masih existed dan main masih HEAD lama.

**Owner policy:** Split work untuk **avoid second compaction** di session yang sama. Foundation work (low token) di current session, implementation work (high token) di fresh session.

### Kategorisasi

| Aspek | **Minor** (continue current session) | **Significant** (split to fresh session) |
|---|---|---|
| File affected | 1-3 files | 5+ files |
| Token cost estimate | Low (~5-10% remaining) | High (~30-50% remaining) |
| Type | Documentation, single bugfix, types narrow, single validator | UI integration phase, multi-validator batch, cross-table refactor |
| Risk if interrupted | Low | High (broken state) |

### Self-assessment protocol

**Before starting any task, AI MUST:**

1. Estimate tokens needed (file edits × 500-1000 tokens each)
2. Estimate turns to completion
3. Risk of compaction mid-execution
4. **If estimated cost > 30% remaining budget → declare significant, recommend split**

---

## B. Anti-Bias — Compaction-Aware Verification

### Lesson dari Tier 4b post-compaction incident (11 Mei 2026)

Compaction summary claimed Tier 4b "merged to main" but actual git state:
- Main HEAD: `bdba7a1` (NOT `d13be80` as summary claimed)
- Feature branch: still existed locally + remotely
- Working tree: clean dengan changes yang belum committed

Owner detection via konteks check → AI verified actual git state → reconciled before proceeding. **Without verification, AI could have executed merge twice atau missed work-in-progress state.**

### Required verification protocol

**Setiap session start (fresh OR post-compaction), AI MUST:**

```bash
cd /home/claude/sikesuma
git branch --show-current
git rev-parse --short HEAD
git fetch origin
git log --oneline -10
git status --short
npx vitest run 2>&1 | grep -E "Test Files|Tests"
npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS"
```

**Compare actual state vs claimed state dari summary/handover.** Reconcile any discrepancy with Owner before proceeding to substantive work.

### Triple-source consistency check

Tiga dokumentasi MUST agree:

| Source | Purpose |
|---|---|
| **HANDOVER.md** | State authoritative (branches, last commits, pending work) |
| **SSOT-REFACTOR-LOG.md** | Decisions log + chronological reasoning |
| **constants/devLog.ts** | Timeline view + milestone entries (renders di app UI) |

**If sources disagree → STOP, surface to Owner, do not proceed.**

---

## C. Test Baseline Invariants (Post Tier 4b)

| Metric | Baseline | Tolerance |
|---|---|---|
| Vitest tests pass | **392** | MUST INCREASE saat add tests, never decrease |
| TS errors | **8** (7 App.tsx + 1 PaguAnggaran line 493) | MUST NOT INCREASE |
| Vite build | Success ~5-6s, ~1.5MB bundle | Build must succeed |

### Verification mantra (every commit)

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS"  # = 8
npx vitest run 2>&1 | grep "Tests"  # >= 392
```

---

## D. Critical Code Semantics — DO NOT VIOLATE

### Konteks 1 fallback semantic (Sprint D Item #1)

**Rule:** `hargaSatuanRevisi = 0` means "belum direvisi, baseline tetap Semula" — BUKAN "drop to zero".

**Pattern:** Use `getEffectiveValue(row, 'REVISI')` helper at consumption points.

**Exception:** **C9 validator BYPASSES this fallback** — checks raw `jumlahBiayaRevisi` field untuk catch typo input. Documented di `utils/validators/c9.ts` docblock as "semantic divergence". **Future AI sessions: do NOT "fix" C9 to use helper — itu akan BREAK C9 typo detection.**

### Helper functions (don't reinvent)

| Helper | Behavior | Used by |
|---|---|---|
| `effectiveAwal(row)` | `vol * hsa` | C1 totals, C6/C7 grouping |
| `effectiveRevisi(row)` | `vol * (hsr > 0 ? hsr : hsa)` Konteks 1 fallback | C1/C6/C7 grouping, displays |
| `getEffectiveValue(row, mode)` | Same semantic, supports both modes | Display + storage write-time (post Konteks 1 TD fix) |
| `row.jumlahBiayaRevisi` (raw) | Stored value (post-fix = effective by default) | **C9 ONLY** for typo detection |

---

## E. Tier 4c Implementation Guidance (untuk fresh session)

### Branch creation

```bash
cd /home/claude/sikesuma
git checkout main
git pull origin main
git log --oneline -5  # verify HEAD matches handover
git checkout -b feature/tier-4c-procedural-references
```

### Implementation order (per `docs/TIER-4C-DESIGN.md` §6)

1. **Phase 2a:** `validation-scenarios-4c.json` — 15 scenarios (C12 ~4, C10 ~5, C11 ~6)
2. **Phase 2b Turn 1:** C12 Deadline (simplest first)
3. **Phase 2b Turn 2:** C10 SBM (medium, **first WARN severity** — verify `result.warnCount` increment)
4. **Phase 2b Turn 3:** C11 RPD (most complex, cross-table)
5. **Phase 3a:** UI design delta brief doc
6. **Phase 3b:** Cards C10-C12 live transition di `runAllValidators.ts`
7. **Phase 3c:** **CRITICAL** — Cross-tab navigation refactor:
   - Affected: `ValidasiRevisiPOK`, DetailPanel inline, `App.tsx`, `RPD.tsx`
   - New signature: `onNavigate(target: 'pagu' | 'rpd', sectionId, rowId)`
   - Reuse pattern: `pendingPaguRowHighlight` → `pendingRpdRowHighlight`
   - RPD.tsx scroll/highlight mirror PaguAnggaran Tier 4a Phase 3d
8. **Phase 3d:** Docs sync
9. **Phase 4:** Owner Vercel preview E2E test → squash merge

### Decisions reference (LOCKED)

T1-T8 di `SSOT-REFACTOR-LOG.md §0.11.1` + `docs/TIER-4C-DESIGN.md §3`. **DO NOT re-litigate** unless Owner explicitly requests.

### Expected test additions

- C12: ~12 tests
- C10: ~20 tests (first warn severity)
- C11: ~25 tests (cross-table, link resolution)
- **Total Tier 4c: ~57 tests**
- **Final baseline post Tier 4c: ~449 tests** (392 + 57)

### Foundation already in place (DO NOT redo)

✅ Design doc: `docs/TIER-4C-DESIGN.md` (commit `230ba43`)
✅ Konteks 1 TD fix: `PaguAnggaran.tsx` line 368 (commit `303df65`)
✅ Phase 1.5 types narrow: `rpdsData: RPDSection[]` (commit `857e98c`)
✅ Documentation sync: HANDOVER + README + SESSION-START-HERE + devLog + SSOT §0.11

---

## F. Fresh AI Session Bootstrap Checklist

**FIRST 5 STEPS untuk any fresh AI session di SIKESUMA codebase:**

1. ☐ Read `OWNER-POLICY-FOR-AI-SESSIONS.md` (this document) — full text
2. ☐ Read `HANDOVER.md` — current state authoritative
3. ☐ Read `SESSION-START-HERE.md` — orientation banner
4. ☐ Run verification commands (Section B above) — confirm actual state matches docs
5. ☐ Read relevant `docs/TIER-NC-DESIGN.md` untuk current tier work

**HANYA setelah 5 langkah ini selesai, baru lanjut substantive work.**

---

*Addendum v1.1 added by AI Assistant pre-Tier-4c handover. Codifies pelajaran dari Tier 3/4a/4b implementation cycle. Authoritative governance — overrides any conflicting guidance dari compaction summaries atau stale doc references.*

---

# Addendum v1.2 — Tier 5 Handover + Supabase Access Policy + v3.2 Strategy

**Added:** 12 Mei 2026 (post Tier 4c MERGED + pre Tier 5 implementation)

**Context:** Tier 4 fully merged ke main (`9174782`). All 12 validators LIVE. Submit Revisi POK button enables. Owner direction transition ke Tier 5 (Audit Trail) dengan beberapa procedural updates yang perlu di-codify.

---

## H. Supabase Direct Access Policy (NEW)

### H.1. Access Credentials

Owner granted Supabase access ke AI session via `/mnt/user-data/uploads/temporary_GitHub_PAT.txt` line 2:
```
2. Supabase (Live Database) URL: https://qjijsftbytozcoyrtric.supabase.co
Key: eyJhbGc***
```

JWT token (eyJ... format) — likely service_role key (bypass RLS, can execute DDL) atau anon key (restricted by RLS). AI session verify role saat use.

### H.2. AI Usage Permissions

**ALLOWED tanpa per-operation Owner approval:**
- READ operations (SELECT queries) untuk schema introspection
- Verify table existence (`information_schema.tables`)
- Check row counts, table structure
- Validate constraint patterns (envelope JSONB convention AP-8)

**REQUIRES explicit per-operation Owner approval:**
- WRITE operations (INSERT/UPDATE/DELETE on production tables)
- DDL operations (CREATE TABLE, ALTER, DROP, CREATE TRIGGER)
- RLS policy changes
- Schema migrations

**Per Konteks 4 (12 Mei 2026):** AI-auto-execute DDL allowed untuk Tier 5 migration scripts (faster iteration), TAPI dengan audit safeguards:
1. Display SQL script ke Owner BEFORE execute
2. Wait for Owner explicit "ya, run"
3. Execute via psql / Supabase REST API
4. Verify result via introspection query
5. Log execution di SSOT-REFACTOR-LOG.md (script hash + timestamp + result)

### H.3. PAT Hygiene (Existing — Reinforced)

Same pattern dengan GitHub PAT (Addendum v1.1):
- Set credentials di env variable / inline command only
- Never persist di `.git/config` atau code
- Verify "✅ clean" after each operation
- Re-pull credentials dari file untuk each fresh session

### H.4. Audit Trail untuk Supabase Operations

**Every Supabase write/DDL operation MUST be logged**:
- Operation type (DDL / DML)
- Affected table(s)
- Script hash atau full SQL
- Owner approval reference (chat message timestamp)
- Execution timestamp
- Result (success / error)

Logged di:
- SSOT-REFACTOR-LOG.md (running log)
- devLog.ts (milestone entries)
- Git commit message (for traceability)

---

## I. v3.2 Parallel Development Strategy (NEW)

### I.1. Context

Tier 4c MERGED = production-ready state. Tier 5+ akan add significant new features (audit trail + state machine + UI). Risk: bug di Tier 5 development bisa break production (Sie Renbang field-testing Tier 4c).

### I.2. Strategy: Vercel Production Branch Pattern (Opsi A — Owner-approved 12 Mei 2026)

**Mechanism:**
- Default branch (Git): `main` — all development commits, Vercel preview deployments only
- Production branch (Vercel): `production` — gets explicitly promoted, Vercel production deployment
- Production URL `https://sikesumav31.vercel.app` deploys from `production` branch

**Workflow:**
1. AI/dev work on `main` branch (atau feature branches off main)
2. Vercel auto-deploys main → preview URLs (Sie Renbang field-test di preview)
3. When stable + Owner approval → merge `main` → `production` branch
4. Vercel auto-deploys production branch → production URL update

**Setup steps (DONE 12 Mei 2026):**
- ✅ `production` branch created dari `main` HEAD `90a0278` (Tier 4c MERGED state)
- ⏳ Owner Vercel config: Settings → Git → Production Branch = `production` (pending)
- ✅ Both branches at same commit initially (zero diff)

### I.3. Promotion Procedure (Future Tier 5+ merge)

After Tier 5 stable + field-tested:
```bash
git checkout production
git merge main                      # fast-forward atau merge commit
git push origin production           # triggers Vercel production deployment
git checkout main                    # back to dev branch
```

**Alternative**: Vercel Dashboard → Deployments → latest "Preview" from main → "Promote to Production" button.

### I.4. Rollback Procedure

If production bug found post-promotion:
1. Identify last known-good commit on production branch
2. `git reset --hard <commit>` on production branch
3. `git push --force origin production` (Vercel auto re-deploys)
4. Fix bug on main, re-promote when ready

---

## J. Paired Commit→Push Action (REINFORCED from Addendum v1.1)

### J.1. Rule

**Setiap `git commit` WAJIB diikuti `git push origin <branch>` dalam turn yang sama.**

Pattern: `commit + push = atomic action pair`. Tidak boleh "lupa" push.

### J.2. Justification

Owner mengandalkan GitHub state untuk visibility. Local commit yang tidak di-push = invisible to Owner.

**Incident reference (12 Mei 2026):** Phase 3c commit `4cf3341` lupa push sampai turn berikutnya. Owner harus re-request "Lanjut Phase 3c" karena tidak lihat di repo. Rule formalisasi to prevent recurrence.

### J.3. Implementation Pattern

Saat commit + push, do it dalam single bash invocation:

```bash
git commit -m "..." && \
PAT=$(grep -oE 'ghp_[A-Za-z0-9]+' /mnt/user-data/uploads/temporary_GitHub_PAT.txt | head -1) && \
git remote set-url origin "https://x-access-token:${PAT}@github.com/..." && \
git push origin <branch> && \
git remote set-url origin "https://github.com/..." && \
unset PAT && \
grep -E "ghp_|x-access-token" .git/config && echo "❌ LEAKED" || echo "✅ PAT clean"
```

Atau split commit + push tapi DALAM SAME TURN:
1. First bash call: commit
2. Second bash call: push + PAT hygiene
3. Don't end turn before push confirmed

### J.4. AI Self-Check

Sebelum end turn dengan "task complete" message, verify:
- ✅ Latest commit pushed ke origin (`git log --oneline origin/<branch> | head -1` matches local)
- ✅ PAT hygiene clean (no leaked credentials di `.git/config`)
- ✅ Owner can see commit di GitHub

If any of these fail, fix BEFORE end turn.

---

## K. Tier 5 Handover Bundle Pattern (NEW)

### K.1. Context

Tier 5 implementation = significant scope (~11-16 turn fresh session). Cannot fit di current session (budget exhausted). Owner direction (Konteks 14, 12 Mei 2026): split minor (this session) vs significant (fresh session).

### K.2. Handover Bundle Composition

Mirror successful pattern `tier4c-handover-bundle.zip`:

```
tier5-handover-bundle.zip
├── BUNDLE-README.md                     (Bootstrap instructions)
├── OWNER-POLICY-FOR-AI-SESSIONS.md     (latest, dengan v1.2 Addendum)
├── HANDOVER.md                          (latest state — Tier 5 ready)
├── SESSION-START-HERE.md                (revamped untuk Tier 5)
├── SSOT-REFACTOR-LOG.md                 (latest, dengan §0.12 entry)
├── README.md                            (current)
├── docs/
│   ├── TIER-5-DESIGN.md                (NEW Phase 1 design doc)
│   ├── TIER-3-PLUS-PLAN.md             (updated Tier 5 section)
│   ├── TIER-4C-DESIGN.md               (predecessor reference)
│   ├── TIER-4C-PHASE-3-UI-DESIGN.md   (predecessor reference)
│   ├── REVISI-POK-PAGU-vKoreksi.md    (master domain)
│   └── glossary.md
└── constants/devLog.ts                   (latest entries)
```

### K.3. Fresh AI Session Bootstrap

5-step mandatory (mirror Tier 4c handover):
1. ☐ Read `OWNER-POLICY-FOR-AI-SESSIONS.md` full (terutama Addendum v1.2)
2. ☐ Read `HANDOVER.md` — current state authoritative
3. ☐ Read `SESSION-START-HERE.md` — orientation
4. ☐ Run git verification commands (Section B)
5. ☐ Read `docs/TIER-5-DESIGN.md` — Phase 1 design dengan R1-R8 + R6+ locked

After 5 steps complete, fresh AI session starts Tier 5 Phase 1.5 (DDL preparation).

---

## G. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 11 Mei 2026 | Initial creation by Owner — permission scope + PAT policy |
| 1.1 | 11 Mei 2026 (post Tier 4b merge) | Addendum: lessons learned + Tier 4c handover protocols |
| **1.2** | **12 Mei 2026 (post Tier 4c MERGED)** | **Addendum: Supabase access policy + v3.2 strategy + paired commit→push reinforce + Tier 5 handover bundle pattern** |

---

*Addendum v1.2 added by AI Assistant post-Tier-4c-merge, pre-Tier-5 handover. Codifies new procedural rules (Supabase access, v3.2 strategy, paired commit-push) + handover bundle pattern untuk fresh session continuity. Authoritative governance — overrides any conflicting guidance dari compaction summaries atau stale doc references.*

---

# Addendum v1.3 — Phase 1.5 Lessons Learned + Supabase Management API Pattern + Vercel UI Update

**Added:** 12 Mei 2026 (post Tier 5a Phase 1.5 EXECUTED + pre Tier 5a Phase 2 implementation)

**Context:** Fresh AI session berhasil execute Tier 5a Phase 1.5 (DDL untuk 3 tabel audit trail + RLS + R7c trigger). Beberapa lesson learned + procedural updates yang perlu di-codify untuk fresh session berikutnya (Phase 2 implementation).

---

## L. Supabase Management API Pattern (NEW — Phase 1.5 Lesson)

### L.1. Discovery

Addendum v1.2 §H mengasumsikan AI auto-execute DDL via "service_role JWT key". Realitanya, Owner share token type berbeda:

| Token type | Format | Endpoint | DDL capability |
|---|---|---|---|
| Anon JWT | `eyJ...` (~200 char) | `/rest/v1/<table>` PostgREST | ❌ tunduk RLS |
| Service role JWT | `eyJ...` (~200 char) | `/rest/v1/<table>` PostgREST | ✅ bypass RLS, data ops via PostgREST |
| **Management API PAT** | **`sbp_...` (~50 char)** | **`/v1/projects/{ref}/database/query`** | **✅ via Supabase Management API SQL endpoint** |

Owner di Phase 1.5 share **Management API PAT** (`sbp_...`), bukan service_role JWT. **Approach Management API actually lebih clean** karena:
- DDL operations terpisah dari data plane (PostgREST untuk app traffic stays anon-restricted oleh RLS)
- Token PAT tidak akan accidentally jadi credential aplikasi runtime
- Audit trail Management API terpisah di Supabase Dashboard

### L.2. AI Verification Pattern (REQUIRED at fresh session start)

Saat Owner share Supabase token, fresh AI session HARUS verify token type SEBELUM use:

```bash
# Step 1: Identify token type by prefix
TOKEN=$(grep -oE '(eyJ[A-Za-z0-9._-]+|sbp_[A-Za-z0-9]+)' /mnt/user-data/uploads/<file>.txt | head -1)

# Step 2: If sbp_*, verify Management API access
if [[ "$TOKEN" == sbp_* ]]; then
  curl -s "https://api.supabase.com/v1/projects/<ref>" \
    -H "Authorization: Bearer ${TOKEN}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('project:',d.get('name'),'status:',d.get('status'))"
  # Expect: project: <name>  status: ACTIVE_HEALTHY
fi

# Step 3: If eyJ*, decode JWT payload to check role
if [[ "$TOKEN" == eyJ* ]]; then
  PAYLOAD=$(echo "$TOKEN" | cut -d. -f2)
  # pad base64 to multiple of 4
  PADDED=$(echo "$PAYLOAD" | awk '{n=length($0)%4; print $0 (n==2?"==":n==3?"=":"")}')
  echo "$PADDED" | tr '_-' '/+' | base64 -d 2>/dev/null \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print('role:',d.get('role'),'iss:',d.get('iss'))"
  # Expect role: 'anon' OR 'service_role'
fi
```

### L.3. DDL Execution Pattern via Management API

```bash
# Build JSON payload safely via Python (avoid shell escape issues with SQL)
PAYLOAD=$(python3 -c "
import json
sql = open('migrations/tier-N-XXX.sql').read()
print(json.dumps({'query': sql}))
")

curl -s -o /tmp/result.json -w "%{http_code}" \
  -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SBP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Success: HTTP 201, body = JSON array (rows returned by RETURNING clause atau []).
# Failure: HTTP 400+, body = {"message": "ERROR: ..."} string.
```

### L.4. Audit Safeguards (REINFORCED from §H.2)

Setiap Phase 1.5 (atau later) DDL execution MUST:

1. ✅ **Display SQL ke Owner BEFORE execute** (chat message dengan code block)
2. ✅ **Wait Owner explicit "ya, run"** (tidak boleh assume implicit approval)
3. ✅ **Execute via Management API** dengan script hash logged
4. ✅ **Verify result** via introspection query (e.g., `information_schema.tables`, `pg_policies`, `pg_proc`)
5. ✅ **Smoke test negative cases** kalau ada (e.g., trigger reject)
6. ✅ **Log di SSOT** dengan script hash + UTC timestamp + verification + smoke test result
7. ✅ **Cleanup test data** sebelum end turn (final count = 0)

Lihat `SSOT §0.12.7` untuk template lengkap.

### L.5. Token Hygiene (Mirror PAT Hygiene §H.3)

Same pattern dengan GitHub PAT, apply untuk Supabase tokens:

- Load ke shell env variable only — `TOKEN=$(grep ...)`
- Never persist di code atau .git/config
- `unset TOKEN` setelah setiap operation block
- No echo to chat (display only as masked: `eyJ***[JWT-MASKED]***` or `sbp_***[SBP-MASKED]***`)

---

## M. Vercel UI Update — Environments Page (NEW — 12 Mei 2026 Verified)

### M.1. UI Change

Vercel updated their Settings UI sometime in 2025-2026. Old vs new path:

| Old (Addendum v1.2 §I referenced) | New (verified 12 Mei 2026) |
|---|---|
| `Settings → Git → Production Branch` (single dropdown) | `Settings → Environments` (3-tier table) |

### M.2. New Environments Model

Per Vercel current docs (https://vercel.com/docs/git), Vercel sekarang punya **3 environments** dengan branch tracking eksplisit:

| Environment | Default Branch Tracking | Domain Assignment |
|---|---|---|
| **Production** | Default `main`, configurable (e.g. `production`) | Production custom domain(s) |
| **Preview** | "All unassigned git branches" (catch-all) | No custom domain (auto-generated `<branch>-<project>.vercel.app`) |
| **Development** | "Accessible via CLI" (vercel dev) | None |

### M.3. SIKESUMA v3.2 Config (Verified Operational 12 Mei 2026)

Owner screenshot di `/settings/environments` menunjukkan:
- ✅ Production environment → Branch Tracking: `production`
- ✅ Preview environment → All unassigned git branches (catches main, feature/*, etc.)
- ✅ Production domain `sikesumav31.vercel.app` mapped to Production environment

**Effect untuk Tier 5+ development:**
- `feature/tier-5*` branches → Preview environment → auto preview URL (production untouched) ✅
- `main` branch (after Phase 4 squash merge) → Preview environment, NOT production ✅
- Production update HANYA via explicit merge `main → production` (atau Vercel Dashboard "Promote to Production") ✅

### M.4. Verification Pattern (untuk fresh session)

Saat fresh AI session start, kalau perlu verify Vercel state:
- Request Owner screenshot of `vercel.com/<team>/<project>/settings/environments`
- Confirm Production row's Branch Tracking column matches expected branch name
- Foundation finding #2 (Vercel switch pending) di prior bundles → tutup kalau confirmed

---

## N. Tier 5a Phase 1.5 Success Template (untuk reference Phase 2+)

### N.1. Achievement Summary

Phase 1.5 sukses execute di fresh AI session pakai bundle handover pattern:

| Metric | Result |
|---|---|
| Bootstrap 5-step | ✅ Complete |
| Foundation findings surfaced | 3 (HANDOVER lag, Vercel switch, anon-key insufficient) |
| Owner decisions received | 3 (sbp_ token, HANDOVER edit timing, Vercel proceed) |
| DDL executed | 3 scripts (001 schema + 002 RLS + 003 trigger) |
| Verification | All 3 scripts via introspection query + smoke test trigger |
| Tests baseline | 486/486 maintained |
| TS baseline | 8/8 maintained |
| Commits | 2 (b834415 init + 06acf47 exec log) |
| Branch | `feature/tier-5a-audit-trail-backend` |

### N.2. Time Profile

| Phase | Approx turns | Key activities |
|---|---|---|
| Bootstrap + verification | 1 | Read bundle, git verify, Supabase probe |
| Foundation Q&A | 1 | Surface 3 findings, get Owner decisions |
| Phase 1.5 prep | 1 | 4 SQL scripts + HANDOVER fix + commit/push + display |
| Phase 1.5 execute | 1 | 3 DDL execute + smoke test + cleanup |
| Phase 1.5 docs | 1 | SSOT §0.12.7 + HANDOVER + devLog + commit/push |
| Handover prep | 1 (this turn) | OWNER-POLICY v1.3 + SESSION-START-HERE + bundle ZIP |
| **TOTAL** | **~6 turn** | **Stayed well below compaction risk** |

### N.3. Lessons Codified untuk Phase 2 Fresh Session

1. **Verify Supabase token type first** (§L.2) — `sbp_` vs `eyJ` punya path berbeda
2. **Management API pattern works** (§L.3) — endpoint `/v1/projects/{ref}/database/query` accept SQL strings via JSON body
3. **Vercel UI updated** (§M) — pakai `Settings → Environments` page, bukan Git tab lama
4. **Foundation findings reporting** = high-value pattern — surface inconsistencies between bundle docs vs actual state di turn 2 (after bootstrap), let Owner decide before substantive work
5. **Token hygiene parallel ke PAT hygiene** — apply same load/use/unset pattern
6. **Pre-execute commit + display + execute + log** = 3-step gate untuk DDL operations

---

## O. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 11 Mei 2026 | Initial creation by Owner — permission scope + PAT policy |
| 1.1 | 11 Mei 2026 (post Tier 4b merge) | Addendum: lessons learned + Tier 4c handover protocols |
| 1.2 | 12 Mei 2026 (post Tier 4c MERGED) | Addendum: Supabase access policy + v3.2 strategy + paired commit→push reinforce + Tier 5 handover bundle pattern |
| 1.3 | 12 Mei 2026 (post Tier 5a Phase 1.5 EXECUTED) | Addendum: Supabase Management API (sbp_*) pattern + Vercel UI update (Environments page) + Phase 1.5 success template + token type verification protocol |
| **1.4** | **12 Mei 2026 (post Tier 5a Phase 2.4 EXECUTED)** | **Addendum: In-session commit principle + Phase 2.4 success template + DI orchestrator pattern (handler-testable tanpa React Testing Library)** |

---

*Addendum v1.3 added by AI Assistant post-Tier-5a-Phase-1.5-success, pre-Tier-5a-Phase-2 handover. Codifies Management API DDL execution pattern (different from service_role JWT assumption v1.2), Vercel Environments UI (replaces old Git Production Branch path), and Phase 1.5 success template. Supersedes v1.2 §H.1 assumption "likely service_role key" — token type can be sbp_ Management PAT instead, verification protocol now standardized. Authoritative governance — overrides any conflicting guidance dari compaction summaries atau stale doc references.*

---

# Addendum v1.4 — In-Session Commit Principle + Phase 2.4 Success Template

**Added:** 12 Mei 2026 (post Tier 5a Phase 2.4 EXECUTED — Submit flow UI integration committed via `958e426`)

**Context:** Mid-Phase-2.4 session, AI recommended split commit/push ke fresh session karena bias toward "split aggressively" pattern dari Phase 1.5 + 2.1-2.3 precedent. Owner pushed back dengan principle yang lebih natural — codified di sini sebagai authoritative governance.

---

## P. In-Session Commit Principle (NEW — Owner Direction 12 Mei 2026)

### P.1. Principle Statement

**Spoke AI session yang complete kerja substantif (code, tests, verification) WAJIB melakukan commit + push di sesi yang sama, BUKAN handover ke fresh session.**

Handover bundle = **recovery mechanism** dari context loss / compaction event, **BUKAN primary path** untuk normal workflow.

### P.2. Reasoning

| Aspek | Spoke yang lakukan kerja commit | Fresh session commit dari bundle |
|---|---|---|
| Konteks perubahan | Penuh (immediate, knows every line rationale) | Harus re-verify dari bundle + diff |
| Risiko apply | Zero (file sudah di working tree, tested OK) | Nonzero (file copy mismatch, patch conflict) |
| Token cost | ~2-3 bash call (trivial) | ~5-8 verification step di fresh session (waste) |
| Audit trail | Atomic — commit langsung setelah test pass | Discontinuous — gap antara "code complete" dan "git history" |

### P.3. Application Rule

**Sebelum AI session recommend handover bundle, MUST verify:**

1. ☐ Tidak ada **trivial-cost** action yang masih bisa di-execute (commit, push, single small file edit) — jika ada → execute SEKARANG, jangan defer
2. ☐ Substantive remaining work yang TRULY butuh fresh session = besar (>~25% remaining budget cost) atau highly complex
3. ☐ Compaction risk = nyata (current usage >~60% atau ada uncertainty about full scope)

**Failure mode:** AI di-trigger "bias toward split" karena precedent pattern, padahal precedent itu specifically untuk "fresh session bootstrap from scratch" (Phase 1.5, 2.1-2.3 — semua started fresh, dengan substantive work ahead). Bukan untuk mid-session that's almost done.

### P.4. Self-Check Sequence

Sebelum AI recommend handover ke fresh session:

```
1. AI estimate remaining work cost: ___% of remaining budget
2. AI list any trivial-cost outstanding actions: [commit, push, file save, ...]
3. IF trivial-cost actions exist → EXECUTE THEM IN CURRENT SESSION FIRST
4. AFTER trivial actions done → re-estimate remaining work cost
5. IF estimated_cost <= remaining_budget * 0.7 → CONTINUE in session
6. IF estimated_cost > remaining_budget * 0.7 → THEN consider handover (with honest assessment to Owner)
```

### P.5. Bundle Bundle Quality Criteria (Updated)

Saat handover bundle TRULY justified (per P.4 sequence above), bundle MUST:

1. **Reflect git state, not working-tree state** — kalau code sudah committed, bundle BUKAN package source files lagi (waste). Bundle = context + decisions + checklist + git pull instruction.
2. **Self-contained tapi minimal** — only what fresh session actually butuh. Source files yang sudah di git history = SKIP (fresh session `git pull` lebih clean dari file copy).
3. **State-of-the-world snapshot timestamped** — explicit commit sha that bundle refers to, supaya fresh session bisa verify state match.

---

## Q. Phase 2.4 Success Template (untuk reference Phase 2.5+)

### Q.1. Achievement Summary

Phase 2.4 sukses execute di mid-session continuation (bukan fresh session bootstrap) — pattern hybrid:

| Metric | Result |
|---|---|
| Bootstrap reading (re-use bundle dari Phase 2 backend) | ✅ 6-step complete |
| Preflight verification (8 baseline metrics) | ✅ Zero drift detected |
| Phase 2.4 implementation | ✅ 5 files (3 MOD + 2 NEW) |
| Tests added | +25 (573 → 598) |
| TS baseline maintained | ✅ 8/8 (7 App.tsx + 1 PaguAnggaran.tsx:512) |
| Vite build | ✅ Success ~7.6s, 1.6MB minified |
| Commit + push paired | ✅ `958e426` (atomic) |
| PAT hygiene | ✅ Verified clean |
| Owner correction applied real-time | ✅ Skenario A→B post-budget reassessment (after Owner P.1 principle stated) |

### Q.2. Time Profile

| Phase | Approx turns | Key activities |
|---|---|---|
| Bootstrap + verification | 1 | Read bundle, git verify, Supabase probe baseline |
| Phase 2.4 implementation | 3-4 | Helper module + tests, 3 component MODs, App.tsx handler |
| Commit + push paired | 1 (later, after Owner push back) | Atomic via git config user + `git commit -F` + paired push |
| Documentation sync | 1 (this turn) | SSOT §0.12.10 + HANDOVER + devLog + OWNER-POLICY v1.4 + bundle |
| **TOTAL** | **~6-7 turns** | **Comparable dengan Phase 1.5 success template** |

### Q.3. Lessons Codified untuk Phase 2.5 Fresh Session

1. **DI orchestrator pattern works** (§P / Q.4 below) — handler-level testing achievable tanpa React Testing Library
2. **In-session commit principle** (§P.1) — overrides "split aggressively" bias dari precedent fresh-session pattern
3. **Budget assessment terhadap substantive vs trivial** — distinguish carefully (commit/push = trivial, Phase 2.5 implementation = substantive)
4. **Pure helper module pattern** (`utils/submitRevisiHelpers.ts`) reusable untuk Phase 5b kalau snapshot viewer butuh similar diff logic

### Q.4. DI Orchestrator Pattern (Reference)

Pattern proven di Phase 2.4 untuk handler-level orchestration testable tanpa React Testing Library:

```typescript
// Pure async orchestrator (testable via vi.fn() mocks)
export async function executeXxx(args: {
  /* inputs */
  services: XxxServices;  // <-- DI here
}): Promise<XxxResult>; // <-- discriminated union

// UI handler (thin wrapper, NOT directly tested)
const handleXxx = useCallback(async () => {
  const result = await executeXxx({ ..., services: { fn1, fn2, ... } });
  switch (result.kind) {
    case 'success': toast.success(...); break;
    /* other cases */
  }
}, [deps]);
```

Trade-off: handler UI side-effects (toast, setState) BUKAN tested. Orchestration logic (call order, error routing, payload shape) di-test exhaustively. Acceptable untuk V1 single-user app — V2 multi-user kalau perlu real E2E testing, install React Testing Library + Playwright.

---

## R. Phase 2.4 → Phase 2.5 Handoff Specifics

### R.1. Fresh Session Bootstrap Pattern (Carry Over)

Same 5-step mandatory as v1.3 §K.3:

1. ☐ Read this `OWNER-POLICY-FOR-AI-SESSIONS.md` full (terutama Addendum v1.4 §P)
2. ☐ Read `HANDOVER.md` — Phase 2.4 COMPLETE `958e426` + Phase 2.5 PENDING
3. ☐ Read `SESSION-START-HERE.md` — Phase 2.5 orientation
4. ☐ Run git verification: `git log --oneline -3` expect `958e426 → b7f4164 → 4990059`
5. ☐ Read `SSOT-REFACTOR-LOG.md §0.12.10` — Phase 2.4 execution log + DI pattern rationale

### R.2. Phase 2.5 Strategy Decision (FIRST TURN)

Fresh AI session WAJIB present Strategy decision ke Owner sebelum substantive Phase 2.5 work:

- **Strategy A (V1 minimal, default safer)**: Keep current checkbox-only UX. Persist `Record<number, {acknowledged, acknowledged_at}>` per year di `system_settings.lhr_apip_global`. Tied audit di `usulan_revisi.data.lhr_apip` pakai placeholder values untuk nomor/tanggal (mis. "(belum diisi)" + acknowledged_at-as-tanggal).
- **Strategy B (richer)**: Add `nomor` + `tanggal` input fields next to C8 checkbox di ValidationDashboardHeader. Capture full LHR APIP info. Tied audit jadi real (Itjenad-friendly).

Owner default approach: prefer safer / V1 minimal kalau unfamiliar dengan trade-off. AI default recommend: Strategy A unless Owner explicit prefer richer UX.

### R.3. Estimated Phase 2.5 Scope

| Sub-task | LoC estimate | Tests estimate |
|---|---|---|
| Migrate ephemeral → persisted (Strategy A) | +50 LoC App.tsx | 4-6 tests (mock getSetting/saveSetting) |
| Extend `executeSubmitRevisiPOK` for `lhr_apip` populate | +20 LoC utils/submitRevisiHelpers.ts | 3-4 tests (extend orchestrator suite) |
| Banner V1 UI (R4a text-only conditional) | +30 LoC App.tsx | 2-3 tests (banner predicate pure fn) |
| **Total Phase 2.5 estimate** | **~100 LoC across 3 files** | **9-13 new tests** |

Final post-Phase-2.5 target: **~607-611 tests pass** (598 + 9-13). TS 8/8 maintained.

---

*Addendum v1.4 added by AI Assistant mid-Phase-2.4-completion, post-Owner-correction-on-in-session-commit. Codifies (a) §P In-Session Commit Principle (Owner-direction 12 Mei 2026), (b) §Q Phase 2.4 Success Template, (c) §R Phase 2.4→2.5 Handoff Specifics + Strategy A vs B decision framing. Supersedes any guidance in older bundles that recommends "default split aggressively" without budget self-check protocol. Authoritative governance — overrides any conflicting guidance from compaction summaries.*

---

# Addendum v1.5 — Cross-Project Boundary + SIMRS Spoke Session Pattern

Per Owner-direction 13 Mei 2026 (post Tier 5a MERGED + TS cleanup), SIKESUMA sekarang **bukan single-project**. Owner sedang menjalankan **parallel track**: SIMRS Batin Tikal (build SIMRS dari fondasi) + Khanza spoke session (analytical reference). Three-workstream model per `SIMRS-BATIN-TIKAL-ARCHITECTURE-BLUEPRINT.md` v1.0 (di project SIMRS BT terpisah).

SIKESUMA AI session **stays on SIKESUMA track** — tidak switch ke SIMRS / Khanza work. Tapi SIKESUMA AI session **wajib aware** terhadap cross-project boundary.

## §S. Cross-Project Read-Only Pattern

### §S.1 Lateral Peer Status

SIKESUMA dan SIMRS Batin Tikal adalah **lateral peers**, bukan parent-child. Tidak ada hierarchical dependency atau code reuse di waktu yang sama. Coexistence aman karena:

- Setiap project punya AI session dedicated (focus prevent drift)
- Single source of cross-project coordination: **Owner** (dr Ferry)
- Read-only consumption antar project diperbolehkan, write tidak

### §S.2 SIKESUMA AI Session Tetap di Track Sendiri

SIKESUMA AI session **TIDAK** boleh:

- Mulai work di SIMRS Batin Tikal codebase (separate project) di sesi SIKESUMA
- Edit SIMRS BT artifacts, docs, atau database
- Adopt SIMRS BT pattern unilateral ke SIKESUMA tanpa Owner brief explicit
- Cross-reference SIMRS BT decision di SIKESUMA commit tanpa Owner sign-off

Kalau Owner mau Tier-relevant adjustment di SIKESUMA berdasarkan insight dari SIMRS spoke / Khanza, **Owner brief eksplisit di sesi SIKESUMA** dulu — SIKESUMA AI session baru proceed.

### §S.3 SIMRS Spoke Session Read-Only ke SIKESUMA

SIMRS spoke session (Khanza analyst, atau future SIMRS BT Phase 2 sessions) **MAY**:

- Clone repo SIKESUMA (public)
- Run schema introspection queries di Supabase SIKESUMA (anon JWT read-only by RLS)
- Browse live app `sikesumav31.vercel.app`
- Baca docs: `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` (primary), `docs/REVISI-POK-PAGU-vKoreksi.md`, `docs/TIER-5-DESIGN.md`, `SSOT-REFACTOR-LOG.md`, dll.
- Adopt pattern ke SIMRS BT codebase (knowledge transfer adalah tujuan)

SIMRS spoke session **MAY NOT**:

- Push commit ke SIKESUMA repo
- Buka PR ke SIKESUMA
- Modify schema/data di Supabase SIKESUMA
- Trigger Vercel deployment SIKESUMA
- Edit SIKESUMA docs (`docs/`, `SSOT-REFACTOR-LOG.md`, `HANDOVER.md`, dll.)

Boundary enforced by access pattern (read-only credentials) + cross-project policy (this addendum).

### §S.4 Eskalasi Pattern — Single Source of Coordination

```
SIMRS spoke finds suggestion/issue       Owner brief async      SIKESUMA AI session
        di SIKESUMA                                                  (separate session)
              │                                  │                          │
              │  feedback ke Owner               │                          │
              │  via SIMRS spoke chat            │                          │
              ├─────────────────────────────────►│                          │
              │                                  │  Owner consolidate +     │
              │                                  │  brief SIKESUMA session  │
              │                                  ├─────────────────────────►│
              │                                  │                          │  Implement
              │                                  │                          │  kalau Owner sign-off
              │                                  │                          │  + paired commit
              │                                  │                          │
              │                                  │  Owner brief SIMRS back  │
              │  ◄───────────────────────────────┤  kalau perlu             │
              │                                  │                          │
```

**No AI-to-AI direct cross-touch.** Owner adalah single source of coordination.

### §S.5 SIKESUMA Docs untuk SIMRS Consumption

Dua dokumen khusus dibuat 13 Mei 2026 (post Tier 5a) sebagai SIMRS-facing reference:

| File | Purpose |
|---|---|
| `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` | Holistic intro (~700 lines): tech stack, schema overview, validation engine, audit trail, tier roadmap, patterns, anti-patterns, deep-dive pointers |
| `docs/SIMRS-SPOKE-READ-ACCESS.md` | Access points (~400 lines): GitHub URL, Supabase URL, anon JWT placeholder, schema introspection queries, boundary reminders, quick-start checklist |

Update protocol untuk dokumen ini (versioning, ownership, lifecycle) sama dengan dokumen SIKESUMA lain — Owner-owned, SIKESUMA AI session maintained.

### §S.6 Boundary Check di Setiap SIKESUMA Sesi

Saat fresh AI session SIKESUMA bootstrap, **mandatory step tambahan** (post v1.4 bootstrap):

- ☐ Read `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` §"Read-Only Boundary" (singkat — 2 menit)
- ☐ Aware bahwa SIMRS BT parallel track exists
- ☐ Decline kalau Owner request ad-hoc minta touch SIMRS BT artifact — eskalasi ke fresh SIMRS BT session

### §S.7 Backward Compatibility

Tidak ada SIKESUMA tier work yang affected by v1.5 — purely additive governance layer. Existing Tier 5a-and-below decisions tetap valid.

Future tier work (Tier 5b, 6, 7+) yang **bisa** affected:

- Saat SIKESUMA build API contract ke SIMRS BT (kemungkinan Tier 7+) — Owner-driven decision, separate brief required
- Saat schema SIKESUMA evolve in a way yang impact SIMRS BT integration plan — update `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` paired

---

*Addendum v1.5 added by AI Assistant post-Tier-5a-MERGED + post-TS-cleanup, untuk codify cross-project boundary pasca SIMRS Batin Tikal parallel track Owner-initiated. Lateral peer model (per SIMRS Blueprint §4.5) terbawa ke SIKESUMA governance. SIKESUMA AI session stays on SIKESUMA track; SIMRS spoke session may read SIKESUMA read-only; cross-touch via Owner only. Authoritative governance — overrides any conflicting guidance from compaction summaries atau stale doc references.*

