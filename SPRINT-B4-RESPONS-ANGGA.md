# Sprint B.4 — Respons Angga atas Proposal Pemetaan `kode_bas`

**Dari:** Angga (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal)
**Untuk:** Tim AI-Assisted Dev (re: SPRINT-B4-HITL-MAPPING-PROPOSAL.md)
**Tanggal:** 10 Mei 2026
**Status:** Review selesai. Approve untuk migration dengan koreksi & catatan di bawah.

---

## 0. Catatan Pembuka

Sebelum masuk ke per-row decision, ada beberapa hal kontekstual yang **mengubah scope & penekanan** review ini:

### 0.1 Status data: 2024 dummy, 2025 simplified

| Tahun | Status data | Penekanan koreksi |
|---|---|---|
| **2024** | **Dummy** (data sintetis untuk testing Step 5.2-5.6) | Pemetaan harus _well-formed_ tapi angka tidak berdampak bisnis. |
| **2025** | **Simplified** (real plan, beberapa item di-aggregate by design) | **Ini yang penting.** Hasil backfill jadi baseline aktif untuk RKKS berjalan. |
| 2026 | Real production | Tidak masuk scope Sprint B.4. |

### 0.2 Status kelembagaan: RS Batin Tikal **belum mencapai status Satker mandiri**

RS Tk.IV 02.07.03 Batin Tikal saat ini adalah **Satker pelaksana di bawah Satker pengelola anggaran di Palembang** (jajaran Kesdam II/Sriwijaya). Setiap keputusan keuangan material — termasuk **revisi POK** — harus melalui approval Palembang. **RS belum punya kedaulatan menentukan sendiri pengelolaan anggaran.**

**Implikasi untuk pemetaan BAS:**
1. **Pasti bukan BLU formal** → seri `525xxx` tidak relevan untuk SIKESUMA.
2. **Tetap ekosistem Kemhan/TNI** → ada beberapa kode khusus BAS yang DIBUAT untuk Kemhan/TNI/Polri yang harus dipakai (lihat §0.5).
3. **Beberapa item di-aggregate by design** sebagai konsekuensi keterbatasan kedaulatan anggaran (contoh: Honor Nakes — lihat §1.6).
4. Workflow approval Palembang perlu reflect di lattice enforcement Sprint C+ — flag untuk planning.

### 0.3 ⚠️ KOREKSI HARD-BLOCKER #1: Kode `521813` untuk Obat/BMHP SALAH

Proposal menyarankan `521813` untuk Obat/BMHP. **Verifikasi langsung ke KEP-331/PB/2021:**

| Kode | Uraian Resmi (KEP-331 verbatim) |
|---|---|
| `521811` | **Belanja Barang Persediaan Barang Konsumsi** ← yang dimaksud untuk obat/BMHP |
| `521812` | Belanja Barang Persediaan Amunisi |
| **`521813`** | **Belanja Barang Persediaan _Pita Cukai, Meterai dan Leges_** ← bukan obat sama sekali |

**Action item:** sebelum migration jalan, ganti default rekomendasi → `521811`. Update juga `SIKESUMA-Audit-BAS-Konformitas.md` Section 3.

### 0.4 ⚠️ KOREKSI HARD-BLOCKER #2: Klasifikasi Honor — `521115` adalah jawaban untuk SEMUA Honor di RS Batin Tikal

Proposal & audit document menyarankan `521213` untuk Honor TKS dan Honor Nakes. **Setelah klarifikasi karakter pembayaran riil + verifikasi literal KEP-331, semua saran `521213` keliru.**

Test pembeda dari KEP-331 (penjelasan resmi):

| Kode | Karakter (KEP-331 verbatim) — kunci dalam **bold** |
|---|---|
| `521115` | "Honor tidak tetap... menunjang kegiatan operasional... **pembayaran honornya dilakukan secara terus menerus dari awal sampai dengan akhir tahun anggaran**" |
| `521213` | "Honor tidak tetap... terkait dengan output... **pembayaran insidentil dan dapat dibayarkan tidak terus menerus**" |

**Test krusial:** kalau honor dibayar **regular bulanan sepanjang tahun**, kode-nya `521115` — terlepas dari nominal-nya tetap atau variable, terlepas dari output-tied atau tidak. Kalau honor dibayar **insidentil per kegiatan tertentu** (mis. honor seminar, honor penelitian satu kali), kode-nya `521213`.

**Klasifikasi riil di RS Batin Tikal — SEMUA Honor `521115`:**

| Item | Karakter pembayaran | Kode BENAR |
|---|---|---|
| **Honor TKS** | Gaji pokok flat seluruh TKS — bayar **terus-menerus tiap bulan** | **`521115`** ✅ |
| **Honor Nakes** | Transport Dokter + Jasa Medis (combined by-design) — bayar **regular bulanan** sepanjang tahun, walaupun nominal variable per bulan | **`521115`** ✅ |
| **Honor Pengelola** | Manajemen + Casemix + Tim Verifikasi — ongoing operational support, bayar terus-menerus | **`521115`** ✅ |

**Catatan penting tentang Honor Nakes:** Audit document sebelumnya fokus pada "Jasa Medis output-tied per pasien" → simpulkan `521213`. Itu salah baca. Output-relation memang ada (Jasa Medis variable per claim BPJS), tapi **ritme pembayaran-nya regular bulanan**, dan `521213` punya hard requirement "**insidentil dan tidak terus-menerus**" yang diviolate oleh ritme regular bulanan ini. `521115` adalah satu-satunya kode yang fit secara literal KEP-331.

**Konsekuensi besar:** Semua 4 row Honor (`521115.01`, `.02`, `.03` di pagu 2024+2025) yang di proposal awal dicatat sebagai AUDIT_REVIEW → **sebenarnya AUTO_OK semua**. Tidak perlu di-remap. Cuma dual-coded dengan kode existing yang sudah benar.

**Action item HARD-BLOCKER untuk audit document:**
- Update `SIKESUMA-Audit-BAS-Konformitas.md` Section 1.2 dan Section 3 — saran `521213` untuk Honor TKS, Honor Nakes keliru.
- Tambahkan kriteria klasifikasi yang eksplisit: continuous monthly = `521115`; insidentil = `521213`.

### 0.5 ⚠️ KOREKSI HARD-BLOCKER #3: BMP = Bahan Bakar Minyak dan Pelumas (BUKAN Bahan Makanan)

Item `521112.06` "BMP" Rp 6 juta. **Klarifikasi internal: BMP yang dimaksud adalah _Bahan Bakar Minyak dan Pelumas_** sesuai definisi formal di **Permenhan 5/2020 tentang Pengelolaan BMP di Lingkungan Kemhan dan TNI**, Pasal 1 angka 1:

> "Bahan Bakar Minyak dan Pelumas yang selanjutnya disingkat BMP adalah hasil minyak bumi/nabati... seperti Aviation Gasoline (Avgas), Aviation Turbine Fuel (Avtur), Premium, Pertamax, Minyak Tanah, Solar/HSD, Minyak Diesel/MDF, Minyak Bakar/MFO."

Jadi BMP = BBM untuk kendaraan operasional (ambulance, mobil dinas, genset cadangan), bukan makanan/medis.

**KEP-331 punya kode KHUSUS untuk BMP di Kemhan/TNI:**

| Kode | Uraian | Pendekatan akuntansi |
|---|---|---|
| **`523122`** | Belanja BMP dan Pelumas Khusus Non Pertamina | Beban langsung (direct expense) |
| `523125` | Belanja Barang Persediaan BMP dan Pelumas Khusus Non Pertamina | Aset/Persediaan (kalau ada stockopname) |

Penjelasan resmi `523122` (KEP-331 verbatim):
> "Bahan Bakar Minyak dan Pelumas (BMP) yang digunakan untuk mendukung operasional **Alutsista dan Non-Alutsista** Kementerian Pertahanan, TNI, Polri... BMP antara lain terdiri dari Avgas, Avtur, MT-88, HSD, Karosine, Pertamax, Methanol..."

Permenhan 5/2020 Pasal 28(3) eksplisit merujuk: "akun belanja BMP atau pelumas khusus" — referensinya jelas ke kode ini.

**Klasifikasi untuk RS Batin Tikal:**
- Kendaraan ambulance & dinas RS = **Non-Alutsista** → masuk `523122`
- Nominal Rp 6jt/tahun = kecil, dipakai habis bulanan, tidak ada inventarisir tangki BMP RS → **pendekatan beban** lebih tepat
- **Kode final: `523122`**

⚠️ **Catat:** `523122` ada di seri `523xxx` (Belanja Pemeliharaan), bukan `521xxx`. Klasifikasi BAS resmi memang menempatkan BMP di kategori pemeliharaan untuk Kemhan/TNI — ini akan mempengaruhi posisi item di LRA.

**Action item untuk SIKESUMA:**
- Tambahkan keyword aliases untuk autocomplete: "BBM", "BMP", "Pertamax", "Solar", "Pelumas" → otomatis surface `523122` agar cegah salah klasifikasi sebagai `521112` (Bahan Makanan) atau `521113` (Penambah Daya Tahan Tubuh).

### 0.6 Glossarium istilah lokal

Dari kerja review ini, istilah-istilah yang punya potensi ambiguitas — saran tim dev tambahkan ke dokumentasi internal:

| Akronim | Konteks RS Batin Tikal | Kode BAS |
|---|---|---|
| **BMP** | Bahan Bakar Minyak dan Pelumas (Permenhan 5/2020) | `523122` |
| **BMHP** | Bahan Medis Habis Pakai | `521811` |
| **TKS** | Tenaga Kerja Sukarela (kontrak non-PNS, gaji flat bulanan) | `521115` |
| **Nakes** | Tenaga Kesehatan (di sini = dokter spesialis non-PNS, Transport+Jasa Medis combined by-design) | `521115` |
| **POK** | Petunjuk Operasional Kegiatan (revisi butuh approval Palembang) | n/a (workflow) |
| **BPD** | Biaya Perjalanan Dinas | `524111` |
| **Casemix** | Tim INA-CBG coding untuk klaim BPJS | `521115` (Honor Pengelola) |
| **Alpalhankam** | Alat Peralatan Pertahanan dan Keamanan (Alutsista) | seri `53xxxx` (modal) atau `523xxx` (pemeliharaan) |

---

## 1. Per-Section Approval

### 1.1 `pagu-2024-bekkes` — BELANJA BEKKES (TA 2024, dummy)

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521211` | BELANJA BAHAN (header) | 800jt | ✅ tetap `521211` |
| `521211.01` | Pengadaan Obat-obatan | 500jt | **`521811`** — substansi persediaan barang konsumsi |
| `521211.02` | BMHP | 250jt | **`521811`** |
| `521211.03` | Oksigen + Reagen Lab | 50jt | **`521811`** |

### 1.2 `pagu-2024-lainnya` — BELANJA JASA (TA 2024, dummy)

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521311` | BELANJA JASA (header invalid) | 400jt | (orphan) |
| `521311.01` | Listrik & Air | 200jt | **PECAH 2 ROW** — lihat §2.1 |
| `521311.02` | Internet & Telepon | 80jt | **`522112`** (Belanja Langganan Telepon) |
| `521311.03` | Jasa Lainnya | 120jt | **`522191`** (Belanja Jasa Lainnya) |

### 1.3 `pagu-2024-pegawai` — BELANJA PEGAWAI (TA 2024, dummy)

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521115` | BELANJA PEGAWAI (header) | 2 milyar | ✅ tetap `521115` |
| `521115.01` | Honor Tenaga Lepas (TKS) | 1,5 milyar | ✅ **tetap `521115`** — gaji pokok flat continuous. |
| `521115.02` | Honor Pengelola | 500jt | ✅ tetap `521115` |

### 1.4 `pagu-2024-pemeliharaan` — BELANJA PEMELIHARAAN (TA 2024, dummy)

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521411` | BELANJA PEMELIHARAAN (header invalid) | 800jt | (orphan) |
| `521411.01` | Perbaikan Alat Medis | 600jt | **`523121`** (Belanja Pemeliharaan Peralatan dan Mesin) |
| `521411.02` | Perbaikan Bangunan | 200jt | **`523111`** (Belanja Pemeliharaan Gedung dan Bangunan) |

### 1.5 `pagu-2025-bekkes` — BELANJA BEKKES & GAS MEDIS (TA 2025, simplified) ⭐

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521811` | BELANJA BEKKES & GAS MEDIS (header) | 941,8jt | ✅ tetap `521811` |
| `521811.01` | Obat & BMHP (Rekanan) | 896,8jt | ✅ tetap `521811` (proposal sebelumnya `521813` salah — lihat §0.3) |
| `521811.02` | Gas Medis | 25jt | ✅ tetap `521811` |
| `521811.03` | ATK | 20jt | **`521111`** (Belanja Keperluan Perkantoran — lebih spesifik untuk ATK) |
| `521811.04` | Jasa Diagnostik (Sun Clinik) | 0 | **`522191`** (jasa pihak ketiga) |
| `521811.05` | Jasa Diagnostik (Promedic) | 0 | **`522191`** |
| `521811.06` | Jasa CT Scan (Famon Medica) | 0 | **`522191`** |
| `521811.07` | Jasa Laboratorium PA | 0 | **`522191`** |

### 1.6 `pagu-2025-jasa` — BELANJA JASA (HONOR) (TA 2025, simplified) ⭐

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521115` | BELANJA JASA (HONOR, header) | 1,429 milyar | ✅ tetap `521115` |
| `521115.01` | Honor TKS (gaji pokok flat seluruh TKS) | 400jt | ✅ **tetap `521115`** — continuous operational. |
| `521115.02` | Honor Tenaga Kesehatan (Transport + Jasa Medis combined) | 951jt | ✅ **tetap `521115`** — bayar regular bulanan sepanjang tahun = continuous. Lihat catatan by-design di bawah. |
| `521115.03` | Honor Pengelola (Manajemen, Casemix, Tim Verifikasi) | 78jt | ✅ **tetap `521115`** — ongoing operational support. |

**Catatan penting tentang `521115.02` (by-design penggabungan):**

Penggabungan Transport Dokter + Jasa Medis dalam satu row adalah **keputusan by design**, bukan limitasi data. Alasan strategis:

1. **Status RS belum Satker mandiri** — RS Batin Tikal belum punya kedaulatan menentukan pengelolaan anggaran sendiri. Pengelolaan mengikuti kerangka Palembang.
2. **Tujuan retention dokter spesialis** — penggabungan memberikan fleksibilitas internal untuk menyusun paket kompensasi yang **kompetitif dengan pasar dokter spesialis** (RS swasta dan RS lain). RS perlu mempertahankan tingkat kelayakan dan kebersaingan.
3. **Pelaporan ke Palembang** — single envelope "Honor Nakes" yang nanti di-konsolidasi Palembang sesuai kebijakan mereka.

**Konsekuensi untuk SIKESUMA & migration:**
- Row tetap single, tidak di-split.
- `kode_bas = 521115` sesuai literal KEP-331 (continuous monthly criteria).
- **TIDAK ada saran split di sprint masa depan** — penggabungan adalah feature, bukan bug.

### 1.7 `pagu-2025-modal` — BELANJA MODAL & PENGADAAN (TA 2025, simplified) ⭐

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521411` | BELANJA MODAL (header invalid) | 187jt → **141jt** | (orphan). Lihat duplikat di bawah. |
| `521411.01` | Pengadaan Alsintor | 95jt | **`532111`** (Belanja Modal Peralatan dan Mesin) |
| `521411.02` | Belanja Modal Lainnya (XDR) | 46jt | **`536111`** (Belanja Modal Lainnya) |
| `521411.03` | Belanja Modal Lainnya (XDR) | 46jt | **DROP — duplikat input, hapus row ini** (dikonfirmasi) |

⚠️ **Restrukturisasi mandatory** — lihat §2.2.

### 1.8 `pagu-2025-operasional` — BELANJA OPERASIONAL LAINNYA (TA 2025, simplified) ⭐

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `521112` | BELANJA OPERASIONAL LAINNYA (header) | 348jt | (header — children dual-coded) |
| `521112.01` | Makan Pasien | 198jt | ✅ tetap `521112` (Belanja Pengadaan Bahan Makanan) |
| `521112.02` | LAUNDRY | 26jt | **`522191`** (Belanja Jasa Lainnya) |
| `521112.03` | internet | 10jt | **`522112`** (Belanja Langganan Telepon — sudah include internet) |
| `521112.04` | Biaya Cetak (CV. Sumber Sarana Prima) | 15jt | **`521211`** (Belanja Bahan — bahan cetakan) |
| `521112.05` | BPD TW. II 2025 | 18jt | **`524111`** (Belanja Perjalanan Dinas Biasa) |
| `521112.06` | **BMP (Bahan Bakar Minyak dan Pelumas)** | 6jt | **`523122`** — kode khusus Kemhan/TNI sesuai Permenhan 5/2020 (lihat §0.5). |
| `521112.11` | Pengadaan Alkes | 75jt | **`532111`** (Belanja Modal Peralatan dan Mesin). ⚠️ Substansinya **Modal** — lihat §2.3 |

### 1.9 `pagu-2025-pemeliharaan` — BELANJA PEMELIHARAAN (TA 2025, simplified) ⭐

| Kode SIKESUMA | Deskripsi | Nominal | Disetujui? |
|---|---|---:|---|
| `523111` | BELANJA PEMELIHARAAN (header) | 60jt | ✅ tetap `523111` |
| `523111.01` | Har Gedung dan Bangunan | 60jt | ✅ tetap `523111` |

---

## 2. Tindak Lanjut Struktural

### 2.1 Pemecahan "Listrik & Air" (`521311.01`) → 2 row

Rasio: **75% Listrik / 25% Air** (konfirmasi dari operasional RS Tk.IV).

| Item baru | kode_bas | Nominal |
|---|---|---:|
| Listrik | `522111` (Belanja Langganan Listrik) | Rp 150.000.000 |
| Air | `522113` (Belanja Langganan Air) | Rp 50.000.000 |

**Action migration:** Insert 2 row baru → soft-delete row `521311.01` lama. Konvensi internal: untuk implementasi 2025+, kalau tagihan listrik+air gabung di 1 invoice, split di stage Pagu (75/25 default), bukan di stage Bill.

**Note pembeda dari §1.6 Honor Nakes:** Listrik & Air dipecah karena BAS punya 2 kode TERPISAH (`522111` vs `522113`) yang TIDAK BOLEH di-conflate. Honor Nakes Transport+Jasa Medis tidak dipecah karena keduanya fit kode yang SAMA (`521115`) dan penggabungan adalah by-design choice.

### 2.2 Restrukturisasi Section `pagu-2025-modal` — KRITIS untuk LRA real

Belanja Barang (`52xxxx`) dan Belanja Modal (`53xxxx`) adalah dua line item terpisah di LRA dengan implikasi akuntansi yang sangat berbeda. Belanja Modal **dikapitalisasi sebagai aset di neraca**; Belanja Barang **langsung dibebankan habis**. Salah klasifikasi → understatement aset & overstatement beban tahun berjalan — bila escalate ke Palembang lalu LKPP, ini berisiko jadi temuan.

**Keputusan untuk Sprint B.4:** **dual-coding flat** (header section tidak diubah, tiap row punya `kode_bas` benar di seri `53xxxx`). Restrukturisasi visual section ditunda.

**Hard requirement:** pastikan LRA aggregator di-update agar sumber `kode_bas` (bukan `kode` SIKESUMA) yang dipakai untuk klasifikasi line item LRA.

### 2.3 Item `521112.11 Pengadaan Alkes` (Rp 75jt) — substansi modal, salah section

Item di-host di `pagu-2025-operasional` tapi substansinya Belanja Modal. Untuk Sprint B.4: cukup set `kode_bas = 532111`. UI tampilan tetap di section "Operasional"; LRA aggregator akan klasifikasikan sebagai Modal — sound, asalkan agregator pakai `kode_bas`.

### 2.4 BMP — Setup masa depan untuk klasifikasi BBM yang lebih granular

Permenhan 5/2020 mengatur tata kelola BMP yang relatif kompleks: Renbut tahunan/triwulan, Surat Alokasi → SP Penyaluran → SP Pengambilan, jenjang Satkai I/II/III, stockopname semester, Coklit dengan PB-221.

Untuk RS Tk.IV yang masih sub-Satker, sebagian besar tata kelola itu di-handle di tingkat Kesdam Palembang. **Yang perlu RS lakukan internal:**
- Catat realisasi BMP per kendaraan operasional dengan kode_bas `523122`
- Stockopname kalau ada tangki/drum BMP di gudang RS (per Pasal 32 Permenhan, paling sedikit 1× per semester) — kalau ada, switch ke `523125`
- Coklit dengan dokumen PB-221 setiap bulan

**Saran tim dev (planning Sprint masa depan):** kalau RS akumulasi data BMP signifikan (multi-kendaraan, multi-jenis BBM), modul khusus BMP per Permenhan 5/2020 bisa dipertimbangkan. Tidak urgent — cukup `523122` flat untuk sekarang.

---

## 3. Konfirmasi Tindak Lanjut

| Status | Jumlah Row | Action |
|---|---:|---|
| AUTO_OK terkonfirmasi (kode existing benar) | **11** | Tetap kode existing, dual-coded ke `kode_bas` yang sama |
| AUDIT_REVIEW dengan keputusan re-map | **18** | Pakai `kode_bas` baru sesuai §1 |
| AUDIT_REMAP terkonfirmasi | 7 (after dedup) | Pakai kode baru sesuai §1 |
| ORPHAN | 3 | Skip — header section |
| Drop (duplikat) | 1 | `521411.03` dihapus |
| Split jadi 2 row | 1 | `521311.01` → Listrik 75% + Air 25% |

**Approval saya: ✅ proceed dengan migration**, urutan eksekusi:

1. **HARD BLOCKER #1:** Tim dev koreksi referensi `521813 → 521811` di proposal, dictionary, audit doc.
2. **HARD BLOCKER #2:** Tim dev update audit doc Section 1.2 dan 3 — kriteria klasifikasi Honor: continuous monthly = `521115`, insidentil = `521213`. Honor TKS, Nakes, Pengelola di RS Batin Tikal SEMUANYA `521115`.
3. **HARD BLOCKER #3:** Tim dev tambahkan keyword aliases di autocomplete untuk BMP/BBM → `523122`. Update interpretasi BMP ≠ Bahan Makanan.
4. Build migration script `lib/migrations/b4_backfill_kode_bas.ts`:
   - Backfill `kode_bas` per row sesuai §1
   - Soft-delete `521411.03` (duplikat)
   - Split `521311.01` jadi 2 row
5. Run di staging — kirim diff report ke saya untuk validation.
6. Saya verify dalam 1 hari kerja, balas approve.
7. Apply ke production. Monitor LRA TA 2024 angka stable.
8. Update LRA aggregator (kalau belum) untuk konsumsi `kode_bas` sebagai source-of-truth klasifikasi.

---

## 4. Lain-lain

- **Sprint C (lattice enforcement upgrade):** ✅ setuju lanjut. Saran tambahan: upgrade IV-OVER-PAGU dari WARNING ke ERROR perlu **override mechanism** untuk emergency procurement. Override wajib log ke audit_log dengan kategori reasoning khusus + flag follow-up revisi POK ke Palembang.

- **Sprint D (bug fixes realisasiBucket):** ✅ Setuju, prioritas high. Multi-year bug harus fix sebelum data 2026 cukup banyak.

- **Sprint E (docs + regression tests):** ✅ Setuju. Saran: minimal **regression test untuk LRA aggregation** ditambah _bersamaan_ dengan Sprint B.4 backfill — angka LRA per Lampiran sebelum & sesudah backfill harus identik (kode_bas additive, bukan replacement).

- **Glossarium akronim (lihat §0.6):** Saran tambahkan ke `README.md` SIKESUMA atau `docs/glossary.md`. Akan menghindari salah-tebak di RS lain yang adopsi template.

- **Workflow approval Palembang (planning jangka menengah):** Untuk Sprint C+, perlu fitur **"Pending Persetujuan Atasan"** — perubahan struktural (revisi POK, restrukturisasi section pagu, upgrade kode lintas seri 52→53) memicu workflow notifikasi ke Palembang, tidak langsung commit. Bisa sebagai _staging table_ + manual approval gate.

- **Modul BMP khusus (planning jangka menengah):** Kalau RS akumulasi data BMP signifikan, modul khusus per Permenhan 5/2020 (per-kendaraan tracking, jenis BBM, integrasi PB-221) bisa dipertimbangkan. Tidak urgent.

- **Catatan tentang penggabungan by-design (general principle):** Beberapa item di SIKESUMA RS Batin Tikal sengaja di-aggregate karena status non-Satker mandiri membatasi otonomi pengelolaan anggaran. Tim dev tolong pertahankan struktur penggabungan ini selama RS belum mencapai status Satker mandiri — jangan melakukan _premature optimization_ dengan split otomatis. Kalau status RS upgrade ke Satker mandiri di masa depan, bisa di-revisit.

Terima kasih sudah menyiapkan proposal yang detail. Format HITL ini bagus, akan saya pakai untuk dokumentasi internal RKKS arsip dan rujukan saat lapor ke Karumkit.

— Angga
Sie Renbang RS Tk.IV 02.07.03 Batin Tikal
