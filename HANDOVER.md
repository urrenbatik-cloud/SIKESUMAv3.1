# Handover Proyek: SIKESUMA - Rumkit Batin Tikal

Proyek ini adalah sistem informasi pengelolaan RKKS, Billing Operasional, dan Revenue untuk Rumah Sakit Batin Tikal. Dibuat menggunakan React + Vite + Tailwind CSS dengan backend Supabase.

## ⚠️ Start Here untuk New Session/Successor

Sebelum mulai modify code, **wajib baca dokumen-dokumen berikut** agar tidak terjadi bias atau drift dari context yang sudah terbangun:

1. **[`docs/REVISI-POK-PAGU-vKoreksi.md`](./docs/REVISI-POK-PAGU-vKoreksi.md)** ⭐ **MASTER DOMAIN REFERENCE** (614 baris, vKoreksi v2, 11 Mei 2026) — authoritative source untuk semua workflow Revisi POK + Revisi Pagu TA 2026. Berisi glosarium 12 sub-section + dasar hukum lengkap (PMK 62/2023, 107/2024, 199/2021, Permenhan 5/2020) + 10 hard constraints (C1-C10) + workflow KPA + hard deadline tahunan. **WAJIB DIBACA PERTAMA** untuk new session.
2. **[`SSOT-REFACTOR-LOG.md`](./SSOT-REFACTOR-LOG.md)** — Chronological log Sprint A-D + Re-Architecture Tier 1-6 + Section 0.5 master domain ref + Section 0.6 Tier roadmap. Termasuk 7 critical caveats untuk successor (HB#1/2/3, Konteks 1-9 Angga, dummy 2024 keep, ATK=521811, Honor annual, effective value formula mandate, dll).
3. **[`docs/glossary.md`](./docs/glossary.md)** — Glosarium istilah lokal RS Batin Tikal (BMP/BMHP/TKS/Nakes/Alsintor/Alkes/Alsatri/POK/dll). **Catatan:** glosarium v2 lebih lengkap ada di `docs/REVISI-POK-PAGU-vKoreksi.md` §Glosarium G.1-G.12.
4. **[`README.md`](./README.md)** § "SSOT Lattice & IV Checks" + § "Key Decisions Log → SSOT Refactor" + § "Watchpoints" — context arsitektur + decisions log.
5. **[`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md)** — 3 hard blockers resolution + Konteks 6.

**Status singkat (per 11 Mei 2026):**
- SSOT Refactor Sprint A → D Item #2 done
- **Re-Architecture Tier 1+2 DONE** (master domain doc integrated, LaporanRevisi workflow corrected)
- **Tier 3+ pending (fresh session)** — feature branches: `feature/tier-3-metadata-schema`, `feature/tier-4-validation-c1-c10`, `feature/tier-5-audit-trail`
- TA 2025: data historis (TA closed, Rp 2.7M total). TA 2026: belum mulai, fresh state untuk re-architecture.

**Data policy (Konteks 4 dr Ferry, 11 Mei 2026):**
- AI/automation TIDAK auto-modify pagu_row data
- Migration data manual oleh Angga (Sie Renbang preference: "learning by doing")
- Aplikasi sebagai **recommendation engine** — suggest, Angga accept/reject/edit
- Schema migration ADD COLUMN dengan DEFAULT NULL (nullable, no data change)

**Branching strategy:**
- Minor (docs, fix kecil, refactor cosmetic) → main direct commit
- Major (schema migration, validation engine, workflow) → feature branch, squash merge ke main

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
Aplikasi ini mengharapkan tabel-tabel berikut ada di Supabase:
- `pagu_sections`: Menyimpan data Rencana Kerja dan Anggaran (RKKS).
- `bills`: Menyimpan data billing operasional.
- `patient_claims`: Menyimpan data klaim pasien/log pelayanan.
- `system_settings`: Menyimpan konfigurasi global (mapping akun, kunci pagu, dll).

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
