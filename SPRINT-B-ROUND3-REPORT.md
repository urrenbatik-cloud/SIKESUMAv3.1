# Sprint B Round 3 — Post-Confirmation Updates Report

**Tanggal:** 10 Mei 2026  
**Trigger:** Konfirmasi Angga (9 konteks) + restructure besar di app


---

## 1. Konfirmasi yang Diterima dari Angga

✅ **Konteks 2:** 3 koreksi otomatis (ATK→521811, LAUNDRY→521119, Pembayaran Rujuk→521119) **diterima sesuai klarifikasi**.
✅ **Konteks 3:** Approval untuk **expand HITL dictionary** dengan pattern baru.
✅ **Konteks 4:** Subkode `.A`/`.B` adalah **KHUSUS Belanja Pengadaan**, bukan global standardization. Reasoning: akun sama (`532111`) tapi komponen beda (alsintor/alkes/alsatri). Akun lain tidak butuh konvensi ini karena beda komponen sudah ada beda akun.
✅ **Konteks 5:** Level 3 hanya jika diperlukan.
⚠️ **Konteks 6:** Klarifikasi: `521119` untuk Operasional Lainnya, `521112` HANYA untuk Bahan Makanan.
📋 **Konteks 7-8:** Status RS = sub-Satker non-BLU di bawah Palembang. `525xxx` tidak relevan. Workflow Palembang flag for future Sprint.
📚 **Konteks 9:** Glossarium istilah lokal — added ke `docs/glossary.md` dedicated file.


---

## 2. Update yang Dilakukan Angga via App

**5 section baru** ditambahkan:
- TELPON DAN INTERNET (522112) + LANGGANAN AIR DAN GAS (522113)
- BELANJA BAHAN BAKAR MINYAK DAN PELUMAS (BMP) (523122)
- BELANJA PERJALANAN DINAS (524111)
- BELAJA APLIKASI XDR (kode `53611` — typo, harusnya `536111`)
- SERAGAM PELAKSANA (521219)

**Restructure besar:**
- `pagu-2025-operasional`: Header kode `521112` → `521119` (sub-rows ikut). Tambah row Bahan Makanan (521112) + Keperluan Perkantoran (521111) + Biaya Cetak. Section ini sekarang punya 3 sub-section internal: Operasional Lainnya (521119.0X), Bahan Makanan (521112.0X), Perkantoran (521111.0X).
- `pagu-2025-modal`: Rename `532111.A.01` → `532111.01.A` (alphabetic suffix di akhir, lebih sortable). Tambah `532111.05.B` (Pengadaan Paket Alkes BPJS) + `532111.06.A` (Pengadaan Alsintor BPJS) + section `532111.B` ALSATRI.
- `pagu-2025-jasa`: Tambah Honor Sukarela/Kesehatan/Pengelola **YANMASUM** (sub `.04/.05/.06`). Honor nominal direvisi jadi monthly value.

---

## 3. Tim Dev Apply Otomatis (Round 3)

Tim AI-Assisted Dev menerapkan otomatis ke Supabase live:
- **12 mutations** (1 fix explicit Konteks 6 + 11 backfill kode_bas)
- **2 revert** orphan parents (kode 521311/521411 invalid BAS — guard correct)
- **1 revert** typo `53611` → null kode_bas (5-digit, butuh Angga validate)

Specific fix per Konteks 6:
- `pagu-2025-operasional/row-1778398624667-...` (kode `521119.03`, 'BELANJA BARANG OPERASIONAL LAINNYA') → kode_bas `521112` → **`521119`** ✅

**Coverage final:** 58/61 rows have kode_bas (95%)

**3 rows tanpa kode_bas (sengaja atau pending Angga):**
  - `pagu-2025-operasional/row-1778400592239-0.7681270965` kode `521112.01` — BELANJA PENGADAAN BAHAN MAKANAN (BPJS)
  - `pagu-2025-operasional/row-1778400528369-0.9041278885` kode `521112.01` — BELANJA PENGADAAN BAHAN MAKANAN (YANMASUM)
  - `pagu-2025-operasional/row-1778400788605-0.0733281751` kode `521111.01` — BIAYA CETAK
  - `pagu-2025-jasa/row-1778401749102-0.0303891990` kode `521115.05` — HONOR TENAGA KESEHATAN YANMASUM
  - `pagu-2025-jasa/row-1778401748633-0.5271495136` kode `521115.06` — HONOR TENAGA SUKARELA YANMASUM
  - `pagu-2024-lainnya/row-2024-ln-h` kode `521311` — BELANJA JASA
  - `pagu-2025-modal/row-1778402987643-0.9787915898` kode `532111.06.A` — PENGADAAN ALSINTOR  (BPJS)
  - `pagu-2025-modal/row-1778400307716-0.1343128760` kode `532111.05.B` — PENGADAAN PAKET ALKES (BPJS)
  - `pagu-2025-modal/row-1778402703532-0.5743951043` kode `532111.B` — BELANJA MODAL PERALATAN DAN MESIN (ALSATRI)
  - `pagu-2025-1778401175697/row-1778402463172-0.8801484608` kode `522113` — LANGGANAN AIR DAN GAS
  - `pagu-2024-pemeliharaan/row-2024-pm-h` kode `521411` — BELANJA PEMELIHARAAN

---

## 4. HITL Dictionary Expanded (Konteks 3 Approved)

**5 entry baru** di `utils/internalRecommendations.ts` (total sekarang **14 entries**):

| ID | Trigger | kode_bas | Catatan |
|---|---|---|---|
| **PENGADAAN-MODAL-001** | `/alsintor|alsatri|alkes|peralatan dan mesin/`, item names: tensimeter/laptop/dll | `532111` | Konvensi `.A`/`.B`/`.C` khusus pengadaan |
| **MODAL-LAINNYA-001** | `/aplikasi|software|license|xdr/` | `536111` | Software = aset takberwujud |
| **SERAGAM-001** | `/seragam|pakaian (dinas|kerja|khusus)/` | `521219` | Pakaian dinas pelaksana |
| **OPERASIONAL-LAINNYA-001** | `/belanja (barang )?operasional( lainnya)?/` | `521119` | Konteks 6: BUKAN 521112! |
| **BAHAN-MAKANAN-001** | `/makan pasien|bahan makanan/` | `521112` | KHUSUS makanan, bukan operasional |

Update **UTILITAS-001** (Listrik): tambah note bahwa kode `522111` saat ini status **persiapan** (belum aktif karena listrik masih disubsidi).

---

## 5. Glossary Document Baru

File: `docs/glossary.md` — sesuai permintaan Angga di Konteks 9.

Konten:
1. Konteks kelembagaan RS (sub-Satker, non-BLU)
2. Tabel akronim & istilah lokal (12 entries dari Konteks 9 + tambahan: Alsintor, Alkes, Alsatri, YANMASUM, BPJS, POK XDR)
3. Konvensi subkode internal:
   - Numerik (`.01`, `.02`) — universal
   - Alphabetic (`.A`/`.B`/`.C`) — **HANYA untuk Belanja Pengadaan** (Konteks 4)
   - Level 3 (`.A.001`) — siap kalau perlu (Konteks 5)
4. Daftar kode BAS yang TIDAK dipakai di RS Batin Tikal (525xxx, 521213, 521813)
5. Daftar kode tidak valid yang pernah dipakai + remap (521311, 521411, 53611)
6. Reference dokumen
7. Cara kontribusi glossarium


---

## 6. Pertanyaan untuk Angga (Validasi Round 3)

1. ⚠️ **Typo kode `53611`** di section BELAJA APLIKASI XDR (5-digit). Saya tebak harusnya `536111` (Belanja Modal Lainnya). Konfirmasi atau koreksi?
2. ⚠️ **`pagu-2025-modal` section `.B`** — saya lihat ada 2 hal di `.B`: ALKES (Tensimeter/Stetoskop dst di `.B.01-.04`) dan ALSATRI (kode `532111.B` baru, header section). Apakah sengaja `.B` shared, atau perlu split jadi `.B` Alkes vs `.C` Alsatri sesuai dokumentasi glossary?
3. ⚠️ **Honor nominal direvisi jadi monthly**: TKS 400jt → 33,3jt (÷12), Nakes 951jt → 79,2jt (÷12). Apakah ini revisi sengaja jadi monthly view, atau placeholder yang akan di-revisi lagi? Aggregator LRA biasanya pakai annual value.
4. ✅ **Glossary**: file `docs/glossary.md` siap. Mohon review + tambah istilah lokal yang belum captured.
5. ✅ **HITL dictionary expanded** dengan 5 pattern baru. Cek tabel di Section 4 — sesuai expectation Anda?


---

## 7. Roadmap Status

✅ **Sprint A** (3 commits) — Data model cleanup
✅ **Sprint B** Round 1+2+3 (8 commits total) — Whitelist BAS + HITL foundation
✅ **Sprint C** (5 commits) — Lattice enforcement
⏳ **Sprint D** (belum mulai) — Bucket bug fixes
⏳ **Sprint E** (belum mulai) — Documentation + LRA aggregator regression test (priority dari Angga)
📋 **Future** — HITL UI (Angga input via Settings tab langsung), Workflow approval Palembang gate