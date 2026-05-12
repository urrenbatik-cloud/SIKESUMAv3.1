# Tier 5 Design — Workflow Audit Trail + State Machine

**Status:** 📋 PHASE 1 DESIGN — Owner-approved decisions locked (12 Mei 2026)
**Sub-branch (planned):** `feature/tier-5a-audit-trail-backend` + `feature/tier-5b-audit-trail-ui` (R8c split)
**Predecessor:** Tier 4c MERGED `9174782` (12 Mei 2026 — all 12 validators LIVE)
**Companion docs:** `docs/TIER-3-PLUS-PLAN.md` §Tier-5 (original blueprint) + this design doc (Phase 1 detailed)

---

## 1. Goal + Scope

State machine **per pengajuan revisi POK** (bukan per row, bukan per validator). Audit trail lengkap dari `draft → berlaku_efektif`. **Snapshot POK per tanggal penetapan KPA** — memungkinkan **time-travel viewing** ("POK efektif tanggal X seperti apa?").

**Why Tier 5 now**: Tier 4 complete → Submit Revisi POK button enables, tapi click Submit currently does nothing. Tier 5 build the **lifecycle setelah Submit** — record, track, snapshot, audit.

**What Tier 5 includes:**
1. **3 new Supabase tables** untuk persist usulan revisi + per-row changes + snapshot
2. **State machine logic** dengan transition validators + manual override mechanism (R6+)
3. **Submit flow integration** dari Tier 4c — Submit button create `usulan_revisi` record draft
4. **UI tab baru "Riwayat Revisi"** untuk list + manage usulan
5. **Snapshot viewer** untuk time-travel POK per tanggal
6. **Deadline reminder banner H-7** sebelum hard deadline (R4a V1)
7. **Validation history audit** embedded di usulan metadata (β JSONB)

**What Tier 5 does NOT include:**
- Tier 6 Template SK Revisi POK generation (scope mentioned, implementation defer ke Tier 6 sub-branch)
- Multi-user RBAC (R5a single-user proxy V1)
- Email/notification deadline reminders (R4b defer V2)
- Snapshot storage optimization beyond TA 2027 (Konteks 12 — subscription tier ke depan)

---

## 2. Decisions Locked (Owner-Approved 12 Mei 2026)

Mirror pattern Tier 4a R-series / Tier 4b S-series / Tier 4c T-series, Tier 5 pakai **R-series** (Revisi audit trail).

| ID | Decision | Status |
|---|---|---|
| **R1c** | Hybrid schema: status + tahun_anggaran + jenis columned, rest JSONB | ✅ Owner-approved |
| **R2b** | Full POK snapshot per tanggal_efektif (BUKAN delta) | ✅ Owner-approved |
| **R3c** | LHR APIP both: `system_settings` (global) + `usulan_revisi.data` (tied audit) | ✅ Owner-approved |
| **R4a** | Deadline banner V1 (R4b email defer V2) | ✅ Owner-approved |
| **R5a** | Single-user Sie Renbang proxy untuk Karumkit/KPA | ✅ Owner-approved |
| **R6+** | Permissive defaults + **manual override mechanism** | ✅ Owner-approved (NEW) |
| **R7c** | Snapshot immutability: DB trigger + app enforcement | ✅ Owner-approved |
| **R8c** | Tier 5 partition: 5a (backend) + 5b (frontend) split | ✅ Owner-approved |

### 2.1 R1c — Hybrid Schema Rationale

**Columned fields** (frequent query → indexed):
- `status` — filter UI list "draft di TA 2026", count per state
- `tahun_anggaran` — TA filter (RKKS sub-tab per tahun)
- `jenis` — `'revisi_pok'` vs `'pagu_berubah'` differentiation

**JSONB `data` field** (flexible, rare query):
- `no_sk`, dates, signatory names, justifikasi, dasar_perintah
- `metadata` (anticipated Tier 6 template fields)
- `validation_attempts[]` (R5 audit history β)
- `manual_override_log[]` (R6+ override tracking)

Balance: PostgreSQL indexed columns untuk performance critical paths, JSONB untuk future-proof flexibility. Konsisten dengan AP-8 SIKESUMA convention (`pagu_sections`, `bills` pakai pattern serupa).

### 2.2 R6+ Manual Override (NEW from Owner direction)

> "Sistem tidak boleh stuck karena terlalu strict. SIKESUMA adalah project pengembangan breakthrough — pattern 'learning by doing'."

**Mechanism**: Setiap state transition normal punya validation rules. **PLUS** ada escape hatch "Override + reason" yang catch-all transition any → any state.

**Audit trail**: Setiap override di-log dengan:
```typescript
{
  from_state: 'ditetapkan',
  to_state: 'draft',
  reason: 'Sie Renbang minta revisi ulang karena temuan baru',
  actor: 'Sie Renbang Angga',
  timestamp: '2026-05-15T10:30:00+07:00',
  manual_override: true,  // flag untuk audit query
}
```

**UI**: Saat state machine UI render, ada button "Override" disamping action buttons normal. Click → modal mandatory reason field → confirm → execute transition + log entry.

**V1 permissions**: Anyone (per R5a single-user proxy). V2 future: role-based — hanya Sie Renbang atau Owner yang bisa override.

---

## 3. Schema Detail (R1c Hybrid)

### 3.1 Table `usulan_revisi`

```sql
CREATE TABLE IF NOT EXISTS usulan_revisi (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Columned (R1c hybrid frequent query)
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'direkomendasi', 'diteruskan', 'ditetapkan', 'berlaku_efektif', 'ditolak')),
  tahun_anggaran INT NOT NULL,
  jenis VARCHAR(20) NOT NULL
    CHECK (jenis IN ('revisi_pok', 'pagu_berubah')),
  
  -- JSONB flexible data (R1c hybrid)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Standard audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes untuk common query patterns
CREATE INDEX IF NOT EXISTS idx_usulan_revisi_status_tahun
  ON usulan_revisi(status, tahun_anggaran);
CREATE INDEX IF NOT EXISTS idx_usulan_revisi_tahun_jenis
  ON usulan_revisi(tahun_anggaran, jenis);
CREATE INDEX IF NOT EXISTS idx_usulan_revisi_created
  ON usulan_revisi(created_at DESC);
```

**JSONB `data` shape** (TypeScript interface):

```typescript
interface UsulanRevisiData {
  // SK + dates
  no_sk?: string;
  tanggal_pengajuan?: string;        // ISO date
  tanggal_penetapan?: string;        // ISO date (tanggal SK)
  tanggal_berlaku_efektif?: string;  // = tanggal_penetapan per §3.6 vKoreksi
  
  // Actors (R5a single-user — Sie Renbang act as proxy)
  diusulkan_oleh?: string;           // Sie Renbang
  direkomendasi_oleh?: string;       // Karumkit
  ditetapkan_oleh?: string;          // KPA Palembang
  
  // Content
  justifikasi?: string;               // Pasal 22 narrative
  dasar_perintah?: string;            // untuk pagu_berubah
  
  // R3c — LHR APIP audit (tied to this submission)
  lhr_apip?: {
    nomor: string;
    tanggal: string;
    acknowledged_at: string;
  };
  
  // R5 — Validation history audit (β JSONB-embedded)
  validation_attempts?: Array<{
    attempted_at: string;            // ISO timestamp
    result: 'pass' | 'fail' | 'pending';
    violations_summary?: {           // hanya kalau fail/pending
      constraintIds: string[];        // e.g., ['C8', 'C11']
      total: number;
    };
  }>;
  
  // R6+ — Manual override log
  manual_override_log?: Array<{
    from_state: string;
    to_state: string;
    reason: string;
    actor: string;
    timestamp: string;
    manual_override: true;            // marker untuk audit query
  }>;
  
  // Tier 6 forward-compatible (β overlap — populate later)
  template_sk_metadata?: {
    template_version?: string;        // mis. 'v3-13.1' per vKoreksi
    signatory_list?: Array<{
      name: string;
      jabatan: string;
      pangkat?: string;
      nrp?: string;
    }>;
    bas_context?: unknown;            // freeform, defined Tier 6
  };
}
```

### 3.2 Table `usulan_revisi_perubahan`

Per-row diff tracking — apa yang berubah di usulan ini.

```sql
CREATE TABLE IF NOT EXISTS usulan_revisi_perubahan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usulan_id UUID NOT NULL REFERENCES usulan_revisi(id) ON DELETE CASCADE,
  
  -- Columned (frequent join)
  pagu_row_id UUID NOT NULL,           -- references pagu_row data jsonb id
  
  -- JSONB flexible
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usulan_revisi_perubahan_usulan
  ON usulan_revisi_perubahan(usulan_id);
CREATE INDEX IF NOT EXISTS idx_usulan_revisi_perubahan_pagu_row
  ON usulan_revisi_perubahan(pagu_row_id);
```

**JSONB `data` shape**:

```typescript
interface UsulanRevisiPerubahanData {
  kode: string;                       // pagu kode (mis. 521115)
  description?: string;               // snapshot description saat usulan dibuat
  nilai_semula: number;               // jumlahBiayaAwal
  nilai_revisi: number;               // jumlahBiayaRevisi
  alasan?: string;                    // optional per-row justifikasi
  section_id?: string;                // parent section reference
}
```

### 3.3 Table `snapshot_pok`

**R2b full snapshot** — immutable POK state per tanggal_efektif.

```sql
CREATE TABLE IF NOT EXISTS snapshot_pok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Columned
  tahun_anggaran INT NOT NULL,
  tanggal_efektif DATE NOT NULL,        -- = tanggal_penetapan SK
  usulan_id UUID NOT NULL REFERENCES usulan_revisi(id),
  
  -- JSONB full POK snapshot (R2b — entire pagu state)
  snapshot_data JSONB NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_pok_tahun_tanggal
  ON snapshot_pok(tahun_anggaran, tanggal_efektif DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_pok_usulan
  ON snapshot_pok(usulan_id);

-- R7c — Immutability enforcement via DB trigger
CREATE OR REPLACE FUNCTION snapshot_pok_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'snapshot_pok records are immutable per Tier 5 R7c — cannot UPDATE row id=%', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshot_pok_immutable
  BEFORE UPDATE ON snapshot_pok
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_pok_prevent_update();
```

**JSONB `snapshot_data` shape**:

```typescript
interface SnapshotPokData {
  // Full pagu sections array at tanggal_efektif
  pagu_sections: PaguSection[];        // existing type
  
  // Optional metadata
  total_pagu: number;                   // pre-computed for fast display
  total_realisasi?: number;             // kalau available
  
  // Source reference
  generated_from_usulan_id: string;
  generated_at: string;                 // ISO timestamp
}
```

**Application-level immutability** (R7c app enforcement layer):
- No UPDATE endpoint exposed di Supabase CRUD layer
- Insert-only operations untuk `snapshot_pok`
- DELETE-safe via FK constraints (cascade dari usulan_revisi)

---

## 4. State Machine

### 4.1 Diagram

```
┌─────────┐
│  draft  │ ←──── Sie Renbang creates new usulan
└────┬────┘
     │ (1) Submit + validasi C1-C12 pass + LHR ack
     ▼
┌──────────────┐
│ direkomendasi │ ←──── Sie Renbang submitted, awaiting Karumkit
└──────┬───────┘
       │ (2) Karumkit approve
       ▼
┌─────────────┐
│ diteruskan  │ ←──── Karumkit approved, awaiting KPA Palembang
└──────┬──────┘
       │ (3) Palembang upload SK + tanggal_penetapan
       ▼
┌──────────────┐
│  ditetapkan  │ ←──── SK signed, awaiting tanggal_berlaku_efektif
└──────┬───────┘
       │ (4) Auto pada tanggal_berlaku_efektif
       │     → snapshot_pok record created
       ▼
┌────────────────┐
│ berlaku_efektif │ ←──── Final state (snapshot immutable)
└────────────────┘

Rejection branch (R6 permissive defaults):
  draft / direkomendasi / diteruskan / ditetapkan / berlaku_efektif
    │
    ▼ (5) Reject + reason
  ┌─────────┐
  │ ditolak │ ←──── End state
  └─────────┘

Manual override (R6+ NEW):
  Any state → Any state + mandatory reason → audit log entry
```

### 4.2 Transition Rules (V1)

| # | From | To | Actor | Pre-condition | Side Effect |
|---|---|---|---|---|---|
| 1 | `draft` | `direkomendasi` | Sie Renbang | C1-C12 all pass/NA + LHR APIP ack | None |
| 2 | `direkomendasi` | `diteruskan` | Karumkit (via Sie Renbang proxy R5a) | None | None |
| 3 | `diteruskan` | `ditetapkan` | Palembang (proxy R5a) | `no_sk` + `tanggal_penetapan` set | None |
| 4 | `ditetapkan` | `berlaku_efektif` | Auto (cron-like) | Current date >= `tanggal_berlaku_efektif` | Create `snapshot_pok` |
| 5 | Any except `berlaku_efektif` | `ditolak` | KPA/Karumkit (proxy R5a) | Reason text | None |
| **6 (NEW)** | **Any** | **Any** | **Manual Override (R6+)** | **Reason mandatory** | **Log entry `manual_override_log[]`** |

**Note transition #6**: Per Owner direction R6+, override allows:
- `berlaku_efektif → ditolak` (post-fact rejection, e.g., temuan audit Itjenad)
- `ditetapkan → draft` (revisi ulang karena temuan baru)
- `ditolak → draft` (resubmit setelah perbaikan)
- Any other unusual flow yang Sie Renbang butuh

Untuk safety: override **TIDAK** trigger side effects normal (mis. `ditetapkan → berlaku_efektif` via override BUKAN create snapshot — snapshot hanya via auto-transition #4).

### 4.3 Application-Level Transition Validator

TypeScript module `utils/usulanRevisiStateMachine.ts`:

```typescript
type UsulanStatus = 'draft' | 'direkomendasi' | 'diteruskan' | 'ditetapkan' | 'berlaku_efektif' | 'ditolak';

interface TransitionContext {
  fromStatus: UsulanStatus;
  toStatus: UsulanStatus;
  usulan: UsulanRevisi;
  ctx: ValidationContext;              // dari Tier 4
  isManualOverride?: boolean;          // R6+ flag
  overrideReason?: string;             // R6+ mandatory if override
}

interface TransitionResult {
  allowed: boolean;
  reason?: string;                     // kenapa allowed/disallowed
  sideEffects?: Array<'create_snapshot' | 'send_notification'>;
}

function validateTransition(ctx: TransitionContext): TransitionResult {
  // R6+ override always allowed (with mandatory reason)
  if (ctx.isManualOverride) {
    if (!ctx.overrideReason || ctx.overrideReason.trim().length < 5) {
      return { allowed: false, reason: 'Override membutuhkan reason minimal 5 karakter' };
    }
    return { allowed: true, reason: 'Manual override granted' };
  }
  
  // Normal transition rules
  const rule = TRANSITION_RULES[ctx.fromStatus]?.[ctx.toStatus];
  if (!rule) {
    return { allowed: false, reason: `Transition ${ctx.fromStatus} → ${ctx.toStatus} tidak valid normal flow. Gunakan Manual Override jika perlu.` };
  }
  
  return rule.validator(ctx);
}
```

---

## 5. Tier 5+6 Overlap β (Forward-Compatible Schema)

### 5.1 Konsep

Tier 6 nanti = generate Template SK Revisi POK dari `usulan_revisi` data. **Tier 5 design anticipate** field-field yang Tier 6 perlu, supaya schema TIDAK BERUBAH saat Tier 6 implementation.

### 5.2 Anticipated Tier 6 Fields di `data.template_sk_metadata`

Dari `docs/REVISI-POK-PAGU-vKoreksi.md` §13 (5 sub-templates 13.1-13.4):

```typescript
template_sk_metadata?: {
  template_version?: string;          // 'v3-13.1', 'v3-13.2', etc.
  
  // Signatory list (untuk SK signing block)
  signatory_list?: Array<{
    role: 'pejabat_pembuat_komitmen' | 'kuasa_pengguna_anggaran' | ...;
    name: string;
    jabatan: string;
    pangkat?: string;
    nrp?: string;
  }>;
  
  // BAS context (untuk Lampiran SK — bagan akun standar)
  bas_context?: {
    kode_satker: string;
    kode_kegiatan: string;
    kode_kro: string;
    nama_kro: string;
    nama_ro: string;
  };
  
  // Nomor SK formatting
  nomor_sk_format?: {
    prefix?: string;                  // e.g., "B/123/RUM-IV/V/2026"
    auto_increment?: boolean;
  };
};
```

### 5.3 Implementation Boundary

| Tier | What | Status |
|---|---|---|
| **Tier 5** | Schema accommodate `template_sk_metadata` field, **populate manual via UI atau API** | ⏳ Phase 2-3 |
| **Tier 6** | Generate SK PDF/DOCX dari `template_sk_metadata` + `usulan_revisi` data | ⏳ separate sub-branch |

Tier 5 UI **TIDAK build** SK template editor. Field di-populate raw via JSONB editor (advanced) atau defaulted ke null. Tier 6 nanti add proper UI form untuk template metadata.

---

## 6. Validation History Audit β (JSONB-Embedded)

### 6.1 Concept

Setiap Submit attempt = 1 entry di `usulan_revisi.data.validation_attempts[]`. Useful untuk Itjenad audit ("Sie Renbang attempted submit 3 times, first 2 had C8 fail, 3rd pass").

### 6.2 Shape

```typescript
validation_attempts: [
  {
    attempted_at: '2026-05-15T10:30:00+07:00',
    result: 'fail',
    violations_summary: {
      constraintIds: ['C8', 'C11'],
      total: 5,                       // 5 violations across C8 + C11
    },
  },
  {
    attempted_at: '2026-05-15T11:15:00+07:00',
    result: 'fail',
    violations_summary: {
      constraintIds: ['C11'],
      total: 2,                       // 3 fixed, 2 remaining
    },
  },
  {
    attempted_at: '2026-05-15T11:45:00+07:00',
    result: 'pass',                   // C8 ack + C11 RPD detached → all pass
  },
]
```

### 6.3 Storage Cost Estimate

Typical usulan:
- <10 Submit attempts (mostly 1-3)
- Each entry: ~200 bytes
- Total per usulan: ~2 KB
- Annual 5-10 usulan per RKKS: ~20 KB total

**Negligible storage growth**. JSONB embedded acceptable V1.

V2 enhancement (kalau Tier 5+ scale matures): extract ke separate table `usulan_revisi_validation_log` dengan dedicated indexes.

---

## 7. Phase 1.5 — DDL Preparation + Owner Execution

### 7.1 Migration SQL Scripts

Files yang fresh AI session akan prepare:

```
migrations/
├── tier-5-001-usulan-revisi-schema.sql      (Tables + Indexes)
├── tier-5-002-usulan-revisi-rls-policies.sql (Row Level Security)
├── tier-5-003-snapshot-pok-immutability.sql  (R7c DB trigger)
└── tier-5-004-rollback.sql                   (untuk emergency rollback)
```

### 7.2 Owner DDL Execution Procedure

Per Konteks 4 (12 Mei 2026): **AI-auto-execute DDL via Supabase API key** (Owner preference for faster iteration).

Procedure di fresh session:
1. Fresh AI prepare SQL scripts
2. Fresh AI display SQL untuk Owner review
3. Fresh AI verify Supabase URL + key di credentials file
4. Fresh AI run DDL via `psql` atau Supabase REST API (with explicit per-operation Owner confirmation)
5. Fresh AI verify tables exist via introspection query
6. Fresh AI log execution di SSOT + devLog

**Audit safety**:
- Setiap DDL operation di-display dulu ke Owner sebelum execute
- Owner confirm dengan eksplisit "ya, run"
- Log DDL execution timestamp + script hash di SSOT

---

## 8. R8c Partition — Tier 5a + Tier 5b

### 8.1 Tier 5a — Backend (~5-7 turn fresh session)

**Branch**: `feature/tier-5a-audit-trail-backend`

**Deliverables**:
1. **TypeScript types** untuk `UsulanRevisi`, `UsulanRevisiPerubahan`, `SnapshotPok`
2. **State machine module** `utils/usulanRevisiStateMachine.ts` dengan transition validators + R6+ override
3. **Supabase CRUD layer** `services/usulanRevisiService.ts` (insert/select/update operations)
4. **Submit flow integration** di `ValidasiRevisiPOK.tsx` — Submit button → create draft usulan_revisi
5. **Tests** untuk state machine logic (~30-40 tests)

**Acceptance**:
- Submit button creates real `usulan_revisi` record (status='draft')
- State machine transitions enforced di app + DB
- Manual override functional dengan audit log
- LHR APIP migration ke `system_settings` + tied audit

### 8.2 Tier 5b — Frontend (~5-7 turn fresh session)

**Branch**: `feature/tier-5b-audit-trail-ui`

**Deliverables**:
1. **UI design delta brief** `docs/TIER-5-PHASE-3-UI-DESIGN.md`
2. **New sub-tab "Riwayat Revisi"** di `App.tsx` (placement: 1.6 atau new top tab)
3. **Usulan list view** dengan status timeline + filter (per TA, per status, per jenis)
4. **Submit flow modal** untuk fill `justifikasi`, `dasar_perintah`, dll.
5. **State machine progression UI** — visual indicator + action buttons per state
6. **Override button + modal** dengan mandatory reason field
7. **Snapshot viewer** time-travel POK per tanggal
8. **Deadline reminder banner H-7** di dashboard

**Acceptance**:
- Full UX flow draft → berlaku_efektif visible + actionable
- Override capability tested di various transitions
- Snapshot viewer renders POK historical state correctly
- Deadline banner triggers H-7 sebelum hard deadline

---

## 9. Acceptance Criteria (Tier 5 Full)

After Tier 5a + Tier 5b merged:

- [ ] **3 tables exist** di Supabase: `usulan_revisi`, `usulan_revisi_perubahan`, `snapshot_pok`
- [ ] **State machine transitions enforce** rules (no skipping states except via override)
- [ ] **Manual override capability** functional dengan audit log entry per override
- [ ] **Audit trail viewable** per usulan (validation_attempts + manual_override_log + per-row changes)
- [ ] **Snapshot data immutable** (DB trigger + app no-UPDATE endpoint)
- [ ] **Hard deadline warnings active** (banner H-7 sebelum 31 Okt, 30 Nov, 26 Des, 31 Des)
- [ ] **LHR APIP persisted** (system_settings global + usulan_revisi tied per submission)
- [ ] **Validation history captured** di usulan_revisi.data.validation_attempts[]
- [ ] **Submit flow integrated** dari Tier 4c (Submit button creates real record)
- [ ] **Tier 6 forward-compat fields** ada di schema (template_sk_metadata anticipated)
- [ ] **Test baseline grows** dari 486 → ~520-540 (estimasi +30-50 tests Tier 5)
- [ ] **TS 8 maintained**
- [ ] **Vite build success**
- [ ] **Owner Vercel preview E2E test** approved sebelum Tier 5b squash merge

---

## 10. Open Items + V2 Defer

### V2 (defer post Tier 5 stabil)

- **R4b — Email/notification deadline reminder** (30 hari before deadline)
- **R5b — Multi-user RBAC** (Supabase auth + role-based access)
- **Validation log V2** — extract ke separate table kalau scale grow
- **Snapshot storage optimization** (Konteks 12 — subscription tier kalau perlu)
- **Manual override permissions V2** — restrict ke specific roles

### Open from Tier 5 design (kalau Sie Renbang field-test feedback)

- **Override scope**: apakah ada state transitions yang TIDAK boleh override (e.g., `berlaku_efektif → draft` mungkin terlalu destructive)? V1: all allowed, V2: configurable
- **Snapshot growth monitor**: real-time storage tracker di UI? Per Konteks 12 defer
- **Tier 5+6 overlap depth**: kapan tepat Tier 6 implementation start? Setelah Tier 5 field-tested 1-2 bulan

---

## 11. Cross-References

- **Predecessor**: Tier 4c MERGED `9174782` (12 Mei 2026 — all 12 validators LIVE + Submit button enables)
- **Owner Policy**: `OWNER-POLICY-FOR-AI-SESSIONS.md` Addendum v1.2 (Supabase access policy + v3.2 strategy)
- **Original blueprint**: `docs/TIER-3-PLUS-PLAN.md` §Tier-5 (Owner-approved roadmap 11 Mei 2026)
- **Master domain**: `docs/REVISI-POK-PAGU-vKoreksi.md` §3 (Revisi POK Pasal 22) + §6 (Batas Waktu Pasal 24) + §12 (Klarifikasi Sie Renbang) + §13 (Template SK)
- **Anti-patterns**: SSOT §0.7.5 AP-8 (envelope JSONB pattern)
- **Tier 4c reference**: `docs/TIER-4C-DESIGN.md` + `docs/TIER-4C-PHASE-3-UI-DESIGN.md` (pattern untuk Tier 5 design structure)
- **State machine reference**: existing `bills` table state machine (kalau ada) atau `audit_log` pattern

---

## 12. Estimasi Effort + Timeline

| Sub-tier | Estimasi turn | Estimasi waktu (kalender) |
|---|---|---|
| **Phase 1.5** (DDL prep + Owner execute) | 1-2 turn | 1 sesi fresh AI |
| **Tier 5a** (backend) | 5-7 turn | 2-3 sesi fresh AI |
| **Tier 5b** (frontend) | 5-7 turn | 2-3 sesi fresh AI |
| **TOTAL Tier 5** | **11-16 turn** | **5-8 sesi fresh AI** |

Estimasi serupa dengan Tier 4c (yang juga punya complexity comparable: validators + UI integration + state).

---

*Phase 1 design — 12 Mei 2026, post Tier 4c MERGED. R1-R8 + R6+ override Owner-approved. Lanjut Phase 1.5 (DDL prep) di fresh AI session.*
