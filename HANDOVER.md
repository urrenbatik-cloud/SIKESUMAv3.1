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

**Status singkat (per 11 Mei 2026, post-Tier-4a-foundation):**
- SSOT Refactor Sprint A → D Item #2 done
- **Re-Architecture Tier 1+2 DONE** (master domain doc integrated, LaporanRevisi workflow corrected)
- **Tier 3 MERGED TO MAIN** sebagai commit `6c8f640` (11 Mei 2026) — JSONB-native metadata schema + recommender + UI integration. Owner-tested + verified. 92.1% high confidence acceptance, 201 Vitest tests pass. Lihat `SSOT-REFACTOR-LOG.md §0.8`.
- **Tier 4a Phase 3 COMPLETE** di `feature/tier-4a-pagu-structure` — semua 5 validators (C1-C5) + UI integration full (dashboard tab "1.5 Validasi Revisi POK" + 12-card grid + inline indicators di Pagu Anggaran + bidirectional Pagu↔Validasi navigation + row-level scroll/highlight). **304 total tests pass** (201 Tier 3 + 103 Tier 4a). Ready Phase 4 (Owner E2E test → squash merge ke main). Lihat `SSOT-REFACTOR-LOG.md §0.9` + `docs/TIER-4-DESIGN.md` + `docs/TIER-4A-PHASE-3-UI-DESIGN.md`.
- **Tier 4b/4c pending** — `feature/tier-4b-revisi-mechanism` (C6-C9) + `feature/tier-4c-procedural-references` (C10-C12), sequential setelah 4a merged.
- **Tier 5-6 pending** — `feature/tier-5-audit-trail` (later, butuh Owner DDL action untuk CREATE TABLE usulan_revisi).
- TS baseline: **8 errors** (turun dari 11 post-devLog.ts cleanup 11 Mei 2026)
- TA 2025: data historis (TA closed, Rp 2.7M total). TA 2026: belum mulai, fresh state untuk re-architecture.

**Active branch state (lihat `SSOT-REFACTOR-LOG.md §0.8 + §0.9` untuk full detail):**
```
main:                                    6922508 (SESSION-START-HERE.md anti-drift)
  ├── 6922508 docs(handover): SESSION-START-HERE.md
  ├── 05335f5 docs(post-compaction sync): SSOT §0.9 + devLog + TS 11→8
  ├── 32bb1d7 docs(tier-4): TIER-4-DESIGN.md
  ├── 73c7afb docs(post-merge): Tier 3 status sync
  └── 6c8f640 feat(tier-3): metadata schema squashed merge

feature/tier-3-metadata-schema:          DELETED (post-squash-merge cleanup)
feature/tier-4a-pagu-structure:          (13+ commits ahead of main, Phase 3 COMPLETE — ready squash merge)
  ├── (HEAD) feat phase 3d wiring polish: row-level scroll/highlight + nav wire
  ├── 2246b3c feat phase 3c: inline validation indicators di Pagu Anggaran
  ├── 25adbd5 feat phase 3b: Validasi Revisi POK dashboard tab + 12-card grid
  ├── 9c836b8 docs phase 3a: UI design draft (421 lines)
  ├── 9daac90 docs handover sync: Phase 2b COMPLETE
  ├── e76284a docs(ssot §0.9): batch update post Phase 2b + R4 fix (5→8 akun)
  ├── 86fff4c feat phase 2b Turn 4: C5 + helpers.collectAllLeaves + 24 tests
  ├── ab83c06 feat phase 2b Turn 3: C2 + 27 tests (Pergeseran 1 KRO)
  ├── f7ccfc3 docs(ssot §0.9): R1-R5 decisions + Turn 2 status sync
  ├── f94b27f merge(state-sync): bring main into feature pre-Turn 3
  ├── a5e9d0b feat phase 2b Turn 2: C3 + helpers extraction + 20 tests
  ├── 52ed3a3 feat phase 2b: C1 + C4 + 32 tests (partial Q3)
  ├── ed4650b feat phase 2a: 13 fixture scenarios
  └── 4191915 feat phase 1: types + 12 constraint specs catalogue

feature/tier-4b-revisi-mechanism:        TBD (next setelah 4a squash merge)
feature/tier-4c-procedural-references:   TBD (later)
```

**Data policy (Konteks 4 dr Ferry, 11 Mei 2026):**
- AI/automation TIDAK auto-modify pagu_row data
- Migration data manual oleh Angga (Sie Renbang preference: "learning by doing")
- Aplikasi sebagai **recommendation engine** — suggest, Angga accept/reject/edit
- **Schema migration JSONB-NATIVE — tidak ada DDL** untuk add column ke existing tables (pagu_sections envelope pattern). DDL hanya untuk new table (mis. Tier 5 `usulan_revisi`). Lihat `SSOT §0.7.5 AP-8` + `§0.8.3`.

**Branching strategy:**
- Minor (docs, fix kecil, refactor cosmetic) → main direct commit
- Major (schema migration, validation engine, workflow) → feature branch, **squash merge** ke main (1 commit per tier)

**Test framework (BARU 11 Mei 2026):**
- Vitest 2.1.9 (devDep). Run: `npm test` / `npm run test:watch` / `npm run test:fixture`
- Tests location: colocated `*.test.ts` next to source (mis. `utils/metadataRecommender.test.ts`)
- Fixtures: `utils/fixtures/` (mis. `pagu-leaves-ta2025.json` = 38 leaves ground truth)
- Baseline: **304 tests pass** post-Phase 2b complete (201 Tier 3 + 103 Tier 4a: C1 24 + C2 27 + C3 20 + C4 8 + C5 24)

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
