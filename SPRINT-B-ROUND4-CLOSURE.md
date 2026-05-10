# Sprint B Round 4 — Closure Note

**Tanggal:** 10 Mei 2026
**Trigger:** Konfirmasi final Angga (Sie Renbang) atas 5 pertanyaan validasi Round 3
**Status:** ✅ Sprint B fully closed — siap lanjut Sprint D atau Sprint E

---

## 1. Konfirmasi Angga atas Pertanyaan Round 3

| # | Pertanyaan Round 3 | Konfirmasi Angga |
|---|---|---|
| 1 | Typo `53611` → `536111` (Belanja Modal Lainnya)? | ✅ **Confirmed** — `536111` benar untuk Aplikasi XDR |
| 2 | `.B` shared antara Alkes & Alsatri — split jadi `.B` Alkes vs `.C` Alsatri? | ✅ **Confirmed** — `532111.C` benar untuk ALSATRI per glossary convention |
| 3 | Honor monthly nominal (1.4M → 119jt = ÷12) — sengaja atau placeholder? | ⏸ Tidak di-address (interpreted: accepted/intentional). Untuk LRA aggregator yang butuh annual values, akan dihandle di Sprint E regression test. |
| 4 | Glossary review — ada istilah lokal yang belum captured? | ✅ **No new terms** — file `docs/glossary.md` siap, no additions requested |
| 5 | HITL dictionary 5 pattern baru sesuai expectation? | ✅ **Confirmed** — sudah sesuai |

**Tambahan instruksi Angga:** "sementara fokus pada 1.1 Pagu Anggaran dulu" — confirms scope tetap di Pagu Anggaran (tab 1.1), tidak ekspansi ke tab 1.2 RAB review.

---

## 2. Aksi yang Dilakukan Round 4

### 2.1 Migrasi data live ke Supabase (2 mutations)

| Operation | Detail |
|---|---|
| `kode 53611 → 536111` | Row Aplikasi XDR di `pagu-2025-1778402148153/row-1778402221509-...`. Plus kode_bas null → 536111. |
| `kode 532111.B → 532111.C` | Row ALSATRI header di `pagu-2025-modal/row-1778402703532-...`. Kode_bas tetap 532111 (canonical 6-digit BAS). |

**Coverage final:** 59/61 rows (96%) have kode_bas. 2 sisa adalah orphan parent headers (`521311`, `521411`) yang tidak valid BAS by design.

### 2.2 Update dictionary internal

`utils/internalRecommendations.ts` — entry **PENGADAAN-MODAL-001** justification diperbarui dengan tag `KONFIRMASI ANGGA 10 Mei 2026`. Konvensi `.A`/`.B`/`.C` (Alsintor/Alkes/Alsatri) sekarang punya audit trail eksplisit dalam code.

---

## 3. Sprint B Final State

| Item | Commit | Status |
|---|---|---|
| **B.1** Seed BAS dictionary (4,314 codes) | `fd084ab` | ✅ |
| **B.2** Field `kode_bas` di PaguRow | `87638ff` | ✅ |
| **B.5** Rename linkedSectionId | `c263c28` | ✅ |
| **B.6** Autocomplete UI | `e36bb7d` | ✅ |
| **B.4** Backfill + corrigendum | `200f7c2` | ✅ |
| **B Round 2** Internal recommendations + HITL foundation | `f3ce491` | ✅ |
| **B Round 3** Expand HITL + glossary + Konteks 6 fix | `e30711f` | ✅ |
| **B Round 4** Konfirmasi Angga + .C convention + typo fix | (this commit) | ✅ |

**8 commits total**, fully merged ke main, pushed ke GitHub.

### Final HITL Dictionary State (14 entries)

Dictionary di `utils/internalRecommendations.ts` covers:
1. ATK-001 → 521811
2. JASA-RUJUKAN-001 → 521119 (jasa rekanan)
3. HONOR-001 → 521115 (continuous monthly)
4. BMHP-001 → 521811 (obat/bmhp/medis)
5. BMP-001 → 523122 (BBM Kemhan/TNI)
6. UTILITAS-001 → 522111 (Listrik, with subsidy note)
7. UTILITAS-002 → 522113 (Air)
8. UTILITAS-003 → 522112 (Internet/Telepon)
9. BPD-001 → 524111 (Perjalanan Dinas)
10. PENGADAAN-MODAL-001 → 532111 (with .A/.B/.C convention, ✅ KONFIRMASI ANGGA)
11. MODAL-LAINNYA-001 → 536111 (Aplikasi/Software, reject 53611 typo)
12. SERAGAM-001 → 521219 (Pakaian dinas)
13. OPERASIONAL-LAINNYA-001 → 521119 (reject 521112 yang Bahan Makanan)
14. BAHAN-MAKANAN-001 → 521112 (khusus makanan, bukan operasional)

### Final Pagu_sections State

- 9 active sections (4 dummy 2024 + 5 simplified 2025)
- 61 leaf rows total (was 40 di B.4 awal — Angga add 21 net positive)
- 59/61 (96%) rows have kode_bas
- 2 orphan parent headers stay null (kode 521311, 521411 invalid BAS)

---

## 4. Roadmap Status (Updated)

| Sprint | Status | Konten |
|---|---|---|
| ✅ Sprint A | Done (3 commits) | Data model cleanup |
| ✅ **Sprint B** | **Done (8 commits, 4 rounds)** | Whitelist BAS + HITL foundation + glossary |
| ✅ Sprint C | Done (5 commits) | Lattice enforcement |
| ⏳ Sprint D | Belum mulai | Bucket bug fixes — year handling, multi-year `paguByKode`, audit_log CRUD |
| ⏳ Sprint E | Belum mulai | Documentation + LRA aggregator regression (priority Angga) + audit doc original update |
| 📋 Sprint F (proposal) | Future | Workflow approval Palembang gate, HITL UI untuk Angga input langsung via Settings tab |

### Tab 1.2 RAB

Per instruksi Angga "sementara fokus pada 1.1 Pagu Anggaran dulu" — **tidak ekspansi ke RAB review** di sesi ini. Infrastructure HITL (autocomplete + recommendations) **sudah ready untuk diaktifkan di RAB** tinggal pass `description` prop saat Angga siap review tab 1.2.

---

## 5. Catatan untuk Sesi Berikutnya

1. **Tab 1.1 Pagu Anggaran** sudah stable. Final coverage 96% kode_bas. HITL dictionary 14 entries dengan justifikasi tertulis Angga + audit trail.

2. **Honor monthly nominal** belum di-address Angga di Round 4. Untuk LRA aggregator yang konvensional pakai annual values, akan di-handle dengan regression test Sprint E.

3. **Sprint D priorities:**
   - Year handling bug di `realisasiBucket.ts` line 153 (default `tahun=2025` saat selectedYear='ALL')
   - Multi-year `paguByKode` lookup (saat ini single-year saja)
   - Audit log CRUD (per Angga's Section 4 saran: IV-OVER-PAGU upgrade need override mechanism with audit_log)

4. **Sprint E priorities:**
   - LRA aggregator regression test (Angga's explicit concern di Section 4: angka LRA per Lampiran sebelum & sesudah B.4 backfill harus identik)
   - Update audit doc original `SIKESUMA-Audit-BAS-Konformitas.md` Section 1.2 + 3 dengan HB#1, HB#2, HB#3 corrections
   - Plus general docs cleanup

5. **PAT GitHub `<redacted: stored locally, not in git>`** masih aktif — silakan rotasi setelah Sprint E selesai sesuai rencana.

---

— Tim AI-Assisted Dev
Sprint B Round 4 closure — 10 Mei 2026
