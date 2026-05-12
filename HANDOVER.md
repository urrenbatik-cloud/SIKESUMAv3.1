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

**Status singkat (per 12 Mei 2026, post-Tier-4c-Phase-3):**
- SSOT Refactor Sprint A → D Item #2 done
- **Re-Architecture Tier 1+2 DONE** (master domain doc integrated, LaporanRevisi workflow corrected)
- **Tier 3 MERGED TO MAIN** sebagai commit `6c8f640` (11 Mei 2026) — JSONB-native metadata schema + recommender + UI integration. Owner-tested + verified. 92.1% high confidence acceptance, 201 Vitest tests pass. Lihat `SSOT-REFACTOR-LOG.md §0.8`.
- **Tier 4a MERGED TO MAIN** sebagai commit `abe193c` (11 Mei 2026) — Validation Engine sub-branch 4a: 5 validators (C1-C5) + UI integration full (dashboard "1.5 Validasi Revisi POK" + 12-card grid + inline indicators + bidirectional navigation + row-level scroll/highlight). Feature branch dihapus post-merge cleanup. Lihat `SSOT-REFACTOR-LOG.md §0.9` + `docs/TIER-4-DESIGN.md` + `docs/TIER-4A-PHASE-3-UI-DESIGN.md`.
- **Tier 4b MERGED TO MAIN** sebagai commit `d13be80` (11 Mei 2026) — Validation Engine sub-branch 4b: 4 validators (C6 Jenis Belanja, C7 Sumber Dana, C8 LHR APIP, C9 Akun Minus) + UI integration full (cards C6-C9 live + LHR APIP checkbox NEW UX + Submit button triple gating). Plus C1 violation message UX enhancement batched (DIPA Hal III pathway guidance). Feature branch dihapus post-merge cleanup. **392 tests pass** (201 Tier 3 + 103 Tier 4a + 88 Tier 4b). Lihat `SSOT-REFACTOR-LOG.md §0.10` + `docs/TIER-4B-DESIGN.md` + `docs/TIER-4B-PHASE-3-UI-DESIGN.md`.
- **Tier 4c Foundation Phase COMPLETE** (11 Mei 2026, di main, pre-implementation): Design doc `230ba43` + Konteks 1 TD fix `303df65` + Phase 1.5 types narrow `857e98c` + governance docs sync `9c82265`. Owner approve all T1-T8 defaults. Implementation split ke fresh AI session per Owner session-split policy.
- **Tier 4c Phase 2 + Phase 3 COMPLETE** (12 Mei 2026, di feature branch, pre-merge): Implementation work selesai di `feature/tier-4c-procedural-references`. **9 commits ahead** of main `9c82265`. Phase 2a fixture + Phase 2b Turn 1-4 (C12 + C10 + C11 + T9 toggle BARU) + Phase 3a-c (design + cards live + nav refactor + UI toggle). **486 tests pass** (392 baseline + 94 Tier 4c). TS 8 maintained. All 12 validators LIVE. Submit button finally ENABLES. Ready Phase 4 (Owner Vercel preview E2E test → squash merge). Lihat `SSOT-REFACTOR-LOG.md §0.11.1a T9 BARU` + `docs/TIER-4C-PHASE-3-UI-DESIGN.md`.
- **Tier 5-6 pending** — `feature/tier-5-audit-trail` (later, butuh Owner DDL action untuk CREATE TABLE usulan_revisi).
- TS baseline: **8 errors** maintained sejak post-devLog.ts cleanup 11 Mei 2026
- TA 2025: data historis (TA closed, Rp 2.7M total). TA 2026: belum mulai, fresh state untuk re-architecture.

**Active branch state (lihat `SSOT-REFACTOR-LOG.md §0.8 + §0.9 + §0.10 + §0.11` untuk full detail):**
```
main:                                    9c82265 (TIER-4C FOUNDATION COMPLETE)
  ├── 9c82265 docs(tier-4c handover prep): SSOT §0.11 + governance + devLog + anti-drift triple-source sync
  ├── 857e98c feat(tier-4c phase 1.5): types narrow rpdsData unknown[] → RPDSection[]
  ├── 303df65 fix(konteks-1 TD): UI display jumlahBiayaRevisi pakai Konteks 1 fallback semantic
  ├── 230ba43 docs(tier-4c phase 1): draft design document — C10/C11/C12 + Konteks 1 TD + decisions T1-T8
  ├── 7f23ae0 docs(post-merge consistency sync): devLog Phase 4 milestone + SSOT §0.10 final state
  ├── 882bb58 docs(post-merge): Tier 4b MERGED status sync — HANDOVER + README + SESSION-START-HERE
  ├── d13be80 feat(tier-4b): Validation Engine sub-branch 4b — C6-C9 + UI Integration
  ├── bdba7a1 docs(operational): briefing input data TA 2026 untuk Sie Renbang
  ├── 49535f9 docs(post-merge): Tier 4a MERGED status sync — HANDOVER + README + SESSION-START-HERE
  └── abe193c feat(tier-4a): Validation Engine sub-branch 4a — C1-C5 + UI Integration

feature/tier-4c-procedural-references:   (12 Mei 2026, +9 commits ahead of main, ready Phase 4 merge)
  ├── (this commit) docs(tier-4c phase 3d): docs sync — SSOT T9 + devLog + HANDOVER + README + SESSION-START-HERE
  ├── 4cf3341 feat(tier-4c phase 3c): cross-tab nav refactor + C11 toggle UI absorbed
  ├── c440b29 feat(tier-4c phase 3b): cards C10/C11/C12 LIVE + ValidationContext wiring
  ├── 0e8853d docs(tier-4c phase 3a): UI integration design delta brief — D1+D2+D3 plan
  ├── cb0435e feat(tier-4c phase 2b turn 4): C11 toggle architecture (T9 — permisif/ketat strategy)
  ├── edc8f15 feat(tier-4c phase 2b turn 3): C11 RPD validator + 35 tests (CROSS-TABLE)
  ├── e4f1405 feat(tier-4c phase 2b turn 2): C10 SBM/SBK validator + 32 tests (FIRST warn severity)
  ├── 1315914 feat(tier-4c phase 2b turn 1): C12 Deadline validator + 17 tests
  ├── 7a1582e feat(tier-4c phase 2a): fixture validation-scenarios-4c.json — 16 skenario C10/C11/C12
  └── 114ad4e docs(handover): sync branch state tree dengan main HEAD post Tier 4c foundation

feature/tier-3-metadata-schema:          DELETED (post-squash-merge cleanup)
feature/tier-4a-pagu-structure:          DELETED (post-squash-merge cleanup — 11 Mei 2026)
feature/tier-4b-revisi-mechanism:        DELETED (post-squash-merge cleanup — 11 Mei 2026)

feature/tier-5-audit-trail:              TBD (later — butuh Owner DDL untuk CREATE TABLE usulan_revisi)
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
