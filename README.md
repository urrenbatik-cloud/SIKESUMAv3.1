# SIKESUMA — RKKS Digital RS Tk.IV 02.07.03 Batin Tikal

**Sistem Informasi Keuangan & Manajemen Rumah Sakit** — aplikasi web operasional untuk Rumah Sakit Tingkat IV 02.07.03 Batin Tikal (TNI AD), dikelola oleh Sie Renbang.

**Live:** [https://sikesumav31.vercel.app](https://sikesumav31.vercel.app)
**Version:** v3.1 (Phase 2 complete — production-ready)
**Tech Stack:** React 19 + Vite + TypeScript + Supabase + Vercel

---

## Overview

SIKESUMA digunakan untuk mengelola siklus keuangan + operasional RS:

- **RKKS (Rencana Kerja Kegiatan Satker)** multi-tahun: Pagu Anggaran, RPD (Rencana Penarikan Dana), RAB Narrative
- **Belanja & Tagihan** — bills tracking dengan 4 kategori (BEKKES, LAINNYA, JASA_DR, JASA_PEGAWAI)
- **Klaim BPJS** — patient claims dengan 5 fee scenarios (A/B/D/E/F) + multi-doctor team distribution
- **Jasa Medis** — payroll dokter & paramedis dengan time-versioned BPJS settings (3 periods)
- **Pelaporan LRA** (Laporan Realisasi Anggaran) — Pagu → RPD → Pelaksanaan → Pelaporan pipeline
- **Berkas Verifikasi** — file storage untuk dokumen pendukung (PDF/PNG/JPEG)

Aplikasi ini battle-tested di RS Batin Tikal dan di-design sebagai template yang reusable untuk RS TNI AD lainnya.

---

## Architecture Highlights

### Multi-Year Data Partition (F2.0)

State `dataByYear: Record<number, PaguSection[]>` partition data berdasarkan id pattern `pagu-{year}-{slug}`. User switch tahun di dropdown → load year-specific data tanpa cross-corruption antar tahun.

```
pagu-2024-jasa  →  dataByYear[2024]
pagu-2025-jasa  →  dataByYear[2025]
pagu-2026-jasa  →  dataByYear[2026]
pagu-2027-jasa  →  dataByYear[2027]
```

Bills, claims, revenue/specialty targets juga year-aware via JSONB field filter (`tanggal`, `tahun`).

### Pure Envelope JSONB Schema

Semua 9 tabel transactional pakai pattern konsisten:

```sql
{ id text PRIMARY KEY, data jsonb NOT NULL, created_at, updated_at, created_by, updated_by }
```

Title, rows, year, semua fields rich entity disimpan di kolom `data` JSONB. Kolom `id` carries semantic meaning (year, period, sequence).

### File Storage via Supabase Storage (F2.2)

Bucket `jasa-verification` (public, 10 MB limit, PDF/PNG/JPEG only):

```
jasa-verification/
  {periodKey}/                    ← e.g., 2025-05 (zero-padded)
    {category}/                   ← tks | nakes | pengelola
      {uuid}-{sanitized-filename}
```

DB metadata di `jasa_verification_files` table (1 row per period). Auto-cleanup ghost rows via syncToCloud (F2.2 v2.1).

### Toast UI (F2.4)

Imperative API tanpa external library:

```typescript
import { toast } from './components/Toast';

toast.success('Sinkronisasi berhasil');
toast.error('Sync gagal di pagu_sections', 6000);
toast.warning('Beberapa data gagal dimuat');
toast.info('Loading...');
```

4 types (success/error/warning/info), auto-dismiss + manual close, stacks vertically, match v3.1 design.

### Validation Rigor (F2.4)

- Granular per-entity try-catch di `loadData` — 1 entity fail tidak block others
- `currentEntity` tracker di `syncToCloud` — error message punya specific context (e.g., "Sync gagal di patient_claims: ...")
- Optional chaining + fallbacks untuk schema drift detection
- Client-side file validation (size + MIME) sebelum Storage upload

---

## Schema Reference

### Database (Supabase project `qjijsftbytozcoyrtric`)

| Table | Purpose | ID Pattern |
|---|---|---|
| `pagu_sections` | Pagu anggaran per kategori per tahun | `pagu-{year}-{slug}` |
| `bills` | Tagihan operasional | `bill-{year}-{seq}` |
| `patient_claims` | Klaim BPJS | `claim-{year}-{seq}` |
| `doctors` | Master data dokter | `dr-{seq}` |
| `employees` | Master data pegawai | `emp-{seq}` |
| `revenue_targets` | Target pendapatan per kategori | `rt-{year}-{kat}` |
| `specialty_targets` | Target per spesialisasi | `st-{year}-{spes}` |
| `jasa_verification_files` | Metadata berkas verifikasi (binary di Storage) | `jvf-YYYY-MM` |
| `system_settings` | KV settings (jasa_map, bpjs_history, pagu_lock) | key (text PK) |
| `payroll_statuses` | Status payroll (Lunas/Belum Lunas) | `YYYY-MM-personId` |

### Storage

| Bucket | Public | Limit | MIME |
|---|---|---|---|
| `jasa-verification` | Yes (Phase 2) | 10 MB | PDF, PNG, JPEG |

---

## Local Development Setup

### Prerequisites

- **Node.js** 18+
- **npm** atau yarn
- **Git** + akses ke repo `urrenbatik-cloud/SIKESUMAv3.1`
- **Supabase project** access (kalau butuh write access ke DB)

### Setup Steps

1. **Clone repo:**
   ```bash
   git clone https://github.com/urrenbatik-cloud/SIKESUMAv3.1.git
   cd SIKESUMAv3.1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables** — buat `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://qjijsftbytozcoyrtric.supabase.co
   VITE_SUPABASE_ANON_KEY=<public-anon-key>
   ```

   `VITE_SUPABASE_URL` ada default fallback di `lib/supabase.ts`, tapi `VITE_SUPABASE_ANON_KEY` wajib di-set untuk RLS authentication.

4. **Run dev server:**
   ```bash
   npm run dev
   ```
   App akan berjalan di `http://localhost:5173` (Vite default).

### Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (HMR enabled) |
| `npm run build` | Production build → `dist/` folder |
| `npm run preview` | Preview production build locally |

---

## Deployment

### Auto-Deploy via Vercel

Repository `urrenbatik-cloud/SIKESUMAv3.1` connected ke Vercel project `sikesumav31`:

1. Push commit ke branch `main` di GitHub
2. Vercel auto-trigger build (~1-2 menit)
3. Deploy ke production URL `sikesumav31.vercel.app`

### Manual Deployment

```bash
npm run build
# Upload dist/ ke hosting pilihan
```

### Database Migrations

Schema changes via Supabase SQL Editor. Convention:

- Diagnostic SQL dulu (verify state)
- Backup destructive ops (JSONB inline ke `system_settings`)
- Atomic transaction `BEGIN ... COMMIT`
- Verify post-migration

---

## Project Structure

```
SIKESUMAv3.1/
├── App.tsx                      # Root component + state + sync logic (~720 lines)
├── components/
│   ├── BPJSModule.tsx           # Tab BPJS (claims + settings)
│   ├── BpjsSettingsForm.tsx     # Time-versioned BPJS fee settings
│   ├── PaguAnggaran.tsx         # Pagu editor (multi-year)
│   ├── PayrollSummary.tsx       # Daftar Gaji + payroll status
│   ├── ServiceBillRecap.tsx     # Rekapitulasi tagihan jasa + file upload
│   ├── Toast.tsx                # Toast UI (imperative API)
│   └── ...
├── lib/
│   └── supabase.ts              # Supabase client + envelope JSONB helpers
├── utils/
│   └── feeCalculation.ts        # BPJS fee logic (5 scenarios)
├── constants/                   # DUMMY data + initial state values
├── types.ts                     # TypeScript interfaces
└── package.json
```

---

## Documentation

- [`SIKESUMA-AUDIT-HANDOVER-v1_4.md`](./SIKESUMA-AUDIT-HANDOVER-v1_4.md) — comprehensive handover doc untuk successor team
- [`PHASE_3_HARDENING_BACKLOG.md`](./PHASE_3_HARDENING_BACKLOG.md) — backlog untuk Phase 3 (security + audit + scale)
- [`STEP2_COMPLETION_ROADMAP_v3_1_v2.md`](./STEP2_COMPLETION_ROADMAP_v3_1_v2.md) — Step 2 completion roadmap

---

## Phase Progress

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Complete | v3.1 baseline + Vite scaffold |
| Phase 2 (Step 1) | ✅ Complete | Schema audit + RLS setup |
| Phase 2 (Step 2 v2) | ✅ Complete | 4 sequences (consolidate + multi-year + file storage + validation rigor) |
| Phase 3 | 🔜 Backlog | Security hardening (RLS role-based, audit log, encryption, monitoring) |
| Step 3 | 🔜 Future | Sikesuma_ketujuh integration |
| Step 4 | 🔜 Future | Multi-RS template deploy |

---

## Key Decisions Log

- **Schema strategy:** Pure envelope JSONB (Q1 — Sequence 1)
- **Multi-year storage:** Year-aware id pattern `pagu-{year}-{slug}` (Q4 — Sequence 2 F2.0)
- **payroll_statuses:** Separate table dengan zero-padded keys (Q3 — Sequence 2 F2.1)
- **File storage:** Supabase Storage bucket public + public URL (Sequence 3 F2.2)
- **Toast UI:** Built-in component, no external library, imperative API (Sequence 3 F2.4)
- **DUMMY constants:** Keep as initial state fallback untuk smooth UX (Sequence 4 F3.1)
- **RLS pattern:** Phase 2 = "Enable all access for all users" → Phase 3 tighten to role-based (deferred F3.5)

---

## Watchpoints (Resolved)

| # | Issue | Status | Closed In |
|---|---|---|---|
| v1.0 #4 | No-op handler di pagu lock toggle | ✅ Closed | Sequence 1 |
| v1.0 #6 | Payroll status key NOT zero-padded | ✅ Closed | Sequence 2 (F2.1) |
| v1.0 #6 #2 | periodKey ServiceBillRecap NOT zero-padded | ✅ Closed | Sequence 3 (F2.2) |

---

## Contributing

Project saat ini di-maintain oleh Sie Renbang RS Batin Tikal. Untuk bug reports atau feature requests:

1. Buat issue di GitHub repository
2. Atau hubungi maintainer langsung via channel internal

Pattern workflow successor sessions: outline-first, diagnostic-first SQL, atomic transaction, smoke test live setiap milestone, file versioning preserve.

---

## License

Internal use untuk RS TNI AD. Tidak untuk distribusi publik tanpa izin.

---

## Acknowledgments

- TNI AD Pusat — sponsorship & infrastructure
- Sie Renbang RS Batin Tikal — domain expertise & product feedback
- Anthropic Claude — AI pair programming sessions untuk migration + hardening (Step 1, Step 2 v1, Step 2 v2 Sequence 1-4)

---

*Last updated: 7 Mei 2026 (Sequence 4 — Step 2 v2 final).*
