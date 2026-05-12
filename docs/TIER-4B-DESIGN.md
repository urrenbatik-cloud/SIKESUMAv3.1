# Tier 4b Design Document — Revisi Mechanism Constraints

**Status:** 📋 DRAFT (Phase 1 deliverable, 11 Mei 2026)
**Sub-branch:** `feature/tier-4b-revisi-mechanism` (created from main `bdba7a1`)
**Owner Approval:** Pending review sebelum Phase 2a fixture start
**Predecessor:** Tier 4a MERGED ke main sebagai commit `abe193c` (C1-C5 + UI)

---

## 1. Scope — 4 Constraints C6 hingga C9

Per Pasal 22 Perdirjen Renhan 7/2025:

| ID | Title | Severity | Pasal |
|---|---|---|---|
| **C6** | Tidak Ubah Jenis Belanja (51/52/53/57) | blocker | Pasal 22 b angka 1 |
| **C7** | Tidak Ubah Sumber Dana | blocker | Pasal 22 b angka 1 |
| **C8** | Memperhatikan LHR APIP | blocker | Pasal 22 b angka 2 |
| **C9** | Tidak Boleh Akun Minus | blocker | Prinsip umum APBN |

Specs sudah established di `utils/validators/types.ts` CONSTRAINT_SPECS (Phase 1 Tier 4a). Phase 1 Tier 4b focus:
- Validate field shapes existing di `PaguRow` cukup
- Decide C8 LHR APIP storage shape (open item §0.9.5)
- Extend `ValidationContext` kalau perlu
- Plan implementation phases

---

## 2. Algorithm Specifications

### 2.1 C6 — Tidak Ubah Jenis Belanja

**Domain rule (Pasal 22 b angka 1):** Revisi POK kewenangan KPA tidak boleh menggeser dana antar-jenis belanja. Jenis belanja diidentifikasi dari **2-digit pertama** `kode_bas`:

| Prefix | Jenis Belanja |
|---|---|
| 51 | Belanja Pegawai |
| 52 | Belanja Barang |
| 53 | Belanja Modal |
| 57 | Belanja Bantuan Sosial |

**Algorithm (mirror C2/C3 grouping pattern):**

```
1. Collect changed leaves via helpers.collectChangedLeaves (R1)
2. Per changed leaf, derive jenis_belanja = kode_bas.slice(0, 2)
3. Group by jenis_belanja → distinct count
4. Status decision:
   - distinct ≤ 1 → 'pass'
   - distinct ≥ 2 → 'fail' (multiple jenis belanja terkena revisi = pergeseran antar-jenis)
   - any changed row missing kode_bas → 'pending' (R2 strict)
   - 0 changed leaves → 'pass' (no revisi terjadi)
```

**Field source:** `kode_bas?: string` (existing PaguRow field, Tier 3)

**Test fixture scenarios:**
- Pass: 3 changed rows semua jenis belanja "52" (geser antar-akun belanja barang)
- Fail: 2 changed rows, satu jenis "52" + satu "53" (pergeseran modal ke barang)
- Pending: 1 changed row jenis "52" + 1 changed row missing kode_bas
- Pass empty: 0 changed rows (no revisi)

### 2.2 C7 — Tidak Ubah Sumber Dana

**Domain rule (Pasal 22 b angka 1):** Tidak boleh ubah sumber pendanaan akun. Sumber dana ada di field eksplisit `sumber_dana_kode`:

| Code | Sumber Dana |
|---|---|
| RM | Rupiah Murni (APBN) |
| PNBP | Penerimaan Negara Bukan Pajak (BPJS, YANMASUM) |
| PHLN | Pinjaman/Hibah Luar Negeri |
| PLN | Pinjaman Luar Negeri |
| PDN | Pinjaman Dalam Negeri |
| SBSN | Surat Berharga Syariah Negara |
| HIBAH | Hibah |

**Algorithm (mirror C2/C3/C6 pattern):**

```
1. Collect changed leaves via helpers.collectChangedLeaves (R1)
2. Group by sumber_dana_kode → distinct count
3. Status decision:
   - distinct ≤ 1 → 'pass'
   - distinct ≥ 2 → 'fail'
   - any changed row missing sumber_dana_kode → 'pending' (R2 strict)
   - 0 changed leaves → 'pass'
```

**Field source:** `sumber_dana_kode?` (existing PaguRow field, Tier 3 typed union)

**Test fixture scenarios:**
- Pass: 3 changed rows semua sumber "RM"
- Fail: 2 changed rows, satu "RM" + satu "PNBP" (pergeseran antar-sumber)
- Pending: 1 changed row "RM" + 1 changed row missing sumber_dana_kode
- Pass empty: 0 changed rows

### 2.3 C8 — Memperhatikan LHR APIP

**Domain rule (Pasal 22 b angka 2 BARU):** User wajib explicit acknowledge sudah review LHR APIP (Laporan Hasil Reviu Aparatur Pengawas Internal Pemerintah) atas RKA TA berkenaan sebelum submit revisi.

**Algorithm (simple boolean acknowledgment):**

```
1. Read ctx.lhrApipAcknowledged (boolean, optional — field SUDAH ADA di types.ts)
2. Status decision:
   - lhrApipAcknowledged === true → 'pass'
   - lhrApipAcknowledged === false || undefined → 'pending'
     (BUKAN 'fail' — semantic: belum acknowledge, bukan violated)
3. No violations array — single yes/no state
```

**Field source:** `ValidationContext.lhrApipAcknowledged?: boolean` (sudah ada di types.ts dari Phase 1 Tier 4a forward-compatible placeholder).

**Test fixture scenarios:**
- Pass: ctx.lhrApipAcknowledged = true
- Pending: ctx.lhrApipAcknowledged = false (atau undefined)

### 2.4 C9 — Tidak Boleh Akun Minus

**Domain rule (Prinsip umum APBN):** Setelah revisi, total per akun tidak boleh negatif. Per types.ts spec: "Sanity check untuk catch data entry typo."

**Algorithm (per-leaf direct check):**

```
1. Collect ALL leaves via helpers.collectAllLeaves (BUKAN cuma changed)
2. Per leaf row: cek effectiveRevisi(row) < 0
3. Status decision:
   - 0 negative leaves → 'pass'
   - ≥1 negative leaves → 'fail' (each negative row = 1 violation)
4. No 'pending' state — kalau effective value 0 atau undefined, treat as 0 (≥0 OK)
```

**Field source:** `hargaSatuanRevisi * volume` via `helpers.effectiveRevisi` (Konteks 1 consistent).

**Test fixture scenarios:**
- Pass: all leaves jumlahBiayaRevisi ≥ 0
- Fail: 1 leaf dengan jumlahBiayaRevisi = -1000000 (typo)
- Pass edge: 1 leaf jumlahBiayaRevisi = 0 (boundary OK)

**Note:** Algorithm interpretation per-leaf (BUKAN net balance per kode akun). Rationale: scope original types.ts spec = "data entry typo sanity check". Net balance per kode akun = potential enhancement Tier 4c atau later.

---

## 3. Decisions S1-S6

| ID | Question | Default Recommendation | Owner Approve? |
|---|---|---|---|
| **S1** | C6 algorithm — grouping pattern? | **Group changed leaves by 2-digit kode_bas (mirror C2)** — consistent dengan R1-R2 Tier 4a | Pending |
| **S2** | C7 algorithm — grouping pattern? | **Group changed leaves by sumber_dana_kode (mirror C2/C6)** | Pending |
| **S3** | C8 LHR APIP storage shape? | **App-level state per year**: `lhrApipAcknowledgedByYear: Record<number, boolean>` di App.tsx. ValidationContext field `lhrApipAcknowledged?: boolean` **sudah ada** di types.ts dari Phase 1 Tier 4a (forward-compatible). UI: checkbox di Validasi tab header sebelum Submit button enabled. **In-memory v1** (lost on app restart) — persistence via Supabase = Tier 5 audit trail scope. | Pending |
| **S4** | C9 algorithm — per-leaf vs net balance? | **Per-leaf check** (effectiveRevisi(leaf) >= 0) — match types.ts spec "sanity check typo". Net balance = future enhancement | Pending |
| **S5** | Missing field handling C6/C7? | **Pending status** (R2 strict consistent) — ANY changed row missing grouping field → pending | Pending |
| **S6** | C8 persistence v1? | **In-memory only** saat session. App restart = re-confirm. Audit trail saat proper submission = Tier 5 scope. | Pending |

---

## 4. ValidationContext — Field Sudah Tersedia ✓

**Update Phase 1.5:** Field `lhrApipAcknowledged?: boolean` SUDAH ADA di `utils/validators/types.ts` ValidationContext (added saat Phase 1 Tier 4a sebagai forward-compatible placeholder).

Current interface (types.ts existing):
```typescript
export interface ValidationContext {
  /** Tahun Anggaran target validation */
  ta: number;
  /** Sections data untuk TA target */
  sections: PaguSection[];
  /** Optional: cross-year sections kalau validator butuh comparison */
  allSectionsByYear?: Record<number, PaguSection[]>;
  /** Optional: rpds data untuk C11 cross-table check (Tier 4c) */
  rpdsData?: unknown[];
  /** Optional: LHR APIP acknowledgment untuk C8 (Tier 4b) */
  lhrApipAcknowledged?: boolean;  // ← USE INI untuk C8
  /** Optional: SBM dictionary untuk C10 (Tier 4c) */
  sbmDictionary?: unknown;
  /** Evaluation timestamp untuk C12 deadline check */
  evaluatedAt?: Date;
}
```

**Phase 1.5 conclusion:** **Zero type changes needed.** Tier 4a forward-compatible design already anticipated this. C8 validator just reads `ctx.lhrApipAcknowledged`.

---

## 5. UI Integration Plan (Phase 3 of Tier 4b)

Mirror Tier 4a Phase 3 pattern. **Substantial scope lebih ringan** karena infrastructure sudah ada (dashboard, cards, inline indicators, navigation).

### 5.1 Dashboard cards transition

Saat Tier 4b merged:
- Cards C6 + C7 + C8 + C9 transition dari `todo` state ke live state
- Sub-branch group "4b — Revisi Mechanism" change subtitle dari "BELUM TERSEDIA" ke "IMPLEMENTED"
- Aggregate counter: implemented 5/12 → 9/12
- Progress bar update

Implementation: cuma update `runAllValidators.ts` — hapus C6/C7/C8/C9 dari `PENDING_CONSTRAINTS` map (set ke `null`). Automatic — dashboard rendering logic sudah forward-compatible.

### 5.2 LHR APIP checkbox UI (NEW UX element)

Tambah di `ValidationDashboardHeader.tsx`:

```
┌──────────────────────────────────────────────────────────────────┐
│ STATUS VALIDASI REVISI POK TA 2026                               │
│ [counter chips...]                                                │
│ [progress bar...]                                                 │
│                                                                  │
│ ☐ Saya konfirmasi sudah review LHR APIP atas RKA TA 2026         │
│   sebelum mengajukan revisi POK kewenangan KPA                   │
│                                                                  │
│ Last validated: 2 menit lalu          [⟳ Validate Now]            │
│ [📋 Submit Revisi POK]                                            │
└──────────────────────────────────────────────────────────────────┘
```

State management:
- Checkbox di header → onChange → propagate ke App.tsx state setter
- App.tsx holds `lhrApipConfirmedByYear: Record<number, boolean>`
- Pass via ValidationContext.lhrApipConfirmed saat runAllValidators called
- C8 validator return PASS kalau true, PENDING kalau false/undefined

### 5.3 Inline indicators (no change needed)

C6/C7/C9 violations punya `affectedRowIds` populated → automatic show inline dot di Pagu Anggaran tab via existing `rowConstraintMap.ts` helper. No code change needed.

C8 tidak punya affectedRowIds (global flag) → tidak muncul inline indicator. Hanya muncul di dashboard card.

### 5.4 Phase 3 sub-phases (estimated turns)

| Sub-phase | Deliverable | Turns |
|---|---|---|
| 3a (design) | Brief design extension doc (incremental dari TIER-4A-PHASE-3-UI-DESIGN.md) | 0.5 |
| 3b (cards live) | runAllValidators.ts update + minor UI label adjustments | 1 |
| 3c (LHR checkbox) | ValidationDashboardHeader.tsx checkbox + App.tsx state wiring | 1 |
| 3d (integration) | E2E test + docs sync | 0.5 |

**Total Phase 3 estimate:** 3 turns (lebih ringan dari Tier 4a yang 4-5 turn — Phase 1 Tier 4a butuh design from scratch, Tier 4b cuma incremental extension).

---

## 6. Implementation Phase Plan

Mirror Tier 4a pattern dengan 4 Phase 2b turns (1 validator per turn untuk reviewability):

| Phase | Deliverable | Estimated Turns |
|---|---|---|
| **Phase 1 (this doc)** | Design + types.ts ValidationContext extension | 1 |
| **Phase 2a** | Fixture C6-C9 scenarios (`validation-scenarios-4b.json`) | 1 |
| **Phase 2b Turn 1** | C6 Jenis Belanja validator + tests | 1 |
| **Phase 2b Turn 2** | C7 Sumber Dana validator + tests | 1 |
| **Phase 2b Turn 3** | C9 Akun Minus validator + tests (simplest, sandwich middle) | 1 |
| **Phase 2b Turn 4** | C8 LHR APIP validator + tests | 1 |
| **Phase 3a-3d** | UI integration | 3 (estimated) |
| **Phase 4** | Owner E2E test → squash merge ke main | 1 |
| **TOTAL** | | **~10 turns** |

**Alternative — batch validators (faster, lower review granularity):**
- Phase 2b Turn 1 batch: C6 + C7 (similar grouping pattern, ~50 tests combined)
- Phase 2b Turn 2 batch: C8 + C9 (different patterns, ~30 tests combined)
- Saves ~2 turns

**Recommendation:** Tetap 1-validator-per-turn (preserve reviewability). 10 turns ≈ 1 efficient session.

---

## 7. Existing Field Coverage Check

| Constraint | Field Required | PaguRow Field | Status |
|---|---|---|---|
| C6 | jenis belanja (2-digit kode_bas) | `kode_bas?: string` | ✅ Ready (derived) |
| C7 | sumber dana | `sumber_dana_kode?: 'RM'\|'PNBP'\|'PHLN'\|'PLN'\|'PDN'\|'SBSN'\|'HIBAH'\|string` | ✅ Ready (typed) |
| C8 | LHR APIP confirmed | ValidationContext.lhrApipConfirmed (new) | ⚠️ Add S3 decision |
| C9 | jumlahBiayaRevisi >= 0 | `jumlahBiayaRevisi: number` + helpers.effectiveRevisi | ✅ Ready |

**Conclusion:** Hanya 1 type addition needed (ValidationContext.lhrApipConfirmed). Zero DDL. Zero PaguRow field migration.

---

## 8. Open Items Carried Forward dari Tier 4a

Per SSOT §0.9.5, items relevant ke Tier 4b implementation:

| Item | Action di Tier 4b |
|---|---|
| C1 violation message UX enhancement | Bisa di-batch sebagai enhancement turn — saat C1 FAIL detected, tambah guidance text ke DIPA Hal III pathway. ~30 min work. |
| Konteks 1 finding PaguAnggaran:50-51 | NOT in scope Tier 4b — pre-existing TD, address separately |

**C1 enhancement scope decision** untuk turn ini:
- **Option A:** Batch C1 message enhancement di Phase 2b Turn 1 atau Turn 2 (sekalian editing validators). +15 min effort.
- **Option B:** Defer to dedicated enhancement turn post-Tier 4b merge.
- **Default rekomendasi: Option A** — batch saat memang sedang touch validator files.

---

## 9. Cross-References

- Architecture parent: `docs/TIER-4-DESIGN.md` §2 (sub-branch strategy) + §3.2 (C6-C9 specs canonical)
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (12 constraints) + §3.5 (skema akun sama)
- Tier 4a predecessor: `docs/TIER-4A-PHASE-3-UI-DESIGN.md` (UI design baseline)
- Decisions log: `SSOT-REFACTOR-LOG.md` §0.9.5 (open items inherited)
- Validator pattern reference: `utils/validators/c2.ts` (C6 + C7 mirror this), `c5.ts` (C9 leaf iteration pattern reference)
- Helpers reuse: `utils/validators/helpers.ts` (collectAllLeaves, collectChangedLeaves, isChangedRow, effectiveRevisi)

---

## 10. Phase 1 Action Items (THIS phase)

If all S1-S6 default decisions approved by Owner, this Phase 1 turn implements:

1. ✅ Branch `feature/tier-4b-revisi-mechanism` created (done)
2. ⏳ types.ts — extend ValidationContext dengan `lhrApipConfirmed?: boolean`
3. ⏳ SSOT-REFACTOR-LOG.md §0.10 — open new section untuk Tier 4b decisions (S1-S6)
4. ⏳ Commit + push Phase 1

Phase 2a (fixture) + Phase 2b (validators) menyusul setelah S1-S6 approved.

---

*Phase 1 design draft — 11 Mei 2026. Pending Owner review + answer S1-S6 sebelum types extension + Phase 2a fixture start.*
