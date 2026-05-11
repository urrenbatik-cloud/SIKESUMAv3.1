# Uraian Final Proses Revisi POK dan Revisi Pagu di Aplikasi SIKESUMA TA 2026

**Versi:** Koreksi **v3** — konfirmasi struktur BAS dari RKKS 2025 + nomenklatur KPA Kakesdam + template kop RS
**Konteks Satker:** RS Tk.IV 02.07.03 Batin Tikal Pangkal Pinang — **sub-komponen kode F** pada satker pengelola **Kesdam II/Sriwijaya (kode 685784)**, UO TNI Angkatan Darat (BA 012, UO 22).
**Tanggal Penyusunan:** Mei 2026
**Status pedoman tertinggi:** **Perdirjen Renhan Kemhan No. 7 Tahun 2025** (25 November 2025) — sebagai *lex specialis* dari PMK 62/2023 jo. PMK 107/2024 untuk lingkungan Kemhan dan TNI

### Changelog v2 → v3

| Bagian | Perubahan |
|---|---|
| Header | Konteks satker dikonfirmasi: RS Batin Tikal = **sub-komponen F** di bawah Kesdam II/Sriwijaya (kode satker 685784), berdasarkan struktur BAS RKKS 2025 |
| Glosarium G.6 | **KPA = Kakesdam II/Sriwijaya** dikonfirmasi (sebelumnya hanya "pejabat satker pengelola Palembang") |
| Section 12.2 (BARU) | **Struktur Klasifikasi BAS RS Batin Tikal** — kode Program, Kegiatan, KRO, RO, sub-komponen yang aktual dari RKKS 2025 sebagai referensi konkret |
| Section 13 | **Template SK Revisi POK direvisi**: kop Kesdam II/Sriwijaya, KPA = Kakesdam, contoh matriks pakai akun riil (521811 BEKKES, 521115 Honor) sesuai RKKS 2025 |
| Section 13.5 (BARU) | **Template Kop Surat untuk RS Batin Tikal** — proposal format, karena per Sie Renbang belum ada kop standar untuk RS Batin Tikal |
| Section 14 | Items "Tim TepBek" dan "Periodisasi LHR APIP" **dihapus** karena di luar scope RS Tk.IV (ranah Korem dan satker Palembang). Item "Akses LHR APIP" dikonfirmasi: **via Palembang**, RS submit usulan saja |

### Changelog v1 → v2 *(historikal, tetap berlaku)*

| Bagian | Perubahan |
|---|---|
| Section 0 (Dasar Hukum) | Ditambah **Perdirjen Renhan 7/2025** sebagai pedoman utama lingkungan Kemhan/TNI; **Perpang TNI 42/2018** + 3 Kep Kasad sebagai lapis internal TNI AD; PMK 143/2018 disesuaikan rujukannya |
| Section 2 (Sub-Satker) | Workflow berjenjang **Satker → UO → Kemhan** diperjelas sesuai Pasal 12–15 Perdirjen Renhan; rute formal ke Asren Kasad dan Dirjen Renhan Kemhan |
| Section 3 (Revisi POK) | Rujukan utama berubah ke **Pasal 22 Perdirjen Renhan 7/2025**; ditambah constraint baru **"memperhatikan LHR APIP"**; rincian 5 sub-kategori dari Lampiran I Bagian 5 |
| Section 6 (Batas Waktu) | Tabel batas waktu di-update penuh sesuai **Pasal 24 Perdirjen Renhan**: batas pemutakhiran POK **27 Desember** (bukan 26 Desember), tambah batas internal Ditjen Renhan 29 Oktober & 13 Desember, dst. |
| Section 12 (sebelumnya: Konfirmasi) | Diganti menjadi **Klarifikasi dari Sie Renbang RS** dengan 6 jawaban Angga (Mei 2026) |
| Section 13 (BARU) | **Template SK Revisi POK** + dokumen pendukung (matriks semula-menjadi, surat usulan, surat pernyataan tanggung jawab) sesuai Lampiran II Perdirjen Renhan |
| Glosarium G.6, G.10 | Ditambah Dirjen Renhan Kemhan, Asren Kasad, Asrenum Panglima TNI, LHR APIP, Reviu APIP, Sistem Informasi, Tim TepBek, dan referensi Perpang TNI / Kep Kasad |

---

## Glosarium

Glosarium ini bertujuan menyamakan tafsir antara seluruh stakeholder (Sie Renbang RS Batin Tikal, Karumkit, satker pengelola Palembang, Asren Kasad TNI AD, Dirjen Renhan Kemhan, developer SIKESUMA, auditor). Definisi formal mengacu pada Perdirjen Renhan Kemhan No. 7/2025, PMK 62/2023 jo. PMK 107/2024, Permenhan 5/2020, dan KEP-331/PB/2021. Istilah kerja (*working terms*) diberi tanda **\[istilah kerja\]**.

### G.1 Penganggaran Umum

| Istilah | Definisi |
|---|---|
| **APBN** | Anggaran Pendapatan dan Belanja Negara. Rencana keuangan tahunan pemerintah pusat. |
| **APBN-P** | APBN Perubahan. |
| **ABT** | Anggaran Belanja Tambahan. |
| **TA** | Tahun Anggaran (1 Januari – 31 Desember). |
| **APIP** | Aparat Pengawasan Intern Pemerintah. Untuk lingkungan Kemhan: **Inspektorat Jenderal Kemhan**. Untuk TNI: **Itjen TNI**, **Itjen Kasad/AL/AU**. |
| **LHR** | Laporan Hasil Reviu APIP. Dokumen output reviu Inspektorat Jenderal atas RKA atau usulan revisi anggaran. (Perdirjen Renhan 7/2025 Pasal 1 angka 38) |
| **LKKL** | Laporan Keuangan Kementerian/Lembaga. |
| **LKPP** | Laporan Keuangan Pemerintah Pusat. |
| **IKPA** | Indikator Kinerja Pelaksanaan Anggaran. |

### G.2 Struktur Klasifikasi Anggaran (BAS)

| Istilah | Definisi |
|---|---|
| **BAS** | Bagan Akun Standar (KEP-211/PB/2018 jo. KEP-331/PB/2021 dan KEP-291/PB/2022). |
| **BA** | Bagian Anggaran. Kelompok anggaran negara per K/L atau BUN. Kemhan ada di **BA 012** (Kemhan/TNI). (Perdirjen Renhan 7/2025 Pasal 1 angka 12) |
| **Program** | Penjabaran kebijakan K/L untuk mencapai sasaran strategis. |
| **Kegiatan** | Aktivitas yang menghasilkan keluaran dalam mendukung sasaran Program. |
| **KRO** | Klasifikasi Rincian Output. Kelompok RO yang sejenis/serumpun. (Perdirjen Renhan 7/2025 Pasal 1 angka 35) |
| **RO** | Rincian Output. Keluaran riil dengan **volume dan satuan** di DIPA. (Perdirjen Renhan 7/2025 Pasal 1 angka 36) |
| **Komponen** | Tahapan/jenis pengeluaran di dalam RO. Khusus Layanan Perkantoran: **001** = Belpeg, **002** = Operasional & Pemeliharaan Kantor. |
| **Akun** | Kode 6 digit klasifikasi rinci jenis pengeluaran. |

**Disambiguasi:**
- "Akun" = kode 6 digit penuh; "Jenis belanja" = 2 digit pertama (51/52/53/57).
- "Komponen" bukan sinonim "Kegiatan" atau "RO".

### G.3 Jenis Belanja

| Kode | Jenis Belanja |
|---|---|
| **51** | Belanja Pegawai (gaji, tunjangan melekat, honor operasional satker) |
| **52** | Belanja Barang (operasional, non-operasional, persediaan, jasa, pemeliharaan ringan, perjalanan) |
| **53** | Belanja Modal (aset >1 tahun di atas nilai kapitalisasi) |
| **57** | Belanja Bantuan Sosial (umumnya tidak relevan untuk RS Tk.IV) |

### G.4 Sumber Dana

| Kode | Definisi |
|---|---|
| **RM** | Rupiah Murni (APBN murni) |
| **PNBP** | Penerimaan Negara Bukan Pajak |
| **PHLN** | Pinjaman/Hibah Luar Negeri |
| **PLN** | Pinjaman Luar Negeri (Perdirjen Renhan 7/2025 Pasal 1 angka 24) |
| **PDN** | Pinjaman Dalam Negeri (Perdirjen Renhan 7/2025 Pasal 1 angka 25) |
| **Hibah** | Penerimaan negara tanpa kewajiban pengembalian (Perdirjen Renhan 7/2025 Pasal 1 angka 26) |
| **RMP** | Rupiah Murni Pendamping. Dana RM yang mendampingi PLN/hibah luar negeri. (Perdirjen Renhan 7/2025 Pasal 1 angka 30) |
| **SBSN** | Surat Berharga Syariah Negara (Perdirjen Renhan 7/2025 Pasal 1 angka 27) |
| **BLU** | Pendapatan Badan Layanan Umum (RS Batin Tikal **bukan BLU**) |

### G.5 Dokumen Anggaran

| Istilah | Definisi |
|---|---|
| **RKA-K/L / RKA Kemhan** | Rencana Kerja dan Anggaran K/L. Untuk Kemhan: RKA Kemhan. (Perdirjen Renhan 7/2025 Pasal 1 angka 7) |
| **DIPA / DIPA Petikan** | Daftar Isian Pelaksanaan Anggaran. DIPA Petikan = per-Satker, dicetak otomatis dari Sistem Informasi. (Perdirjen Renhan 7/2025 Pasal 1 angka 9–10) |
| **DIPA Kemhan** | DIPA pada BA 012 Kemhan/TNI. |
| **DIPA Daerah** | Mekanisme khusus DIPA Kemhan/TNI sebagai otorisasi pembayaran di tingkat daerah (PMK 143/PMK.05/2018). Relevan untuk satker pengelola Palembang. |
| **Halaman I DIPA** | Alokasi per Program, Kegiatan, KRO, RO, jenis belanja. |
| **Halaman III DIPA** | **Rencana Penarikan Dana (RPD) bulanan** per jenis belanja. |
| **Halaman IV.B DIPA** | Catatan PNBP. |
| **POK** | Petunjuk Operasional Kegiatan. Dokumen yang memuat uraian rencana kerja dan biaya untuk pelaksanaan kegiatan, **disusun oleh KPA** sebagai penjabaran DIPA. (Perdirjen Renhan 7/2025 Pasal 1 angka 11) |
| **RPD** | Rencana Penarikan Dana. |
| **ADK** | Arsip Data Komputer (file RKA hasil aplikasi Sistem Informasi). |
| **LRA** | Laporan Realisasi Anggaran. |
| **SP SABA** | Surat Penetapan Satuan Anggaran Bagian Anggaran. Dokumen alokasi untuk pergeseran dari Sub BA BUN Belanja Lainnya ke BA Kemhan. (Perdirjen Renhan 7/2025 Pasal 1 angka 33) |

### G.6 Otoritas dan Lembaga

| Istilah | Definisi |
|---|---|
| **PA** | Pengguna Anggaran. **Menteri Pertahanan** untuk BA Kemhan. (Perdirjen Renhan 7/2025 Pasal 1 angka 14) |
| **KPA** | Kuasa Pengguna Anggaran. **Pejabat satker** yang diberi kuasa oleh PA. **Untuk RS Batin Tikal: KPA = Kakesdam II/Sriwijaya** (Kepala Kesehatan Daerah Militer II/Sriwijaya) — kepala satker pengelola Kesdam II/SWJ kode 685784. Nama dan NRP diinput manual ke SIKESUMA per TA. (Perdirjen Renhan 7/2025 Pasal 1 angka 15) |
| **PPK** | Pejabat Pembuat Komitmen. |
| **PPSPM** | Pejabat Penanda Tangan SPM. |
| **Bendahara Pengeluaran** | Pejabat pengelola UP/TUP. |
| **UO** | Unit Organisasi. Tingkatan dalam pengelolaan program & anggaran Kemhan/TNI. **5 UO**: UO Kemhan, UO Mabes TNI, UO TNI AD, UO TNI AL, UO TNI AU. (Perdirjen Renhan 7/2025 Pasal 1 angka 6) |
| **Kepala UO (TNI AD)** | **Kasad** (Kepala Staf Angkatan Darat). |
| **Asren Kasad** | Asisten Perencanaan Kasad. Penanggung jawab penelitian usulan revisi anggaran di tingkat UO TNI AD. (Perdirjen Renhan 7/2025 Pasal 14 huruf a) |
| **Asrenum Panglima TNI** | Asisten Perencanaan Umum Panglima TNI. Penanggung jawab penelitian di tingkat UO Mabes TNI. |
| **Karoren Kemhan** | Kepala Biro Perencanaan dan Keuangan Sekjen Kemhan. Penanggung jawab penelitian di tingkat UO Kemhan. |
| **Dirjen Renhan Kemhan** | Direktur Jenderal Perencanaan Pertahanan Kemhan. **Pejabat eselon I yang menyusun & meneliti revisi anggaran tingkat Kemhan** sebelum diteruskan ke DJA/DJPb Kemenkeu. (Perdirjen Renhan 7/2025 Pasal 1 angka 4) |
| **Itjen Kemhan / Itjen TNI / Itjen Kasad** | Inspektorat Jenderal di lingkungan Kemhan dan masing-masing matra TNI. **Pelaksana fungsi APIP.** |
| **DJA Kemenkeu** | Direktorat Jenderal Anggaran. |
| **DJPb Kemenkeu** | Direktorat Jenderal Perbendaharaan. |
| **Dit. PA DJPb** | Direktorat Pelaksanaan Anggaran DJPb. |
| **Kanwil DJPb** | Kantor Wilayah DJPb di tingkat provinsi. |
| **KPPN** | Kantor Pelayanan Perbendaharaan Negara. |
| **BUN** | Bendahara Umum Negara (Menteri Keuangan). |
| **PPA BUN** | Pembantu Pengguna Anggaran BUN. |

### G.7 Jenis Revisi (Klasifikasi Perdirjen Renhan 7/2025 Pasal 2)

| Istilah | Definisi |
|---|---|
| **Revisi Anggaran** | Perubahan rincian RKA dan/atau informasi kinerja, termasuk revisi DIPA pada TA berkenaan. (Perdirjen Renhan 7/2025 Pasal 1 angka 1) |
| **Revisi Pagu Berubah** | Penambahan/pengurangan pagu BA Kemhan. (Perdirjen Renhan 7/2025 Pasal 2 ayat 2) |
| **Revisi Pagu Tetap** | Pergeseran dalam 1 BA Kemhan **tanpa mengubah total pagu**. (Perdirjen Renhan 7/2025 Pasal 2 ayat 3) |
| **Revisi POK** | Subset revisi pagu tetap: pergeseran dalam 1 KRO/1 RO/penambahan akun, **kewenangan KPA**, **tidak mengubah DIPA**. (Perdirjen Renhan 7/2025 Pasal 22) |
| **Pemutakhiran POK** | Pencatatan revisi POK kewenangan KPA ke Sistem Informasi via unggah + persetujuan KPA. (Perdirjen Renhan 7/2025 Pasal 22 huruf c–d) |
| **Revisi DIPA Halaman III** | Revisi RPD bulanan. |
| **Revisi Administrasi** | Perbaikan ralat/koreksi, perubahan rumusan non-anggaran, pembukaan blokir. (Perdirjen Renhan 7/2025 Pasal 2 ayat 4) |
| **\[Istilah kerja\]** **Tambah Pagu** | Sebutan internal RS untuk revisi pagu berubah yang menambah. Istilah formal Perdirjen: "Revisi Pagu Anggaran berubah berupa penambahan pagu". |

### G.8 Konsep & Praktik Operasional

| Istilah | Definisi |
|---|---|
| **Reviu APIP** | Pemeriksaan oleh Itjen Kemhan/TNI atas usulan revisi anggaran tertentu, dituangkan dalam **LHR**. Wajib untuk: (a) revisi pagu berubah; (b) revisi antar-Program yang turunkan volume RO (kecuali belop); (c) reorganisasi/restrukturisasi; (d) ada KRO/RO baru. (Perdirjen Renhan 7/2025 Pasal 14 huruf b) |
| **Penelitian** | Pemeriksaan kelengkapan dokumen oleh Asren/Asrenum/Karoren di tingkat UO, atau Dirjen Renhan di tingkat Kemhan. Berbeda dengan reviu APIP. (Perdirjen Renhan 7/2025 Pasal 14, 15) |
| **Refocusing / Automatic Adjustment** | Pengalihan/blokir besar atas perintah pemerintah. |
| **Pagu Minus** | Realisasi melebihi pagu. Untuk Belpeg: wajib selesai sebelum 31 Desember. |
| **Carry-Over** | Lanjutan kegiatan TA sebelumnya (PLN/SBSN/hibah). |
| **Sisa Anggaran Kontraktual** | Selisih lebih pagu RO dgn nilai kontrak. Dapat digunakan untuk pemenuhan belop atau penambahan volume RO. (Perdirjen Renhan 7/2025 Pasal 1 angka 22, Pasal 23 ayat 1 huruf a angka 3) |
| **Sistem Informasi** | Aplikasi Kemenkeu untuk perencanaan dan penganggaran (SAKTI). Dalam Perdirjen Renhan 7/2025 disebut "Sistem Informasi". (Pasal 1 angka 34) |
| **\[Istilah kerja\]** **Net Change 0** | Tafsir teknis SIKESUMA untuk "pagu tetap". |
| **\[Istilah kerja\]** **Forward-Looking** | Tafsir bahwa revisi tidak mengubah realisasi yang sudah terjadi sebelum tanggal penetapan. |

### G.9 Sistem dan Dokumen Pencairan

| Istilah | Definisi |
|---|---|
| **SAKTI** | Sistem Aplikasi Keuangan Tingkat Instansi (= "Sistem Informasi" dalam Perdirjen Renhan). |
| **SIKESUMA** | Aplikasi internal RS Batin Tikal, layer operasional di atas SAKTI. |
| **SPM / SP2D** | Surat Perintah Membayar / Surat Perintah Pencairan Dana. |
| **SBM / SBK** | Standar Biaya Masukan / Keluaran. |
| **UP / TUP / GUP / PTUP** | Uang Persediaan / Tambahan UP / Ganti UP / Pertanggungjawaban TUP. |

### G.10 Konteks Satker TNI AD

| Istilah | Definisi |
|---|---|
| **Satker** | Unit organisasi yang **memiliki KPA dan DIPA Petikan**. (Perdirjen Renhan 7/2025 Pasal 1 angka 16) |
| **Satker mandiri** | Satker yang KPA-nya pejabat di unit itu sendiri. |
| **\[Istilah kerja\]** **Sub-satker** | Unit yang **belum** memiliki DIPA Petikan/KPA, di bawah satker pengelola. **Bukan istilah formal Perdirjen.** RS Batin Tikal saat ini = sub-satker. |
| **\[Istilah kerja\]** **Satker pengelola / induk** | Satker yang memegang DIPA dan KPA untuk sub-satker di bawahnya. RS Batin Tikal berinduk ke satker pengelola di Palembang. |
| **Karumkit** | Kepala Rumah Sakit. **Untuk RS sub-satker bukan KPA**, hanya pemberi rekomendasi internal. |
| **Wakarumkit** | Wakil Kepala Rumah Sakit. |
| **Puskesad** | Pusat Kesehatan AD (eselon pusat pembinaan kesehatan TNI AD). |
| **Kesdam** | Kesehatan Daerah Militer (level Kodam). **RS Batin Tikal berada di lingkup Kesdam II/Sriwijaya, kode satker 685784**, di bawah Kodam II/Sriwijaya. |
| **Denkesyah** | Detasemen Kesehatan Wilayah (level Korem). |
| **RS Tk.II/III/IV** | Klasifikasi RS militer (Tk.II terbesar, Tk.IV paling kecil). |
| **Rumkitban** | Rumah Sakit Bantuan. |
| **Aslog Kasad** | Asisten Logistik Kasad. |
| **Sie Renbang / Renprogar** | Seksi Perencanaan & Pengembangan (atau: Perencanaan & Program Anggaran). Unit penyusun RKKS di RS. |
| **RKKS** | Rencana Kerja Kegiatan Satuan/Satker. |
| **Tim TepBek** | Tim Tepati Pembekalan. Tim yang mengelola alokasi dan distribusi BMP di lingkungan TNI. **Beroperasi di tingkat Korem**, **di luar scope RS Tk.IV Batin Tikal** — RS hanya menggunakan BMP sesuai kebutuhan, tidak terlibat dalam alokasi/distribusi. |
| **Permenhan** | Peraturan Menteri Pertahanan. |
| **Perdirjen Renhan** | Peraturan Direktur Jenderal Perencanaan Pertahanan Kemhan. **Pedoman teknis revisi anggaran lingkungan Kemhan/TNI**. Saat ini berlaku: **Perdirjen Renhan No. 7 Tahun 2025**. |
| **Perpang TNI** | Peraturan Panglima TNI. Relevan: **Perpang TNI No. 42 Tahun 2018** tentang Penyusunan Rencana Kerja di Lingkungan TNI. |
| **Kep Kasad** | Keputusan Kepala Staf Angkatan Darat. Relevan untuk perencanaan & anggaran TNI AD: **Kep/511/VIII/2015**, **Kep/847/IX/2019**, **Kep/900/XII/2021**. |
| **UO Angkatan** | Salah satu dari UO TNI AD, UO TNI AL, UO TNI AU. (Berbeda dengan UO Kemhan & UO Mabes TNI.) |
| **SIMAK-BMN** | Sistem Informasi Manajemen dan Akuntansi BMN. |
| **PB-221** | Paktur Bon 221, dokumen bukti pengambilan BMP bulanan oleh Satkai III (Permenhan 5/2020). |
| **Satkai I/II/III** | Satuan Pemakai BMP tingkat I/II/III. **RS Tk.IV biasanya Satkai III** (Permenhan 5/2020 Pasal 1). |
| **Renbut** | Rencana Kebutuhan BMP per triwulan/tahunan (Permenhan 5/2020 Pasal 3–7). |
| **Coklit** | Pencocokan dan Penelitian BMP bulanan dengan PB-221 (Permenhan 5/2020 Pasal 1 angka 13). |
| **Alpalhankam** | Alat Peralatan Pertahanan dan Keamanan. |
| **SPO** | Special Oil Non Pertamina. |

### G.11 Istilah Operasional RS (Konteks SIKESUMA)

| Istilah | Definisi |
|---|---|
| **BEKKES** | Perbekalan Kesehatan (obat, BMHP, gas medis, reagen). Akun rujukan: `521811`. |
| **BMHP** | Bahan Medis Habis Pakai. Akun: `521811`. |
| **BMP** | **Bahan Bakar Minyak dan Pelumas** (Permenhan No. 5/2020 Pasal 1 angka 1). Untuk RS Tk.IV: BBM kendaraan operasional. Akun: **`523122`** (beban) atau `523125` (persediaan). **BUKAN bahan makanan.** |
| **Bahan Makanan Pasien** | Makanan untuk pasien rawat inap. Akun: **`521112`** (KEP-331/PB/2021). Bukan disingkat "BMP". |
| **BPJS** | Badan Penyelenggara Jaminan Sosial Kesehatan. |
| **Yanmas / Yanmasum** | Pelayanan Masyarakat / Umum (non-BPJS), masuk PNBP. |
| **Jasa Medis** | Insentif untuk dokter, paramedis, dari komponen klaim BPJS/Yanmasum. |
| **DPJP** | Dokter Penanggung Jawab Pasien. |
| **Raber** | Rawat Bersama. |
| **TKS** | Tenaga Kerja Sukarela. Honor TKS flat masuk `521115`. |
| **Honor Nakes** | Honor Tenaga Kesehatan. Umbrella Insentif Medis/Paramedis/Insentif TKS/Insentif Pengelola, formula-based per klaim, masuk `521213`. |

### G.12 Disambiguasi Cepat (Sumber Bias)

| Sering Tertukar | Penjelasan |
|---|---|
| **Revisi POK** vs **Pemutakhiran POK** | Revisi POK = keputusan substantif KPA. Pemutakhiran POK = pencatatan teknis ke Sistem Informasi/SAKTI. |
| **Revisi POK** vs **Revisi DIPA Halaman III** | Revisi POK tidak mengubah RPD. Jika menyentuh RPD, naik menjadi Revisi DIPA Halaman III. |
| **Akun (6 digit)** vs **Jenis Belanja (2 digit)** | "Akun" = 6 digit penuh; "jenis belanja" = 2 digit pertama. |
| **KRO** vs **Komponen** | KRO = klasifikasi output (apa). Komponen = jenis pengeluaran dalam RO (gaji vs operasional). |
| **Karumkit** vs **KPA** | Karumkit = pejabat RS (memberi rekomendasi). KPA = pejabat satker pengelola Palembang (penetap formal). **Bukan orang yang sama.** |
| **Satker** vs **Sub-satker** | Satker = punya DIPA Petikan & KPA. Sub-satker = belum punya. RS Batin Tikal = sub-satker. |
| **Penelitian** vs **Reviu APIP** | Penelitian = pemeriksaan kelengkapan oleh Asren/Dirjen Renhan. Reviu APIP = pemeriksaan substansi oleh Itjen, menghasilkan LHR. Tidak boleh dipertukarkan. |
| **PNBP** vs **BLU** | RS Batin Tikal **bukan BLU**. Seri akun `525xxx` BLU tidak relevan. |
| **"Pagu tetap"** vs **"Net change 0"** | Sama makna. "Pagu tetap" = istilah Perdirjen/PMK; "net change 0" = teknis SIKESUMA. |
| **BMP** vs **Bahan Makanan Pasien** | BMP = bahan bakar (`523122`); Bahan Makanan Pasien = makanan pasien (`521112`). **Sangat berbeda.** |
| **Sistem Informasi** (Perdirjen) vs **SAKTI** | Sama. "Sistem Informasi" istilah formal Perdirjen Renhan; "SAKTI" istilah operasional sehari-hari. |

---

## 0. Dasar Hukum

Disusun dari paling umum (UU) ke paling khusus (Kep Kasad). Untuk konteks RS Tk.IV TNI AD, **Perdirjen Renhan 7/2025 adalah lex specialis** dari PMK Kemenkeu untuk revisi anggaran.

| Lapis | Peraturan | Pasal/Bagian Kunci |
|---|---|---|
| UU | UU No. 17/2003 (Keuangan Negara); UU No. 1/2004 (Perbendaharaan Negara) | Prinsip DIPA = batas pengeluaran tertinggi |
| PP | PP No. 45/2013 jo. PP No. 50/2018 tentang Tata Cara Pelaksanaan APBN | Mekanisme umum pelaksanaan anggaran |
| Perpres | **Perpres No. 151/2024** jo. **Perpres No. 85/2025** tentang Kementerian Pertahanan | Organisasi Kemhan |
| PMK (utama Kemenkeu) | **PMK No. 62 Tahun 2023** jo. **PMK No. 107 Tahun 2024** tentang Perencanaan Anggaran, Pelaksanaan Anggaran, serta Akuntansi dan Pelaporan Keuangan | Pasal kewenangan revisi, jenis revisi, batas waktu (Pasal 175) |
| PMK (khusus Kemhan/TNI) | **PMK No. 143/PMK.05/2018** tentang Mekanisme Pelaksanaan Anggaran Belanja Negara di Lingkungan Kemhan dan TNI | DIPA Daerah sebagai otorisasi pembayaran |
| Permenhan | **Permenhan No. 5 Tahun 2020** tentang Pengelolaan BMP di Lingkungan Kemhan dan TNI | Pasal 1 angka 1 (definisi BMP); Pasal 8 (tambah pagu BMP); hierarki Satkai I/II/III |
| Perdirjen Renhan | **Perdirjen Renhan Kemhan No. 7 Tahun 2025** tentang Tata Cara Revisi Anggaran di Lingkungan Kemhan dan TNI *(mencabut Perdirjen Renhan 3/2021; berlaku sejak 25 November 2025)* | **Pasal 22** (Revisi POK kewenangan KPA); **Pasal 23** (revisi yang ubah DIPA); **Pasal 24** (batas waktu); **Lampiran I Bagian 5** (rincian kewenangan KPA); **Lampiran II** (format dokumen) |
| Perdirjen (BAS) | **KEP-211/PB/2018** jo. **KEP-331/PB/2021** dan **KEP-291/PB/2022** | Aturan kode akun (BAS) |
| Perpang TNI | **Perpang TNI No. 42 Tahun 2018** tentang Penyusunan Rencana Kerja di Lingkungan TNI | Kerangka penyusunan rencana kerja di TNI |
| Kep Kasad | **Kep Kasad No. Kep/511/VIII/2015** tentang Petunjuk Administrasi Perencanaan Program & Anggaran TNI AD | Bukop perencanaan & anggaran level TNI AD |
| Kep Kasad | **Kep Kasad No. Kep/847/IX/2019** tentang Petunjuk Teknis Penyusunan Dokumen Rencana Kerja TNI AD | Juknis dokumen renja TNI AD |
| Kep Kasad | **Kep Kasad No. Kep/900/XII/2021** tentang Petunjuk Pelaksanaan Program & Anggaran TNI AD | Juklak program & anggaran TNI AD |

> **Catatan hierarki:** Untuk RS Tk.IV TNI AD, urutan rujukan adalah: (1) UU/PP → (2) PMK Kemenkeu (62/2023, 107/2024) → (3) Perdirjen Renhan Kemhan 7/2025 sebagai juklak revisi anggaran khusus Kemhan/TNI → (4) Permenhan 5/2020 untuk BMP → (5) Perpang TNI 42/2018 → (6) Kep Kasad. Perdirjen Renhan 7/2025 **konsisten dengan dan mengelaborasi** PMK 62/2023 untuk konteks Kemhan, jadi tidak ada konflik aturan.

> **Per klarifikasi Sie Renbang Mei 2026:** Puskesad **tidak menerbitkan Juklak/Juknis khusus** pengelolaan keuangan RS Tk.IV. Aturan tertinggi yang spesifik mengatur revisi anggaran adalah Perdirjen Renhan Kemhan 7/2025.

---

## 1. Klasifikasi Revisi Anggaran (Pasal 2 Perdirjen Renhan 7/2025)

| Kategori | Definisi | Total Pagu | Otoritas Penetap |
|---|---|---|---|
| **A. Revisi Pagu Berubah** | Penambahan/pengurangan pagu BA Kemhan. (Pasal 2 ayat 2) | Berubah | DJA Kemenkeu (umumnya); sebagian Kanwil DJPb |
| **B. Revisi Pagu Tetap** | Pergeseran rincian dalam 1 BA Kemhan tanpa mengubah total. (Pasal 2 ayat 3) | Tetap | DJA / Dit. PA DJPb / Kanwil DJPb / **KPA** (sesuai cakupan) |
| **C. Revisi Administrasi** | Perbaikan ralat/koreksi, perubahan rumusan non-anggaran, pembukaan blokir. (Pasal 2 ayat 4) | Tetap | DJA / DJPb / Kemhan / KPA |

**Posisi "Revisi POK"** dalam taksonomi ini: **subset kategori B (Pagu Tetap) yang menjadi kewenangan KPA**, sebagaimana dirinci di Pasal 22 dan Lampiran I Bagian 5 Perdirjen Renhan 7/2025.

---

## 2. Konteks Sub-Satker: Mekanisme Berjenjang (Pasal 12 Perdirjen Renhan)

RS Tk.IV 02.07.03 Batin Tikal **bukan satker mandiri** — anggarannya berinduk pada satker pengelola Palembang. KPA satker bukan Karumkit.

Perdirjen Renhan 7/2025 mengatur **mekanisme berjenjang** untuk revisi anggaran:

```
Satker (KPA) → UO Angkatan → Kemhan (Dirjen Renhan) → DJA/DJPb Kemenkeu
```

### 2.1 Penerapan untuk RS Batin Tikal

| Tingkat | Pejabat / Unit | Tugas |
|---|---|---|
| Sub-satker (RS) | Sie Renbang RS → Karumkit | Menyusun usulan revisi, justifikasi naratif, dan rekomendasi internal RS |
| Satker pengelola | Tata Usaha + Bagian Anggaran satker Palembang | Verifikasi teknis |
| **KPA Satker** | Pejabat satker pengelola Palembang | **Menetapkan revisi POK** (untuk yang tidak ubah DIPA, Pasal 22) atau **mengusulkan ke UO** (untuk yang ubah DIPA, Pasal 23) |
| **UO TNI AD** | **Asren Kasad** | Penelitian kelengkapan dokumen (Pasal 14 huruf a); meneruskan ke Itjen Kasad bila perlu reviu APIP; tanda tangan surat usulan ke Dirjen Renhan |
| **APIP TNI AD** | **Itjen Kasad** | Reviu untuk kategori tertentu (Pasal 14 huruf b); menghasilkan **LHR APIP** |
| **Kemhan** | **Dirjen Renhan Kemhan** | Penelitian tingkat Kemhan (Pasal 15); tanda tangan surat usulan ke DJA/DJPb via Sistem Informasi |
| **Kemenkeu** | DJA atau DJPb (Dit. PA / Kanwil) | Penetapan/pengesahan akhir |

### 2.2 Implikasi untuk Berbagai Jenis Revisi

| Jenis Revisi | KPA bisa tetapkan sendiri? | Naik ke UO? | Naik ke Kemhan? | Pengesahan Kemenkeu? |
|---|---|---|---|---|
| Revisi POK murni (tidak ubah DIPA) — Pasal 22 | ✅ Ya | Tidak | Tidak | Tidak |
| Revisi yang ubah DIPA dalam 1 Satker — Pasal 23 ayat 1 huruf c angka 1 | ✅ Ya, tapi… | Tidak | Tidak | **Ya** — pengesahan Kanwil DJPb |
| Revisi antar-Satker dalam 1 UO | Tidak | ✅ Ya | Tidak | Pengesahan Kanwil DJPb |
| Revisi antar-Satker antar-UO | Tidak | ✅ Ya | ✅ Ya | Pengesahan Dit. PA DJPb |
| Revisi Pagu Berubah | Tidak | ✅ Ya | ✅ Ya | DJA |

> **Pesan utama:** Karumkit RS Tk.IV Batin Tikal **tidak memiliki kewenangan menetapkan** revisi anggaran apa pun. Yang Karumkit lakukan adalah **memberi rekomendasi/persetujuan internal** atas usulan Sie Renbang RS, sebelum diteruskan ke satker pengelola Palembang. KPA Palembang yang menetapkan (untuk Pasal 22) atau mengusulkan ke jenjang di atasnya (untuk Pasal 23).

---

## 3. Revisi POK (Kewenangan KPA) — Pasal 22 Perdirjen Renhan 7/2025

### 3.1 Definisi Resmi

**Pasal 22 Perdirjen Renhan 7/2025:**

> "Revisi Anggaran pada Kemhan yang tidak mengakibatkan perubahan DIPA … dilakukan dengan ketentuan:
>
> a. Kepala Satker selaku KPA dapat melakukan Revisi Anggaran dalam 1 (satu) Satker berupa:
>    1. pergeseran anggaran dalam 1 (satu) KRO dalam 1 (satu) Kegiatan; dan/atau
>    2. penambahan/perubahan akun beserta alokasi anggarannya dalam 1 (satu) RO.
>
> b. Revisi Anggaran sebagaimana dimaksud pada huruf a dilakukan sepanjang:
>    1. tidak mengubah sumber dana, pagu anggaran Satker, satuan dan volume RO, dan jenis belanja; **dan**
>    2. dilakukan dengan **memperhatikan hasil reviu Inspektorat Jenderal di lingkungan Kemhan dan TNI atas RKA tahun anggaran berkenaan**;
>
> c. Revisi Anggaran … dilakukan dengan melakukan **pemutakhiran data POK yang ditetapkan oleh KPA**, serta mengubah data RKA Kemhan dengan menggunakan **Sistem Informasi**.
>
> d. … KPA melakukan pengunggahan dan persetujuan atas usulan revisi POK melalui Sistem Informasi."

### 3.2 Rincian Lima Sub-Kategori (Lampiran I Bagian 5)

| Kode | Uraian | Pihak Berwenang |
|---|---|---|
| **5.a** | Pergeseran antar-RO dalam 1 KRO dan dalam 1 Satker | **KPA** |
| **5.b** | Pergeseran dalam 1 RO dalam 1 Satker | **KPA** |
| **5.c** | Penambahan/perubahan akun beserta alokasi dalam 1 RO | **KPA** |
| **5.d** | Pemutakhiran data hasil revisi POK | **KPA** (dengan syarat: tidak ubah Halaman III DIPA; batas 27 Desember) |
| **5.e** | Pergeseran dalam 1 RO Prioritas Nasional dalam 1 Satker dan 1 jenis belanja (tidak ubah output & lokasi) | **KPA** |

### 3.3 Constraint Wajib (Hard Constraints) — Konsolidasi Pasal 22 + Lampiran I

| # | Constraint | Sumber |
|---|---|---|
| C1 | Total pagu satker tidak berubah (net change = 0) | Pasal 22 huruf b angka 1 |
| C2 | Pergeseran dalam **1 KRO yang sama** *(untuk skema 5.a)* atau **1 RO yang sama** *(untuk 5.b, 5.c)* | Pasal 22 huruf a |
| C3 | Pergeseran dalam **1 Kegiatan yang sama** | Pasal 22 huruf a angka 1 |
| C4 | Pergeseran dalam **1 Satker yang sama** | Pasal 22 huruf a |
| C5 | **Tidak mengubah volume dan satuan RO** | Pasal 22 huruf b angka 1 |
| C6 | **Tidak mengubah jenis belanja** (2 digit pertama akun: 51/52/53/57) | Pasal 22 huruf b angka 1 |
| C7 | **Tidak mengubah sumber dana** (RM/PNBP/PLN/PDN/Hibah) | Pasal 22 huruf b angka 1 |
| C8 | **Memperhatikan LHR APIP** atas RKA tahun anggaran berkenaan | Pasal 22 huruf b angka 2 **(BARU di Perdirjen 7/2025)** |
| C9 | **Tidak boleh** menyebabkan mata anggaran/akun menjadi minus | Prinsip umum pelaksanaan APBN |
| C10 | Sesuai standar biaya (SBM/SBK) | PMK Standar Biaya tahunan |
| C11 | **Tidak mengubah Halaman III DIPA (RPD)** — jika ya, naik ke revisi DIPA Halaman III | Lampiran I Bagian 5 kode 5.d |
| C12 | Diajukan **sebelum 27 Desember** TA berkenaan | Pasal 24 ayat (11) huruf d; Lampiran I 5.d |

### 3.4 Constraint "Memperhatikan LHR APIP" — Hal Baru Perdirjen 7/2025

Perdirjen Renhan 3/2021 lama tidak secara eksplisit mengaitkan revisi POK dengan LHR APIP. **Perdirjen 7/2025 menambahkan syarat ini di Pasal 22 huruf b angka 2.**

Tafsir praktis:
- Setiap awal TA, Itjen Kasad/TNI mengeluarkan LHR atas RKA TNI AD yang masuk DIPA.
- LHR tersebut memuat catatan, rekomendasi, atau temuan yang harus diperhatikan dalam pelaksanaan anggaran, termasuk saat ada revisi POK.
- KPA Palembang **wajib mempertimbangkan** rekomendasi LHR APIP saat menetapkan revisi POK — meskipun revisi POK itu sendiri **tidak memerlukan reviu APIP baru** (reviu APIP baru hanya diperlukan untuk kasus Pasal 14 huruf b: revisi pagu berubah, antar-Program turunkan volume, reorganisasi, atau ada KRO/RO baru).

### 3.5 Tafsir Praktis "Akun Sama" untuk SIKESUMA

Rancangan awal: *"akun harus sama (52xxxxx hanya dengan 52xxxxx)."*

Perdirjen 7/2025 mempertegas — pergeseran diperbolehkan jika:
1. Jenis belanja sama (2 digit pertama: 52 ↔ 52)
2. KRO sama (untuk skema 5.a) atau RO sama (untuk 5.b, 5.c)
3. Kegiatan sama
4. Sumber dana sama
5. Volume RO tidak berubah

**Contoh kasus:**

| Kasus | Boleh sebagai Revisi POK KPA? | Alasan |
|---|---|---|
| 521211.01 (Obat) → 521211.02 (BMHP), dalam 1 RO | ✅ Boleh (skema 5.b atau 5.c) | Beda akun spesifik tapi 1 RO, jenis belanja 52 sama, sumber dana sama |
| 521211 (BEKKES) → 521813 (Persediaan Bahan Lainnya), dalam 1 KRO tapi beda RO | ✅ Boleh (skema 5.a) | Beda RO tapi 1 KRO, jenis belanja 52 sama |
| 521211 (Belanja Bahan, BEKKES) → 523122 (BMP, pemeliharaan) | ❌ Tidak | Beda jenis belanja (52 → 52 tapi beda KRO/RO besar kemungkinan); konvensi Sie Renbang "pengadaan ↔ pemeliharaan tidak boleh" sejalan dengan ini |
| 521211 → 532111 (Belanja Modal Peralatan) | ❌ Tidak | Beda jenis belanja (52 → 53) — bukan kewenangan KPA |

> **Per klarifikasi Sie Renbang Mei 2026:** Aturan internal "pengadaan ↔ pemeliharaan tidak boleh" adalah **konvensi praktis Sie Renbang Palembang**, bukan aturan tertulis. Aturan baku tetap mengikuti Perdirjen Renhan 7/2025 — yang dalam praktiknya menghasilkan kesimpulan yang sama (karena beda KRO/RO).

### 3.6 Mekanisme Pemutakhiran POK di Sistem Informasi (Pasal 22 huruf c–d)

```
Sie Renbang RS susun draft usulan
   ↓
Karumkit ACC internal (rekomendasi)
   ↓
Sie Renbang RS kirim ke satker pengelola Palembang
   ↓
Verifikasi Bagian Anggaran Palembang
   ↓
KPA Palembang menetapkan via SK Revisi POK (lihat Template di Section 13)
   ↓
KPA mengunggah usulan revisi POK ke Sistem Informasi (SAKTI)
   ↓
KPA memberikan persetujuan di Sistem Informasi
   ↓
Pemutakhiran POK efektif; data RKA Kemhan ter-update
```

---

## 4. Revisi Anggaran yang Mengakibatkan Perubahan DIPA (Pasal 23)

### 4.1 KPA Tetap Bisa, untuk Kategori Tertentu

Berbeda dengan kategori "Revisi POK murni Pasal 22" (tidak ubah DIPA), Perdirjen 7/2025 Pasal 23 memberi KPA kewenangan revisi **yang mengubah DIPA** untuk kategori tertentu, **selama dalam 1 Satker**:

| Kategori | Pasal | Catatan untuk RS Tk.IV |
|---|---|---|
| Pemenuhan Belanja Operasional, termasuk pagu minus belpeg op | Pasal 23 (1) huruf a angka 1 | Sering relevan untuk RS (gaji TKS, dst.) |
| Pemenuhan kebutuhan selisih kurs (non-PLN) | Pasal 23 (1) huruf a angka 2 | Jarang relevan |
| Pemanfaatan Sisa Anggaran Kontraktual / Swakelola | Pasal 23 (1) huruf a angka 3 | Relevan: sisa pengadaan obat/BMHP bisa dialihkan untuk RO yg sama atau lain |
| Ralat aplikasi / kode akun | Pasal 23 (1) huruf a angka 4–5 | Relevan saat ada salah input |
| Penyelesaian Tunggakan (RM/PNBP BLU) | Pasal 23 (1) huruf a angka 10 | Relevan untuk tunggakan rekanan |
| Pergeseran dalam 1 RO Prioritas Nasional | Pasal 23 (1) huruf a angka 11 | Jarang relevan untuk RS |

### 4.2 Mekanisme

| Cakupan | Penetap | Pengesahan |
|---|---|---|
| Dalam 1 Satker | **KPA** | **Kanwil DJPb** |
| Antar-Satker dalam 1 UO | **Kepala UO** (Kasad untuk TNI AD) | Kanwil DJPb |
| Antar-Satker antar-UO | **Kepala UO** + Dirjen Renhan | Dit. PA DJPb |

### 4.3 Koreksi atas Rancangan "Mid-Term Saja"

Rancangan awal: *"revisi pagu hanya akhir Juni / awal Juli."* Ini sudah dikoreksi di v1; pada v2 diperjelas: revisi pagu (baik yang ubah DIPA via Pasal 23, maupun yang ubah pagu via DJA) **boleh kapan saja** sepanjang TA, asal sebelum batas tahunan Pasal 24.

> **Per klarifikasi Sie Renbang Mei 2026:** Tidak ada Permenhan/Perkasad lain yang membatasi jendela waktu revisi non-BMP. Itu adalah **keputusan pimpinan** sebagai kebijakan pengelolaan internal. SIKESUMA harus **flexible** terhadap jendela waktu, tidak hardcoded.

---

## 5. Revisi POK vs Revisi DIPA vs Pemutakhiran POK

| Operasi | Cakupan | Otoritas | Pengesahan? |
|---|---|---|---|
| **Pemutakhiran POK** | Hanya rincian POK, tidak menyentuh Hal I/III/IV.B DIPA | KPA (Pasal 22) | Tidak |
| **Revisi DIPA dalam 1 Satker** (Pasal 23) | Ubah DIPA dalam kategori Pasal 23 ayat 1 huruf a | KPA mengusulkan | **Ya — Kanwil DJPb** |
| **Revisi DIPA Halaman III** | Ubah RPD bulanan | KPA (untuk pemutakhiran awal TW) atau Kanwil DJPb (di luar jendela) | Sesuai jenisnya |
| **Revisi DIPA Halaman I / IV.B** | Ubah pagu, sumber dana, RO | UO + Dirjen Renhan | **Ya — DJA atau Kanwil DJPb** |
| **Revisi Administrasi** | Ralat/koreksi tanpa anggaran | Sesuai kasus | Sesuai kasus |

---

## 6. Batas Waktu Tahunan (Pasal 24 Perdirjen Renhan 7/2025)

**Sumber utama:** Pasal 24 Perdirjen Renhan 7/2025 (lebih spesifik dan berbeda di beberapa tanggal dari Pasal 175 PMK 62/2023).

| Tanggal | Tujuan / Tipe Revisi | Sumber Pasal |
|---|---|---|
| **31 Januari** TA | Revisi lanjutan RMP DIPA TA sebelumnya untuk uang muka kontrak PLN | Pasal 24 (2) |
| **15 Februari** | Lanjutan SBSN TA sebelumnya untuk kontrak tahun tunggal | Pasal 24 (3) |
| **31 Maret** | Lanjutan SBSN / PLN / PDN TA sebelumnya untuk kontrak tahun jamak | Pasal 24 (4) |
| **7 April** | Penggunaan RO Cadangan ke DJA | Pasal 24 (5) |
| **29 Oktober** | **Batas internal Ditjen Renhan Kemhan untuk usulan ke DJA Kemenkeu** | Pasal 24 (1) huruf a |
| **31 Oktober** | SP SABA dari Sub BA BUN Belanja Lainnya ke BA Kemhan | Pasal 24 (6) |
| **30 November** | Revisi pada DJPb Kemenkeu; revisi kewenangan Kemhan yang ubah DIPA (kecuali pagu minus belpeg op); pergeseran BA Kemhan → Sub BA BUN | Pasal 24 (1) huruf b–c, (7) |
| **13 Desember** | **Batas internal Ditjen Renhan Kemhan** untuk Belpeg, PNBP, PLN/PDN/Hibah, sidkab, DPR/BPKP, SBSN rekomposisi/SAK, revisi info kinerja | Pasal 24 (8) |
| **15 Desember** | Pengesahan PNBP dari kelebihan realisasi target ke DJPb (1 Satker, 1 Program) | Pasal 24 (10) |
| **27 Desember** | Revisi persetujuan Menkeu / penanggulangan bencana / buka blokir di DJA; hibah non-Kuasa BUN / PLN-PHLN langsung & L/C / revisi administrasi / **pemutakhiran POK yang ubah Hal III DIPA** di DJPb | Pasal 24 (9), (11) |
| **27 Desember** | **Batas akhir pemutakhiran POK kewenangan KPA** (Lampiran I 5.d) | Lampiran I Bagian 5 |
| **31 Desember** | Penyelesaian pagu minus Belanja Pegawai | Pasal 24 (12) |

> **Catatan koreksi v1 → v2:**
> - v1 menulis batas pemutakhiran POK = **26 Desember** mengacu pedoman lama. **v2 dikoreksi ke 27 Desember** sesuai Pasal 24 ayat (11) huruf d dan Lampiran I Bagian 5 kode 5.d Perdirjen Renhan 7/2025.
> - v1 belum mencantumkan batas internal Ditjen Renhan **29 Oktober** dan **13 Desember**. v2 menambahkan keduanya sebagai *deadline-before-deadline* yang penting untuk RS sub-satker (karena ada chain Palembang → UO → Kemhan yang butuh waktu sebelum batas Kemenkeu).
>
> **Hari libur/cuti bersama:** Pasal 24 ayat (14) — jika batas akhir jatuh pada hari libur/cuti bersama, batas dimajukan ke hari kerja sebelumnya.
>
> **Konsekuensi lewat batas:** Pasal 24 ayat (15) — Dirjen Renhan **dapat tidak meneruskan** usulan yang lewat batas. Pengecualian hanya untuk direktif Presiden/prioritas mendesak (Pasal 27), dan butuh persetujuan Menteri Keuangan.

---

## 7. Detail Proses Revisi POK di SIKESUMA

### 7.1 Pengajuan

Sie Renbang RS membuat draft di SIKESUMA berisi:
- Daftar item yang diubah (nilai lama → nilai baru)
- Justifikasi naratif setiap perubahan
- Sumber dana, KRO, Kegiatan, RO, Komponen untuk tiap item
- Total penambahan dan pengurangan (validasi net change)
- **Referensi ke butir LHR APIP** yang relevan (sebagai bukti C8 terpenuhi)

### 7.2 Validasi Sistem (otomatis di SIKESUMA)

| # | Cek |
|---|---|
| V1 | Total penambahan = total pengurangan (net change = 0) |
| V2 | Setiap pasangan item dalam KRO sama (skema 5.a) atau RO sama (skema 5.b/5.c) |
| V3 | Setiap pasangan item dalam Kegiatan sama |
| V4 | Setiap pasangan item dalam Satker sama |
| V5 | Jenis belanja sama (2 digit pertama) |
| V6 | Sumber dana sama |
| V7 | Volume RO tidak berubah |
| V8 | Pagu akun setelah revisi tidak negatif |
| V9 | Realisasi akun sumber ≤ nilai setelah pengurangan |
| V10 | Tanggal pengajuan ≤ 27 Desember TA berkenaan |
| V11 | **Referensi LHR APIP** tercantum (boleh "tidak ada catatan relevan" sebagai opsi) |
| V12 | Deteksi otomatis: apakah revisi menyentuh akun yang ada di RPD bulanan → bila ya, tampilkan warning *"butuh revisi DIPA Halaman III, bukan pemutakhiran POK"* |

### 7.3 Workflow Persetujuan

```
Sie Renbang RS  (draft)
   ↓
Karumkit (rekomendasi internal)
   ↓
Pengiriman ke satker pengelola Palembang
   ↓
Bagian Anggaran Palembang (verifikasi)
   ↓
KPA Palembang (penetapan: SK Revisi POK — lihat Section 13)
   ↓
Operator SAKTI Palembang (unggah & persetujuan di Sistem Informasi)
   ↓
SIKESUMA sinkron: status "berlaku efektif" + snapshot pre/post
```

### 7.4 Efek Setelah Disetujui

- Berlaku sejak **tanggal penetapan KPA** (bukan otomatis bulan berikutnya).
- Item yang tidak diajukan tetap mengikuti POK terakhir.
- SIKESUMA menyimpan snapshot pre/post dan referensi nomor SK Revisi POK.

---

## 8. Detail Proses Revisi Pagu di SIKESUMA

### 8.1 Trigger dan Jendela

- Trigger: perintah resmi dari satuan atas (Kesdam/Aslog Kasad/Puskesad/Dirjen Renhan), bukan jadwal kalender.
- Admin Palembang mengaktifkan jendela revisi pagu di SIKESUMA dengan input dasar perintah (nomor surat).
- Sie Renbang RS menyusun draft (comprehensive atau parsial sesuai cakupan perintah).

### 8.2 Validasi dan Workflow

Mengikuti chain Pasal 23 atau Pasal 12–15 Perdirjen Renhan, tergantung kategori revisi. SIKESUMA hanya fasilitasi sampai level **usulan dari KPA Palembang**; eksekusi formal di SAKTI dilakukan oleh operator Palembang setelah ada surat pengesahan dari Kanwil DJPb / Dit. PA DJPb / DJA.

---

## 9. Integrasi Kedua Proses dalam Satu TA 2026

| Periode (contoh) | Aksi | Jenis | Penetap | Berlaku |
|---|---|---|---|---|
| 2 Jan | Baseline DIPA | DIPA awal | Menkeu (BUN) atas pengesahan PA | Januari |
| 8–17 Apr | Revisi DIPA Hal III TW II | RPD | KPA / Kanwil DJPb | TW II |
| Akhir Apr (contoh) | Revisi POK 5.a (geser antar-RO dlm 1 KRO) | Pagu tetap | KPA Palembang | Tgl penetapan |
| 8–17 Jul | Revisi DIPA Hal III TW III | RPD | KPA / Kanwil DJPb | TW III |
| Awal Sep (contoh) | Revisi Pagu Berubah (perintah Aslog Kasad) | Pagu berubah | DJA (via Dirjen Renhan) | Tgl pengesahan |
| 1–10 Okt | Revisi DIPA Hal III TW IV | RPD | KPA / Kanwil DJPb | TW IV |
| **29 Okt** | **Hard deadline internal** | — | — | Batas Ditjen Renhan ke DJA |
| **30 Nov** | Hard deadline | — | — | Batas DJPb |
| **13 Des** | Hard deadline internal | — | — | Batas Ditjen Renhan utk berbagai tema |
| **27 Des** | **Hard deadline** | — | — | **Batas pemutakhiran POK KPA** |
| **31 Des** | Hard deadline | — | — | Batas pagu minus Belpeg |

---

## 10. Ringkasan Koreksi Substantif (v1 → v2)

| # | Versi v1 | Koreksi v2 |
|---|---|---|
| 1 | Rujukan utama: PMK 62/2023 jo. PMK 107/2024 | Tetap, plus **Perdirjen Renhan 7/2025** sebagai *lex specialis* lingkungan Kemhan/TNI |
| 2 | Batas pemutakhiran POK = **26 Desember** | **27 Desember** (Pasal 24 ayat 11 huruf d) |
| 3 | Tidak ada batas internal Ditjen Renhan | Ditambah **29 Oktober** dan **13 Desember** sebagai batas internal |
| 4 | Constraint revisi POK = 10 hard constraint | **12 hard constraint** — tambah C8 (LHR APIP) dan C11 (Hal III DIPA) |
| 5 | Workflow generic "Karumkit → Palembang" | Workflow berjenjang formal **Satker → UO Asren Kasad → Kemhan Dirjen Renhan** sesuai Pasal 12–15 |
| 6 | Tidak ada template SK Revisi POK | **Section 13 BARU**: Template SK Revisi POK + matriks semula-menjadi + surat pengantar |
| 7 | "Pergeseran pengadaan ↔ pemeliharaan tidak boleh" sebagai aturan | Diklarifikasi: **konvensi praktis Sie Renbang**, bukan aturan tertulis (sejalan dengan Pasal 22 karena beda KRO/RO) |
| 8 | "Sub-satker" sebagai working term | Tetap, dengan penegasan bahwa istilah ini bukan istilah formal Perdirjen |
| 9 | Tidak ada referensi LHR APIP | LHR APIP eksplisit sebagai syarat C8 (Pasal 22 huruf b angka 2 — **hal baru di Perdirjen 7/2025**) |

---

## 11. Catatan untuk Implementasi SIKESUMA

1. **Master akun & item:** setiap item BAS harus tagged metadata: jenis belanja, KRO, Kegiatan, RO, Komponen, Sumber dana, dan **referensi ke butir LHR APIP** (opsional).
2. **Validasi 12-constraint (C1–C12):** dijalankan sebelum usulan dikirim ke Karumkit.
3. **Mekanisme aktivasi jendela revisi pagu:** flag oleh admin Palembang dengan input "dasar perintah satuan atas".
4. **Deteksi otomatis dampak ke RPD:** warning bahwa revisi POK perlu naik level menjadi revisi DIPA Halaman III.
5. **Audit trail per perubahan:** snapshot pre/post + nomor SK Revisi POK + tanggal penetapan KPA.
6. **Deadline tahunan:** soft warning H-7 dan hard block H-1 sebelum tanggal Pasal 24, **khususnya 27 Desember dan 13 Desember**.
7. **Snapshot per kondisi efektif:** per tanggal penetapan revisi.
8. **Integrasi dengan Sistem Informasi (SAKTI):** SIKESUMA bukan pengganti SAKTI. SIKESUMA menyiapkan dokumen usulan + lampiran agar operator SAKTI Palembang tinggal eksekusi.

---

## 12. Klarifikasi dari Sie Renbang RS Tk.IV Batin Tikal (Mei 2026)

Pertanyaan-pertanyaan yang dilontarkan di v1 telah dijawab oleh Sie Renbang. Berikut catatan resmi:

| # | Pertanyaan v1 | Jawaban Sie Renbang | Implikasi untuk v2 |
|---|---|---|---|
| 1 | Apakah ada Surat Edaran Aslog Kasad / Perkasad tentang tata cara revisi POK untuk satker kesehatan TNI AD? | **Ada — Perdirjen Renhan Kemhan No. 7 Tahun 2025** *(lampiran disertakan)* | Section 0, 3, 6 di-rewrite berbasis Perdirjen Renhan 7/2025 sebagai pedoman utama |
| 2 | Apakah Puskesad menerbitkan Juklak/Juknis pengelolaan keuangan RS Tk.IV? | **Tidak ada bukti Puskesad menerbitkan Juklak/Juknis khusus.** Regulasi keuangan RS TNI mengikuti Kemhan, Kemenkeu, Kemenkes — bukan dokumen internal Puskesad | Tidak ada lapis tambahan dari Puskesad yang perlu dirujuk |
| 3 | Apakah "pergeseran pengadaan ↔ pemeliharaan tidak boleh" sourcenya aturan tertulis atau konvensi? | **Konvensi praktis saja**, aturan baku ikut Pedoman (= Perdirjen Renhan 7/2025) | Section 3.5 mencatat bahwa konvensi ini sejalan dengan Pasal 22 karena beda KRO/RO |
| 4 | Bentuk SK Revisi POK yang dipakai — ada template? | **Belum ada template standar — minta dibuatkan sesuai pedoman** | **Section 13 BARU: Template SK Revisi POK** |
| 5 | Apakah ada Permenhan/Perkasad lain yang membatasi jendela waktu revisi non-BMP? | **Tidak ada** — itu keputusan pimpinan sebagai kebijakan pengelolaan | Section 4.3 mencatat: SIKESUMA harus flexible, jendela diset oleh admin Palembang |
| 6 | Status RS Batin Tikal sebagai Satkai berapa untuk BMP? | **BMP diatur oleh Tim TepBek**, RS hanya menggunakan sesuai kebutuhan | Glosarium G.10 menambahkan Tim TepBek; RS sebagai Satkai III secara teknis tetap berlaku (Permenhan 5/2020), tapi alokasi dilakukan tim eksternal |

### 12.1 Referensi Tambahan dari Sie Renbang — Layer Internal TNI AD

Sie Renbang juga mengarahkan ke peraturan Panglima TNI dan Kasad yang relevan untuk perencanaan anggaran (di luar lingkup revisi POK murni):

| Peraturan | Materi |
|---|---|
| **Perpang TNI No. 42 Tahun 2018** | Penyusunan rencana kerja di lingkungan TNI |
| **Kep Kasad No. Kep/511/VIII/2015** | Petunjuk administrasi perencanaan program & anggaran TNI AD |
| **Kep Kasad No. Kep/847/IX/2019** | Petunjuk teknis penyusunan dokumen rencana kerja TNI AD |
| **Kep Kasad No. Kep/900/XII/2021** | Petunjuk pelaksanaan program & anggaran TNI AD |

Catatan Sie Renbang: *"peraturan ini seharusnya juga mengacu pada Permenhan dan Perdirjen Renhan Kemhan."* Yakni: lapis TNI AD ini **subordinat** terhadap lapis Kemhan/Kemenkeu. Sudah dimasukkan ke Section 0 sebagai lapis internal.

### 12.2 Struktur Klasifikasi BAS RS Batin Tikal (Konfirmasi dari RKKS 2025)

Dari dokumen RKKS PNBP Satker Kesdam II/Sriwijaya TA 2025 (yang dilampirkan Sie Renbang), berhasil dikonfirmasi struktur klasifikasi BAS yang aktual untuk RS Tk.IV Batin Tikal. Ini menjadi **dataset baseline** untuk SIKESUMA dan referensi konkret untuk template SK Revisi POK di Section 13.

#### Identitas Anggaran

| Field | Nilai | Catatan |
|---|---|---|
| Kementerian/Lembaga | **012** | Kementerian Pertahanan |
| Unit Organisasi (UO) | **22** | Markas Besar TNI Angkatan Darat (UO TNI AD) |
| Unit Kerja (Satker) | **685784** | **Kesdam II/Sriwijaya** ← satker pengelola |
| Sub-Komponen | **F** | **Rumkit Tk.IV Batin Tikal Pangkal Pinang** ← RS Batin Tikal |
| Alokasi PNBP TA 2025 | Rp 987.995.000 | (BPJS ≈ Rp 770 jt + Yanmasum ≈ Rp 218 jt) |

#### Hierarki Klasifikasi yang Aktual Dipakai

```
Program 012.01.AC  PROGRAM PROFESIONALISME DAN KESEJAHTERAAN PRAJURIT
└── Kegiatan 6507  Penyelenggaraan Kesehatan Matra Darat
    ├── KRO CAB  Sarana Bidang Kesehatan
    │   ├── RO 1  Pengadaan Alat Kesehatan PNBP dan BLU
    │   │   └── Komponen 52
    │   │       └── Sub-Komponen F: RS Batin Tikal
    │   │           └── Akun 532111 Belanja Modal Peralatan dan Mesin
    │   └── RO 5  Pengadaan Alsintor Kesehatan PNBP dan BLU
    │       └── ... (struktur sama)
    ├── KRO CCB  OM Sarana Bidang Kesehatan
    │   └── RO 4  Pemeliharaan Gedung dan Bangunan Kesehatan PNBP dan BLU
    │       └── Komponen 3
    │           └── Sub-Komponen F: RS Batin Tikal
    │               └── Akun 523111 Belanja Pemeliharaan Gedung dan Bangunan
    └── KRO EBA  Layanan Dukungan Manajemen Internal
        └── RO 962  Layanan Umum
            └── Komponen 3 (Dukungan Operasional Pertahanan dan Keamanan)
                └── Sub-Komponen F: RS Batin Tikal (Rp 857.995.000)
                    ├── 521111  Belanja Keperluan Perkantoran          (Rp 15 jt)
                    ├── 521112  Belanja Pengadaan Bahan Makanan        (Rp 100 jt)
                    ├── 521115  Honor Operasional Satuan Kerja         (Rp 370 jt)
                    ├── 521119  Belanja Barang Operasional Lainnya    (Rp 15 jt)
                    ├── 521811  Belanja Barang Persediaan Konsumsi    (Rp 333 jt)
                    ├── 522112  Belanja Langganan Telpon              (Rp 10 jt)
                    ├── 523122  Beban BMP dan Pelumas Non Pertamina   (Rp 5 jt)
                    └── 524111  Beban Perjalanan Dinas Biasa          (Rp 10 jt)
```

#### Verifikasi Konformitas dengan CORRIGENDUM

Berdasarkan struktur RKKS 2025 ini, mapping kode BAS yang dipakai **konsisten** dengan CORRIGENDUM SIKESUMA-Audit-BAS:

| Item | Kode di RKKS 2025 | Status CORRIGENDUM |
|---|---|---|
| Bekal Kesehatan Pasien (BEKKES = obat + BMHP) | `521811` Belanja Barang Persediaan Konsumsi | ✅ Sesuai (bukan `521813`) |
| Honor Tenaga Lepas / Pengelola / Tenaga Kesehatan | `521115` Honor Operasional Satuan Kerja | ✅ Sesuai (semua di `521115`, sejalan dengan Koreksi 2) |
| BMP | `523122` Beban BMP dan Pelumas Non Pertamina | ✅ Sesuai (bukan bahan makanan pasien) |
| Makan Pasien | `521112` Belanja Pengadaan Bahan Makanan | ✅ Konsisten |
| Pemeliharaan Gedung | `523111` Belanja Pemeliharaan Gedung dan Bangunan | ✅ Konsisten |
| Pengadaan Alkes | `532111` Belanja Modal Peralatan dan Mesin | ✅ (Belanja modal 53 — bukan kewenangan KPA untuk revisi POK lintas dengan 52) |

#### Implikasi untuk Validasi Revisi POK

Karena struktur klasifikasi sudah dikonfirmasi, **constraint validasi di SIKESUMA bisa dipersempit lebih tegas:**

- Antara akun-akun di KRO **EBA / RO 962** (Layanan Umum): semua di Komponen 3, jenis belanja 52 dan 53 campuran → pergeseran 52↔52 (mis. 521111↔521119, atau 521115↔521119) **boleh**; lintas jenis belanja (mis. 521115↔523122 atau 521811↔532111) **tidak boleh sebagai revisi POK kewenangan KPA**.
- Antara KRO yang berbeda (mis. CAB ↔ EBA, atau CCB ↔ EBA): **tidak boleh sebagai revisi POK** (Pasal 22 huruf a angka 1 — harus dalam 1 KRO yang sama). Walaupun keduanya menyangkut RS Batin Tikal, beda KRO = beda kewenangan.
- Antara sub-komponen yang berbeda (mis. F → sub-komponen lain di Kesdam II/SWJ): **dalam 1 Satker yang sama** (685784) — secara teknis bisa, tapi praktis terbatas pada KRO yang sama.

#### Sumber Dana Aktual

Hanya **PNBP** yang muncul di RKKS 2025 ini (BPJS dan Yanmasum). **RM tidak ada di file RKKS PNBP ini** — kemungkinan dialokasikan terpisah di DIPA non-PNBP. SIKESUMA sebaiknya menampilkan kedua sumber dana terpisah agar tidak tertukar.

---

## 13. **Template SK Revisi POK** *(BARU di v2 — Permintaan Angga Q4; direvisi di v3)*

Template berikut disusun berdasarkan Pasal 22 Perdirjen Renhan 7/2025 dan format dokumen Lampiran II Perdirjen Renhan (khususnya format umum surat pemberitahuan & surat pernyataan), dengan konteks satker yang dikonfirmasi di Section 12.2.

**Catatan penggunaan:**
- Template ini dipakai oleh **KPA Kakesdam II/Sriwijaya** untuk menetapkan revisi POK murni (Pasal 22 — tidak mengubah DIPA).
- Untuk revisi yang ubah DIPA (Pasal 23), formatnya berbeda dan butuh **Surat Pemberitahuan Perubahan RKA** (Lampiran II Format 12 Perdirjen Renhan) plus pengesahan Kanwil DJPb.
- **Nama dan NRP KPA Kakesdam diinput manual** ke SIKESUMA per TA berkenaan (placeholder `<Nama Kakesdam>`, `<Pangkat/Korp/NRP>`).
- Format kop **Kesdam II/Sriwijaya sudah baku** (lihat RKKS 2025); format kop **RS Batin Tikal masih perlu dibuat** — proposal di Section 13.5.
- **Akses LHR APIP via Palembang**: Sie Renbang RS submit usulan dengan justifikasi naratif; Palembang yang verifikasi terhadap LHR APIP atas RKA TA berkenaan.

---

### 13.1 Surat Usulan Revisi POK (dari Karumkit ke KPA Kakesdam II/Sriwijaya)

```
[KOP RUMAH SAKIT Tk.IV 02.07.03 BATIN TIKAL — lihat Section 13.5]

                                            Pangkal Pinang, <tgl/bln/thn>

Nomor       : B/...../<bln-romawi>/<thn>/Sie Renbang
Klasifikasi : Biasa
Lampiran    : Satu Berkas
Hal         : Usulan Revisi Petunjuk Operasional Kegiatan
              TA <tahun anggaran>

Kepada Yth.
Kepala Kesehatan Daerah Militer II/Sriwijaya
selaku Kuasa Pengguna Anggaran Satker 685784
di Palembang

1.  Dasar:
    a. Peraturan Menteri Keuangan Nomor 62 Tahun 2023 tentang
       Perencanaan Anggaran, Pelaksanaan Anggaran, serta
       Akuntansi dan Pelaporan Keuangan sebagaimana telah
       diubah dengan PMK Nomor 107 Tahun 2024.
    b. Peraturan Direktur Jenderal Perencanaan Pertahanan
       Kementerian Pertahanan Nomor 7 Tahun 2025 tentang
       Tata Cara Revisi Anggaran di Lingkungan Kementerian
       Pertahanan dan Tentara Nasional Indonesia, khususnya
       Pasal 22 dan Lampiran I Bagian 5.
    c. DIPA Petikan Satker Kesdam II/Sriwijaya (685784)
       Nomor <nomor DIPA> tanggal <tgl> TA <tahun>.
    d. POK terakhir tanggal <tgl penetapan POK terakhir>.

2.  Sehubungan dengan adanya kebutuhan penyesuaian alokasi
    anggaran untuk pelaksanaan kegiatan operasional pada
    Rumkit Tk.IV 02.07.03 Batin Tikal Pangkal Pinang
    (sub-komponen F pada Satker 685784), dengan ini kami
    sampaikan usulan Revisi Petunjuk Operasional Kegiatan
    (POK) dengan rincian:

    a. Skema revisi   : <pilih: 5.a antar-RO dlm 1 KRO /
                       5.b dalam 1 RO / 5.c penambahan akun
                       dlm 1 RO / 5.e dalam 1 RO PN>
    b. Program        : 012.01.AC (Profesionalisme & Kese-
                       jahteraan Prajurit)
    c. Kegiatan       : 6507 (Penyelenggaraan Kesehatan
                       Matra Darat)
    d. KRO / RO       : <mis. EBA / RO 962 Layanan Umum>
    e. Sub-Komponen   : F (RS Batin Tikal)
    f. Jenis belanja  : <52/53> (tidak berubah)
    g. Sumber dana    : <PNBP-BPJS / PNBP-Yanmasum / RM>
                       (tidak berubah)
    h. Total nilai pergeseran: Rp <nominal> (net change = 0)
    i. Justifikasi    : <ringkas, mis. "menyesuaikan kebu-
                       tuhan obat IGD akibat lonjakan kunjun-
                       gan pasien BPJS TW II dengan menga-
                       lihkan dari sisa BMHP yang tidak
                       terpakai">

3.  Bersama ini kami lampirkan:
    a. Matriks Perubahan (Semula – Menjadi) sebagaimana
       terlampir;
    b. Surat Pernyataan Tanggung Jawab Karumkit;
    c. Data dukung lainnya bila ada.

4.  Untuk verifikasi atas Laporan Hasil Reviu (LHR) APIP
    Itjen Kasad atas RKA TA berkenaan sebagaimana
    dipersyaratkan Pasal 22 huruf b angka 2 Perdirjen Renhan
    Nomor 7 Tahun 2025, kami serahkan kepada Sie Renbang
    Kesdam II/Sriwijaya untuk dicek terhadap dokumen LHR
    yang berada di Palembang.

5.  Demikian usulan ini disampaikan, atas perkenan Bapak
    Kakesdam selaku Kuasa Pengguna Anggaran kami ucapkan
    terima kasih.


                          Kepala RS Tk.IV 02.07.03 Batin Tikal,

                          <ttd & stempel>

                          <Nama lengkap dengan gelar>
                          <Pangkat/Korp/NRP>


Tembusan:
1. Komandan Korem 045/Garuda Jaya (sebagai laporan);
2. Komandan Denkesyah <nomor> (sebagai laporan);
3. Arsip.
```

---

### 13.2 Lampiran: Matriks Perubahan (Semula – Menjadi)

```
[KOP RS Tk.IV 02.07.03 BATIN TIKAL]

MATRIKS PERUBAHAN POK — REVISI <nomor> TA <tahun>
Satker     : Kesdam II/Sriwijaya (685784)
Sub-Komp   : F (Rumkit Tk.IV 02.07.03 Batin Tikal)
Skema      : 5.b (Pergeseran dalam 1 RO)
Program    : 012.01.AC Profesionalisme dan Kesejahteraan Prajurit
Kegiatan   : 6507 Penyelenggaraan Kesehatan Matra Darat
KRO        : EBA Layanan Dukungan Manajemen Internal
RO         : 962 Layanan Umum
Komponen   : 3 Dukungan Operasional Pertahanan dan Keamanan
Sumber Dana: PNBP (BPJS) — tidak berubah
Jenis Belanja: 52 (Belanja Barang) — tidak berubah

┌────┬──────────┬───────────────────────────────────┬─────────────┬─────────────┬─────────────┐
│ No │ Akun     │ Uraian Akun & Sub-Item            │ Semula      │ Menjadi     │ Selisih     │
├────┼──────────┼───────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│  1 │ 521811   │ Belanja Persediaan — Bekal        │ 250.000.000 │ 220.000.000 │ -30.000.000 │
│    │          │ Kesehatan Pasien (BPJS)           │             │             │             │
│  2 │ 521115   │ Honor Operasional — Honor Tenaga  │ 150.000.000 │ 180.000.000 │ +30.000.000 │
│    │          │ Kesehatan (BPJS)                  │             │             │             │
│  3 │ 521112   │ Belanja Bahan Makanan — Makan     │  80.000.000 │  80.000.000 │           0 │
│    │          │ Pasien (BPJS) — tidak berubah     │             │             │             │
├────┴──────────┴───────────────────────────────────┼─────────────┼─────────────┼─────────────┤
│ TOTAL (akun 52 di KRO EBA / RO 962 / Komp 3 / Sub-F)│ 480.000.000 │ 480.000.000 │           0 │
└────────────────────────────────────────────────────┴─────────────┴─────────────┴─────────────┘

Catatan:
- Net change = 0 (sesuai Pasal 22 huruf b angka 1 Perdirjen Renhan 7/2025)
- Semua akun yang direvisi berada dalam:
  * 1 Satker yang sama (685784 Kesdam II/SWJ)
  * 1 KRO yang sama (EBA)
  * 1 RO yang sama (962)
  * 1 Komponen yang sama (3)
  * 1 Sub-Komponen yang sama (F)
  * 1 Jenis belanja yang sama (52)
  * 1 Sumber dana yang sama (PNBP-BPJS)
- Volume RO tidak berubah; Halaman III DIPA tidak berubah.

                                          Disusun oleh,
                                          Sie Renbang RS Tk.IV Batin Tikal,

                                          <ttd>
                                          <Nama, Pangkat/Korp/NRP>
```

---

### 13.3 SK Revisi POK (Ditetapkan oleh Kakesdam II/Sriwijaya selaku KPA)

```
KOMANDO DAERAH MILITER II/SRIWIJAYA
                KESEHATAN

KEPUTUSAN
KUASA PENGGUNA ANGGARAN
SATKER 685784 KESEHATAN DAERAH MILITER II/SRIWIJAYA
NOMOR: KEP/...../<bln-romawi>/<thn>

TENTANG

REVISI PETUNJUK OPERASIONAL KEGIATAN (POK)
PADA SUB-KOMPONEN F RUMKIT TK.IV 02.07.03 BATIN TIKAL
DAFTAR ISIAN PELAKSANAAN ANGGARAN
TAHUN ANGGARAN <tahun> NOMOR <nomor DIPA>

KEPALA KESEHATAN DAERAH MILITER II/SRIWIJAYA
SELAKU KUASA PENGGUNA ANGGARAN,

Menimbang :  a. bahwa untuk kelancaran pelaksanaan kegiatan
                operasional Rumkit Tk.IV 02.07.03 Batin
                Tikal Pangkal Pinang selaku sub-komponen F
                pada Satker 685784 Kesdam II/Sriwijaya,
                dipandang perlu melakukan penyesuaian
                alokasi anggaran pada Petunjuk Operasional
                Kegiatan;

             b. bahwa penyesuaian sebagaimana dimaksud dalam
                huruf a tidak mengubah pagu Satker, jenis
                belanja, sumber dana, satuan dan volume
                Rincian Output, serta tidak berdampak pada
                perubahan Daftar Isian Pelaksanaan Anggaran;

             c. bahwa berdasarkan pertimbangan sebagaimana
                dimaksud dalam huruf a dan huruf b, perlu
                menetapkan Keputusan Kuasa Pengguna Anggaran
                tentang Revisi Petunjuk Operasional Kegiatan.

Mengingat :  1. Undang-Undang Nomor 17 Tahun 2003 tentang
                Keuangan Negara;
             2. Undang-Undang Nomor 1 Tahun 2004 tentang
                Perbendaharaan Negara;
             3. Peraturan Menteri Keuangan Nomor 62 Tahun 2023
                tentang Perencanaan Anggaran, Pelaksanaan
                Anggaran, serta Akuntansi dan Pelaporan
                Keuangan sebagaimana telah diubah dengan PMK
                Nomor 107 Tahun 2024;
             4. Peraturan Menteri Keuangan Nomor 143/PMK.05/
                2018 tentang Mekanisme Pelaksanaan Anggaran
                Belanja Negara di Lingkungan Kementerian
                Pertahanan dan TNI;
             5. Peraturan Direktur Jenderal Perencanaan
                Pertahanan Kementerian Pertahanan Nomor 7
                Tahun 2025 tentang Tata Cara Revisi Anggaran
                di Lingkungan Kementerian Pertahanan dan
                Tentara Nasional Indonesia, khususnya Pasal
                22 dan Lampiran I Bagian 5;
             6. DIPA Petikan Satker 685784 Kesdam II/Sriwijaya
                Nomor <nomor DIPA> tanggal <tgl>;
             7. Surat usulan dari Karumkit RS Tk.IV 02.07.03
                Batin Tikal Pangkal Pinang Nomor
                B/...../<bln-romawi>/<thn> tanggal <tgl>.

Memperhatikan: Laporan Hasil Reviu (LHR) Aparat Pengawasan
               Intern Pemerintah Itjen Kasad atas Rencana
               Kerja dan Anggaran TNI Angkatan Darat TA
               <tahun> Nomor <nomor LHR> tanggal <tgl> *(atau:
               "tidak terdapat catatan LHR APIP yang relevan
               terhadap akun-akun yang direvisi sebagaimana
               telah diverifikasi oleh Sie Renbang Kesdam II/
               Sriwijaya")*.

                       MEMUTUSKAN:

Menetapkan :  KEPUTUSAN KUASA PENGGUNA ANGGARAN TENTANG
              REVISI PETUNJUK OPERASIONAL KEGIATAN PADA
              SUB-KOMPONEN F RUMKIT TK.IV 02.07.03 BATIN
              TIKAL TA <tahun>.

KESATU    :  Menetapkan Revisi Petunjuk Operasional Kegiatan
             (POK) pada Sub-Komponen F Rumkit Tk.IV 02.07.03
             Batin Tikal Pangkal Pinang dalam Satker 685784
             Kesdam II/Sriwijaya untuk TA <tahun>, dengan
             rincian sebagaimana tercantum dalam Lampiran
             Keputusan ini (Matriks Perubahan).

KEDUA     :  Revisi POK sebagaimana dimaksud dalam Diktum
             KESATU dilakukan berdasarkan skema:
             a. Skema     : <5.a / 5.b / 5.c / 5.e Lampiran I
                            Perdirjen Renhan 7/2025>
             b. Program   : 012.01.AC
             c. Kegiatan  : 6507 Penyelenggaraan Kesehatan
                            Matra Darat
             d. KRO       : <CAB / CCB / EBA>
             e. RO        : <kode & nama>
             f. Komponen  : <kode>
             g. Sub-Komp  : F (RS Batin Tikal)
             h. Jenis bel.: <kode> (tidak berubah)
             i. Sumber    : <PNBP-BPJS / PNBP-Yanmasum / RM>
                            (tidak berubah)
             j. Net change: Rp 0 (pagu Satker tetap)

KETIGA    :  Revisi POK ini:
             a. tidak mengubah sumber dana, pagu Satker,
                satuan dan volume Rincian Output, jenis
                belanja, sebagaimana dipersyaratkan Pasal 22
                huruf b angka 1 Perdirjen Renhan 7/2025;
             b. telah memperhatikan Laporan Hasil Reviu Itjen
                Kasad atas RKA TA berkenaan, sebagaimana
                dipersyaratkan Pasal 22 huruf b angka 2;
             c. tidak mengakibatkan perubahan Halaman III
                DIPA (Rencana Penarikan Dana).

KEEMPAT   :  Pemutakhiran data POK dilaksanakan oleh operator
             Sistem Informasi (SAKTI) pada Satker 685784
             Kesdam II/Sriwijaya sesuai mekanisme Pasal 22
             huruf c dan d Perdirjen Renhan 7/2025, dengan
             pengunggahan dan persetujuan oleh Kuasa Pengguna
             Anggaran melalui Sistem Informasi.

KELIMA    :  Karumkit RS Tk.IV 02.07.03 Batin Tikal Pangkal
             Pinang bertanggung jawab atas pelaksanaan POK
             hasil revisi ini, dan wajib melaporkan
             realisasinya dalam laporan periodik kepada
             Kuasa Pengguna Anggaran melalui Sie Renbang
             Kesdam II/Sriwijaya.

KEENAM    :  Keputusan ini berlaku sejak tanggal ditetapkan,
             dengan ketentuan bahwa realisasi anggaran yang
             telah dilakukan sebelum tanggal penetapan
             tidak terdampak oleh revisi ini (forward-
             looking).

                                  Ditetapkan di Palembang
                                  pada tanggal <tgl-bln-thn>

                                  KEPALA KESEHATAN DAERAH
                                  MILITER II/SRIWIJAYA
                                  SELAKU KUASA PENGGUNA
                                  ANGGARAN,


                                  <ttd & stempel>


                                  <Nama Kakesdam>          ← input manual
                                  <Pangkat/Korp/NRP>       ← input manual


Tembusan:
1. Panglima Kodam II/Sriwijaya (sebagai laporan);
2. Asren Kasad selaku Kepala UO TNI AD (sebagai laporan);
3. Inspektur Jenderal TNI AD (sebagai laporan);
4. Kepala Kanwil DJPb Provinsi Sumatera Selatan (sebagai
   bahan rekonsiliasi);
5. Komandan Korem 045/Garuda Jaya (sebagai informasi);
6. Karumkit RS Tk.IV 02.07.03 Batin Tikal Pangkal Pinang;
7. Arsip.
```

---

### 13.4 Surat Pernyataan Tanggung Jawab KPA (Lampiran SK)

Mengikuti Format 3 Lampiran II Perdirjen Renhan 7/2025 yang disesuaikan untuk konteks Revisi POK murni:

```
KOMANDO DAERAH MILITER II/SRIWIJAYA
                KESEHATAN

SURAT PERNYATAAN DAN TANGGUNG JAWAB

Yang bertanda tangan di bawah ini:

Nama        : <Nama Kakesdam>          ← input manual
Pangkat/NRP : <...>                     ← input manual
Jabatan     : Kepala Kesehatan Daerah Militer II/Sriwijaya
              selaku Kuasa Pengguna Anggaran Satker 685784

Menyatakan dengan sebenarnya bahwa:

1.  Saya menyetujui substansi usulan Revisi Petunjuk
    Operasional Kegiatan yang diusulkan oleh Karumkit
    Rumkit Tk.IV 02.07.03 Batin Tikal Pangkal Pinang
    selaku Sub-Komponen F pada Satker 685784, melalui
    surat Nomor <nomor> tanggal <tgl>, berupa pergeseran
    alokasi anggaran sebagaimana tercantum dalam Matriks
    Perubahan (terlampir).

2.  Usulan Revisi POK ini beserta dokumen yang dipersyaratkan
    telah disusun dengan lengkap dan benar, dan telah
    memperhatikan Laporan Hasil Reviu (LHR) Aparat Pengawasan
    Intern Pemerintah Itjen Kasad atas Rencana Kerja dan
    Anggaran TNI Angkatan Darat TA berkenaan, sesuai Pasal
    22 huruf b angka 2 Peraturan Direktur Jenderal
    Perencanaan Pertahanan Kementerian Pertahanan Nomor 7
    Tahun 2025. *(Verifikasi LHR APIP atas akun-akun yang
    direvisi telah dilakukan oleh Sie Renbang Kesdam II/
    Sriwijaya.)*

3.  Revisi POK ini:
    a. tidak mengubah sumber dana, pagu Satker, satuan dan
       volume Rincian Output, serta jenis belanja;
    b. tidak mengakibatkan perubahan Daftar Isian Pelaksanaan
       Anggaran termasuk Halaman III DIPA (Rencana Penarikan
       Dana).

4.  Saya bertanggung jawab atas kebenaran formil dan materiil
    terhadap segala sesuatu yang terkait dengan revisi
    anggaran ini, sesuai Pasal 28 Perdirjen Renhan Kemhan
    Nomor 7 Tahun 2025.

5.  Apabila di kemudian hari pernyataan ini ternyata tidak
    benar, saya bersedia bertanggung jawab sesuai ketentuan
    peraturan perundang-undangan.

Demikian Surat Pernyataan ini saya buat dengan sebenarnya.


                                Palembang, <tgl-bln-thn>


                                Kepala Kesehatan Daerah Militer
                                II/Sriwijaya selaku
                                Kuasa Pengguna Anggaran,



                                <(meterai cukup) ttd>


                                <Nama Kakesdam>          ← input manual
                                <Pangkat/Korp/NRP>       ← input manual
```

---

### 13.5 Template Kop Surat untuk RS Tk.IV 02.07.03 Batin Tikal *(BARU di v3)*

Per klarifikasi Sie Renbang, **RS Batin Tikal belum memiliki kop surat baku**. Berikut proposal format kop yang konsisten dengan struktur organisasi TNI AD (Kemhan → TNI AD → Kodam II/Sriwijaya → Kesdam II/SWJ → Denkesyah → RS Tk.IV) dan format kop yang dipakai di RKKS 2025.

**Versi A — Kop Lengkap (untuk surat-surat resmi keluar):**

```
                  TENTARA NASIONAL INDONESIA
                       MARKAS BESAR
                  ANGKATAN DARAT KESEHATAN
              KOMANDO DAERAH MILITER II/SRIWIJAYA
                  DETASEMEN KESEHATAN WILAYAH <nomor>
              RUMAH SAKIT TINGKAT IV 02.07.03 BATIN TIKAL
                Jl. <alamat>, Pangkal Pinang
                Telp: <...> | Email: <...>
                          ═══════════════
```

**Versi B — Kop Singkat (untuk dokumen internal seperti Matriks Perubahan):**

```
KOMANDO DAERAH MILITER II/SRIWIJAYA
       KESEHATAN
RS TK.IV 02.07.03 BATIN TIKAL
═══════════════════════════════════
```

**Catatan implementasi:**
- Versi A perlu mencantumkan **nomor Denkesyah** yang membina RS Batin Tikal — mohon dikonfirmasi ke Sie Renbang Palembang.
- Format ini **proposal**, perlu validasi dengan format kop standar yang dipakai Kesdam II/Sriwijaya untuk satuan jajarannya. Jika Kesdam II/SWJ punya pedoman naskah dinas internal, format itu lebih diutamakan.
- Penggunaan logo/simbol: TNI AD standar di sisi kiri, opsional logo RS di sisi kanan.
- Font: gunakan font baku TNI (umumnya Arial atau Times New Roman, size 10–12 untuk kop).
- Pemisah: garis horizontal di bawah kop, sesuai ketentuan tata naskah dinas TNI.

---

## 14. Hal yang Masih Perlu Dikonfirmasi (v3)

Item-item berikut sudah **diselesaikan di v3** dan dihapus dari daftar:
- ~~Format kop & nomenklatur jabatan di Kesdam II/Sriwijaya~~ → Kop sudah ada di RKKS 2025, tinggal RS Batin Tikal yang perlu kop sendiri (Section 13.5).
- ~~Nomor DIPA dan KPA aktif Palembang~~ → KPA = **Kakesdam II/Sriwijaya**, nama & NRP **diinput manual** ke SIKESUMA per TA. Nomor DIPA diambil dari DIPA Petikan tahun berjalan.
- ~~Akses LHR APIP~~ → Akses **via Palembang**: RS submit usulan, Sie Renbang Kesdam II/SWJ yang verifikasi terhadap LHR.
- ~~Definisi Tim TepBek~~ → **Di luar scope RS Tk.IV Batin Tikal** (beroperasi di tingkat Korem).
- ~~Periodisasi LHR APIP~~ → **Di luar scope RS** (ranah Sie Renbang Palembang).

### Item yang masih open:

| # | Item | Catatan |
|---|---|---|
| 1 | **Format kop RS Batin Tikal** (Section 13.5) — Versi A vs Versi B, dan nomor Denkesyah pembina | Perlu validasi dari Karumkit dan/atau Sie Renbang Palembang |
| 2 | **Nomor DIPA Petikan Satker 685784 TA 2026** | Akan terisi otomatis setelah DIPA TA 2026 diterbitkan; sementara pakai placeholder |
| 3 | **Nama dan NRP Kakesdam II/Sriwijaya aktif** | Input manual ke SIKESUMA, perlu mekanisme update jika ada pergantian jabatan |
| 4 | **Komponen RM di luar PNBP** | RKKS 2025 yang dilampirkan hanya berisi PNBP (BPJS + Yanmasum) total Rp 987,99 jt. Untuk gambaran komprehensif Rumkit, perlu DIPA RM (yang biasanya untuk gaji TNI organik & operasional dasar) — bila ada |
| 5 | **Apakah RS Batin Tikal akan menjadi Satker mandiri** dalam TA 2026/2027? | Akan mengubah workflow dan template SK secara substansial bila terjadi |

---

**Akhir dokumen.**
