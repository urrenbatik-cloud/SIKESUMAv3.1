# Tier 4a Phase 3 — UI Design Document

**Status:** 📋 DRAFT (Phase 3a deliverable, 11 Mei 2026)
**Sub-branch:** `feature/tier-4a-pagu-structure` (continuation post Phase 2b)
**Owner Approval:** Pending review sebelum Phase 3b implementation start
**Predecessor:** Phase 2b — 5 validators C1-C5 complete + 103 tests (commit `e76284a`)

---

## 1. Goal

Implementasi UI integration untuk validation engine Tier 4a — supaya Sie Renbang
bisa lihat status 12 constraint Revisi POK secara visual dan navigate ke
violation detail. Phase 3 ini di-split jadi 4 sub-phase (3a–3d) untuk reviewable
governance per Decision dr Ferry 11 Mei 2026.

**3a (this doc):** Design spec + visual mock + color scheme. **No code.** Owner review.
**3b:** Dashboard tab implementation + 12-card grid component.
**3c:** Inline indicators di Pagu Anggaran tab.
**3d:** Wire validators + manual "Validate Now" button + integration test.

---

## 2. Placement Decision

**Recommended: New sub-tab "1.5 Validasi Revisi POK"** di bawah MainTab "1. PERSIAPAN & PERENCANAAN".

Rationale:
- Konsisten dengan existing navigation pattern (`SubTabButton` di App.tsx)
- Sie Renbang sudah kerja di tab 1.x untuk edit Pagu; validasi adalah logical next step
- Tab preserve edit state saat user navigate bolak-balik (vs modal yang block screen)
- Dashboard 12-card grid butuh layout space yang sulit di-modal

**Alternative considered:**
- New MainTab "5. VALIDASI" — rejected (breaks 4-tab convention; bias konsep "siap submit")
- Modal overlay dari button — rejected (12-card grid + detail panels needs full layout)

**Open question (Q-UI-1) untuk Owner:** Sub-tab vs MainTab 5? Saya rekomendasi sub-tab "1.5".

```
MainTab 1: PERSIAPAN & PERENCANAAN
  ├── 1.1 Pagu Anggaran
  ├── 1.2 RAB Detail
  ├── 1.3 RPD (Rencana Tarik)
  ├── 1.4 LRA (Realisasi)
  └── 1.5 Validasi Revisi POK     ← NEW
```

---

## 3. Dashboard Layout — High-Level Wireframe

```
╔══════════════════════════════════════════════════════════════════════════╗
║  1.5 VALIDASI REVISI POK                                          [⟳]    ║
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐   ║
║  │ STATUS REVISI POK TA 2025                                       │   ║
║  │                                                                 │   ║
║  │  5 PASS    0 WARN    0 FAIL    0 PENDING    7 BELUM TERSEDIA   │   ║
║  │  ████████████████░░░░░░░░░░░░░░░░  5/12 implemented            │   ║
║  │                                                                 │   ║
║  │  Last validated: 2 menit lalu     [⟳ Validate Now]              │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  4a — PAGU STRUCTURE (5 constraints, IMPLEMENTED)                       ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  ║
║  │ C1 ✅    │ │ C2 ✅    │ │ C3 ✅    │ │ C4 ✅    │                  ║
║  │ Total    │ │ 1 KRO    │ │ 1 Keg.   │ │ 1 Satker │                  ║
║  │ Pagu     │ │ Sama     │ │ Sama     │ │ Sama     │                  ║
║  │          │ │          │ │          │ │          │                  ║
║  │ Konsisten│ │ Konsisten│ │ Konsisten│ │ Determ.  │                  ║
║  │          │ │          │ │          │ │          │                  ║
║  │ [Detail] │ │ [Detail] │ │ [Detail] │ │ [Detail] │                  ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  ║
║  ┌──────────┐                                                          ║
║  │ C5 ⚠️    │                                                          ║
║  │ Volume   │                                                          ║
║  │ RO       │                                                          ║
║  │          │                                                          ║
║  │ 3 belum  │                                                          ║
║  │ fill     │                                                          ║
║  │          │                                                          ║
║  │ [Detail] │                                                          ║
║  └──────────┘                                                          ║
║                                                                          ║
║  4b — REVISI MECHANISM (4 constraints, BELUM TERSEDIA)                  ║
║  ┌╌╌╌╌╌╌╌╌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐                  ║
║  ┊ C6 💤    ┊ ┊ C7 💤    ┊ ┊ C8 💤    ┊ ┊ C9 💤    ┊                  ║
║  ┊ Jenis    ┊ ┊ Sumber   ┊ ┊ LHR APIP ┊ ┊ Akun     ┊                  ║
║  ┊ Belanja  ┊ ┊ Dana     ┊ ┊          ┊ ┊ Minus    ┊                  ║
║  ┊          ┊ ┊          ┊ ┊          ┊ ┊          ┊                  ║
║  ┊ Belum    ┊ ┊ Belum    ┊ ┊ Belum    ┊ ┊ Belum    ┊                  ║
║  ┊ Tersedia ┊ ┊ Tersedia ┊ ┊ Tersedia ┊ ┊ Tersedia ┊                  ║
║  └╌╌╌╌╌╌╌╌╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘                  ║
║                                                                          ║
║  4c — PROCEDURAL & REFERENCES (3 constraints, BELUM TERSEDIA)           ║
║  ┌╌╌╌╌╌╌╌╌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐                              ║
║  ┊ C10 💤   ┊ ┊ C11 💤   ┊ ┊ C12 💤   ┊                              ║
║  ┊ SBM/SBK  ┊ ┊ RPD Hal  ┊ ┊ Deadline ┊                              ║
║  ┊          ┊ ┊ III      ┊ ┊ 27 Des   ┊                              ║
║  ┊          ┊ ┊          ┊ ┊          ┊                              ║
║  ┊ Belum    ┊ ┊ Belum    ┊ ┊ Belum    ┊                              ║
║  ┊ Tersedia ┊ ┊ Tersedia ┊ ┊ Tersedia ┊                              ║
║  └╌╌╌╌╌╌╌╌╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘                              ║
║                                                                          ║
║  [Submit Revisi POK]  ← disabled saat Phase 3, akan aktif post-4c       ║
╚══════════════════════════════════════════════════════════════════════════╝
```

Layout:
- **Responsive grid:** 4 kolom di desktop (≥1024px), 2 kolom di tablet, 1 kolom di mobile
- **Section divider:** sub-branch label di atas tiap group (4a / 4b / 4c)
- **Card height:** uniform ~h-44 (~176px) untuk consistent grid

---

## 4. Card State Spec

6 visual states. State 1-5 berasal dari `ConstraintStatus` types.ts. State 6 (`todo`) adalah rendering treatment untuk constraint yang validatornya belum di-build — tidak masuk type system, hanya visual.

| State | Icon (Lucide) | Border | Background | Text Accent | Use Case |
|---|---|---|---|---|---|
| **pass** | `CheckCircle2` | `border-emerald-500` | `bg-emerald-50` | `text-emerald-700` | C1-C5: aturan terpenuhi |
| **warn** | `AlertTriangle` | `border-amber-500` | `bg-amber-50` | `text-amber-700` | C5 MIXED, C10 SBM deviasi minor |
| **fail** | `XCircle` | `border-red-500` | `bg-red-50` | `text-red-700` | Blocker — harus diperbaiki sebelum submit |
| **pending** | `Loader2` (spin) | `border-blue-500` | `bg-blue-50` | `text-blue-700` | C2/C3: metadata belum fill, atau C8 LHR APIP belum dikonfirmasi |
| **na** | `MinusCircle` | `border-slate-300` | `bg-slate-50` | `text-slate-500` | C4 deterministic pass, C5 NA, atau context tidak applicable |
| **todo** | `Clock` | `border-slate-200 border-dashed` | `bg-white` | `text-slate-400` | C6-C12 Belum Tersedia (not part of types.ts — rendering only) |

### 4.1 Card Anatomy

```
┌────────────────────────────────────┐  ← border: state-colored, rounded-2xl
│  ┌──┐                              │
│  │C1│ ✅                           │  ← Badge ID + state icon (top-left)
│  └──┘                              │
│                                    │
│  Total Pagu Net Change             │  ← Title (font-bold, text-sm)
│  Pasal 22 huruf b angka 1          │  ← Pasal ref (text-[10px], text-slate-400)
│                                    │
│  Pagu konsisten Rp 2.709.935.000   │  ← Summary line (text-xs)
│                                    │
│                  [Lihat Detail →]  │  ← Action button (bottom-right)
└────────────────────────────────────┘
```

Style decisions:
- Card class: `rounded-2xl border-2 shadow-sm p-4 transition-all hover:shadow-md`
- Badge ID: `font-mono font-black text-[11px]` dalam pill `rounded-md px-2 py-0.5 bg-{state}-100 text-{state}-700`
- Icon size: 20px untuk state icon (top-right of badge)
- Title font: `font-bold text-sm text-slate-700`
- Pasal ref font: `text-[10px] text-slate-400 uppercase tracking-wide`
- Summary: `text-xs text-slate-600` — diset dari `result.summary` validator
- Button: `text-xs font-medium text-{state}-600 hover:underline`

### 4.2 Edge — `todo` card (Belum Tersedia)

```
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐  ← border-dashed slate-200
┊  ┌──┐                              ┊
┊  │C6│ 🕓                           ┊
┊  └──┘                              ┊
┊                                    ┊
┊  Tidak Ubah Jenis Belanja          ┊
┊  Pasal 22 huruf b angka 1          ┊
┊                                    ┊
┊  Belum Tersedia                    ┊  ← greyed out, no detail button
┊  Akan diimplementasi di Tier 4b    ┊
┊                                    ┊
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

Distinct dari implemented cards via:
- Dashed border (`border-dashed`)
- White background (vs colored bg)
- Greyed text
- No action button (nothing to "detail")
- Subtitle "Akan diimplementasi di Tier 4b" / "Tier 4c"

---

## 5. Header Section — Aggregate Status

Top card sebelum grid:

```
┌──────────────────────────────────────────────────────────────────┐
│ STATUS REVISI POK TA 2025                                        │
│                                                                  │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────────────┐   │
│ │  5   │  │  0   │  │  0   │  │  0   │  │        7         │   │
│ │ PASS │  │ WARN │  │ FAIL │  │PEND. │  │ BELUM TERSEDIA   │   │
│ └──────┘  └──────┘  └──────┘  └──────┘  └──────────────────┘   │
│                                                                  │
│ Progress: ████████████████░░░░░░░░░░░░░░░░ 5/12 implemented      │
│                                                                  │
│ Last validated: 2 menit lalu          [⟳ Validate Now]            │
│                                                                  │
│ [📋 Submit Revisi POK]   ← DISABLED (4b+4c belum ready)            │
└──────────────────────────────────────────────────────────────────┘
```

Aggregate counter logic (`canSubmit` di types.ts):
- Phase 3 (4a only): `canSubmit` boolean tetap `false` selama 4b+4c belum implemented
- Visual indicator: progress bar `5/12` (emerald fill untuk implemented)
- "Submit Revisi POK" button disabled dengan tooltip: *"Menunggu Tier 4b + 4c — validator lengkap C1-C12"*

### 5.1 "Validate Now" button behavior

Per Decision Q4 (default): **manual button**, BUKAN auto-validate on data change.

Trigger conditions:
1. User klik "Validate Now"
2. Auto-trigger setelah "Apply Recommendation" / "Tandai Manual Reviewed" di Pagu Anggaran (untuk refresh saat metadata baru ter-fill)

State during validation: button → "Validating..." dengan spinner ~500ms untuk visual feedback, kemudian update card states.

`evaluatedAt` timestamp ditampilkan sebagai "Last validated: X menit lalu" (relative time format).

---

## 6. Detail Panel — Click "Lihat Detail"

Per-card click → expandable panel inline di bawah card grid (atau modal — Q-UI-2). Saya rekomendasi **inline expandable** karena Sie Renbang sering perlu lihat detail tanpa interrupt context.

```
┌────────────────────────────────────────────────────────────────┐
│ C2 ✅ — Pergeseran dalam 1 KRO yang Sama                       │
│ Pasal 22 huruf a · Severity: BLOCKER                           │
│                                                                │
│ Status: PASS                                                   │
│ Summary: 3 row direvisi, semua dalam KRO EBA — C2 pass         │
│                                                                │
│ Algoritma:                                                     │
│   1. Collect changed leaf rows via helpers.collectChangedLeaves│
│   2. Group by kro_code → cek distinct count                    │
│   3. ≤1 distinct → pass; ≥2 → fail; missing → pending          │
│                                                                │
│ Last evaluated: 2026-05-11 14:23:47 UTC                        │
└────────────────────────────────────────────────────────────────┘
```

Untuk **fail/warn/pending status**:

```
┌────────────────────────────────────────────────────────────────┐
│ C2 ❌ — Pergeseran dalam 1 KRO yang Sama                       │
│ Pasal 22 huruf a · Severity: BLOCKER                           │
│                                                                │
│ Status: FAIL                                                   │
│ Summary: 2 KRO berbeda terdeteksi                              │
│                                                                │
│ Violation:                                                     │
│   Pergeseran POK mencakup 2 KRO berbeda (EBA, CAB).            │
│   Revisi POK kewenangan KPA hanya boleh dalam 1 KRO yang sama  │
│   (Pasal 22 huruf a). Untuk pergeseran antar-KRO, eskalasi ke  │
│   revisi DIPA Halaman III atau jalur Pasal 14.                 │
│                                                                │
│ Affected rows (2):                                             │
│   • 521115.04 HONOR PENGELOLA YANMASUM      [→ Pagu Anggaran]  │
│     KRO: EBA · Section: pagu-2025-jasa                         │
│   • 532111.06.A PENGADAAN ALSINTOR (BPJS)   [→ Pagu Anggaran]  │
│     KRO: CAB · Section: pagu-2025-modal                        │
│                                                                │
│ Distinct values:                                               │
│   distinctKroCodes: ['EBA', 'CAB']                             │
└────────────────────────────────────────────────────────────────┘
```

Per-row affected button "[→ Pagu Anggaran]" → navigate ke tab 1.1 dengan section pre-expanded + row scrolled into view + highlight glow ~2s.

---

## 7. Inline Indicators (Phase 3c) — di Pagu Anggaran tab

Indikator kecil di kolom **Kode** pada tabel Pagu Anggaran, supaya user lihat "row ini bermasalah" tanpa harus pindah tab.

### 7.1 Visual

```
Kode                Uraian                     Volume    ...
─────────────────────────────────────────────────────────────
521115            Honor Operasional Satker     1
  521115.04 🔴    Honor Pengelola YANMASUM     1         ← dot indicator
521119            Belanja Operasional Lainnya  1
  521119.01       Pembayaran Rujuk Diagnostik  1         ← no indicator (pass)
532111.A          Pengadaan Alsintor           1
  532111.06.A 🔴  Pengadaan Alsintor (BPJS)    1
```

### 7.2 Indicator dot logic

Single colored dot per row, color = **highest severity** dari constraints yang affect row:
- 🔴 red dot — row contributes ke any FAIL violation
- 🟡 amber dot — row contributes ke any WARN (and no fail)
- 🔵 blue dot — row contributes ke any PENDING (and no fail/warn)
- (no dot) — row pass semua, atau belum di-evaluate

Position: inline kanan dari kode text, size 8px (`w-2 h-2`).

### 7.3 Hover tooltip

```
┌─────────────────────────────────────┐
│ Row ini affect:                     │
│  ❌ C2 — KRO mismatch (EBA vs CAB)   │
│  ⏸️  C5 — volume_ro belum fill       │
│                                     │
│ Klik untuk lihat detail             │
└─────────────────────────────────────┘
```

### 7.4 Click behavior

Click dot → navigate ke tab 1.5 Validasi Revisi POK + auto-expand detail panel constraint paling severe + auto-scroll to row entry di affected list.

---

## 8. Color Scheme Reference Card

Untuk implementer Phase 3b/3c — single source of color truth:

```
PASS    border-emerald-500   bg-emerald-50   text-emerald-700   icon: CheckCircle2
WARN    border-amber-500     bg-amber-50     text-amber-700     icon: AlertTriangle
FAIL    border-red-500       bg-red-50       text-red-700       icon: XCircle
PEND.   border-blue-500      bg-blue-50      text-blue-700      icon: Loader2 (animate-spin)
NA      border-slate-300     bg-slate-50     text-slate-500     icon: MinusCircle
TODO    border-slate-200     bg-white        text-slate-400     icon: Clock
        (border-dashed)
```

Tailwind classes ini sudah dipakai di `PaguDiffDashboard.tsx` (Sprint D Item #2) — konsisten dengan visual language existing app.

---

## 9. Component File Structure (Proposal Phase 3b)

```
components/
├── ValidasiRevisiPOK.tsx          ← main tab component (orchestrator)
├── ValidationDashboardHeader.tsx  ← aggregate status card
├── ValidationConstraintCard.tsx   ← individual card (12 instances)
└── ValidationDetailPanel.tsx      ← expandable detail per card
```

Plus engine helper:

```
utils/validators/
└── runAllValidators.ts            ← orchestrate 5 validators + aggregate ValidationResult
```

`runAllValidators(ctx)` signature:
```typescript
export function runAllValidators(ctx: ValidationContext): ValidationResult {
  // Run C1-C5 (only implemented validators)
  // Return ValidationResult with results[C1-C12], C6-C12 marked as 'na' atau special 'todo' indicator
}
```

---

## 10. Analogi Medis untuk Owner

Pikirkan dashboard ini seperti **"pre-operative checklist board" di OK** — 12 item checklist sebelum operasi:
- Hijau (PASS): item terpenuhi
- Kuning (WARN): perhatian (mis. BP borderline)
- Merah (FAIL): blocker harus diselesaikan sebelum mulai
- Biru (PENDING): masih nunggu hasil (mis. lab pending)
- Abu-abu solid (NA): tidak applicable untuk kasus ini
- Abu-abu dashed (TODO): checklist item belum tersedia (mungkin alat baru, belum implementasi)

User flow Sie Renbang:
1. Edit Pagu di 1.1 (mirip dokter input vital signs)
2. Buka 1.5 Validasi Revisi POK → lihat status board
3. Identifikasi item merah/kuning → klik detail → fix di 1.1
4. Re-validate → semua hijau → siap submit (eventually post-Phase 4)

---

## 11. Open Questions untuk Owner

| Q | Question | Default Recommendation |
|---|---|---|
| **Q-UI-1** | Placement: sub-tab "1.5 Validasi Revisi POK" vs MainTab "5. VALIDASI"? | **Sub-tab 1.5** — konsisten navigation pattern, preserve edit context |
| **Q-UI-2** | Detail panel: inline expandable vs modal? | **Inline expandable** — Sie Renbang sering perlu lihat detail tanpa block screen. Modal hanya kalau detail sangat panjang (skip untuk Phase 3) |
| **Q-UI-3** | Card grid: 4 columns (current sketch) vs 3 columns? | **4 columns** desktop responsive — match Tier 3 `PaguDiffDashboard` 4-card pattern; 3-column saat tablet, 1-column mobile |
| **Q-UI-4** | C6-C12 cards: tampil di Phase 3 (placeholder todo) vs hide sampai 4b/4c ready? | **Tampil dengan "Belum Tersedia"** — user dapat preview scope keseluruhan + roadmap visibility |
| **Q-UI-5** | Inline indicator click behavior: jump-to-detail-panel vs jump-to-card? | **Jump-to-detail-panel** (auto-expand) — user langsung lihat root cause |
| **Q-UI-6** | "Submit Revisi POK" button: disabled selama Phase 3, atau hide entirely sampai Phase 4? | **Disabled with tooltip** — visibility roadmap; user tahu next step |
| **Q-UI-7** | `runAllValidators` cache strategy: re-run setiap "Validate Now" vs incremental (only re-run yang affected sections changed)? | **Full re-run on demand** — 5 validators × 304 leaves baseline = ~5ms, no perf concern; simpler code |

---

## 12. Phasing — 4 Sub-Phase Plan

| Phase | Deliverable | Estimated turns | Owner review |
|---|---|---|---|
| **3a (this doc)** | `docs/TIER-4A-PHASE-3-UI-DESIGN.md` design spec | 1 | YES — sekarang, sebelum 3b |
| **3b** | `ValidasiRevisiPOK.tsx` + 12-card grid + header component + `runAllValidators.ts` orchestrator | 1-2 | Vercel preview check |
| **3c** | Inline indicators di `PaguAnggaran.tsx` (badge + tooltip + click handler) | 1 | Vercel preview check |
| **3d** | Wire up: navigation between 1.1↔1.5, manual "Validate Now" trigger, auto-validate after Apply Recommendation, integration tests | 1 | Vercel preview test (E2E user flow) |

Setelah Phase 3 complete → Phase 4 (squash merge ke main).

---

## 13. Cross-References

- Architecture parent: `docs/TIER-4-DESIGN.md` §5 (UI plan high-level + Decision O3)
- Decisions: `SSOT-REFACTOR-LOG.md` §0.9.1 (Q1–Q6 + R1–R5 governance)
- Validator implementations: `utils/validators/c1.ts`–`c5.ts` + `helpers.ts`
- Type catalogue: `utils/validators/types.ts` (ConstraintStatus, ConstraintResult, ValidationResult)
- Tier 3 UI precedent: `components/PaguDiffDashboard.tsx` (Sprint D Item #2, 4-card grid)
- Tier 3 modal pattern: `components/MetadataApplyModal.tsx` + `MetadataOverrideModal.tsx` (untuk reference jika butuh modal di Phase 3)

---

*Phase 3a design draft — 11 Mei 2026. Pending Owner review + answer Q-UI-1 through Q-UI-7 sebelum Phase 3b implementation start.*
