# Sprint B.4 — Proposal Pemetaan `kode_bas` untuk Persetujuan Angga

**Tanggal:** 10 Mei 2026  
**Persiapan:** Tim AI-Assisted Dev (Sprint B.4 SIKESUMA SSOT roadmap)  
**Untuk:** Angga (RS Tk.IV 02.07.03 Batin Tikal — pemilik domain akuntansi)  
**Tindakan yang diminta:** Review pemetaan setiap row Pagu ke kode BAS resmi (KEP-331/2021), centang kolom 'Disetujui' atau berikan koreksi.


---

## 1. Ringkasan & Konteks


SIKESUMA saat ini menyimpan kode akun internal seperti `521115.01`, `521311.02`, dst — dengan suffix `.01`, `.02` sebagai sub-akun internal. Untuk pelaporan ke Kementerian Keuangan (LRA, LKPP konsolidasi), setiap row Pagu harus dipetakan ke kode BAS 6-digit resmi dari **KEP-331/PB/2021** dan pemutakhirannya **KEP-291/PB/2022**.

Sprint B sudah:
- ✅ Mengintegrasikan dictionary BAS (4,314 kode) ke dalam aplikasi (commit `fd084ab`)
- ✅ Menambah field optional `kode_bas` di `PaguRow` (commit `87638ff`)
- ✅ Membuat autocomplete input agar kode baru otomatis valid BAS (commit `e36bb7d`)

**Yang Anda perlu tinjau di sini:** Pemetaan **data lama** (40 row di pagu_sections 2024-2025) ke `kode_bas`. Setelah Anda setujui, kami eksekusi backfill ke Supabase satu kali, lalu setiap row Pagu otomatis siap untuk LRA/LKPP.

### Sumber dasar pemetaan
1. **Audit BAS Konformitas** (file: `SIKESUMA-Audit-BAS-Konformitas.md` Section 3) — audit sebelumnya yang menemukan kode-kode SIKESUMA yang tidak ada di BAS resmi (mis. `521311`, `521411`) dan menyarankan pemetaan ulang berdasarkan deskripsi item.
2. **BAS resmi** — KEP-331/2021 + KEP-291/2022 yang sudah dikonversi ke MD dan dictionary aplikasi.


---

## 2. Statistik Cepat

| Status | Jumlah Row | Total Nominal (Rp) | Tindakan |
|---|---:|---:|---|
| **AUTO_OK** — Otomatis OK | 7 | 6,078,804,000 | Konfirmasi cepat |
| **AUDIT_REVIEW** — Kode valid, ada saran alternatif | 22 | 5,078,804,000 | Pilih opsi |
| **AUDIT_REMAP** — Kode tidak ada di BAS | 8 | 1,387,000,000 | Pilih opsi remap |
| **ORPHAN** — Header section (parent) | 3 | 1,387,000,000 | Tidak butuh kode_bas |
| **TOTAL** | **40** | **13,931,608,000** | — |

**Yang membutuhkan keputusan eksplisit Angga:** **30 row** (AUDIT_REVIEW + AUDIT_REMAP). Sisanya (10 row) bisa di-auto-confirm.

---

## 3. Detail per Section

Format kolom:
- **Kode SIKESUMA** — yang saat ini dipakai aplikasi
- **Deskripsi** — uraian saat ini di SIKESUMA
- **Nominal Rp** — pagu revisi (atau awal kalau revisi 0)
- **Saran kode_bas** — usulan dari audit, dengan justifikasi
- **Disetujui?** — kolom kosong untuk Anda isi: ✅ jika setuju, atau tulis kode lain


### Section: `pagu-2024-bekkes` — PAGU ANGGARAN BELANJA BEKKES (TA 2024)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521211` | 0 | BELANJA BAHAN (BEKKES) | 800,000,000 | AUTO_OK | `521211` | _Belanja Bahan_ | (default ✅ — auto) |
| `521211.01` | 1 | Pengadaan Obat-obatan | 500,000,000 | AUDIT_REVIEW | `521813` ATAU `521211` ATAU tetap `521211` | Belanja Persediaan Konsumsi / OK — boleh tetap | _pilih satu_ |
| `521211.02` | 1 | BMHP (Bahan Medis Habis Pakai) | 250,000,000 | AUDIT_REVIEW | `521813` ATAU tetap `521211` | Belanja Persediaan Konsumsi | _pilih satu_ |
| `521211.03` | 1 | Oksigen + Reagen Lab | 50,000,000 | AUDIT_REVIEW | `521211` ATAU `521813` ATAU tetap `521211` | OK / Belanja Persediaan Konsumsi alterna | _pilih satu_ |

### Section: `pagu-2024-lainnya` — PAGU ANGGARAN BELANJA JASA LAINNYA (TA 2024)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521311` | 0 | BELANJA JASA | 400,000,000 | ORPHAN | — | Header section (parent row), tidak butuh kode_bas | (default — tidak perlu mapping) |
| `521311.01` | 1 | Listrik & Air | 200,000,000 | AUDIT_REMAP | `522111` ATAU `522113` | Belanja Langganan Listrik (untuk listrik / Belanja Langganan Air (untuk air) — ⚠ ha | _⚠ kode invalid, wajib pilih_ |
| `521311.02` | 1 | Internet & Telepon | 80,000,000 | AUDIT_REMAP | `522112` | Belanja Langganan Telepon (mencakup internet) | _⚠ kode invalid, wajib pilih_ |
| `521311.03` | 1 | Jasa Lainnya | 120,000,000 | AUDIT_REMAP | `522191` | Belanja Jasa Lainnya | _⚠ kode invalid, wajib pilih_ |

### Section: `pagu-2024-pegawai` — PAGU ANGGARAN BELANJA PEGAWAI (TA 2024)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521115` | 0 | BELANJA PEGAWAI (HEADER) | 2,000,000,000 | AUTO_OK | `521115` | _Belanja Honor Operasional Satuan Kerja_ | (default ✅ — auto) |
| `521115.01` | 1 | Honor Tenaga Lepas (TKS) | 1,500,000,000 | AUDIT_REVIEW | `521213` ATAU `525111` ATAU tetap `521115` | Honor Output Kegiatan / Belanja Gaji dan Tunjangan (jika RS | _pilih satu_ |
| `521115.02` | 1 | Honor Pengelola | 500,000,000 | AUTO_OK | `521115` | _Belanja Honor Operasional Satuan Kerja_ | (default ✅ — auto) |

### Section: `pagu-2024-pemeliharaan` — PAGU ANGGARAN BELANJA PEMELIHARAAN (TA 2024)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521411` | 0 | BELANJA PEMELIHARAAN | 800,000,000 | ORPHAN | — | Header section (parent row), tidak butuh kode_bas | (default — tidak perlu mapping) |
| `521411.01` | 1 | Perbaikan Alat Medis | 600,000,000 | AUDIT_REMAP | `523121` | Belanja Pemeliharaan Peralatan dan Mesin | _⚠ kode invalid, wajib pilih_ |
| `521411.02` | 1 | Perbaikan Bangunan | 200,000,000 | AUDIT_REMAP | `523111` | Belanja Pemeliharaan Gedung dan Bangunan | _⚠ kode invalid, wajib pilih_ |

### Section: `pagu-2025-bekkes` — PAGU ANGGARAN BELANJA BEKKES & GAS MEDIS (TA 2025)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521811` | 0 | BELANJA BEKKES & GAS MEDIS | 941,804,000 | AUTO_OK | `521811` | _Belanja Barang Persediaan Barang Konsums_ | (default ✅ — auto) |
| `521811.01` | 1 | Obat & BMHP (Rekanan) | 896,804,000 | AUDIT_REVIEW | `521813` ATAU `521811` ATAU tetap `521811` | Belanja Barang Persediaan Konsumsi  / OK — sama-sama persediaan barang ko | _pilih satu_ |
| `521811.02` | 1 | Gas Medis | 25,000,000 | AUDIT_REVIEW | `521811` ATAU tetap `521811` | OK — Belanja Barang Persediaan Barang Konsumsi cocok untuk g | _pilih satu_ |
| `521811.03` | 1 | ATK | 20,000,000 | AUDIT_REVIEW | `521111` ATAU tetap `521811` | Belanja Keperluan Perkantoran — ATK eksplisit di KEP-331 | _pilih satu_ |
| `521811.04` | 1 | Jasa Diagnostik (Sun Clinik) | 0 | AUDIT_REVIEW | `522191` ATAU tetap `521811` | Belanja Jasa Lainnya — jasa pihak ketiga | _pilih satu_ |
| `521811.05` | 1 | Jasa Diagnostik (Promedic) | 0 | AUDIT_REVIEW | `522191` ATAU tetap `521811` | Belanja Jasa Lainnya — jasa pihak ketiga | _pilih satu_ |
| `521811.06` | 1 | Jasa CT Scan (Famon Medica) | 0 | AUDIT_REVIEW | `522191` ATAU tetap `521811` | Belanja Jasa Lainnya — jasa pihak ketiga | _pilih satu_ |
| `521811.07` | 1 | Jasa Laboratorium PA | 0 | AUDIT_REVIEW | `522191` ATAU tetap `521811` | Belanja Jasa Lainnya — jasa pihak ketiga | _pilih satu_ |

### Section: `pagu-2025-jasa` — PAGU ANGGARAN BELANJA JASA (HONOR) (TA 2025)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521115` | 0 | BELANJA JASA (HONOR) | 1,429,000,000 | AUTO_OK | `521115` | _Belanja Honor Operasional Satuan Kerja_ | (default ✅ — auto) |
| `521115.01` | 1 | Honor Tenaga Kerja Sukarela (TKS) | 400,000,000 | AUDIT_REVIEW | `521213` ATAU `525111` ATAU tetap `521115` | Honor Output Kegiatan / Belanja Gaji dan Tunjangan (jika RS | _pilih satu_ |
| `521115.02` | 1 | Honor Tenaga Kesehatan (Nakes) | 951,000,000 | AUDIT_REVIEW | `521213` ATAU `525111` ATAU tetap `521115` | Honor Output Kegiatan / Belanja Gaji dan Tunjangan (jika RS | _pilih satu_ |
| `521115.03` | 1 | Honor Pengelola | 78,000,000 | AUDIT_REVIEW | `521115` ATAU tetap `521115` | OK — Belanja Honor Operasional Satuan Kerja | _pilih satu_ |

### Section: `pagu-2025-modal` — PAGU ANGGARAN BELANJA MODAL & PENGADAAN (TA 2025)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521411` | 0 | BELANJA MODAL & PENGADAAN | 187,000,000 | ORPHAN | — | Header section (parent row), tidak butuh kode_bas | (default — tidak perlu mapping) |
| `521411.01` | 1 | Pengadaan Alsintor | 95,000,000 | AUDIT_REMAP | `532111` | Belanja Modal Peralatan dan Mesin | _⚠ kode invalid, wajib pilih_ |
| `521411.02` | 1 | BELANJA MODAL LAINNYA  (XDR) | 46,000,000 | AUDIT_REMAP | `536111` | Belanja Modal Lainnya | _⚠ kode invalid, wajib pilih_ |
| `521411.03` | 1 | Belanja Modal Lainnya (XDR) | 46,000,000 | AUDIT_REMAP | `536111` | Belanja Modal Lainnya | _⚠ kode invalid, wajib pilih_ |

### Section: `pagu-2025-operasional` — PAGU ANGGARAN BELANJA OPERASIONAL LAINNYA (TA 2025)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `521112` | 0 | BELANJA OPERASIONAL LAINNYA | 348,000,000 | AUTO_OK | `521112` | _Belanja Pengadaan Bahan Makanan_ | (default ✅ — auto) |
| `521112.02` | 1 | LAUNDRY | 26,000,000 | AUDIT_REVIEW | `522191` ATAU tetap `521112` | Jasa pihak ketiga → Belanja Jasa Lainnya | _pilih satu_ |
| `521112.01` | 1 | Makan Pasien | 198,000,000 | AUDIT_REVIEW | `521112` ATAU tetap `521112` | OK — Belanja Pengadaan Bahan Makanan, makan pasien cocok | _pilih satu_ |
| `521112.03` | 1 | internet | 10,000,000 | AUDIT_REVIEW | `522112` ATAU tetap `521112` | Belanja Langganan Telepon (mencakup internet & data) | _pilih satu_ |
| `521112.04` | 1 | Biaya Cetak ( CV. SUMBER SARANA PRIMA) | 15,000,000 | AUDIT_REVIEW | `521211` ATAU tetap `521112` | Belanja Bahan — bahan cetakan untuk kegiatan | _pilih satu_ |
| `521112.05` | 1 | BPD TW. II 2025 | 18,000,000 | AUDIT_REVIEW | `524111` ATAU tetap `521112` | Belanja Perjalanan Dinas Biasa | _pilih satu_ |
| `521112.11` | 1 | Pengadaan Alkes | 75,000,000 | AUDIT_REVIEW | `532111` ATAU tetap `521112` | Belanja Modal Peralatan dan Mesin — ini MODAL bukan operasio | _pilih satu_ |
| `521112.06` | 1 | BMP | 6,000,000 | AUDIT_REVIEW | `521113` ATAU tetap `521112` | Belanja Penambah Daya Tahan Tubuh | _pilih satu_ |

### Section: `pagu-2025-pemeliharaan` — PAGU ANGGARAN BELANJA PEMELIHARAAN (TA 2025)

| Kode SIKESUMA | Lvl | Deskripsi | Nominal Rp | Status | Saran kode_bas | Justifikasi | Disetujui? |
|---|---:|---|---:|---|---|---|---|
| `523111` | 0 | BELANJA PEMELIHARAAN | 60,000,000 | AUTO_OK | `523111` | _Belanja Pemeliharaan Gedung dan Bangunan_ | (default ✅ — auto) |
| `523111.01` | 1 | Har Gedung dan Bangunan | 60,000,000 | AUDIT_REVIEW | `523111` ATAU tetap `523111` | OK — sudah benar | _pilih satu_ |

---

## 4. Implikasi Strukturil yang Ditemukan


Beberapa pemetaan akan menimbulkan **restrukturisasi section** karena kode BAS punya kategori yang berbeda dari yang sekarang dipakai:

### a) Section "BELANJA MODAL & PENGADAAN" 2025 (Rp 187 jt)
Section ini saat ini memakai prefix `521xxx` (Belanja Barang & Jasa). Tapi semua sub-itemnya secara substantif adalah **belanja modal** (yang seharusnya `53xxxx`):
- "Pengadaan Alsintor" → `532111` (Belanja Modal Peralatan dan Mesin)
- "Belanja Modal Lainnya (XDR)" → `536111` (Belanja Modal Lainnya)

**Konsekuensi pelaporan:** Belanja Modal di-kapitalisasi sebagai aset di neraca, sedangkan Belanja Barang langsung dibebankan. **Kalau dilaporkan dengan kode `521411`, akan disangka pengeluaran rutin — tidak terbentuk aset di neraca.** Ini implikasi akuntansi yang serius.

**Saran:** Setelah Anda setujui pemetaan, section ini perlu di-rename + kategori prefix di-shift dari `52xxxx` ke `53xxxx`.

### b) Section "BELANJA OPERASIONAL LAINNYA" 2025 (Rp 348 jt)
Section ini campur: Makan Pasien (`521112`), Internet (`522112`), Cetak (`521211`), BPD (`524111`), Alkes (`532111`).

**Saran:** Pecah menjadi beberapa sub-section sesuai kategori BAS aslinya, atau biarkan section tetap sebagai container tetapi setiap row punya kode_bas yang akurat (lebih sederhana).

### c) Item "Listrik & Air" (`521311.01`)
Saat ini 1 row dengan nominal gabungan. BAS punya **dua kode terpisah**: `522111` (Listrik) dan `522113` (Air). Pemetaan langsung tidak bisa — perlu **dipecah jadi 2 row** dengan estimasi proporsi.

**Saran konkret:** Anda perlu kasih estimasi pembagian (mis. 60% Listrik / 40% Air). Atau kalau historical data tahu split-nya dari PLN/PDAM, gunakan rasio realistis.

### d) Honor TKS / Honor Nakes (`521115.01`, `.02`)
RS dengan status BLU pakai `525111` (Belanja Gaji dan Tunjangan), RS non-BLU pakai `521213` (Honor Output Kegiatan). **Mohon konfirmasi status RS Tk.IV 02.07.03 Batin Tikal** — apakah formal BLU atau Satker biasa? Ini menentukan kode yang dipilih.


---

## 5. Setelah Anda Setujui — Apa yang Terjadi?


Setelah dokumen ini Anda kembalikan dengan kolom "Disetujui?" terisi:

1. Saya jalankan migration script `lib/migrations/b4_backfill_kode_bas.ts` yang:
   - Untuk setiap row di Supabase `pagu_sections.data.rows[]`, tambahkan `kode_bas` sesuai keputusan Anda
   - Idempotent — aman dijalankan ulang

2. Setelah backfill, semua RAB/RPD/Bill yang sudah ada otomatis bisa di-derive `kode_bas` lookup ke Pagu (sesuai pola SSOT Sprint A).

3. Section yang butuh restrukturisasi (lihat Bagian 4) akan di-handle terpisah — bisa dilakukan manual via UI baru (autocomplete sudah on board) atau via migration kalau Anda tunjukkan struktur target.

4. Sprint berikutnya:
   - **Sprint C:** Lattice enforcement upgrade — IV-OVER-PAGU dari WARNING ke ERROR; block save kalau kode invalid
   - **Sprint D:** Bug fixes di realisasiBucket (year handling, dead code)
   - **Sprint E:** Documentation + regression tests


---

## 6. Cara Mengisi Dokumen Ini


**Opsi 1 — Edit langsung di kolom "Disetujui?":**
- Tulis ✅ kalau setuju saran
- Tulis kode lain kalau koreksi (mis. `522191` kalau lebih cocok dari saran `522112`)
- Tulis "TANYAKAN ULANG" kalau perlu klarifikasi

**Opsi 2 — Komentar tertulis:**
Cukup balas pesan dengan list seperti:
```
Section pagu-2024-pegawai:
  521115.01 Honor TKS → 525111 (RS kami sudah BLU formal)
  521115.02 Honor Nakes → 525111 (idem)
Section pagu-2024-jasa:
  521311.01 Listrik & Air → split 60/40 (522111 Rp 240jt + 522113 Rp 160jt)
  ...
```

**Opsi 3 — Diskusi singkat lewat WA/meeting:**
Kalau ada item yang Anda ragu, dibahas case-per-case. Yang lain dipakai default saran.

---

**Total nominal yang menunggu konfirmasi Anda: Rp 6.466 milyar (30 row).**
**Estimasi waktu review: ~30-45 menit** untuk yang familiar dengan BAS, atau ~1.5-2 jam kalau perlu cross-check ke KEP-331.
