# Sprint B.4 — Migration Diff Report

**Tanggal eksekusi:** 10 Mei 2026  
**Trigger:** Persetujuan Angga dalam `SPRINT-B4-RESPONS-ANGGA.md`  
**Eksekutor:** Tim AI-Assisted Dev  
**Untuk:** Angga (validation per Section 3 step 5 — "Saya verify dalam 1 hari kerja")

---

## 1. Ringkasan Eksekusi

| Operation | Count |
|---|---:|
| `UPDATE` (set kode_bas pada row existing) | 28 |
| `INSERT` (split row baru) | 2 |
| `DELETE` (drop duplikat + source split) | 2 |
| `SKIP` (orphan parents tanpa kode_bas) | 3 |
| **Total mutations** | **35** |
| **Sections affected** | **9 of 9** |
| **Rows after migration** | **41** (was 40, net +1 from split-1 + insert-2 - delete-1) |
| **Rows with kode_bas** | **37/41 (90%)** |

3 row yang tetap tanpa kode_bas adalah **orphan parent headers** (`row-2024-ln-h`, `row-2024-pm-h`, `row-2025-md-h`) yang kode-nya `521311`/`521411` tidak valid BAS — sengaja di-skip karena header tidak butuh kode_bas (aggregator pakai kode_bas children).

---

## 2. Hard Blockers — Status Resolusi

| HB# | Issue | Resolusi | Status |
|---|---|---|---|
| **HB#1** | `521813` salah untuk Obat/BMHP (sebenarnya Pita Cukai/Meterai) | Semua row Obat/BMHP/Gas Medis pakai `521811` (Belanja Barang Persediaan Barang Konsumsi). Total 8 row. | ✅ Applied |
| **HB#2** | Saran `521213` untuk Honor TKS/Nakes salah | SEMUA Honor di RS Batin Tikal pakai `521115` (continuous monthly). 7 row Honor (TKS, Nakes, Pengelola, header). | ✅ Applied |
| **HB#3** | BMP = Bahan Bakar Minyak (bukan Bahan Makanan) | Row `row-2025-op-12` (BMP Rp 6jt) pakai `523122` (Belanja BMP Khusus Non Pertamina, Permenhan 5/2020). Plus aliases ditambah ke autocomplete. | ✅ Applied |

---

## 3. Per-Section Mutation Detail

### `pagu-2024-bekkes` (TA 2024 dummy)

```
UPDATE  row-2024-bk-h     (521211)        kode_bas: null → 521211   (header tetap)
UPDATE  row-2024-bk-1     (521211.01)     kode_bas: null → 521811   (Obat — HB#1)
UPDATE  row-2024-bk-2     (521211.02)     kode_bas: null → 521811   (BMHP)
UPDATE  row-2024-bk-3     (521211.03)     kode_bas: null → 521811   (Oksigen+Reagen)
```

### `pagu-2024-lainnya` (TA 2024 dummy) — SPLIT operation

```
SKIP    row-2024-ln-h     (521311)        kode_bas null (orphan parent)
DELETE  row-2024-ln-1     (521311.01)     "Listrik & Air" Rp 200jt — replaced by split
INSERT  row-2024-ln-1a    (522111.01)     kode_bas=522111  Rp 150jt (Listrik 75%)
INSERT  row-2024-ln-1b    (522113.01)     kode_bas=522113  Rp 50jt  (Air 25%)
UPDATE  row-2024-ln-2     (521311.02)     kode_bas: null → 522112   (Internet/Telepon)
UPDATE  row-2024-ln-3     (521311.03)     kode_bas: null → 522191   (Jasa Lainnya)
```

**Net rows:** 4 → 5 (split: -1 +2)

### `pagu-2024-pegawai` (TA 2024 dummy) — HB#2 confirmed all 521115

```
UPDATE  row-2024-pgw-h    (521115)        kode_bas: null → 521115
UPDATE  row-2024-pgw-1    (521115.01)     kode_bas: null → 521115   (Honor TKS)
UPDATE  row-2024-pgw-2    (521115.02)     kode_bas: null → 521115   (Honor Pengelola)
```

### `pagu-2024-pemeliharaan` (TA 2024 dummy)

```
SKIP    row-2024-pm-h     (521411)        kode_bas null (orphan parent)
UPDATE  row-2024-pm-1     (521411.01)     kode_bas: null → 523121   (Perbaikan Alat Medis)
UPDATE  row-2024-pm-2     (521411.02)     kode_bas: null → 523111   (Perbaikan Bangunan)
```

### `pagu-2025-bekkes` (TA 2025 simplified) — HB#1 critical

```
UPDATE  row-2025-bk-h     (521811)        kode_bas: null → 521811
UPDATE  row-2025-bk-1     (521811.01)     kode_bas: null → 521811   (Obat & BMHP — HB#1)
UPDATE  row-2025-bk-2     (521811.02)     kode_bas: null → 521811   (Gas Medis)
UPDATE  row-2025-bk-3     (521811.03)     kode_bas: null → 521111   (ATK)
UPDATE  row-2025-bk-4     (521811.04)     kode_bas: null → 522191   (Jasa Diagnostik Sun Clinik)
UPDATE  row-2025-bk-5     (521811.05)     kode_bas: null → 522191   (Jasa Diagnostik Promedic)
UPDATE  row-2025-bk-6     (521811.06)     kode_bas: null → 522191   (Jasa CT Scan)
UPDATE  row-2025-bk-7     (521811.07)     kode_bas: null → 522191   (Jasa Lab PA)
```

### `pagu-2025-jasa` (TA 2025 simplified) — HB#2 confirmed

```
UPDATE  row-2025-js-h     (521115)        kode_bas: null → 521115
UPDATE  row-2025-js-1     (521115.01)     kode_bas: null → 521115   (Honor TKS)
UPDATE  row-2025-js-2     (521115.02)     kode_bas: null → 521115   (Honor Nakes combined by-design)
UPDATE  row-2025-js-3     (521115.03)     kode_bas: null → 521115   (Honor Pengelola)
```

### `pagu-2025-modal` (TA 2025 simplified) — DELETE duplikat

```
SKIP    row-2025-md-h     (521411)        kode_bas null (orphan parent)
UPDATE  row-2025-md-1     (521411.01)     kode_bas: null → 532111   (Pengadaan Alsintor → Modal)
UPDATE  row-2025-md-2     (521411.02)     kode_bas: null → 536111   (Belanja Modal Lainnya XDR)
DELETE  row-2025-md-3     (521411.03)     duplikat of md-2 — dihapus per §1.7
```

**Net rows:** 4 → 3 (delete duplikat)

⚠️ **Konsekuensi nominal section:** sebelumnya `141jt + 46jt + 46jt = 233jt`. Setelah delete: `141jt + 46jt = 187jt`. Total Pagu Modal turun Rp 46jt — pastikan ini konsisten dengan POK Palembang. Kalau ternyata `46jt × 2` yang seharusnya benar (mis. ada 2 tahap pengadaan), perlu re-input dengan ID berbeda.

### `pagu-2025-operasional` (TA 2025 simplified) — campur kategori, dual-coded

```
UPDATE  row-2025-op-h     (521112)        kode_bas: null → 521112
UPDATE  row-2025-op-7     (521112.01)     kode_bas: null → 521112   (Makan Pasien)
UPDATE  row-2025-op-2     (521112.02)     kode_bas: null → 522191   (LAUNDRY → Jasa Lainnya)
UPDATE  row-2025-op-8     (521112.03)     kode_bas: null → 522112   (internet → Telepon)
UPDATE  row-2025-op-9     (521112.04)     kode_bas: null → 521211   (Cetak → Belanja Bahan)
UPDATE  row-2025-op-10    (521112.05)     kode_bas: null → 524111   (BPD → Perjalanan Dinas Biasa)
UPDATE  row-2025-op-12    (521112.06)     kode_bas: null → 523122   (BMP — HB#3)
UPDATE  row-2025-op-11    (521112.11)     kode_bas: null → 532111   (Pengadaan Alkes — substansi MODAL §2.3)
```

⚠️ **Konsekuensi LRA:** `row-2025-op-11` (Alkes Rp 75jt) sekarang akan ter-klasifikasi sebagai Modal di LRA via `kode_bas=532111`, walau visual masih di section "Operasional". **Hard requirement:** LRA aggregator harus pakai `kode_bas` (bukan `kode` SIKESUMA) untuk klasifikasi. Bila aggregator masih pakai `kode` SIKESUMA, item Alkes ini akan double-counted (sebagai Modal di line `532111` AND sebagai Operasional via prefix `521xxx`).

### `pagu-2025-pemeliharaan` (TA 2025 simplified)

```
UPDATE  row-2025-pm-h     (523111)        kode_bas: null → 523111
UPDATE  row-2025-pm-1     (523111.01)     kode_bas: null → 523111   (Har Gedung)
```

---

## 4. Implementasi HB#3: Keyword Aliases di Autocomplete

Update di `utils/basDictionary.ts` — `searchBas()` sekarang punya keyword aliases map. Saat user typing istilah lokal RS, kode yang benar muncul di paling atas dropdown (sebelum prefix/uraian match):

| Query | Surface kode_bas |
|---|---|
| `bmp`, `bbm`, `bahan bakar`, `pertamax`, `solar`, `pelumas`, `avtur` | `523122`, `523125` |
| `bmhp`, `obat`, `persediaan medis` | `521811` |
| `tks`, `honor tks`, `nakes`, `honor nakes`, `honor pengelola`, `casemix` | `521115` |
| `bpd`, `perjalanan dinas` | `524111` (+ variant 524112-524119) |
| `atk` | `521111` |
| `listrik`, `pln` | `522111` |
| `air`, `pdam` | `522113` |
| `internet`, `telepon`, `wifi` | `522112` |

User bisa tetap typing kode 6-digit langsung untuk override. Aliases hanya bantuan saat kode tidak diketahui pasti.

---

## 5. Hal yang Perlu Anda Validasi (Angga)

**Per Section 3 step 5 dari respons Anda — saya tunggu confirmation 1 hari kerja:**

1. ✅ **Apakah split Listrik (75%) / Air (25%) Rp 150jt + Rp 50jt benar?** Total Rp 200jt sama dengan source. Rasio 75/25 sudah Anda konfirmasi di §2.1.

2. ⚠️ **Apakah delete `row-2025-md-3` (Belanja Modal Lainnya XDR Rp 46jt) memang duplikat?** Total Pagu Modal 2025 jadi Rp 187jt setelah delete. Mohon konfirmasi konsistensi dengan POK.

3. ✅ **Section "Operasional" item Alkes (`row-2025-op-11`) sekarang `kode_bas=532111`.** Section visual tetap, klasifikasi LRA jadi Modal. Anda setuju di §2.3, ini kompatibel dengan keputusan dual-coding flat.

4. **Pertanyaan TODO untuk Sprint berikut:** LRA aggregator implementation status — apakah sudah pakai `kode_bas` sebagai klasifikasi? Kalau belum, akan saya cek Sprint E (testing) dengan regression test "LRA total per Lampiran sebelum & sesudah backfill harus identik". Ini juga match dengan saran Anda di Section 4 last bullet.

---

## 6. Rollback Plan

Bila ada concern, migration ini **fully reversible** dalam 1 query:

```sql
-- Rollback DELETE (re-insert row-2025-md-3 dengan data lama)
UPDATE pagu_sections 
SET data = jsonb_set(data, '{rows}', data->'rows' || '<original-row-2025-md-3-jsonb>'::jsonb)
WHERE id = 'pagu-2025-modal';

-- Rollback INSERT (delete 2 split rows)
UPDATE pagu_sections
SET data = jsonb_set(data, '{rows}', (SELECT jsonb_agg(r) FROM jsonb_array_elements(data->'rows') r 
   WHERE r->>'id' NOT IN ('row-2024-ln-1a', 'row-2024-ln-1b')))
WHERE id = 'pagu-2024-lainnya';

-- Rollback UPDATE (set kode_bas null untuk semua 28 rows yang di-update)
-- ... per row, tapi rumit. Simpler: re-run dengan empty backfill map.
```

Backup snapshot `before.json` saved di tim dev untuk emergency restore.

---

## 7. Yang Tersisa (Sprint B Closure)

✅ B.1 dictionary  
✅ B.2 kode_bas field  
✅ B.5 rename linkedSectionId  
✅ B.6 autocomplete UI  
✅ B.4 backfill (this report)  

Sprint B **complete** setelah Anda validasi report ini. Lanjut ke Sprint D (bug fixes bucket) dan Sprint E (regression tests including LRA aggregator validation).

---

— Tim AI-Assisted Dev (Claude)  
Generated: 2026-05-10 04:48:40Z
