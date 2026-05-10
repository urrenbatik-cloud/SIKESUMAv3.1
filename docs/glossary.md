# SIKESUMA Glossarium Istilah Lokal

**Cakupan:** RS Tk.IV 02.07.03 Batin Tikal (sub-Satker Kesdam II/Sriwijaya)
**Last update:** 10 Mei 2026 (Sprint B post-closure, sumber: Konteks 9 dari Angga)

---

## 1. Konteks Kelembagaan

RS Tk.IV 02.07.03 Batin Tikal adalah **Satker pelaksana di bawah Satker pengelola anggaran di Palembang** (jajaran Kesdam II/Sriwijaya). Implikasi penting:

- **BUKAN BLU formal** → seri kode BAS `525xxx` (Belanja Gaji RS BLU) **tidak relevan** untuk SIKESUMA spesifik RS Batin Tikal.
- **Setiap keputusan keuangan material** — termasuk revisi POK — **harus melalui approval Palembang**.
- **Tetap dalam ekosistem Kemhan/TNI** → ada beberapa kode khusus BAS yang dibuat untuk Kemhan/TNI/Polri yang harus dipakai (lihat `BMP` di tabel di bawah).

Implikasi untuk lattice enforcement (Sprint C+): workflow approval Palembang perlu reflect di future feature — flag for planning. Material changes (mis. revisi POK, restrukturisasi section pagu, upgrade kode lintas seri 52→53) idealnya memicu workflow notifikasi ke Palembang, tidak langsung commit.

---

## 2. Akronim & Istilah Lokal

| Akronim | Konteks RS Batin Tikal | Kode BAS | Catatan |
|---|---|---|---|
| **BMP** | Bahan Bakar Minyak dan Pelumas (Permenhan 5/2020) | `523122` | BUKAN "Bahan Makanan Pokok". Kode khusus Kemhan/TNI Non-Pertamina. Untuk kendaraan ambulance, mobil dinas, genset. |
| **BMHP** | Bahan Medis Habis Pakai | `521811` | Belanja Barang Persediaan Barang Konsumsi. Termasuk obat, gas medis, oksigen, reagen lab, linen pasien. |
| **TKS** | Tenaga Kerja Sukarela (kontrak non-PNS, gaji flat bulanan) | `521115` | Continuous monthly payment → 521115 (BUKAN 521213 yang insidentil). |
| **Nakes** | Tenaga Kesehatan (di sini = dokter spesialis non-PNS, Transport+Jasa Medis combined by-design) | `521115` | Penggabungan Transport+JM by-design RS untuk kompetisi pasar dokter spesialis & status non-Satker mandiri. **Tidak boleh di-split** kecuali RS upgrade ke Satker mandiri. |
| **POK** | Petunjuk Operasional Kegiatan | n/a (workflow) | Revisi butuh approval Palembang. Future Sprint: workflow gate + notifikasi. |
| **BPD** | Biaya Perjalanan Dinas | `524111` | Default. Variant: 524112 luar negeri, 524119 lain-lain. |
| **Casemix** | Tim INA-CBG coding untuk klaim BPJS | `521115` (Honor Pengelola) | Honor regular bulanan → 521115. |
| **Alpalhankam** | Alat Peralatan Pertahanan dan Keamanan (Alutsista) | seri `53xxxx` (modal) atau `523xxx` (pemeliharaan) | Konteks TNI. Klasifikasi tergantung apakah pengadaan baru (modal) atau perawatan (pemeliharaan). |
| **Alsintor** | Alat Mesin Kantor (Yanmasum & BPJS) | `532111` (sub `.A`) | Laptop, computer, showcase cooler, dst. |
| **Alkes** | Alat Kesehatan | `532111` (sub `.B`) | Tensimeter, stetoskop, O2 sensor ventilator, dst. |
| **Alsatri** | Alat Kesatriaan | `532111` (sub `.C`) | Kursi, meja (rencana 2026). |
| **YANMASUM** | Pelayanan Masyarakat Umum | n/a (suffix label) | Penanda sumber dana / target pelayanan. Bukan bagian dari kode BAS resmi. |
| **BPJS** | Sumber dana dari klaim BPJS | n/a (suffix label) | Idem. |
| **POK XDR** | Pengadaan software Extended Detection and Response | `536111` (Belanja Modal Lainnya) | Software/aplikasi = aset tak-berwujud → modal lainnya. |

---

## 3. Konvensi Subkode Internal RS Batin Tikal

### 3.1 Subkode Numerik (`.01`, `.02`, dst) — universal

Sub-rincian item dalam satu akun BAS yang sama.

Contoh: `521811.01` = Obat & BMHP, `521811.02` = Gas Medis, `521811.03` = ATK (tapi lebih cocok 521111.01).

### 3.2 Subkode Alphabetic (`.A`, `.B`, `.C`) — KHUSUS untuk Belanja Pengadaan

Konteks: akun pengadaan adalah `532111` (Belanja Modal Peralatan dan Mesin) — **satu akun**, tapi komponen pembelanjaan berbeda. Konvensi internal RS untuk distinguishment:

- `.A` = **Alsintor** (alat mesin kantor)
- `.B` = **Alkes** (alat kesehatan)
- `.C` = **Alsatri** (alat kesatriaan, rencana 2026)

Format: `{kode_bas}.{nomor}.{kategori}` — mis. `532111.01.A` (Laptop), `532111.04.B` (Tensimeter), `532111.01.C` (Kursi).

⚠️ **Konvensi `.A`/`.B`/`.C` HANYA untuk Belanja Pengadaan, BUKAN global standardization.** Akun lain (mis. Bekkes 521811, Honor 521115) tidak butuh ini karena beda komponen sudah ada beda akun di BAS.

### 3.3 Persiapan Level 3 (`.A.001`, dst)

Belum diperlukan saat ini. Data model SIKESUMA sudah support multi-level dot notation tanpa schema change. Aktifkan kalau struktur internal ke depan butuh granularity tambahan (mis. per-vendor, per-PO, dll).

---

## 4. Daftar Kode BAS Tidak Dipakai di RS Batin Tikal

Mengingat status sub-Satker non-BLU:

| Seri/Kode | Uraian | Alasan tidak dipakai |
|---|---|---|
| `525xxx` | Seluruh seri Belanja BLU | Belum BLU formal. |
| `5251xx` | Belanja Gaji RS BLU | Idem; pakai `521115` untuk Honor regular. |
| `521213` | Honor Output Kegiatan | Insidentil/output-tied; RS Batin Tikal Honor semua continuous monthly → `521115`. |
| `521813` | Persediaan Pita Cukai/Meterai/Leges | Bukan ranah RS. Sering di-mistake untuk obat — gunakan `521811` untuk obat. |

---

## 5. Daftar Kode Tidak Valid yang Pernah Dipakai (audit-flagged)

Kode-kode yang sebelumnya muncul di SIKESUMA tapi **tidak ada di KEP-331**, beserta remap-nya:

| Kode tidak valid | Konteks lama | Remap valid |
|---|---|---|
| `521311` | "BELANJA JASA" | `522111` (Listrik) + `522113` (Air) split, atau `522112` (Telepon), atau `522191` (Jasa Lainnya), tergantung sub-item. |
| `521411` | "BELANJA PEMELIHARAAN" / "BELANJA MODAL" | `523111` (Pemeliharaan Gedung), `523121` (Pemeliharaan Peralatan), `532111` (Modal Peralatan), `536111` (Modal Lainnya), tergantung substansi. |
| `53611` | "BELAJA APLIKASI XDR" | `536111` (5-digit typo dari Belanja Modal Lainnya). |

---

## 6. Reference Dokumen

- **KEP-331/PB/2021** — Kodefikasi Segmen Akun pada BAS (base, 4,213 codes) — `KEP-331_PB_2021-Kodefikasi-Segmen-Akun-pada-BAS.md`
- **KEP-291/PB/2022** — Pemutakhiran Kodefikasi Segmen Akun pada BAS — `KEP-291_PB_2022-Pemutakhiran-Kodefikasi-Segmen-Akun-pada-BAS.md`
- **Permenhan 5/2020** — Pengelolaan BMP di Lingkungan Kemhan dan TNI
- **SPRINT-B4-RESPONS-ANGGA.md** — Persetujuan Angga 10 Mei 2026 + 3 hard blockers
- **SPRINT-B4-MIGRATION-DIFF-REPORT.md** — Hasil migration Round 1
- **SPRINT-B4-ROUND2-DIFF-REPORT.md** — Hasil migration Round 2 + HITL foundation
- **SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md** — Koreksi audit doc original

---

## 7. Cara Kontribusi Glosarium

Bila menemukan istilah lokal baru:
1. Konfirmasi ke Angga (Sie Renbang) untuk justifikasi & kode BAS.
2. Tambah ke tabel di Section 2.
3. Bila perlu HITL recommendation pattern untuk autocomplete, tambahkan juga ke `utils/internalRecommendations.ts`.
4. Update commit dengan reference ke komunikasi tertulis Angga.

Untuk RS lain yang adopsi template SIKESUMA: tabel di Section 2 spesifik untuk RS Batin Tikal. Glossary internal RS Anda mungkin berbeda — buat versi sendiri.
