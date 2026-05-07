# Step 2 — Completion Roadmap v3.1 (v2)

**Sesi:** Spoke RKKS-oriented restart (clean), 6 Mei 2026
**Predecessor:** STEP1_GAP_MATRIX_v3_1_audit.md, STEP2_COMPLETION_ROADMAP_v3_1.md (v1, archived)
**Update trigger:** User context update — project = battle-tested template (extensive work expected) + data loss tidak menjadi masalah (keuangan RS belum dependent)
**Scope:** Reframed Step 2 dengan scope expand untuk battle-testing foundational, decision Q1 reverted ke konsolidasi agresif
**Status:** Draft v2 — supersede v1 (preserved sebagai historical)

---

## §0 Konteks Update v2

Step 2 v1 dibangun dengan dua working assumption: (1) effort budget moderate (~12-17 jam), (2) data loss = serious risk yang membuat Q1 konsolidasi agresif un-viable. User context update di sesi yang sama (6 Mei 2026) mengkoreksi keduanya:

1. **Battle-tested template intent** — proyek ini akan jadi reference template untuk RS lain di lingkungan TNI AD (atau institusi serupa), bukan sekadar deploy untuk RS Tk.IV Batin Tikal sendiri. Implikasi: clean foundation > shortcut, technical debt dihindari sejak awal, decisions di-buat dengan jangka panjang.

2. **Data loss tidak menjadi masalah** — keuangan RS aktual saat ini tidak dependent pada v3.1 (masih kelola dengan tools lain pra-deployment). Implikasi: drop tabel + lose 3,180 audit_log rows + 369 claims rows = no operational impact. Risk profile berubah dari "kritis" ke "acceptable" untuk semua schema migration.

Kedua context ini fundamentally mengubah trade-off Q1 dan Q4 dari Step 2 v1. Sebagai konsekuensi, prioritized fix list expand dari 11 items ke ~14 items, plus schema konsolidasi sequence baru. Effort estimate naik dari ~12-17 jam ke ~30-40 jam. Format dokumen ini mempertahankan struktur Step 2 v1 supaya user bisa diff side-by-side.

---

## §1 Recap COUNT Findings (No Change dari v1)

Hasil COUNT user (CSV upload) tetap valid dan informatif untuk planning Step 2 v2. Yang berubah = interpretasi-nya, bukan data-nya.

| Tabel | Rows | Sifat di v2 context |
|---|---|---|
| `revenue_targets` (Grup A) | 2 | Wire load + save — data preserved |
| `specialty_targets` (Grup A) | 1 | Wire load + save — data preserved |
| `jasa_verification_files` (Grup A) | 0 | Wire + Storage bucket setup |
| `audit_log` (Grup B) | 3,180 | **Drop** — data loss OK, audit_log infrastructure di-rebuild fresh di Step 3-4 saat Sikesuma_ketujuh integration |
| `claims` (Grup B) | 369 | **Drop** — re-export dari Sikesuma_ketujuh window.storage di Step 3 kalau perlu |
| `sections, staff, rabs, rpds, rab_categories, rpd_sections, pnbp, service_bills, service_details, profiles` (Grup B) | 0-6 each | **Drop semua** — clean schema |

---

## §2 Trade-off Analysis Updated (v2)

### 2.1 Q1 Re-revisited — Strategi Schema dengan Data Loss OK

Tiga opsi yang sama, tapi recommendation flip dari v1:

**Opsi A1 — Konsolidasi agresif (RECOMMENDED v2):**
- Action: drop **semua** Grup B tables (15 tabel: audit_log, sections, claims, staff, rabs, rpds, rab_categories, rpd_sections, pnbp, pnbp_config, bpjs_calc_settings, bpjs_config, bpjs_tariffs, service_bills, service_details, profiles, payroll, payroll_config — minus yang akan di-recreate dengan naming/schema final di Step 4).
- Effort: medium. SQL `DROP TABLE` per table + verify no FK constraint + cleanup RLS policies. Per tabel ~5-10 menit. Total ~2-3 jam untuk 15 tabel + test access app tetap working.
- Risk v1 (data loss permanent): **Sekarang acceptable** per user context.
- Risk v2 baru: end state kalau Step 3 ternyata butuh leverage Sikesuma_ketujuh data — re-export jalur via window.storage backup tersedia di Sikesuma_ketujuh.zip + sikesuma-handover-v2_6.zip.
- Pro: clean foundation, single naming convention, zero technical debt, Step 3 + 4 punya canvas kosong untuk synthesize integrasi dengan informed perspective.
- Cons: minor — kalau predecessor punya migration path khusus yang tidak documented, bisa lost; tapi per handover §16 + Sikesuma_ketujuh handover, semua infrastructure aktif sudah documented.

**Opsi A2 — Konsolidasi selektif (alternative):**
- Action: drop only kosong + low-row (`service_details` 0, `profiles` 1, `pnbp` 2, `service_bills` 2, `rabs` 2, `rpds` 2). Audit yang punya isi substantial — defer.
- Effort: low (~1 jam).
- Pro: less aggressive, leave room untuk Step 3 evaluate.
- Cons: dual-naming bertahan, technical debt persist.

**Opsi A3 — Defer (recommendation v1):**
- Sekarang inferior — defer = bertahan dual-naming saat user explicitly mau battle-tested template clean.

**Recommendation v2: Opsi A1.**

Rationale: dengan battle-tested template intent + data loss OK, clean foundation jangka panjang menang dari short-term effort save. Step 3 (Sikesuma_ketujuh insights audit) start dari schema canvas Grup A pure → audit insights → Step 4 synthesize new tables (kalau perlu) dengan naming/schema final. Tidak ada legacy schema yang di-bawa.

### 2.2 Q3 — payrollStatuses Persistence (No Change dari v1)

**Recommendation tetap Opsi E** (tabel baru `payroll_statuses` envelope JSONB). Trade-off table dari v1 §2.2 valid. Plus dengan v2 context, ambil kesempatan migrate ke zero-padded key pattern (`'YYYY-MM-personId'`) — fix Watchpoint v1.0 #6 sekalian.

### 2.3 Q4 — Multi-year DB Storage (REVERSED dari v1)

**v1 decision: Defer ke Phase 3 hardening.**

**v2 decision: Promote ke P2 Step 2.** 

Rationale: dengan battle-tested template intent, multi-year support adalah foundational requirement — RS pemerintah audit BPK retrospektif sering tanya year-over-year (audit klaim 2025 di tahun 2027). Single-year storage = future technical debt yang block migration data + komparasi YoY. Strategy:

Opsi multi-year storage (3 alternatif):

**Opsi M1 — Field `year` di JSONB envelope `data`:**
- Schema: `pagu_sections.data: { year: 2025, title, rows }`. App filter di-do di JS layer setelah fetch.
- Pro: minimum schema change. Cons: fetch all years saat load, performance issue scale-up.

**Opsi M2 — Per-year row dengan id pattern `pagu-2025-${section}`, `pagu-2026-${section}` (RECOMMENDED):**
- Schema: tetap envelope JSONB, id pattern berisi year. App filter via id prefix di SQL: `WHERE id LIKE 'pagu-2025-%'`.
- Pro: scalable, native SQL filter, mengikuti envelope pattern existing. Cons: id pattern jadi compound (parsing layer di App).

**Opsi M3 — Tabel terpisah per year (`pagu_sections_2025`, `pagu_sections_2026`):**
- Schema: per-year table. Pro: clean separation. Cons: schema management nightmare, table proliferasi.

**Recommendation: Opsi M2** — id pattern berisi year. Mengikuti envelope JSONB convention, filter native via SQL prefix, scalable, no schema changes per-year baru.

Implementation: existing 4 rows pagu_sections perlu rename id (mis. `sec-jasa` → `pagu-2025-jasa`) saat migrate. Same untuk bills, patient_claims, dll yang perlu year-aware.

### 2.4 Decisions Summary (v2)

| Q | v1 Decision | v2 Decision | Rationale Update |
|---|---|---|---|
| Q1 schema strategy | A3 defer | **A1 konsolidasi agresif** | Data loss OK + battle-tested intent |
| Q2 RAB/RPD persist | Defer | Defer (no change) | Tetap design decision, butuh Sie Renbang input |
| Q3 payrollStatuses | Opsi E | Opsi E + zero-pad fix | No change recommendation, tambah Watchpoint #6 fix |
| Q4 multi-year | Defer | **Promote P2 (Opsi M2)** | Foundational untuk template, audit BPK YoY |
| Q5 file storage | Include P2 | Include P2 + scope expand | Battle-testing rigor (validation, error handling, edge cases) |
| Q6 orphan counts | Wire data | Wire data Grup A | Grup B dropped per Q1 A1 |

---

## §3 Prioritized Fix List (v2)

Klasifikasi P1/P2/P3 dengan v2 expand. NEW item ditandai `[NEW v2]`.

### §3.1 P1 — Schema Konsolidasi + Stage 3 Critical Wiring

**F1.0 [NEW v2] — Schema konsolidasi: drop Grup B tables**

Per Q1 A1.

Pre-flight diagnostic:
```sql
-- Identify FK constraints (kalau ada — kemungkinan tidak ada per Phase 2)
SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to
FROM pg_constraint WHERE contype = 'f';

-- Identify RLS policies on Grup B tables
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('audit_log','sections','claims','staff','rabs','rpds',
                    'rab_categories','rpd_sections','pnbp','pnbp_config',
                    'bpjs_calc_settings','bpjs_config','bpjs_tariffs',
                    'service_bills','service_details','profiles',
                    'payroll','payroll_config');
```

SQL migration:
```sql
-- Drop policies first (clean)
DROP POLICY IF EXISTS audit_log_select ON audit_log;
-- ... per table per policy

-- Drop tables (CASCADE untuk auto-drop dependent constraints)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS rabs CASCADE;
DROP TABLE IF EXISTS rpds CASCADE;
DROP TABLE IF EXISTS rab_categories CASCADE;
DROP TABLE IF EXISTS rpd_sections CASCADE;
DROP TABLE IF EXISTS pnbp CASCADE;
DROP TABLE IF EXISTS pnbp_config CASCADE;
DROP TABLE IF EXISTS bpjs_calc_settings CASCADE;
DROP TABLE IF EXISTS bpjs_config CASCADE;
DROP TABLE IF EXISTS bpjs_tariffs CASCADE;
DROP TABLE IF EXISTS service_bills CASCADE;
DROP TABLE IF EXISTS service_details CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS payroll_config CASCADE;
```

Post-migration verification:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```
Expected output: only Grup A naming tables (`pagu_sections`, `bills`, `patient_claims`, `doctors`, `employees`, `revenue_targets`, `specialty_targets`, `jasa_verification_files`, `system_settings`).

Then smoke-test live app — verify load + sync + edit + refresh masih working setelah cleanup.

Effort: 2-3 jam (SQL execution + verification + live smoke test).
Rollback: kalau drop salah, restore dari Supabase point-in-time recovery (Pro tier feature) atau re-apply seed scripts predecessor (per handover §16.9 saved queries).
Risk: medium — irreversible without point-in-time recovery, tapi data loss OK per user context.

**F1.1 — Wire `revenue_targets` load + save (no change dari v1)**

State sekarang: pass `DUMMY_REVENUE_TARGETS` ke RevenueModule, handler `() => {}` no-op. Tabel di DB punya 2 rows seed.

Action items (v2 expand dengan validation rigor):
- (a) Add state slice `[revenueTargets, setRevenueTargets] = useState<RevenueTarget[]>(DUMMY_REVENUE_TARGETS)` di App.tsx
- (b) `loadData()`: fetch + unwrap envelope + **validate shape** (defensive: check `r.data` exists, expected fields present, fallback ke DUMMY kalau corrupt)
- (c) `syncToCloud()`: wrap envelope + **error handling** (catch upsert error, log, optional retry)
- (d) Replace pass-down + handler di line 422 App.tsx
- (e) `[NEW v2]` Manual smoke test sequence: edit target → sync → DevTools network verify 200 OK → refresh → verify persist → edit ke nilai berbeda → sync → confirm second update juga persist (catch race condition)

Effort: 1.5-2 jam (incl. validation + smoke test).
Risk: low.

**F1.2 — Wire `specialty_targets` load + save (no change dari v1)**

Identik F1.1 dengan substitusi `specialty_targets` + `SpecialtyTarget`. Effort: 1-1.5 jam.

**F1.3 — Pre-flight diagnostic SQL data shape verify**

Sebelum F1.1/F1.2 execute, verify shape:
```sql
SELECT id, data FROM revenue_targets;
SELECT id, data FROM specialty_targets;
```
Cross-check field di output dengan `RevenueTarget` + `SpecialtyTarget` interface di types.ts. Effort: 10 menit.

### §3.2 P2 — Stage 1, 2, 4 Persistence + Multi-year Foundation

**F2.0 [NEW v2] — Multi-year storage migration (Opsi M2)**

Per Q4 promote.

SQL migration (per tabel core year-aware):
```sql
-- Pagu sections: rename id ke year-aware pattern
UPDATE pagu_sections 
SET id = 'pagu-2025-' || REGEXP_REPLACE(id, '^sec-', '')
WHERE id LIKE 'sec-%';

-- Verify
SELECT id, data->>'title' FROM pagu_sections;
-- Expected: pagu-2025-jasa, pagu-2025-ops, pagu-2025-modal, pagu-2025-pemeliharaan
```

Same pattern untuk `bills`, `patient_claims` kalau predecessor seed pakai id non-year-aware. Cek dulu existing id pattern.

Code changes App.tsx:
- (a) `loadData()`: filter via SQL prefix `from('pagu_sections').select('*').like('id', `pagu-${targetYear}-%`)` instead of fetch all
- (b) `syncToCloud()`: id generation untuk row baru wajib year-aware: `id: \`pagu-\${currentRKKSYear}-\${slug}\``
- (c) Switch tahun di UI (dropdown TA 2024 ↔ TA 2025): trigger re-load dengan filter year baru
- (d) `[NEW v2]` Validation: kalau row dengan id legacy `sec-*` masih ada (kalau migration tidak comprehensive), warn console + skip parse

Effort: 3-4 jam.
Risk: medium — schema migration touch existing data, butuh backup + rollback plan via point-in-time recovery.

**F2.1 — CREATE TABLE `payroll_statuses` + wire load/save**

Per Opsi E §2.2 (no change dari v1). v2 add: zero-padded key migration sekalian.

SQL migration (sama dengan v1, dengan id pattern zero-padded):
```sql
CREATE TABLE payroll_statuses (
  id text PRIMARY KEY,        -- pattern: 'YYYY-MM-personId' zero-padded
  data jsonb NOT NULL,        -- { status: 'Lunas'|'Belum Lunas', notes? }
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

ALTER TABLE payroll_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY payroll_statuses_select ON payroll_statuses FOR SELECT TO public USING (true);
CREATE POLICY payroll_statuses_insert ON payroll_statuses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY payroll_statuses_update ON payroll_statuses FOR UPDATE TO public USING (true);
CREATE POLICY payroll_statuses_delete ON payroll_statuses FOR DELETE TO public USING (true);
```

App.tsx changes (v2 add zero-pad helper):
- Helper: `const normalizeKey = (year, month, personId) => \`\${year}-\${String(month).padStart(2, '0')}-\${personId}\``
- All read/write payrollStatuses pakai helper, fix Watchpoint v1.0 #6

Effort: 3-3.5 jam (table + RLS + wire + helper migration + smoke test).

**F2.2 — Wire `jasa_verification_files` + Supabase Storage bucket (v2 expand scope)**

Per Q5. v2 expand: validation rigor, comprehensive error handling.

**Part 2.2.a — Storage bucket:**
- Create bucket `jasa-verification` di Supabase Studio
- RLS: read public, write authenticated (battle-tested template = tighten dari "open" Phase 2 pattern)
- File size limit: 10 MB per file
- MIME types whitelist: `application/pdf`, `image/png`, `image/jpeg`
- `[NEW v2]` Folder structure convention: `{periodKey}/{kategori}/{filename}` mis. `2025-01/tks/honor-januari.pdf`

**Part 2.2.b — App wiring:**
- File upload UX: drag-drop atau button click → validate (size, MIME) di client side sebelum upload → progress indicator → upload via Supabase Storage SDK → dapat URL → simpan metadata di `jasa_verification_files` envelope
- `[NEW v2]` Error handling matrix: file too large → user-friendly toast, MIME reject → toast, network fail → retry 3x dengan exponential backoff, Storage quota exceed → admin alert
- `[NEW v2]` Edit existing file: replace flow (upload baru → soft-delete URL lama dari bucket setelah verify upload baru success)
- `[NEW v2]` Audit log entry per upload (insert ke `system_settings.upload_log` atau separate `audit_log` table baru — decision di Step 4)

Effort: 5-7 jam (Storage setup + RLS + upload UX + error handling + smoke test).
Risk: medium-high — binary file flow + edge case coverage.

**F2.3 — Verify BpjsSettingsForm save flow end-to-end (no change dari v1)**

Read-only investigation pertama. Effort: 1.5-2 jam.

**F2.4 [NEW v2] — Validation rigor pass di App.tsx loadData + syncToCloud**

Per battle-tested template intent — assumption-based coding bermasalah (per SS-002 §15.3). Defensive coding pass:

- (a) Setiap unwrap JSONB: check `data` exists, fallback ke `{}` kalau null
- (b) Setiap field access nested: optional chaining `data?.title` instead of `data.title`
- (c) Setiap save: try-catch dengan specific error logging (HTTP status, error code, user-friendly message)
- (d) Race condition prevention: state setter callback form `setX(prev => [...prev, item])` instead of `setX([...x, item])` di async paths
- (e) Schema drift detection: kalau load returns row dengan unexpected shape, log warning + use fallback

Effort: 2-3 jam (audit current code + defensive patches + smoke test).

### §3.3 P3 — Cleanup + Watchpoint Resolution + Documentation (v2 minor adjust)

**F3.1 — Investigate `SubTab.REV_DAILY` orphan enum** (no change). Effort: 30 menit.

**F3.2 — Verify MonthlyReport + YearlyReport render path** (no change). Effort: 30 menit.

**F3.3 [REPLACED v2] — Multi-year storage CHECKLIST verification**

V1 plan: document gap untuk Phase 3. V2 plan: F2.0 sudah implement multi-year, jadi F3.3 = verification checklist.
- All pagu_sections id year-aware?
- Switch tahun di dropdown UI trigger re-load dari DB dengan filter year baru?
- Edit + save di TA 2025 tidak corrupt data TA 2024?
Effort: 30 menit.

**F3.4 — Document RAB/RPD persistence gap untuk Phase D** (no change). Effort: 15 menit.

**F3.5 — Document RLS hardening recommendation untuk Step 5** (no change scope, tapi spec lebih detail untuk battle-tested template):
- Authenticated user model dengan 4 roles per handover §3 Fase 1 (admin/bendahara/verifikator/viewer)
- Policy granular per-table per-role (verifikator hanya read patient_claims, bendahara write bills, admin all access, viewer read-only)
- Audit log per write operation (siapa yang edit kapan)
Effort: 30-45 menit.

**F3.6 [NEW v2] — Document Phase 3 hardening backlog**

Battle-tested template butuh checklist explicit untuk hardening yang masuk Step 5 scope:
- Automated test suite (E2E Cypress + unit Vitest)
- Sentry error monitoring setup
- Backup automation (cron + export)
- Custom domain migration (sikesumav31.vercel.app → sikesuma.batinikal.tniad.mil.id atau sikesuma.com)
- Analytics + observability
- Soft launch protocol
Effort: 30-45 menit.

---

## §4 Effort Estimation Summary (v2)

| Priority | Items | v1 Effort | v2 Effort | Cumulative |
|---|---|---|---|---|
| P1 | F1.0, F1.1, F1.2, F1.3 | 2.5-3 jam | **5-7 jam** | 5-7 jam |
| P2 | F2.0, F2.1, F2.2, F2.3, F2.4 | 8-11 jam | **15-20 jam** | 20-27 jam |
| P3 | F3.1-F3.6 | 2-2.5 jam | **2.5-3.5 jam** | **22.5-30.5 jam** |

Total Step 2 v2 scope ~22-30 jam (vs ~12-17 jam v1). Distribution: 5-6 implementation sessions terpisah.

---

## §5 Sequencing Recommendation (v2)

Per Spoke A v1.3 §7.4 #4 (additive + plan rollback) + battle-tested rigor (per checkpoint setiap milestone).

**Sequence 1 (P1 batch — schema cleanup + Stage 3):**
1. F1.3 pre-flight diagnostic SQL (10 menit)
2. F1.0 schema konsolidasi: backup point-in-time → drop Grup B → verify → smoke test live app (2-3 jam)
3. **Checkpoint 1.1 — verify v3.1 still working post-cleanup**
4. F1.1 wire revenue_targets (1.5-2 jam)
5. F1.2 wire specialty_targets (1-1.5 jam)
6. **Checkpoint 1.2 — verify Tab 3 Monitoring functional dari DB**

**Sequence 2 (P2 batch.A — multi-year + payroll_statuses):**
7. F2.0 multi-year migration: id rename existing + App.tsx code updates (3-4 jam)
8. **Checkpoint 2.1 — verify TA 2025 default load + switch year tidak corrupt**
9. F2.1 CREATE TABLE payroll_statuses + wire + zero-pad helper (3-3.5 jam)
10. **Checkpoint 2.2 — verify payroll status persist + switch period accurate**

**Sequence 3 (P2 batch.B — file storage + validation):**
11. F2.3 verify BpjsSettingsForm read-only (1.5-2 jam)
12. F2.4 validation rigor pass App.tsx (2-3 jam)
13. **Checkpoint 3.1 — verify defensive coding catches edge cases**
14. F2.2 file storage setup + wire (5-7 jam)
15. **Checkpoint 3.2 — verify file upload + persist + retrieve binary**

**Sequence 4 (P3 batch — cleanup + docs):**
16. F3.1, F3.2 investigations (1 jam total)
17. F3.3 multi-year verification (30 menit)
18. F3.4, F3.5, F3.6 documentation (1.5 jam total)
19. **Checkpoint 4 — Step 2 v2 selesai, ready Step 3**

---

## §6 Open Risks (v2)

1. **Schema konsolidasi irreversibility.** F1.0 drop tabel = tergantung Supabase point-in-time recovery (Pro tier feature). Verify project saat ini adalah Pro tier sebelum execute. Kalau Free tier, backup manual via SQL dump dulu.

2. **Multi-year migration edge cases.** F2.0 rename id legacy → year-aware. Edge case: kalau ada row reference id lama (mis. di JSONB nested field di tabel lain), perlu cascade update. Per Phase 2 schema = pure envelope, kemungkinan kecil ada cross-reference, tapi audit dulu sebelum execute.

3. **File storage Storage bucket cost.** Supabase Storage saat ini Free tier punya quota 1 GB total. Battle-tested template untuk multi-RS = scale issue. Saran: alert + monitoring quota usage, plan tier upgrade kalau approach 80%.

4. **Validation rigor regression risk.** F2.4 defensive coding pass touch existing function (`loadData`, `syncToCloud`). Risk introduce regression. Mitigation: smoke test setiap addition incremental, jangan batch banyak fix dalam satu commit.

5. **Step 3 scope clarity.** Sikesuma_ketujuh integration di Step 3 sekarang start dari Grup A pure (Grup B dropped). Implikasi: insights yang RKKS-aligned (audit log, voucher numbering, kuitansi A4, PNBP module) harus di-design fresh dengan envelope JSONB pattern + Grup A naming conventions, bukan reverse-engineer dari Grup B existing schema. Step 3 effort estimate kemungkinan grow.

6. **Testing strategy still manual smoke.** Battle-tested template ideally pakai automated test suite (E2E Cypress + unit Vitest). Step 2 v2 tetap manual smoke test pattern existing — promote ke F3.6 Phase 3 hardening backlog. Acceptable risk untuk Step 2.

---

## §7 Decisions Summary (v2)

| Decision Point | v1 Outcome | v2 Outcome | Source |
|---|---|---|---|
| Q1 schema strategy | Defer (A3) | **Konsolidasi agresif (A1)** | User context: data loss OK + battle-tested |
| Q2 RAB/RPD persist | Defer | Defer (no change) | User decision (c) |
| Q3 payrollStatuses | Opsi E (table baru) | Opsi E + zero-pad fix Watchpoint #6 | Battle-tested rigor |
| Q4 multi-year | Defer Phase 3 | **Promote P2 (Opsi M2 id pattern year-aware)** | Foundational untuk template |
| Q5 file storage | Include P2 | Include P2 + scope expand validation+error handling | Battle-tested rigor |
| Q6 orphan counts | Wire data | Wire data Grup A | Same |
| Validation rigor | Implicit | **Explicit F2.4 pass** | Battle-tested intent |
| Multi-RS scale awareness | Out of scope | **Risk #3 + F3.6 backlog** | Template intent |

---

## §8 Checkpoint Konfirmasi sebelum Eksekusi atau Step 3

1. **Q1 v2 revisi (A1 konsolidasi agresif) — confirm?** Anda di v1 jawaban awal pilih (a) konsolidasi, lalu saya revisi ke A3 di Step 2 v1 berdasarkan asumsi data loss critical, sekarang saya revisi balik ke A1 setelah Anda jelaskan data loss tidak masalah. Closing the loop — apakah recommendation v2 sudah aligned dengan intent Anda?

2. **Q4 v2 promote multi-year ke P2 — sesuai expectation?** Ini scope expand dari v1 (yang defer). Battle-tested template = multi-year foundational. Setuju?

3. **Effort total ~22-30 jam (vs v1 ~12-17 jam) — OK?** Distribusi: P1 5-7 jam, P2 15-20 jam, P3 2.5-3.5 jam. Sequence: 4 sessions atau lebih.

4. **Verify Supabase tier untuk F1.0 rollback:** Anda subscribed Pro tier (point-in-time recovery available) atau Free tier? Kalau Free, F1.0 sequence butuh tambah step "manual SQL dump backup sebelum drop". Effort + 1-2 jam.

5. **F2.2 file storage — Supabase Storage quota awareness OK?** Free tier 1 GB. Per RS minimum 12 bulan × 3 kategori × ~5 file rata-rata × ~1 MB = ~180 MB per RS per tahun. Multi-RS template = scale issue. Saran tier upgrade kalau approach 80% quota.

6. **Lanjut Step 3 atau implementasi Step 2 v2 dulu?** Empat opsi:
   - (a) **Step 3 dulu** (Sikesuma_ketujuh insights audit, output integration list with informed perspective dari schema canvas Grup A pure post-konsolidasi)
   - (b) **Implement P1 Sequence 1 dulu** (~5-7 jam, schema cleanup + Stage 3 wiring), checkpoint live, baru Step 3
   - (c) **Full Step 2 v2 implementation dulu** (~22-30 jam), baru Step 3
   - (d) opsi lain

7. **F3.6 [NEW] Phase 3 hardening backlog — scope yang Anda envision?** Saat ini saya list automated tests, Sentry, backup, custom domain, analytics, soft launch. Ada item lain (mis. specific compliance untuk TNI AD, integrasi sistem existing TNI seperti SIPADA, dll)?

Setelah jawaban Anda atas 7 hal di atas, saya proceed sesuai pilihan.

---

*End of Step 2 v2 — Completion Roadmap dengan battle-tested template scope. Document ini supersede Step 2 v1 (preserved sebagai historical). Versioning: v2.0 (2026-05-06, post user context update).*
