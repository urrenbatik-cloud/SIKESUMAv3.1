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
