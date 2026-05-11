# Briefing — Input Data Pagu TA 2026 dengan SIKESUMA

**Untuk:** Tim Sie Renbang
**Dari:** dr Ferry
**Tanggal:** 11 Mei 2026
**Aplikasi:** SIKESUMA v3.1 — https://sikesumav31.vercel.app

---

## Selamat datang ke TA 2026

Mulai Mei 2026, SIKESUMA punya fitur baru: **Validator Engine** — asisten review otomatis yang bantu Sie Renbang cek input pagu **sebelum** revisi di-submit ke KPA. Tujuannya: tangkap kesalahan sejak input awal, bukan setelah laporan jadi terlanjur jalan.

Briefing 1-page ini adalah panduan praktis untuk input data TA 2026.

---

## 1. Cara baca dot warna di kolom Kode

Setiap baris pagu sekarang punya **dot kecil bulat di kolom Kode** (sebelah kode akun). Warna dot = status review otomatis dari aplikasi.

| Dot | Arti | Aksi Sie Renbang |
|---|---|---|
| *(tidak ada)* | Baris OK, lolos semua review | Lanjut input |
| 🔵 **Biru (PENDING)** | Metadata belum lengkap | Fill `kro_code` / `kegiatan_code` / `ro_code` — pakai "Terima Rekomendasi" |
| 🟡 **Amber (WARN)** | Ada peringatan, periksa detail | Klik dot → baca penjelasan → ambil keputusan |
| 🔴 **Merah (FAIL)** | Blocker — *tidak boleh* di-submit | Klik dot → baca pathway alternatif → **koordinasi dr Ferry** |

**Cara interaksi:**
- **Hover** dot → tooltip ringkasan muncul
- **Klik** dot → otomatis pindah ke tab "1.5 Validasi Revisi POK" + detail panel terbuka

*Catatan: dot ini terpisah dari dot Sprint D (BERTAMBAH/BERKURANG/BARU) yang sudah ada sebelumnya. Ada 2 dot berdampingan = normal.*

---

## 2. Cara fill metadata efektif

Aplikasi SIKESUMA punya **3 cara fill metadata** (informasi tambahan KRO / Kegiatan / RO yang diperlukan validator):

**Cara 1 — "Terima Rekomendasi" (paling cepat) 🚀**

Saat input baris baru:
1. Klik tombol **"Terima Rekomendasi"** di baris yang baru di-input
2. Aplikasi auto-suggest metadata dari kamus BAS
3. Accuracy 92% high confidence — biasanya langsung benar tanpa perlu edit
4. Kalau confidence-nya HIGH (hijau), boleh langsung trust rekomendasi

**Cara 2 — Manual edit ✏️**

Untuk baris yang Sie Renbang sudah tahu kode-nya dari Renlak Kakesdam:
1. Klik chevron `▶` di baris pagu (expand row)
2. Edit field `kro_code`, `kegiatan_code`, `ro_code`, `volume_ro`, `satuan_ro` langsung
3. Simpan dengan klik di luar field

**Cara 3 — Override Modal (untuk edge case khusus) ⚙️**

Untuk situasi rekomendasi MEDIUM/LOW confidence tapi Sie Renbang yakin dengan data:
1. Klik **Override** button di baris tersebut
2. Force confidence HIGH supaya validator anggap data sudah verified
3. Pakai hanya kalau benar-benar yakin — default-nya trust rekomendasi sistem

**Tips workflow practical:**
- ⚡ Fill metadata **sejak input awal**, jangan retrofit nanti — jauh lebih efisien
- 🔵 Dot biru = sinyal data incomplete → selesaikan dulu sebelum lanjut baris berikut
- ⚠️ Kalau dot biru bertahan setelah klik "Terima Rekomendasi" → kemungkinan kode tidak ada di kamus BAS → **koordinasi dr Ferry**

---

## 3. Kapan pakai pathway DIPA Halaman III vs Revisi POK

Ini bagian **paling penting** untuk hindari kesalahan kewenangan. Validator **C1 (Total Pagu Satker Net Change = 0)** akan kasih dot 🔴 MERAH kalau total pagu satker berubah.

**Decision tree:**

```
Mau revisi anggaran TA 2026?
│
├── 💡 Geser antar akun, TOTAL pagu satker TIDAK berubah?
│   └── YA → ✅ Revisi POK kewenangan KPA OK
│            (validator C1 = PASS)
│
└── 💡 TOTAL pagu satker berubah (tambah atau kurang)?
    │
    ├── Tambah pagu karena ekspansi layanan (mis. +Rp 1.7M
    │   untuk bedah saraf, alat baru, dll)?
    │   └── → ⚠️ DIPA Halaman III via KAPK Kakesdam II/Sriwijaya
    │         (validator C1 = FAIL — BUKAN revisi POK)
    │
    └── Kurang pagu karena efisiensi yang signifikan?
        └── → ⚠️ DIPA Halaman III juga
              (kewenangan KAPK, BUKAN KPA)
```

**Aturan dasar Pasal 22 huruf b angka 1 Perdirjen Renhan Kemhan 7/2025:**
Revisi POK kewenangan KPA **TIDAK BOLEH** mengubah total pagu satker. Hanya boleh geser antar akun selama total sama.

**Konkret untuk RS Batin Tikal:**

| Skenario | Pathway | Validator C1 |
|---|---|---|
| Geser dana belanja modal → belanja jasa, total sama | Revisi POK | ✅ PASS |
| Pindah jadwal pengeluaran (RPD), total sama | Revisi POK | ✅ PASS |
| Tambah pagu untuk Alsintor bedah saraf | DIPA Hal III | 🔴 FAIL |
| Tambah pagu BMHP karena pasien naik | DIPA Hal III | 🔴 FAIL |
| Efisiensi belanja signifikan, kurangi total pagu | DIPA Hal III | 🔴 FAIL |

**Kalau dot 🔴 MERAH muncul di C1:**

1. **Hover dot** → baca ringkasan
2. **Klik dot** → detail panel akan kasih informasi pathway alternatif
3. **Tanya dr Ferry** kalau ragu — **jangan submit dulu**
4. Pertimbangkan strategy:
   - Revisi sekarang via **DIPA Halaman III** (koordinasi KAPK Kakesdam)
   - Atau split jadi 2 revisi terpisah: **POK** untuk pergeseran + **DIPA Hal III** untuk perubahan total

---

## 4. Cara report bug atau confusion

Selama input TA 2026, kalau Sie Renbang menemukan:

- ❌ Aplikasi error / hang / crash
- 🤔 Dot warna tidak masuk akal (mis. PASS tapi data jelas salah)
- 🤖 Recommender suggest yang aneh
- 💡 Fitur yang Sie Renbang butuh tapi belum ada
- ✏️ Tipo di app text (mis. "BELAJA APLIKASI XDR" — typo masih ada di row 536111, perlu Sie Renbang fix manual jadi "BELANJA APLIKASI XDR")

**Format report sederhana ke dr Ferry (via WhatsApp / email):**

1. **Apa yang saya coba lakukan** — describe action
   *Contoh: "Mau input row baru pengadaan obat di pagu jasa"*
2. **Apa yang terjadi** — describe what happened
   *Contoh: "Setelah klik Terima Rekomendasi, dot tetap biru pending"*
3. **Apa yang saya harapkan** — describe expected behavior
   *Contoh: "Harusnya dot hilang atau jadi hijau setelah metadata terisi"*
4. **Screenshot kalau bisa** — visual evidence sangat membantu

dr Ferry akan koordinasi dengan tim AI development untuk fix:
- **Bug kecil** → hotfix langsung di production
- **Issue medium** → batch fix di siklus development berikutnya (Tier 4b)
- **Feature request** → backlog untuk planning future tier (4c, 5, dst.)

---

## Ringkasan praktis (cheat sheet)

| Item | Aksi |
|---|---|
| ✅ Mulai input TA 2026 | Boleh, aplikasi sudah ready |
| 🚀 Fill metadata cepat | Klik "Terima Rekomendasi" (92% akurat) |
| 🔵 Dot biru muncul | Metadata incomplete — fill dulu |
| 🟡 Dot amber muncul | Baca detail panel, ambil keputusan |
| 🔴 Dot merah muncul | **STOP** — mungkin perlu DIPA Hal III, koordinasi dr Ferry |
| 📝 Lihat overview status | Buka tab "1.5 Validasi Revisi POK" |
| 🐛 Report bug | Format 4-point ke dr Ferry |

**Aturan emas:** Kalau ragu, **jangan submit dulu** — koordinasi dengan dr Ferry. Validator engine ada untuk bantu, bukan menggantikan judgment manusia.

---

*Selamat input TA 2026. Aplikasi ini akan terus berkembang — feedback Sie Renbang penting untuk membuatnya lebih sesuai kebutuhan field.*

— Dr Ferry

---

**Versi dokumen:** 1.0 — 11 Mei 2026
**File path:** `docs/SIE-RENBANG-BRIEFING-TA2026.md`
**Update:** Akan di-update saat fitur baru (Tier 4b/4c) launch
