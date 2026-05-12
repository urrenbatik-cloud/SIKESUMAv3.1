# SSOT Refactor — Sprint A-E Chronological Log

**Purpose:** Primary reference untuk new spoke sessions. Chronological record dari semua development SSOT Refactor 1.1 Pagu Anggaran agar successor session **tidak bias atau drift** dari context yang sudah terbangun.

**Period:** 10-11 Mei 2026
**Trigger:** Kontak pertama dengan Angga (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal) — sebelumnya hanya asumsi domain dari tim dev.

**Status:**
- ✅ Sprint A (data model cleanup)
- ✅ Sprint B (BAS whitelist + HITL, 4 rounds)
- ✅ Sprint C (lattice enforcement)
- ✅ Sprint D Item #1 (Konteks 1 + Schema Integrity)
- ✅ Sprint D Item #2 (UX Pagu Diff Visibility — 4 phases: Dashboard, Sintesis, Filter+Indicator, Print Laporan dual-mode, Ringkasan list)
- ✅ **Re-Architecture Tier 1+2 (11 Mei 2026)** — Master domain doc `REVISI-POK-PAGU-vKoreksi.md` integrated + LaporanRevisi.tsx fixed (workflow KPA Kakesdam II/Sriwijaya, disclaimer C2-C12 manual)
- ⏳ Tier 3+ (feature branches, fresh session) — Schema metadata + Validation C1-C12 + Audit trail
- ⏳ Sprint D Item #3+ (deferred) — Year handling bug, multi-year, audit log CRUD
- ⏳ Sprint E (Priority Angga, deferred) — LRA regression test, audit doc original update

**Total Pagu TA 2025:** Rp 2,709,935,000.40 (verified after Sprint D Item #1) — **status: historis (TA closed)**. TA 2026 belum mulai — fresh state untuk re-architecture.

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
| JASA-RUJUKAN-001 | `/diagnostik|ct scan|lab pa|pembayaran rujuk|laundry/` | `521119` | **PEMBAYARAN RUJUK PEMERIKSAAN DIAGNOSTIK** (kode internal `521119.01`, contoh: pembayaran sun clinic, CT scan di RS Primaya/RS lain, **jasa Patologi Anatomi oleh dokter praktek swasta dr SpPA**) + **LAUNDRY** (`521119.02`). Akun `521119` Operasional Lainnya — **BUKAN** `521112` (khusus Bahan Makanan), **BUKAN** `522191` (Jasa Lainnya umum — kurang aman audit; klasifikasi "jasa kesehatan" formal hanya untuk pelayanan langsung di satker sendiri, bukan rujukan ke rekanan eksternal — lihat justifikasi lengkap di `utils/internalRecommendations.ts:90-114`). *Catatan operasional Angga (11 Mei 2026): detail breakdown item rujukan diagnostik kemungkinan dipindahkan ke tab 1.2 RAB untuk granular tracking; di Pagu tinggal parent `521119.01`.* |
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

### 0.5 ⚠ Master Domain Reference — `REVISI-POK-PAGU-vKoreksi.md` v3 (11 Mei 2026)

**File:** [`docs/REVISI-POK-PAGU-vKoreksi.md`](./docs/REVISI-POK-PAGU-vKoreksi.md) (1145 baris, **versi v3**)

Dokumen master dari Sie Renbang via dr Ferry yang menjadi **authoritative source** untuk semua workflow Revisi POK + Revisi Pagu TA 2026. v3 substantively expand v2 dengan dasar hukum spesifik Kemhan/TNI.

**Pedoman tertinggi v3: Perdirjen Renhan Kemhan No. 7 Tahun 2025** (25 November 2025) sebagai *lex specialis* dari PMK 62/2023 jo. PMK 107/2024 untuk lingkungan Kemhan dan TNI.

**Konfirmasi identitas anggaran RS Batin Tikal (Section 12.2 v3, dari RKKS 2025):**
- Kementerian/Lembaga: **012** (Kementerian Pertahanan)
- UO: **22** (TNI Angkatan Darat)
- Satker: **685784** (Kesdam II/Sriwijaya) — satker pengelola
- Sub-Komponen: **F** (Rumkit Tk.IV Batin Tikal Pangkal Pinang)
- Program: **012.01.AC** (Profesionalisme dan Kesejahteraan Prajurit)
- Kegiatan: **6507** (Penyelenggaraan Kesehatan Matra Darat)
- KROs aktif: CAB (Sarana Bidang Kesehatan), CCB (OM Sarana), EBA (Layanan Dukungan Manajemen Internal)
- ROs: 1, 4, 5, 962
- Komponen: 3, 52

**Koreksi v3 atas v2:**
1. **KPA = Kakesdam II/Sriwijaya** spesifik (sebelumnya hanya generic "pejabat Palembang")
2. **Pasal references**: Pasal 22 (Revisi POK), Pasal 12-15 (Mekanisme Berjenjang), Pasal 24 (Batas Waktu) — semua Perdirjen Renhan 7/2025
3. **Constraint baru C8**: "Memperhatikan LHR APIP" (audit recommendations) — **Pasal 22 huruf b angka 2** Perdirjen Renhan 7/2025. Plus 2 constraint struktural yang sebelumnya tidak eksplisit di v2: **C11** (tidak ubah Halaman III DIPA / RPD — Lampiran I 5.d) dan **C12** (deadline 27 Desember — Pasal 24 ayat 11 huruf d).
4. **Deadline pemutakhiran POK = 27 Desember** (bukan 26 Desember seperti v2)
5. **5 sub-kategori Revisi POK** dari Lampiran I Bagian 5 (Section 3.2 v3)
6. **Rute formal**: Satker → UO Asren Kasad → Dirjen Renhan Kemhan (Pasal 12)
7. **Section 12 NEW**: 6 jawaban langsung Angga + struktur BAS dari RKKS 2025
8. **Section 13 NEW**: Template SK Revisi POK lengkap (5 sub-templates: 13.1 Surat Usulan, 13.2 Matriks Semula-Menjadi, 13.3 SK Revisi POK by Kakesdam, 13.4 Surat Pernyataan Tanggung Jawab KPA, 13.5 Template Kop Surat RS proposal)

**Koreksi fundamental atas pemahaman lama (carried over from v2):**
1. **Karumkit BUKAN KPA** — hanya pemberi rekomendasi internal
2. **Revisi POK punya 12 hard constraints (C1-C12)** per vKoreksi v3 §3.3 — canonical numbering aligned ke master domain doc (11 Mei 2026). C8 LHR APIP, C11 tidak ubah RPD, C12 deadline 27 Des = 3 yang baru atau dieksplisitkan di Perdirjen Renhan 7/2025 dibanding pedoman lama.
3. **Revisi POK yang menyentuh RPD bulanan otomatis naik** jadi Revisi DIPA Hal III (Kanwil DJPb)
4. **Forward-looking**: revisi berlaku sejak tanggal penetapan KPA
5. **BMP = Bahan Bakar Minyak dan Pelumas** (Permenhan 5/2020) → `523122` (BUKAN bahan makanan)

**Verifikasi BAS mapping dengan CORRIGENDUM (Section 12.2 v3):**
Struktur RKKS 2025 mengkonfirmasi semua HB#1/2/3 resolution **konsisten**:
- BEKKES → `521811` ✅ (bukan `521813`)
- Honor TKS/Nakes/Pengelola → `521115` ✅ (semua dalam 1 akun)
- BMP → `523122` ✅ (bukan bahan makanan)
- Bahan Makanan Pasien → `521112` ✅
- Pemeliharaan Gedung → `523111` ✅
- Pengadaan Alkes → `532111` ✅ (Belanja Modal 53)

### 0.6 Tier Roadmap Re-Architecture TA 2026 (per persetujuan dr Ferry, 11 Mei 2026)

Konteks: TA 2025 sudah lewat (data historis), TA 2026 belum mulai. Window yang tepat untuk re-architecture sebelum data live masuk.

**Branching strategy:**
- Minor (docs, fix kecil, refactor cosmetic) → **main** direct commit
- Major (schema, validation engine, workflow) → **feature branch** `feature/tier-N-description`, squash merge ke main

**Data policy (Konteks 4 dr Ferry):**
- SIKESUMA TIDAK auto-modify pagu_row data
- Migration data manual oleh Angga (Sie Renbang preference: "learning by doing")
- Aplikasi sebagai **recommendation engine** — suggest, Angga accept/reject/edit
- Schema migration ADD COLUMN dengan DEFAULT NULL (nullable, no data change)

| Tier | Scope | Branch | Status |
|---|---|---|---|
| **1** | Docs refresh — `docs/REVISI-POK-PAGU-vKoreksi.md` + SSOT log + README | main | ✅ DONE (11 Mei 2026) |
| **2** | Fix `LaporanRevisi.tsx` — title "Laporan"→"Usulan", signature 3-kolom (Sie Renbang + Karumkit rekomendasi + KPA Kakesdam II/Sriwijaya penetap), disclaimer C2-C12 manual aligned ke vKoreksi v3 §3.3 (post-align 11 Mei 2026) | main | ✅ DONE (11 Mei 2026) |
| **3** | Schema migration: add `kro_code`, `kegiatan_code`, `komponen_code`, `volume_ro`, `satuan_ro`, `sumber_dana_kode` (nullable) + recommendation engine pattern matching | `feature/tier-3-metadata-schema` | ⏳ Fresh session |
| **4** | Validation engine C1-C12 + live pre-flight check banner + block laporan jika hard violation | `feature/tier-4-validation-c1-c12` | ⏳ Fresh session (depends Tier 3) |
| **5** | Workflow state machine (Draft → Direkomendasi → Diteruskan → Ditetapkan → Berlaku Efektif) + audit trail per pengajuan + snapshot per tanggal penetapan + deadline H-7/H-1 | `feature/tier-5-audit-trail` | ⏳ Fresh session (depends Tier 4) |
| **6** | Future — sistem jendela revisi pagu (admin Palembang activation), multi-role permission, SBM check (C10), integrasi SAKTI | `feature/tier-6-*` (TBD) | ⏳ Far future |

---

### 0.7 Protokol Analisis Data — Wajib Dipatuhi (BARU 11 Mei 2026)

**Trigger penyusunan:** Pada sesi preflight 11 Mei 2026, AI Assistant melaporkan dua "drift" (leaf count 31 vs 38, dan total Rp 2,4M vs Rp 2,7M) yang ternyata **false positive** — root cause adalah bug script analisis (filter `level > 0` sebagai proxy leaf detection). Bug ini tidak mungkin terjadi lagi kalau ada protokol tertulis. §0.7 ini adalah pencegahannya.

**Cakupan:** Konvensi membaca + menganalisis `pagu_sections` data. Future extension: bills, audit_log, patient_claims (saat work expand ke tab lain).

---

#### 0.7.1 Konvensi Struktur `pagu_sections.data.rows`

`PaguSection.rows` (lihat `types.ts` line 132-149) mengizinkan **3 pola row** yang harus dikenali analyzer:

| Pola | Deskripsi | Contoh di TA 2025 |
|---|---|---|
| **(a) Parent + Children** | Row di `level=0` adalah aggregate header. Row berikutnya di `level≥1` adalah breakdown children. `jumlahBiaya*` parent = sum dari `jumlahBiaya*` children. | `pagu-2025-bekkes`: 521811 BELANJA BEKKES (L0) + 5 sub-rincian 521811.01..05 (L1) |
| **(b) Standalone Leaf di level=0** | Row di `level=0` TANPA children di bawahnya. Row ITU SENDIRI adalah leaf — bukan parent. | `pagu-2025-1778401538106`: 524111 BELANJA PERJALANAN DINAS (L0, no children, satu-satunya row di section) |
| **(c) Subkode .A/.B/.C (Konteks 4 Angga)** | KHUSUS untuk akun **532111 (Belanja Modal Pengadaan)**. Parent di L0 dengan subkode `.A`/`.B`/`.C`, children di L1 dengan format `{kode_induk}.{nomor}.{huruf}` (mis. 532111.06.A). | `pagu-2025-modal`: 532111.A ALSINTOR (L0) + 6 children → 532111.06.A, 532111.05.A, dst. |

**Catatan khusus 532111.C ALSATRI di TA 2025:** Saat ini muncul sebagai pattern **(b) standalone leaf di L0**, bukan pattern (c), karena rencana realisasi Alsatri (kursi/meja) baru di TA 2026 — belum ada sub-rincian. Pattern bisa berubah jika nanti ditambah breakdown.

**Empirical inventory TA 2025 (per snapshot 11 Mei 2026):**

| Section | Pola dominan | Rows | Leaves |
|---|---|---|---|
| pagu-2025-bekkes | (a) Parent+Children | 6 | 5 (L1) |
| pagu-2025-1778401175697 (Beban Langganan) | (b) ×2 | 2 | 2 (L0) |
| pagu-2025-1778402367617 (Baran Non Op) | (b) | 1 | 1 (L0) |
| pagu-2025-pemeliharaan | (a) | 3 | 2 (L1) |
| pagu-2025-jasa | (a) | 7 | 6 (L1) |
| pagu-2025-modal | (a) ×2 [+] (b) ×1 | 15 | 13 (12 L1 + 1 L0 standalone) |
| pagu-2025-1778401363129 (BMP) | (b) | 1 | 1 (L0) |
| pagu-2025-1778401538106 (BPD) | (b) | 1 | 1 (L0) |
| pagu-2025-1778402148153 (Modal Lainnya) | (b) | 1 | 1 (L0) |
| pagu-2025-operasional | (a) ×3 | 9 | 6 (L1) |
| **TOTAL** | | **46** | **38** ✓ match UI |

---

#### 0.7.2 Algoritma Leaf Detection (WAJIB)

```typescript
// CORRECT — traversal-based
function isLeaf(row: PaguRow, idx: number, rows: PaguRow[]): boolean {
  if (idx === rows.length - 1) return true; // last row in section
  const nextLevel = rows[idx + 1].level ?? 0;
  return nextLevel <= (row.level ?? 0);
}

// ❌ ANTI-PATTERN — filter by level > 0
// const leaves = rows.filter(r => (r.level ?? 0) > 0);
// Menyebabkan miss standalone leaves di L0 (lihat 0.7.3 empirical).
```

**Mengapa traversal-based, bukan level-based:** Schema mengizinkan pattern (b) standalone leaf di `level=0`. Tidak ada cara membedakan "L0 parent" vs "L0 standalone leaf" dari property row sendirian — harus lihat **konteks row berikutnya** dalam array.

---

#### 0.7.3 Effective Value Computation (Konteks 1 Angga)

Wajib pakai **`getEffectiveValue(row, mode)`** dari `utils/paguLookup.ts` saat kerja di TypeScript app. Untuk analisis external (Python preflight script, dll.), implementasi setara:

```typescript
function effectiveValue(row, mode: 'AWAL' | 'REVISI' = 'REVISI'): number {
  const vol = row.volume ?? 0;
  if (mode === 'AWAL') return vol * (row.hargaSatuanAwal ?? 0);
  const hr = row.hargaSatuanRevisi ?? 0;
  // Konteks 1: revisi=0 berarti "tidak ada revisi" → fallback ke harga awal
  return vol * (hr > 0 ? hr : (row.hargaSatuanAwal ?? 0));
}
```

**Trust hierarchy untuk read value:**
1. **Compute via formula** (`volume × hargaSatuan{Awal,Revisi||Awal}`) — primary source of truth
2. **Stored `jumlahBiaya{Awal,Revisi}`** — hanya boleh dipakai sebagai shortcut KHUSUS untuk leaves yang sudah dipastikan via 0.7.2, dengan catatan field bisa stale (Sprint D Item #1 case). Untuk parent rows, **jangan baca stored value** — sum dari children langsung.

---

#### 0.7.4 Verification Protocol (Sebelum Lapor)

Setiap session yang melakukan analisis aggregate WAJIB jalankan checklist berikut sebelum reporting:

1. **Hitung total dengan Strategy B** (traversal-based leaves + effective value)
2. **Cross-check dengan UI authoritative source:**
   - Tab 1.1 Pagu Anggaran → card "Pagu Semula" + "Pagu Revisi" + "Net Change" di header
   - Tab 1.4 LRA → tabel "Ringkasan Pagu per Kode Akun" → row "TOTAL N KODE AKUN" di bagian akhir
   - URL live: `https://sikesumav31.vercel.app`
3. **Cross-check dengan handover claim** (SSOT-REFACTOR-LOG §0 introduction)
4. **Reconcile discrepancy 100% sebelum lapor.** Jika selisih > Rp 0, jangan langsung sebut sebagai "drift" — **debug script dulu** dengan multi-strategy compare:
   - Strategy A: `level > 0` (jika ini hasil, script salah)
   - Strategy B: traversal-based leaves (ini benar)
   - Strategy C: jumlahBiaya stored fields di leaves only
   - Strategy D: query langsung total dari aplikasi (via DOM scrape atau UI screenshot)
   - Kalau B = C = D, hasil benar. Kalau B ≠ C, ada stale field (laporkan sebagai schema integrity issue, bukan total drift).

---

#### 0.7.5 Anti-Pattern yang TIDAK BOLEH Dilakukan

| # | Anti-Pattern | Konsekuensi Aktual / Potensial | Pengganti |
|---|---|---|---|
| AP-1 | Filter leaves dengan `row.level > 0` | Preflight 11 Mei 2026: miss 7 standalone leaves di L0 = Rp 284.945.000 (10,5% dari total) | Traversal-based `isLeaf` (§0.7.2) |
| AP-2 | Read `jumlahBiayaRevisi` di parent rows tanpa cross-check | Sprint D Item #1: stale value menyebabkan IV check + LRA aggregator silent wrong | Sum dari children effective values |
| AP-3 | Asumsi `data.tahun` exist di JSONB pagu_sections | 0/14 sections punya field per snapshot 11 Mei 2026 (runtime fallback di App.tsx:273) | Parse dari ID pattern `pagu-{YYYY}-*` jika field absent |
| AP-4 | Trust Supabase raw total tanpa cross-check UI | Bug script bisa silent — false positive ke owner | Selalu reconcile dengan tab 1.1 / 1.4 UI |
| AP-5 | Lapor "data drift" sebelum forensic | Time waste owner, hilang kredibilitas analyst | Forensic 3+ strategies + identify root cause dulu |
| AP-6 | Read `hargaSatuanRevisi=0` sebagai literal drop | Konteks 1 Angga: berarti "tidak ada revisi → fallback ke Semula" | `getEffectiveValue(row, mode)` (§0.7.3) |
| AP-7 | Implementasi recommendation engine yang auto-modify pagu_row data | Konteks 4 dr Ferry: violate "learning by doing" preference Angga | Recommendation only; explicit user accept/reject |
| AP-8 | Asumsi relational SQL schema saat menulis migration/DDL untuk SIKESUMA tables | Aktual semua tables (pagu_sections, bills, patient_claims, audit_log, doctors, phase_discussions, revenue_targets, jasa_verification_files) pakai **envelope JSONB pattern** `(id, data jsonb, audit cols)`. Spoke session Tier 3 blueprint (11 Mei 2026) sempat draft `ALTER TABLE pagu_row ADD COLUMN ...` — gagal karena `pagu_row` adalah TypeScript interface, BUKAN tabel SQL. Hanya `system_settings` yang pakai KV `(key, value, updated_at)`. | **Sebelum draft DDL apapun**, verify schema aktual via `curl ${SUPABASE_URL}/rest/v1/{table}?limit=1` + cek kolom returned. Cross-reference dengan HANDOVER §3 (catalog tabel + pattern) + types.ts (TypeScript interfaces). Default asumsi: SIKESUMA pakai envelope JSONB; field baru → extend types.ts interface + pass-through via existing upsert. DDL hanya dibutuhkan saat **add new table** (mis. Tier 5 `usulan_revisi`), bukan add column ke existing. |

---

#### 0.7.6 Konteks Angga yang Berkaitan dengan Analisis (Cross-Reference)

| Konteks | Penjelasan singkat | Berkaitan dengan AP-# |
|---|---|---|
| **Konteks 1** | Harga semula = baseline. `revisi=0` berarti "tidak ada revisi", bukan drop. Effective fallback ke Semula. | AP-2, AP-6 |
| **Konteks 3** | Item Baru / Breakdown kategori — "akun tambahan tidak direncanakan dari awal, atau detail breakdown dari akun general". Terlihat di UI Sintesis Revisi Pagu (tab 1.1) sebagai kategori ke-2 dari 4. *Catatan: belum ada penjelasan formal di SSOT log, tapi visible di kode `utils/paguDiff.ts`. Untuk Tier 3+ saat butuh detail, tanyakan ke Angga.* | (kategorisasi sintesis) |
| **Konteks 4 (dr Ferry)** | SIKESUMA = recommendation engine. TIDAK auto-modify pagu_row data. | AP-7 |
| **Konteks 4 (Angga)** | Subkode `.A/.B/.C` HANYA untuk 532111 (Belanja Modal Pengadaan). | Pattern (c) di §0.7.1 |
| **Konteks 6** | `521119` = Operasional Lainnya, `521112` = KHUSUS Bahan Makanan. Jangan tukar. | Validasi recommendation engine |
| **Konteks 9** | Glosarium lokal di `docs/glossary.md`. Wajib baca dulu. | Onboarding |

---

#### 0.7.7 Onboarding Probe Sequence

Setiap fresh AI session yang akan modify atau analyze data SIKESUMA WAJIB jalankan probe berikut **sebelum** mulai work:

```
1. Clone repo dengan PAT dari owner via session message
   (Jangan request PAT lagi jika sudah ada di context current session.)

2. Verify HEAD ≥ commit `2712754` (Tier 1+2 v3)
   git log --oneline -5

3. Verify file landmark exist + content sesuai:
   - types.ts:135       `kode_bas?` di PaguRow
   - utils/paguLookup.ts: function `getEffectiveValue`
   - utils/internalRecommendations.ts: 14 HITL entries (cek pakai ID list di §0.4)
   - lib/migrations/d1_fix_revisi_fallback.ts: latest migration
   - docs/REVISI-POK-PAGU-vKoreksi.md: v3 (1145 baris)

4. Query Supabase via anon key (read-only):
   - HEAD /rest/v1/pagu_sections?select=id → expect count = 14 (atau owner-current)
   - GET /rest/v1/pagu_sections?limit=1 → verify structure (id, data jsonb, created_at, ...)
   - Verify Tier 3-5 future tables NOT exist (usulan_revisi, snapshot_pok → HTTP 404)

5. Compute Total Pagu TA 2025 dengan Strategy B
   (traversal-based leaves + effective value formula)

6. Cross-check Strategy B result vs:
   - SSOT-REFACTOR-LOG §0 introduction claim
   - UI tab 1.1 atau tab 1.4 (live app sikesumav31.vercel.app)
   - Per snapshot 11 Mei 2026: total TA 2025 = Rp 2.709.935.000,4

7. ✅ Match → safe to proceed
   ❌ Mismatch → DEBUG SCRIPT FIRST. Jangan lapor drift sebelum forensic.
```

---

#### 0.7.8 Reporting Style Saat Findings Ditemukan

Saat melapor analisis hasil ke owner, gunakan **clear confidence levels**:

| Confidence Level | Kapan Pakai | Contoh Wording |
|---|---|---|
| **Confirmed** | Reproducible, ≥2 strategies converge, cross-check UI match | "Total Pagu TA 2025 = Rp X (verified via Strategy B + UI tab 1.4)" |
| **Suspected drift, pending forensic** | Mismatch detected, root cause belum jelas | "Saya mendeteksi selisih Rp Y. Bisa script saya yang salah ATAU data drift. Forensic in progress." |
| **False positive (retracted)** | Sudah dipastikan bug di tools analyst | "Finding #X di laporan sebelumnya saya RETRACT — false positive, root cause: [bug description]." |

**Jangan campur "Confirmed" dengan "Suspected"** dalam satu pernyataan. Owner butuh decision-grade information.

---

*§0.7 ditambahkan 11 Mei 2026 setelah forensic false-positive incident di preflight Tier 3. Maintained as living protocol — extend saat anti-pattern baru ditemukan.*

### 0.8 Tier 3 Implementation Decisions Log (11 Mei 2026)

Tier 3 Metadata Schema Extension diimplementasi dalam **4 phase** di branch `feature/tier-3-metadata-schema`, di-squash merge ke main sebagai **`6c8f640`** (11 Mei 2026). Section ini capture semua decision Owner-approved untuk prevent spoke session bias / re-litigation di session selanjutnya.

**Status:** ✅ **MERGED TO MAIN** sebagai `6c8f640` (11 Mei 2026). Feature branch dihapus.

**Phase commits sebelum squash (untuk audit trail):**

```
4a3ad75 fix phase 3: auto-expand race → derived state + toast K3 (post-Owner-test)
4bcffc1 feat phase 3: UI integration — badge column + expandable detail + modals
e0480ef feat phase 2b: metadataRecommender + Vitest framework (201 tests)
7b55d3c feat phase 2a: ground truth fixture (38 leaves, 92.1% high)
91c5691 feat phase 1: types.ts PaguRow extension (10 metadata fields + override)
```

Setelah squash merge, 5 commit ini flattened jadi 1 commit `6c8f640` di main. History line di main: `5f92a4d → 83248b8 → 6c8f640`.

#### 0.8.1 Owner-Approved Decisions (urut huruf)

| # | Decision | Owner Approval |
|---|---|---|
| **A** | Seed source untuk recommender = (1) RKKS 2025 §12.2 vKoreksi v3 canonical mapping, (2) 14 HITL recommendations existing, (3) Live Supabase 38 leaves TA 2025 ground truth | ✓ 11 Mei 2026 |
| **B (corrected)** | Confidence threshold per field — lihat §0.8.2 table |  ✓ 11 Mei 2026 (after fixing imprecision di proposal awal) |
| **C** | Test fixture-first approach: generate `utils/fixtures/pagu-leaves-ta2025.json` SEBELUM implement recommender. Acceptance ≥80% aggregate HIGH. **Achieved: 92,1%.** | ✓ 11 Mei 2026 |
| **D2** | Auto-expand rows dengan aggregate confidence MEDIUM/LOW (surfaces problem rows). User bisa toggle individual rows | ✓ 11 Mei 2026 |
| **E2** | Per-row bulk apply via modal preview (lihat dulu apa yang akan di-apply, baru Confirm) | ✓ 11 Mei 2026 |
| **F2** | Separate column "Status Metadata" setelah Sumber (cleaner, first-class visibility) | ✓ 11 Mei 2026 |
| **G1** | Phase 4 workflow: Tunggu Owner test di Vercel preview sebelum squash merge | ✓ 11 Mei 2026 |
| **H1** | Squash 4 phase commits → 1 commit di main saat merge (clean history) | ✓ 11 Mei 2026 |
| **I1** | Next tier setelah Tier 3 merge: Tier 4 Validation Engine C1-C12 (logical continuation, uses Tier 3 metadata) | ✓ 11 Mei 2026 |
| **J1** | Auto-expand bug fix via derived state pattern (useMemo + XOR userToggledIds) — bukan useEffect single-shot. Per post-Owner-test observation race condition | ✓ 11 Mei 2026 |
| **K3** | Toast guidance setelah Apply/Override mengingatkan klik Sync (☁️) button. Middle ground antara K1 (status quo) dan K2 (auto-sync) — UX better tanpa scope creep | ✓ 11 Mei 2026 |
| **L** | Persistence post-sync verified — sync flow consistent dengan existing app pattern | ✓ 11 Mei 2026 |

**Plus tambahan decision saat amendment Phase 1:**
- **Add `ro_code` field** (initially missing) ke types.ts PaguRow. Pattern code+name pair belum lengkap untuk RO — `ro_name` sengaja tidak di-add per spec Owner; UI bisa lookup descriptive dari mapping table jika perlu.

#### 0.8.2 Decision B Corrected — Confidence Threshold per Field

⚠ **Imprecision yang di-fix:** Proposal awal mention "HIGH untuk 5111xx/5211xx pattern". Realitas:
- 5111xx (Belpeg) tidak relevan untuk RS militer
- Komponen aktual "3" / "52" (single/double digit), BUKAN "001"/"002"

**Mapping rules final (canonical reference untuk recommender + Tier 4):**

| kode_bas family | KRO | RO | Komponen | Konfidensi |
|---|---|---|---|---|
| `521xxx`, `522112`, `522113`, `524111` | EBA | 962 | 3 | All HIGH (per §12.2) |
| `523111` (Pemeliharaan Gedung) | CCB | 4 | 3 | All HIGH (per §12.2) |
| `523122` (BMP) | CCB | — | 3 | KRO MED, RO LOW, Komp HIGH (analogy + prefix) |
| `532111.*.A` (Alsintor) | CAB | 5 | 52 | All HIGH (per §12.2 + Konteks 4 Angga) |
| `532111.*.B` (Alkes) | CAB | 1 | 52 | All HIGH (per §12.2 + Konteks 4 Angga) |
| `532111.C` (Alsatri) | CAB | — | 52 | KRO MED, RO LOW, Komp HIGH (Alsatri rencana TA 2026) |
| `536111` (Modal Lainnya — XDR dll) | CAB | — | 52 | KRO MED, RO LOW, Komp HIGH (analogy 53xxxx) |

**Sumber dana inference:**
- description contains `BPJS` atau `YANMASUM` → `PNBP` HIGH
- `sumberDana` field = `PNBP` → `PNBP` HIGH
- `sumberDana` field = `RM` → `RM` HIGH
- Else → LOW (manual fill)

**volume_ro / satuan_ro:** Always LOW default — butuh DIPA Petikan data eksternal, manual fill by Sie Renbang.

#### 0.8.3 JSONB-Native Reinforcement (Cross-Ref AP-8)

Tier 3 **TIDAK menggunakan DDL**. Implementasi murni TypeScript types extension + JSONB pass-through via existing `App.tsx:583` upsert. Detail:

| Aspek | Decision |
|---|---|
| Schema migration | ❌ Tidak ada — pagu_sections.data jsonb sudah schema-less |
| Field baru saat row lama | Auto-undefined (acceptable, semua field optional) |
| Persist field baru | Via existing upsert `.from('pagu_sections').upsert(allSections)` — pass-through full data |
| Owner action needed | Tidak ada (sebelumnya proposal blueprint draft `ALTER TABLE pagu_row` — wrong target) |

Sebelum draft DDL apapun untuk SIKESUMA: verify schema aktual via PostgREST probe + cross-check `HANDOVER.md §3` (tabel catalog) + `types.ts` (interfaces). Lihat AP-8 untuk full rationale.

#### 0.8.4 Override Mechanism (`row.metadata_review`)

Per Owner direction 11 Mei 2026: user (Sie Renbang) bisa **force confidence ke HIGH** untuk row yang sudah manual review walaupun computed recommender return MEDIUM/LOW.

**Field shape:**
```typescript
metadata_review?: {
  reviewed_at: string;          // ISO 8601 timestamp
  reviewed_by?: string;         // optional ('Angga (Sie Renbang)')
  override_to: 'high';          // v1 only supports 'high'
  note?: string;                // optional reasoning
};
```

**UI flow (Phase 3):** `MetadataOverrideModal` shows amber warning text — "*Marking this row as manually reviewed will override recommendation confidence to HIGH for all metadata fields. This affects Tier 4 validation. Confirm only after verifying KRO/RO/Komponen/Sumber Dana.*" — sebelum set field.

**Recommender behavior:** `recommendMetadata(row)` checks `row.metadata_review?.override_to === 'high'` dan force semua confidence ke `'high'`. Codes/names TIDAK diubah (preserve null untuk Alsatri RO dll).

#### 0.8.5 Test Framework Setup (Phase 2b)

Vitest 2.1.9 installed sebagai devDep. Config `vitest.config.ts` extends `vite.config.ts` via mergeConfig (path aliases @/ resolve). Environment: `node` (pure logic, no DOM needed).

**Scripts:**
- `npm test` — vitest run (single)
- `npm run test:watch` — vitest watch mode
- `npm run test:fixture` — only recommender tests

**Test stats:** 201 tests pass (2 fixture metadata + 190 per-row × per-field validation + 3 override + 3 aggregate helper + 3 edge cases). `package-lock.json` tidak di-commit (gitignored per project convention — reproducibility via `^2` caret di package.json).

#### 0.8.6 Decisions yang DITOLAK / TIDAK DIAMBIL

Untuk prevent re-litigation di spoke session baru, ini decision-decision alternative yang owner TIDAK pilih:

| Rejected | Karena | Tetap di-track? |
|---|---|---|
| D1 (all collapsed default) | UX tidak surface problem rows | Tidak |
| D3 (all expanded default) | Makan space, noisy untuk 38 rows | Tidak |
| E1 (per-field apply) | Granular tapi tedious UX | Tidak |
| E3 (both per-field + per-row) | Scope creep | Tidak |
| F1 (inline badge di Kode column) | Cramped, hard to see | Tidak |
| F3 (floating panel hover) | Complex implementation | Tidak |
| Add `ro_name` field | Spec Owner hanya `ro_code`; UI bisa lookup | Possibly future |
| G2 (squash merge tanpa preview test) | Owner ingin verify live first | Tidak |
| G3 (Owner sendiri yang squash merge) | Workflow ambiguity | Tidak |
| H2 (preserve 4-commit history via merge commit) | Noise di main history | Tidak |
| I2 (Tier 5 dulu — Audit Trail) | Butuh Owner DDL action, slower path | Defer to post-Tier 4 |
| I3 (debug Konteks 1 bug at line 50-51) | Out of scope, separate finding | Tracked as open finding |

---

*§0.8 ditambahkan 11 Mei 2026. Updated 11 Mei 2026 setelah squash merge selesai (commit `6c8f640`) + Owner test verification. Lifecycle complete: Phase 1-3 implementation → Owner test J/K finding + fix `4a3ad75` → squash merge ke main → docs sync. Next: Tier 4 Validation Engine C1-C12 di branch `feature/tier-4-validation-c1-c12`.*

---

### 0.9 Tier 4 Implementation Decisions Log (11 Mei 2026)

Tier 4 Validation Engine C1-C12 sedang berjalan dalam **3 sub-branch sequential** per Decision N2 Owner-approved. Sub-branch 4a (`feature/tier-4a-pagu-structure`) currently active dengan **Phase 1 + 2a + 2b COMPLETE** (semua 5 validator C1-C5 done, 103 tests Phase 2b cumulative). Phase 3 (UI integration) + Phase 4 (Owner test + squash merge) pending.

**Status:** 🚧 IN-PROGRESS — Sub-branch 4a Phase 2b partial. Belum merge ke main.

**Phase commits di feature branch (audit trail):**

```
86fff4c feat phase 2b Turn 4: C5 + helpers.collectAllLeaves (+ 24 tests)
ab83c06 feat phase 2b Turn 3: C2 validator (+ 27 tests)
f7ccfc3 docs ssot §0.9: R1-R5 + Turn 2 status sync pre-Turn 3
f94b27f merge state-sync: bring main into feature branch
a5e9d0b feat phase 2b Turn 2: C3 + helpers extraction (+ 20 tests)
52ed3a3 feat phase 2b: validators C1 + C4 + 32 tests (partial Q3)
ed4650b feat phase 2a: validation fixture 13 scenarios C1-C5
4191915 feat phase 1: validation types + 12-constraint specs catalogue
```

#### 0.9.1 Decisions Owner-Approved (Tier 4)

| Decision | Description | Date |
|---|---|---|
| **M1** | Draft `docs/TIER-4-DESIGN.md` dulu, lalu Phase 1 start. Avoid bias spoke session karena scope kompleks (12 constraint × 3 sub-branch) | ✓ 11 Mei 2026 |
| **N2** | 3 sub-branches sequential: `feature/tier-4a-pagu-structure` (C1-C5), `feature/tier-4b-revisi-mechanism` (C6-C9), `feature/tier-4c-procedural-references` (C10-C12) | ✓ 11 Mei 2026 |
| **O3** | UI integration: both dashboard "Validasi Revisi POK" + inline indicators di Pagu Anggaran. 12-card grid dengan 5 states (pass/warn/fail/pending/na) | ✓ 11 Mei 2026 |
| **P3** | Start Tier 4a Phase 1 dengan ASSUMPTION defaults Q1-Q6 (bisa diadjust kalau Owner override later) | ✓ 11 Mei 2026 |
| **Q1** | C8 LHR APIP = simple boolean v1 (extend later jika perlu cross-ref items per LHR) | ✓ 11 Mei 2026 (default) |
| **Q2** | C10 SBM/SBK = V1 simplified flag deviasi % (V2 full lookup table later) | ✓ 11 Mei 2026 (default) |
| **Q3 (default)** | C11 Hal III DIPA = simplified detection v1 — flag affected `linkedRpdId`, defer detailed diff | ✓ 11 Mei 2026 (default) |
| **Q3 (scope)** | Phase 2b — kerjakan C1 dan C4 saja sekarang (paling sederhana, langsung verify). C2/C3/C5 next session karena ada nuance pending/na yang perlu Owner pertimbangan | ✓ 11 Mei 2026 |
| **Q4** | Validation timing: manual "Validate Now" button + auto-refresh setelah Apply Recommendation. Avoid noise saat user sedang edit | ✓ 11 Mei 2026 (default) |
| **Q5** | Sub-branch sequence: sequential (4a → merge → 4b → merge → 4c), bukan parallel | ✓ 11 Mei 2026 (default) |
| **Q6** | UI tab name: **"Validasi Revisi POK"** (domain-friendly Indonesian) | ✓ 11 Mei 2026 (default) |
| **R1** | Definisi "changed row" untuk C2/C3 (dan future C5 grouping) = pakai **effective values**: row dianggap "changed" jika `Math.abs(effectiveAwal(row) − effectiveRevisi(row)) > EPSILON_RUPIAH` (via `helpers.isChangedRow`). Row dengan `hargaSatuanRevisi=0` → fallback ke Awal per Konteks 1 → effective values equal → **TIDAK** dihitung sebagai changed. Consistent dengan C1 logic. | ✓ 11 Mei 2026 |
| **R2** | Pending threshold untuk C2/C3 = **strict**. ANY changed row dengan grouping field (`kro_code` untuk C2, `kegiatan_code` untuk C3) yang null/undefined → status `pending` dengan affected row IDs list. BUKAN tunggu semua row missing. Pesan pending harus guide user fill metadata via tombol "Terima Rekomendasi" atau "Tandai Manual Reviewed". | ✓ 11 Mei 2026 |
| **R3** | Override behavior: `row.metadata_review.override_to='high'` HANYA force confidence ke high, **TIDAK** fill kode/data fields. Kalau `kro_code` / `kegiatan_code` / `ro_code` tetap null setelah override → validator masih return `pending`. Override bukan magic wildcard. | ✓ 11 Mei 2026 |
| **R4** | C5 grouping behavior: cek `volume_ro` + `satuan_ro` consistency **per leaf row dalam RO yang sama** (group by `ro_code`). Per master domain §12.2: RO 962 Layanan Umum Sub-Komponen F (RS Batin Tikal) terdiri dari **8 akun BAS** (521111, 521112, 521115, 521119, 521811, 522112, 523122, 524111) tersebar lintas 6 section SikeSuma — kedelapan akun tersebut harus declare `volume_ro` + `satuan_ro` yang sama. Mismatched values dalam grup → `fail`. | ✓ 11 Mei 2026 |
| **R5** | C5 N/A threshold: **strict** — kalau SEMUA leaf rows missing `volume_ro` AND `satuan_ro` → status `na` (skip evaluation). Mixed case (sebagian rows ada data, sebagian tidak) → status `warn` dengan evaluate yang ada + flag rows missing. Bukan na, bukan fail. | ✓ 11 Mei 2026 |

#### 0.9.2 Sub-Branch Categorization

Per Decision N2, 12 constraints dibagi 3 kategori berdasarkan sifat validasi:

| Sub-Branch | Constraints | Sifat | Kompleksitas |
|---|---|---|---|
| **4a — Pagu Structure** | C1, C2, C3, C4, C5 | Pure structural — data dari `pagu_sections` saja | LOW-MED |
| **4b — Revisi Mechanism** | C6, C7, C8, C9 | Diff Semula↔Revisi + LHR APIP acknowledgment flag | MED |
| **4c — Procedural/References** | C10, C11, C12 | SBM lookup + cross-table (rpds) + temporal (deadline) | HIGH |

#### 0.9.3 Phase Structure Per Sub-Branch (Mirror Tier 3 Pattern)

| Phase | Deliverable | Notes |
|---|---|---|
| Phase 1 | `utils/validators/types.ts` (inclusive untuk ALL 12 constraint untuk avoid drift antar branches) | Done di 4a — types catalogue 336 lines |
| Phase 2a | `utils/fixtures/validation-scenarios-{4a/4b/4c}.json` (ground truth scenarios) | Done di 4a — 13 scenarios |
| Phase 2b | `utils/validators/c{N}.ts` + tests (≥30 tests per constraint) | **4a COMPLETE** — C1 (24) + C4 (8) + C3 (20) + C2 (27) + C5 (24) = **103 tests cumulative** |
| Phase 3 | UI integration — dashboard tab + inline indicators | Pending |
| Phase 4 | Owner Vercel preview test → squash merge ke main | Pending |

#### 0.9.4 Technical Decisions Captured

**Konteks 1 Fallback (Sprint D Item #1) — Reused in C1:**
```typescript
// effectiveRevisi computation di utils/validators/c1.ts
const hsr = row.hargaSatuanRevisi ?? 0;
const hsa = row.hargaSatuanAwal ?? 0;
const effectiveHarga = hsr > 0 ? hsr : hsa;  // fallback ke Awal kalau Revisi=0
return (row.volume ?? 0) * effectiveHarga;
```
Konteks 1 = "hargaSatuanRevisi=0 berarti BELUM DI-REVISI, bukan ZERO". Per normative logic Angga.

**Leaf Detection (§0.7.2 traversal-based) — Reused in C1:**
```typescript
// isLeaf helper di utils/validators/c1.ts
function isLeaf(rows: PaguRow[], idx: number): boolean {
  if (idx >= rows.length - 1) return true;
  return (rows[idx + 1].level ?? 0) <= (rows[idx].level ?? 0);
}
```
BUKAN `row.level > 0` filter (AP-1 anti-pattern). Cek hierarchy via next-row level comparison.

**Epsilon Tolerance (C1):**
- `EPSILON_RUPIAH = 0.5` — selisih ≤ Rp 0.50 dianggap "sama" (floating-point rounding artifact)
- Mencegah false-fail dari kalkulasi yang technically equal tapi sub-rupiah berbeda

**Plain Language Doc Comments (Owner-friendly):**
Setiap validator (c1.ts, c4.ts) include comment block dengan:
- Algorithm step-by-step dalam Bahasa Indonesia
- Analogi medis (Owner background = neurosurgeon, prefers medical metaphors)
- Reference ke master domain + SSOT sections

Contoh analogi:
- C1: "conservation of mass" — total cairan masuk = keluar
- C2: "department transfer constraint" — pergeseran dalam KRO sama OK, lintas KRO eskalasi
- C3: "service line consistency check" — anggaran tidak boleh lintas Kegiatan
- C4: "patient identity check" — selalu RS yang sama
- C5: "ward census consistency" — semua akun di RO sama declare volume target output sama
- Konteks 1 fallback: "kalau dokter belum input hasil ulang, pakai hasil awal sebagai default"

**Changed-Row Detection (R1) — Reused in C2/C3:**
```typescript
// helpers.ts isChangedRow — Decision R1 (§0.9.1)
export function isChangedRow(row: PaguRow): boolean {
  const eAwal = effectiveAwal(row);
  const eRevisi = effectiveRevisi(row);
  return Math.abs(eAwal - eRevisi) > EPSILON_RUPIAH;
}
```
Pakai effective values (Konteks 1-consistent), bukan raw `jumlahBiayaRevisi`.
Row dengan `hargaSatuanRevisi=0` fallback ke Awal → effective values equal →
TIDAK terhitung changed. Konsisten dengan C1 sum logic.

**Leaf Collection Helpers (Turn 2 + Turn 4 extraction):**
```typescript
// helpers.ts — extracted di Turn 2, generalized di Turn 4
export function collectAllLeaves(sections): PaguRow[] {
  // Iterate semua section → isLeaf check (traversal-based §0.7.2)
  // Returns ALL leaves regardless of changed status
  // Used by: C5 (volume_ro/satuan_ro consistency), future C6/C7/C9
}

export function collectChangedLeaves(sections): PaguRow[] {
  return collectAllLeaves(sections).filter(isChangedRow);
  // Used by: C2 (kro_code grouping), C3 (kegiatan_code grouping)
}
```
Centralized leaf iteration prevents AP-1 (level>0 anti-pattern) duplication
across validators. Single source of truth untuk traversal logic.

#### 0.9.5 Open Items untuk Future Sessions

| Item | Sub-Branch | Notes |
|---|---|---|
| **C8 LHR APIP field storage** | 4b | Boolean flag — dimana disimpan? (App-level state? PaguSection field? New `revisi_submission` envelope?) Decide di Phase 1 of 4b |
| **C10 SBM dictionary shape** | 4c | Currently placeholder `unknown` di types.ts — define proper interface di Phase 1 of 4c |
| **C11 RPD cross-table** | 4c | Butuh investigation `rpds` table structure (current types.ts has RPDSection — verify shape). **Cross-tab navigation note (Phase 3c future):** saat C11 implemented, affected-rows navigation harus bisa link ke RPD tab (sub-tab 1.3), BUKAN hanya Pagu Anggaran (1.1). Adjust DetailPanel + onNavigateToPagu signature di ValidasiRevisiPOK untuk support route per row type (pagu_row vs rpd_row). |
| **Konteks 1 finding (UNRESOLVED)** | Pre-existing | `components/PaguAnggaran.tsx:50-51` overwrites `jumlahBiayaRevisi=0` jika `hargaSatuanRevisi=0` — affects C1 evaluation via UI vs validator. C1 validator handle correctly via `effectiveRevisi` helper, tapi UI display tetap potential bug |
| **C1 violation message enhancement (UX)** | Post-4a-merge atau Tier 4b enhancement | Low priority. Saat C1 FAIL detected (net change != 0), tambah guidance text di violation message: *"Untuk menambah/mengurangi total pagu satker, gunakan Revisi DIPA Halaman III (kewenangan KAPK/Eselon I) atau revisi DIPA penuh — bukan Revisi POK kewenangan KPA."* Source rationale: case study RS Batin Tikal 2025 — layanan bedah saraf baru full operasional Trisemester 2-3, butuh add pagu ~Rp 1.7M (equipment Alsintor/Alkes + BMHP + jasa nakes). Validator C1 correctly catch wrong-mechanism risk — Sie Renbang harus pakai pathway DIPA Halaman III via KAPK Kakesdam II/Sriwijaya, BUKAN revisi POK. Validator working as intended, high-value outcome dari Tier 4 engine. Defer enhancement post Tier 4a squash merge atau batch di Tier 4b enhancement turn. |

#### 0.9.6 TS Baseline Update (post-cleanup)

Bersamaan dengan Tier 4 work, devLog.ts type drift di-cleanup (11 Mei 2026):
- Old baseline: **11 errors** (7 App.tsx + 1 PaguAnggaran.tsx + 3 devLog.ts)
- New baseline: **8 errors** (7 App.tsx + 1 PaguAnggaran.tsx)
- Fix: Add `'AI Assistant (Successor Session)'` ke `DevLogAuthor` union + consistency fix line 1044 (`'AI Assistant'` → `'AI Assistant (Successor Session)'`)

Future docs cross-references should use **baseline 8** as the maintained threshold.

#### 0.9.7 Cross-References

- Design doc: [`docs/TIER-4-DESIGN.md`](./docs/TIER-4-DESIGN.md) — full C1-C12 spec + phasing + UI plan
- Constraint specs canonical: `utils/validators/types.ts` CONSTRAINT_SPECS
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (constraints) + §3.5 (skema akun sama) + §12.2 (struktur BAS RS Batin Tikal)
- Validator implementations (Phase 2b complete):
  - `utils/validators/c1.ts` — Total Pagu net change (Konteks 1 + epsilon)
  - `utils/validators/c2.ts` — Pergeseran 1 KRO (group by kro_code, v1 skema 5.a)
  - `utils/validators/c3.ts` — Pergeseran 1 Kegiatan (group by kegiatan_code)
  - `utils/validators/c4.ts` — Single Satker (deterministic pass per app scope)
  - `utils/validators/c5.ts` — Volume + Satuan RO consistency (NA/MIXED/PASS/FAIL)
- Shared helpers: `utils/validators/helpers.ts` — `isLeaf`, `effectiveAwal/Revisi`, `isChangedRow`, `collectAllLeaves`, `collectChangedLeaves`, `formatRupiah`, `EPSILON_RUPIAH`
- Fixture ground truth: `utils/fixtures/validation-scenarios-4a.json` — 13 scenarios across C1-C5
- Tier 3 metadata fields (consumed by Tier 4): `types.ts` PaguRow extension
- Tier 3 implementation log: §0.8 above
- DevLog entries (in-app visibility): `constants/devLog.ts` entries `log-2026-05-11-tier-4-design` + `log-2026-05-11-tier-4a-foundation`

---

*§0.9 ditambahkan 11 Mei 2026 setelah Tier 4a Phase 1+2a+2b-partial complete + post-compaction consistency sync. Updated saat checkpoint: ✓ (1) Tier 4a Phase 2b complete (semua 5 validators C1-C5, 103 tests cumulative, R1-R5 governance locked). ✓ (2) Phase 3 UI complete. ✓ (3) Sub-branch 4a squash merge ke main (commit `abe193c`). ✓ (4) Sub-branch 4b started — see §0.10.*

---

### 0.10 Tier 4b Implementation Decisions Log (11 Mei 2026)

Successor block for sub-branch `feature/tier-4b-revisi-mechanism` — C6-C9 Revisi Mechanism constraints. Created from main `bdba7a1` post Tier 4a squash merge. Companion document: `docs/TIER-4B-DESIGN.md` (Phase 1 design doc, commit `51fab33`).

#### 0.10.1 Decisions Owner-Approved (Tier 4b S1-S6)

Owner direction 11 Mei 2026 — approve all defaults batch:

- **S1 (C6 algorithm pattern):** Group changed leaves by 2-digit `kode_bas` (jenis belanja: 51/52/53/57). Distinct count ≥ 2 → fail. Mirror C2/C3 grouping pattern. Consistent dengan R1 (effective values via `helpers.isChangedRow`) + R2 (strict pending).

- **S2 (C7 algorithm pattern):** Group changed leaves by `sumber_dana_kode` (RM/PNBP/PHLN/PLN/PDN/SBSN/HIBAH). Distinct count ≥ 2 → fail. Mirror C2/C6 pattern.

- **S3 (C8 LHR APIP storage):** App-level state per year `lhrApipAcknowledgedByYear: Record<number, boolean>` di App.tsx. ValidationContext field `lhrApipAcknowledged?: boolean` SUDAH ADA di types.ts (forward-compatible placeholder dari Phase 1 Tier 4a — zero type extension needed). UI: checkbox di Validasi tab header sebelum Submit button enabled. v1 in-memory only — persistence Supabase = Tier 5 audit trail scope per S6.

- **S4 (C9 algorithm):** Per-leaf check `effectiveRevisi(row) < 0` → violation. BUKAN net balance per kode akun. Match types.ts spec "sanity check untuk catch data entry typo". Net balance enhancement = potential Tier 4c atau later.

- **S5 (Missing field handling C6/C7):** Strict pending — ANY changed row missing `kode_bas` (C6) atau `sumber_dana_kode` (C7) → status 'pending' dengan affectedRowIds + Tier 3 fill guidance. Consistent dengan R2 Tier 4a.

- **S6 (C8 persistence v1):** In-memory only saat session. App restart = re-confirm checkbox. Proper audit trail (when KPA submit revisi) = Tier 5 scope.

**Plus enhancement batched:**
- **§0.9.5 C1 violation message UX enhancement:** Batch dengan Tier 4b Phase 1.5. Append guidance text ke pathway DIPA Halaman III untuk help Sie Renbang identify correct mechanism. Implemented di `utils/validators/c1.ts` line 106-119 (multi-line concat).

#### 0.10.2 Phase Structure Per Sub-Branch 4b — COMPLETE

Tier 4b MERGED to main 11 Mei 2026. All phases ✅ Done dalam single session (~10 turns aktual sesuai estimate).

| Phase | Deliverable | Commit |
|---|---|---|
| 1 Design | `docs/TIER-4B-DESIGN.md` design spec + S1-S6 decisions | ✅ Done `51fab33` |
| 1.5 Types + C1 enhancement | ValidationContext field SUDAH ADA (no extension); C1 message enhancement batched | ✅ Done `fd59031` |
| 2a Fixture | `utils/fixtures/validation-scenarios-4b.json` 15 scenarios | ✅ Done `105a7f0` |
| 2b Turn 1 | C6 Jenis Belanja validator + 27 tests | ✅ Done `1660446` |
| 2b Turn 2 | C7 Sumber Dana validator + 28 tests | ✅ Done `c2fcadb` |
| 2b Turn 3 | C9 Akun Minus validator + 18 tests | ✅ Done `08b7066` |
| 2b Turn 4 | C8 LHR APIP validator + 15 tests | ✅ Done `26b165d` |
| 3a UI design | Brief delta dari Tier 4a UI baseline | ✅ Done `35d661f` |
| 3b Cards live | `runAllValidators.ts` PENDING_CONSTRAINTS update C6-C9 → null | ✅ Done `0e3595a` |
| 3c LHR checkbox | NEW UX element + Submit triple gating + App.tsx state | ✅ Done `ec667fd` |
| 3d Docs sync | devLog Phase 3 entry + HANDOVER + README + SESSION-START-HERE | ✅ Done `1e333cd` |
| **4 Squash merge** | **Owner Vercel preview E2E (10/10 pass) → squash ke main** | ✅ **Done `d13be80`** |
| **Post-merge sync** | **HANDOVER + README + SESSION-START-HERE update** | ✅ **Done `882bb58`** |

Cumulative deliverable: 21 files changed (+3,288 / -31 lines), 88 new tests, 4 validators C6-C9 functional, UI integration complete.

#### 0.10.3 Field Coverage Map

Per Tier 4a baseline + Tier 4b additions:

| Field | Source | Used By |
|---|---|---|
| `kode` | PaguRow base | All validators (display) |
| `kode_bas` | PaguRow Tier 3 | C2 (KRO derive — current placeholder), **C6 (NEW — 2-digit jenis belanja)** |
| `sumber_dana_kode` | PaguRow Tier 3 typed union | **C7 (NEW)** |
| `kro_code` | PaguRow Tier 3 | C2 |
| `kegiatan_code` | PaguRow Tier 3 | C3 |
| `ro_code` | PaguRow Tier 3 | C5 |
| `volume_ro` + `satuan_ro` | PaguRow Tier 3 | C5 |
| `hargaSatuanAwal/Revisi` + `volume` | PaguRow base | C1 (via effectiveAwal/Revisi), C9 |
| `metadata_review` | PaguRow Tier 3 | All — confidence override mechanism |
| `lhrApipAcknowledged` | ValidationContext (App state) | **C8 (NEW)** |

Zero DDL impact. JSONB-native pattern (AP-8) preserved. All fields sudah typed di Phase 1 Tier 4a — Tier 4b cuma consume.

#### 0.10.4 Open Items Carried Forward dari §0.9.5

- **C11 cross-tab navigation** (Tier 4c implementation): RPD tab routing
- **C10 SBM dictionary shape** (Tier 4c Phase 1 decision)
- **Konteks 1 finding** `PaguAnggaran.tsx:50-51` (UNRESOLVED, UI display bug, pre-existing TD)

#### 0.10.5 Cross-References

- **Squash commit:** `d13be80` (Tier 4b merged to main 11 Mei 2026)
- **Post-merge docs sync:** `882bb58`
- Design parent: `docs/TIER-4B-DESIGN.md` (Phase 1 commit `51fab33`)
- Phase 3 UI delta: `docs/TIER-4B-PHASE-3-UI-DESIGN.md` (commit `35d661f`)
- Architecture: `docs/TIER-4-DESIGN.md` §2 + §3.2
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 + §3.5
- Predecessor squash: `abe193c` Tier 4a (main HEAD pre-4b)
- Validator pattern reference: `utils/validators/c2.ts` (C6/C7 mirror)
- Validator semantic divergence: `utils/validators/c9.ts` (C9 BYPASS Konteks 1 fallback)
- devLog milestone: `log-2026-05-11-tier-4b-merged-to-main` (Phase 4) + `log-2026-05-11-tier-4b-phase-3-complete` (Phase 3)

---

*§0.10 ditambahkan 11 Mei 2026 setelah Tier 4b Phase 1 design Owner-approved. S1-S6 defaults batch-approved + C1 enhancement batched. **Updated final state:** Tier 4b MERGED ke main via squash commit `d13be80` setelah Owner Vercel preview E2E test (10/10 pass) 11 Mei 2026. Post-merge sync `882bb58`. Feature branch `feature/tier-4b-revisi-mechanism` dihapus (remote + local). 392 tests baseline + TS 8 maintained. Ready Tier 4c (`feature/tier-4c-procedural-references`).*

---

### 0.11 Tier 4c Implementation Decisions Log (11 Mei 2026)

Successor block untuk Tier 4c (final 3 of 12 constraints). Companion: `docs/TIER-4C-DESIGN.md` (Phase 1 design draft, commit `230ba43`). **Foundation work** dikerjakan di session current (Konteks 1 TD fix + Phase 1.5 types narrow + handover prep). **Implementation** (Phase 2a fixture + Phase 2b validators + Phase 3 UI) di-split ke **fresh AI session** untuk avoid context budget exhaustion.

#### 0.11.1 Decisions Owner-Approved (Tier 4c T1-T8)

Owner direction 11 Mei 2026 — **approve all T1-T8 defaults** batch:

- **T1 (C12 timezone):** Client `new Date()` browser WIB. Simple v1 — Tier 5 audit trail nanti capture server timestamp UTC.
- **T2 (C10 SBM source):** Use `hargaSatuanAwal` sebagai SBM baseline proxy. Pragmatic V1 leveraging existing data, BUKAN full PMK lookup table.
- **T3 (C11 cross-table depth):** V1 simplified — flag affected RPD rows by linked match. NOT numerical sum verification.
- **T4 (C10 thresholds):** Warn 10%, Fail 25%. Adjustable di types.ts kalau Sie Renbang feedback indicate too tight/loose.
- **T5 (C11 link method):** Strict `linkedPaguSectionId` + `kode` exact match. NOT fuzzy prefix match.
- **T6 (C12 violation message):** Full Pasal cite + action guidance "ajukan untuk TA berikutnya".
- **T7 (Cross-tab nav signature):** Refactor `onNavigate(target: 'pagu' | 'rpd', sectionId, rowId)` baru. Affects ValidasiRevisiPOK + DetailPanel + App.tsx + RPD.tsx.
- **T8 (Konteks 1 TD fix):** T8a re-derive via `getEffectiveValue` helper di write-time storage line 368. Standalone pre-flight commit BEFORE Tier 4c branch.

#### 0.11.1a Decision T9 BARU — C11 Pending Strategy Toggle (12 Mei 2026)

Owner direction 12 Mei 2026 di fresh AI session (mid-Phase-2b Turn 3) — saat saya report "vacuous-wins-over-pending" sebagai custom interpretation (NOT pre-locked di T1-T8) untuk edge case "0 changed leaves + rpdsData undefined". Owner ingin Sie Renbang dapat eksperimen kedua interpretasi semantic via toggle UI (pattern "learning by doing").

- **T9 (C11 strategy toggle):** Dua mode user-configurable di ValidationContext field `c11Strategy?: 'permisif' | 'ketat'`.
  - **`permisif`** (default development setting): vacuous-wins. 0 changed leaves + rpdsData undefined → `pass`. Default-safe interpretation. Match natural app-startup flow tanpa surprise pending state.
  - **`ketat`** (strict opt-in): pending-first. rpdsData undefined → `pending` checked first, walau 0 changed leaves. Default-skeptical — paksa user verify data dulu sebelum claim aman.
  - **Diff** antara 2 mode HANYA muncul di edge case spesifik tersebut. Semua kasus lain (changed > 0, atau rpdsData defined) output identical.
  - **Naming Indonesian** per Owner preference (RS TNI AD primary language).
  - **Default `'permisif'`** untuk backward compat + natural UX.
  - **UI placement:** Toggle banner di-render BETWEEN `ValidationDashboardHeader` dan card grid (Q1 Opsi A soft interpretation — `ValidationConstraintCard` adalah `<button>` HTML element, nested radio inputs tidak valid; banner pre-grid tetap satisfy discoverability goal). Compact 1-line layout dengan Lucide Info icon hover tooltip (3-paragraph trade-off explainer). Right-aligned status note untuk transparansi mode aktif.
  - **localStorage** key `c11PendingStrategy` per device per user. Re-validate auto-trigger via useCallback deps include `c11Strategy`.
  - **User-facing note** di validator summary string (semua status pass/fail/pending): `[Mode: PERMISIF — default pengembangan, vacuous pass aktif. Mode KETAT (validate-first) tersedia via toggle UI Phase 3c.]` — pattern "soft onboarding" supaya user aware fitur dapat di-upgrade.

**Implementation reference:**
- Architecture commit: `cb0435e` (Phase 2b Turn 4) — ValidationContext field + validator decision tree branch + 10 new tests
- UI commit: `4cf3341` (Phase 3c absorbed) — toggle banner + radio + localStorage persist + tooltip
- Tests: `c11.test.ts` section "edge cases — c11Strategy toggle (T9)" 8 tests + 2 fixture scenarios

**Future consideration:** Kalau Sie Renbang field-test feedback indicates konvergen ke salah satu mode (mis. semua user prefer permisif), V2 simplification = remove toggle + hardcode chosen default. Tetapi keep architecture untuk reversibility kalau preferences shift.

#### 0.11.2 Phase Structure Per Sub-Branch 4c

Split ke 2 fase session karena token budget:

**Session current (foundation + handover):**

| Phase | Deliverable | Commit |
|---|---|---|
| Design draft | `docs/TIER-4C-DESIGN.md` ~424 lines comprehensive | ✅ `230ba43` |
| Pre-flight TD | Konteks 1 fix `PaguAnggaran.tsx` line 368 — T8a | ✅ `303df65` |
| Phase 1.5 | Types narrow `rpdsData: unknown[]` → `RPDSection[]` | ✅ `857e98c` |
| §0.11 + governance | SSOT §0.11 + HANDOVER + README + SESSION-START-HERE + devLog + OWNER-POLICY | (this commit) |

**Fresh AI session (implementation):**

| Phase | Deliverable | Estimated |
|---|---|---|
| Branch creation | `feature/tier-4c-procedural-references` dari main HEAD | 0 |
| Phase 2a | Fixture `validation-scenarios-4c.json` ~15 scenarios | 1 turn |
| Phase 2b Turn 1 | **C12 Deadline** + ~12 tests | 1 turn |
| Phase 2b Turn 2 | **C10 SBM** (first WARN severity) + ~20 tests | 1 turn |
| Phase 2b Turn 3 | **C11 RPD** (cross-table) + ~25 tests | 1-2 turns |
| Phase 3a-d | UI integration + cross-tab navigation refactor | 3-4 turns |
| Phase 4 | Owner E2E test → squash merge | 1 turn |
| **TOTAL fresh session** | | **~7-10 turns** |

#### 0.11.3 Foundation Status

**Already in place dari session current:**
- ✅ Design doc Owner-approved + decisions locked (T1-T8)
- ✅ Pre-existing Konteks 1 TD fixed (T8a applied)
- ✅ Types extension done (rpdsData narrow)
- ✅ ValidationContext sudah punya semua fields needed (lhrApipAcknowledged dari Tier 4b, sbmDictionary placeholder untuk V2 future, rpdsData narrow, evaluatedAt untuk C12)
- ✅ Helpers existing reusable (collectAllLeaves, collectChangedLeaves, effectiveRevisi, getEffectiveValue)
- ✅ UI infrastructure ready (dashboard cards support 6 states termasuk WARN dari Tier 4a, inline indicators auto-supported, navigation handler base)

**Yang fresh session perlu setup:**
- Branch creation `feature/tier-4c-procedural-references`
- Cross-tab navigation refactor (`onNavigate` signature)
- RPD.tsx scroll/highlight (mirror PaguAnggaran Tier 4a Phase 3d pattern)

#### 0.11.4 Field Coverage Map (post Phase 1.5)

| Field | Source | Used By |
|---|---|---|
| `hargaSatuanAwal` + `hargaSatuanRevisi` + `volume` | PaguRow base | **C10 NEW (deviasi %)** |
| `ctx.evaluatedAt` + `ctx.ta` | ValidationContext | **C12 NEW (date comparison)** |
| `ctx.rpdsData: RPDSection[]` (Phase 1.5 narrow) | ValidationContext | **C11 NEW (cross-table)** |
| `RPDSection.linkedPaguSectionId` | types.ts (Sprint B.5) | **C11 link resolution** |
| `RPDRow.kode` + `RPDRow.monthly` | types.ts (Sprint A2) | **C11 + V2 future verification** |

Zero PaguRow field additions. Zero DDL. Pattern consistent dengan Tier 4a/4b minimal-change approach.

#### 0.11.5 Cross-References

- Design parent: `docs/TIER-4C-DESIGN.md` (Phase 1 commit `230ba43`)
- Predecessor squashes:
  - `d13be80` Tier 4b (C6-C9 + UI)
  - `abe193c` Tier 4a (C1-C5 + UI)
  - `6c8f640` Tier 3 (metadata schema)
- Pre-flight TD fix: `303df65` (Konteks 1 — T8a via getEffectiveValue)
- Types narrow: `857e98c` (Phase 1.5 — rpdsData RPDSection[])
- Helper reuse: `utils/paguLookup.ts` `getEffectiveValue` (Konteks 1 semantics)
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (C10-C12 specs)
- Governance: `OWNER-POLICY-FOR-AI-SESSIONS.md` (anti-drift + session split protocols)

---

*§0.11 ditambahkan 11 Mei 2026 setelah Owner approve TIER-4C-DESIGN.md T1-T8 defaults batch. Foundation work + handover prep di-eksekusi current session. Implementation work split ke fresh AI session per Owner direction (avoid 2nd compaction). All foundation ✅ Done — branch `feature/tier-4c-procedural-references` belum di-create (handed off ke fresh session).*

*§0.11 UPDATE 12 Mei 2026 (fresh AI session) — Phase 2 + Phase 3 IMPLEMENTATION COMPLETE. Owner approve T9 BARU (C11 strategy toggle) mid-Phase-2b. Squash-merge-ready state: 9 commits di-branch `feature/tier-4c-procedural-references`. 94 tests Tier 4c added. Test baseline 392 → 486 (TS 8 maintained).*

*§0.11 FINAL 12 Mei 2026 — **Tier 4c MERGED to main** as squash commit `9174782`. Owner Vercel preview E2E test ✅ APPROVED sebelum authorize merge. Feature branch `feature/tier-4c-procedural-references` dihapus (remote + local). All 12 validators LIVE — Submit Revisi POK button ENABLES first time in project history (triple-gate: canSubmit AND lhrApipAcknowledged AND allImplemented). Ready Tier 5 (Audit Trail) — butuh Owner DDL action `CREATE TABLE usulan_revisi`.*

---

### 0.12 Tier 5 Implementation Decisions Log (12 Mei 2026)

Successor block untuk Tier 5 (Workflow Audit Trail + State Machine). Companion: `docs/TIER-5-DESIGN.md` (Phase 1 design with R1-R8 + R6+ override Owner-approved). **Foundation work** dikerjakan di session current (Phase 1 design + handover prep). **Implementation** (Phase 1.5 DDL + Phase 2-3 logic + UI) di-split ke **fresh AI session** untuk avoid context budget exhaustion + drift/bias.

#### 0.12.1 Decisions Owner-Approved (Tier 5 R1-R8)

Owner direction 12 Mei 2026 — **approve all R1-R8 defaults + R6 enhancement (R6+ manual override)** batch:

- **R1c (Schema convention):** Hybrid — `status` + `tahun_anggaran` + `jenis` columned, rest JSONB `data` field. Balance PostgreSQL indexed performance untuk frequent query (status filters) + JSONB flexibility untuk future fields. Konsisten dengan AP-8 SIKESUMA envelope JSONB pattern.
- **R2b (Snapshot scope):** Full POK snapshot per tanggal_efektif (BUKAN delta). Justifikasi: time-travel viewer butuh full state reconstruction.
- **R3c (LHR APIP migration):** Both system_settings (global) + usulan_revisi.data (tied audit per submission). Best of both — global session state + audit trail per submission.
- **R4a (Deadline reminder mechanism):** Banner V1 di dashboard H-7 sebelum hard deadline. R4b email/notification defer V2.
- **R5a (Multi-user):** Single-user Sie Renbang act as proxy untuk Karumkit/KPA. R5b proper RBAC defer V2/Tier 6+.
- **R6+ (State transitions BARU enhancement):** Permissive defaults `draft → ditolak`, `berlaku_efektif → ditolak` (post-fact) allowed. PLUS **manual override mechanism** untuk catch-all transition any→any state dengan mandatory reason + audit log entry `manual_override` flag. Owner direction: *"sistem tidak boleh stuck karena terlalu strict. SIKESUMA adalah project pengembangan breakthrough — pattern 'learning by doing'."*
- **R7c (Snapshot immutability):** Both DB trigger (PostgreSQL function reject UPDATE) + app enforcement (no UPDATE endpoint exposed). Defense in depth.
- **R8c (Partition):** Split Tier 5a (backend: schema + state machine + persistence + Submit integration) + Tier 5b (frontend: tab + modal + snapshot viewer + deadline banner). Natural backend/frontend separation untuk fresh session continuity.

#### 0.12.2 Scope Additions Owner-Approved (12 Mei 2026)

- **Tier 5+6 overlap β:** Forward-compat schema dengan field `template_sk_metadata` di `usulan_revisi.data`. Tier 6 SK Template generation defer ke separate sub-branch — schema TIDAK BERUBAH saat Tier 6 implement.
- **Validation history audit β:** JSONB-embedded di `usulan_revisi.data.validation_attempts[]`. Each Submit attempt captured (timestamp + result + violations summary). Useful for Itjenad audit. V2 extract ke separate table kalau scale matures.

#### 0.12.3 Phase Structure Per Sub-Branch 5

**Session current (foundation + handover):**

| Phase | Deliverable | Commit |
|---|---|---|
| Phase 1 Design | `docs/TIER-5-DESIGN.md` ~600 LOC comprehensive (R1-R8 + R6+ + Tier 5+6 + validation history) | (this commit batch) |
| v3.2 Strategy | Production branch creation + OWNER-POLICY Addendum v1.2 | (this commit batch) |
| Foundation prep | SSOT §0.12 + HANDOVER + SESSION-START-HERE + handover bundle ZIP | (this commit batch) |

**Fresh AI session (implementation):**

| Phase | Deliverable | Estimated |
|---|---|---|
| Phase 1.5 | DDL preparation + Owner execute (AI-auto-execute per Konteks 4) | 1-2 turn |
| **Tier 5a** | Backend: types + state machine + persistence + Submit integration | 5-7 turn |
| **Tier 5b** | Frontend: tab + modal + snapshot viewer + deadline banner | 5-7 turn |
| Phase 4 | Owner E2E test → squash merges (5a separate, 5b separate) | 2 turn |
| **TOTAL fresh session** | | **~13-18 turns** |

#### 0.12.4 Procedural Rules (NEW from Owner direction 12 Mei 2026)

- **Paired commit→push action** — REINFORCED dari incident Phase 3c (commit `4cf3341` lupa push). Codified di OWNER-POLICY Addendum v1.2 §J. Pattern: setiap commit WAJIB diikuti push dalam same turn.
- **Supabase direct access policy** — Owner grant credentials. Read bebas, DDL butuh explicit per-operation Owner approval. AI-auto-execute DDL allowed untuk Tier 5 dengan audit safeguards. Codified di OWNER-POLICY Addendum v1.2 §H.
- **v3.2 strategy** — Vercel production branch pattern (Opsi A Owner-approved). main = dev/preview, production = explicit promote. Codified di OWNER-POLICY Addendum v1.2 §I.

#### 0.12.5 Foundation Status

**Already in place dari session current:**
- ✅ Tier 4c MERGED ke main (`9174782`)
- ✅ Production branch created (`production` dari main HEAD `90a0278`)
- ✅ Phase 1 design doc TIER-5-DESIGN.md (R1-R8 + R6+ Owner-approved)
- ✅ OWNER-POLICY Addendum v1.2 (Supabase access + v3.2 + paired commit-push)
- ✅ HANDOVER + SESSION-START-HERE updated untuk Tier 5 handover
- ✅ Handover bundle `tier5-handover-bundle.zip` siap untuk fresh session

**Yang fresh session perlu setup:**
- Branch creation `feature/tier-5a-audit-trail-backend`
- DDL execution (3 tables: usulan_revisi + usulan_revisi_perubahan + snapshot_pok)
- TypeScript types + state machine logic + Supabase CRUD layer
- Submit flow integration ke Tier 4c
- UI implementation (Tier 5b separate branch)

#### 0.12.6 Cross-References

- Phase 1 design: `docs/TIER-5-DESIGN.md` (authoritative, R1-R8 + R6+ locked)
- Original blueprint: `docs/TIER-3-PLUS-PLAN.md` §Tier-5 (updated with v1.2 supersedes note)
- Owner Policy: `OWNER-POLICY-FOR-AI-SESSIONS.md` Addendum v1.2
- Predecessor squash hashes (Tier 3+4 heritage):
  - Tier 3: `6c8f640`
  - Tier 4a: `abe193c`
  - Tier 4b: `d13be80`
  - Tier 4c: `9174782`
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.6 + §6 + §13

*§0.12.1–§0.12.6 ditambahkan 12 Mei 2026 setelah Tier 4c MERGED + Owner approve R1-R8 + R6+ batch defaults. Foundation work + handover prep di-eksekusi current session (commit `535085f`). Implementation handed off ke fresh AI session via `tier5-handover-bundle.zip`.*

#### 0.12.7 Phase 1.5 — DDL Execution Log (12 Mei 2026, fresh session)

Fresh AI session resumed Tier 5 work via handover bundle. Bootstrap 5-step completed, foundation consistency check returned 3 findings (HANDOVER snapshot lag cosmetic, Vercel switch pending, anon-key insufficient for DDL). Owner direction: share Supabase Management API token (`sbp_*`), AI auto-execute Phase 1.5.

**Branch:** `feature/tier-5a-audit-trail-backend` (created from main `535085f`)

**Pre-execute commit:** `b834415` chore(tier-5a init) — 4 SQL scripts + HANDOVER one-line sync. Tests 486/486 pass, TS 8/8 baseline maintained.

**Execution sequence** (timestamp UTC `2026-05-12T13:14:45Z`):

| # | Script | sha256 (12) | Size | Method | HTTP | Verify |
|---|---|---|---|---|---|---|
| 1 | `migrations/tier-5-001-usulan-revisi-schema.sql` | `0f83edb49bd7` | 6960 B | Supabase Management API `POST /v1/projects/{ref}/database/query` | `201` | 3 tables created (col counts: 7+5+6), 7 custom indexes + 3 PKs verified via `information_schema.tables` + `pg_indexes` |
| 2 | `migrations/tier-5-002-usulan-revisi-rls-policies.sql` | `18c3ee21e1a9` | 6354 B | (same) | `201` | RLS enabled on all 3 tables, 10 policies total (4+4+2) verified via `pg_class.relrowsecurity` + `pg_policies` |
| 3 | `migrations/tier-5-003-snapshot-pok-immutability.sql` | `a79e3dcc9cf8` | 3879 B | (same) | `201` | Trigger `snapshot_pok_immutable BEFORE UPDATE` + function `snapshot_pok_prevent_update` verified via `information_schema.triggers` + `pg_proc` |

**Smoke test (negative — R7c immutability enforcement):**

1. INSERT dummy `usulan_revisi` row → HTTP 201, returned id `39425682-2e8b-499c-9269-7f46eb46e718`
2. INSERT dummy `snapshot_pok` row (FK ke above) → HTTP 201, returned id `ee350856-a8bb-4ec0-95fa-ce11390f9c79`
3. Attempt `UPDATE snapshot_pok SET tahun_anggaran=9999 WHERE id=...` → **HTTP 400, error message verbatim:**
   > `ERROR: P0001: snapshot_pok records are immutable per Tier 5 R7c — cannot UPDATE row id=ee350856-a8bb-4ec0-95fa-ce11390f9c79`
   > `CONTEXT: PL/pgSQL function snapshot_pok_prevent_update() line 3 at RAISE`
4. ✅ **Trigger fired as designed** — UPDATE rejected dengan custom exception message persis sesuai script 003 line 22-24
5. Cleanup DELETE snapshot + DELETE usulan → HTTP 201 both, final row counts (0, 0, 0) verified

**Credential audit:** `sbp_***` token used was Supabase Management API Personal Access Token (not service_role JWT — beda mekanisme tapi sama-sama bisa execute DDL via management endpoint `/v1/projects/{ref}/database/query`). Token loaded dari `/mnt/user-data/uploads/temporary_supabase.txt` ke shell env variable only, tidak persisted di disk, tidak commit ke repo, unset setelah setiap operation. Per OWNER-POLICY Addendum v1.2 §H.3 PAT hygiene mirror — apply equivalent pattern untuk Supabase credentials.

**Post-execute state:**
- ✅ 3 tables exist di Supabase (`urrenbatik-cloud's Project`, `ap-northeast-2`, ACTIVE_HEALTHY)
- ✅ RLS V1 permissive (R5a single-user proxy) mirror existing envelope JSONB tables
- ✅ R7c trigger active + verified
- ✅ Rollback script `004` ready for emergency use (not executed)
- ✅ All test data cleaned (production tables empty, ready for Phase 2 Submit flow integration)

**Yang fresh session (Tier 5a Phase 2) perlu lanjut:**
1. TypeScript types `types/usulanRevisi.ts` — match JSONB shapes dari design §3.1/§3.2/§3.3
2. State machine `utils/usulanRevisiStateMachine.ts` — transition rules + R6+ override
3. Service layer `services/usulanRevisiService.ts` — Supabase CRUD wrapping `lib/supabase.ts`
4. Submit flow integration di `ValidationDashboardHeader.tsx` (wire onClick) → `ValidasiRevisiPOK.tsx` (handler) → `App.tsx` (state)
5. State machine tests (~30-40 tests target)
6. LHR APIP migration dari ephemeral state ke `system_settings` + `usulan_revisi.data.lhr_apip` (R3c)

Estimasi 5-7 substantive turn. Per Owner policy konteks 14, ini significant — split ke fresh session direkomendasikan untuk avoid compaction.

#### 0.12.8 Cross-References (post-Phase-1.5)

- Phase 1.5 execution commit: TBD (this batch — branch tier-5a)
- Migrations folder: `migrations/` (root-level SQL) — convention split from existing `lib/migrations/` (TS-based app-layer backfill)
- Live DB state (post Phase 1.5): 3 new tables present, 10 RLS policies, 1 immutability trigger
- Verification queries documented inline di setiap script footer (verify clauses)
- Next AI session bootstrap reference: this §0.12.7 + handover bundle (TBD if Phase 2 split)

*§0.12.7 ditambahkan setelah fresh session execute Phase 1.5 DDL successfully. R7c trigger smoke test passed verbatim. Tier 5a Phase 2 (backend implementation) recommended split to next fresh session per session budget management.*

#### 0.12.9 Phase 2 Backend Foundation — Execution Log (12 Mei 2026, fresh session continuation)

Fresh AI session (continuation pasca Phase 1.5) resumed dari handover bundle Phase 2. Bootstrap 5-step completed (OWNER-POLICY v1.0+v1.1+v1.2+v1.3, HANDOVER, SESSION-START-HERE, git verify, TIER-5-DESIGN §3+§4+§8). Baseline preflight verified: 486 tests pass, TS 8 errors, branch HEAD `05a4ac3` benign (1 commit beyond bundle claim — handover-prep commit itself). Supabase verified: 3 Tier 5 tables exist, 10 RLS policies, R7c trigger active, all rows = 0.

**Owner decisions (Konteks 1-15 dari temporary_supabase.txt):** R1c hybrid, R2b full snapshot, R3c both global+tied, R4a banner V1, R5a single-user proxy, R6+ manual override, R7c immutability, R8c partition 5a+5b. **Session strategy = Opsi A** (Phase 2.1+2.2+2.3 dulu, lanjut 2.4+2.5 kalau token sehat). **Folder convention = append ke root `types.ts`** (Owner override bundle's `types/usulanRevisi.ts` suggestion — keep single-file convention).

**Execution sequence:**

| Phase | Commit | Files | Tests | TS |
|---|---|---|---|---|
| 2.1 Types | `8ad4e40` (paired) | `types.ts` +181 lines (12 interfaces + 2 type unions) | n/a | 8 → 8 |
| 2.2 State machine | `8ad4e40` (paired) | `utils/usulanRevisiStateMachine.ts` +292 + tests +486 | 486 → 532 (+46) | 8 → 8 |
| 2.3 Service layer | `4990059` (paired) | `services/usulanRevisiService.ts` +430 + tests +582 | 532 → 573 (+41) | 8 → 8 |

**Phase 2.1 — Types (commit `8ad4e40`):**
- `UsulanStatus` (6-value union: draft/direkomendasi/diteruskan/ditetapkan/berlaku_efektif/ditolak)
- `UsulanJenis` (2-value union: revisi_pok/pagu_berubah)
- `UsulanRevisiData` JSONB shape (all fields optional saat draft, populated progressively): no_sk, tanggal_pengajuan/penetapan/berlaku_efektif, diusulkan_oleh/direkomendasi_oleh/ditetapkan_oleh, justifikasi, dasar_perintah, lhr_apip, validation_attempts[], manual_override_log[], template_sk_metadata (Tier 5+6 overlap β forward-compat)
- `UsulanRevisi` row interface (R1c hybrid: columned status/tahun_anggaran/jenis + JSONB data + created_at/updated_at; **NO created_by/updated_by** — beda dari pure envelope convention)
- `UsulanRevisiPerubahanData` + `UsulanRevisiPerubahan` (per-row diff: kode, nilai_semula, nilai_revisi, alasan, section_id)
- `SnapshotPokData` + `SnapshotPok` (full snapshot: pagu_sections, total_pagu, total_realisasi, generated_from_usulan_id; **JSONB column `snapshot_data` BUKAN `data`** — beda dari 2 tabel lain, documented inline)
- Companion types: `UsulanValidationAttempt`, `UsulanManualOverrideEntry`, `UsulanLhrApip`, `UsulanTemplateSkMetadata`

**Phase 2.2 — State machine (commit `8ad4e40`):**

6 transition rules per design §4.2:

| # | From | To | Validator | Side effect |
|---|---|---|---|---|
| 1 | draft | direkomendasi | validatorsPassed + lhrApipAcknowledged required | — |
| 2 | direkomendasi | diteruskan | none (R5a proxy) | — |
| 3 | diteruskan | ditetapkan | no_sk + tanggal_penetapan required | — |
| 4 | ditetapkan | berlaku_efektif | current date ≥ tanggal_berlaku_efektif | **create_snapshot** |
| 5 | any except berlaku_efektif | ditolak | reason text required (R6 permissive) | — |
| 6 | any | any | Manual Override (R6+), reason ≥ 5 char | — (R7c integrity) |

**Critical R7c defense — rule #6 NEVER triggers side effects.** Even `ditetapkan → berlaku_efektif` via override = NO snapshot create. Test `'override side effects always undefined'` verifies this. Snapshot creation HANYA via normal rule #4 untuk audit integrity.

Helpers: `isTerminalStatus(s)` (berlaku_efektif | ditolak), `getNextStatuses(from)` (UI button populate). `OVERRIDE_REASON_MIN_LENGTH = 5`.

Tests: 46 cases covering all 6 rules × edge cases (missing fields, empty strings, terminal states) + helpers + `TRANSITION_RULES` map structural sanity.

**Phase 2.3 — Service layer (commit `4990059`):**

11 functions exported di `services/usulanRevisiService.ts`:
- `createUsulanDraft(tahun, jenis, initialData?)` — INSERT status='draft'
- `getUsulanById(id)` — SELECT by PK, returns null if not found
- `listUsulan(filter?)` — filter by status/tahun_anggaran/jenis, ORDER created_at DESC
- `transitionUsulan(id, toStatus, ctxOverrides?)` — fetch + validate + UPDATE; caller responsible untuk eksekusi sideEffects.
- `recordValidationAttempt(id, result, violations?)` — append `data.validation_attempts[]`; omits violations_summary saat result='pass'.
- `recordManualOverride(id, toStatus, reason, actor)` — R6+ override path: validates dengan isManualOverride=true, UPDATE status + append `data.manual_override_log[]`. Throws on disallowed.
- `addPerubahan(usulan_id, pagu_row_id, perubahanData)` / `listPerubahan(usulan_id)`
- `createSnapshot(usulan_id, tahun, tanggal_efektif, paguSections, total_realisasi?)` — INSERT row, compute total_pagu via `||` fallback (revisi || awal — treat 0 sebagai "not revised" sentinel)
- `getSnapshotByDate(tahun, tanggal_efektif)` / `listSnapshots(tahun)`

**R7c defense in depth (2 layers):**
1. DB trigger `snapshot_pok_immutable BEFORE UPDATE` (storage layer, Phase 1.5)
2. **NO** `updateSnapshot` function in service module (app layer, Phase 2.3)

Negative test `'R7c defense — no update*Snapshot* export'` regex-checks exports untuk `update*snapshot*` atau `snapshot*update*` — expects empty. Catches future regression if developer accidentally adds updater function.

Tests: 41 cases dengan centralized `mockResponses(...)` helper (chainable mock + payload capture). All 11 functions covered + edge cases (not found, error propagation, filter combinations, JSONB append preserving existing entries).

**Test mock pattern (helper untuk fresh session reference):**

```typescript
function mockResponses(...responses: Array<{ data: any; error: any }>) {
  // Queue responses, support chain.from().select().eq()...{single|maybeSingle|then}
  // Returns captured: { from, insert[], update[], eq[], order[] }
  // beforeEach() calls supa.from.mockReset()
}
```

Awaitable chain via `chain.then = (onF) => Promise.resolve(popResponse()).then(onF)` untuk operations yang use `.order()` sebagai terminal (`listUsulan`, `listPerubahan`, `listSnapshots`).

**Yang fresh session (Phase 2.4 + 2.5) perlu lanjut:**
1. **Phase 2.4** — Submit flow UI integration:
   - `App.tsx:93` `lhrApipAcknowledgedByYear` ephemeral state masih ada — Phase 2.4 wire ke service tapi belum migrate
   - `App.tsx:1202-1206` props pass-through ke `ValidasiRevisiPOK`
   - `components/ValidasiRevisiPOK.tsx:75-88, 169-175` props receiver
   - `components/ValidationDashboardHeader.tsx:170-194` Submit button currently no `onClick` — add wiring
   - `ValidationDashboardHeader.tsx:24-37` props interface — add `onSubmit?: () => void`
   - **CAUTION:** `App.tsx` has 7 baseline TS errors (lines TBD post-recheck) — preserve exactly, jangan tambah
2. **Phase 2.5** — LHR APIP R3c migration:
   - Migrasi `lhrApipAcknowledgedByYear` ephemeral → persist `system_settings.lhr_apip_global` (use existing `lib/supabase.ts:195-210` getSetting/saveSetting pattern)
   - Tied audit per-submission: populate `usulan_revisi.data.lhr_apip` saat Submit fire
   - Banner V1 UI (R4a Owner choice — text-only, no link): cek system_settings on mount, show banner kalau global LHR APIP belum di-acknowledge
3. Estimasi 4-6 substantive turn untuk Phase 2.4 + 2.5 combined. Disarankan split kalau token >50% di tengah Phase 2.4.

**Reference saat fresh session bootstrap:**
- `HANDOVER.md` line 26-27 (current state pointer)
- `SESSION-START-HERE.md` (Phase 2.4+2.5 oriented — update di handover prep commit)
- This §0.12.9 untuk Phase 2.1-2.3 detail
- `services/usulanRevisiService.ts` — ready untuk import dari komponen
- `utils/usulanRevisiStateMachine.ts` — ready untuk validation queries

*§0.12.9 ditambahkan setelah Phase 2 backend foundation (2.1+2.2+2.3) COMPLETE — 87 tests added, 0 TS regression. Phase 2.4+2.5 UI integration handed off ke fresh AI session per Owner direction (Konteks 14/15 token budget management).*

#### 0.12.10 Phase 2.4 Submit Flow UI Integration — Execution Log (12 Mei 2026, fresh session)

Fresh AI session (continuation pasca Phase 2.1-2.3 backend foundation) resumed dari handover bundle `tier5a-phase2_4-pickup-bundle.zip`. Bootstrap 6-step completed (BUNDLE-README, OWNER-POLICY v1.0+v1.1+v1.2+v1.3, HANDOVER, SESSION-START-HERE, git verify, SSOT §0.12.9, PHASE-2-BACKEND-API-REFERENCE.md). Baseline preflight verified: 573 tests pass, TS 8 errors, branch HEAD `b7f4164` matches bundle claim exactly. Supabase live state verified: 3 Tier 5 tables empty, `lhr_apip_global` key belum exists di `system_settings`.

**Owner decision (post-preflight):** Opsi A — Phase 2.4 + 2.5 di sesi ini, lalu handover ke Phase 3 Owner E2E. **Actual outcome:** Phase 2.4 completed + committed di sesi ini. Phase 2.5 split ke fresh session karena budget assessment (~65% terpakai sebelum Phase 2.5 dimulai) — Skenario B chosen post commit/push paired pattern.

**Architectural decision Phase 2.4 — DI orchestrator pattern:**

Karena project tidak punya React Testing Library (verified `package.json` grep), handler-level testing tidak feasible langsung. Solusi: extract orchestration logic ke pure async function dengan dependency injection (`SubmitRevisiServices` interface), UI handler jadi thin wrapper untuk side effects (toast + setState).

Pattern proven untuk Phase 2.4 + future Phase 5b kalau handler-level testing tetap diperlukan tanpa RTL dependency.

**Files created/modified:**

| File | Status | Lines | Tests |
|---|---|---|---|
| `utils/submitRevisiHelpers.ts` | NEW | +225 | (covered di test file) |
| `utils/submitRevisiHelpers.test.ts` | NEW | +370 | 25 (8 collect + 4 summarize + 13 orchestrator) |
| `components/ValidationDashboardHeader.tsx` | MOD | +25 | (existing — no test) |
| `components/ValidasiRevisiPOK.tsx` | MOD | +15 | (existing — no test) |
| `App.tsx` | MOD | +70 | (handler tested via orchestrator unit tests) |

**Helper API (utils/submitRevisiHelpers.ts):**

1. `collectChangedRowsWithSection(sections: PaguSection[]): ChangedRowEntry[]` — pure extractor pakai existing `isChangedRow` dari `utils/validators/helpers.ts` (single source of truth, AP-4 no duplication). Output entry shape `{section_id, pagu_row_id, perubahanData}` siap untuk `addPerubahan` call.
2. `summarizeChangedRows(entries): string` — "N row berubah di M section" id-ID format.
3. `executeSubmitRevisiPOK(args): Promise<SubmitRevisiResult>` — async orchestrator. Args: `{paguSections, tahunAnggaran, lhrApipAcknowledged, diusulkanOleh?, services}`. Services DI: `{createUsulanDraft, addPerubahan, recordValidationAttempt, transitionUsulan}`. Returns discriminated:
   - `{kind: 'no_changes'}` — zero changed rows
   - `{kind: 'state_rejected', reason, usulanId}` — transition validator returned allowed=false
   - `{kind: 'service_error', phase, message}` — DB threw at specific phase ('create' | 'perubahan' | 'validation' | 'transition')
   - `{kind: 'success', usulanId, summary}` — full sequence completed

**Sequence per orchestrator (PHASE-2-BACKEND-API-REFERENCE.md Recipe A pattern):**

1. Extract changed rows; kalau 0 → early return `no_changes`
2. `createUsulanDraft(tahun, 'revisi_pok', {tanggal_pengajuan, diusulkan_oleh, justifikasi})` — INSERT status='draft'
3. `addPerubahan × N` parallel via `Promise.all` (R5a single-user, no ordering concern)
4. `recordValidationAttempt(usulanId, 'pass')` — audit Itjenad trail
5. `transitionUsulan(usulanId, 'direkomendasi', {validatorsPassed: true, lhrApipAcknowledged})` — gated dengan state machine
6. Return `success` atau `state_rejected` kalau transition disallowed

**Handler di App.tsx (handleSubmitRevisiPOK):**

```typescript
const handleSubmitRevisiPOK = useCallback(async () => {
  if (isSubmittingRevisi) return; // re-entrancy guard
  setIsSubmittingRevisi(true);
  try {
    const result = await executeSubmitRevisiPOK({
      paguSections,
      tahunAnggaran: currentRKKSYear,
      lhrApipAcknowledged: lhrApipAcknowledgedByYear[currentRKKSYear] ?? false,
      services: { createUsulanDraft, addPerubahan, recordValidationAttempt, transitionUsulan },
    });
    switch (result.kind) {
      case 'no_changes': toast.error('Tidak ada row yang berubah...'); break;
      case 'state_rejected': toast.error(`Submit gagal di state transition: ${result.reason}`); break;
      case 'service_error': toast.error(`Submit gagal di phase ${result.phase}: ${result.message}`); break;
      case 'success': toast.success(`✅ Submit berhasil — ${result.summary}. Status: direkomendasi.`); break;
    }
  } finally {
    setIsSubmittingRevisi(false);
  }
}, [isSubmittingRevisi, paguSections, currentRKKSYear, lhrApipAcknowledgedByYear]);
```

**Phase 2.4 deliberately deferred (Phase 2.5 scope):**
- `data.lhr_apip` TIDAK di-populate karena `UsulanLhrApip` requires `nomor + tanggal` (UI belum capture, Phase 2.5 introduce form atau Strategy A placeholder)
- `lhrApipAcknowledgedByYear` masih ephemeral useState — Phase 2.5 migrate ke `system_settings.lhr_apip_global`
- Banner V1 UI — Phase 2.5

**Commit + push paired (12 Mei 2026):**

| Step | Detail |
|---|---|
| Commit sha | `958e426` |
| Commit message | "feat(tier-5a phase 2.4): Submit flow UI integration + 25 tests" |
| Push status | ✅ `b7f4164..958e426` di feature/tier-5a-audit-trail-backend |
| Co-authored-by | AI Assistant <claude-ai@anthropic.local> |
| Baseline | TS 8/8 maintained, Tests 573 → 598 (+25), Vite build success ~7.6s |
| PAT hygiene | ✅ verified clean |

**In-session commit principle (Owner direction — codified to OWNER-POLICY v1.4 §P):**

Mid-session Owner pushed back terhadap rencana saya untuk handover commit/push ke fresh session. Reasoning: "spoke session yang lakukan kerja punya konteks penuh — paling natural untuk commit/push, fresh session pakai bundle handover sebagai recovery dari context loss, BUKAN primary path". Diadopsi ke v1.4 Addendum (lihat OWNER-POLICY-FOR-AI-SESSIONS.md §P).

**Yang fresh session (Phase 2.5) perlu lanjut:**

1. Migrate `App.tsx:96` `lhrApipAcknowledgedByYear` ephemeral → persisted di `system_settings.lhr_apip_global` (pakai existing `getSetting/saveSetting` di `lib/supabase.ts:194-207`)
2. Tied audit per-submission: extend `executeSubmitRevisiPOK` accept `lhrApipForYear?: UsulanLhrApip` param, populate `initialData.lhr_apip` saat createUsulanDraft
3. Banner V1 UI (R4a Owner choice — text-only, no link, conditional render kalau current year belum acknowledged)
4. Phase 2.5 Strategy decision needed at session start:
   - **Strategy A (V1 minimal, default safer)**: Keep checkbox-only UX, persist `Record<number, {acknowledged, acknowledged_at, nomor?, tanggal?}>` (nomor/tanggal optional V2). Placeholder values di tied audit kalau tidak ada.
   - **Strategy B (richer)**: Add nomor + tanggal input fields ke ValidationDashboardHeader area C8. Capture full LHR APIP info. Lebih effort tapi unlock real tied audit.

Estimasi Phase 2.5: 3-4 substantive turn (Strategy A lebih ringan, Strategy B medium).

#### 0.12.11 Cross-References Phase 2.4 + Phase 2.5

- `HANDOVER.md` — Phase 2.4 COMPLETE flag (commit `958e426`), Phase 2.5 PENDING
- `OWNER-POLICY-FOR-AI-SESSIONS.md` Addendum v1.4 §P — in-session commit principle
- `SESSION-START-HERE.md` — re-targeted untuk Phase 2.5 orientation
- `constants/devLog.ts` — Tier 5a Phase 2.4 milestone entry
- `tier5a-phase2.5-handover-bundle.zip` — self-contained untuk fresh session (Phase 2.5 + handover docs Phase 3 prep)

*§0.12.10 + §0.12.11 ditambahkan setelah Phase 2.4 EXECUTED + committed `958e426`. Phase 2.5 (LHR APIP R3c migration) + handover docs Phase 3 prep handed off ke fresh AI session per Owner direction (token budget tight, Skenario B chosen).*

#### 0.12.12 Phase 2.5 LHR APIP R3c Migration — Execution Log (13 Mei 2026, fresh session)

Fresh AI session (continuation pasca Phase 2.4 handover bundle) resumed dari `tier5a-phase2.5-pickup-bundle.zip`. Bootstrap 6-step completed (BUNDLE-README, OWNER-POLICY full sampai v1.4, HANDOVER, SESSION-START-HERE, git verify, SSOT §0.12.9-§0.12.11, PHASE-2-BACKEND-API-REFERENCE). Baseline preflight verified zero drift: 598 tests pass, TS 8 errors, branch HEAD `fedfca5` exact match. Supabase live state confirmed: `system_settings.lhr_apip_global` key belum exists (clean slate), 3 Tier 5 tables empty.

**Owner decision Phase 2.5 (13 Mei 2026):** **Strategy A** (V1 minimal, default safer per §R.2 framing). Rationale: checkbox-only UX current sudah familiar Sie Renbang; Strategy B richer audit defer ke V2 setelah workflow stable. Forward-compat dipreserve sejak V1 — schema JSONB include optional `nomor?` + `tanggal?` fields, jadi upgrade Strategy B nanti tidak perlu schema migration.

**Architectural choices Phase 2.5:**

1. **Pure helpers ekstraksi** — `shouldShowLhrApipBanner` + `deriveLhrApipForSubmission` placed di `utils/submitRevisiHelpers.ts` (existing module Phase 2.4) supaya banner predicate + tied audit derivation testable tanpa React Testing Library (sama pattern Phase 2.4 DI orchestrator).

2. **Types co-located dengan helpers** — `LhrApipYearEntry` + `LhrApipGlobalState` + `LHR_APIP_GLOBAL_KEY` const tinggal di helper module (BUKAN dipindah ke `types.ts`) karena scope local untuk Phase 2.5 plumbing — `UsulanLhrApip` di `types.ts` tetap canonical untuk DB JSONB tied audit. AP-4 single source of truth maintained.

3. **State shape upgrade backward-compat** — App.tsx `lhrApipAcknowledgedByYear` migrate dari `Record<number, boolean>` ke `Record<number, LhrApipYearEntry>`. Existing call sites:
   - Line 1339 prop pass: `lhrApipAcknowledgedByYear[currentRKKSYear]?.acknowledged ?? false` (consumer interface ke `<ValidationDashboardHeader>` tetap `boolean` — zero touch ke header component)
   - Line 1340 setter callback: replaced dengan `handleLhrApipChange` callback yang persist via `saveSetting` (best-effort, error console-log only — UX tetap responsive)

4. **Best-effort load on mount** — useEffect at line 152 panggil `getSetting<LhrApipGlobalState>('lhr_apip_global')`. Error path: state tetap kosong → banner V1 show (safer fail-default per R4a Owner choice "warn dulu daripada silent allow Submit").

5. **Banner placement** — di top `<ValidasiRevisiPOK>` (sebelum `<ValidationDashboardHeader>`) bukan App-level layout. Alasan: scope C8 gate hanya di tab Validasi (subtab 1.5), banner di tab lain noise. Conditional render `{!lhrApipAcknowledged && (...)}` — predicate sama dengan `shouldShowLhrApipBanner` tapi inline (existing `lhrApipAcknowledged` boolean prop sudah carry info, tidak perlu pass state object terpisah).

**Execution sequence:**

| Phase | Commit | Files | Tests | TS |
|---|---|---|---|---|
| 2.5 R3c + Banner V1 | `93d9155` (paired) | 4 MOD (+397 / -16) | 598 → 610 (+12) | 8 → 8 |

**Files modified (4):**

| File | Change | Detail |
|---|---|---|
| `utils/submitRevisiHelpers.ts` | +137 lines | NEW: `LhrApipYearEntry`, `LhrApipGlobalState`, `LHR_APIP_GLOBAL_KEY` const, `shouldShowLhrApipBanner`, `deriveLhrApipForSubmission`. EXTEND: `executeSubmitRevisiPOK` args (`lhrApipForYear?`), conditional spread `initialData.lhr_apip` di `createUsulanDraft` call site |
| `utils/submitRevisiHelpers.test.ts` | +156 lines (12 tests) | 3 tests `executeSubmitRevisiPOK` propagation (undefined / Strategy A placeholder / Strategy B real); 4 tests `shouldShowLhrApipBanner` (null state / no entry / unack / ack); 5 tests `deriveLhrApipForSubmission` (null / missing / unack / Strategy A / Strategy B) |
| `App.tsx` | +90 / -16 lines | Import extension (helpers + getSetting/saveSetting), state shape migration line 105, useEffect mount-load line 152, `handleLhrApipChange` callback line ~1077 (post-`currentRKKSYear` declaration), `handleSubmitRevisiPOK` extended (derive + pass `lhrApipForYear`), prop pass-through update line ~1339 |
| `components/ValidasiRevisiPOK.tsx` | +30 lines | Banner JSX block sebelum `<ValidationDashboardHeader>`, conditional `{!lhrApipAcknowledged && ...}`, amber color scheme + alert role + aria-live=polite, citation Pasal 22 huruf b angka 2 Perdirjen Renhan Kemhan 7/2025 |

**API surface Phase 2.5 (untuk reference Phase 3+):**

```typescript
// utils/submitRevisiHelpers.ts — Phase 2.5 additions
export interface LhrApipYearEntry {
  acknowledged: boolean;
  acknowledged_at: string;
  nomor?: string;       // V2 forward-compat (Strategy B upgrade)
  tanggal?: string;     // V2 forward-compat
}
export type LhrApipGlobalState = Record<number, LhrApipYearEntry>;
export const LHR_APIP_GLOBAL_KEY = 'lhr_apip_global' as const;
export function shouldShowLhrApipBanner(state, year): boolean;
export function deriveLhrApipForSubmission(state, year): UsulanLhrApip | null;

// executeSubmitRevisiPOK extended args:
//   + lhrApipForYear?: UsulanLhrApip  // R3c tied audit payload
```

**Test coverage detail (+12 tests):**

| Suite | Tests | Coverage |
|---|---|---|
| `executeSubmitRevisiPOK` Phase 2.5 propagation | 3 | (a) undefined param → no `lhr_apip` key di initialData (backward compat); (b) Strategy A payload → captured verbatim; (c) Strategy B payload → captured verbatim |
| `shouldShowLhrApipBanner` predicate | 4 | null state, empty state, unack entry, ack entry |
| `deriveLhrApipForSubmission` derivation | 5 | null state, missing year, unack entry, Strategy A placeholder shape, Strategy B real values |

**Owner self-check budget protocol (per §P.4):**

| Step | Result |
|---|---|
| Estimate remaining work (post-bootstrap) | ~25% budget untuk Phase 2.5 + ~15% docs sync + ~10% handover prep |
| Trivial-cost actions outstanding | docs sync (in-session commit principle applies) |
| In-session commit decision | ✅ EXECUTE — well within 70% budget headroom |
| Outcome | All Phase 2.5 + docs sync committed in this session, NO handover bundle prep needed kalau Phase 3 = Owner E2E test (Owner-driven, not AI substantive) |

**R7c immutability invariant verified (Inv-1):**

Phase 2.5 changes touch `data.lhr_apip` field di `usulan_revisi` row. NO changes ke `snapshot_pok` (R7c immutability intact). Service layer test `'R7c defense — no update*Snapshot* export'` masih pass. UI Phase 2.5 tidak introduce path UPDATE ke snapshot.

**Yang Phase 3 perlu lanjut (Owner E2E test):**

1. **Owner manual smoke test** di Vercel Preview URL untuk feature branch:
   - Check checkbox C8 → banner hilang
   - Refresh browser → state persisted (banner tetap hilang)
   - Uncheck checkbox → banner muncul lagi + saveSetting (verify di Supabase `system_settings.lhr_apip_global`)
   - Trigger Submit flow dengan changed row → verify `usulan_revisi.data.lhr_apip` populated di Supabase
2. **Phase 4 squash merge** `feature/tier-5a-audit-trail-backend → main` setelah Owner approve E2E result
3. **Production promotion** (separate step): `main → production` merge via Vercel Dashboard atau git push

#### 0.12.13 Cross-References Phase 2.5

- `HANDOVER.md` — Phase 2.5 COMPLETE flag (commit `93d9155`), Phase 3 PENDING (Owner E2E)
- `constants/devLog.ts` — Tier 5a Phase 2.5 milestone entry
- `utils/submitRevisiHelpers.ts:259-378` — Phase 2.5 section (types + 2 pure helpers)
- `utils/submitRevisiHelpers.test.ts:567-722` — Phase 2.5 test cases
- `components/ValidasiRevisiPOK.tsx:179-208` — Banner V1 JSX block
- `App.tsx:152-168` (mount-load useEffect), `:1077-1097` (handleLhrApipChange), `:1100-1149` (extended handleSubmitRevisiPOK)
- `docs/TIER-5-DESIGN.md §3.3 + §5` — R3c design intent (LIVE post Phase 2.5)
- `docs/REVISI-POK-PAGU-vKoreksi.md §22 huruf b angka 2` — domain reference (LHR APIP wajib)

*§0.12.12 + §0.12.13 ditambahkan setelah Phase 2.5 EXECUTED + committed `93d9155` (13 Mei 2026). Phase 3 (Owner E2E test) handed off ke Owner manual workflow — bukan substantive AI work. Setelah Phase 3 sukses, Phase 4 squash merge `feature/tier-5a-audit-trail-backend → main` triggered.*

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

## 5. Sprint D Item #2 — UX Pagu Diff Visibility (4 phases, 11 Mei 2026)

**Trigger:** dr Ferry (successor) request — Sie Renbang + Karumkit perlu cara cepat melihat pagu Semula vs Revisi (nilai maupun item), bukan harus scroll 60+ rows.

**Domain context dari Konteks 3 dr Ferry:** Revisi bisa berarti:
1. **Perubahan** — penambahan / pengurangan / penggantian (numeric shift)
2. **Breakdown** — disintegrasi akun general jadi akun lebih kecil (struktural)

UI harus cover keduanya. Setelah falsifikasi accounting check, framing dr Ferry accurate per standar DIPA/POK Indonesia (umbrella term: Pagu Bertambah / Berkurang / Pergeseran / Rincian Breakdown).

### 5.1 Phase 1 + 2 — Dashboard + Sintesis + Filter + Indicator (commit `6e8419d`)

**Files baru:**
- [`utils/paguDiff.ts`](./utils/paguDiff.ts) (215 lines)
  - `classifyRow(row)` → `'BERTAMBAH' | 'BERKURANG' | 'BARU' | 'TIDAK_BERUBAH'`
  - Pakai `getEffectiveValue` helper (Sprint D Item #1) untuk Konteks 1 fallback
  - `computeSintesis(sections)` → aggregate: totalSemula, totalRevisi, netChange, rowsAffected, groups per category
  - `getHiddenRowIds(rows, mode)` — filter helper untuk inline filter

- [`components/PaguDiffDashboard.tsx`](./components/PaguDiffDashboard.tsx) (239 lines)
  - **Opsi C — 4 summary cards** di top: Pagu Semula | Pagu Revisi | Net Change | Rows Affected
  - **Opsi B — Sintesis Revisi table** dengan 4 expandable groups:
    - Pagu Bertambah (green, TrendingUp)
    - Item Baru / Breakdown (blue, Plus) — handles Konteks 3 breakdown case
    - Pagu Berkurang (red, TrendingDown)
    - Tidak Berubah (slate, Equal) — Konteks 1 baseline holdovers
  - Click group untuk drill-down per-row dengan Semula → Revisi flow

**Files diubah:**
- [`components/PaguAnggaran.tsx`](./components/PaguAnggaran.tsx)
  - Import PaguDiffDashboard + paguDiff helpers
  - Render dashboard di atas section list (setelah duplicate warnings)
  - **Opsi A — Filter chips** di atas section list: `Semua | Hanya Direvisi | Item Baru Saja`
  - **Opsi A — Per-row indicator pill** (2px colored dot di kode cell, hover tooltip dengan delta info)
  - Auto-hide parent saat semua children hidden

### 5.2 Phase 3 — Print-ready Laporan Revisi (commit `c0e43bb` + refactor `026cb56`)

**Initial (`c0e43bb`):** Single-mode "Laporan Revisi POK" — print-styled modal A4 portrait dengan kop TNI AD + tabel detail + signature block.

**Critical refactor (`026cb56`)** per masukan Sie Renbang via dr Ferry:

> **ADA DUA jenis laporan revisi yang substantif berbeda:**
> 1. Laporan Revisi POK (net change = 0): bisa kapan saja, biasanya per BULAN
> 2. Laporan Tambah Pagu (net change > 0): setelah habis 1 SEMESTER

**File:** [`components/LaporanRevisi.tsx`](./components/LaporanRevisi.tsx) (renamed dari `LaporanRevisiPOK.tsx`)

**Props:**
```typescript
type LaporanMode = 'pergeseran' | 'tambah_pagu';
interface LaporanRevisiProps {
  sections: PaguSection[];
  selectedYear: number;
  mode: LaporanMode;
  onClose: () => void;
}
```

**Mode `pergeseran` (Laporan Revisi POK — bulanan):**
- Title: "Laporan Revisi POK Tahun Anggaran {YEAR}"
- Subtitle: "Pergeseran Antar Akun (Net Change = 0)"
- Periode field: "Bulan: ........ (diisi manual)"
- Validation warning: warn jika net != 0
- Format: **2-column side-by-side**
  - Kiri merah "Dari Akun (Pengurangan)" → list category BERKURANG dengan total signed −
  - Kanan hijau "Ke Akun (Penambahan)" → list BERTAMBAH + BARU (labeled `[BARU]`) dengan total signed +
- Signature block: **2-column** (Sie Renbang + Karumkit) — internal approval saja
- Justifikasi placeholder: "alasan operasional, urgensi, dampak ke pelayanan"

**Mode `tambah_pagu` (Laporan Tambah Pagu — semesteran):**
- Title: "Laporan Penambahan Pagu Tahun Anggaran {YEAR}"
- Subtitle: "Permohonan Penambahan Pagu Semester"
- Periode field: "Semester ........ TA {YEAR}"
- Validation warning: warn jika net <= 0
- Format: **per-section breakdown** dengan 7-kolom (Kode | Uraian | Vol | Semula | Revisi | Selisih | Jenis)
- Subtotal section di footer setiap tabel
- Signature block: **3-column** (Sie Renbang + Karumkit + Diketahui Palembang)
- Justifikasi placeholder: "...plus sumber pendanaan tambahan"

**Toolbar PaguAnggaran:**
- State `showLaporan` boolean → `LaporanMode | null`
- Replace 1 button "Laporan Revisi" dengan 2 buttons:
  - "Laporan Revisi POK" (tooltip: Pergeseran antar akun, biasanya bulanan)
  - "Laporan Tambah Pagu" (tooltip: Penambahan pagu, biasanya semesteran)

### 5.3 Cleanup — .gitignore Fix (commit `9b9699c`)

Saat commit `026cb56` (refactor dual-mode), accidentally tertimbun 3,052 file `node_modules/` di tracking. Root cause: `.gitignore` line 1 ada typo prefix `-e node_modules/` — prefix `-e ` invalid bikin pattern tidak match.

**Fix:**
- `.gitignore` rewritten clean: `node_modules/`, `dist/`, `package-lock.json`, `.DS_Store`, `*.log`, `.env`, `.env.local`, `.vercel`
- `git rm -r --cached node_modules/` → 3,052 files removed dari tracking
- Future commits tidak akan track node_modules lagi
- ⚠ History commit `026cb56` masih punya blob node_modules (~beberapa MB bloat). Opsional purge dengan `git filter-branch` butuh force-push, untuk RS Batin Tikal context tidak urgent.

### 5.4 Phase 4 — Ringkasan Pagu List View (Sie Renbang request)

**Trigger:** Sie Renbang via dr Ferry, 11 Mei 2026 — "Ringkasan Pagu Per Kode Akun (Konsolidasi Mata Anggaran Dasar Pembayaran Tagihan), saat ini berbentuk kartu (sulit dibaca), lebih mudah jika berbentuk list."

Visual: 30+ kode akun (post Sprint D Item #1) dalam grid 4-kolom card layout. Untuk scan/comparison antar kode susah.

**File:** [`components/PaguAnggaran.tsx`](./components/PaguAnggaran.tsx)

Replace grid 4-kolom cards → tabel list 6-kolom:

| Kolom | Konten |
|---|---|
| Kode Akun | Mono font hijau emerald |
| Uraian Komponen | Description, uppercase tracking |
| Target Semula | Right-align, slate-400 |
| Target Revisi | Right-align, emerald-400 bold, subtle bg |
| Δ Selisih | Signed, colored (emerald +/red −/slate 0) |
| Status | Badge — TAMBAH / KURANG / BARU / TETAP |

**Features:**
- **Search input** di header section — filter by kode atau uraian (case-insensitive). Penting saat 30+ rows.
- **Zebra striping** alternating rows (transparent / white/[0.02]) untuk readability
- **Hover row** emerald glow
- **Sticky footer row** dengan total Semula, Revisi, Delta (recompute on filter)
- **Empty state** kalau filter tidak match: "Tidak ada kode yang cocok dengan ..."

**Status badge color:**
- TAMBAH → emerald (delta > 0, semula > 0)
- KURANG → red (delta < 0)
- BARU → blue (semula = 0, revisi > 0)
- TETAP → slate (semula = revisi)

State baru: `ringkasanFilter: string`. Filtered + total computed inline dalam IIFE.

**Tetap dipertahankan:** "Total Pagu Keseluruhan RS TA {YEAR}" summary card di bawah list (showing Rp 2,709,935,000.40 untuk TA 2025).

### 5.5 Commit Trail Lengkap Sprint D Item #2

| Commit | Konten |
|---|---|
| `6e8419d` | Phase 1+2 — Dashboard Cards + Sintesis Table + Inline Indicator + Filter Chip |
| `c0e43bb` | Phase 3 initial — single-mode Laporan POK (print-ready) |
| `026cb56` | Phase 3 refactor — dual-mode LaporanRevisi (pergeseran + tambah_pagu) per Sie Renbang input. **Accidentally included node_modules.** |
| `9b9699c` | .gitignore cleanup — remove 3,052 node_modules files dari tracking |
| (this) | Phase 4 — Ringkasan Pagu list view (Sie Renbang request) |

---

## 6. Pending Work

### 6.1 Sprint D Item #3+ (Belum Mulai)

1. **Year handling bug** di `utils/realisasiBucket.ts` line 153 — default `tahun = 2025` saat `selectedYear='ALL'`. Perlu fix supaya bucket aggregator handle multi-year correctly.
2. **Multi-year `paguByKode` lookup** — saat ini single-year only. Untuk regression test LRA multi-tahun, butuh extend.
3. **Audit log CRUD** — per Angga Section 4 saran: `IV-OVER-PAGU` upgrade butuh override mechanism dengan `audit_log` entry yang justifikasi.

### 6.2 Sprint E (Priority Angga — Belum Mulai)

1. **LRA aggregator regression test** — Angga's explicit Section 4 concern: angka LRA per Lampiran sebelum & sesudah B.4 backfill harus identik. Butuh snapshot before/after dan compare.
2. **Update audit doc original** — `SIKESUMA-Audit-BAS-Konformitas.md` Section 1.2 + 3 dengan HB#1/2/3 corrections per CORRIGENDUM.

### 6.3 Sprint F (Proposal Future)

1. **Workflow approval Palembang gate** — revisi POK / restrukturisasi section pagu / upgrade kode lintas seri 52→53 → trigger notifikasi Palembang via staging table sebelum commit. Audit log per change dengan reasoning.
2. **HITL UI di Settings tab** — Angga input HITL recommendations langsung via UI (saat ini perlu edit `utils/internalRecommendations.ts` di repo).
3. **Periode/header field laporan** — kalau Sie Renbang reports preferensi format spesifik, tambah input fields untuk nomor surat, bulan/semester, dll (saat ini placeholder "diisi manual").

### 6.4 Cleanup Items

1. **Optional purge node_modules dari history** — commit `026cb56` masih punya 3,052 file node_modules di blob (~bloat repo size). `git filter-branch` / `git-filter-repo` bisa purge, tapi butuh force-push. Tidak urgent untuk RS Batin Tikal team kecil.
2. **PAT rotation** setelah Sprint E complete.

---

## 7. Important Caveats untuk New Spoke Sessions

### 7.1 ⚠️ Data is Disposable (Saat Ini)

Per user statement: data Pagu TA 2025 di Supabase live akan **di-wipe dan reload** setelah roadmap A-E stable. Jadi current values bisa berubah; **logic + code adalah yang penting**, bukan specific numbers.

### 7.2 ⚠️ Pre-existing TS Errors (Tidak Touched)

Beberapa TS errors yang **bukan dari Sprint A-D** dan **tidak boleh** di-fix tanpa konfirmasi (per snapshot 11 Mei 2026, baseline = 11 errors total):
- `App.tsx` line 573, 805, 818 — `forEach/tks/nakes/pengelola` on unknown type
- `PaguAnggaran.tsx` line 292 (was 272 saat handover dibuat — shifted oleh edit lain pasca Sprint D Item #1) — `.join()` on unknown
- `constants/devLog.ts` line 287, 315, 1044 — DevLogAuthor type mismatch

TS check command yang filter pre-existing:
```bash
npx tsc --noEmit --skipLibCheck 2>&1 | \
  grep -E "error TS" | grep -v "TS2688" | \
  grep -v -E "App\.tsx\((573|805|818)|PaguAnggaran\.tsx\(292|devLog\.ts\((287|315|1044)"
```

> **Catatan line-shift**: Line PaguAnggaran.tsx `.join()` error bisa shift lagi di masa depan saat ada edit pre-line. Update regex saat shift, dan refresh nomor line di list bullet di atas. Successor: jangan asumsi line nomor stale — verify dulu dengan `npx tsc --noEmit --skipLibCheck 2>&1 | grep PaguAnggaran`.

### 7.3 ⚠️ Tab 1.2 RAB Belum di-Review

Per Angga: "sementara fokus pada 1.1 Pagu Anggaran dulu". **Jangan ekspansi ke tab 1.2 RAB review** tanpa request explicit. HITL infrastructure (autocomplete + recommendations) sudah ready untuk diaktifkan di RAB — tinggal pass `description` prop saat siap.

### 7.4 ⚠️ Dummy TA 2024 Dipertahankan

Per user keputusan (11 Mei 2026): **dummy TA 2024 di-keep untuk regression test Sprint E**. **Jangan hapus** sampai Sprint E selesai. Coverage 96% (59/61) memang ada 2 orphan parents di dummy 2024 (kode 521311, 521411 invalid BAS — by design).

### 7.5 ⚠️ Honor Nominal Confirmed Annual (BUKAN Monthly)

Pernah ada false alarm di doc v2.0 yang bilang "Honor monthly nominal". **FALSE.** Honor TKS/Nakes/Pengelola di RS Batin Tikal **semua annual** (TKS Rp 195jt, Nakes Rp 786jt, Pengelola Rp 48jt). False alarm dulu karena baca field `jumlahBiayaRevisi` yang stale (sebelum Sprint D Item #1 fix). Successor sessions jangan terjebak lagi.

### 7.6 ⚠️ ATK = 521811 (BUKAN 521111)

Per Angga konfirmasi: di RS Batin Tikal, ATK di-bundle dengan Bekkes (`521811.03`) bukan dipisah ke `521111` (Belanja Keperluan Perkantoran). Reasoning: di RS, ATK adalah konsumsi sehari-hari bagian dari Bekkes operasional. HITL ATK-001 sudah encode ini.

### 7.7 ⚠️ Effective Value Formula (Aggregator Mandate)

**JANGAN baca `jumlahBiayaAwal`/`jumlahBiayaRevisi` field langsung di aggregator/IV check.** Pakai `getEffectiveValue(row, mode)` dari `utils/paguLookup.ts`. Field DB bisa stale di future (bug-resilient). Helper sudah handle Konteks 1 fallback + schema integrity.

---

## 8. File Reference Map

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

*Maintained by tim AI-Assisted Dev. Last updated: 11 Mei 2026 setelah Sprint D Item #2 closed (4 phases: Dashboard + Sintesis + Filter + Indicator, Print Laporan dual-mode, Ringkasan list view per masukan Sie Renbang).*
