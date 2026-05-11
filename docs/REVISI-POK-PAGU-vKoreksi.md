# Uraian Final Proses Revisi POK dan Revisi Pagu di Aplikasi SIKESUMA TA 2026

**Versi:** Koreksi v1 (mengakomodasi dasar hukum yang berlaku)
**Konteks Satker:** RS Tk.IV 02.07.03 Batin Tikal — **sub-satker** di bawah satker pengelola Palembang (belum satker mandiri/KPA).
**Tanggal Penyusunan:** Mei 2026

---

## Glosarium

Glosarium ini bertujuan menyamakan tafsir antara seluruh stakeholder dokumen (Sie Renbang RS Batin Tikal, Karumkit, satker pengelola Palembang, developer SIKESUMA, auditor) agar tidak terjadi bias atau salah pengertian saat dokumen ini dijadikan acuan implementasi.

Definisi formal mengacu pada PMK 62/2023 jo. PMK 107/2024, PMK 199/PMK.02/2021 (untuk pasal yang masih dipakai sebagai rujukan praktis), PER-9/PB/2023, dan KEP-331/PB/2021 jo. KEP-291/PB/2022. Istilah kerja (*working terms*) yang dipakai dalam dokumen ini tetapi tidak ada dalam regulasi formal diberi tanda **\[istilah kerja\]** dengan penjelasan tafsirnya.

### G.1 Penganggaran Umum

| Istilah | Definisi |
|---|---|
| **APBN** | Anggaran Pendapatan dan Belanja Negara. Rencana keuangan tahunan pemerintah pusat yang ditetapkan dengan undang-undang. |
| **APBN-P** | APBN Perubahan. APBN yang diubah di tengah TA atas persetujuan DPR. |
| **ABT** | Anggaran Belanja Tambahan. Penambahan pagu yang bersumber dari APBN-P atau perintah Menteri Keuangan. |
| **TA** | Tahun Anggaran. Periode 1 Januari – 31 Desember. |
| **APIP K/L** | Aparat Pengawasan Intern Pemerintah Kementerian/Lembaga. Inspektorat Jenderal K/L. Untuk Kemhan/TNI: Itjen Kemhan dan Itjen TNI. |
| **LKKL** | Laporan Keuangan Kementerian/Lembaga. Laporan tahunan keuangan K/L. |
| **LKPP** | Laporan Keuangan Pemerintah Pusat. Konsolidasi LKKL nasional. |
| **IKPA** | Indikator Kinerja Pelaksanaan Anggaran. Sistem penilaian kinerja satker oleh Kemenkeu (12 indikator, salah satunya Capaian Output). |

### G.2 Struktur Klasifikasi Anggaran (BAS)

Hierarki dari paling luas ke paling spesifik:

| Istilah | Definisi |
|---|---|
| **BAS** | Bagan Akun Standar. Sistem kodefikasi seluruh segmen akun pemerintah pusat. Saat ini diatur dalam KEP-211/PB/2018 jo. KEP-331/PB/2021 dan KEP-291/PB/2022. |
| **Program** | Penjabaran kebijakan K/L untuk mencapai sasaran strategis. Setiap K/L memiliki beberapa Program. |
| **Kegiatan** | Bagian dari Program; aktivitas K/L yang dilaksanakan satker untuk menghasilkan output. |
| **KRO** | Klasifikasi Rincian Output. Kategori jenis output Kegiatan (mis. *Layanan Perkantoran*, *Layanan Kesehatan*). Diberi kode huruf 3 karakter (mis. EBA, EBB). |
| **RO** | Rincian Output. Output spesifik di bawah KRO; punya **volume** dan **satuan** yang tertulis di DIPA. |
| **Komponen** | Tahapan/jenis pengeluaran di dalam RO. Khusus untuk Layanan Perkantoran: **001** = Belanja Pegawai (gaji & tunjangan), **002** = Operasional dan Pemeliharaan Kantor. |
| **Sub-Komponen** | Pengelompokan tahapan di dalam Komponen (jarang relevan untuk RS). |
| **Akun** | Kode 6 digit untuk klasifikasi rinci jenis pengeluaran/penerimaan (mis. `521211` Belanja Bahan, `521811` Belanja Barang Persediaan Konsumsi). |

**Disambiguasi penting:**
- "Akun" dalam percakapan sehari-hari di RS sering merujuk ke 2 digit pertama (51/52/53). Dalam dokumen ini, "akun" = **kode 6 digit penuh**, dan 2 digit pertama disebut **"jenis belanja"**.
- "Komponen" **bukan** sinonim "Kegiatan" atau "RO". Komponen adalah level di bawah RO.

### G.3 Jenis Belanja

Klasifikasi yang ditentukan dari 2 digit pertama kode akun. **Tidak boleh dilintasi** dalam revisi POK kewenangan KPA.

| Kode | Jenis Belanja | Karakteristik |
|---|---|---|
| **51** | Belanja Pegawai | Gaji, tunjangan melekat, honor operasional satker (mis. 5111xx, 5112xx, 5114xx, 521115 honor TKS flat) |
| **52** | Belanja Barang | Belanja barang habis pakai, jasa, perjalanan, pemeliharaan barang (5211 operasional, 5212 non-operasional, 5218 persediaan, 5219 BLU, 5221 jasa, 5231 pemeliharaan, 5241 perjalanan) |
| **53** | Belanja Modal | Pengadaan aset tetap dengan masa manfaat >1 tahun di atas nilai kapitalisasi (5311 tanah, 5321 peralatan & mesin, 5331 gedung & bangunan, 5341 jalan/jembatan, 5361 BLU modal) |
| **57** | Belanja Bantuan Sosial | Tidak relevan untuk RS Tk.IV |

**Catatan:** Kode akun spesifik untuk RS Tk.IV Batin Tikal mengacu pada SSOT BAS yang sudah divalidasi di project ini (lihat `SIKESUMA-Audit-BAS-Konformitas-CORRIGENDUM.md`).

### G.4 Sumber Dana

Klasifikasi yang **tidak boleh diubah** dalam revisi POK kewenangan KPA.

| Kode/Nama | Definisi |
|---|---|
| **RM** | Rupiah Murni. Pendanaan dari APBN murni (pajak, penerimaan negara umum). |
| **PNBP** | Penerimaan Negara Bukan Pajak. Pendapatan satker dari layanan (untuk RS militer: pelayanan Yanmasum, BPJS yang masuk PNBP). |
| **PHLN** | Pinjaman/Hibah Luar Negeri. |
| **HLN** | Hibah Luar Negeri (langsung). |
| **PDN** | Pinjaman Dalam Negeri. |
| **SBSN** | Surat Berharga Syariah Negara. |
| **BLU** | Pendapatan Badan Layanan Umum (untuk satker yang statusnya BLU; RS Batin Tikal **bukan BLU**). |

### G.5 Dokumen Anggaran

| Istilah | Definisi |
|---|---|
| **RKA-K/L** | Rencana Kerja dan Anggaran Kementerian/Lembaga. Dokumen perencanaan tahunan K/L yang disusun saat penelaahan dengan DJA. |
| **DIPA** | Daftar Isian Pelaksanaan Anggaran. Dokumen otorisasi pengeluaran negara yang disahkan Menkeu sebagai BUN, berdasarkan RKA-K/L. **Anggaran dalam DIPA adalah batas pengeluaran tertinggi**. |
| **DIPA Petikan** | DIPA per Satker (vs DIPA Induk per Eselon I/K/L). |
| **Halaman I DIPA** | Rincian alokasi per Program, Kegiatan, KRO, RO, dan jenis belanja. Perubahan = revisi DIPA Halaman I. |
| **Halaman III DIPA** | **Rencana Penarikan Dana (RPD) bulanan** per jenis belanja. Diisi awal TA, dapat dimutakhirkan per triwulan. |
| **Halaman IV DIPA** | Catatan/keterangan: blokir, pagu khusus, target PNBP. **Halaman IV.B** = catatan PNBP. |
| **POK** | Petunjuk Operasional Kegiatan. Penjabaran detail DIPA per akun 6 digit dan sub-item, sebagai pedoman pelaksanaan untuk PPK. **POK adalah lampiran/turunan DIPA**, bukan dokumen yang berdiri sendiri. |
| **RPD** | Rencana Penarikan Dana. Jadwal bulanan rencana pencairan SP2D yang tercatat di Halaman III DIPA. |
| **ADK** | Arsip Data Komputer. File RKA-K/L hasil aplikasi (SAKTI/SAS) yang disampaikan saat usulan revisi. |
| **LRA** | Laporan Realisasi Anggaran. Laporan periodik perbandingan pagu vs realisasi. |

### G.6 Otoritas dan Lembaga

| Istilah | Definisi |
|---|---|
| **PA** | Pengguna Anggaran. Menteri/Pimpinan Lembaga. Untuk RS TNI AD: Menteri Pertahanan. |
| **PPA BUN** | Pembantu Pengguna Anggaran BUN. |
| **KPA** | Kuasa Pengguna Anggaran. Pejabat di **satker** yang diberi kuasa oleh PA untuk melaksanakan anggaran satker. **Untuk RS Batin Tikal yang sub-satker: KPA bukan Karumkit, melainkan pejabat di satker pengelola Palembang.** |
| **PPK** | Pejabat Pembuat Komitmen. Pejabat yang melakukan komitmen pengadaan barang/jasa dan mengesahkan tagihan. Di sub-satker RS, fungsi PPK bisa di-delegasi ke pejabat RS dengan SK KPA. |
| **PPSPM** | Pejabat Penanda Tangan Surat Perintah Membayar. |
| **Bendahara Pengeluaran** | Pejabat yang mengelola UP/TUP satker dan membayar tagihan. |
| **DJA** | Direktorat Jenderal Anggaran (Kemenkeu). Penetap revisi yang memerlukan penelaahan. |
| **DJPb** | Direktorat Jenderal Perbendaharaan (Kemenkeu). Penetap revisi pengesahan dan pelaksana SPM/SP2D. |
| **Dit. PA DJPb** | Direktorat Pelaksanaan Anggaran DJPb. Tingkat pusat. |
| **Kanwil DJPb** | Kantor Wilayah DJPb di tingkat provinsi. |
| **KPPN** | Kantor Pelayanan Perbendaharaan Negara. Unit DJPb tingkat kota; menerbitkan SP2D atas SPM yang diajukan satker. |
| **BUN** | Bendahara Umum Negara. Menteri Keuangan. |

### G.7 Jenis Revisi (Klasifikasi PMK)

| Istilah | Definisi |
|---|---|
| **Revisi Anggaran** | Perubahan RKA berupa penyesuaian rincian anggaran dan/atau informasi kinerja, termasuk revisi DIPA yang telah disahkan pada TA berkenaan. (PMK 62/2023 Pasal 1) |
| **Revisi dalam hal Pagu Berubah** | Revisi yang mengubah total pagu satker (penambahan atau pengurangan). Bukan kewenangan KPA. |
| **Revisi dalam hal Pagu Tetap** | Revisi pergeseran rincian tanpa mengubah total pagu satker. Kewenangan tergantung cakupan: DJA / Kanwil DJPb / KPA. |
| **Revisi POK** | Revisi rincian POK kewenangan KPA. Sub-kategori dari "Pagu Tetap". Batasan: 1 KRO, 1 Kegiatan, 1 Satker, tidak mengubah volume RO/jenis belanja/sumber dana. (PMK 199/2021 Pasal 6(4), substansi dipertahankan PMK 62/2023). |
| **Pemutakhiran POK** | Pencatatan revisi POK kewenangan KPA ke aplikasi SAKTI. **Berbeda dengan revisi DIPA**: pemutakhiran POK tidak memerlukan pengesahan Kanwil DJPb selama tidak menyentuh Halaman III DIPA. |
| **Revisi DIPA Halaman III** | Revisi RPD bulanan. Dilakukan per triwulan (jendela TW II, III, IV) sebagai pemutakhiran KPA; di luar jendela tersebut harus melalui Kanwil DJPb. |
| **Revisi Administrasi** | Perbaikan rumusan, nomenklatur, kode tanpa dampak anggaran (mis. perubahan nama satker, koreksi kode KPPN). |
| **Pagu Tetap** | Kondisi di mana total pagu satker tidak berubah meskipun ada pergeseran internal. |
| **Pagu Berubah** | Kondisi di mana total pagu satker bertambah atau berkurang. |
| **\[Istilah kerja\]** **Tambah Pagu** | Sebutan internal RS untuk revisi pagu berubah yang menambah total. Tidak ada di PMK; istilah PMK adalah "Revisi Anggaran dalam hal Pagu Berubah berupa Penambahan Pagu". |
| **\[Istilah kerja\]** **Revisi Pagu (mid-term)** | Sebutan dalam draf awal dokumen ini untuk revisi pagu yang biasa dilakukan trimester 3. **Bukan istilah PMK.** Lihat Bagian 4 untuk koreksi tafsir. |

### G.8 Konsep & Praktik Operasional

| Istilah | Definisi |
|---|---|
| **Refocusing** | Pengalihan anggaran besar-besaran berdasarkan perintah pemerintah (mis. saat COVID-19, atau kebijakan automatic adjustment). |
| **Automatic Adjustment** | Penyesuaian otomatis: pemotongan/blokir sebagian pagu di awal TA yang dapat dicairkan sesuai keputusan kemudian. |
| **Penelaahan** | Proses review usulan revisi oleh DJA sebelum penetapan, untuk memastikan kesesuaian dengan kebijakan dan dokumen. |
| **Reviu APIP** | Review oleh Itjen K/L atas usulan revisi tertentu sebelum diajukan ke DJA. |
| **Pagu Minus** | Kondisi di mana realisasi sudah melebihi pagu (terutama belanja pegawai). Wajib diselesaikan dengan revisi sebelum 31 Desember. |
| **Pemblokiran** | Status pagu yang ada di DIPA tapi tidak dapat dicairkan sampai persyaratan dipenuhi. |
| **Carry-Over** | Kegiatan TA sebelumnya yang dilanjutkan dengan pendanaan TA berjalan (umumnya PHLN, SBSN, hibah). |
| **RO Prioritas Nasional (RO PN)** | RO yang ditetapkan sebagai prioritas Bappenas. Memiliki batasan khusus dalam revisi. |
| **RO Cadangan** | RO yang dialokasikan tetapi penggunaannya menunggu keputusan kebijakan. |
| **\[Istilah kerja\]** **Net Change 0** | Tafsir praktis "Pagu Tetap" di SIKESUMA: jumlah penambahan akun = jumlah pengurangan akun dalam satu pengajuan revisi POK. |
| **\[Istilah kerja\]** **Forward-Looking** | Tafsir praktis bahwa revisi yang disahkan tidak mengubah realisasi yang sudah terjadi sebelum tanggal penetapan, hanya berlaku untuk pengeluaran setelahnya. |
| **\[Istilah kerja\]** **Snapshot POK** | Penyimpanan kondisi POK efektif per tanggal tertentu di SIKESUMA, untuk audit trail. Bukan istilah PMK. |

### G.9 Sistem dan Dokumen Pencairan

| Istilah | Definisi |
|---|---|
| **SAKTI** | Sistem Aplikasi Keuangan Tingkat Instansi. Aplikasi Kemenkeu untuk seluruh proses anggaran satker (penganggaran, komitmen, pembayaran, akuntansi). Single source of truth pemerintah. |
| **SIKESUMA** | Sistem Informasi Keuangan & Manajemen RS — aplikasi internal RS Batin Tikal (v3.1) yang dikelola Sie Renbang. **Bukan pengganti SAKTI**, melainkan layer operasional di atas SAKTI untuk kebutuhan harian RS. |
| **SPM** | Surat Perintah Membayar. Dokumen permintaan pencairan dari satker ke KPPN. |
| **SP2D** | Surat Perintah Pencairan Dana. Dokumen yang diterbitkan KPPN sebagai bukti pencairan SPM (bukti pembayaran final). |
| **SPHL / SP2HL** | Surat Pengesahan Hibah Langsung / Surat Perintah Pengesahan. Dokumen pengesahan transaksi hibah. |
| **SBM** | Standar Biaya Masukan. PMK tahunan yang menetapkan batas harga satuan (mis. honor, perjalanan dinas). |
| **SBK** | Standar Biaya Keluaran. Standar biaya per unit output tertentu. |
| **UP / TUP** | Uang Persediaan / Tambahan Uang Persediaan. Dana yang dipegang bendahara untuk operasional. |
| **GUP / PTUP** | Ganti Uang Persediaan / Pertanggungjawaban TUP. Mekanisme penggantian/pertanggungjawaban UP/TUP. |

### G.10 Konteks Satker TNI AD

| Istilah | Definisi |
|---|---|
| **Satker** | Satuan Kerja. Unit organisasi K/L yang **memiliki KPA** dan menerima DIPA Petikan. |
| **Satker mandiri** | \[Istilah praktis\] Satker yang memiliki DIPA Petikan sendiri dan KPA-nya pejabat di unit itu. |
| **\[Istilah kerja\]** **Sub-satker** | Unit operasional yang **belum** memiliki DIPA Petikan/KPA sendiri, sehingga anggaran dan otoritas tetap pada satker induk/pengelola. **Bukan istilah formal PMK** — istilah ini dipakai di dokumen ini untuk merujuk pada status RS Batin Tikal saat ini. |
| **\[Istilah kerja\]** **Satker pengelola** / **Satker induk** | Satker yang memegang DIPA dan KPA untuk sub-satker di bawahnya. Untuk RS Batin Tikal: satker pengelola berkedudukan di Palembang. |
| **Karumkit** | Kepala Rumah Sakit. Pimpinan tertinggi di RS militer. **Untuk RS sub-satker, Karumkit bukan KPA** — hanya pemberi rekomendasi internal. |
| **Wakarumkit** | Wakil Kepala Rumah Sakit. |
| **Kesad / Puskesad** | Pusat Kesehatan Angkatan Darat. Eselon pusat untuk pembinaan kesehatan TNI AD. |
| **Kesdam** | Kesehatan Daerah Militer. Cabang kesehatan di tingkat Kodam (mis. Kesdam II/Sriwijaya untuk wilayah Sumatera bagian Selatan). |
| **Denkesyah** | Detasemen Kesehatan Wilayah. Cabang Kesdam di bawah Korem; membawahi rumah sakit Tk.III, Tk.IV, rumkitban di wilayahnya. |
| **Denkeslap** | Detasemen Kesehatan Lapangan. |
| **RS Tk.II / Tk.III / Tk.IV** | Klasifikasi rumah sakit militer berdasarkan kapasitas dan tingkat layanan. RS Tk.II terbesar (level kodam), Tk.IV paling kecil (level denkesyah). |
| **Rumkitban** | Rumah Sakit Bantuan. Lebih kecil dari RS Tk.IV. |
| **Aslog Kasad** | Asisten Logistik Kepala Staf Angkatan Darat. Penerbit Surat Edaran tentang pengelolaan logistik & keuangan TNI AD. |
| **Sie Renbang** | Seksi Perencanaan dan Pengembangan. Unit di RS yang menyusun RKKS dan mengelola revisi. |
| **Sie Renprogar** | Seksi Perencanaan dan Program Anggaran (varian nomenklatur). |
| **RKKS** | Rencana Kerja Kegiatan Satuan (atau: Satker). Dokumen perencanaan internal RS yang menjadi turunan POK. |
| **Perkasad** | Peraturan Kepala Staf Angkatan Darat. Lapis aturan internal TNI AD. |
| **Permenhan** | Peraturan Menteri Pertahanan. Lapis aturan Kemhan, di bawah PMK Kemenkeu untuk hal-hal teknis pelaksanaan di lingkungan Kemhan/TNI. |
| **UO** | Unit Organisasi. Tingkatan organisasi pengelolaan program dan anggaran di lingkungan Kemhan/TNI: UO Kemhan, UO Mabes TNI, UO TNI AD, UO TNI AL, UO TNI AU. (Permenhan 5/2020 Pasal 1 angka 17) |
| **Satkai I** | Satuan Pemakai BMP tingkat I. Pelaksana tingkat pusat/eselon I; penerima Surat Alokasi BMP dan/atau penerbit Surat Perintah Penyaluran BMP. (Permenhan 5/2020 Pasal 1 angka 14) |
| **Satkai II** | Satuan Pemakai BMP tingkat II. Pelaksana tingkat Komando Utama/wilayah; penerima Surat Perintah Penyaluran BMP dan/atau penerbit Surat Perintah Pelaksanaan Pengambilan BMP. (Permenhan 5/2020 Pasal 1 angka 15) |
| **Satkai III** | Satuan Pemakai BMP tingkat III. Pelaksana tingkat satker/sub-satker; penerima Surat Perintah Pelaksanaan Pengambilan BMP. **RS Tk.IV biasanya berperan sebagai Satkai III untuk BMP-nya.** (Permenhan 5/2020 Pasal 1 angka 16) |
| **PB-221** | Paktur Bon 221. Dokumen bukti pengambilan BMP bulanan oleh Satkai III, dipakai untuk Coklit (Pencocokan dan Penelitian) dengan penyedia jasa BMP. (Permenhan 5/2020 Pasal 1 angka 13) |
| **Alpalhankam** | Alat Peralatan Pertahanan dan Keamanan. Segala alat perlengkapan untuk mendukung pertahanan negara serta keamanan dan ketertiban negara. Untuk RS Tk.IV umumnya tidak relevan kecuali ada kendaraan dinas militer. (Permenhan 5/2020 Pasal 1 angka 21) |
| **SIMAK-BMN** | Sistem Informasi Manajemen dan Akuntansi Barang Milik Negara. Aplikasi pencatatan BMN, termasuk pencatatan persediaan BMP. |

### G.11 Istilah Operasional RS (Konteks SIKESUMA)

Istilah ini muncul di project knowledge SIKESUMA dan relevan untuk integrasi sistem.

| Istilah | Definisi |
|---|---|
| **BEKKES** | Perbekalan Kesehatan. Kategori belanja untuk obat, BMHP, gas medis, reagen lab. Akun rujukan: `521811` (Belanja Barang Persediaan Konsumsi) — bukan `521813` (lihat CORRIGENDUM). |
| **BMHP** | Bahan Medis Habis Pakai. Akun rujukan: `521811`. |
| **BMP** | **Bahan Bakar Minyak dan Pelumas** (definisi resmi Permenhan No. 5 Tahun 2020 Pasal 1 angka 1). Mencakup hasil minyak bumi/nabati sebagai bahan bakar, minyak mesin, pelumas, dan senyawa lain — contoh: Avgas, Avtur, Premium, Pertamax, Minyak Tanah, Solar/HSD, MDF, MFO. **Untuk RS Tk.IV Batin Tikal:** BBM untuk kendaraan operasional (ambulans, mobil dinas, genset cadangan). Akun rujukan: **`523122`** (Belanja Pemeliharaan: BMP dan Pelumas Khusus Non Pertamina, pendekatan beban langsung) atau `523125` (versi persediaan, jika ada stockopname tangki). **BUKAN bahan makanan** — lihat entry "Bahan Makanan Pasien" untuk perbedaannya. |
| **Bahan Makanan Pasien** | Pengadaan bahan makanan untuk pasien rawat inap. Bukan disingkat "BMP" — itu akronim resmi untuk bahan bakar. Akun rujukan: **`521112`** (Belanja Pengadaan Bahan Makanan) per KEP-331/PB/2021. |
| **BPJS** | Badan Penyelenggara Jaminan Sosial Kesehatan. Sumber klaim pelayanan pasien. |
| **Yanmas / Yanmasum** | Pelayanan Masyarakat / Pelayanan Masyarakat Umum. Pelayanan pasien non-BPJS (umumnya umum/swasta), masuk PNBP. |
| **Jasa Medis** | Insentif untuk dokter, paramedis, dan tenaga klinis lain dari komponen klaim BPJS/Yanmasum. |
| **DPJP** | Dokter Penanggung Jawab Pasien. Lead clinician untuk satu kasus pasien. |
| **Raber** | Rawat Bersama. Multi-spesialis untuk 1 pasien. |
| **TKS** | Tenaga Kerja Sukarela (di lingkungan RS militer: tenaga harian/kontrak non-PNS non-TNI). Honor TKS flat masuk `521115`. |
| **Honor Nakes** | Honor Tenaga Kesehatan. Umbrella untuk Insentif Medis, Paramedis, Insentif TKS, dan Insentif Pengelola — bersifat formula-based per klaim, masuk `521213` (per validasi B.4). |
| **Karumkitan, BPK, BPKAD** | Bukan terminologi pelaksanaan APBN — abaikan jika muncul; konteks daerah, bukan pusat. |

### G.12 Disambiguasi Cepat (Sumber Bias)

Beberapa pasangan istilah sering tertukar; berikut pegangan singkat untuk dokumen ini:

| Sering Tertukar | Penjelasan |
|---|---|
| **Revisi POK** vs **Pemutakhiran POK** | Revisi POK adalah **keputusan substantif** KPA. Pemutakhiran POK adalah **pencatatan teknis** ke SAKTI. Satu SK Revisi POK menghasilkan satu kegiatan Pemutakhiran POK. |
| **Revisi POK** vs **Revisi DIPA Halaman III** | Revisi POK tidak mengubah RPD. Jika menyentuh RPD bulanan, otomatis naik menjadi Revisi DIPA Halaman III. |
| **Akun (6 digit)** vs **Jenis Belanja (2 digit)** | "Akun" = kode 6 digit. "Jenis belanja" = 2 digit pertama (51/52/53/57). Dalam dokumen ini selalu dipakai konsisten. |
| **KRO** vs **Komponen** | KRO = klasifikasi output (apa). Komponen = jenis pengeluaran (gaji vs operasional). Beda level hirarki. |
| **Karumkit** vs **KPA** | Karumkit = pejabat RS. KPA = pejabat satker pengelola Palembang (untuk RS sub-satker). **Bukan orang yang sama**. |
| **Satker** vs **Sub-satker** | Satker = punya DIPA Petikan & KPA. Sub-satker = belum punya, di bawah satker pengelola. RS Batin Tikal saat ini = sub-satker. |
| **PNBP** vs **BLU** | PNBP = penerimaan satker biasa. BLU = status khusus satker dengan fleksibilitas pengelolaan keuangan. RS Batin Tikal **bukan BLU**, jadi seri akun `525xxx` dan `5219xx` BLU tidak relevan. |
| **"Pagu tetap"** vs **"Net change 0"** | Sama maknanya untuk dokumen ini. "Pagu tetap" istilah PMK; "net change 0" istilah teknis SIKESUMA. |
| **"Pengadaan" (sehari-hari)** vs **Belanja Modal** | "Pengadaan" sehari-hari di RS kadang merujuk ke pembelian apa pun. Untuk klasifikasi belanja: pengadaan habis pakai = Belanja Barang (52), pengadaan aset >1 tahun di atas nilai kapitalisasi = Belanja Modal (53). |
| **BMP** vs **Bahan Makanan Pasien** | **BMP = Bahan Bakar Minyak dan Pelumas** (Permenhan 5/2020) — akun `523122`. **Bahan Makanan Pasien** adalah makanan untuk pasien rawat inap — akun `521112`. Keduanya **sangat berbeda** baik secara akun maupun jenis belanja. Jangan disingkat "BMP" untuk makanan pasien karena bertabrakan dengan terminologi resmi Kemhan/TNI. |

---

## 0. Dasar Hukum

| Lapis | Peraturan | Pasal/Bagian Kunci |
|---|---|---|
| UU | UU No. 17/2003 (Keuangan Negara); UU No. 1/2004 (Perbendaharaan Negara) | Prinsip DIPA sebagai batas pengeluaran tertinggi |
| PP | PP No. 45/2013 jo. PP No. 50/2018 tentang Tata Cara Pelaksanaan APBN | Mekanisme pelaksanaan anggaran |
| PMK (utama, berlaku saat ini) | **PMK No. 62 Tahun 2023** tentang Perencanaan Anggaran, Pelaksanaan Anggaran, serta Akuntansi dan Pelaporan Keuangan | Pasal mengenai kewenangan revisi, jenis revisi, pembatasan |
| PMK (perubahan) | **PMK No. 107 Tahun 2024** tentang Perubahan atas PMK 62/2023 | Penyempurnaan revisi anggaran |
| PMK (rujukan teknis) | **PMK No. 199/PMK.02/2021** tentang Tata Cara Revisi Anggaran *(dicabut, namun lampiran rinciannya masih banyak dipakai sebagai rujukan praktis)* | Pasal 6 ayat (4) — kewenangan KPA; Lampiran I — Rincian Pembagian Kewenangan |
| Perdirjen | **PER-9/PB/2023** Direktur Jenderal Perbendaharaan tentang Petunjuk Teknis Revisi Anggaran kewenangan DJPb | Juknis operasional |
| Perdirjen (BAS) | **KEP-211/PB/2018** jo. **KEP-331/PB/2021** dan **KEP-291/PB/2022** tentang Kodefikasi Segmen Akun pada Bagan Akun Standar | Aturan kode akun; menentukan klasifikasi "jenis belanja" |
| PMK (khusus Kemhan/TNI) | **PMK No. 143/PMK.05/2018** tentang Mekanisme Pelaksanaan Anggaran Belanja Negara di Lingkungan Kemhan dan TNI | DIPA Daerah sebagai otorisasi; tata cara khusus pelaksanaan anggaran Kemhan/TNI |
| Permenhan (lingkup Kemhan) | **Permenhan No. 5 Tahun 2020** tentang Pengelolaan BMP di Lingkungan Kemhan dan TNI (mencabut Permenhan 17/2016 jo. 25/2018) | Pasal 1 angka 1 (definisi BMP); Pasal 8 (mekanisme tambah pagu BMP); Pasal 30 (pencatatan BMP di SIMAK-BMN) |
| Internal TNI AD | Perkasad / Surat Edaran Aslog Kasad / Juklak Puskesad terkait pengelolaan keuangan satker kesehatan *(perlu dikonfirmasi ke Sie Renbang satker induk Palembang)* | Lapis aturan tambahan untuk operasional non-BMP |

> **Catatan:** Dokumen ini menggunakan PMK 62/2023 jo. PMK 107/2024 sebagai dasar utama, dengan pengayaan referensi dari PMK 199/2021 yang lampirannya secara substansi masih dipakai oleh DJA/DJPb dalam penjelasan teknis. Untuk hal-hal yang spesifik di lingkungan Kemhan/TNI (mekanisme DIPA Daerah, pengelolaan BMP), PMK 143/2018 dan Permenhan 5/2020 berlaku sebagai *lex specialis*.

---

## 1. Klasifikasi Revisi Anggaran (Sesuai PMK)

PMK 62/2023 jo. PMK 107/2024 membagi revisi anggaran ke dalam **tiga kategori utama**:

| Kategori | Definisi | Total Pagu | Otoritas Penetap |
|---|---|---|---|
| **A. Revisi Anggaran dalam hal Pagu Berubah** | Penambahan/pengurangan total pagu (PNBP, hibah, refocusing, dll.) | Berubah | DJA atau Kanwil DJPb sesuai jenisnya |
| **B. Revisi Anggaran dalam hal Pagu Tetap** | Pergeseran rincian tanpa mengubah total pagu satker | Tetap | DJA, Kanwil DJPb, atau **KPA** (sesuai cakupan) |
| **C. Revisi Administrasi** | Perbaikan rumusan/nomenklatur/kode tanpa dampak anggaran | Tetap | Sesuai jenisnya |

**Posisi "Revisi POK" dalam taksonomi ini:**
Revisi POK adalah **subset dari kategori B (Pagu Tetap) yang menjadi kewenangan KPA**, dengan batasan ketat sebagaimana diuraikan di Bagian 3.

Dasar: PMK 199/2021 Pasal 2; PMK 62/2023 mengelompokkan dengan struktur serupa.

---

## 2. Konteks Sub-Satker: Implikasi Otoritas

RS Tk.IV 02.07.03 Batin Tikal **bukan satker mandiri**. KPA satker bukan Karumkit, melainkan pejabat di **satker pengelola Palembang** (umumnya pada level Kesdam/Denkesyah).

### 2.1 Implikasi untuk Otoritas Revisi POK

| Pihak | Peran dalam Revisi POK |
|---|---|
| Sie Renbang RS Batin Tikal | Menyusun **usulan** revisi POK; menyiapkan justifikasi dan ADK |
| Karumkit RS Batin Tikal | Memberikan **rekomendasi/persetujuan internal** atas usulan |
| Satker pengelola Palembang (Tata Usaha + Bagian Anggaran) | Verifikasi teknis & substansi |
| **KPA satker pengelola Palembang** | **Menetapkan** revisi POK (penanda tangan SK revisi POK) |
| Operator SAKTI satker pengelola | Input pemutakhiran POK di aplikasi SAKTI |

> **Pesan utama:** Dalam dokumen TA 2026 ini, frasa "ACC Karumkit → ACC Palembang" perlu dipahami secara teknis sebagai:
> **"usulan internal RS (rekomendasi Karumkit) → penetapan oleh KPA satker pengelola Palembang."**
>
> Karumkit sendiri **tidak berwenang menetapkan revisi POK** karena bukan KPA. SIKESUMA harus mencerminkan workflow dua-tingkat ini dengan jelas.

### 2.2 Implikasi untuk Revisi Pagu

Revisi yang mengubah total pagu (penambahan/pengurangan) **selalu** memerlukan proses di atas KPA (Kanwil DJPb atau DJA). RS sub-satker mengajukan ke satker pengelola, satker pengelola yang berinteraksi dengan Kanwil DJPb/DJA.

---

## 3. Revisi POK (Kewenangan KPA)

### 3.1 Definisi Resmi

> "KPA berwenang menetapkan revisi Petunjuk Operasional Kegiatan berupa pergeseran anggaran **dalam 1 (satu) KRO, 1 (satu) Kegiatan, dan 1 (satu) Satker**, sepanjang **tidak mengakibatkan perubahan volume RO, jenis belanja, dan sumber dana**."

*Sumber: PMK 199/PMK.02/2021 Pasal 6 ayat (4); substansi dipertahankan dalam PMK 62/2023 jo. PMK 107/2024.*

### 3.2 Constraint Wajib (Hard Constraints)

Setiap usulan revisi POK harus memenuhi **seluruh** kondisi berikut:

| # | Constraint | Sumber |
|---|---|---|
| C1 | Total pagu satker tidak berubah (net change = 0) | PMK 62/2023; definisi "Pagu Tetap" |
| C2 | Pergeseran dalam **1 KRO yang sama** | PMK 199/2021 Pasal 6(4) |
| C3 | Pergeseran dalam **1 Kegiatan yang sama** | PMK 199/2021 Pasal 6(4) |
| C4 | Pergeseran dalam **1 Satker yang sama** | PMK 199/2021 Pasal 6(4) |
| C5 | **Tidak mengubah volume RO** | PMK 199/2021 Pasal 6(4) |
| C6 | **Tidak mengubah jenis belanja** (kode 2 digit pertama akun: 51/52/53/57) | PMK 199/2021 Pasal 6(4); KEP-331/PB/2021 |
| C7 | **Tidak mengubah sumber dana** (RM/PNBP/PHLN/HLN, dst.) | PMK 199/2021 Pasal 6(4) |
| C8 | Untuk **Belanja Operasional**: hanya pergeseran dalam **1 (satu) komponen yang sama** (komponen 001 gaji vs 002 operasional kantor) dalam 1 Satker | FAQ DJA atas PMK 199/2021 |
| C9 | **Tidak boleh** menyebabkan mata anggaran/akun menjadi minus | Prinsip umum pelaksanaan APBN |
| C10 | Sesuai standar biaya (SBM/SBK) yang berlaku | PMK Standar Biaya tahunan |

### 3.3 Apa yang BUKAN Revisi POK Kewenangan KPA

Skenario berikut **bukan** kewenangan KPA dan harus naik ke Kanwil DJPb atau DJA:

| Skenario | Kewenangan |
|---|---|
| Pergeseran antar-KRO (walau dalam 1 Kegiatan) | Kanwil DJPb |
| Pergeseran antar-Kegiatan dalam 1 Program | Kanwil DJPb |
| Pergeseran antar-jenis belanja (52 → 53, dst.) | Kanwil DJPb / DJA tergantung kasus |
| Pergeseran dari Belanja Operasional ke Belanja Non-Operasional | DJA |
| Penambahan/pengurangan volume RO | DJA |
| Perubahan sumber dana | DJA |
| Pergeseran antar-Satker | Kanwil DJPb (1 wilayah) atau Dit. PA DJPb (antar-wilayah) |
| Penambahan total pagu (tambah pagu) | DJA atau Kanwil DJPb sesuai sumber |

### 3.4 Tafsir Praktis "Akun Sama" untuk SIKESUMA

Aturan rancangan awal Anda menyatakan: *"akun harus sama (misal 52xxxxx hanya dengan 52xxxxx)."*

Aturan ini **perlu dipertajam**, karena "52 ↔ 52" adalah syarat **perlu tetapi tidak cukup**. Yang tepat:

> **Pergeseran diperbolehkan jika seluruh hal berikut sama:**
> 1. Jenis belanja (2 digit pertama: 52 ↔ 52, 53 ↔ 53)
> 2. KRO (Klasifikasi Rincian Output)
> 3. Kegiatan
> 4. Komponen (khusus belanja operasional; mis. 001 gaji vs 002 operasional)
> 5. Sumber dana

**Contoh konkret yang sering jadi pertanyaan:**

| Kasus | Boleh sebagai Revisi POK KPA? | Alasan |
|---|---|---|
| 521211.01 (Obat) → 521211.02 (BMHP), dalam 1 KRO | ✅ Boleh | Akun spesifik beda tapi 5211xx sama, 1 KRO, jenis belanja 52, sumber dana sama |
| 521115 (Honor TKS) → 521213 (Honor Output Nakes), dalam 1 KRO | ⚠️ Hati-hati | Beda komponen (521115 di komponen 001, 521213 mungkin di komponen non-001) — perlu cek komponen |
| 521211 (Belanja Bahan) → 523112 (Pemeliharaan Peralatan) | ❌ Tidak | Beda jenis belanja (5211 = belanja barang operasional, 5231 = belanja pemeliharaan) — bukan kewenangan KPA |
| 521211 (Belanja Bahan, BEKKES) → 532111 (Belanja Modal Peralatan) | ❌ Tidak | Beda jenis belanja (52 → 53) dan kemungkinan beda KRO — kewenangan DJA |

**Catatan internal RS:** Pemahaman Sie Renbang Palembang yang menyatakan *"pengadaan ↔ pengadaan boleh, pengadaan ↔ pemeliharaan tidak boleh"* sejatinya adalah **penyederhanaan praktis** dari aturan PMK ini — di mana pengadaan habis pakai (521xxx) memang berbeda komponen/KRO dengan pemeliharaan (523xxx). PMK tidak melarangnya secara absolut, tetapi karena beda KRO/komponen, pergeseran tersebut tidak masuk kewenangan KPA dan harus diusulkan ke Kanwil DJPb.

### 3.5 Frekuensi dan Waktu

- **Boleh diusulkan kapan saja** sepanjang tahun anggaran berjalan, sesuai kebutuhan operasional.
- Praktik di RS Batin Tikal yang menjalankan revisi POK bulanan (akhir bulan) **sah secara PMK**, sepanjang tidak menyalahi constraint Bagian 3.2.
- **Wajib mengindahkan batas akhir tahunan** (lihat Bagian 6).

### 3.6 Efek Setelah Disetujui

- Revisi POK yang disetujui hanya mengubah **item yang diajukan**. Item lain di luar pengajuan tetap mengikuti POK terakhir yang berlaku.
- **Forward-looking:** berlaku sejak tanggal penetapan KPA. Realisasi yang sudah terjadi sebelum tanggal tersebut tidak terdampak.
- Setelah penetapan KPA, satker pengelola **wajib melakukan pemutakhiran POK di aplikasi SAKTI** agar pencairan (SPM/SP2D) mengacu pada POK terbaru.

---

## 4. Revisi Anggaran dalam hal Pagu Berubah ("Revisi Pagu")

### 4.1 Definisi dan Posisi Otoritas

Revisi yang menambah atau mengurangi total pagu DIPA **bukan** kewenangan KPA. Penetapannya di DJA atau Kanwil DJPb, sesuai jenisnya:

| Jenis | Kewenangan |
|---|---|
| Tambahan pagu dari APBN-P / ABT | DJA |
| Tambahan pagu PNBP di atas target | Kanwil DJPb (penghasil) |
| Tambahan pagu hibah langsung | Kanwil DJPb |
| Refocusing / Automatic Adjustment | DJA |
| Penyelesaian pagu minus belanja pegawai | Kanwil DJPb |

### 4.2 Koreksi atas Rancangan "Mid-Term Saja"

Rancangan awal Anda menyatakan revisi pagu *"hanya dapat diajukan pada periode mid-term (20 Juni – 5 Juli)."*

**Ini perlu dikoreksi sebagian.** Aturan PMK **tidak membatasi** revisi pagu hanya pada jendela mid-term. Yang benar:

- Revisi pagu dapat dilakukan **kapan saja** sepanjang TA, sesuai trigger yang muncul (perintah refocusing, tambahan PNBP, hibah, perintah tambah pagu dari satuan atas, dll.).
- Yang **dibatasi** adalah **batas akhir tahunan** (lihat Bagian 6), bukan jendela waktu awal.

**Pengecualian penting — BMP (Bahan Bakar Minyak dan Pelumas):**
Untuk anggaran BMP secara spesifik, **Pasal 8 Permenhan No. 5 Tahun 2020** mengatur:

> *"Dalam hal realisasi penggunaan anggaran BMP Kemhan dan TNI pada tahun berjalan melebihi alokasi anggaran BMP maka para pejabat KPA masing-masing UO pengelola BMP dapat mengajukan permohonan penambahan anggaran BMP **pada awal semester 2 (dua)** kepada Panglima TNI untuk UO Angkatan dan Menteri untuk UO Kemhan."*

Jadi konvensi "tambah pagu awal trimester 3" yang dipraktikkan di RS Batin Tikal sejatinya **selaras dengan aturan Permenhan untuk BMP**, dan kemungkinan terbawa sebagai praktik umum oleh Sie Renbang Palembang untuk seluruh kategori anggaran. Untuk anggaran selain BMP (BEKKES, jasa medis, dll.), tidak ada Permenhan/Perkasad yang secara eksplisit membatasi jendela waktu — sehingga seharusnya bisa lebih fleksibel.

### 4.3 Implikasi untuk SIKESUMA

SIKESUMA sebaiknya:
- **Tidak** mem-blokir entry revisi pagu di luar jendela "20 Juni – 5 Juli" secara hard. Sebagai gantinya, sediakan **mekanisme pengaktifan jendela revisi pagu berdasarkan perintah satuan atas** (mis. flag oleh admin Palembang).
- **Khusus akun BMP (`523122`, `523125`):** dapat memberikan **soft warning** jika usulan tambah pagu diajukan **di luar awal semester 2**, dengan referensi Pasal 8 Permenhan 5/2020.
- Tetap menampilkan **batas akhir tahunan** PMK 62/2023 sebagai hard deadline (lihat Bagian 6).
- Mendokumentasikan **trigger setiap revisi pagu** (perintah refocusing, ABT, dll.) sebagai metadata audit.

### 4.4 Comprehensive vs Partial

Rancangan Anda menyebut revisi pagu *"harus comprehensive: mencakup seluruh akun dan seluruh item breakdown."*

**Tafsir yang tepat:** PMK tidak mensyaratkan revisi pagu untuk **selalu** comprehensive. Yang dipersyaratkan adalah:
- ADK RKA-K/L hasil revisi harus **konsisten dan lengkap** (struktur kode akun, KRO, RO, jenis belanja, sumber dana semua harus benar pasca-revisi).
- Volume RO yang berubah harus **dijustifikasi**.

Dalam praktik internal RS, **memang lebih aman** menyusun revisi pagu secara comprehensive (karena tambahan/pengurangan pagu sering menggeser banyak item), tapi ini **kebijakan internal** Sie Renbang, bukan kewajiban PMK. SIKESUMA sebaiknya **memfasilitasi** mode comprehensive sebagai default, namun tidak **memblokir** revisi parsial yang ADK-nya tetap valid.

---

## 5. Revisi POK vs Revisi DIPA vs Pemutakhiran POK

Distinction ini krusial untuk SIKESUMA tetapi belum eksplisit di rancangan awal.

| Operasi | Cakupan Perubahan | Otoritas | Sistem |
|---|---|---|---|
| **Pemutakhiran POK** (kewenangan KPA) | Hanya rincian akun di POK, **tidak menyentuh Halaman I, III, atau IV.B DIPA** | KPA satker pengelola | Pemutakhiran POK di SAKTI; tidak perlu pengesahan Kanwil |
| **Revisi DIPA Halaman III** | Mengubah Rencana Penarikan Dana (RPD) per bulan | Kanwil DJPb (di luar trimester) atau pemutakhiran KPA di awal trimester | Revisi DIPA di SAKTI; perlu pengesahan Kanwil DJPb |
| **Revisi DIPA Halaman I/IV.B** | Mengubah total pagu, sumber dana, atau lokasi RO | DJA / Kanwil DJPb | Revisi DIPA; pengesahan Kemenkeu |
| **Revisi Administrasi** | Perubahan kode/nomenklatur tanpa anggaran | Kanwil DJPb / KPA | Revisi admin di SAKTI |

> **Implikasi penting untuk SIKESUMA:** Jika revisi POK kewenangan KPA berdampak pada perubahan RPD (Halaman III DIPA), maka revisi tersebut **tidak lagi murni revisi POK** — harus diusulkan ke Kanwil DJPb sebagai revisi DIPA Halaman III. SIKESUMA perlu mendeteksi dampak ini secara otomatis.

*Sumber: PER-9/PB/2023; FAQ Kanwil DJPb Jateng.*

---

## 6. Batas Waktu Tahunan (Pasal 175 PMK 62/2023 jo. PMK 107/2024)

| Tanggal | Jenis Revisi |
|---|---|
| **31 Januari** TA berikutnya | Revisi administratif tertentu untuk LKPP |
| **8 April → 17 April** *(jendela TW II)* | Revisi DIPA Halaman III TW II |
| **30 Juni** | Revisi pagu PNBP yang menyebabkan perubahan pagu |
| **8 Juli → 17 Juli** *(jendela TW III)* | Revisi DIPA Halaman III TW III |
| **1 Oktober → 10 Oktober** *(jendela TW IV)* | Revisi DIPA Halaman III TW IV |
| **31 Oktober** | **Batas akhir revisi kewenangan DJA** (revisi yang memerlukan penelaahan) |
| **30 November** | **Batas akhir revisi kewenangan Kanwil DJPb** |
| **15 Desember** | Batas pergeseran anggaran dari kelebihan realisasi PNBP |
| **26 Desember** | **Batas akhir pemutakhiran POK kewenangan KPA** di SAKTI |
| **31 Desember** | Batas akhir revisi penyelesaian pagu minus belanja pegawai |

> **Implikasi untuk SIKESUMA:** Setiap usulan revisi yang melewati batas waktu di atas akan ditolak Kanwil DJPb / DJA. Aplikasi sebaiknya memberikan **soft warning H-7** dan **hard block H-1** sebelum setiap deadline.

*Sumber: Pasal 175 PMK 62/2023 jo. PMK 107/2024; Surat DJPb tentang Langkah Akhir TA per tahun.*

---

## 7. Detail Proses Revisi POK di SIKESUMA (Versi Koreksi)

### 7.1 Pengajuan

- Sie Renbang RS membuat draft usulan di SIKESUMA yang berisi:
  - Daftar item yang diubah (nilai lama → nilai baru)
  - Justifikasi naratif setiap perubahan
  - Sumber dana, KRO, Kegiatan, Komponen untuk tiap item
  - Total penambahan dan total pengurangan (untuk validasi net change)

**Validasi sistem (otomatis di SIKESUMA):**

| Cek | Aturan |
|---|---|
| V1 | Total penambahan = total pengurangan (net change = 0) |
| V2 | Setiap pasangan item (sumber, tujuan) berada dalam KRO yang sama |
| V3 | Setiap pasangan item berada dalam Kegiatan yang sama |
| V4 | Setiap pasangan item memiliki jenis belanja yang sama (cek 2 digit pertama kode akun) |
| V5 | Setiap pasangan item memiliki sumber dana yang sama |
| V6 | Untuk akun belanja operasional (5211x/5212x): cek komponen sama |
| V7 | Nilai pagu akun setelah revisi tidak negatif |
| V8 | Realisasi yang sudah terjadi pada akun sumber ≤ nilai akun setelah pengurangan |
| V9 | Tanggal pengajuan masih dalam batas tahunan (≤ 26 Desember) |
| V10 | Tidak ada perubahan volume RO (jika revisi melibatkan akun di RO yang volumenya tertulis di DIPA) |

### 7.2 Persetujuan

```
Sie Renbang RS  →  Karumkit (rekomendasi/persetujuan internal)
                →  Verifikasi satker pengelola Palembang
                →  KPA satker pengelola (penetapan formal: SK Revisi POK)
                →  Operator SAKTI Palembang (pemutakhiran POK di SAKTI)
                →  SIKESUMA sinkronisasi: status "berlaku efektif"
```

### 7.3 Efek Setelah Disetujui

- Berlaku sejak **tanggal penetapan KPA** (bukan otomatis "mulai bulan berikutnya" — perlu disesuaikan).
- Item yang tidak diajukan tetap mengikuti POK terakhir.
- SIKESUMA menyimpan **snapshot POK efektif** per tanggal penetapan untuk keperluan audit (sesuai catatan REKAP: *"Nominal sebelumnya disimpan untuk keperluan Audit dan evaluasi"*).

### 7.4 Contoh Kasus (Direvisi)

**Baseline TA 2026 (KRO X, Kegiatan Y, Komponen 001, jenis belanja 52, sumber RM):**
- Akun 521211.01 (Obat) = Rp 100 jt
- Akun 521211.02 (BMHP) = Rp 200 jt
- Akun 521211.03 (Reagen) = Rp 300 jt
- Total = Rp 600 jt

**Pengajuan revisi POK akhir Januari:**
- 521211.01 (Obat): Rp 100 jt → Rp 120 jt (+ Rp 20 jt)
- 521211.02 (BMHP): Rp 200 jt → Rp 180 jt (− Rp 20 jt)

**Validasi:**
- V1 ✅ Net change 0
- V2–V5 ✅ Semua dalam KRO X, Kegiatan Y, jenis belanja 52, sumber RM yang sama
- V6 ✅ Keduanya akun 5211 (operasional, komponen 001)
- V7 ✅ Tidak ada akun minus
- V9 ✅ Akhir Januari masih dalam batas tahunan

**Hasil setelah penetapan KPA Palembang (mis. 31 Januari):**
- 521211.01 = Rp 120 jt
- 521211.02 = Rp 180 jt
- 521211.03 = Rp 300 jt (tidak berubah)
- Total = Rp 600 jt (tetap)

---

## 8. Detail Proses Revisi Pagu di SIKESUMA (Versi Koreksi)

### 8.1 Pengajuan

- **Trigger:** perintah/instruksi resmi dari satuan atas (Kesdam/Puskesad/DJPb), bukan jadwal kalender.
- Admin Palembang **mengaktifkan jendela revisi pagu** di SIKESUMA dengan mencantumkan dasar perintah (nomor surat, tanggal).
- Sie Renbang RS menyusun draft yang dapat berupa:
  - **Comprehensive**: seluruh akun & item (default, lebih disarankan untuk audit trail yang bersih)
  - **Parsial**: hanya akun/RO yang terdampak perintah (boleh, sepanjang ADK valid)

### 8.2 Validasi Sistem

| Cek | Aturan |
|---|---|
| W1 | Tanggal pengajuan dalam jendela yang diaktifkan admin Palembang |
| W2 | Tanggal pengajuan masih sebelum batas tahunan (31 Okt DJA / 30 Nov DJPb) |
| W3 | ADK RKA-K/L hasil revisi konsisten (semua field BAS terisi sesuai standar) |
| W4 | Total pagu baru = total pagu lama ± delta yang sesuai dengan perintah satuan atas |
| W5 | Untuk perubahan volume RO: justifikasi dilampirkan |
| W6 | Tidak menyebabkan pagu jenis belanja tertentu menjadi minus |

### 8.3 Persetujuan dan Efek

- Workflow sama dengan revisi POK (RS → Karumkit → Palembang → KPA), tetapi **eksekusi formal** ada di Kanwil DJPb / DJA — KPA satker pengelola hanya menandatangani usulan, **bukan menetapkan**.
- Setelah pengesahan Kanwil DJPb / DJA, revisi pagu menggantikan postur sebelumnya untuk seluruh sisa TA.
- SIKESUMA menyimpan snapshot pagu pre-revisi dan post-revisi untuk audit.

---

## 9. Integrasi Kedua Proses dalam Satu TA 2026 (Tabel Koreksi)

| Periode (contoh) | Aksi | Jenis | Penetap | Isi | Berlaku mulai |
|---|---|---|---|---|---|
| Awal Januari | Baseline | DIPA awal | DJA (pengesahan Kemenkeu) | Lengkap | 2 Januari |
| Akhir Januari | Revisi POK | Pagu tetap | KPA Palembang | Hanya item A & B (1 KRO, 1 komponen, jenis belanja sama) | Tanggal penetapan KPA |
| Akhir Maret | Revisi POK | Pagu tetap | KPA Palembang | Hanya item C & D (1 KRO, 1 komponen) | Tanggal penetapan KPA |
| Awal April | Revisi DIPA Hal III (TW II) | Pagu tetap (Halaman III) | Kanwil DJPb / KPA awal TW | RPD per bulan | TW II |
| *(saat perintah tambah pagu turun)* | Revisi Pagu | Pagu berubah | Kanwil DJPb / DJA | Sesuai perintah | Tanggal pengesahan |
| Akhir Agustus | Revisi POK | Pagu tetap | KPA Palembang | Hanya item Z | Tanggal penetapan KPA |
| Awal Oktober | Revisi DIPA Hal III (TW IV) | Pagu tetap (Halaman III) | KPA awal TW | RPD per bulan | TW IV |
| **31 Oktober** | Hard deadline | — | — | Batas akhir revisi DJA | — |
| **30 November** | Hard deadline | — | — | Batas akhir revisi Kanwil DJPb | — |
| **26 Desember** | Hard deadline | — | — | Batas akhir pemutakhiran POK KPA | — |

---

## 10. Ringkasan Koreksi Substantif

Berikut yang diubah dari rancangan awal:

| # | Rancangan Awal | Koreksi |
|---|---|---|
| 1 | "ACC Karumkit → ACC Palembang" sebagai workflow penetapan | Penetap formal adalah **KPA satker pengelola Palembang**, bukan Karumkit. Karumkit memberikan rekomendasi internal. |
| 2 | "Akun harus sama (52xxxxx hanya dengan 52xxxxx)" | Disempurnakan menjadi 5 dimensi yang harus sama: jenis belanja, KRO, Kegiatan, komponen (untuk belanja operasional), dan sumber dana. |
| 3 | "Revisi pagu hanya akhir Juni / awal Juli" | Revisi pagu boleh kapan saja sepanjang TA sesuai trigger satuan atas, dibatasi hanya oleh batas akhir tahunan PMK. |
| 4 | "Revisi pagu wajib comprehensive" | PMK tidak mewajibkan comprehensive. SIKESUMA mendukung comprehensive sebagai default tetapi tidak memblokir parsial yang ADK-nya valid. |
| 5 | Tidak ada distinction Pemutakhiran POK vs Revisi DIPA | Ditambah Bagian 5: jika RPD berubah, bukan murni revisi POK — naik ke revisi DIPA Halaman III. |
| 6 | "Berlaku mulai bulan berikutnya" | Lebih tepat: berlaku sejak **tanggal penetapan KPA**, bukan otomatis bulan berikutnya. |
| 7 | Tidak ada batas waktu tahunan | Ditambah Bagian 6 dengan tanggal-tanggal kunci PMK 62/2023 Pasal 175. |
| 8 | Constraint hanya net change 0 + akun sama | Diperluas menjadi 10 hard constraint (C1–C10), termasuk larangan minus dan kepatuhan SBM. |
| 9 | Tidak ada dasar hukum tertulis | Ditambah Bagian 0 dengan rujukan PMK, PER, dan KEP lengkap. |

---

## 11. Catatan untuk Implementasi SIKESUMA

1. **Master akun & item:** setiap item BAS harus tagged dengan metadata lengkap: jenis belanja (2 digit), KRO, Kegiatan, Komponen, Sumber dana, plus relasi ke RO induk.
2. **Validasi 10-constraint (C1–C10) di revisi POK:** harus dijalankan **sebelum** usulan dikirim ke Karumkit untuk ACC.
3. **Mekanisme aktivasi jendela revisi pagu:** flag yang dikontrol admin Palembang dengan input "dasar perintah".
4. **Deteksi dampak ke RPD:** jika revisi POK menyentuh akun yang volumenya sudah dijadwalkan di RPD bulanan, sistem harus memberi warning bahwa ini mungkin perlu revisi DIPA Halaman III, bukan murni pemutakhiran POK.
5. **Audit trail per perubahan:** simpan snapshot pre dan post setiap pengajuan, dengan referensi nomor SK Revisi POK KPA setelah penetapan.
6. **Hard deadline tahunan:** soft warning H-7 + hard block H-1 sebelum tanggal Pasal 175 PMK 62/2023.
7. **Snapshot per kondisi efektif:** bukan per akhir bulan, tapi per tanggal penetapan revisi.

---

## 12. Hal yang Perlu Dikonfirmasi Internal TNI AD

Aturan PMK di atas adalah **lapis Kemenkeu** (eksternal). Beberapa lapis aturan internal Kemhan sudah teridentifikasi dan diintegrasikan di dokumen ini:

**✅ Sudah teridentifikasi dan masuk Dasar Hukum:**
- PMK No. 143/PMK.05/2018 tentang Mekanisme Pelaksanaan Anggaran Belanja Negara di Lingkungan Kemhan/TNI (DIPA Daerah sebagai otorisasi).
- Permenhan No. 5 Tahun 2020 tentang Pengelolaan BMP (mencabut Permenhan 17/2016 jo. 25/2018) — definisi BMP, hierarki Satkai I/II/III, mekanisme tambah pagu BMP awal semester 2.

**⏳ Masih perlu dikonfirmasi ke Sie Renbang satker pengelola Palembang:**

1. Apakah ada **Surat Edaran Aslog Kasad** atau **Perkasad** tentang tata cara revisi POK untuk satker kesehatan TNI AD? *(Sering kali lebih ketat dari PMK.)*
2. Apakah **Puskesad** menerbitkan Juklak/Juknis pengelolaan keuangan RS Tk.IV?
3. Apakah praktik "pergeseran pengadaan ↔ pemeliharaan tidak boleh" yang dijelaskan Pak Angga bersumber dari aturan internal tertulis, atau konvensi praktis Sie Renbang Palembang?
4. Bentuk SK Revisi POK yang dipakai di lingkungan Kesdam II/Sriwijaya — apakah ada template standar?
5. Apakah ada **Permenhan/Perkasad lain** yang membatasi jendela waktu revisi untuk kategori anggaran non-BMP (mis. BEKKES, jasa medis, alat kesehatan)?
6. Status RS Batin Tikal sebagai Satkai berapa untuk BMP-nya: kemungkinan **Satkai III** di bawah Satkai II tingkat Kesdam — perlu konfirmasi.

Hasil konfirmasi tersebut akan menjadi **lapis tambahan** di dokumen ini.

---

**Akhir dokumen.**
