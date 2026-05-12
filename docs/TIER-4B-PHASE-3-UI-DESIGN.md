# Tier 4b Phase 3 — UI Integration Design (Delta)

**Status:** 📋 DRAFT (Phase 3a deliverable, 11 Mei 2026)
**Sub-branch:** `feature/tier-4b-revisi-mechanism` (Phase 2b complete, ready Phase 3)
**Predecessor design:** `docs/TIER-4A-PHASE-3-UI-DESIGN.md` (full UI baseline)
**Companion:** `docs/TIER-4B-DESIGN.md` §5 (Phase 3 plan high-level)

---

## 1. Scope — Why Brief

Tier 4a Phase 3 sudah established UI infrastructure full:
- Sub-tab "1.5 Validasi Revisi POK"
- Dashboard 12-card grid (5 live + 7 todo placeholder)
- 6 card states (pass/warn/fail/pending/na/todo)
- Inline indicators di Pagu Anggaran tab
- Bidirectional Pagu ↔ Validasi navigation + scroll/highlight

Tier 4b Phase 3 cuma **incremental delta** — sebagian besar work "remove placeholder" + 1 NEW UX element.

---

## 2. Phase 3 Sub-Phase Breakdown

| Sub-phase | Deliverable | Scope |
|---|---|---|
| **3a (this doc)** | Brief design delta | <1 page, no code |
| **3b** | Cards live transition C6-C9 | `runAllValidators.ts` + label update |
| **3c** | LHR APIP checkbox NEW UX | Header + state wiring App.tsx |
| **3d** | Docs sync + Phase 3 complete | devLog + HANDOVER + README + SESSION-START-HERE |

**Total estimate:** 3 turns (lebih ringan dari Tier 4a Phase 3 yang 4-5 turns).

---

## 3. Phase 3b — Cards Live Transition (C6-C9)

### 3.1 `runAllValidators.ts` update

**Before (Tier 4a state):**
```typescript
const PENDING_CONSTRAINTS: Record<ConstraintId, '4b' | '4c' | null> = {
  C1: null, C2: null, C3: null, C4: null, C5: null,
  C6: '4b', C7: '4b', C8: '4b', C9: '4b',  // ← all todo
  C10: '4c', C11: '4c', C12: '4c',
};
```

**After (Tier 4b state):**
```typescript
const PENDING_CONSTRAINTS: Record<ConstraintId, '4b' | '4c' | null> = {
  C1: null, C2: null, C3: null, C4: null, C5: null,
  C6: null, C7: null, C8: null, C9: null,  // ← live now
  C10: '4c', C11: '4c', C12: '4c',
};
```

Plus import + call 4 new validators:
```typescript
import { validateC6 } from './c6';
import { validateC7 } from './c7';
import { validateC8 } from './c8';
import { validateC9 } from './c9';
```

And add ke `liveResults` map.

### 3.2 Subtitle update di `ValidasiRevisiPOK.tsx`

Sub-branch group "4b" subtitle:
- Before: `"4 constraints · BELUM TERSEDIA"`
- After: `"4 constraints · IMPLEMENTED"`

Aggregate counter di header auto-updates:
- Before: implemented 5/12
- After: implemented 9/12

Progress bar fill auto-extends.

### 3.3 No card state component change

`ValidationConstraintCard.tsx` already supports 6 states. Transition `todo → live` purely via `runAllValidators` output (`status` field comes from real validator instead of placeholder). Zero card component code change.

---

## 4. Phase 3c — LHR APIP Checkbox (NEW UX)

### 4.1 Placement

Insert checkbox di `ValidationDashboardHeader.tsx` — between progress bar and footer (Last validated + Submit button):

```
┌──────────────────────────────────────────────────────────────────┐
│ STATUS VALIDASI REVISI POK TA 2026                  [⟳ Validate] │
│ [counter chips...]                                                │
│ [progress bar 9/12...]                                            │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ ☐ Saya konfirmasi sudah review LHR APIP atas RKA TA 2026   │  │
│ │   sebelum mengajukan revisi POK kewenangan KPA              │  │
│ │   (Pasal 22 huruf b angka 2 Perdirjen Renhan 7/2025)        │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Last validated: 2 menit lalu          [📋 Submit Revisi POK]     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Visual design

- Container: `rounded-xl border border-slate-200 bg-slate-50 p-3 mb-4`
- Saat unchecked: amber accent (signal action needed)
- Saat checked: emerald accent (positive confirmation)
- Checkbox: native `<input type="checkbox">` styled dengan Tailwind
- Label: bold + reference Pasal

### 4.3 State management

**App.tsx tambah state:**
```typescript
const [lhrApipAcknowledgedByYear, setLhrApipAcknowledgedByYear] = useState<Record<number, boolean>>({});
```

**Pass ke ValidasiRevisiPOK:**
```typescript
<ValidasiRevisiPOK
  ...existing props...
  lhrApipAcknowledged={lhrApipAcknowledgedByYear[currentRKKSYear] ?? false}
  onLhrApipChange={(acknowledged) =>
    setLhrApipAcknowledgedByYear(prev => ({ ...prev, [currentRKKSYear]: acknowledged }))
  }
/>
```

**ValidasiRevisiPOK pass ke header + include di runAllValidators ctx:**
```typescript
const validationResult = runAllValidators({
  ta: selectedYear,
  sections: paguSections,
  evaluatedAt: new Date(),
  lhrApipAcknowledged,  // ← NEW
});
```

### 4.4 Submit button gating

Update logic — Submit enabled hanya kalau:
- canSubmit (no fail/pending in C1-C12) **AND**
- allImplemented (todo count 0) **AND**
- lhrApipAcknowledged (NEW gate)

Tooltip update mengikuti kondisi mana yang block.

### 4.5 In-memory v1 (per S6)

Per Decision S6 — state in-memory saja v1. App restart → re-confirm. Persistence Supabase = Tier 5 audit trail scope.

---

## 5. Phase 3d — Documentation Sync

Mirror Tier 4a Phase 3d pattern:

| File | Update |
|---|---|
| `constants/devLog.ts` | New milestone `log-2026-05-11-tier-4b-phase-3-complete` |
| `HANDOVER.md` | Tier 4b status: Phase 2b → Phase 3 COMPLETE, branch state diagram |
| `README.md` | Watchlist Tier 4b entry |
| `SESSION-START-HERE.md` | Status banner update untuk fresh AI session |

---

## 6. Open Questions

Tidak ada — semua decisions sudah locked di Phase 1 (S1-S6 Owner approved). Phase 3 cuma implementation.

---

## 7. Cross-References

- Phase 3 baseline: `docs/TIER-4A-PHASE-3-UI-DESIGN.md` (full UI design)
- Tier 4b parent: `docs/TIER-4B-DESIGN.md` (Phase 1 design)
- SSOT decisions: `SSOT-REFACTOR-LOG.md` §0.10.1 S1-S6
- Validator implementations: `utils/validators/c6.ts` ... `c9.ts` (Phase 2b)
- Engine orchestrator: `utils/validators/runAllValidators.ts` (target update Phase 3b)
- Header component: `components/ValidationDashboardHeader.tsx` (target update Phase 3c)
- Main orchestrator: `components/ValidasiRevisiPOK.tsx` + `App.tsx` state wiring

---

*Phase 3a delta design — 11 Mei 2026. No Owner-blocking questions. Lanjut Phase 3b implementation langsung.*
