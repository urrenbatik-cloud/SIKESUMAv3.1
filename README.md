# SIKESUMA — RKKS Digital RS Tk.IV 02.07.03 Batin Tikal

**Sistem Informasi Keuangan & Manajemen Rumah Sakit** — aplikasi web operasional untuk Rumah Sakit Tingkat IV 02.07.03 Batin Tikal (TNI AD), dikelola oleh Sie Renbang.

**Live:** [https://sikesumav31.vercel.app](https://sikesumav31.vercel.app)
**Version:** v3.1 (Step 5 Phase 5.6 — Decision Support Module COMPLETE)
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
- **Audit Trail** — automatic logging setiap CRUD ke audit_log dengan slim diff snapshot (S3.2)
- **Riwayat Pengembangan** — self-documenting dev log + roadmap visibility untuk predecessor/successor handoff
- **Komunikasi & Diskusi** — async coordination antar stakeholder (10 roles, threaded discussions, 25 MB file attachments)

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

Semua 14 tabel transactional pakai pattern konsisten:

```sql
{ id text PRIMARY KEY, data jsonb NOT NULL, created_at, updated_at, created_by, updated_by }
```

Title, rows, year, semua fields rich entity disimpan di kolom `data` JSONB. Kolom `id` carries semantic meaning (year, period, sequence).

Pengecualian: `system_settings` pakai pattern KV (`{key text PK, value jsonb, updated_at}`) untuk simpler config storage.

### SSOT Lattice & IV Checks (Sprint A-D)

Tab 1.1 Pagu Anggaran adalah SSOT (Single Source of Truth) — semua downstream (RAB narrative, RPD, Bill, LRA) **derive dari Pagu**, tidak cache value sendiri. Enforcement via 8 lattice rules + 5 IV (Independent Verification) checks di `utils/realisasiBucket.ts`:

| IV Check | Severity | Rule | Purpose |
|---|---|---|---|
| `IV-OVER-PAGU` | ERROR | L7 | Yearly realisasi tidak boleh exceed Pagu ceiling |
| `IV-ORPHAN` | ERROR | L8 | Setiap bucket kode harus ada di Pagu (no orphan codes) |
| `IV-DUP-PAGU` | WARNING | L1 | Kode tidak boleh muncul di >1 Pagu section (double-count risk) |
| `IV-RPD-OVER-PAGU` | ERROR | L5 | RPD monthly sum tidak boleh exceed Pagu ceiling |
| `IV-RPD-DEVIATION` | WARNING | n/a | Monthly realisasi deviates >30% dari RPD planned |

**Effective value formula** (untuk aggregator, defensive against stale fields):

```typescript
// utils/paguLookup.ts — Sprint D Item #1
getEffectiveValue(row, mode) = volume × (
  mode === 'AWAL'   ? hargaSatuanAwal :
  mode === 'REVISI' ? (hargaSatuanRevisi > 0 ? hargaSatuanRevisi : hargaSatuanAwal)
                      // ↑ Konteks 1 fallback: Revisi=0 BUKAN drop, fallback ke Semula
)
```

Per **normative logic Angga (Sie Renbang, 10 Mei 2026)**: "harga semula adalah baseline. jika diperlukan revisi maka akun harga semula dilakukan revisi, BUKAN konteks drop". Aplikasi sebelumnya treat `Revisi=0` sebagai drop ke nol (bug Konteks 1), fixed di Sprint D Item #1.

### BAS Whitelist + HITL Dictionary (Sprint B)

Pagu Anggaran rows harus refer ke kode BAS resmi (Bagan Akun Standar Kemenkeu). Whitelist disimpan di:

- `utils/basDictionary.ts` — 4,314 codes dari KEP-331/2021 + KEP-291/2022 dengan `KEYWORD_ALIASES` mapping
- `utils/internalRecommendations.ts` — 14 HITL (Human-in-the-Loop) rules untuk recommendation autocomplete (mis. ATK→521811, BMP→523122, Honor→521115, Pengadaan Alsintor/Alkes/Alsatri→532111 with `.A`/`.B`/`.C` subkode khusus pengadaan)

UI autocomplete (`components/KodeAutocomplete.tsx`) tampilkan badge "HITL ✓" untuk recommendation yang sudah ter-approve Angga, plus alasan + tanggal konfirmasi sebagai audit trail.

### Audit Log Foundation (S3.2)

Sync-time audit logging via diff helpers (`lib/audit.ts`):

```typescript
// Per syncToCloud entity wrap:
auditBuffer.push(...diffCollectionForAudit(
  prevSnapshotRef.current.bills, allBills, 'bill',
  (b) => `Tagihan ${b.uraian || b.id}`,
));
prevSnapshotRef.current.bills = allBills;
// Bulk flush di finally:
await logAuditEntries(auditBuffer);
```

25 entity taxonomy (23 baseline Session A + 2 Komunikasi additions) + 10 action types (create/update/delete + bulk variants + config_update + reset/seed_load/import_csv). Slim diff per field `{before, after}` untuk update; full snapshot untuk create/delete; aggregate stats untuk bulk. Komunikasi feature menambah 2 entities (`phaseDiscussion`, `phaseMessage`) dengan inline emit pattern (D4 selective).

UI inspector di Settings → tab "Riwayat Aktivitas" dengan filter (entity, action, date range), pagination 100/page, detail modal pretty-print JSON, clear-all double-confirm.

### Architectural Reconcile Wrapper (S3.0)

BPJSModule punya pre-existing prop-drilling anti-pattern: pass filtered subset alongside full state setter ke ServiceLog → state corruption + audit phantom events.

Fix: surgical wrapper `handleFilteredLogsChange` di parent yang reconciles modifications dari filtered subset kembali ke full state (3-step merge: preserve outside-window items + replace/drop inside-window + append new). Pattern di-document untuk DoctorData/StaffData (latent same anti-pattern, defer ke Phase 3 P3.x).

```typescript
// Step 1+2: rebuild full list. Items in filter window: replace OR drop.
//           Items outside filter window: preserve as-is. (THE FIX)
const reconciledExisting = props.logs
  .filter(l => !filteredIds.has(l.id) || modifiedById.has(l.id))
  .map(l => modifiedById.get(l.id) ?? l);
// Step 3: append new items
const newlyAdded = modifiedFiltered.filter(l => !existingIds.has(l.id));
props.onLogsChange([...reconciledExisting, ...newlyAdded]);
```

### Settings Module — Multi-Tab Overlay

Full-page overlay (z-100) dengan 6 tabs, accessible via gear icon ⚙️ di header:

| # | Tab | Status |
|---|---|---|
| 1 | Riwayat Aktivitas (audit log inspector) | Live |
| 2 | Riwayat Pengembangan (devlog + roadmap viewer) | Live |
| 3 | Komunikasi & Diskusi (async coordination) | Live |
| 4 | Profil RS | Soon (S3.6) |
| 5 | Konfig BPJS | Soon (Phase 4+) |
| 6 | Konfig PNBP | Soon (S3.5) |

Gear icon ada **red dot badge** dengan unread count untuk Komunikasi messages baru.

### Komunikasi & Diskusi (Trust-Based Async Coordination)

GitHub-issues-style threading untuk koordinasi antar 4+ stakeholder yang tidak sering kontak langsung (Successor / Predecessor / Bagian IT / Karumkit / Verifikator / Bendahara / Asisten Successor + 3 placeholder slots).

- **Identity model:** trust-based 10-role registry, suggestedNames per role + custom input fallback. localStorage persistence per device. Real auth = TD-13 Phase 3 P3.1.
- **Threading:** topic-based discussions (open/closed/archived) → flat chronological messages dengan optional reply-to indicator
- **Attachments:** 25 MB/file × 5 attachments × 9 MIME types (PDF/DOC(X)/XLS(X)/PNG/JPG/ZIP) ke private storage bucket dengan signed URLs (1-hour TTL)
- **Audit:** selective — discussion lifecycle + file uploads di-log; routine text messages tidak (privacy + storage hygiene)
- **Edit window:** 30 menit untuk own messages

### File Storage via Supabase Storage

| Bucket | Purpose | Public | Limit | MIME |
|---|---|---|---|---|
| `jasa-verification` | Berkas verifikasi jasa medis (F2.2) | Yes | 10 MB | PDF, PNG, JPEG |
| `phase-docs` | Attachments diskusi Komunikasi | No (signed URLs) | 25 MB | PDF, DOC(X), XLS(X), PNG, JPG, ZIP |

Path pattern `jasa-verification/{periodKey}/{category}/{uuid}-{filename}` dan `phase-docs/{discussion_id}/{message_id}/{timestamp}_{filename}`.

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
- Math invariant approach untuk debug audit anomalies (`prev.length = removed + modified + unchanged`)

---

## Schema Reference

### Database (Supabase project `qjijsftbytozcoyrtric`)

**Total: 17 tables** (15 envelope JSONB + 1 KV `system_settings` + 1 audit_log envelope).

#### Transactional tables (envelope JSONB)

| Table | Purpose | ID Pattern |
|---|---|---|
| `pagu_sections` | Pagu anggaran per kategori per tahun | `pagu-{year}-{slug}` |
| `bills` | Tagihan operasional | `bill-{year}-{seq}` |
| `patient_claims` | Klaim BPJS / Yanmasum | `claim-{year}-{seq}` atau `log-{ts}` |
| `doctors` | Master data dokter | `dr-{seq}` |
| `employees` | Master data pegawai | `emp-{seq}` |
| `revenue_targets` | Target pendapatan per kategori | `rt-{year}-{kat}` |
| `specialty_targets` | Target per spesialisasi | `st-{year}-{spes}` |
| `payroll_statuses` | Status payroll (Lunas/Belum Lunas) | `YYYY-MM-personId` |
| `jasa_verification_files` | Metadata berkas verifikasi (binary di Storage) | `jvf-YYYY-MM` |

#### Step 3 tables (envelope JSONB)

| Table | Purpose | Status | ID Pattern |
|---|---|---|---|
| `audit_log` | Audit trail (slim diff snapshots) | Live (S3.2) | `audit-{ts}-{base36-6}` |
| `rabs` | RAB categories | Pending S3.3 | `rab-{year}-{categoryId}` |
| `rpds` | RPD sections | Pending S3.3 | `rpd-{year}-{sectionId}` |
| `kuitansi` | Kuitansi receipts | Pending S3.4 | `kwt-{year}-{seqOrHash}` |
| `pnbp_setoran` | PNBP setoran records | Pending S3.5 | `pnbp-{year}-{month}-{seq}` |

#### Komunikasi feature tables (envelope JSONB)

| Table | Purpose | ID Pattern |
|---|---|---|
| `phase_discussions` | Discussion threads (title, status, phase_ref, participants) | `disc-{ts}-{base36-6}` |
| `phase_messages` | Messages dalam discussion (content, attachments, reply_to) | `msg-{ts}-{base36-6}` |

#### KV table

| Table | Purpose | Keys |
|---|---|---|
| `system_settings` | Konfigurasi global (KV pattern) | `jasa_map`, `bpjs_history`, `pagu_lock`, `rs_profile`, `pnbp_config` |

### Storage Buckets

| Bucket | Public | Limit | MIME |
|---|---|---|---|
| `jasa-verification` | Yes | 10 MB | PDF, PNG, JPEG |
| `phase-docs` | No (signed URLs) | 25 MB | PDF, DOC(X), XLS(X), PNG, JPG, ZIP |

### Row Level Security

Phase 2/3 saat ini = `PERMISSIVE ALL` ("Enable all access for all users") untuk semua 17 tables + storage policies. Phase 3 P3.1 (TD-3) akan tighten ke role-based authentic policies setelah Supabase Auth wired.

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
4. Hard refresh browser (Cmd/Ctrl+Shift+R) untuk bypass cache

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
- Verify post-migration dengan dedicated verify queries
- Document di `constants/devLog.ts` `DEV_LOG_ENTRIES` untuk audit trail

---

## Project Structure

```
SIKESUMAv3.1/
├── App.tsx                            # Root component + state + sync logic (~1100 lines)
├── components/
│   ├── AuditEntryEditModal.tsx        # [S5.3] Modal edit reasoning + review status (422 LOC)
│   ├── AuditLogViewer.tsx             # Tinjauan Audit (filter + chips + status column + modal trigger)
│   ├── BPJSModule.tsx                 # Tab BPJS (claims + settings) + S3.0 reconcile wrapper
│   ├── BpjsSettingsForm.tsx           # Time-versioned BPJS fee settings
│   ├── DeviationDashboard.tsx         # [S5.4] Pure SVG charts RPD vs Realisasi (880 LOC)
│   ├── EarlyWarningPanel.tsx          # [S5.5] Early warning alerts widget (310 LOC)
│   ├── DevLogViewer.tsx               # Riwayat Pengembangan (devlog timeline + ROADMAP)
│   ├── PaguAnggaran.tsx               # Pagu editor (multi-year)
│   ├── PayrollSummary.tsx             # Daftar Gaji + payroll status
│   ├── PhaseDiscussionsModule.tsx     # Komunikasi & Diskusi (10 roles, threading, attachments)
│   ├── RevisionProposalGenerator.tsx  # [S5.6] Auto-generate revision proposal (608 LOC)
│   ├── RsProfileEditor.tsx            # [S3.6] Profil RS editable (11 fields, self-contained)
│   ├── ServiceBillRecap.tsx           # Rekapitulasi tagihan jasa + file upload
│   ├── SettingsModule.tsx             # Settings overlay (6 tabs, gear icon entry)
│   ├── Toast.tsx                      # Toast UI (imperative API)
│   └── ...                            # 12 modul lain (RAB, RPD, Revenue, dll)
├── constants/
│   ├── audit.ts                       # AUDIT_ENTITIES (25) + AUDIT_ACTIONS (10) + [S5.1] reasoning categories
│   ├── devLog.ts                      # DEV_LOG_ENTRIES + ROADMAP + DevLogAuthor types
│   └── komunikasi.ts                  # ROLE_REGISTRY (10) + Komunikasi types + helpers
├── constants.tsx                      # DUMMY data + initial state values
├── lib/
│   ├── audit.ts                       # logAuditEntries + diffCollectionForAudit + [S5.1] reasoning helpers
│   └── supabase.ts                    # Supabase client + envelope JSONB helpers
├── utils/
│   ├── csvHelper.ts                   # CSV parsing/export
│   ├── deviationMetrics.ts            # [S5.4] Pure compute: RPD vs Realisasi deviation (381 LOC)
│   ├── earlyWarning.ts                # [S5.5] Pure compute: pattern detection + threshold alerts (540 LOC)
│   └── feeCalculation.ts              # BPJS fee logic (5 scenarios)
├── types.ts                           # TypeScript interfaces
├── PHASE_3_HARDENING_BACKLOG.md       # Phase 3 backlog (P3.1-P3.6 security/audit/scale)
├── PATCHES_SUMMARY_KOMUNIKASI.md      # Komunikasi feature completion summary
└── package.json
```

---

## Documentation

### Active Docs (di repo root)

- [`HANDOVER.md`](./HANDOVER.md) — Quick handoff brief untuk new contributors
- [`SIKESUMA-AUDIT-HANDOVER-v1_4.md`](./SIKESUMA-AUDIT-HANDOVER-v1_4.md) — Comprehensive handover doc (Step 2 era)
- [`STEP2_COMPLETION_ROADMAP_v3_1_v2.md`](./STEP2_COMPLETION_ROADMAP_v3_1_v2.md) — Step 2 completion roadmap
- [`STEP5_DECISION_SUPPORT_LOG.md`](./STEP5_DECISION_SUPPORT_LOG.md) — Step 5 development log (Phase 5.1–5.4 decisions + verification)
- [`PHASE_3_HARDENING_BACKLOG.md`](./PHASE_3_HARDENING_BACKLOG.md) — Phase 3 backlog (P3.1-P3.6 hardening)
- [`PATCHES_SUMMARY_KOMUNIKASI.md`](./PATCHES_SUMMARY_KOMUNIKASI.md) — Komunikasi feature completion summary

### SSOT Refactor Docs (Sprint A-D, 10-11 Mei 2026)

- [`docs/glossary.md`](./docs/glossary.md) — **Glosarium istilah lokal RS Batin Tikal** (BMP/BMHP/TKS/Nakes/Alsintor/Alkes/Alsatri/POK/YANMASUM/dll) + konvensi subkode `.A`/`.B`/`.C` khusus Pengadaan + daftar kode BAS tidak dipakai. **Start here untuk new spoke session** kalau kerja di tab 1.1 Pagu Anggaran.
- [`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md) — Koreksi audit doc original; resolusi 3 hard blockers (HB#1/2/3) plus Konteks 6 (521119 vs 521112)
- [`SPRINT-B4-RESPONS-ANGGA.md`](./SPRINT-B4-RESPONS-ANGGA.md) — Konfirmasi Angga 10 Mei 2026 sebagai dokumentasi normatif (yang sebelumnya hanya asumsi)
- [`SPRINT-B4-MIGRATION-DIFF-REPORT.md`](./SPRINT-B4-MIGRATION-DIFF-REPORT.md) — Diff report migration Sprint B Round 1
- [`SPRINT-B4-ROUND2-DIFF-REPORT.md`](./SPRINT-B4-ROUND2-DIFF-REPORT.md) — Diff report Round 2 (HITL foundation)
- [`SPRINT-B-ROUND3-REPORT.md`](./SPRINT-B-ROUND3-REPORT.md) — Diff report Round 3 (Konteks 6 + glossary)
- [`SPRINT-B-ROUND4-CLOSURE.md`](./SPRINT-B-ROUND4-CLOSURE.md) — Closure Round 4 (ALSATRI `.C` + 536111)
- [`lib/migrations/d1_fix_revisi_fallback.ts`](./lib/migrations/d1_fix_revisi_fallback.ts) — Migration audit trail Sprint D Item #1 (idempotent)

### Live Documentation (di production app)

- **Settings → Riwayat Pengembangan** — `constants/devLog.ts` `DEV_LOG_ENTRIES` rendered as timeline + `ROADMAP` rendered as priority-grouped backlog
- **Settings → Tinjauan Audit** — `audit_log` table rendered with filter, status chips, reasoning editor modal (Phase 5.3)

---

## Phase Progress

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Complete | v3.1 baseline + Vite scaffold |
| Phase 2 (Step 1) | ✅ Complete | Schema audit + RLS setup |
| Phase 2 (Step 2 v2) | ✅ Complete | 4 sequences (consolidate + multi-year + file storage + validation rigor) |
| **Step 3 / Session A** | ✅ **Complete** | Audit log foundation (S3.0/S3.1/S3.2) — schema + lib + UI inspector + S3.0 architectural fix |
| **Step 3 / Komunikasi** | ✅ **Complete** | Komunikasi & Diskusi feature — 2 tables, 1 storage bucket, 10-role threading |
| **Step 3 / Session B.1** | ✅ **Complete** | S3.3 RAB+RPD persist + S3.6 Profil RS editable (11 fields) |
| **Step 3 / Session B.2+** | 🔜 Pending | S3.4 Kuitansi + S3.5 PNBP Setoran (~10-14 jam estimate) |
| **Step 5 / Phase 5.1** | ✅ **Complete** | Reasoning Capture Foundation — 7 fields + 5 helpers di lib/audit.ts |
| **Step 5 / Phase 5.2** | ✅ **Complete** | 2024 Dummy Data — 4 scenarios, 90 records, mixed 53% reviewed |
| **Step 5 / Phase 5.3** | ✅ **Complete** | Tinjauan Audit UI — modal editor + summary chips + status filter |
| **Step 5 / Phase 5.4** | ✅ **Complete** | Deviation Dashboard — pure SVG stacked bar + line chart + drill-down modal |
| **Step 5 / Phase 5.5-5.6** | ✅ **Complete** | Early Warning Engine + Revision Proposal Generator |
| **SSOT Refactor / Sprint A** | ✅ **Complete** | Data model cleanup — zombie field removal + year-aware + RPD derive Pagu |
| **SSOT Refactor / Sprint B** | ✅ **Complete** | BAS whitelist + HITL dictionary + glossarium (8 commits, 4 rounds) |
| **SSOT Refactor / Sprint C** | ✅ **Complete** | Lattice enforcement — 5 IV checks (IV-ORPHAN, IV-DUP-PAGU, IV-OVER-PAGU, IV-RPD-OVER-PAGU, IV-RPD-DEVIATION) + Bill state machine |
| **SSOT Refactor / Sprint D Item #1** | ✅ **Complete** | Konteks 1 fix (Revisi=0 fallback) + Schema Integrity sync — recovery Rp 137,995,000 |
| **SSOT Refactor / Sprint D Item #2+** | 🔜 Pending | Year handling bug, multi-year paguByKode, audit_log CRUD |
| **SSOT Refactor / Sprint E** | 🔜 Pending | LRA aggregator regression test (priority Angga) + audit doc original update |
| Phase 3 Hardening | 🔜 Backlog | Security (RLS role-based, real auth), audit polish, storage retention. Total ~25-35 jam. |
| Step 4 | 🔜 Future | Multi-RS template deploy |

---

## Key Decisions Log

### Phase 2 Foundation

- **Schema strategy:** Pure envelope JSONB (Q1 — Sequence 1)
- **Multi-year storage:** Year-aware id pattern `pagu-{year}-{slug}` (Q4 — Sequence 2 F2.0)
- **payroll_statuses:** Separate table dengan zero-padded keys (Q3 — Sequence 2 F2.1)
- **File storage (jasa-verification):** Supabase Storage bucket public + public URL (Sequence 3 F2.2)
- **Toast UI:** Built-in component, no external library, imperative API (Sequence 3 F2.4)
- **DUMMY constants:** Keep as initial state fallback untuk smooth UX (Sequence 4 F3.1)
- **RLS pattern:** Phase 2 = "Enable all access for all users" → Phase 3 tighten to role-based (deferred F3.5)

### Step 3 Session A (Audit Log)

- **§S3.2-D2:** ID generation pattern reuse `Date.now()` + `Math.random().toString(36).slice(2,8)` (no nanoid install)
- **§S3.2-D3:** `useRef` di App.tsx for `prevSnapshotRef` baseline tracking
- **§S3.2-Coverage Opsi B:** Full coverage 23 audit entities (POC 17 + v3.1-specific 6)
- **§S3.0-Path B-narrow:** Apply reconcile wrapper di BPJSModule only; defer DoctorData/StaffData ke Phase 3 P3.x
- **§S3.2.3-Settings entry Opsi A:** Gear icon di header (not tab bar, not URL flag)
- **§S3.2.3-Detail modal Opsi A:** Plain JSON pretty-print (Opsi B side-by-side diff = TD-4 future)
- **§S3.2.3-Clear all Opsi A:** Hard delete dengan double-confirm (soft delete = future)

### Komunikasi & Diskusi

- **§Komunikasi-D1 Trust-based identity:** 10-role registry dengan suggestedNames per role + custom input fallback. Real auth deferred ke TD-13.
- **§Komunikasi-D2 Topic-based threading:** Discussions = top-level (title + status + phase_ref); messages = flat chronological dengan optional reply-to. No nested replies.
- **§Komunikasi-D3 File limits:** 25 MB/file × 5 attachments × 9 MIME types whitelist.
- **§Komunikasi-D4 Selective audit:** Hanya discussion lifecycle (create/close/archive) + file upload yang masuk audit_log. Routine text messages tidak di-audit (privacy + storage hygiene). Direct inline `logAuditEntries([entry])` call (different dari Session A diff-based pattern).
- **§Komunikasi-D5 Visual unread badge:** Red dot + count di gear icon header. Global granularity per device (per-discussion = TD-17).
- **§Komunikasi-D6 Placement:** New tab di SettingsModule (position 3, antara Riwayat Pengembangan dan Profil RS).

### Step 5 — Decision Support Module (Phase 5.1–5.4)

- **§S5.1 Reasoning fields:** Embedded di `data` JSONB (bukan tabel terpisah). 6 initial categories extensible via `system_settings`. UI placement di Phase 5.3.
- **§S5.2 Dummy data:** SQL bulk INSERT (replayable). 4 scenarios: Normal/Wabah/Inflasi/Underspend. Mixed 53% reviewed. Companion cleanup SQL.
- **§S5.3-D1 A:** Extend existing AuditLogViewer (bukan sibling component baru).
- **§S5.3-D4:** +reviewerNotes 7th field — semantic split public (reasoning) vs internal (reviewerNotes).
- **§S5.3 Validation:** Reasoning ≥10 chars + category required. Un-review allowed with confirm (reasoning preserved).
- **§S5.4-D1 A:** Sub-tab "4.2 Deviasi & Tinjauan" di Tab 4 (Pelaporan & LRA).
- **§S5.4-D2 A:** Pure SVG charts (0 KB external deps, no recharts/chart.js).
- **§S5.4-D6 A:** Hybrid color coding — reasoning category color saat ada audit, fallback muted base color.
- Full decision index: [`STEP5_DECISION_SUPPORT_LOG.md`](./STEP5_DECISION_SUPPORT_LOG.md) §7.

### SSOT Refactor (Sprint A-D, 10-11 Mei 2026)

Roadmap 5-sprint A→E untuk Single Source of Truth refactor di tab 1.1 Pagu Anggaran. Driver: kontak dengan Angga (Sie Renbang) yang sebelumnya tidak pernah dilakukan, sehingga banyak asumsi domain ter-validasi/koreksi langsung.

**Sprint A — Data Model Cleanup (3 commits):**
- §A.1: Hapus zombie field `PaguRow.realisasi` — tidak pernah dipakai, source of stale data
- §A.2: Derive `RPDRow.totalBudget` dari Pagu via `paguLookup` helper (Opsi A strict) — SSOT enforcement
- §A.3: Tambah field `tahun` eksplisit ke `PaguSection` — ganti id-pattern parsing yang fragile

**Sprint B — BAS Whitelist + HITL Dictionary (8 commits, 4 rounds):**
- §B.1: Seed `kode_bas_dictionary` dari KEP-331/2021 + KEP-291/2022 (4,314 codes)
- §B.2: Tambah optional field `kode_bas` ke `PaguRow`
- §B.5: Rename `linkedSectionId` → `linkedPaguSectionId` untuk clarity
- §B.6: Autocomplete kode akun di Pagu/RAB/Bill dengan dual-mode (BAS lookup + HITL recommendations)
- §B.4: Backfill `kode_bas` + 3 hard blockers resolution (ATK→521811, LAUNDRY→521119, Pembayaran Rujuk→521119)
- §B.Round2: Internal HITL recommendation dictionary foundation (9 entries)
- §B.Round3: Expand HITL dict 9→14 entries + `docs/glossary.md` + Konteks 6 fix (521119 vs 521112)
- §B.Round4: Konfirmasi final Angga (ALSATRI `.C`, 536111 untuk Aplikasi XDR)

**Sprint C — Lattice Enforcement (5 commits):**
- §C.1: `IV-DUP-PAGU` bucket check — soft block L1 untuk duplicate kode lintas section
- §C.2: `IV-RPD-OVER-PAGU` + RPD overspend banner — soft block L5
- §C.3: `IV-ORPHAN` upgrade severity WARNING→ERROR — tangkap semua codes (L8)
- §C.4: Bill state machine validator (`utils/billStateMachine.ts`)
- §C.5: Draft default + akun gate untuk Bill creation

**Sprint D Item #1 — Konteks 1 Fix + Schema Integrity (commit `5e85264`):**
- Bug Konteks 1 (Angga normative logic): aplikasi memperlakukan `hargaSatuanRevisi=0` sebagai literal drop, padahal seharusnya berarti "tidak ada revisi → fallback ke Semula sebagai baseline"
- Bug Schema Integrity v3.0: field `jumlahBiayaAwal`/`jumlahBiayaRevisi` di DB stale vs `harga × volume` (UI compute correct, DB stale → IV checks & LRA silent wrong 47% under-count)
- Migration applied (Opsi A Strict):
  - Rule 1: 4 leaf rows recovery Rp 137,995,000 (Obat BMHP YANMASUM, Honor Pengelola YANMASUM, Pengadaan Alsintor BPJS, Bahan Makanan YANMASUM)
  - Rule 2: 41 leaf rows sync `jumlahBiaya{Awal,Revisi}` = `harga × volume`
  - Rule 3: Parent rows auto-bubble-up sum from children
- Total Pagu TA 2025: Rp 2,571,940,000.40 → **Rp 2,709,935,000.40** (+Rp 137,995,000)
- Code fixes: `PaguAnggaran.tsx handleRowChange` (mirror Semula→Revisi + sync jumlahBiaya), `utils/paguLookup.ts` new `getEffectiveValue(row, mode)` helper, `utils/realisasiBucket.ts` use helper (defensive)

**Sprint E pending:** LRA aggregator regression test (Angga's explicit Section 4 concern: angka LRA per Lampiran sebelum & sesudah B.4 backfill harus identik), update audit doc original dengan HB#1/2/3 corrections.

**Sprint F (proposed future):** Workflow approval Palembang gate, HITL UI di Settings tab untuk Angga input langsung.

Full SSOT chronology + Angga normative confirmations: [`docs/glossary.md`](./docs/glossary.md) + sprint reports (`SPRINT-B-ROUND3-REPORT.md`, `SPRINT-B-ROUND4-CLOSURE.md`, `SPRINT-B4-MIGRATION-DIFF-REPORT.md`).

---

## Watchpoints (Resolved)

| # | Issue | Status | Closed In |
|---|---|---|---|
| v1.0 #4 | No-op handler di pagu lock toggle | ✅ Closed | Sequence 1 |
| v1.0 #6 | Payroll status key NOT zero-padded | ✅ Closed | Sequence 2 (F2.1) |
| v1.0 #6 #2 | periodKey ServiceBillRecap NOT zero-padded | ✅ Closed | Sequence 3 (F2.2) |
| **S3.0 #1** | **BPJSModule prop-drilling anti-pattern (filtered subset → state corruption + audit phantom events)** | ✅ **Closed** | **Step 3 Session A (S3.0 reconcile wrapper)** |
| **S3.2 #1** | **Schema drift: `system_settings` is KV (3-col), bukan envelope (6-col) seperti yang awalnya disebut handover** | ✅ **Closed** | **Step 3 Session A (S3.1 SQL adjusted)** |
| **SSOT A.1** | **Zombie field `PaguRow.realisasi` source of stale data** | ✅ **Closed** | **Sprint A.1 (commit `29f740b`)** |
| **SSOT A.2** | **RPDRow.totalBudget cached → drift dari Pagu** | ✅ **Closed** | **Sprint A.2 (commit `521fe71`, Opsi A strict)** |
| **SSOT B.4 HB#1** | **521813 di-encode untuk obat (salah — itu Pita Cukai/Meterai/Leges)** | ✅ **Closed** | **Sprint B.4 (HB#1 resolved → 521811)** |
| **SSOT B.4 HB#2** | **Honor TKS/Nakes/Pengelola di-encode 521213 (insidentil) padahal monthly continuous → 521115** | ✅ **Closed** | **Sprint B.4 (HB#2 resolved)** |
| **SSOT B.4 HB#3** | **BMP (BBM) di-encode 521211 padahal Kemhan-specific 523122** | ✅ **Closed** | **Sprint B.4 (HB#3 resolved)** |
| **SSOT Konteks 6** | **`521112` Bahan Makanan dipakai untuk Operasional Lainnya (harus 521119)** | ✅ **Closed** | **Sprint B Round 3 (Angga konfirmasi)** |
| **SSOT C.3** | **`IV-ORPHAN` severity WARNING tidak cukup ketat — kode invalid bisa lolos** | ✅ **Closed** | **Sprint C.3 (upgrade ERROR)** |
| **SSOT D.1 Konteks 1** | **Aplikasi treat `hargaSatuanRevisi=0` sebagai drop ke nol, padahal per Angga harus fallback ke Semula** | ✅ **Closed** | **Sprint D Item #1 (commit `5e85264`) — recovery Rp 137,995,000** |
| **SSOT D.1 Schema** | **Field `jumlahBiaya{Awal,Revisi}` di DB stale vs `harga × volume` (47% under-count silent)** | ✅ **Closed** | **Sprint D Item #1 — 41 rows synced + code fix** |

### Watchlist (Awareness, Not Backlog)

- **Tier 3 MERGED TO MAIN** (11 Mei 2026): commit `6c8f640` — metadata schema + recommender + UI integration. JSONB-native, 92.1% high confidence, 201 Vitest tests pass. Feature branch dihapus. Lihat `SSOT-REFACTOR-LOG.md §0.8` untuk full decisions log.
- **Tier 4a Phase 3 COMPLETE** (11 Mei 2026): `feature/tier-4a-pagu-structure` 13+ commits ahead of main — semua 5 validators (C1-C5) + UI integration full (dashboard tab "1.5 Validasi Revisi POK" + 12-card grid + inline indicators di Pagu Anggaran + bidirectional navigation + row-level scroll/highlight). **304 tests pass** (201 Tier 3 + 103 Tier 4a). Ready Phase 4 (Owner E2E test → squash merge). Lihat `SSOT-REFACTOR-LOG.md §0.9.1-§0.9.7` + `docs/TIER-4-DESIGN.md` + `docs/TIER-4A-PHASE-3-UI-DESIGN.md`.
- **Tier 4b/4c next** — `feature/tier-4b-revisi-mechanism` (C6-C9) + `feature/tier-4c-procedural-references` (C10-C12) belum dimulai. Sequential per Decision N2 setelah 4a squash merge.
- **Tier 3 JSONB-native enforcement**: SIKESUMA tables PAKAI envelope JSONB pattern `(id, data jsonb, audit cols)`, BUKAN relational columns. Sebelum draft DDL apapun, baca `SSOT §0.7.5 AP-8` + verify schema aktual via PostgREST probe. DDL hanya untuk add new table.
- **Analisis data pagu_sections**: ikuti `SSOT-REFACTOR-LOG.md §0.7 Protokol Analisis Data` (BARU 11 Mei 2026) — leaf detection harus traversal-based (bukan `level > 0`), effective value pakai `getEffectiveValue`, verification cross-check UI tab 1.1/1.4. 8 anti-pattern catalogued (AP-1..AP-8) setelah false-positive forensic incident + Tier 3 blueprint schema drift.
- **DoctorData/StaffData** punya same internal pattern sebagai ServiceLog pre-S3.0 (TD-1). Currently safe karena BPJSModule passes full state. Refactor scheduled Phase 3 hardening.
- **TS baseline 8 errors** (turun dari 11 post-devLog.ts cleanup 11 Mei 2026): 7 App.tsx Object.entries/values + Record<K,V> patterns + 1 PaguAnggaran 'unknown' type. Vite skip type-check di build → non-blocking. Cleanup di TD-2.
- **Konteks 1 finding (UNRESOLVED)**: `components/PaguAnggaran.tsx:50-51` line `(row.volume || 0) * (row.hargaSatuanRevisi || 0)` overwrites `jumlahBiayaRevisi=0` jika `hargaSatuanRevisi=0` — potential miss dari Konteks 1 fallback Sprint D Item #1. C1 validator (Tier 4a) handle correctly via `effectiveRevisi` helper, tapi UI display tetap potential bug worth investigating.
- **Tailwind CDN** masih digunakan (warning di console). Migrate ke PostCSS plugin = Phase 3 cleanup.
- **Storage cost ceiling** Komunikasi worst case 12.5 GB > 5 GB free tier. Monitoring + retention strategy = TD-16.

---

## Contributing

Project saat ini di-maintain oleh Sie Renbang RS Batin Tikal (predecessor) + Ferry (successor). Untuk bug reports atau feature requests:

1. Buat issue di GitHub repository
2. Atau hubungi maintainer langsung via channel internal
3. Atau **post discussion di Komunikasi feature** (Settings → Komunikasi & Diskusi) untuk koordinasi async

Pattern workflow successor sessions: outline-first, diagnostic-first SQL, atomic transaction, smoke test live setiap milestone, file versioning preserve, devLog entry per milestone untuk predecessor visibility.

---

## License

Internal use untuk RS TNI AD. Tidak untuk distribusi publik tanpa izin.

---

## Acknowledgments

- TNI AD Pusat — sponsorship & infrastructure
- Sie Renbang RS Batin Tikal — domain expertise & product feedback
- **Angga (Sie Renbang)** — normative validation untuk SSOT Refactor Sprint A-D (10-11 Mei 2026): konfirmasi 14 HITL recommendations, Konteks 1 logic (Revisi=0 fallback), konvensi subkode `.A`/`.B`/`.C` khusus pengadaan, glossarium istilah lokal
- Ferry (Successor) — Phase 2+ ownership & Step 3 execution
- Anthropic Claude — AI pair programming sessions untuk migration + hardening (Step 1, Step 2 v1, Step 2 v2 Sequence 1-4, Step 3 Session A audit foundation, Komunikasi feature, **SSOT Refactor Sprint A-D**)

---

*Last updated: 11 Mei 2026 (SSOT Refactor Sprint D Item #1 — Konteks 1 fix + Schema Integrity sync; total Pagu TA 2025 Rp 2,709,935,000.40 after recovery Rp 137,995,000).*
