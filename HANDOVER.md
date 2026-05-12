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

**Status singkat (per 13 Mei 2026, post Tier 5a MERGED TO MAIN):**
- SSOT Refactor Sprint A → D Item #2 done
- **Re-Architecture Tier 1+2 DONE** (master domain doc integrated, LaporanRevisi workflow corrected)
- **Tier 3 MERGED TO MAIN** sebagai commit `6c8f640` (11 Mei 2026) — JSONB-native metadata schema + recommender + UI integration.
- **Tier 4a MERGED TO MAIN** sebagai commit `abe193c` (11 Mei 2026) — 5 validators C1-C5 + UI integration.
- **Tier 4b MERGED TO MAIN** sebagai commit `d13be80` (11 Mei 2026) — 4 validators C6-C9 + LHR APIP checkbox + Submit triple gating.
- **Tier 4c MERGED TO MAIN** sebagai commit `9174782` (12 Mei 2026) — 3 validators C10/C11/C12 + T9 toggle + cross-tab nav. **All 12 validators LIVE — Submit Revisi POK button ENABLES first time**.
- **Tier 5 Phase 1 Design Ready** (12 Mei 2026, commit `535085f` di main): `docs/TIER-5-DESIGN.md` dengan **R1-R8 + R6+ manual override** Owner-approved. Schema R1c hybrid, R8c partition (5a backend + 5b frontend), Tier 5+6 overlap β forward-compat.
- **🎉 Tier 5a MERGED TO MAIN** sebagai commit `d55f0d0` (13 Mei 2026) — audit trail backend full stack: 3 tables LIVE di Supabase (Phase 1.5 `b834415`) + types + state machine (Phase 2.1+2.2 `8ad4e40`) + service layer (Phase 2.3 `4990059`) + Submit flow UI integration (Phase 2.4 `958e426`) + LHR APIP R3c migration + Banner V1 (Phase 2.5 `93d9155`). Owner E2E test PASSED 13 Mei 2026 (4-check smoke: banner toggle / persisted state / uncheck persist / tied audit Submit). Test baseline 486 → **610 pass** (+124). TS 8/8 maintained. Feature branch `feature/tier-5a-audit-trail-backend` DELETED post-merge cleanup. Lihat squash commit message `d55f0d0` untuk full scope + SSOT-REFACTOR-LOG.md §0.12.7-§0.12.13 untuk execution logs per phase.
- **🚧 Production promotion** PENDING (separate decision, Owner-driven): `main → production` merge via Vercel Dashboard "Promote to Production" atau git push. Production `sikesumav31.vercel.app` saat ini masih di `90a0278` (Tier 4c). Promotion = trigger field rollout ke Sie Renbang aktual.
- **v3.2 Production Branch Strategy** (12 Mei 2026): ✅ **OPERATIONAL** — Vercel `Settings → Environments` (UI baru, replace lama `Settings → Git → Production Branch`) menunjukkan **Production environment tracking branch = `production`**. main = Preview environment, all unassigned branches = Preview. Foundation finding #2 (switch pending) → CLOSED 12 Mei 2026 via Owner screenshot verification. Lihat `OWNER-POLICY-FOR-AI-SESSIONS.md` Addendum v1.3.
- **Tier 5b** (UI tab audit trail viewer, R8c partition 2): TBD — fresh AI session setelah production stable + Sie Renbang field feedback.
- **Tier 6-7 pending** — Template SK Revisi POK generation (anticipated di Tier 5 schema, β forward-compat via `template_sk_metadata` field di `UsulanRevisiData`), Itjenad/BPK audit export, dll.
- TS baseline: **8 errors** maintained sejak post-devLog.ts cleanup 11 Mei 2026
- TA 2025: data historis (TA closed, Rp 2.7M total). TA 2026: belum mulai, fresh state untuk re-architecture.

**Active branch state (lihat `SSOT-REFACTOR-LOG.md §0.8 + §0.9 + §0.10 + §0.11 + §0.12` untuk full detail):**
```
main:        d55f0d0 (Tier 5a MERGED 13 Mei 2026, 2 commits ahead of production) — dev branch, Vercel preview only
production:  90a0278 (Tier 4c MERGED state) — Vercel production deployment source

  Top-of-trunk commits (main):
  ├── d55f0d0 feat(tier-5a): Audit Trail Backend Complete — 3 tables LIVE + state machine + service layer + Submit flow + LHR APIP R3c (13 Mei 2026)
  ├── 535085f docs(tier-5 phase 1): design ready + handover prep + v3.2 strategy + OWNER-POLICY v1.2
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
feature/tier-5a-audit-trail-backend:     DELETED (post-squash-merge cleanup — 13 Mei 2026, merged via d55f0d0)

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
- Baseline: **598 tests pass** post Tier 5a Phase 2.4 Submit flow UI integration (12 Mei 2026): 573 post Phase 2 backend + **25 Phase 2.4** (8 collectChangedRowsWithSection + 4 summarizeChangedRows + 13 executeSubmitRevisiPOK orchestrator coverage). 486 prior baseline + **87 Phase 2 backend** (46 state machine `utils/usulanRevisiStateMachine.test.ts` + 41 service layer `services/usulanRevisiService.test.ts`). Sebelum Phase 2: 201 Tier 3 + 103 Tier 4a + 88 Tier 4b + 94 Tier 4c (C12 17 + C10 32 + C11 45 incl. T9 toggle).

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

### 3.3 Tabel Tier 5 LIVE *(R1c hybrid: columned status/tahun/jenis + JSONB data; LIVE sejak Phase 1.5, 12 Mei 2026)*

| Tabel | Tier | Scope | Schema |
|---|---|---|---|
| `usulan_revisi` | Tier 5a | State machine per pengajuan Revisi POK (Draft → Direkomendasi → Diteruskan → Ditetapkan → Berlaku Efektif) | 7 cols (id, status, tahun_anggaran, jenis, data JSONB, created_at, updated_at). Types di `types.ts` `UsulanRevisi` + `UsulanRevisiData` (Phase 2.1) |
| `usulan_revisi_perubahan` | Tier 5a | Detail per-row perubahan dalam 1 usulan (nilai_semula, nilai_revisi, alasan) | 5 cols (id, usulan_id FK, pagu_row_id, data JSONB, created_at). Types di `types.ts` `UsulanRevisiPerubahan` |
| `snapshot_pok` | Tier 5a | Snapshot full POK state per tanggal penetapan KPA (R2b, R7c immutable via DB trigger + app no-UPDATE) | 6 cols (id, tahun_anggaran, tanggal_efektif, usulan_id FK, **snapshot_data** JSONB bukan `data`, created_at). Types di `types.ts` `SnapshotPok` |

**Status komponen Tier 5a:**
- ✅ DDL (Phase 1.5, 12 Mei 2026): 3 tabel + 7 indexes + 10 RLS policies + R7c trigger LIVE
- ✅ Types (Phase 2.1, 12 Mei 2026): Appended ke root `types.ts` per Owner preference
- ✅ State machine (Phase 2.2): `utils/usulanRevisiStateMachine.ts` — 6 rules + R6+ override
- ✅ Service layer (Phase 2.3): `services/usulanRevisiService.ts` — 11 functions CRUD, NO `updateSnapshot` (R7c defense)
- ✅ Submit flow integration (Phase 2.4, 12 Mei 2026): wire via DI orchestrator pattern (commit `958e426`)
- ✅ LHR APIP R3c migration (Phase 2.5, 13 Mei 2026): persist global state di `system_settings.lhr_apip_global`, tied audit di `usulan_revisi.data.lhr_apip`, banner V1 UI text-only (commit `93d9155`). Strategy A (V1 minimal) — forward-compat ke Strategy B richer audit di V2.
- ⏳ Owner E2E test di Vercel Preview URL (Phase 3): pending Owner manual smoke test (toggle checkbox + browser refresh + Submit flow verification)
- ⏳ Squash merge `feature/tier-5a-audit-trail-backend → main` (Phase 4): gated by Owner approval Phase 3

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
