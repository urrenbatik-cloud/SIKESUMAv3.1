# Tier 4c Design Document — Procedural & References Constraints

**Status:** 📋 DRAFT (Pre-Tier-4c planning, 11 Mei 2026)
**Predecessor:** Tier 4b MERGED ke main `d13be80` (Phase 4 complete + consistency sync `7f23ae0`)
**Sub-branch target:** `feature/tier-4c-procedural-references` (NOT YET CREATED — pending Owner approve scope)
**Companion docs:** `docs/TIER-4-DESIGN.md` §3.3 (Tier 4c master spec) + `docs/TIER-4B-DESIGN.md` (pattern reference)

---

## 1. Scope — Final 3 Constraints + 1 Pre-existing TD

Tier 4c menyelesaikan **3 dari 12 constraints terakhir** plus address **1 pre-existing TD** dari Sprint D Item #1.

| Item | Severity | Pattern | Reference |
|---|---|---|---|
| **C10 Sesuai SBM/SBK** | 🟡 **WARNING** (first warn severity validator!) | Per-row deviasi % check | PMK Standar Biaya tahunan (eksternal) |
| **C11 Tidak Ubah Hal III DIPA (RPD)** | 🔴 BLOCKER | Cross-table check Pagu ↔ RPD | Lampiran I Bagian 5 kode 5.d |
| **C12 Deadline 27 Desember** | 🔴 BLOCKER | Date comparison (TRIVIAL) | Pasal 24 ayat (11) huruf d; Lampiran I 5.d |
| **Konteks 1 TD** | Bug fix | UI display logic | `PaguAnggaran.tsx:50-51` (pre-existing) |

Setelah Tier 4c merged: **12 of 12 validators implemented**. Submit Revisi POK button **finally enables**. Tier 5 audit trail jadi clear next priority.

---

## 2. Algorithm Specifications

### 2.1 C12 — Deadline 27 Desember (Simplest — Implementation Order #1)

**Domain rule (Pasal 24 ayat 11 huruf d):** Revisi POK kewenangan KPA harus diajukan **sebelum 27 Desember TA berkenaan**. Setelah deadline, revisi harus dilakukan untuk TA berikutnya.

**Algorithm (date comparison):**

```
1. Read evaluatedAt = ctx.evaluatedAt ?? new Date() (browser timezone WIB)
2. Compute deadline = new Date(`${ctx.ta}-12-27T00:00:00`)
3. Status decision:
   - evaluatedAt < deadline → 'pass'
   - evaluatedAt >= deadline → 'fail'
4. Violation message: cite Pasal + action guidance ("ajukan untuk TA berikutnya")
```

**No 'pending' state** — date selalu defined. No sections traversal — procedural check seperti C8.

**Field source:** `ctx.evaluatedAt` (sudah ada di ValidationContext) + `ctx.ta` (sudah ada).

**Complexity:** TRIVIAL — paling sederhana dari 3 Tier 4c.

**Test fixture scenarios:**
- Pass: evaluatedAt = 2026-06-15 (before deadline)
- Pass: evaluatedAt = 2026-12-26T23:59:59 (one second before)
- Fail: evaluatedAt = 2026-12-27T00:00:00 (exactly at deadline)
- Fail: evaluatedAt = 2026-12-31 (after deadline)
- Pass: evaluatedAt = 2027-01-01 dengan ctx.ta=2027 (new year, new TA)

### 2.2 C10 — Sesuai SBM/SBK (Medium — Implementation Order #2)

**Domain rule (PMK Standar Biaya):** Tarif `hargaSatuanRevisi` harus dalam tolerance terhadap Standar Biaya Masukan (SBM) atau Standar Biaya Keluaran (SBK) yang ditetapkan PMK tahunan.

**Algorithm (V1 simplified per Decision T2 default — hsa-as-baseline-proxy):**

```
1. Collect ALL leaf rows via helpers.collectAllLeaves
   (Tidak filter changed — sanity check semua row terhadap SBM baseline)
2. Per leaf row:
   - baseline = hargaSatuanAwal (assume Semula = SBM-compliant baseline)
   - revisi = hargaSatuanRevisi (kalau 0, skip — no revisi to check)
   - Skip if baseline == 0 (cannot compute deviasi)
   - deviasi_pct = abs((revisi - baseline) / baseline) * 100
3. Status decision per row:
   - deviasi_pct <= warnThreshold (default 10%) → no violation
   - warnThreshold < deviasi_pct <= failThreshold (default 25%) → WARN
   - deviasi_pct > failThreshold (default 25%) → fail
4. Final status:
   - 0 warn + 0 fail → 'pass'
   - ≥1 warn AND 0 fail → 'warn' (overall WARN — first warning-status validator!)
   - ≥1 fail → 'fail'
```

**Field source:** `hargaSatuanAwal` + `hargaSatuanRevisi` (existing PaguRow base fields). Tidak butuh Tier 3 metadata.

**Important:** C10 is the **first validator dengan WARNING severity**. Existing UI infrastructure (Tier 4a Phase 3) sudah support 'warn' state untuk cards — amber border. Validation engine sudah handle warn in result.warnCount.

**Decision T2 — Threshold values:**
- Default warn threshold: **10%** (catch most data entry errors)
- Default fail threshold: **25%** (significant deviation, likely wrong baseline)
- Justifiable values — kalau Owner mau tighten/loosen, adjust di types.ts CONSTRAINT_SPECS.

**Test fixture scenarios:**
- Pass: hsa=100, hsr=105 (5% deviasi → safe)
- Warn: hsa=100, hsr=115 (15% deviasi → warn)
- Fail: hsa=100, hsr=130 (30% deviasi → fail)
- Skip: hsa=100, hsr=0 (no revisi)
- Skip: hsa=0, hsr=100 (no baseline)
- Boundary: hsa=100, hsr=110 (exactly 10% — edge case)
- Multi-row: mix pass/warn/fail untuk verify per-row aggregation

### 2.3 C11 — Tidak Ubah Hal III DIPA / RPD (Most Complex — Implementation Order #3)

**Domain rule (Lampiran I Bagian 5 kode 5.d):** Revisi POK tidak boleh mengubah RPD (Rencana Penarikan Dana — distribusi bulanan di Halaman III DIPA). Jika berubah, harus naik ke revisi DIPA Halaman III (proses berbeda, kewenangan KAPK/Eselon I).

**Algorithm (V1 simplified per Decision T3 default — flag affected RPD rows):**

```
1. Collect changed pagu leaves via helpers.collectChangedLeaves
2. Build RPD lookup map: for each ctx.rpdsData section,
   key = `${rpd.linkedPaguSectionId}:${rpdRow.kode}`
3. Per changed pagu leaf:
   - paguKey = `${pagu.sectionId}:${pagu.kode}`
   - Lookup RPD: if rpdMap[paguKey] exists → affected
4. Status decision:
   - 0 affected RPD rows → 'pass' (revisi tidak menyentuh RPD)
   - ≥1 affected → 'fail' (RPD akan butuh update → eskalasi Hal III DIPA)
5. Pending state:
   - ctx.rpdsData undefined → 'pending' (no RPD context available)
```

**Field source:**
- `ctx.rpdsData?: RPDSection[]` (sudah ada di ValidationContext sebagai `unknown[]` placeholder — perlu narrow type ke `RPDSection[]` di Phase 1.5)
- `RPDSection.linkedPaguSectionId` (FK ke PaguSection.id)
- `RPDRow.kode` (matching key dengan PaguRow.kode)

**Architectural finding (critical):** `RPDRow.monthly` adalah **SINGLE snapshot** (no Awal/Revisi separation per Sprint A2). Ini menyederhanakan algoritma — V1 cuma deteksi "affected" tanpa numerical sum verification.

**V2 strict (Decision T3 future enhancement):**
- Per affected RPD row, compute sum(monthly) vs effectiveRevisi(pagu_row)
- Mismatch → fail; match → pass (assume user sudah update RPD)
- Lebih akurat tapi require RPD update tracking di Tier 5

**Test fixture scenarios:**
- Pass: 2 changed pagu leaves, ZERO matching RPD rows → pergeseran isolated dari RPD
- Fail: 1 changed pagu leaf, 1 matching RPD row → eskalasi triggered
- Fail multi: 3 changed pagu leaves, 2 matching RPD rows → list both affected
- Pending: ctx.rpdsData undefined → pending
- Pass: 0 changed leaves → vacuous pass

**Unique UX requirement (Phase 3c — Cross-Tab Navigation):**

C11 violation menyebutkan affected RPD rows. **Detail panel button "→ Pagu Anggaran" tidak cukup** — user perlu opsi navigate ke **RPD tab (1.3)** untuk verify RPD distribution yang akan terdampak.

Required refactor:
- `onNavigateToPagu` signature extend → `onNavigate(target: 'pagu' | 'rpd', sectionId, rowId)`
- App.tsx route ke `SubTab.RPD` saat target='rpd'
- DetailPanel render dual buttons untuk C11 specifically

---

## 3. Decisions T1-T8

### T1 — C12 timezone handling (Q4 dari sebelumnya)

| Option | Description | Recommendation |
|---|---|---|
| **T1a** Client `new Date()` (browser WIB) | Default JS behavior, simple | **Default rekomendasi** |
| T1b | Server-side Supabase UTC timestamp | More authoritative but butuh API call |
| T1c | Force `Asia/Jakarta` conversion via `Intl.DateTimeFormat` | Defensive against laptop timezone bugs |

**Default:** T1a — browser WIB. v1 simplification. Tier 5 audit trail akan capture server timestamp untuk audit purposes.

### T2 — C10 SBM dictionary shape (Q2 dari sebelumnya)

| Option | Description | Pro/Con |
|---|---|---|
| T2a | Hardcoded threshold per BAS code | Adaptive per akun, but data entry overhead |
| **T2b** Use `hargaSatuanAwal` as SBM baseline proxy | Pragmatic, leverages existing data | **Default rekomendasi** |
| T2c | Full SBM lookup table di Supabase | Authoritative tapi butuh DDL + PMK data entry |

**Default:** T2b — `hsa` sebagai baseline. Assume kalau row di-input ke pagu, baseline-nya sudah PMK-compliant (Sie Renbang sebelumnya validate manual). Revisi yang significantly deviates dari Semula likely typo atau real anomaly worth flagging.

### T3 — C11 cross-table diff depth (Q3 dari sebelumnya)

| Option | Description | Complexity |
|---|---|---|
| **T3a** V1 simplified — flag affected RPD rows | Detect existence of linked RPD | **Default rekomendasi** |
| T3b | V2 strict — numerical sum check | Compute sum(monthly) vs revisi, detect mismatch |
| T3c | V3 full — detection + remediation guide | Suggest monthly re-distribution preserving pattern |

**Default:** T3a — flag affected. Sufficient untuk "warn user before submit" goal. V2/V3 future enhancement saat Tier 5 audit trail track RPD update workflow.

### T4 — C10 threshold values (NEW)

| Threshold | Default | Rationale |
|---|---|---|
| Warn threshold | **10%** | Catch most data entry errors without false positives |
| Fail threshold | **25%** | Significant deviation, likely wrong baseline atau real anomaly |

**Default:** 10% / 25%. Adjustable di types.ts kalau Sie Renbang feedback indicate too tight/loose.

### T5 — C11 RPD link resolution method (NEW)

| Method | Description | Tradeoff |
|---|---|---|
| **T5a** Section link only | Match `linkedPaguSectionId` + `kode` exact | Strict, fewer false positives |
| T5b | Code-based fuzzy | Match `kode` prefix (ignore sub-akun) | More forgiving, may over-flag |

**Default:** T5a — strict match. Kalau Sie Renbang report missed cases, adjust later.

### T6 — C12 violation message wording (NEW)

**Default message template:**
> "Tanggal pengajuan {date} ≥ deadline TA {ta} (27 Desember {ta}). Revisi POK kewenangan KPA harus diajukan **sebelum 27 Desember TA berkenaan** (Pasal 24 ayat 11 huruf d Perdirjen Renhan 7/2025). Setelah deadline, revisi POK harus diajukan untuk TA berikutnya — adjust tahun anggaran ke TA {ta+1} dan re-submit."

### T7 — Cross-tab navigation refactor signature (NEW)

**Current (Tier 4a):**
```typescript
onNavigateToPagu?: (sectionId?: string, rowId?: string) => void;
```

**Proposed (Tier 4c):**
```typescript
type NavTarget = 'pagu' | 'rpd';
onNavigate?: (target: NavTarget, sectionId?: string, rowId?: string) => void;
```

**Backward compat:** Tambah `onNavigate` baru, deprecate `onNavigateToPagu` (atau keep both during transition). Affected: `ValidasiRevisiPOK`, `DetailPanel` di Tier 4a, `App.tsx` route handler.

### T8 — Konteks 1 TD fix approach (NEW)

**Issue:** `components/PaguAnggaran.tsx:50-51` overwrites `jumlahBiayaRevisi=0` ketika `hargaSatuanRevisi=0`. UI display logic bukan validator logic.

**Fix options:**
| Option | Description |
|---|---|
| **T8a** Re-derive `jbr` dari `getEffectiveValue(row)` di display | Consistent dengan validator semantics |
| T8b | Remove overwrite, use raw `jumlahBiayaRevisi` field | Risk stale data display |
| T8c | Add tooltip explainer + leave behavior | Cosmetic fix without changing logic |

**Default:** T8a — re-derive via paguLookup helper. Aligns UI display dengan validator effectiveRevisi semantics (Konteks 1 fallback). Standalone bugfix commit pre-Tier-4c start.

---

## 4. ValidationContext Extension

Current state (post Tier 4b):
```typescript
export interface ValidationContext {
  ta: number;
  sections: PaguSection[];
  allSectionsByYear?: Record<number, PaguSection[]>;
  rpdsData?: unknown[];               // ← needs narrow type for C11
  lhrApipAcknowledged?: boolean;
  sbmDictionary?: unknown;            // ← optional for C10 V2 future
  evaluatedAt?: Date;
}
```

Phase 1.5 Tier 4c extensions:

```typescript
// Narrow rpdsData type (currently unknown[])
rpdsData?: RPDSection[];  // import type from '../../types'
```

**sbmDictionary** tetap `unknown` v1 — C10 V1 (T2b default) tidak gunakan; reserve untuk V2 future enhancement.

**Other fields:** zero changes — C10 + C12 pakai existing fields, C11 cuma butuh narrow rpdsData type.

---

## 5. UI Integration Plan (Phase 3 Tier 4c)

### 5.1 Cards live transition (C10/C11/C12)

`runAllValidators.ts` update:
```typescript
const PENDING_CONSTRAINTS = {
  C1: null, ..., C9: null,        // Tier 4a/4b implemented
  C10: null, C11: null, C12: null  // ← Tier 4c implemented
};
```

Plus imports + calls + add ke `liveResults`. `todoIds` jadi empty array (no more placeholder).

`ValidasiRevisiPOK.tsx`:
- Sub-branch 4c subtitle: "3 constraints · BELUM TERSEDIA" → "3 constraints · IMPLEMENTED"
- **All 12 cards live!**
- Counter implemented 9/12 → 12/12 (progress bar 100%)
- "BELUM TERSEDIA" counter chip tampil 0

### 5.2 Submit button finally enables

Triple gating dari Tier 4b masih apply:
```typescript
const submitEnabled = canSubmit && allImplemented && lhrApipAcknowledged;
```

Tier 4c effect: `allImplemented = (todo === 0)` jadi true (12/12). Kalau canSubmit (no fail/pending) + LHR acknowledged → **Submit button ENABLES** for first time.

This unlocks Tier 5 audit trail next step.

### 5.3 Cross-tab navigation refactor (C11 unique requirement)

**Affected files:**
1. `components/ValidasiRevisiPOK.tsx` — extend props
2. `components/validation/DetailPanel.tsx` (jika exists, atau inline di ValidasiRevisiPOK) — render dual buttons untuk C11
3. `App.tsx` — `onNavigate` handler route ke SubTab.PAGU_ANGGARAN atau SubTab.RPD
4. `components/RPD.tsx` (atau `RealisasiRPD.tsx`) — accept pendingRowHighlight prop + scroll/highlight implementation (mirror PaguAnggaran pattern from Tier 4a)

**UX behavior:**
- C11 violation detail panel shows affected rows list
- Each row punya 2 buttons: `→ Pagu Anggaran` + `→ RPD`
- Click `→ RPD` → switch ke sub-tab 1.3 + scroll to row + 2s emerald glow
- Same UX as Tier 4a Pagu Anggaran scroll/highlight

**Reuse strategy:** Mirror `pendingPaguRowHighlight` state pattern di App.tsx → `pendingRpdRowHighlight`. Implement scroll/highlight di RPD.tsx mirror PaguAnggaran.tsx Tier 4a Phase 3d work.

### 5.4 Inline indicators

- C10/C11 violations have affectedRowIds → auto-supported via `rowConstraintMap.ts` (no changes needed)
- C12 doesn't have affectedRowIds (global state) → only di dashboard card, no inline indicators

---

## 6. Implementation Phase Plan

Mirror Tier 4a/4b pattern dengan Konteks 1 TD pre-flight + cross-tab navigation refactor as additional scope.

| Phase | Deliverable | Estimated turns |
|---|---|---|
| **Pre-flight** | Konteks 1 TD fix standalone commit (T8a approach) | 1 turn |
| Phase 1 | `docs/TIER-4C-DESIGN.md` Owner-approved + T1-T8 locked | 0 (this doc) |
| Phase 1.5 | Types extension — narrow `rpdsData: RPDSection[]` | 0.5 turn |
| Phase 2a | Fixture `validation-scenarios-4c.json` ~15 scenarios | 1 turn |
| Phase 2b Turn 1 | **C12 Deadline** (simplest first) ~12 tests | 1 turn |
| Phase 2b Turn 2 | **C10 SBM** (medium, first warn severity) ~20 tests | 1 turn |
| Phase 2b Turn 3 | **C11 RPD** (most complex, cross-table) ~25 tests | 1-2 turns |
| Phase 3a | UI design delta — cross-tab navigation extension | 0.5 turn |
| Phase 3b | Cards C10-C12 live transition + subtitle final | 1 turn |
| Phase 3c | **Cross-tab navigation refactor** (`onNavigate` signature + RPD scroll/highlight) | 1-2 turns |
| Phase 3d | Docs sync + dashboard 12/12 state | 0.5 turn |
| Phase 4 | Owner Vercel preview E2E test → squash merge | 1 turn |
| **TOTAL** | | **~11-14 turns** |

Slightly larger dari Tier 4b (10 turns) karena:
- Pre-flight TD fix (+1)
- Cross-tab navigation refactor (+1-2 turns lebih dari simple checkbox UX)

---

## 7. Existing Field Coverage Check

| Constraint | Field Required | Source | Status |
|---|---|---|---|
| C10 | `hargaSatuanAwal`, `hargaSatuanRevisi` | PaguRow base | ✅ Ready |
| C11 | RPD sections + `linkedPaguSectionId` + `kode` | `ctx.rpdsData` (narrow type) | ⚠️ Type narrow needed Phase 1.5 |
| C12 | `evaluatedAt`, `ta` | ValidationContext | ✅ Ready |

**Conclusion:** 1 type narrow needed (rpdsData unknown → RPDSection[]). Zero DDL. Zero PaguRow migration. Pattern consistent dengan Tier 4b minimal changes.

---

## 8. Konteks 1 TD Pre-flight Scoping

**Location:** `components/PaguAnggaran.tsx:50-51`

**Issue (per SSOT §0.9.5 carry forward):** UI display logic overwrites `jumlahBiayaRevisi=0` ketika `hargaSatuanRevisi=0`. C1 validator handle correctly via `effectiveRevisi` helper, tapi UI display tetap potential bug — user lihat 0 di kolom Revisi padahal effective value adalah Semula (per Konteks 1 fallback).

**Fix approach (Decision T8a):**

```typescript
// Before (current line ~50-51):
const jbr = row.jumlahBiayaRevisi ?? 0;
// (potential: overwrites with 0 when hsr=0, regardless of hsa)

// After (T8a — re-derive via effective value):
import { getEffectiveValue } from '../utils/paguLookup';
const jbr = getEffectiveValue(row, 'REVISI');
// → Returns hsa × volume bila hsr=0 (Konteks 1 consistent)
```

**Impact analysis:**
- Affected: row display di Pagu Anggaran tab kolom "Revisi"
- Side effects: aggregate totals di summary footer might shift (now reflect effective values)
- Test: existing tests for PaguAnggaran rendering should catch regression
- Risk: LOW — uses existing helper, well-tested

**Recommendation:** Standalone commit `fix(konteks-1): re-derive jumlahBiayaRevisi via effective value untuk UI display consistency` — BEFORE start Tier 4c branch.

---

## 9. Open Items Carried Forward

Setelah Tier 4c merged, expected backlog:

| Item | Tier | Notes |
|---|---|---|
| Tier 5 Audit Trail | Future | Butuh Owner DDL `CREATE TABLE usulan_revisi` — submission persistence + audit log |
| C10 V2 enhancement | Future | Full SBM lookup table integration |
| C11 V2 enhancement | Future | Numerical sum verification (sum monthly vs revisi) |
| C11 V3 enhancement | Future | Remediation guide (suggest monthly re-distribution) |
| LHR APIP persistence | Tier 5 | Currently in-memory v1 per Tier 4b S6 |
| Submission deadline reminder | Tier 5+ | Email/notification 30 hari before C12 deadline |

---

## 10. Cross-References

- Architecture parent: `docs/TIER-4-DESIGN.md` §3.3 (Tier 4c master spec)
- Pattern reference Tier 4b: `docs/TIER-4B-DESIGN.md` + `docs/TIER-4B-PHASE-3-UI-DESIGN.md`
- Predecessor merges:
  - `d13be80` Tier 4b (C6-C9 + UI)
  - `abe193c` Tier 4a (C1-C5 + UI)
  - `6c8f640` Tier 3 (metadata schema)
- RPD types: `types.ts` `RPDSection` + `RPDRow.monthly` (single snapshot, Sprint A2)
- Konteks 1 fix helper: `utils/paguLookup.ts` `getEffectiveValue`
- Master domain: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (C10-C12 specs)
- Open items source: `SSOT-REFACTOR-LOG.md` §0.10.4 + §0.9.5

---

## 11. Owner Action Items

Before Tier 4c implementation start, Owner approve:

1. **T1-T8 decisions** — accept defaults atau adjust specific?
2. **Konteks 1 TD fix sequencing** — pre-flight before Tier 4c (recommended) vs parallel/skip?
3. **C10 threshold values** — confirm 10%/25% atau adjust?
4. **C11 cross-tab navigation refactor scope** — `onNavigate(target, sectionId, rowId)` baru?
5. **Test estimate scope** — confirm ~57 tests Tier 4c (~12 + 20 + 25)?
6. **Phase 4 sequencing** — Tier 4c langsung dari main HEAD `7f23ae0`, atau pause field-test 1-2 minggu dulu?

---

*Phase 1 design draft Tier 4c — 11 Mei 2026. Comprehensive analysis dengan 8 decisions + 3 algorithms + Konteks 1 TD scoping. Pending Owner review + Q&A session sebelum branch creation + Phase 1.5 types extension.*
