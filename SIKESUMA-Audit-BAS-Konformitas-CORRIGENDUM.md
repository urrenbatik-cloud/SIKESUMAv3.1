# SIKESUMA-Audit-BAS-Konformitas — CORRIGENDUM (Sprint B.4)

**Tanggal:** 10 Mei 2026  
**Status:** Koreksi terhadap dokumen `SIKESUMA-Audit-BAS-Konformitas.md` Section 1.2 dan 3.  
**Trigger:** Persetujuan Angga (Sie Renbang RS Tk.IV 02.07.03 Batin Tikal) dengan 3 hard blockers.

---

## Tujuan

Audit doc original dibuat sebelum klarifikasi domain dengan Angga. Saat review B.4, beberapa rekomendasi mapping di audit doc terbukti salah (literal verifikasi ke KEP-331 atau konteks RS-specific). Corrigendum ini mendokumentasikan koreksi resmi sebelum audit doc original di-update.

Audit doc original tetap di repository sebagai historical record. Future reference pakai corrigendum ini untuk koreksi.

---

## Koreksi 1 — Kode `521813` SALAH untuk Obat/BMHP

### Audit doc asli (Section 1.2 dan 3) menyatakan:
> Untuk pengadaan obat-obatan dan BMHP, gunakan `521813` (Belanja Persediaan Konsumsi).

### Verifikasi langsung ke KEP-331/PB/2021:

| Kode | Uraian Resmi (KEP-331 verbatim) |
|---|---|
| `521811` | **Belanja Barang Persediaan Barang Konsumsi** ← yang dimaksud untuk obat/BMHP |
| `521812` | Belanja Barang Persediaan Amunisi |
| **`521813`** | **Belanja Barang Persediaan _Pita Cukai, Meterai dan Leges_** ← bukan obat |

### Koreksi:

**Untuk Obat, BMHP, Gas Medis, Reagen Lab, Oksigen — semua pakai `521811`** (Belanja Barang Persediaan Barang Konsumsi).

**Tabel mapping yang benar:**

| SIKESUMA kode + deskripsi | kode_bas BENAR | kode_bas SALAH (hapus) |
|---|---|---|
| `521211.01` Pengadaan Obat-obatan | `521811` | ~~`521813`~~ |
| `521211.02` BMHP | `521811` | ~~`521813`~~ |
| `521211.03` Oksigen + Reagen | `521811` | ~~`521813`~~ |
| `521811.01` Obat & BMHP (Rekanan) | `521811` | ~~`521813`~~ |
| `521811.02` Gas Medis | `521811` | ~~`521813`~~ |

---

## Koreksi 2 — Klasifikasi Honor: KEP-331 Literal Test

### Audit doc asli menyatakan:
> Untuk Honor TKS dan Honor Nakes (RS BLU), gunakan `521213` (Belanja Honor Output Kegiatan) atau `525111` (Belanja Gaji RS BLU).

### Klarifikasi dari Angga:

**RS Tk.IV 02.07.03 Batin Tikal _belum_ Satker mandiri — di bawah Satker pengelola Palembang.** Ini **bukan BLU formal**, jadi seri `525xxx` _tidak_ relevan.

Pilihan yang benar adalah `521115` vs `521213`. Test literal KEP-331:

| Kode | Karakter (KEP-331 verbatim) — kunci dalam **bold** |
|---|---|
| `521115` | "Honor tidak tetap... menunjang kegiatan operasional... **pembayaran honornya dilakukan secara terus menerus dari awal sampai dengan akhir tahun anggaran**" |
| `521213` | "Honor tidak tetap... terkait dengan output... **pembayaran insidentil dan dapat dibayarkan tidak terus menerus**" |

**Test krusial:** kalau honor dibayar **regular bulanan sepanjang tahun**, kode-nya `521115`. Kalau **insidentil per kegiatan tertentu**, kode-nya `521213`.

### Koreksi: Semua Honor di RS Batin Tikal = `521115`

| Item | Karakter pembayaran | Kode BENAR | Kode SALAH (hapus) |
|---|---|---|---|
| **Honor TKS** | Gaji pokok flat seluruh TKS — bayar **terus-menerus tiap bulan** | **`521115`** | ~~`521213`~~ ~~`525111`~~ |
| **Honor Nakes** | Transport Dokter + Jasa Medis (combined by-design RS) — bayar **regular bulanan** sepanjang tahun, walaupun nominal variable | **`521115`** | ~~`521213`~~ ~~`525111`~~ |
| **Honor Pengelola** | Manajemen + Casemix + Tim Verifikasi — ongoing operational support | **`521115`** | ~~`521213`~~ |

### Catatan tentang Honor Nakes (combined by-design)

Audit doc asli fokus pada "Jasa Medis output-tied per pasien BPJS" → simpulkan `521213`. **Itu salah baca.** Output-relation memang ada (Jasa Medis variable per claim BPJS), tapi **ritme pembayaran-nya regular bulanan**, dan `521213` punya hard requirement "**insidentil dan tidak terus-menerus**" yang diviolate oleh ritme regular bulanan ini. `521115` adalah satu-satunya kode yang fit secara literal KEP-331.

Penggabungan Transport + Jasa Medis dalam satu row Honor Nakes adalah **keputusan by-design RS** untuk:
1. Fleksibilitas paket kompensasi yang kompetitif dengan pasar dokter spesialis
2. Status RS belum Satker mandiri — tidak punya kedaulatan menentukan pengelolaan
3. Pelaporan ke Palembang sebagai single envelope "Honor Nakes"

**Bukan limitasi data; tidak boleh di-split di sprint future** kecuali RS upgrade ke Satker mandiri.

---

## Koreksi 3 — BMP = Bahan Bakar Minyak dan Pelumas (BUKAN Bahan Makanan Pokok)

### Audit doc asli mungkin tidak menyebut, tapi proposal Sprint B.4 awal menafsirkan:
> "BMP" Rp 6jt → asumsi singkatan dari "Bahan Makanan Pokok" → kode_bas `521113` (Belanja Penambah Daya Tahan Tubuh).

### Klarifikasi dari Angga (Permenhan 5/2020 Pasal 1 angka 1):

> "Bahan Bakar Minyak dan Pelumas yang selanjutnya disingkat BMP adalah hasil minyak bumi/nabati... seperti Aviation Gasoline (Avgas), Aviation Turbine Fuel (Avtur), Premium, Pertamax, Minyak Tanah, Solar/HSD, Minyak Diesel/MDF, Minyak Bakar/MFO."

Jadi BMP di RS Batin Tikal = **BBM untuk kendaraan operasional** (ambulance, mobil dinas, genset cadangan), bukan makanan/medis.

### Koreksi: BMP pakai kode khusus Kemhan/TNI

| Kode | Uraian | Pendekatan akuntansi |
|---|---|---|
| **`523122`** | Belanja BMP dan Pelumas Khusus Non Pertamina | Beban langsung (direct expense) |
| `523125` | Belanja Barang Persediaan BMP dan Pelumas Khusus Non Pertamina | Aset/Persediaan (kalau ada stockopname) |

Untuk RS Tk.IV (Non-Alutsista, nominal kecil, tidak ada inventarisir tangki BMP RS): **`523122`** (pendekatan beban).

### Kategori BAS — Catatan penting

`523122` ada di seri `523xxx` (Belanja Pemeliharaan), bukan `521xxx` (Belanja Barang). Klasifikasi BAS resmi memang menempatkan BMP di kategori pemeliharaan untuk Kemhan/TNI — ini akan **mempengaruhi posisi item di LRA**.

Jangan tafsir sebagai bug; ini design KEP-331 yang sengaja.

### Konsekuensi untuk SIKESUMA

Update `utils/basDictionary.ts` — keyword aliases ditambahkan untuk autocomplete (sudah dilakukan di Sprint B.4 commit). Saat user typing "BMP", "BBM", "Pertamax", "Solar", dll, kode `523122` muncul di paling atas dropdown.

---

## Koreksi 4 — Glossarium istilah lokal RS Batin Tikal

Untuk mencegah salah-tafsir di RS lain yang mungkin adopsi template SIKESUMA, dokumentasikan istilah lokal:

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

**Saran tim dev:** Tambahkan ke `README.md` SIKESUMA atau `docs/glossary.md` dedicated.

---

## Status Update Audit Doc Original

Audit doc original di `/mnt/project/SIKESUMA-Audit-BAS-Konformitas.md` adalah snapshot Phase 4 audit. Akan di-update _bersamaan_ dengan Sprint E (testing+docs) untuk reflect koreksi ini. Sebelum itu, **gunakan corrigendum ini sebagai source-of-truth** untuk mapping BAS.

Versi yang akan diupdate di Sprint E:
- Section 1.2 — Klasifikasi Honor (rewrite penuh dengan KEP-331 literal test)
- Section 3 — Tabel pemetaan kolom "Saran kode_bas" untuk row 521211.* dan 521811.*
- Tambah Section 4 baru — Glossarium istilah lokal

---

## Lampiran: Verifikasi Dictionary

Confirm bahwa `utils/basDictionary.ts` (Sprint B.1, commit `fd084ab`) sudah pakai data yang benar dari KEP-331:

```
521811: "Belanja Barang Persediaan Barang Konsumsi"           ✅ benar
521812: "Belanja Barang Persediaan Amunisi"                    ✅ benar
521813: "Belanja Barang Persediaan Pita Cukai, Meterai dan..." ✅ benar (NOT obat)
521115: "Belanja Honor Operasional Satuan Kerja"               ✅ benar
521213: "Belanja Honor Output Kegiatan"                        ✅ benar
523122: "Belanja Bahan Bakar Minyak dan Pelumas (BMP)..."      ✅ benar
523125: "Belanja Barang Persediaan BMP..."                     ✅ benar
```

Dictionary itself correct — koreksi ini **bukan** terhadap dictionary, tapi terhadap **mapping recommendation di audit doc** yang dibuat sebelum klarifikasi dengan Angga.

---

— Tim AI-Assisted Dev  
Generated: 2026-05-10
