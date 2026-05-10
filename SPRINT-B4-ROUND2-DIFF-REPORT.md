# SPRINT-B4 Round 2 — Migration Diff Report (Post-Angga Restructure)

**Tanggal:** 10 Mei 2026
**Trigger:** Angga restructure pagu-2025-modal + komunikasi klarifikasi 521119/521811


---

## 1. Yang Dilakukan Round 2

Setelah B.4 closure, Angga melakukan beberapa perubahan via UI SIKESUMA:
- ✏️ Restructure `pagu-2025-modal` jadi multi-level dengan kategorisasi internal `.A` (Alsintor/Yanmasum) dan `.B` (Alkes), 13 rows total
- ✏️ Tambah row `pagu-2025-bekkes` (Obat & BMHP YANMASUM, Linen Pasien)
- ✏️ Tambah row `pagu-2025-pemeliharaan` (Har Gedung YANMASUM)
- ✏️ Konsolidasi 4 Jasa Diagnostik (Sun Clinik, Promedic, CT Scan, Lab PA) jadi 1 row 'PEMBAYARAN RUJUK PEMERIKSAAN DIAGNOSTIK' di `pagu-2025-operasional`
- 💬 Komunikasi klarifikasi Angga: ATK pakai `521811` (bukan `521111`); jasa rujukan rekanan pakai `521119` (bukan `522191`)

Tim AI-Assisted Dev menerapkan otomatis:
- 17 backfill kode_bas untuk row baru hasil restructure (Modal section dll)
- 3 koreksi per Angga klarifikasi: ATK 521111→521811; LAUNDRY 522191→521119; Pembayaran Rujuk 521112→521119
- 9 entries di `utils/internalRecommendations.ts` baru (HITL dictionary) untuk capture klarifikasi Angga sebagai foundation autocomplete future

---

## 2. State Akhir per Section


### `pagu-2024-bekkes` (4 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2024-bk-h` | 0 | `521211` | `521211` | BELANJA BAHAN (BEKKES) | 800,000,000 |
| `row-2024-bk-1` | 1 | `521211.01` | `521811` | Pengadaan Obat-obatan | 500,000,000 |
| `row-2024-bk-2` | 1 | `521211.02` | `521811` | BMHP (Bahan Medis Habis Pakai) | 250,000,000 |
| `row-2024-bk-3` | 1 | `521211.03` | `521811` | Oksigen + Reagen Lab | 50,000,000 |

### `pagu-2024-lainnya` (5 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2024-ln-h` | 0 | `521311` | `—` | BELANJA JASA | 400,000,000 |
| `row-2024-ln-1a` | 1 | `522111.01` | `522111` | Listrik (split 75% dari 521311.01) | 150,000,000 |
| `row-2024-ln-1b` | 1 | `522113.01` | `522113` | Air (split 25% dari 521311.01) | 50,000,000 |
| `row-2024-ln-2` | 1 | `521311.02` | `522112` | Internet & Telepon | 80,000,000 |
| `row-2024-ln-3` | 1 | `521311.03` | `522191` | Jasa Lainnya | 120,000,000 |

### `pagu-2024-pegawai` (3 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2024-pgw-h` | 0 | `521115` | `521115` | BELANJA PEGAWAI (HEADER) | 2,000,000,000 |
| `row-2024-pgw-1` | 1 | `521115.01` | `521115` | Honor Tenaga Lepas (TKS) | 1,500,000,000 |
| `row-2024-pgw-2` | 1 | `521115.02` | `521115` | Honor Pengelola | 500,000,000 |

### `pagu-2024-pemeliharaan` (3 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2024-pm-h` | 0 | `521411` | `—` | BELANJA PEMELIHARAAN | 800,000,000 |
| `row-2024-pm-1` | 1 | `521411.01` | `523121` | Perbaikan Alat Medis | 600,000,000 |
| `row-2024-pm-2` | 1 | `521411.02` | `523111` | Perbaikan Bangunan | 200,000,000 |

### `pagu-2025-bekkes` (6 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2025-bk-h` | 0 | `521811` | `521811` | BELANJA BEKKES & GAS MEDIS | 941,803,992 |
| `row-1778396453018-0.8151765790` | 1 | `521811.05` | `521811` | Obat & BMHP YANMASUM (REKANAN) | 0 |
| `row-1778396118586-0.0644112922` | 1 | `521811.04` | `521811` | Linen pasien | 0 |
| `row-2025-bk-1` | 1 | `521811.01` | `521811` | Obat & BMHP (Rekanan) | 896,804,004 |
| `row-2025-bk-2` | 1 | `521811.02` | `521811` | Gas Medis | 24,999,996 |
| `row-2025-bk-3` | 1 | `521811.03` | `521811` | ATK | 19,999,992 |

### `pagu-2025-jasa` (4 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2025-js-h` | 0 | `521115` | `521115` | BELANJA JASA (HONOR) | 1,429,000,000 |
| `row-2025-js-1` | 1 | `521115.01` | `521115` | Honor Tenaga Kerja Sukarela (TKS) | 400,000,000 |
| `row-2025-js-2` | 1 | `521115.02` | `521115` | Honor Tenaga Kesehatan (Nakes) | 951,000,000 |
| `row-2025-js-3` | 1 | `521115.03` | `521115` | Honor Pengelola | 78,000,000 |

### `pagu-2025-modal` (13 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-1778393967209-0.5030882230` | 0 | `532111.A` | `532111` | BELANJA MODAL PERALATAN DAN MESIN (ALSINTOR) | 0 |
| `row-1778394252168-0.5491962071` | 1 | `532111.A.05` | `532111` | Pengadaan Alsintor Lain-lain (YANMASUM) | 0 |
| `row-1778394143487-0.3108573929` | 1 | `532111.A.01` | `532111` | Laptop Lenovo Thinkpad x270 (BPJS) | 0 |
| `row-1778394115997-0.9391637721` | 1 | `532111.A.02` | `532111` | Computer set Dell  (BPJS) | 0 |
| `row-1778394105244-0.6891093181` | 1 | `532111.A.03` | `532111` | Showcase Cooler  (BPJS) | 0 |
| `row-1778394078771-0.5211030586` | 1 | `532111.A.04` | `532111` | Pengadaan Alsintor Lain-lain  (BPJS) | 0 |
| `row-1778397382347-0.8912003577` | 0 | `532111.B` | `532111` | BELANJA MODAL PERALATAN DAN MESIN (ALKES) | 0 |
| `row-1778397911992-0.6584387691` | 1 | `532111.B.06` | `532111` | PENGADAAN ALKES (YANMASUM) | 0 |
| `row-1778397658459-0.2486148574` | 1 | `532111.B.05` | `532111` | Pengadaan Alkes | 0 |
| `row-1778397644865-0.8887336842` | 1 | `532111.B.04` | `532111` | Tensimeter Digital Omron | 0 |
| `row-1778397554355-0.2761946982` | 1 | `532111.B.03` | `532111` | stethoscope littman classic II infant  (BPJS) | 0 |
| `row-1778397532698-0.8960288966` | 1 | `532111.B.02` | `532111` | stethoscope littman classic II  (BPJS) | 0 |
| `row-1778397448745-0.7046913813` | 1 | `532111.B.01` | `532111` | o2 sensor ventilator  (BPJS) | 0 |

### `pagu-2025-operasional` (4 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2025-op-h` | 0 | `521112` | `521112` | BELANJA OPERASIONAL LAINNYA | 348,000,000 |
| `row-1778398624667-0.1485142995` | 1 | `521112.03` | `521112` | BELANJA BARANG OPERASIONAL LAINNYA | 0 |
| `row-2025-op-2` | 1 | `521112.02` | `521119` | LAUNDRY | 26,000,000 |
| `row-2025-op-7` | 1 | `521112.01` | `521119` | PEMBAYARAN RUJUK PEMERIKSAAN DIAGNOSTIK | 198,000,000 |

### `pagu-2025-pemeliharaan` (3 rows)

| Row ID | Lvl | Kode SIKESUMA | kode_bas | Description | Nominal Rp |
|---|---:|---|---:|---|---:|
| `row-2025-pm-h` | 0 | `523111` | `523111` | BELANJA PEMELIHARAAN | 60,000,000 |
| `row-1778397218793-0.9389862907` | 1 | `523111.02` | `523111` | Har Gedung dan Bangunan (YANMASUM) | 0 |
| `row-2025-pm-1` | 1 | `523111.01` | `523111` | Har Gedung dan Bangunan (BPJS) | 60,000,000 |

---

## 3. Coverage

**43/45 rows have kode_bas** (95%)

3 yang null sengaja: 2 orphan parents (`pagu-2024-lainnya/row-2024-ln-h` kode `521311`, `pagu-2024-pemeliharaan/row-2024-pm-h` kode `521411`) — kode invalid BAS, header tidak butuh kode_bas. Plus 1 row baru yang belum di-classify.


---

## 4. Internal Recommendation Dictionary (NEW, HITL Foundation)

File baru: `utils/internalRecommendations.ts` — 9 entries dari klarifikasi Angga:

| ID | Trigger Pattern | Recommended kode_bas | Source |
|---|---|---|---|
| ATK-001 | `/atk/`, `/alat tulis kantor/` | `521811` | Klarifikasi 10 Mei 2026 |
| JASA-RUJUKAN-001 | `/diagnostik/`, `/ct scan/`, `/lab pa/`, `/laundry/`, `/pembayaran rujuk/` | `521119` | Klarifikasi 10 Mei 2026 |
| HONOR-001 | `/honor (tks|nakes|pengelola)/`, `/casemix/`, `/tim verifikasi/` | `521115` | Respons Angga B.4 |
| BMHP-001 | `/obat/`, `/bmhp/`, `/gas medis/`, `/oksigen/`, `/reagen/`, `/linen pasien/` | `521811` | Respons Angga B.4 |
| BMP-001 | `/bmp/`, `/bbm/`, `/pertamax|solar|hsd|avtur|avgas/`, `/pelumas/` | `523122` | Respons Angga B.4 |
| UTILITAS-001 | `/listrik/`, `/pln/` | `522111` | Respons Angga B.4 |
| UTILITAS-002 | `/air/`, `/pdam/` | `522113` | Respons Angga B.4 |
| UTILITAS-003 | `/internet/`, `/telepon/`, `/wifi/`, `/telkom/` | `522112` | Respons Angga B.4 |
| BPD-001 | `/bpd/`, `/perjalanan dinas/`, `/spd/` | `524111` | Respons Angga B.4 |

Dictionary ini dipakai di KodeAutocomplete via prop `description`. Saat user typing description (mis. 'ATK Ruangan'), suggestion dari Angga muncul **paling atas** dropdown dengan badge ⭐ REKOMENDASI ANGGA + tooltip justifikasi tertulis Angga.

---

## 5. Pertanyaan Untuk Angga (Validasi)

1. ✅ **Konfirmasi 3 koreksi yang sudah saya terapkan otomatis** ke Supabase live: ATK→521811, LAUNDRY→521119, Pembayaran Rujuk→521119. Sesuai klarifikasi Anda?
2. ✅ **Section `pagu-2025-modal` semua kode_bas = 532111** (umum). Apakah ada item modal yang Anda mau pakai kode lebih spesifik (mis. 532113 BLU atau 532114 TNI)? Saat ini default 532111 karena RS sub-Satker non-BLU.
3. **Dictionary internal recommendation foundation siap.** Apakah Anda mau menambah pattern baru? Mis. 'Linen Pasien', 'Pengadaan Alkes', 'Pengadaan Alsintor' — saya bisa expand dictionary kalau Anda kasih klarifikasi.
4. **Subkode internal multi-level**: Anda sudah pakai konvensi `.A`, `.B` untuk Alsintor/Alkes. Apakah perlu standardisasi cross-section (mis. semua section pakai .A/.B/.C/...) atau biarkan free-form per section?
5. **Konteks 4 dari user — persiapan level 3** (`.A.01.001` dst): saat ini data model + autocomplete sudah support multi-level dot. Tidak butuh schema change. Anda mau langsung pakai kalau perlu?
