# SIKESUMA — Holistic Introduction for SIMRS Spoke Session

**Status:** Active reference document untuk read-only consumption
**Document type:** Authoritative introduction SIKESUMA untuk SIMRS Batin Tikal spoke session (Khanza analyst + future SIMRS BT Phase 2 sessions)
**Audience:** AI sessions yang sedang menganalisa Khanza / membangun SIMRS Batin Tikal, dengan kebutuhan **read-only awareness** terhadap SIKESUMA
**Authoritative parent blueprint:** `SIMRS-BATIN-TIKAL-ARCHITECTURE-BLUEPRINT.md` v1.0 (di project SIMRS BT, bukan di repo ini)
**Companion document:** `docs/SIMRS-SPOKE-READ-ACCESS.md` (access points + credentials placeholder)
**Tanggal:** 13 Mei 2026
**Versi:** 1.0 — Initial introduction, post Tier 5a MERGED `d55f0d0` + TS cleanup `999a46f`
**Maintained by:** SIKESUMA AI session (Owner-supervised)

---

## ⚠️ Read-Only Boundary — Wajib Dipatuhi

Dokumen ini membuka **wawasan** ke codebase + database SIKESUMA untuk SIMRS spoke session. **BUKAN izin intervensi.**

| Aksi | Diperbolehkan untuk SIMRS spoke? |
|---|---|
| Clone repo SIKESUMA untuk read code | ✅ Ya |
| Run schema introspection queries di Supabase SIKESUMA | ✅ Ya (read-only via anon JWT atau read-only role) |
| Buka live app `https://sikesumav31.vercel.app` untuk lihat UX | ✅ Ya |
| Membaca SSOT decision log, design docs, validator implementations | ✅ Ya |
| Adopt pattern/idea ke SIMRS Batin Tikal codebase | ✅ Ya (knowledge transfer adalah tujuan) |
| **Push commit ke repo SIKESUMA** | ❌ TIDAK PERNAH |
| **Buka PR ke repo SIKESUMA** | ❌ TIDAK PERNAH |
| **Modifikasi schema/data di Supabase SIKESUMA** | ❌ TIDAK PERNAH |
| **Trigger Vercel deployment** | ❌ TIDAK PERNAH |
| **Re-organize SIKESUMA docs/file structure** | ❌ TIDAK PERNAH |

Kalau SIMRS spoke menemukan **issue** atau **suggestion** terkait SIKESUMA, jalur eskalasi adalah **lewat Owner** (dr Ferry) — bukan langsung touch SIKESUMA artifacts. Owner akan brief SIKESUMA AI session di sesi terpisah.

**Rationale boundary:** SIKESUMA dan SIMRS Batin Tikal adalah **lateral peers** (per SIMRS Blueprint §4.5). Coexistence aman hanya kalau setiap project punya AI session dedicated yang menjaga konsistensi pondasi masing-masing. Cross-touch = drift + bias.

---

## Daftar Isi

1. [Apa SIKESUMA — Konsep Inti](#1-apa-sikesuma--konsep-inti)
2. [Domain & Konteks Pengguna](#2-domain--konteks-pengguna)
3. [Tech Stack & High-Level Architecture](#3-tech-stack--high-level-architecture)
4. [Schema Overview — JSONB Envelope Pattern](#4-schema-overview--jsonb-envelope-pattern)
5. [Validation Engine — 12 Validators C1-C12](#5-validation-engine--12-validators-c1-c12)
6. [Audit Trail Tier 5 — State Machine + Immutability](#6-audit-trail-tier-5--state-machine--immutability)
7. [Tier-based Roadmap Status](#7-tier-based-roadmap-status)
8. [Patterns Proven yang Relevant untuk SIMRS BT](#8-patterns-proven-yang-relevant-untuk-simrs-bt)
9. [Bidirectional Knowledge Flow — Plan](#9-bidirectional-knowledge-flow--plan)
10. [Anti-Patterns yang SIMRS BT Sebaiknya Hindari (Pelajaran dari SIKESUMA)](#10-anti-patterns-yang-simrs-bt-sebaiknya-hindari)
11. [Deep-Dive Pointers](#11-deep-dive-pointers)
12. [Document Lifecycle](#12-document-lifecycle)

---

## 1. Apa SIKESUMA — Konsep Inti

### 1.1 Definisi Singkat

**SIKESUMA** = Sistem Informasi Keuangan, Sumber daya, dan Anggaran — aplikasi web spesifik TNI AD context untuk **governance + analitik anggaran** RS Militer (saat ini RS Tk IV Batin Tikal sebagai pilot).

Bukan SIMRS lengkap. SIKESUMA fokus ke **fungsi-fungsi spesifik TNI AD** yang tidak di-cover SIMRS generik:

- Penyusunan Operasional Kegiatan (POK) per Permenhan Renhan No. 7/2025
- Bagan Akun Standar (BAS) per KEP 211/291/331 Direktur Anggaran Kemenkeu
- Pagu Anggaran + Rencana Anggaran Biaya (RAB) + Rencana Penarikan Dana (RPD) + Laporan Realisasi Anggaran (LRA)
- Jasa medis (jaspel) — komponen gaji Militer-specific
- Revisi POK dengan audit trail Itjenad/BPK-defensible
- Validation engine yang gate Submit Revisi POK (12 validators)

### 1.2 Bukan Apa

| SIKESUMA | SIMRS Generic (mis. Khanza, Terasehat, SIMRS BT future) |
|---|---|
| TNI AD governance + anggaran specifics | Operasional RS lengkap (rekam medis, lab, radiologi, dll.) |
| Konsumen data ops dari SIMRS BT (eventually) | Sumber primary data operasional RS |
| Specialized peer | Central hub |
| Validation + audit trail oriented | Comprehensive workflow oriented |

### 1.3 Status Pengembangan (per 13 Mei 2026)

| Aspek | State |
|---|---|
| Tier 5a (Audit Trail Backend) | ✅ MERGED to main `d55f0d0`, Owner E2E PASS, TS baseline 0 |
| Tier roadmap completed | Tier 1-5a (master domain, Pagu structure, validation engine C1-C12, audit trail backend) |
| Tier roadmap pending | Tier 5b (UI audit viewer), Tier 6 (Template SK), Tier 7+ |
| Production deployment | URL `https://sikesumav31.vercel.app` (live untuk Sie Renbang field-test); main branch Vercel Preview |
| Test baseline | 610 pass (Vitest), TS 0 errors |
| Database | Supabase live, 23+ tables, 3 Tier 5 audit tables empty awaiting first usage |

Detail roadmap di §7 + `HANDOVER.md` di repo.

---

## 2. Domain & Konteks Pengguna

### 2.1 Pengguna Utama

| Role | Siapa | Apa yang dilakukan di SIKESUMA |
|---|---|---|
| **Sie Renbang** | Angga (champion) | Input + edit Pagu, RAB, RPD, LRA. Submit Revisi POK. Acknowledge LHR APIP. Day-to-day operator. |
| **Karumkit** | Kepala RS Batin Tikal | View dashboard, approve LHR APIP, final-sign keputusan. Strategic oversight. |
| **KPA** | Kakesdam II/Sriwijaya | Recipient laporan, posisi atasan; di V1 by-pass via Sie Renbang proxy (R5a decision Tier 5) |
| **Itjenad / BPK** | Auditor TNI AD / negara | Read-only audit access ke audit trail Revisi POK + snapshot history (Tier 5a). |

### 2.2 Konteks Regulatori

Domain SIKESUMA terikat ke regulatori spesifik TNI AD + Kemkeu:

| Regulasi | Relevance ke SIKESUMA |
|---|---|
| **Perdirjen Renhan Kemhan No. 7/2025** | Master domain untuk Revisi POK workflow, LHR APIP requirement (Pasal 22 huruf b angka 2) |
| **KEP 211, KEP 291, KEP 331 Dir. Anggaran Kemkeu** | Kodefikasi segmen akun BAS (Bagan Akun Standar) — 6 segment hierarchical |
| **Permenhan No. 5/2020** | Pengelolaan BMP (Bahan Bakar Minyak Pelumas) di lingkungan Kemhan + TNI |
| **UU No. 27/2022 (PDP)** | Pelindungan data subjek (pasien indirect, petugas direct) — relevant untuk data RS yang flow ke SIKESUMA dari SIMRS BT eventually |

Lihat `docs/REVISI-POK-PAGU-vKoreksi.md` untuk master domain dokumentasi lengkap (~400 lines).

### 2.3 Workflow Inti — Revisi POK

Workflow yang paling significant di SIKESUMA (sebagai context untuk SIMRS BT future modul accounting):

```
1. Sie Renbang edit row Pagu (ubah harga satuan, volume, dll.)
2. Validator C1-C12 jalan otomatis di tab "Validasi Revisi POK"
3. Sie Renbang acknowledge LHR APIP (checkbox C8) — global state persisted
4. Submit Revisi POK button enables (kalau semua 12 validator PASS + C8 acknowledged)
5. Click Submit → orchestrator:
   a. Create usulan_revisi row (status='draft')
   b. Insert N rows ke usulan_revisi_perubahan (diff per row)
   c. Record validation_attempt entry
   d. Transition state draft → direkomendasi
6. Karumkit review (atau Sie Renbang sebagai proxy R5a) → diteruskan
7. KPA tetapkan → SK terbit
8. Effective date → berlaku_efektif (snapshot_pok dibuat — immutable R7c)
```

Mirror untuk SIMRS BT accounting modul: pattern yang sama akan menjadi referensi saat SIMRS BT membangun workflow approval-based.

---

## 3. Tech Stack & High-Level Architecture

### 3.1 Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (utility-first, no design system framework) |
| State | useState/useReducer + Context (no Redux) |
| Backend-as-a-Service | Supabase (PostgreSQL + Auth + Storage + RLS + Realtime) |
| Hosting | Vercel (production environment + Preview per branch) |
| Tests | Vitest (unit + integration tests, no React Testing Library) |
| Version control | Git + GitHub (`urrenbatik-cloud/SIKESUMAv3.1`) |

**Tidak ada:**
- Backend server custom (semua via Supabase BaaS)
- ORM (langsung PostgREST + supabase-js client)
- Redux/MobX/Zustand (state via React hooks)
- Storybook (no isolated component dev environment)

### 3.2 Folder Structure (Top-Level)

```
/SIKESUMAv3.1
├── App.tsx                          # Root component, state orchestration (~1400 lines)
├── types.ts                         # Canonical type definitions (~480 lines)
├── components/                      # Functional React components per tab/section
│   ├── PaguAnggaran.tsx             # Pagu input + edit + validation surface
│   ├── ValidasiRevisiPOK.tsx        # Validation dashboard + Submit flow
│   ├── ValidationDashboardHeader.tsx # 12 validator visualization
│   ├── PhaseDiscussionsModule.tsx   # Inter-AI session communication
│   └── ... (~30 components)
├── services/                        # Supabase service layer
│   └── usulanRevisiService.ts       # Tier 5a CRUD untuk 3 audit tables
├── utils/                           # Pure functions (testable)
│   ├── validators/                  # 12 validator implementations C1-C12
│   ├── usulanRevisiStateMachine.ts  # Tier 5a state transition rules
│   └── submitRevisiHelpers.ts       # Submit flow orchestrator + LHR APIP helpers
├── lib/
│   └── supabase.ts                  # Supabase client + system_settings JSONB helpers
├── constants/
│   ├── devLog.ts                    # Technical history log (chronological)
│   └── bas/                         # BAS reference data (KEP 211/291/331)
├── docs/                            # Authoritative reference documents
│   ├── REVISI-POK-PAGU-vKoreksi.md  # Master domain doc
│   ├── TIER-5-DESIGN.md             # Tier 5 architecture spec
│   ├── SIKESUMA-INTRODUCTION-FOR-SIMRS-SPOKE.md  # ← anda di sini
│   ├── SIMRS-SPOKE-READ-ACCESS.md   # Access points (companion)
│   └── glossary.md
├── migrations/                      # SQL DDL scripts (manual-applied via Supabase Management API)
│   └── tier-5-*.sql
├── HANDOVER.md                      # Authoritative current-state document
├── SESSION-START-HERE.md            # Fresh AI session bootstrap
├── SSOT-REFACTOR-LOG.md             # Architectural decision log (chronological)
├── OWNER-POLICY-FOR-AI-SESSIONS.md  # AI collaboration policy
└── README.md                        # Project overview
```

### 3.3 Architecture Pattern — Pure Helpers + DI Service

Pola yang konsisten across tiers:

```
┌─────────────────────────────────────────────────┐
│ App.tsx (UI orchestration, useState, useCallback)│
│ ├─ Thin handler wraps pure function             │
│ └─ Service deps injected (BUKAN imported global)│
└─────────────────────────────────────────────────┘
                  │
                  ▼ (DI: services + state passed in)
┌─────────────────────────────────────────────────┐
│ utils/*.ts — Pure helpers, async orchestrators  │
│ ├─ Testable via Vitest mocks                    │
│ ├─ Returns discriminated union results          │
│ └─ NO direct supabase import — service injected │
└─────────────────────────────────────────────────┘
                  │
                  ▼ (calls service module)
┌─────────────────────────────────────────────────┐
│ services/*.ts — Supabase wrapper                │
│ ├─ Returns typed promises                       │
│ ├─ Throws on error (caller handles)             │
│ └─ NO defense-in-depth bypass (e.g. NO          │
│    updateSnapshot for R7c immutability)         │
└─────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Supabase PostgREST + PostgreSQL + Triggers       │
│ ├─ RLS policies enforce row-level access        │
│ ├─ DB triggers enforce invariants               │
│ │  (e.g. R7c snapshot_pok immutability trigger) │
│ └─ JSONB columns untuk flexible payloads        │
└─────────────────────────────────────────────────┘
```

**Pattern rationale:** project tidak punya React Testing Library, jadi handler-level testing dilakukan via pure function orchestrator dengan service deps injected. Ini codified di SSOT §0.12.10 — pattern yang adopt-able untuk SIMRS BT.

---

## 4. Schema Overview — JSONB Envelope Pattern

### 4.1 Pattern Inti — Hybrid Columned + JSONB

SIKESUMA pakai **hybrid schema**: kolom columned untuk query-heavy fields (status, tahun, jenis, dll.) + JSONB column untuk flexible structured payloads.

**Contoh table `usulan_revisi` (Tier 5a):**

```sql
CREATE TABLE usulan_revisi (
  id              UUID PRIMARY KEY,
  tahun_anggaran  INTEGER NOT NULL,      -- columned (filterable)
  jenis           TEXT NOT NULL,          -- columned ('revisi_pok' | 'rekomendasi_internal')
  status          TEXT NOT NULL,          -- columned (state machine)
  data            JSONB NOT NULL,         -- flexible: { justifikasi, lhr_apip, ... }
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_usulan_status_tahun ON usulan_revisi(status, tahun_anggaran);
CREATE INDEX idx_usulan_data_gin ON usulan_revisi USING GIN (data);
```

**Rationale (R1c decision SSOT §0.12.1):**
- Columned fields untuk filter list query (e.g. "draft di TA 2026") → fast index lookup
- JSONB untuk justifikasi/lhr_apip/dasar_perintah → flexible tanpa schema migration
- GIN index untuk full-text search di JSONB kalau dibutuhkan

### 4.2 Main Tables Inventory (top-level)

| Table | Purpose | Tier |
|---|---|---|
| `pagu_sections` | Pagu structure per tahun | 1 (foundation) |
| `rpds_data` | RPD (Rencana Penarikan Dana) per tahun | 1 |
| `rab_categories` | RAB categories + narratives | 1 |
| `payroll_statuses` | Status pengajuan gaji per ID | 1 |
| `jasa_verification_files` | Metadata file jasa medis per periode | 1 |
| `jasa_account_map` | Mapping kategori jasa ke akun BAS | 1 |
| `bpjs_settings_history` | History setting BPJS per periode | 1 |
| `bpjs_payments` | Payment ledger BPJS | 1 |
| `system_settings` | Global app settings (JSONB-only) — e.g. `lhr_apip_global` Tier 5a Phase 2.5 | 1 |
| `audit_log` | Application-level audit (Step 3.2 era, predates Tier 5) | 1 |
| **`usulan_revisi`** | Header pengajuan Revisi POK | **5a (audit)** |
| **`usulan_revisi_perubahan`** | Diff per row (Pagu before/after) | **5a (audit)** |
| **`snapshot_pok`** | Snapshot POK lengkap saat berlaku_efektif (R7c immutable) | **5a (audit)** |

Lihat repo `types.ts` untuk type definitions lengkap + `migrations/tier-5-*.sql` untuk DDL Tier 5.

### 4.3 JSONB Envelope Convention

Setiap table dengan JSONB column pakai **envelope shape** yang konsisten:

```typescript
// Conceptual schema untuk envelope JSONB
interface UsulanRevisiData {
  tanggal_pengajuan: string;                  // ISO date
  diusulkan_oleh: string;                     // Sie Renbang | KPA | ...
  justifikasi: string;                        // free text
  dasar_perintah?: string;
  lhr_apip?: UsulanLhrApip;                   // R3c tied audit (Tier 5a Phase 2.5)
  validation_attempts?: ValidationAttempt[];
  manual_overrides?: ManualOverrideEntry[];   // R6+ override audit
  template_sk_metadata?: TemplateSkMetadata;  // β forward-compat Tier 6
}
```

**Pattern proven:** SIMRS BT bisa adopt envelope shape ini untuk modul yang butuh audit trail. Schema migration ringan (add field optional ke JSONB) tanpa DDL change. Lihat SSOT §0.12.1 untuk decision history.

---

## 5. Validation Engine — 12 Validators C1-C12

### 5.1 Posisi Strategic

12 validators C1-C12 adalah **gate Submit Revisi POK**. Semua harus PASS + LHR APIP acknowledged baru Submit button enables.

**Filosofi design (Tier 4):**
- Setiap validator = pure function `(paguSections, context) => ValidationResult`
- Testable via Vitest (200+ test cases di `utils/validators/c*.test.ts`)
- UI-agnostic — bisa run di server (future API) atau di browser
- Komposisi: dashboard memanggil semua 12, surface fail constraint per row

### 5.2 Validator Catalog

| ID | Nama | Tier | Constraint yang dicek |
|---|---|---|---|
| **C1** | Kode akun non-empty | 4a | Setiap row pagu wajib punya kode akun (string non-blank) |
| **C2** | Volume + harga satuan numeric | 4a | Numeric coercion, no NaN/null untuk row leaf |
| **C3** | Total = volume × harga satuan | 4a | Computed match (rounding tolerance) |
| **C4** | Section title non-empty | 4a | Section header tidak boleh blank |
| **C5** | No duplicate kode di section yang sama | 4a | Within-section uniqueness |
| **C6** | BAS segment compliance | 4b | Kode akun match pattern 6-segment per KEP 211/291/331 |
| **C7** | Anggaran sum reconciliation | 4b | Total Pagu = sum of section totals = sum of RPD per bulan |
| **C8** | LHR APIP acknowledged | 4b | Checkbox + (Tier 5a Phase 2.5) global state persisted |
| **C9** | Justifikasi non-empty | 4b | Revisi POK butuh justifikasi text |
| **C10** | Cross-section dependencies | 4c | Specific constraint per Perdirjen Renhan 7/2025 |
| **C11** | Strategy compliance (T9 toggle) | 4c | Owner-configurable strategy filter |
| **C12** | Final consistency check | 4c | Aggregate sanity check |

Lihat `utils/validators/c*.ts` + `*.test.ts` untuk implementasi detail.

### 5.3 Relevance untuk SIMRS BT

Kalau SIMRS BT Phase 2.2 membangun **accounting modul** (e.g. expense tracking, vendor billing), pattern validator ini adalah **canonical reference**:

- Pure function signature
- Discriminated union result (`{ kind: 'pass' } | { kind: 'fail'; reason: string; rowId?: string }`)
- Composability — dashboard aggregates results, surface ke UI
- Test-friendly (no UI dependency)

C6 BAS segment compliance specifically dipakai untuk SIMRS BT akuntansi RS yang link ke POK — schema 6-segment BAS reusable verbatim.

---

## 6. Audit Trail Tier 5 — State Machine + Immutability

### 6.1 Latar Belakang

Itjenad + BPK audit RS Militer butuh **clean data lineage**: setiap Revisi POK harus dapat di-trace dari draft → final SK → effective date, dengan **immutable snapshot** dari POK state saat effective.

Tier 5a Phase 1.5 - 2.5 (12-13 Mei 2026) build this audit backbone:

- 3 tables: `usulan_revisi`, `usulan_revisi_perubahan`, `snapshot_pok`
- State machine 6 rules + R6+ manual override
- DB trigger enforces snapshot immutability (R7c)
- App layer defense-in-depth: NO `updateSnapshot` function di service module
- 124 tests covering state transitions + service layer + Submit flow + LHR APIP

### 6.2 State Machine

```
                       ┌─────────────────────────────┐
                       │ [R6: any → ditolak permissive]│
                       │ [R6+: any → any Manual Override]│
                       └─────────────────────────────┘

  draft ──[validators PASS + lhr_apip ACK]──▶ direkomendasi
                                                   │
                                                   ▼ [R5a Sie Renbang proxy]
                                            diteruskan (to KPA)
                                                   │
                                                   ▼ [SK terbit]
                                              ditetapkan
                                                   │
                                                   ▼ [effective date + R2b full snapshot]
                                          berlaku_efektif  ←── TERMINAL
                                                   │
                                       (R7c: snapshot immutable forever)
```

**6 rules** di `utils/usulanRevisiStateMachine.ts` (Tier 5a Phase 2.2). 46 tests covering all transitions.

### 6.3 R7c Immutability Defense

Snapshot table tidak boleh di-update setelah create. Defense di **2 layers**:

1. **DB trigger** (Phase 1.5 DDL):
   ```sql
   CREATE OR REPLACE FUNCTION prevent_snapshot_update() RETURNS TRIGGER AS $$
   BEGIN
     RAISE EXCEPTION 'immutable per Tier 5 R7c';
   END;
   $$ LANGUAGE plpgsql;
   CREATE TRIGGER snapshot_pok_no_update BEFORE UPDATE ON snapshot_pok
     FOR EACH ROW EXECUTE FUNCTION prevent_snapshot_update();
   ```

2. **App layer** (Phase 2.3 service):
   - `services/usulanRevisiService.ts` punya `createSnapshot`, `getSnapshotByDate`, `listSnapshots`
   - **TIDAK ada `updateSnapshot` export** — bukan typo, sengaja absent
   - Test guards: `'R7c defense — no update*Snapshot* export'` (regex check di test suite)

### 6.4 Relevance untuk SIMRS BT

Pattern audit trail ini sangat relevant untuk SIMRS BT modul yang butuh:
- Approval workflow (e.g. expense reimbursement, vendor PO)
- Audit-defensible history (Itjenad / BPK readiness)
- Time-travel viewer (e.g. "data RS tanggal X tahun lalu seperti apa")

Adopt pattern: state machine di `utils/`, immutability defense di DB + app, snapshot per terminal transition.

---

## 7. Tier-based Roadmap Status

### 7.1 Completed Tiers (in main `b1239f4`)

| Tier | Scope | Completed | Commit |
|---|---|---|---|
| **1+2** | Re-architecture (master domain doc + LaporanRevisi workflow corrected) | 11 Mei 2026 | (multiple) |
| **3** | JSONB-native metadata schema + recommender + UI integration | 11 Mei 2026 | `6c8f640` |
| **4a** | Validators C1-C5 + UI integration | 11 Mei 2026 | `abe193c` |
| **4b** | Validators C6-C9 + LHR APIP checkbox + Submit triple gating | 11 Mei 2026 | `d13be80` |
| **4c** | Validators C10-C12 + T9 strategy toggle + cross-tab nav | 12 Mei 2026 | `9174782` |
| **5a** | Audit Trail Backend (DDL + state machine + service layer + Submit flow + LHR APIP R3c + banner) | 13 Mei 2026 | `d55f0d0` |

### 7.2 Pending Tiers

| Tier | Scope | Timing |
|---|---|---|
| **5b** | UI tab Audit Trail Viewer (R8c partition 2) — consume Tier 5a service layer | Fresh AI session, defer sampai field feedback |
| **6** | Template SK Revisi POK Generator (β forward-compat sudah ada di `template_sk_metadata` field) | Fresh session, post-Tier-5b |
| **7+** | TBD — EWS (Early Warning System) untuk anggaran, BNHP enhancements, Itjenad export | TBD |

### 7.3 Production State

```
Production branch (Vercel sikesumav31.vercel.app):  90a0278 (Tier 4c) — belum ada Tier 5
Main branch (Vercel Preview):                       b1239f4 (Tier 5a + TS cleanup)
Divergence:                                          3 commits (d55f0d0 + 1954db5 + 999a46f + b1239f4)
```

Production promotion adalah **separate Owner-driven decision** — bukan blocked by AI session. Tunggu field test stability dari Sie Renbang sebelum promote.

---

## 8. Patterns Proven yang Relevant untuk SIMRS BT

Tabel quick-reference untuk SIMRS BT Phase 2 design:

| Pattern | Where in SIKESUMA | SIMRS BT relevance |
|---|---|---|
| **JSONB envelope schema** | `usulan_revisi.data` (Tier 5a), `system_settings.value` | All audit-trail tables, settings tables |
| **State machine + DI orchestrator** | `utils/usulanRevisiStateMachine.ts` + `submitRevisiHelpers.ts` | Approval workflows (expense, PO, RME amendment) |
| **Service module with DI** | `services/usulanRevisiService.ts` | All Supabase CRUD wrappers |
| **Pure validator + dashboard composition** | `utils/validators/c*.ts` + `ValidationDashboardHeader.tsx` | Pre-submit gates, business rule enforcement |
| **R7c immutability (DB + app layers)** | Phase 1.5 trigger + service layer NO updateSnapshot | Immutable audit records, snapshot tables |
| **Best-effort persistence + fail-safe UI** | LHR APIP `lhr_apip_global` (Tier 5a Phase 2.5) | Settings that should default to "safe" on persist fail |
| **JSONB getter/setter helper** | `lib/supabase.ts:194-207` (`getSetting<T>`, `saveSetting<T>`) | Generic system settings, feature flags |
| **Tier-based development** | This whole project | Phased rollout, each tier Owner-approved before next |
| **Squash merge feature → main** | All tier merges (`d55f0d0` etc.) | Clean main history, 1 commit per major feature |
| **Bootstrap mandatory reading per fresh session** | `SESSION-START-HERE.md` + bundle pattern | Onboarding new AI sessions / developers |

---

## 9. Bidirectional Knowledge Flow — Plan

### 9.1 Current State (13 Mei 2026)

| Flow direction | Status |
|---|---|
| Khanza Codex → SIKESUMA | Indirect — Khanza analyst spoke session sedang berjalan (paralel), output (`THE-KHANZA-CODEX.md`) belum ada |
| Khanza Codex → SIMRS BT | Direct upstream reference (per SIMRS Blueprint §4.1) |
| SIKESUMA → SIMRS BT | **Active now via dokumen ini + read-only access** (Phase 1 introduction) |
| SIMRS BT → SIKESUMA | Future — saat SIMRS BT Phase 2.2 modul accounting jalan, SIKESUMA consume operational data |

### 9.2 Phase 2 Expected Pattern (saat SIMRS BT membangun accounting)

```
SIMRS BT AI session     Owner brief        SIKESUMA AI session
  (Phase 2.2)             ───►              (continued tier work)
       │                                            │
       │  read SIKESUMA patterns                    │
       ├──────────────────────────────────────────► │
       │  (via THIS doc + repo + DB introspection)  │
       │                                            │
       │                  Owner async               │
       │  feedback ke Owner                         │
       │  ◄─────────────                            │
       │                                            │
       │  Owner consolidate + brief                 │
       │                  ────►                     │
       │                                            │
       │                                            │  Implement
       │                                            │  Tier-relevant
       │                                            │  adjustment
       │                                            │  (if any)
       │                                            │
```

**No direct AI-to-AI cross-touch.** Owner adalah single source of cross-project coordination.

### 9.3 API Contract Future (Tier 7+ atau SIMRS BT Phase 2.3+)

Saat SIMRS BT operational dan data flow active, SIKESUMA bisa consume via:
- Supabase Foreign Data Wrapper (FDW) — cross-database table reference
- REST API mediated (SIMRS BT punya endpoint untuk SIKESUMA)
- Event-driven (Supabase Realtime / webhook)

Pattern TBD di SIMRS BT Phase 2.3+ design. SIKESUMA tidak hard-code API contract sebelum SIMRS BT operational.

---

## 10. Anti-Patterns yang SIMRS BT Sebaiknya Hindari

Pelajaran dari journey SIKESUMA (Tier 1-5a) yang bisa preempt-kan pitfalls di SIMRS BT:

### 10.1 Schema Pitfalls

❌ **Hard-code domain ke schema** — Schema awal SIKESUMA (pre-Tier 3) menyimpan field-field BAS sebagai kolom terpisah. Tier 3 refactor JSONB-native menyelesaikan rigidity. SIMRS BT: pakai JSONB envelope sejak awal untuk fields yang mungkin evolve.

❌ **NO foreign key cascade enforcement** — Tier 3 era ada bug orphan rows (`rab_categories.section_id` orphan saat section di-delete). Fix via app-level cleanup loops + later DB constraint. SIMRS BT: define cascade behavior at schema level sejak DDL.

### 10.2 Workflow Pitfalls

❌ **Imperative state transition tanpa state machine** — Pre-Tier 5, status field di-update directly via UPDATE statements scattered di handlers. Result: invalid transitions slipped through (e.g. draft → berlaku_efektif skip review). Tier 5 state machine consolidates rules + tests. SIMRS BT: kalau punya workflow >2 states, design state machine sejak awal.

❌ **Ephemeral state untuk hal yang harus persisted** — LHR APIP awalnya `Record<number, boolean>` ephemeral useState (Tier 4b). User restart browser → lose acknowledgment → must re-check. Tier 5a Phase 2.5 migrate ke persisted `system_settings.lhr_apip_global`. SIMRS BT: kalau state berdampak ke audit trail atau approval flow, persist sejak V1.

### 10.3 Testing Pitfalls

❌ **No DI di async orchestrator** — Phase 2.3 service layer awalnya tightly coupled ke `supabase` import global. Phase 2.4 introduce `SubmitRevisiServices` DI interface — handler-level testing tanpa supabase mock global. SIMRS BT: DI pattern dari awal.

❌ **Skip handler-level testing karena "tidak ada React Testing Library"** — workaround SIKESUMA: extract orchestration ke pure function, test via Vitest dengan service mocks. SIMRS BT bisa adopt sama, atau commit ke Playwright / RTL early.

### 10.4 Documentation Pitfalls

❌ **Multi-source-of-truth untuk decisions** — Awal-awal proyek, decisions tersebar di chat history + scattered .md files. Konsolidasi ke `SSOT-REFACTOR-LOG.md` (per-tier numbered sections) jadi anchor. SIMRS BT: 1 file SSOT per project.

❌ **Drift dari handover bundle ke main session** — Multiple bundle revisions caused inconsistency. Solusi: BUNDLE-README dengan reading order + mandatory bootstrap steps. SIMRS BT: copy this bundle pattern.

---

## 11. Deep-Dive Pointers

Untuk topic-specific deep-dive, ini adalah file/section authoritative di SIKESUMA repo:

### 11.1 Architecture & Design

| Topic | Where |
|---|---|
| Master domain (POK, Revisi POK workflow) | `docs/REVISI-POK-PAGU-vKoreksi.md` (~400 lines) |
| Tier 5 design rationale | `docs/TIER-5-DESIGN.md` (R1-R8 + R6+ decisions) |
| BAS reference (KEP 211/291/331) | `KEP-211_PB_2018-*.md`, `KEP-291_PB_2022-*.md`, `KEP-331_PB_2021-*.md` (project knowledge) |
| Permenhan BMP | `Permenhan_5_2020_*.pdf` (project knowledge) |
| Glossary | `docs/glossary.md` |

### 11.2 Decisions & History

| Topic | Where |
|---|---|
| Architectural decisions log | `SSOT-REFACTOR-LOG.md` (§0.1-§0.12, chronological) |
| Tier 5 specific decisions | `SSOT-REFACTOR-LOG.md §0.12.1-§0.12.13` |
| Technical milestone history | `constants/devLog.ts` (chronological, with `type:` taxonomy) |
| Current state authoritative | `HANDOVER.md` |

### 11.3 Implementation Reference

| Topic | Where |
|---|---|
| State machine rules | `utils/usulanRevisiStateMachine.ts` |
| Service CRUD | `services/usulanRevisiService.ts` |
| Submit flow orchestrator | `utils/submitRevisiHelpers.ts` |
| 12 Validators | `utils/validators/c1.ts` ... `c12.ts` |
| LHR APIP R3c helpers | `utils/submitRevisiHelpers.ts:259-378` (Tier 5a Phase 2.5 section) |
| JSONB getter/setter | `lib/supabase.ts:194-207` |
| Type canonical | `types.ts` |

### 11.4 Operational

| Topic | Where |
|---|---|
| Live URL production | `https://sikesumav31.vercel.app` (Tier 4c state) |
| Live URL main preview | Cek Vercel Dashboard atau GitHub commit page untuk URL preview branch |
| Supabase Dashboard | `https://qjijsftbytozcoyrtric.supabase.co` (via Owner credential) |
| GitHub repo | `https://github.com/urrenbatik-cloud/SIKESUMAv3.1` (public) |

### 11.5 AI Session Policy

| Topic | Where |
|---|---|
| Owner-AI collaboration policy | `OWNER-POLICY-FOR-AI-SESSIONS.md` (Addendum v1.0 - v1.5) |
| Bootstrap mandatory steps | `SESSION-START-HERE.md` |
| Bundle pattern | `BUNDLE-README.md` di setiap handover ZIP |

---

## 12. Document Lifecycle

### 12.1 Versioning

| Versi | Tanggal | Perubahan | Author |
|---|---|---|---|
| 1.0 | 13 Mei 2026 | Initial holistic introduction post Tier 5a MERGED + TS cleanup | SIKESUMA AI session (Owner-supervised) |

### 12.2 Update Protocol

Dokumen ini di-update saat:

- **Tier baru MERGED** ke main yang significantly change scope SIKESUMA (e.g. Tier 5b, Tier 6 done)
- **Schema evolution** yang impact SIMRS BT integration plan (e.g. new tables, breaking changes)
- **API contract** SIKESUMA ↔ SIMRS BT formalized (Tier 7+ atau SIMRS BT Phase 2.3+)
- **Boundary clarification** kalau SIMRS spoke session menemukan ambiguity

**Update protocol:** SIKESUMA AI session (sesi terpisah, Owner-supervised) edit doc ini, paired commit + push, sync via doc ini ke SIMRS spoke session.

### 12.3 Boundaries — Sekali Lagi

Dokumen ini READ-ONLY for SIMRS spoke session. SIMRS spoke session **TIDAK boleh**:

- Edit doc ini langsung di repo SIKESUMA
- Push commit ke branch SIKESUMA
- Modifikasi entry di SIKESUMA Supabase
- Trigger Vercel deployment SIKESUMA

Update request → lewat Owner → SIKESUMA AI session di sesi terpisah.

### 12.4 Ownership

Doc ini dimiliki oleh Owner (dr Ferry) sebagai bagian dari SIKESUMA repo. SIKESUMA AI session adalah delegated maintainer. SIMRS spoke session adalah delegated reader.

---

*End of introduction. Companion doc: `docs/SIMRS-SPOKE-READ-ACCESS.md` untuk access points + credentials placeholder.*
