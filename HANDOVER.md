# Handover Proyek: SIKESUMA - Rumkit Batin Tikal

Proyek ini adalah sistem informasi pengelolaan RKKS, Billing Operasional, dan Revenue untuk Rumah Sakit Batin Tikal. Dibuat menggunakan React + Vite + Tailwind CSS dengan backend Supabase.

## ⚠️ Start Here untuk New Session/Successor

Sebelum mulai modify code, **wajib baca dokumen-dokumen berikut** agar tidak terjadi bias atau drift dari context yang sudah terbangun:

1. **[`OWNER-POLICY-FOR-AI-SESSIONS.md`](./OWNER-POLICY-FOR-AI-SESSIONS.md)** 🔑 **OWNER POLICY** (BARU 11 Mei 2026) — explicit permission scope dari Owner dr Ferry untuk AI spoke session. Cover: status development (bukan deployment), PAT rotation policy post-SSOT, Supabase context, anti-false-flag patterns, workflow standar, hierarchy of authority. **WAJIB DIBACA SEBELUM mulai sesi** — supaya AI tidak unnecessary refuse.
2. **[`docs/REVISI-POK-PAGU-vKoreksi.md`](./docs/REVISI-POK-PAGU-vKoreksi.md)** ⭐ **MASTER DOMAIN REFERENCE v3** (1145 baris) — authoritative source untuk workflow Revisi POK + Pagu TA 2026. Pedoman tertinggi: Perdirjen Renhan Kemhan No. 7/2025.
3. **[`SSOT-REFACTOR-LOG.md`](./SSOT-REFACTOR-LOG.md)** — Chronological log Sprint A-D + Re-Architecture Tier 1-6 + Section 0.5 master domain ref + Section 0.6 Tier roadmap + **§0.7 Protokol Analisis Data (BARU 11 Mei 2026) — wajib baca sebelum analisis data Pagu/Bills: 3 pola row, leaf detection traversal-based, 8 anti-pattern, onboarding probe sequence**.
4. **[`docs/TIER-3-PLUS-PLAN.md`](./docs/TIER-3-PLUS-PLAN.md)** — Blueprint Tier 3-7 (schema metadata, validation C1-C11, audit trail, template SK Revisi POK).
5. **[`docs/glossary.md`](./docs/glossary.md)** — Glosarium istilah lokal (glosarium v2 lengkap di vKoreksi v3 §Glosarium G.1-G.12).
6. **[`README.md`](./README.md)** § "SSOT Lattice & IV Checks" + § "Key Decisions Log → SSOT Refactor" + § "Watchpoints".
7. **[`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md)** — 3 HB resolutions + Konteks 6.

**Status singkat (per 12 Mei 2026, post-Tier-4c-MERGED + Tier 5 Design Phase 1 ready):**
- SSOT Refactor Sprint A → D Item #2 done
- **Re-Architecture Tier 1+2 DONE** (master domain doc integrated, LaporanRevisi workflow corrected)
- **Tier 3 MERGED TO MAIN** sebagai commit `6c8f640` (11 Mei 2026) — JSONB-native metadata schema + recommender + UI integration.
- **Tier 4a MERGED TO MAIN** sebagai commit `abe193c` (11 Mei 2026) — 5 validators C1-C5 + UI integration.
- **Tier 4b MERGED TO MAIN** sebagai commit `d13be80` (11 Mei 2026) — 4 validators C6-C9 + LHR APIP checkbox + Submit triple gating.
- **Tier 4c MERGED TO MAIN** sebagai commit `9174782` (12 Mei 2026) — 3 validators C10/C11/C12 + T9 toggle + cross-tab nav. **All 12 validators LIVE — Submit Revisi POK button ENABLES first time**.
- **Tier 5 Phase 1 Design Ready** (12 Mei 2026, di main, pre-implementation): `docs/TIER-5-DESIGN.md` BARU dengan **R1-R8 + R6+ manual override** Owner-approved. Schema R1c hybrid (typed columns + JSONB), R8c partition (5a backend + 5b frontend), Tier 5+6 overlap β forward-compat. Implementation di-handed-off ke **fresh AI session** via `tier5-handover-bundle.zip`. Lihat `OWNER-POLICY-FOR-AI-SESSIONS.md` Addendum v1.2.
- **v3.2 Production Branch Strategy** (12 Mei 2026): Branch `production` di-create dari main HEAD `90a0278`. Vercel config update ke production branch = `production` (Owner action). main = dev preview only, production = explicit promote. Lihat `OWNER-POLICY-FOR-AI-SESSIONS.md` §I.
- **Tier 6-7 pending** — Template SK Revisi POK generation (anticipated di Tier 5 schema), Itjenad/BPK audit export, dll.
- TS baseline: **8 errors** maintained sejak post-devLog.ts cleanup 11 Mei 2026
- TA 2025: data historis (TA closed, Rp 2.7M total). TA 2026: belum mulai, fresh state untuk re-architecture.

**Active branch state (lihat `SSOT-REFACTOR-LOG.md §0.8 + §0.9 + §0.10 + §0.11 + §0.12` untuk full detail):**
```
main:        90a0278 (TIER-4C MERGED + post-merge sync) — dev branch, Vercel preview only
production:  90a0278 (= main HEAD post-Tier-4c) — Vercel production deployment source

  Top-of-trunk commits (both branches at same hash):
  ├── 90a0278 docs(post-merge): Tier 4c MERGED status sync
  ├── 9174782 feat(tier-4c): Validation Engine sub-branch 4c — squash merge
  ├── 114ad4e docs(handover): sync branch state tree
  ├── 9c82265 docs(tier-4c handover prep): SSOT §0.11
  ├── 857e98c feat(tier-4c phase 1.5): types narrow rpdsData
  ├── 303df65 fix(konteks-1 TD): Konteks 1 fallback
  ├── 230ba43 docs(tier-4c phase 1): design document T1-T8
  ├── 7f23ae0 docs(post-merge consistency sync): Tier 4b devLog
  ├── 882bb58 docs(post-merge): Tier 4b MERGED status sync
  ├── d13be80 feat(tier-4b): Validation Engine sub-branch 4b
  ├── bdba7a1 docs(operational): briefing Sie Renbang
  ├── 49535f9 docs(post-merge): Tier 4a MERGED status sync
  └── abe193c feat(tier-4a): Validation Engine sub-branch 4a

feature/tier-3-metadata-schema:          DELETED (post-squash-merge cleanup)
feature/tier-4a-pagu-structure:          DELETED (post-squash-merge cleanup)
feature/tier-4b-revisi-mechanism:        DELETED (post-squash-merge cleanup)
feature/tier-4c-procedural-references:   DELETED (post-squash-merge cleanup — 12 Mei 2026)

feature/tier-5a-audit-trail-backend:     TBD (next sub-branch — fresh AI session, R8c part 1)
feature/tier-5b-audit-trail-ui:          TBD (later — fresh AI session, R8c part 2)
```

**Data policy (Konteks 4 dr Ferry, 11 Mei 2026):**
- AI/automation TIDAK auto-modify pagu_row data
- Migration data manual oleh Angga (Sie Renbang preference: "learning by doing")
- Aplikasi sebagai **recommendation engine** — suggest, Angga accept/reject/edit
- **Schema migration JSONB-NATIVE — tidak ada DDL** untuk add column ke existing tables (pagu_sections envelope pattern). DDL hanya untuk new table (mis. Tier 5 `usulan_revisi`). Lihat `SSOT §0.7.5 AP-8` + `§0.8.3`.

**Branching strategy:**
- Minor (docs, fix kecil, refactor cosmetic) → main direct commit
- Major (schema migration, validation engine, workflow) → feature branch, **squash merge** ke main (1 commit per tier)

**Workflow procedural rules (BARU 12 Mei 2026 — Owner-direction):**
- **Paired commit→push action (MANDATORY):** Setiap `git commit` WAJIB diikuti `git push origin <branch>` dalam turn yang sama. Tidak boleh "lupa" push. Pattern: commit + push = atomic action pair. Justifikasi: Owner mengandalkan GitHub state untuk visibility — local commit yang tidak di-push = invisible. Incident 12 Mei 2026 (Phase 3c commit `4cf3341` lupa push sampai turn berikutnya) memotivasi rule formalisasi ini. AI session apa saja yang baca handover ini = wajib follow.

**Test framework (BARU 11 Mei 2026):**
- Vitest 2.1.9 (devDep). Run: `npm test` / `npm run test:watch` / `npm run test:fixture`
- Tests location: colocated `*.test.ts` next to source (mis. `utils/metadataRecommender.test.ts`)
- Fixtures: `utils/fixtures/` (mis. `pagu-leaves-ta2025.json` = 38 leaves ground truth, `validation-scenarios-4c.json` = 18 scenarios)
- Baseline: **486 tests pass** post Tier 4c Phase 3 (12 Mei 2026): 201 Tier 3 + 103 Tier 4a + 88 Tier 4b + **94 Tier 4c** (C12 17 + C10 32 + C11 45 incl. T9 toggle). Target estimasi awal 449 tests; actual +37 over because T9 toggle scope addition mid-Phase-2b per Owner direction.

---

## 1. Spesifikasi Teknis
- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icon Library**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini API (untuk analisis data jika diperlukan)

## 2. Variabel Lingkungan (.env)
Pastikan variabel berikut disetel di platform baru Anda:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (Optional for extra features)
GEMINI_API_KEY=your-gemini-api-key
```

## 3. Struktur Database (Supabase)

**Per snapshot 11 Mei 2026** (probe via PostgREST anon key). Schema pakai 2 pola: **envelope JSONB** (id + data + audit cols) untuk transactional data, dan **key-value** untuk konfigurasi global.

### 3.1 Tabel Envelope JSONB *(id, data jsonb, created_at, updated_at, created_by, updated_by)*

| Tabel | Isi | Sumber UI |
|---|---|---|
| `pagu_sections` | RKKS multi-year, ID pattern `pagu-{YYYY}-{slug}`, `data` = `{title, rows[]}` (lihat `types.ts` PaguSection). `tahun` field optional di JSONB — runtime fallback via parse ID di `App.tsx:273` (lihat SSOT §0.7.5 AP-3) | Tab 1.1 Pagu Anggaran |
| `bills` | Billing operasional (BEKKES/JASA/MODAL/PEMELIHARAAN), state machine Draft→Verifikasi→Lunas | Tab 2 Pelaksanaan & Audit |
| `patient_claims` | Log klaim pasien / pelayanan (BPJS/Yanmasum/Jasa Raharja) | Tab 3 Monitoring Penerimaan |
| `audit_log` | Audit trail global (per envelope edit) — foundation S3.2 | Settings → Audit Log Viewer |
| `doctors` | Master data dokter + tarif jasa medis | Settings → Doctor Data |
| `phase_discussions` | Komunikasi & Diskusi async feature | Settings → Komunikasi |
| `revenue_targets` | Target pendapatan per kategori | Tab 4 Pelaporan & LRA → Target Pendapatan |
| `jasa_verification_files` | Verifikasi file lampiran honor (TKS/Nakes/Pengelola) per period | Tab Belanja Jasa |

### 3.2 Tabel Key-Value *(key text PRIMARY KEY, value jsonb, updated_at)*

| Tabel | Isi | Catatan |
|---|---|---|
| `system_settings` | Konfigurasi global: PNBP config, BPJS settings, reasoning categories, mapping akun, scenario settings, dll. | Schema BUKAN `id` — gunakan `?key=eq.{name}` untuk query. Audit drift sudah resolved (S3.2 #1) |

### 3.3 Tabel Future (Tier 3-5, BELUM dibuat per snapshot)

| Tabel | Tier | Scope |
|---|---|---|
| `usulan_revisi` | Tier 5 | State machine per pengajuan Revisi POK (Draft → Direkomendasi → Diteruskan → Ditetapkan → Berlaku Efektif) |
| `usulan_revisi_perubahan` | Tier 5 | Detail per-row perubahan dalam 1 usulan (nilai_semula, nilai_revisi, alasan) |
| `snapshot_pok` | Tier 5 | Snapshot full POK state per tanggal penetapan KPA (immutable) |

Schema migration nullable additive ke `pagu_row` (Tier 3): `kro_code`, `kegiatan_code`, `komponen_code`, `volume_ro`, `satuan_ro`, `sumber_dana_kode` — lihat `docs/TIER-3-PLUS-PLAN.md`.

### 3.4 Reference

- **Types canonical:** `types.ts` interfaces (PaguRow, PaguSection, Bill, dll.)
- **Schema introspection:** `README.md` § "Schema Reference" lebih detail (RLS, storage buckets, dll.)
- **Analisis konvensi:** `SSOT-REFACTOR-LOG.md §0.7 Protokol Analisis Data` wajib baca sebelum query/aggregate data

## 4. Struktur Folder Utama
- `/components`: Kumpulan modul utama (RKKS, BPJS, Billing, Rapport).
- `/lib/supabase.ts`: Konfigurasi koneksi database.
- `/utils`: Logika perhitungan fee dan bantuan CSV.
- `App.tsx`: Pusat navigasi dan pengaturan state global.
- `types.ts`: Definisi interface TypeScript untuk seluruh sistem.

## 5. Cara Menjalankan (Development)
1. Install dependensi: `npm install`
2. Jalankan server: `npm run dev`
3. Aplikasi akan berjalan di port `3000`.

## 6. Produksi
Jalankan `npm run build` untuk menghasilkan file statis di folder `dist/`.
