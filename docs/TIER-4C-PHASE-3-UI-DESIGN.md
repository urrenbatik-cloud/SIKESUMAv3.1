# Tier 4c Phase 3 — UI Integration Design (Delta)

**Status:** 📋 DRAFT (Phase 3a deliverable, 12 Mei 2026)
**Sub-branch:** `feature/tier-4c-procedural-references` (Phase 2b complete, ready Phase 3)
**Predecessor design:** `docs/TIER-4B-PHASE-3-UI-DESIGN.md` (Tier 4b delta) + `docs/TIER-4A-PHASE-3-UI-DESIGN.md` (Tier 4a full baseline)
**Companion:** `docs/TIER-4C-DESIGN.md` §5 (Phase 3 plan high-level)

---

## 1. Scope — Why Delta

Tier 4a/4b Phase 3 sudah established UI infrastructure full:
- Sub-tab "1.5 Validasi Revisi POK"
- Dashboard 12-card grid (9 live post-Tier-4b + 3 todo C10-C12)
- 6 card states (pass/warn/fail/pending/na/todo) — semua warna sudah designed termasuk amber WARN
- Inline indicators di Pagu Anggaran tab (Tier 4a Phase 3c)
- Bidirectional Pagu ↔ Validasi navigation + scroll/highlight (Tier 4a Phase 3d)
- LHR APIP checkbox + Submit triple-gating (Tier 4b Phase 3c)

Tier 4c Phase 3 = **3 hal incremental delta**:

| Delta | Scope | Risk |
|---|---|---|
| **D1** Cards live transition C10-C12 | `runAllValidators.ts` flip placeholder + ValidasiRevisiPOK wire `rpdsData` + `c11Strategy` | LOW |
| **D2** Cross-tab navigation refactor (T7) | `onNavigate(target, sectionId, rowId)` signature baru + RPD.tsx scroll/highlight | MEDIUM-HIGH |
| **D3** C11 toggle UI (T9 BARU) | In-context radio button di card C11 + localStorage persist | LOW-MEDIUM |

D2 paling berisiko karena modify 4 file inter-connected (ValidasiRevisiPOK, DetailPanel inline, App.tsx, RPD.tsx). D3 adalah scope addition pasca-Owner-direction 12 Mei 2026 — tidak ada di TIER-4C-DESIGN.md asli §5.

---

## 2. Phase 3 Sub-Phase Breakdown

| Sub-phase | Deliverable | Estimate | Files affected |
|---|---|---|---|
| **3a (this doc)** | Brief design delta + open questions | <1 page, no code | This file |
| **3b** | Cards live + ValidationContext wiring | 1 turn | `runAllValidators.ts`, `ValidasiRevisiPOK.tsx`, `App.tsx` (rpdsData wire) |
| **3c-nav** | Cross-tab navigation refactor (T7) | 1-2 turn | `ValidasiRevisiPOK.tsx`, `App.tsx`, `RPD.tsx`, possibly new shared types |
| **3c-toggle** | C11 toggle UI (T9 BARU) | 1 turn (bisa absorbed dengan 3c-nav) | `ValidationConstraintCard.tsx` atau detail panel |
| **3d** | Docs sync + Phase 3 complete | 0.5 turn | `devLog.ts`, `HANDOVER.md`, `README.md`, `SESSION-START-HERE.md`, `SSOT-REFACTOR-LOG.md` (T9 entry) |

**Total estimate:** 3-4 turns. Sedikit lebih besar dari Tier 4b Phase 3 (3 turns) karena D2 + D3 scope addition.

---

## 3. Phase 3b — Cards Live Transition (C10-C12)

### 3.1 `runAllValidators.ts` update

**Before (Tier 4b state, current):**
```typescript
const PENDING_CONSTRAINTS: Record<ConstraintId, '4b' | '4c' | null> = {
  C1: null, C2: null, C3: null, C4: null, C5: null,
  C6: null, C7: null, C8: null, C9: null,
  C10: '4c', C11: '4c', C12: '4c',  // ← all todo
};
```

**After (Tier 4c state, post-3b):**
```typescript
const PENDING_CONSTRAINTS: Record<ConstraintId, '4b' | '4c' | null> = {
  C1: null, C2: null, C3: null, C4: null, C5: null,
  C6: null, C7: null, C8: null, C9: null,
  C10: null, C11: null, C12: null,  // ← all live, 12/12 implemented
};
```

Plus import + call 3 new validators:
```typescript
import { validateC10 } from './c10';
import { validateC11 } from './c11';
import { validateC12 } from './c12';
```

Add ke `liveResults` map. `todoIds` array jadi empty (`[]`).

### 3.2 ValidationContext wiring (CRITICAL — easy to forget)

C11 butuh `rpdsData` di ctx, otherwise akan return `pending`. Saat ini `ValidasiRevisiPOK.tsx:76-81` build ctx tanpa rpdsData:

**Before (current state, `ValidasiRevisiPOK.tsx`):**
```typescript
const newResult = runAllValidators({
  ta: selectedYear,
  sections: paguSections,
  evaluatedAt: new Date(),
  lhrApipAcknowledged,
});
```

**After (Phase 3b):**
```typescript
const newResult = runAllValidators({
  ta: selectedYear,
  sections: paguSections,
  evaluatedAt: new Date(),
  lhrApipAcknowledged,
  rpdsData,           // ← NEW: untuk C11 cross-table check
  c11Strategy,        // ← NEW: untuk T9 toggle (default 'permisif' kalau undefined)
});
```

**App.tsx — pass `rpdSections` prop ke ValidasiRevisiPOK:**
```typescript
<ValidasiRevisiPOK
  paguSections={paguSections}
  rpdSections={rpdSections}   // ← NEW
  ...existing props...
/>
```

**ValidasiRevisiPOK prop type extension:**
```typescript
interface ValidasiRevisiPOKProps {
  paguSections: PaguSection[];
  rpdSections?: RPDSection[];   // ← NEW (optional untuk graceful degradation)
  ...existing fields...
}
```

Similarly `PaguAnggaran.tsx:301` inline indicator call juga butuh wiring sama (untuk inline dots berfungsi untuk C11 affected rows).

### 3.3 Subtitle + counter updates di `ValidasiRevisiPOK.tsx`

| Element | Before (Tier 4b) | After (Tier 4c) |
|---|---|---|
| Sub-branch group "4c" subtitle | `"3 constraints · BELUM TERSEDIA"` | `"3 constraints · IMPLEMENTED"` |
| Implemented counter | `9/12` | `12/12` |
| "BELUM TERSEDIA" chip | `count: 3` | `count: 0` (atau hide) |
| Progress bar | 75% fill | 100% fill ✓ |

### 3.4 Submit button finally enables

Submit gating per Tier 4b sudah triple-gate:
```typescript
const submitEnabled = canSubmit && allImplemented && lhrApipAcknowledged;
```

Effect Tier 4c: `allImplemented = (todoIds.length === 0) = true` (12/12). Kalau juga `canSubmit` (no fail/pending) + LHR acknowledged → **Submit button ENABLES for first time in project history**.

Tooltip update tetap berfungsi: kalau ada fail/pending/warn akan tampil reason; kalau semua hijau + LHR confirmed → tampil "Siap submit".

### 3.5 No card state component change

`ValidationConstraintCard.tsx` already supports 6 states (pass/warn/fail/pending/na/todo) sejak Tier 4a Phase 3a. Transition `todo → live` purely via real validator output. Zero card component code change untuk D1.

**BUT** — D3 (toggle UI) akan modify card untuk C11 specifically. Lihat §5 di bawah.

---

## 4. Phase 3c-nav — Cross-tab Navigation Refactor (T7)

### 4.1 Signature change (T7 Owner-approved)

**Current (`ValidasiRevisiPOK.tsx:36` + DetailPanel `:220`):**
```typescript
onNavigateToPagu?: (sectionId?: string, rowId?: string) => void;
```

**Proposed (Tier 4c):**
```typescript
type NavTarget = 'pagu' | 'rpd';

onNavigate?: (target: NavTarget, sectionId?: string, rowId?: string) => void;
```

Backward compat strategy: **keep `onNavigateToPagu` selama transition** (mark @deprecated), tambah `onNavigate` baru. ValidasiRevisiPOK + DetailPanel internally pakai `onNavigate`, mapping ke onNavigateToPagu kalau kompat (route target='pagu' → old callback). Setelah Phase 3c-nav stable, remove `onNavigateToPagu` di Phase 3d cleanup.

### 4.2 DetailPanel dual buttons untuk C11

C11 violation ada 2 row reference: pagu (affectedRowIds) + RPD (detail.rpdRowId). Detail panel render dua tombol:

```
┌─ C11 Violations ─────────────────────────────────────┐
│  Akun "521115" (Honor) ter-revisi dan ada entri RPD │
│  ...                                                 │
│  [→ Pagu Anggaran (r1)]  [→ RPD (rpd-r1)]            │
└──────────────────────────────────────────────────────┘
```

Logic detection — render dual button hanya untuk C11 violations dengan reason `'rpd_entry_affected'`:
```typescript
{violation.constraintId === 'C11' && violation.detail?.reason === 'rpd_entry_affected' && (
  <>
    <button onClick={() => onNavigate('pagu', detail.paguSectionId, detail.paguRowId)}>
      → Pagu Anggaran
    </button>
    <button onClick={() => onNavigate('rpd', detail.rpdSectionId, detail.rpdRowId)}>
      → RPD
    </button>
  </>
)}
```

Validators lain (C1-C9) tetap pakai single `→ Pagu Anggaran` button. C12 tidak punya affectedRowIds → no navigation buttons (cuma dashboard card info).

### 4.3 App.tsx route handler

```typescript
const handleValidationNavigate = (target: NavTarget, sectionId?: string, rowId?: string) => {
  if (target === 'pagu') {
    if (sectionId && rowId) setPendingPaguRowHighlight({ sectionId, rowId });
    handleSubTabChange(SubTab.PAGU_ANGGARAN);
  } else if (target === 'rpd') {
    if (sectionId && rowId) setPendingRpdRowHighlight({ sectionId, rowId });  // ← NEW state
    handleSubTabChange(SubTab.RPD);
  }
};

<ValidasiRevisiPOK
  ...
  onNavigate={handleValidationNavigate}
/>
```

### 4.4 RPD.tsx scroll/highlight (mirror PaguAnggaran Tier 4a Phase 3d)

`RPD.tsx` belum punya scroll/highlight mechanism. Saat ini cuma render sections + rows. Phase 3c-nav add:

```typescript
interface RPDProps {
  sections: RPDSection[];
  ...existing props...
  pendingRowHighlight?: { sectionId: string; rowId: string } | null;
  onHighlightConsumed?: () => void;
}
```

Behavior mirror PaguAnggaran.tsx (Tier 4a Phase 3d pattern):
1. `useEffect` watching `pendingRowHighlight` change
2. If non-null + row exists in DOM → `scrollIntoView({ behavior: 'smooth', block: 'center' })`
3. Add CSS class `bg-emerald-100 transition-colors duration-1000` untuk 2 detik glow effect
4. After 2s `setTimeout`, remove class + call `onHighlightConsumed()` to clear parent state

Reference implementation: `components/PaguAnggaran.tsx:310-370` (search "pendingRowHighlight" anchor pattern).

### 4.5 New state di App.tsx

```typescript
// [Tier 4c Phase 3c-nav] Pending row untuk scroll + highlight di RPD tab.
// Mirror pattern pendingPaguRowHighlight (Tier 4a Phase 3d).
const [pendingRpdRowHighlight, setPendingRpdRowHighlight] = useState<
  { sectionId: string; rowId: string } | null
>(null);
```

---

## 5. Phase 3c-toggle — C11 Toggle UI (T9 BARU)

### 5.1 Placement decision (2 opsi, perlu Owner choice di Phase 3a Q&A)

**Opsi A — Inline pada card C11 di dashboard:**
```
┌─ C11 Tidak Ubah RPD ─────────────────── [PASS] ──┐
│  ⓘ Mode evaluasi:                                │
│    ◉ Permisif  ○ Ketat                            │
│    (hover ⓘ untuk penjelasan trade-off)           │
│  ──────────────────────────────────────────────  │
│  4 perubahan, 0 entri RPD — aman                 │
│  [Mode: PERMISIF — default pengembangan...]      │
└──────────────────────────────────────────────────┘
```

- **Pro**: Maximum discoverability, in-context dengan validator output, langsung lihat efek
- **Con**: Card C11 jadi sedikit busier dibanding 11 card lain (inconsistent visual weight)

**Opsi B — Di detail panel (collapsible, hanya tampil saat user klik "Lihat Detail" C11):**
```
┌─ Detail C11 ─────────────────────────────────────┐
│  Violations: ...                                 │
│  ─────────────────────────────────────────────── │
│  ⚙ Mode evaluasi (advanced):                     │
│    ◉ Permisif  ○ Ketat                           │
│    Tooltip: "Permisif = pass kalau belum ada     │
│              perubahan; Ketat = pending sampai   │
│              data RPD loaded"                    │
└──────────────────────────────────────────────────┘
```

- **Pro**: Cards tetap visual-consistent, toggle tersembunyi di detail (advanced)
- **Con**: Lower discoverability — Sie Renbang harus klik dulu untuk lihat toggle

**Saya recommend Opsi A** untuk learning-by-doing intent. Discoverability adalah goal utama feature ini — kalau tersembunyi di detail panel, Sie Renbang mungkin tidak pernah eksplorasi mode lain.

### 5.2 Visual design (Opsi A)

```tsx
<div className="rounded-md border border-slate-200 bg-slate-50 p-2 mb-2 text-xs">
  <div className="flex items-center gap-2 mb-1">
    <span className="font-semibold text-slate-700">Mode evaluasi:</span>
    <Tooltip content={
      <div className="max-w-xs space-y-1 p-2">
        <p><strong>Permisif</strong> (default): pass kalau belum ada perubahan,
           walau data RPD belum loaded.</p>
        <p><strong>Ketat</strong>: pending dulu sampai data RPD loaded, walau
           belum ada perubahan.</p>
        <p className="text-slate-500 italic">Perbedaan hanya terasa saat
           pertama buka aplikasi sebelum data lengkap.</p>
      </div>
    }>
      <InfoIcon size={14} className="text-slate-400 cursor-help" />
    </Tooltip>
  </div>
  <div className="flex gap-3">
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input
        type="radio"
        name="c11-strategy"
        value="permisif"
        checked={c11Strategy === 'permisif'}
        onChange={() => onC11StrategyChange('permisif')}
      />
      <span>Permisif</span>
    </label>
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input
        type="radio"
        name="c11-strategy"
        value="ketat"
        checked={c11Strategy === 'ketat'}
        onChange={() => onC11StrategyChange('ketat')}
      />
      <span>Ketat</span>
    </label>
  </div>
</div>
```

Visual:
- Light gray container (slate-50) — kalem, tidak compete dengan card primary content
- InfoIcon (Lucide React) → hover tooltip dengan trade-off penjelasan
- Radio buttons native (consistent dengan checkbox LHR APIP pattern Tier 4b)

### 5.3 localStorage persist (per-device per-user)

**Key:** `c11PendingStrategy`
**Value:** `'permisif' | 'ketat'` (string)
**Default:** `'permisif'` jika absent di localStorage

```typescript
// Read at component mount
const [c11Strategy, setC11Strategy] = useState<'permisif' | 'ketat'>(() => {
  const stored = localStorage.getItem('c11PendingStrategy');
  return stored === 'ketat' ? 'ketat' : 'permisif';
});

// Persist on change
const handleC11StrategyChange = (strategy: 'permisif' | 'ketat') => {
  setC11Strategy(strategy);
  localStorage.setItem('c11PendingStrategy', strategy);
};
```

Per-device karena tiap Sie Renbang / Karumkit / Owner mungkin punya preference berbeda — global system_settings = future enhancement kalau ada konsensus tim.

### 5.4 ValidasiRevisiPOK passes strategy to validator

`c11Strategy` flows: localStorage → state → ValidasiRevisiPOK → runAllValidators ctx:

```typescript
const validationResult = runAllValidators({
  ta: selectedYear,
  sections: paguSections,
  rpdsData,
  c11Strategy,   // ← NEW dari local state di ValidasiRevisiPOK
  ...other props
});
```

**Re-validate trigger:** Saat user flip toggle, useEffect re-trigger handleValidate. Cards instantly update tanpa user perlu click "⟳ Validate".

---

## 6. Phase 3b — Inline Indicators Behavior (incremental verifikasi)

Inline indicators di Pagu Anggaran tab (Tier 4a Phase 3c) sudah established. Tier 4c contribute 3 new constraint types:

| Constraint | affectedRowIds? | Inline dot color | Tested? |
|---|---|---|---|
| **C10** SBM | YES (warn/blocker per row) | **Amber dot** untuk warn, red untuk fail | ⏳ verify di Phase 3b — first WARN E2E |
| **C11** RPD | YES (blocker per pagu row) | Red dot | ⏳ verify di Phase 3b |
| **C12** Deadline | **NO** (global state) | **No inline dot** — dashboard card only | ⏳ confirm tidak break rowConstraintMap |

`rowConstraintMap.ts` (`utils/validators/rowConstraintMap.ts`) auto-handles violations dengan affectedRowIds, jadi C10/C11 dots akan otomatis muncul tanpa code change. C12 tidak akan muncul karena no affectedRowIds → graceful skip di map building.

**Critical E2E test untuk Phase 3b:** Verifikasi C10 amber dot muncul di pagu row dengan deviasi 15% (warning), dan red dot muncul untuk deviasi 30% (fail). Ini first WARN severity visualization end-to-end.

---

## 7. Phase 3d — Documentation Sync

Mirror Tier 4b Phase 3d pattern + additions specific Tier 4c:

| File | Update |
|---|---|
| `constants/devLog.ts` | Milestone `log-2026-05-12-tier-4c-phase-3-complete` + entry `log-2026-05-12-c11-toggle-feature` |
| `HANDOVER.md` | Tier 4c status: Phase 2b → Phase 3 COMPLETE, branch state diagram, "All 12 validators live" headline |
| `README.md` | Watchlist Tier 4c entry, update "9/12 implemented" → "12/12 implemented" |
| `SESSION-START-HERE.md` | Status banner update untuk fresh AI session — "Tier 4 fully complete, ready Tier 5 audit trail" |
| `SSOT-REFACTOR-LOG.md` | §0.11.1 **T9 entry baru** (toggle architecture Owner-approved 12 Mei 2026) + §0.11 status update "Phase 3 COMPLETE" |

---

## 8. Open Questions (untuk Owner)

| # | Question | Default rekomendasi |
|---|---|---|
| **Q1** | Toggle placement: Opsi A (inline card) vs Opsi B (detail panel)? | **Opsi A** untuk learning-by-doing discoverability |
| **Q2** | Toggle UI scope absorbed dengan 3c-nav (1 turn gabungan) vs split (2 turn terpisah)? | **Absorbed** — both modify ValidasiRevisiPOK area, ekonomis |
| **Q3** | `onNavigateToPagu` deprecation: keep selama Phase 3 (backward-compat) lalu remove di Phase 3d, atau hard-break langsung Phase 3c-nav? | **Keep + deprecate** — safer, 2-step transition |
| **Q4** | Tooltip explainer detail level: short (2 kalimat) vs medium (3-4 kalimat + analogi) vs long (full paragraph)? | **Medium** — balance informatif vs ringkas |
| **Q5** | `rpdSections` prop di PaguAnggaran.tsx inline indicator path: wajib pass dari App.tsx (extra prop drilling), atau OK kalau inline indicator C11 tidak available di pagu tab? | **Wajib pass** — konsistensi UX, C11 dots harus muncul di pagu |

---

## 9. Risk Notes

**Phase 3c-nav highest risk:**
- 4 files inter-connected (ValidasiRevisiPOK + DetailPanel inline + App.tsx + RPD.tsx)
- New state `pendingRpdRowHighlight` di App.tsx — perlu test ulang Tier 4a Phase 3d pattern works for RPD section
- RPD.tsx sebelumnya tidak punya scroll-mechanism — fresh implementation, bukan modify-existing

**Mitigation:**
- Implement RPD scroll/highlight isolated dulu (sebelum wire navigation) → manual test via React DevTools force-set state
- Keep `onNavigateToPagu` selama transition (Q3 default) supaya tests existing tidak break
- Stage modify per file: ValidasiRevisiPOK first (interface change + dual buttons), App.tsx second (handler), RPD.tsx third (scroll), DetailPanel last (consume new prop)

**Phase 3c-toggle low risk** karena isolated ke 1 component (ValidationConstraintCard atau ValidasiRevisiPOK). localStorage = battle-tested API, no race conditions di single-user app.

---

## 10. Cross-References

- Phase 3 baseline: `docs/TIER-4A-PHASE-3-UI-DESIGN.md` (full UI design Tier 4a) + `docs/TIER-4B-PHASE-3-UI-DESIGN.md` (Tier 4b delta)
- Tier 4c parent: `docs/TIER-4C-DESIGN.md` §5 (Phase 3 plan high-level)
- SSOT decisions: `SSOT-REFACTOR-LOG.md` §0.11.1 T1-T8 + T9 BARU (akan di-sync Phase 3d)
- Validator implementations: `utils/validators/c10.ts` + `c11.ts` + `c12.ts` (Phase 2b complete)
- Engine orchestrator: `utils/validators/runAllValidators.ts` (target update Phase 3b)
- ValidasiRevisiPOK: `components/ValidasiRevisiPOK.tsx` (target update Phase 3b-3c)
- App.tsx: state wiring rpdsData + pendingRpdRowHighlight + c11Strategy
- RPD.tsx: scroll/highlight implementation (mirror PaguAnggaran Tier 4a Phase 3d)
- Phase 3c reference pattern: `components/PaguAnggaran.tsx:310-370` (search "pendingRowHighlight" anchor)

---

*Phase 3a delta design — 12 Mei 2026. 5 Owner-blocking questions (Q1-Q5) di §8. Lanjut Phase 3b implementation setelah Owner clarify Q-set (atau approve defaults batch).*
