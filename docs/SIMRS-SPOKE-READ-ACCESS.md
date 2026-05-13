# SIMRS Spoke Session — Read-Only Access to SIKESUMA

**Status:** Active reference untuk SIMRS Batin Tikal spoke session
**Document type:** Access points + read-only credentials placeholder
**Companion to:** `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` (holistic introduction — baca ITU dulu)
**Tanggal:** 13 Mei 2026
**Versi:** 1.0
**Maintained by:** SIKESUMA AI session (Owner-supervised)

---

## ⚠️ Read-Only Boundary

Lihat companion doc §"Read-Only Boundary" untuk daftar do/don't lengkap. Ringkasan:

✅ **OK:** clone repo, query database read-only, baca docs, adopt pattern ke SIMRS BT
❌ **TIDAK OK:** push commit, modify schema, trigger deployment, edit SIKESUMA artifacts

---

## 1. GitHub Repository

### 1.1 URL & Akses

| Aspek | Value |
|---|---|
| URL | `https://github.com/urrenbatik-cloud/SIKESUMAv3.1` |
| Visibility | Public (clone tanpa autentikasi possible) |
| Branch active | `main` (HEAD post Tier 5a MERGED + TS cleanup) |
| Branch production | `production` (Tier 4c, deployed ke `sikesumav31.vercel.app`) |

### 1.2 Clone Command (No PAT Needed)

```bash
git clone https://github.com/urrenbatik-cloud/SIKESUMAv3.1.git
cd SIKESUMAv3.1
```

**Note:** Clone tanpa PAT cukup untuk read access ke public repo. PAT hanya dibutuhkan untuk:
- Higher rate limit (5000 req/h vs 60 req/h anonymous) — relevant kalau spoke session pull metadata banyak via API
- Clone private branches (tidak applicable — SIKESUMA repo public)

Kalau spoke session butuh PAT (rate limit reason saja), Owner akan share via channel terpisah (PAT scope: `public_repo` read-only, expire date set).

### 1.3 Branch Inspection — Quick Recipes

```bash
# Lihat status terkini main
git log --oneline -5

# Lihat divergence main vs production
git log --oneline production..main

# Lihat history Tier 5 specifically
git log --oneline --grep="tier-5"

# Diff yang dibawa Tier 5a ke main
git diff production..main --stat
```

### 1.4 Key Paths untuk Inspection

Daftar prioritas — paling relevant untuk SIMRS BT design reference:

| Path | Apa di sini | Prioritas baca |
|---|---|---|
| `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` | This intro doc (root reference) | **1 (wajib)** |
| `docs/REVISI-POK-PAGU-vKoreksi.md` | Master domain doc (~400 lines) | **2 (high)** |
| `docs/TIER-5-DESIGN.md` | Audit trail design R1-R8 + R6+ | **2 (high)** |
| `types.ts` | Canonical types (~480 lines) | **3 (medium)** |
| `utils/usulanRevisiStateMachine.ts` | State machine 6 rules + R6+ override | **3 (medium)** |
| `services/usulanRevisiService.ts` | Supabase CRUD service layer | **3 (medium)** |
| `utils/submitRevisiHelpers.ts` | Submit flow orchestrator + LHR APIP | **3 (medium)** |
| `utils/validators/c*.ts` | 12 validators (per-validator file) | **4 (when relevant)** |
| `migrations/tier-5-*.sql` | DDL Tier 5 (3 tables + RLS + trigger) | **4 (when relevant)** |
| `SSOT-REFACTOR-LOG.md §0.12` | Tier 5 decision log + execution logs | **3 (medium)** |
| `HANDOVER.md` | Current state authoritative | **2 (high)** |

---

## 2. Supabase Database (Read-Only)

### 2.1 Connection Info

| Aspek | Value |
|---|---|
| URL | `https://qjijsftbytozcoyrtric.supabase.co` |
| Region | (Supabase managed; cek dashboard) |
| Engine | PostgreSQL 15+ |

### 2.2 Credentials (Owner will share separately)

**SIMRS spoke session butuh credential terpisah dari Owner.** Saat ini SIKESUMA pakai:

| Key type | Akses | Untuk SIMRS spoke |
|---|---|---|
| **anon JWT** (`eyJ...`) | RLS-gated read/write via PostgREST | ✅ Recommended — read-only by RLS design |
| **service_role JWT** | Full admin bypass RLS | ❌ TIDAK untuk SIMRS spoke (over-permissive) |
| **Management API PAT** (`sbp_...`) | Schema-level DDL via Management API | ❌ TIDAK untuk SIMRS spoke (write capability) |

**Owner action item:** Owner akan share **anon JWT** ke SIMRS spoke session via channel terpisah (mis. file `temporary_supabase_readonly.txt` upload ke SIMRS spoke chat). Anon JWT cukup untuk:
- SELECT dari tables yang public-accessible per RLS
- Schema introspection via `information_schema`
- Real-time subscribe untuk monitor pattern (read-only)

### 2.3 Schema Introspection Queries

Setelah credentials ter-load, SIMRS spoke bisa pakai queries berikut untuk eksplorasi:

```sql
-- List semua tables di public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- List columns + data types untuk specific table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usulan_revisi'
ORDER BY ordinal_position;

-- List RLS policies (untuk lihat read access pattern)
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- List indexes (lihat query optimization pattern)
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- List triggers (R7c immutability defense)
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

### 2.4 Data Pattern Query Examples

```sql
-- Lihat current state Tier 5 tables (semua kosong sampai first Submit di production)
SELECT count(*) FROM usulan_revisi;
SELECT count(*) FROM usulan_revisi_perubahan;
SELECT count(*) FROM snapshot_pok;

-- Lihat JSONB envelope shape lhr_apip_global (Tier 5a Phase 2.5)
SELECT key, value, updated_at
FROM system_settings
WHERE key = 'lhr_apip_global';

-- Lihat shape Pagu data (TA 2025 historis + TA 2026 belum mulai)
SELECT id, data->>'title' AS section_title, jsonb_array_length(data->'rows') AS row_count
FROM pagu_sections
ORDER BY id
LIMIT 10;

-- Lihat BAS account mapping pattern (untuk jasa medis)
SELECT id, kategori, akun
FROM jasa_account_map
LIMIT 20;
```

### 2.5 What NOT to Query

❌ **INSERT / UPDATE / DELETE** apa pun ke SIKESUMA tables — even saat RLS allow, ini violates spoke session boundary
❌ **DDL** (CREATE TABLE, ALTER, DROP) — anon JWT tidak bisa anyway, tapi disebut explicit
❌ **Storage bucket operations** — file uploads ke `jasa-verification` bucket dll. read-only juga

Kalau perlu test pattern dengan write-capability, gunakan **Supabase project terpisah** untuk SIMRS BT (Owner akan provision).

---

## 3. Live Application (Optional View)

### 3.1 Production URL

| URL | State | Akses |
|---|---|---|
| `https://sikesumav31.vercel.app` | Tier 4c (production branch) | Public web, no login required untuk halaman umum |

**Catatan:** Beberapa modul (mis. Settings, audit-sensitive views) mungkin gated by Supabase Auth — tidak relevant untuk spoke session yang fokus arsitektur.

### 3.2 Preview URL (Tier 5a state)

Main branch (`b1239f4`, Tier 5a + TS cleanup) auto-deployed ke Vercel Preview. URL pattern:

```
https://sikesumav31-git-main-<team-slug>.vercel.app
```

Team slug variable — paling reliable: buka GitHub commit page (`https://github.com/urrenbatik-cloud/SIKESUMAv3.1/commit/b1239f4`), scroll ke "Checks", klik "Vercel – Preview" Details, ambil URL "Visit Preview".

**Kalau SIMRS spoke butuh preview URL, lewat Owner — Owner akan share via channel terpisah.**

### 3.3 Apa yang Bisa Dilihat di Live App

| Tab | Apa | Relevance untuk SIMRS BT |
|---|---|---|
| Pagu Anggaran | Section + row editor | Pattern table-of-tables UI untuk anggaran |
| RAB | Categories + narratives | Composable narrative + numbers |
| RPD | Per-bulan penarikan dana | Calendar-based input pattern |
| LRA | Realisasi vs Pagu | Reconciliation dashboard |
| **Validasi Revisi POK** | 12 validator dashboard + Submit | **State machine + audit trail flow** |
| Jasa Medis | Slip gaji + verification files | Multi-categorial file upload + payroll calc |
| Riwayat | devLog viewer | In-app history viewer (rendered Markdown) |
| Settings | Admin config (auth-gated) | Settings UI pattern |

---

## 4. Documentation Outside Repo (Project Knowledge)

Beberapa reference docs disimpan di Project Knowledge (Anthropic Project storage), tidak di repo Git. Kalau SIMRS spoke butuh ini, Owner akan share via upload ke SIMRS spoke chat:

| File (project knowledge) | Apa |
|---|---|
| `Perdirjen-Renhan-No-7-Tahun-2025.md` | Master regulasi POK + Revisi POK |
| `Permenhan_5_2020_*.pdf` | Pengelolaan BMP Kemhan/TNI |
| `KEP-211_PB_2018-*.md`, `KEP-291_PB_2022-*.md`, `KEP-331_PB_2021-*.md` | BAS kodefikasi |
| `07_Penjelasan-Kode-Akun-Standar.md` | Penjelasan kode akun BAS |
| `Laporan-Konsistensi.md` | Audit konsistensi historis |
| `SIKESUMA-Code-Analysis-SSOT.md` | Code analysis SSOT historis |
| `SIKESUMA-Audit-BAS-Konformitas.md` (+ corrigendum) | Audit BAS conformity |
| `REVISI-POK-PAGU-RS-TkIV-Batin-Tikal-*.md` | Contoh real Revisi POK RS Batin Tikal |
| `REKAP_MASUKAN_SIKESUMA_EXTENDED.md` | Masukan ekspansi SIKESUMA |
| `SPRINT-B4-*.md` | Sprint laporan historis (validasi Angga) |

### 4.1 Bagaimana SIMRS Spoke Akses

Owner akan **upload subset** dari project knowledge ke SIMRS spoke session chat sesuai kebutuhan analytical. Tidak ada direct file-share antara project knowledge SIKESUMA dan SIMRS spoke.

---

## 5. Boundary Reminders — Single Source of Coordination

### 5.1 Channel of Communication

**SIMRS spoke session ↔ SIKESUMA repo/database = SATU ARAH (read-only).** Tidak ada loop balik dari SIMRS spoke ke SIKESUMA tanpa lewat Owner.

```
SIMRS spoke session              Owner (dr Ferry)              SIKESUMA AI session
        │                                  │                              │
        │  read SIKESUMA via:              │                              │
        │   - repo clone                   │                              │
        │   - Supabase read-only query     │                              │
        │   - live app browse              │                              │
        │   - this introduction doc        │                              │
        ├─────────────────────────────────►│                              │
        │                                  │                              │
        │  feedback / questions /          │                              │
        │  suggested SIKESUMA changes      │                              │
        │  via Owner brief                 │                              │
        ├─────────────────────────────────►│                              │
        │                                  │  Owner brief ke SIKESUMA     │
        │                                  │  AI session di sesi terpisah │
        │                                  ├─────────────────────────────►│
        │                                  │                              │
        │                                  │                              │  Make change
        │                                  │                              │  (paired commit + push)
        │                                  │                              │
        │                                  │  Owner brief ke SIMRS spoke  │
        │                                  │  kalau perlu                 │
        │  ◄───────────────────────────────┤                              │
```

### 5.2 Kapan Spoke Session Stop & Eskalasi ke Owner

Spoke session **harus stop dan eskalasi** kalau:

- Menemukan bug / inkonsistensi di SIKESUMA codebase / database
- Butuh izin untuk write/modify anything di SIKESUMA
- Menemukan regulatori issue / interpretation conflict
- Schema migration / structural change suggestion untuk SIKESUMA
- Apa pun yang **bukan** pure read + pure adopt-to-SIMRS-BT

### 5.3 Kapan Spoke Session Lanjut Sendiri

Spoke session **OK lanjut** tanpa eskalasi kalau:

- Adopting JSONB envelope pattern ke schema SIMRS BT
- Adopting state machine pattern ke workflow SIMRS BT
- Adopting validator + DI orchestrator pattern ke SIMRS BT modul
- Translating regulatori concept ke SIMRS BT context (e.g. RME compliance equivalent)
- Documenting di SIMRS BT repo (separate dari SIKESUMA repo)

---

## 6. Quick-Start Checklist untuk SIMRS Spoke Session

Saat SIMRS spoke session pertama kali tap into SIKESUMA:

- [ ] Baca `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md` end-to-end (this companion's parent)
- [ ] Baca `docs/REVISI-POK-PAGU-vKoreksi.md` untuk master domain
- [ ] Clone repo, run `git log --oneline -10` untuk lihat recent commit history
- [ ] Owner share Supabase anon JWT → run schema introspection query (§2.3)
- [ ] Browse live app `sikesumav31.vercel.app` ~10 menit untuk visual familiarization
- [ ] Identifikasi 1-2 pattern di SIKESUMA yang directly relevant ke SIMRS BT Phase 2.1 priority
- [ ] Document temuan di repo SIMRS BT (BUKAN edit SIKESUMA docs)
- [ ] Kalau ada question / suggestion → eskalasi ke Owner

---

## 7. Document Lifecycle

### 7.1 Versioning

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 13 Mei 2026 | Initial access doc post Tier 5a MERGED |

### 7.2 Update Triggers

Doc ini di-update saat:

- Supabase credentials pattern change (e.g. read-only role custom dibuat)
- New schema relevant untuk SIMRS BT integration
- New deep-dive paths setelah Tier baru MERGED
- Boundary policy refinement

### 7.3 Ownership

Owner: dr Ferry. Maintained by SIKESUMA AI session.

---

*End of access doc. Parent: `docs/SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md`.*
