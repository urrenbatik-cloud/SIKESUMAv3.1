# Handover Proyek: SIKESUMA - Rumkit Batin Tikal

Proyek ini adalah sistem informasi pengelolaan RKKS, Billing Operasional, dan Revenue untuk Rumah Sakit Batin Tikal. Dibuat menggunakan React + Vite + Tailwind CSS dengan backend Supabase.

## ⚠️ Start Here untuk New Session/Successor

Sebelum mulai modify code, **wajib baca dokumen-dokumen berikut** agar tidak terjadi bias atau drift dari context yang sudah terbangun:

1. **[`SSOT-REFACTOR-LOG.md`](./SSOT-REFACTOR-LOG.md)** — Chronological log Sprint A-D + 7 critical caveats untuk successor (HB#1/2/3, Konteks 1-9 Angga, dummy 2024 keep, ATK=521811, Honor annual, effective value formula mandate, dll). **PALING PENTING.**
2. **[`docs/glossary.md`](./docs/glossary.md)** — Glosarium istilah lokal RS Batin Tikal (BMP/BMHP/TKS/Nakes/Alsintor/Alkes/Alsatri/POK/dll) + konvensi subkode `.A`/`.B`/`.C` khusus Pengadaan + daftar kode BAS tidak dipakai.
3. **[`README.md`](./README.md)** § "SSOT Lattice & IV Checks" + § "Key Decisions Log → SSOT Refactor" + § "Watchpoints" — context arsitektur + decisions log.
4. **[`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md)** — 3 hard blockers resolution + Konteks 6.

**Status singkat (per 11 Mei 2026):** SSOT Refactor Sprint A-D Item #1 done. Total Pagu TA 2025: Rp 2,709,935,000.40 (verified UI = DB). Sprint D Item #2+ dan Sprint E pending.

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
