# SSOT Refactor — Sprint A-E Chronological Log

**Purpose:** Primary reference untuk new spoke sessions. Chronological record dari semua development SSOT Refactor 1.1 Pagu Anggaran agar successor session **tidak bias atau drift** dari context yang sudah terbangun.

**Period:** 10-11 Mei 2026
**Trigger:** Kontak pertama dengan Angga (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal) — sebelumnya hanya asumsi domain dari tim dev.

**Status:**
- ✅ Sprint A (data model cleanup)
- ✅ Sprint B (BAS whitelist + HITL, 4 rounds)
- ✅ Sprint C (lattice enforcement)
- ✅ Sprint D Item #1 (Konteks 1 + Schema Integrity)
- ⏳ Sprint D Item #2+ (Year handling bug, multi-year, audit log CRUD)
- ⏳ Sprint E (LRA regression test, audit doc original update)

**Total Pagu TA 2025:** Rp 2,709,935,000.40 (verified after Sprint D Item #1, UI = DB synced)

---

## 0. Critical Domain Context untuk Successor

### 0.1 Status Kelembagaan RS Batin Tikal

RS Tk.IV 02.07.03 Batin Tikal adalah **Satker pelaksana di bawah Satker pengelola anggaran di Palembang** (jajaran Kesdam II/Sriwijaya), BUKAN BLU formal.

**Implikasi:**
- Seri kode BAS `525xxx` (Belanja Gaji RS BLU) **tidak relevan**.
- Setiap revisi POK butuh approval Palembang (future Sprint F).
- Tetap dalam ekosistem Kemhan/TNI → ada kode khusus (mis. `523122` BMP per Permenhan 5/2020).

### 0.2 Normative Logic Angga (Sie Renbang) — Wajib Dipatuhi

**Konteks 1 (10 Mei 2026):** Harga semula adalah baseline. Revisi opsional. Jika diperlukan revisi maka akun harga semula dilakukan revisi, **BUKAN konteks drop**. `Revisi=0` berarti "tidak ada revisi → effective = Semula", bukan "value zero".

**Konteks 4 (10 Mei 2026):** Konvensi subkode `.A`/`.B`/`.C` **HANYA untuk Belanja Pengadaan** (akun 532111). Reasoning: akun pengadaan sama tapi komponen pembelanjaan berbeda (Alsintor/Alkes/Alsatri). Akun lain tidak butuh ini karena beda komponen sudah ada beda akun di BAS.

**Konteks 6 (10 Mei 2026):** Akun `521119` = Belanja Operasional Lainnya. Akun `521112` = KHUSUS Belanja Pengadaan Bahan Makanan. **Jangan tukar** — sering jadi salah klasifikasi di section "Operasional Lainnya".

**Konteks 9 (10 Mei 2026):** Daftar istilah lokal yang punya potensi ambiguitas didokumentasikan di [`docs/glossary.md`](./docs/glossary.md). Successor wajib baca dulu sebelum kerja di tab 1.1 Pagu Anggaran.

### 0.3 3 Hard Blockers yang Sudah Resolved (Sprint B.4)

Audit doc original (yang sekarang [`SIKESUMA-Audit-BAS-Konformitas.md`](./SIKESUMA-Audit-BAS-Konformitas.md) — perlu update di Sprint E) **punya 3 kesalahan** yang resolved by Angga:

| HB | Audit doc lama (salah) | Konfirmasi Angga (benar) |
|---|---|---|
| **HB#1** | Obat & BMHP → `521813` | `521811` (Persediaan Barang Konsumsi). `521813` adalah Pita Cukai/Meterai/Leges, bukan ranah RS. |
| **HB#2** | Honor TKS/Nakes/Pengelola → `521213` (insidentil) | `521115` (continuous monthly). Honor di RS Batin Tikal semua monthly continuous, bukan output-tied. |
| **HB#3** | BMP (BBM) → `521211` (ATK) | `523122` (BMP Kemhan). BMP adalah BBM kendaraan/genset per Permenhan 5/2020. Kode `521211` adalah ATK. |

Detail: [`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md).

### 0.4 14 HITL Recommendations Dictionary (Approved by Angga)

File: [`utils/internalRecommendations.ts`](./utils/internalRecommendations.ts).

| ID | Trigger pattern | kode_bas | Catatan |
|---|---|---|---|
| ATK-001 | `/atk/`, "alat tulis kantor" | `521811` | Sub-rincian dari Bekkes (per Angga: ATK di RS dianggap konsumsi sehari-hari bagian Bekkes, bukan barang habis pakai operasional kantor terpisah) |
| JASA-RUJUKAN-001 | `/diagnostik|laundry|pembayaran rujuk/` | `521119` | Rujukan diagnostik + laundry pakai 521119, BUKAN 521112 (yang khusus Bahan Makanan) |
| HONOR-001 | `/honor|tks|nakes|pengelola|casemix/` | `521115` | Continuous monthly, BUKAN 521213 insidentil |
| BMHP-001 | `/obat|bmhp|gas medis|oksigen|reagen|linen pasien/` | `521811` | Persediaan Barang Konsumsi, BUKAN 521813 Pita Cukai |
| BMP-001 | `/bmp|bbm|pertamax|solar/` | `523122` | Kemhan-specific per Permenhan 5/2020 |
| UTILITAS-001 | `/listrik|pln/` | `522111` | Status: persiapan (belum aktif karena subsidi belum berakhir) |
| UTILITAS-002 | `/air|pdam/` | `522113` | |
| UTILITAS-003 | `/internet|telepon|wifi/` | `522112` | |
| BPD-001 | `/bpd|perjalanan dinas/` | `524111` | Default dalam negeri |
| PENGADAAN-MODAL-001 | `/alsintor|alsatri|alkes|peralatan dan mesin/`, item names | `532111` | Sub `.A`=Alsintor, `.B`=Alkes, `.C`=Alsatri **(KONFIRMASI ANGGA 10 Mei 2026)** |
| MODAL-LAINNYA-001 | `/aplikasi|software|license|xdr/` | `536111` | Reject 5-digit typo `53611` |
| SERAGAM-001 | `/seragam|pakaian dinas/` | `521219` | Pelaksana seragam |
| OPERASIONAL-LAINNYA-001 | `/belanja (barang )?operasional/` | `521119` | Reject 521112 (Bahan Makanan) — Konteks 6 |
| BAHAN-MAKANAN-001 | `/makan pasien|bahan makanan/` | `521112` | KHUSUS makanan |

---

## 1. Sprint A — Data Model Cleanup (3 commits)

| Item | Commit | Description |
|---|---|---|
| A.1 | `29f740b` | Hapus zombie field `PaguRow.realisasi` (tidak pernah dipakai, source of stale data) |
| A.3 | `3d81837` | Tambah field `tahun` eksplisit ke `PaguSection` (ganti id-pattern parsing yang fragile) |
| A.2 | `521fe71` | Derive `RPDRow.totalBudget` dari Pagu via `paguLookup` helper (Opsi A strict — SSOT enforcement) |

**Decision (A.2):** Opsi A strict — RPD `totalBudget` BUKAN stored, selalu derived dari Pagu via `lookupPagu(kode)`. Risk: kalau Pagu kode tidak ditemukan, return `null` dan UI display "INVALID KODE" — surface error early.

---

## 2. Sprint B — BAS Whitelist + HITL (8 commits, 4 rounds)

### Round 1 (commits `fd084ab`, `87638ff`, `c263c28`, `e36bb7d`, `200f7c2`)

- **B.1 `fd084ab`** — Seed `utils/basDictionary.ts` dengan 4,314 codes dari KEP-331/2021 + KEP-291/2022
- **B.2 `87638ff`** — Tambah optional field `kode_bas` ke `PaguRow` type
- **B.5 `c263c28`** — Rename `linkedSectionId` → `linkedPaguSectionId` (clarity)
- **B.6 `e36bb7d`** — Autocomplete dual-mode: BAS lookup + HITL recommendations badge
- **B.4 `200f7c2`** — Backfill `kode_bas` ke 37 rows + resolve 3 hard blockers (HB#1/2/3 per Angga konfirmasi)

### Round 2 (commit `f3ce491`)

Internal HITL recommendation dictionary foundation — 9 entries di `utils/internalRecommendations.ts` dengan rejected_alternatives + justification + source attribution + approvedDate.

Plus 12 mutations + reverts di Supabase live setelah Angga restructure data via app (Honor jadi monthly, modal jadi multi-level `.A`/`.B`).

### Round 3 (commit `e30711f`)

- Expand HITL dictionary 9 → 14 entries
- Buat [`docs/glossary.md`](./docs/glossary.md) per request Angga (Konteks 9)
- Fix Konteks 6: row `pagu-2025-operasional/row-1778398624667-...` (BELANJA BARANG OPERASIONAL LAINNYA): kode_bas `521112` → `521119` ✅
- Backfill 11 new rows kode_bas + revert 2 orphan parents (521311, 521411 invalid BAS)
- Surface 1 typo: kode `53611` 5-digit (Aplikasi XDR) untuk Angga validate

### Round 4 (commit `fbe40f4`)

- Apply konfirmasi final Angga:
  - kode `53611` → `536111` (Belanja Modal Lainnya) ✅
  - kode `532111.B` (header ALSATRI) → `532111.C` ✅
- HITL PENGADAAN-MODAL-001 justification dapat tag "KONFIRMASI ANGGA 10 Mei 2026"
- Coverage final: 59/61 (96%) — 2 sisa orphan parents di dummy 2024 (by design)

---

## 3. Sprint C — Lattice Enforcement (5 commits)

| Item | Commit | Description |
|---|---|---|
| C.3 | `f1f968f` | `IV-ORPHAN` severity WARNING → ERROR + tangkap semua codes |
| C.4 + C.5 | `44559a4` | Bill state machine validator (`utils/billStateMachine.ts`) + Draft default + akun gate |
| C.1 | `30b9118` | `IV-DUP-PAGU` bucket check (soft block L1 — duplicate kode lintas section) |
| C.2 | `7cf9212` | `IV-RPD-OVER-PAGU` + RPD overspend banner (soft block L5) |

Bucket sekarang punya **5 IV checks** total. Lihat [Architecture Highlights → SSOT Lattice & IV Checks](./README.md#ssot-lattice--iv-checks-sprint-a-d).

---

## 4. Sprint D Item #1 — Konteks 1 Fix + Schema Integrity (commit `5e85264`, 11 Mei 2026)

### 4.1 Bug Discovery (via screenshot vs API consistency check)

Saat user upload 7 screenshot Vercel app, ditemukan **inkonsistensi besar** vs API fetch:

| Metrik | Doc v2.0 API | UI Screenshot | Selisih |
|---|---:|---:|---:|
| Total Pagu TA 2025 | Rp 1,364,887,325 | Rp 2,571,940,000.40 | Rp 1.2M (47% under-count!) |

**Root cause:** Field `jumlahBiayaRevisi` di Supabase TIDAK ter-sync dengan `hargaSatuanRevisi × volume`. 30 rows have mismatched fields. UI compute correct on-the-fly, tapi DB stores stale → IV checks & LRA aggregator silent wrong.

### 4.2 Bug Konteks 1 (per normative logic Angga)

Setelah cross-check dengan Angga: aplikasi treat `hargaSatuanRevisi=0` sebagai literal drop ke nol. Padahal per normative logic Angga: "harga semula adalah baseline. revisi opsional. Revisi=0 BUKAN drop — fallback ke Semula".

**4 leaf rows affected:**

| Section | Kode | Description | Semula | Revisi sebelum |
|---|---|---|---:|---:|
| `pagu-2025-bekkes` | `521811.05` | Obat & BMHP YANMASUM (REKANAN) | Rp 72,995,000 | 0 |
| `pagu-2025-jasa` | `521115.04` | HONOR PENGELOLA YANMASUM | Rp 5,000,000 | 0 |
| `pagu-2025-modal` | `532111.06.A` | PENGADAAN ALSINTOR (BPJS) | Rp 40,000,000 | 0 |
| `pagu-2025-operasional` | `521112.01` | BELANJA PENGADAAN BAHAN MAKANAN (YANMASUM) | Rp 20,000,000 | 0 |
| **TOTAL hilang** | | | | **Rp 137,995,000** |

### 4.3 Migration Applied (Opsi A Strict, approved by user)

- **Rule 1:** Untuk 4 rows tersebut → set `hargaSatuanRevisi = hargaSatuanAwal` (mirror Semula ke Revisi)
- **Rule 2:** Untuk 41 leaf rows → sync `jumlahBiayaAwal/jumlahBiayaRevisi = hargaSatuanXxx × volume`
- **Rule 3:** Parent rows → bubble-up sum from direct children

**Total Pagu TA 2025:**
- Sebelum: Rp 2,571,940,000.40
- Sesudah: **Rp 2,709,935,000.40** (+Rp 137,995,000)
- Verified: UI = DB synced ✅

### 4.4 Code Fixes (Prevent Recurrence)

**`components/PaguAnggaran.tsx` `handleRowChange`:**
- Saat user edit `hargaSatuanAwal` AND `oldRevisi` was 0 or = oldAwal → auto-mirror `hargaSatuanRevisi = newAwal`
- Saat user edit `hargaSatuanAwal`/`hargaSatuanRevisi`/`volume` → auto-sync `jumlahBiayaAwal/jumlahBiayaRevisi = harga × volume`

**`utils/paguLookup.ts` (helper baru):**
- `getEffectiveValue(row, mode)` — defensive aggregator helper
- Mode `'REVISI'`: fallback ke Semula jika Revisi=0 (Konteks 1)
- Mode `'AWAL'`: `hargaSatuanAwal × volume`
- `lookupPagu` + `buildPaguByKode` sekarang pakai helper

**`utils/realisasiBucket.ts`:**
- `totalPagu` computation → pakai `getEffectiveValue`
- `paguByKode` build (IV checks input) → pakai `getEffectiveValue`
- Defensive: even if data stale di future, aggregator hitung correct

**`lib/migrations/d1_fix_revisi_fallback.ts` (baru):**
- TypeScript replica dari migration yang sudah di-apply via Python
- Idempotent — safe re-run kalau perlu
- Audit trail di repo

---

## 5. Pending Work

### 5.1 Sprint D Item #2+ (Belum Mulai)

1. **Year handling bug** di `utils/realisasiBucket.ts` line 153 — default `tahun = 2025` saat `selectedYear='ALL'`. Perlu fix supaya bucket aggregator handle multi-year correctly.
2. **Multi-year `paguByKode` lookup** — saat ini single-year only. Untuk regression test LRA multi-tahun, butuh extend.
3. **Audit log CRUD** — per Angga Section 4 saran: `IV-OVER-PAGU` upgrade butuh override mechanism dengan `audit_log` entry yang justifikasi.

### 5.2 Sprint E (Priority Angga — Belum Mulai)

1. **LRA aggregator regression test** — Angga's explicit Section 4 concern: angka LRA per Lampiran sebelum & sesudah B.4 backfill harus identik. Butuh snapshot before/after dan compare.
2. **Update audit doc original** — `SIKESUMA-Audit-BAS-Konformitas.md` Section 1.2 + 3 dengan HB#1/2/3 corrections per CORRIGENDUM.

### 5.3 Sprint F (Proposal Future)

1. **Workflow approval Palembang gate** — revisi POK / restrukturisasi section pagu / upgrade kode lintas seri 52→53 → trigger notifikasi Palembang via staging table sebelum commit. Audit log per change dengan reasoning.
2. **HITL UI di Settings tab** — Angga input HITL recommendations langsung via UI (saat ini perlu edit `utils/internalRecommendations.ts` di repo).

---

## 6. Important Caveats untuk New Spoke Sessions

### 6.1 ⚠️ Data is Disposable (Saat Ini)

Per user statement: data Pagu TA 2025 di Supabase live akan **di-wipe dan reload** setelah roadmap A-E stable. Jadi current values bisa berubah; **logic + code adalah yang penting**, bukan specific numbers.

### 6.2 ⚠️ Pre-existing TS Errors (Tidak Touched)

Beberapa TS errors yang **bukan dari Sprint A-D** dan **tidak boleh** di-fix tanpa konfirmasi:
- `App.tsx` line 573, 805, 818 — `forEach/tks/nakes/pengelola` on unknown type
- `PaguAnggaran.tsx` line 272 (was 242 pre-Sprint D, shifted by handleRowChange edit) — `.join()` on unknown
- `constants/devLog.ts` line 287, 315, 1044 — DevLogAuthor type mismatch

TS check command yang filter pre-existing:
```bash
npx tsc --noEmit --skipLibCheck 2>&1 | \
  grep -E "error TS" | grep -v "TS2688" | \
  grep -v -E "App\.tsx\((573|805|818)|PaguAnggaran\.tsx\(272|devLog\.ts\((287|315|1044)"
```

### 6.3 ⚠️ Tab 1.2 RAB Belum di-Review

Per Angga: "sementara fokus pada 1.1 Pagu Anggaran dulu". **Jangan ekspansi ke tab 1.2 RAB review** tanpa request explicit. HITL infrastructure (autocomplete + recommendations) sudah ready untuk diaktifkan di RAB — tinggal pass `description` prop saat siap.

### 6.4 ⚠️ Dummy TA 2024 Dipertahankan

Per user keputusan (11 Mei 2026): **dummy TA 2024 di-keep untuk regression test Sprint E**. **Jangan hapus** sampai Sprint E selesai. Coverage 96% (59/61) memang ada 2 orphan parents di dummy 2024 (kode 521311, 521411 invalid BAS — by design).

### 6.5 ⚠️ Honor Nominal Confirmed Annual (BUKAN Monthly)

Pernah ada false alarm di doc v2.0 yang bilang "Honor monthly nominal". **FALSE.** Honor TKS/Nakes/Pengelola di RS Batin Tikal **semua annual** (TKS Rp 195jt, Nakes Rp 786jt, Pengelola Rp 48jt). False alarm dulu karena baca field `jumlahBiayaRevisi` yang stale (sebelum Sprint D Item #1 fix). Successor sessions jangan terjebak lagi.

### 6.6 ⚠️ ATK = 521811 (BUKAN 521111)

Per Angga konfirmasi: di RS Batin Tikal, ATK di-bundle dengan Bekkes (`521811.03`) bukan dipisah ke `521111` (Belanja Keperluan Perkantoran). Reasoning: di RS, ATK adalah konsumsi sehari-hari bagian dari Bekkes operasional. HITL ATK-001 sudah encode ini.

### 6.7 ⚠️ Effective Value Formula (Aggregator Mandate)

**JANGAN baca `jumlahBiayaAwal`/`jumlahBiayaRevisi` field langsung di aggregator/IV check.** Pakai `getEffectiveValue(row, mode)` dari `utils/paguLookup.ts`. Field DB bisa stale di future (bug-resilient). Helper sudah handle Konteks 1 fallback + schema integrity.

---

## 7. File Reference Map

### Source code (touched by Sprint A-D)

- `types.ts` — `PaguRow` (added `kode_bas` field), `PaguSection` (added `tahun` field)
- `App.tsx` — year switching logic
- `components/PaguAnggaran.tsx` — `handleRowChange` (Sprint D Item #1 fix)
- `components/RAB.tsx`, `components/RPD.tsx` — RPD overspend banner (Sprint C.2)
- `components/RealisasiRPD.tsx`, `components/OperationalBilling.tsx` — pelaksanaan
- `components/KodeAutocomplete.tsx` — autocomplete UI dengan HITL badge (Sprint B.6)
- `utils/basDictionary.ts` — 4,314 BAS codes (Sprint B.1)
- `utils/internalRecommendations.ts` — 14 HITL entries (Sprint B Round 2-4)
- `utils/paguLookup.ts` — `getEffectiveValue` helper (Sprint D Item #1)
- `utils/realisasiBucket.ts` — 5 IV checks (Sprint C) + use `getEffectiveValue` (D.1)
- `utils/billStateMachine.ts` — bill state machine (Sprint C.4)
- `utils/deviationMetrics.ts`
- `lib/supabase.ts`

### Migrations (audit trail)

- `lib/migrations/a3_backfill_tahun.ts` — Sprint A.3
- `lib/migrations/b5_rename_linked_section_id.ts` — Sprint B.5
- `lib/migrations/b4_backfill_kode_bas.ts` — Sprint B.4
- `lib/migrations/d1_fix_revisi_fallback.ts` — Sprint D Item #1

### Documentation

- [`README.md`](./README.md) — primary entry, includes SSOT Lattice section
- [`docs/glossary.md`](./docs/glossary.md) — **start here untuk istilah lokal**
- [`SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`](./SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md) — HB#1/2/3 + Konteks 6 corrections
- [`SPRINT-B4-RESPONS-ANGGA.md`](./SPRINT-B4-RESPONS-ANGGA.md) — Angga normative log
- Sprint reports: `SPRINT-B4-MIGRATION-DIFF-REPORT.md`, `SPRINT-B4-ROUND2-DIFF-REPORT.md`, `SPRINT-B-ROUND3-REPORT.md`, `SPRINT-B-ROUND4-CLOSURE.md`
- This file: `SSOT-REFACTOR-LOG.md` — chronological + onboarding for successors

---

*Maintained by tim AI-Assisted Dev. Last updated: 11 Mei 2026 setelah Sprint D Item #1 closed.*
