# Tier 4 — Validation Engine C1-C12 — Design Document

**Status:** 📋 DRAFT (per Decision M1, 11 Mei 2026)
**Pendahulu:** Tier 3 merged sebagai commit `6c8f640` — metadata fields ready
**Owner Approval Pending:** Phase 1 start signal untuk `feature/tier-4a-pagu-structure`

---

## 1. Goal

Implement **validation engine** untuk 12 hard constraints (C1-C12) Revisi POK kewenangan KPA per **Perdirjen Renhan Kemhan 7/2025 Pasal 22** + Lampiran I, consuming Tier 3 metadata fields (`kro_code`, `ro_code`, `kegiatan_code`, `komponen_code`, `sumber_dana_kode`, `metadata_review`).

**Output:** Sie Renbang dapat klik tombol "Validasi Revisi POK" → app return 12-card report dengan status pass/warn/fail per constraint + inline indicators per row di Pagu Anggaran tab.

## 2. Branch Strategy (Decision N2 Owner-approved 11 Mei 2026)

3 sub-branches, sequential squash merge:

| Sub-branch | Constraints | Sifat | Complexity |
|---|---|---|---|
| `feature/tier-4a-pagu-structure` | C1, C2, C3, C4, C5 (5 constraints) | Pure structural — pagu_sections data only | LOW-MED |
| `feature/tier-4b-revisi-mechanism` | C6, C7, C8, C9 (4 constraints) | Diff Semula↔Revisi + LHR APIP ack flag | MED |
| `feature/tier-4c-procedural-references` | C10, C11, C12 (3 constraints) | SBM lookup + cross-table + temporal | HIGH |

Setelah Tier 4c merged → Tier 4 selesai.

## 3. Canonical Constraint Specifications

Source: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (vKoreksi v3, master domain). Disalin verbatim untuk traceability.

### 3.1 Tier 4a — Pagu Structure (C1-C5)

#### **C1 — Total Pagu Satker Net Change = 0**
| Field | Value |
|---|---|
| Pasal | 22 huruf b angka 1 |
| Algoritma | `SUM(jumlahBiayaAwal[leaves]) === SUM(jumlahBiayaRevisi[leaves])` per satker |
| Inputs | `pagu_sections.data.rows[].jumlahBiaya{Awal,Revisi}` (leaves only via §0.7.2 traversal) |
| Severity | 🔴 BLOCKER |
| Edge | Konteks 1 fallback — gunakan `getEffectiveValue(row)` agar `hargaSatuanRevisi=0` ter-treat sebagai "no revision" (fallback ke Awal) |

#### **C2 — Pergeseran dalam 1 KRO/RO yang sama**
| Field | Value |
|---|---|
| Pasal | 22 huruf a |
| Algoritma | Untuk skema 5.a: semua row yang berubah share `kro_code` yang sama. Untuk skema 5.b/5.c: semua share `ro_code` yang sama |
| Inputs | `row.kro_code`, `row.ro_code` (Tier 3 metadata) |
| Severity | 🔴 BLOCKER |
| Edge | Row dengan `metadata_review.override_to = 'high'` → trust as same group |

#### **C3 — Pergeseran dalam 1 Kegiatan yang sama**
| Field | Value |
|---|---|
| Pasal | 22 huruf a angka 1 |
| Algoritma | Semua changed rows share `kegiatan_code` |
| Inputs | `row.kegiatan_code` |
| Severity | 🔴 BLOCKER |
| Edge | Untuk RS Batin Tikal deterministic `6507` (HIGH 100%) → always passes saat ini |

#### **C4 — Pergeseran dalam 1 Satker yang sama**
| Field | Value |
|---|---|
| Pasal | 22 huruf a |
| Algoritma | Satker context check (Satker 685784 Kesdam II/Sriwijaya for RS Batin Tikal) |
| Inputs | App-level satker context |
| Severity | 🔴 BLOCKER |
| Edge | Deterministic for single-satker app → always passes |

#### **C5 — Volume dan Satuan RO tidak berubah**
| Field | Value |
|---|---|
| Pasal | 22 huruf b angka 1 |
| Algoritma | Per RO: `volume_ro_awal === volume_ro_revisi` AND `satuan_ro_awal === satuan_ro_revisi` |
| Inputs | `row.volume_ro`, `row.satuan_ro` |
| Severity | 🔴 BLOCKER |
| **Issue** | Tier 3 leave volume_ro/satuan_ro as LOW confidence (manual fill). C5 implementation perlu prompt manual fill untuk row-row yang affect RO atau skip validation jika data missing |

### 3.2 Tier 4b — Revisi Mechanism (C6-C9)

#### **C6 — Tidak mengubah jenis belanja (51/52/53/57)**
| Field | Value |
|---|---|
| Pasal | 22 huruf b angka 1 |
| Algoritma | Per row, `Math.floor(kode_bas / 10000) % 100` (2-digit jenis belanja) tidak berubah Semula↔Revisi. Atau practical: `kode_bas` itu sendiri tidak berubah (lebih strict, lebih aman) |
| Inputs | `row.kode_bas` |
| Severity | 🔴 BLOCKER |

#### **C7 — Tidak mengubah sumber dana (RM/PNBP/PLN/PDN/Hibah)**
| Field | Value |
|---|---|
| Pasal | 22 huruf b angka 1 |
| Algoritma | Per row, `sumber_dana_kode` tidak berubah. Atau cross-check `sumberDana` string field |
| Inputs | `row.sumber_dana_kode` (Tier 3 HIGH 100%) |
| Severity | 🔴 BLOCKER |

#### **C8 — Memperhatikan LHR APIP** ⚠ BARU di Perdirjen 7/2025
| Field | Value |
|---|---|
| Pasal | 22 huruf b angka 2 |
| Algoritma | User wajib explicit confirm sudah review LHR APIP sebelum submit revisi |
| Inputs | NEW field di submission: `lhr_apip_acknowledgment: { date, items_considered[] }` ATAU sekedar boolean flag |
| Severity | 🔴 BLOCKER (procedural) |
| **Open Q1** | Implementation depth: (A) Simple boolean checkbox vs (B) cross-ref to LHR APIP items dengan note per item — owner decide |

#### **C9 — Tidak boleh akun menjadi minus**
| Field | Value |
|---|---|
| Pasal | Prinsip umum pelaksanaan APBN |
| Algoritma | Per row, `jumlahBiayaRevisi >= 0` |
| Inputs | `row.jumlahBiayaRevisi` |
| Severity | 🔴 BLOCKER |
| Edge | Sanity check — secara struktural impossible untuk leaf rows (volume × hargaSatuan can't be negative) tapi catches data entry typo |

### 3.3 Tier 4c — Procedural / Reference (C10-C12)

#### **C10 — Sesuai SBM/SBK**
| Field | Value |
|---|---|
| Pasal | PMK Standar Biaya tahunan (eksternal) |
| Algoritma | Per row, `hargaSatuanRevisi` dalam tolerance terhadap SBM/SBK |
| Inputs | `row.hargaSatuanRevisi` + SBM dictionary (external table) |
| Severity | 🟡 WARNING (bukan blocker — user bisa justify deviasi) |
| **Open Q2** | V1 simplified (flag deviasi >X% dari baseline) vs V2 full SBM lookup table |

#### **C11 — Tidak mengubah Halaman III DIPA (RPD)**
| Field | Value |
|---|---|
| Pasal | Lampiran I Bagian 5 kode 5.d |
| Algoritma | Cross-section check: jika revisi POK mengakibatkan perubahan di `rpds` table data, harus eskalasi ke revisi DIPA Halaman III (proses berbeda) |
| Inputs | `pagu_sections` + `rpds` cross-reference |
| Severity | 🔴 BLOCKER (eskalasi trigger) |
| **Open Q3** | Cross-table diff logic kompleks — design depth tergantung scope |

#### **C12 — Deadline 27 Desember**
| Field | Value |
|---|---|
| Pasal | 24 ayat (11) huruf d; Lampiran I 5.d |
| Algoritma | `today < ${TA}-12-27`. Setelah deadline, revisi POK harus untuk TA berikutnya |
| Inputs | Current date + selected TA year |
| Severity | 🔴 BLOCKER (eskalasi trigger) |
| Complexity | TRIVIAL — date comparison |

## 4. Phasing Per Sub-Branch

Mirror Tier 3 pattern. **Per sub-branch:**

| Phase | Deliverable | Acceptance |
|---|---|---|
| Phase 1 | Extend types.ts (`ValidationResult`, `ConstraintStatus` interfaces) | TS baseline maintained |
| Phase 2a | Fixture file `utils/fixtures/validation-scenarios-{4a/4b/4c}.json` — valid + fail cases per constraint | Coverage ≥3 scenario per constraint |
| Phase 2b | Validator functions `utils/validators/c{N}.ts` + Vitest tests | All tests pass, ≥30 per constraint |
| Phase 3 | UI integration (dashboard cards + inline indicators) | Visual + click navigation works |
| Phase 4 | Owner Vercel preview test → squash merge | All blocking constraints fail/pass correctly |

## 5. UI Design (Decision O3 Owner-approved)

### 5.1 Dashboard "Validasi Revisi POK"

**Placement:** New tab/section di app (sibling ke Pagu Anggaran). Lokasi: sidebar baru atau header secondary menu.

**Layout:** Grid 12 cards (3 × 4 atau 4 × 3 responsive), satu per constraint.

**Per-card state:**
| State | Visual | Description |
|---|---|---|
| ✅ PASS | Green border + checkmark | Constraint terpenuhi |
| ⚠️ WARN | Amber border + warning icon | Soft constraint, user bisa justify (mis. C10 SBM deviasi) |
| ❌ FAIL | Red border + X icon | Blocker — harus diperbaiki sebelum submit |
| 🔄 PENDING | Gray border + spinner | Awaiting user confirmation (mis. C8 LHR APIP) |
| ⏭️ N/A | Gray border + dash | Not applicable (mis. C5 saat tidak ada perubahan RO) |

**Per-card content:**
- Badge: Cnn label + status icon
- Title: short constraint description
- Status detail: "X dari Y row passed" atau "Diperbarui 3 menit lalu"
- Action button: "Lihat Detail" → expand panel dengan list violations + remediation suggestion

**Dashboard header:**
- Aggregate status: "X/12 PASS" (X = count of green)
- Refresh button: re-run validation
- "Submit Revisi POK" button: enabled hanya jika 0 BLOCKER fail

### 5.2 Inline Indicators (di Pagu Anggaran tab)

- Per leaf row: tambah icon kecil (•) di kolom Kode kalau row contribute ke any violation
- Color: amber (warn) atau red (fail)
- Hover tooltip: "Row ini affect C2, C5 — klik untuk detail"
- Click: jump ke dashboard dengan row pre-highlighted di violations panel

## 6. Test Framework

Reuse existing **Vitest 2.1.9** dari Tier 3 (`utils/metadataRecommender.test.ts` pattern). Per validator:

```typescript
// utils/validators/c1.test.ts
import { describe, it, expect } from 'vitest';
import { validateC1 } from './c1';
import fixture from '../fixtures/validation-scenarios-4a.json';

describe('C1 — Total Pagu Satker Net Change = 0', () => {
  // 3+ scenarios per constraint
  fixture.scenarios.c1.forEach(scenario => {
    it(scenario.name, () => {
      const result = validateC1(scenario.sections);
      expect(result.status).toBe(scenario.expected.status);
      expect(result.violations).toEqual(scenario.expected.violations);
    });
  });
});
```

Target: ≥30 tests per constraint × 12 constraints = ≥360 tests total Tier 4 cumulative. Combined dengan existing 201 Tier 3 tests = ≥561 tests final.

## 7. Open Questions untuk Owner Sebelum Phase 1 Start

| Q | Question | Default Recommendation |
|---|---|---|
| Q1 | C8 LHR APIP — boolean checkbox (simple) vs cross-ref items (complex)? | **Simple boolean v1** — extend later jika perlu audit trail per item |
| Q2 | C10 SBM/SBK — V1 simplified (flag deviasi >X%) vs V2 full lookup? | **V1 simplified** untuk Tier 4 scope, V2 di Tier 4.5 atau later |
| Q3 | C11 Halaman III DIPA — cross-table diff terhadap RPDS bisa kompleks; full implementation atau simplified detection? | **Simplified detection v1** — flag jika revisi affect rows yang punya linkedRpdId, defer detailed diff |
| Q4 | Validation timing — auto-validate on data change atau manual "Validate Now" button? | **Manual button** + auto-refresh setelah Apply Recommendation. Mengurangi noise saat user sedang edit |
| Q5 | Sub-branch sequence (Owner approve N2) — start 4a, 4b, 4c berurutan atau parallel kalau dr Ferry siap test ganda? | **Sequential** — start 4a, merge, test 4b, merge, dst |
| Q6 | UI tab name — "Validasi Revisi POK" vs "Audit Constraint" vs "Validasi C1-C12"? | **"Validasi Revisi POK"** — domain-friendly |

## 8. Cross-References

- Master domain constraint specs: `docs/REVISI-POK-PAGU-vKoreksi.md` §3.3 (canonical)
- Tier 3 metadata fields: `types.ts` PaguRow extension
- Recommender (for confidence checks): `utils/metadataRecommender.ts`
- Tier 3 fixture (for scenario reuse): `utils/fixtures/pagu-leaves-ta2025.json`
- Decisions log: `SSOT-REFACTOR-LOG.md` §0.8 (Tier 3) + future §0.9 (Tier 4)

## 9. Next Action

**Owner action items:**
1. Review document ini — apakah categorization N2 + phasing OK?
2. Jawab Q1-Q6 (atau accept default recommendation)
3. Green-light untuk start **Tier 4a Phase 1** (extend types.ts dengan ValidationResult interface)

**AI action items setelah Owner green-light:**
1. Create branch `feature/tier-4a-pagu-structure`
2. Phase 1 commit: types.ts extension
3. Phase 2a: fixture scenarios untuk C1-C5
4. Phase 2b: validators C1-C5 + tests
5. Phase 3: dashboard UI + inline indicators
6. Phase 4: Owner Vercel preview test → squash merge ke main

---

*Tier 4 Design Document v1 — Drafted 11 Mei 2026 per Decision M1.*
*Akan di-extend ke `SSOT-REFACTOR-LOG.md §0.9` setelah Phase 1 start untuk full decision log mirror Tier 3 §0.8.*
