# Tier 3+ Re-Architecture Plan — SIKESUMA TA 2026

**Status:** Pending — execute di fresh session dengan feature branches.
**Date:** 11 Mei 2026
**Authoritative Domain Reference:** [`docs/REVISI-POK-PAGU-vKoreksi.md`](./docs/REVISI-POK-PAGU-vKoreksi.md)
**Dependencies:** Tier 1+2 ✅ DONE (master doc integrated, LaporanRevisi.tsx workflow fixed)

---

## Konteks untuk Fresh Session

**Timing:** TA 2025 sudah lewat (data historis, Rp 2.7M, jangan di-modify). TA 2026 belum mulai. Window perfect untuk schema re-architecture sebelum data live masuk.

**Data Policy (Konteks 4 dr Ferry):** AI/automation TIDAK auto-modify pagu_row data. Migration data manual oleh Angga (Sie Renbang preference: "learning by doing"). Aplikasi sebagai recommendation engine.

**Branching:**
- Tier 3 → `feature/tier-3-metadata-schema`
- Tier 4 → `feature/tier-4-validation-c1-c10` (depends Tier 3)
- Tier 5 → `feature/tier-5-audit-trail` (depends Tier 4)
- Squash merge ke main setelah tested + Angga/Karumkit approved

**Mandatory reading sebelum start:**
1. `docs/REVISI-POK-PAGU-vKoreksi.md` (master doc, 614 baris) — **wajib pertama**
2. `SSOT-REFACTOR-LOG.md` (chronological + 7 caveats)
3. `HANDOVER.md` (Start Here block)
4. This file (Tier 3+ blueprint)

---

## Tier 3 — Schema Metadata Migration

### Goal
Tambah master metadata di `pagu_row` untuk enable validasi 10 hard constraints (C1-C10) Revisi POK kewenangan KPA per PMK 62/2023.

### Scope

**DB Migration (additive, nullable, no data change):**
```sql
ALTER TABLE pagu_row
  ADD COLUMN kro_code        VARCHAR(10),  -- mis. "EBA", "EBB"
  ADD COLUMN kro_name        VARCHAR(200), -- mis. "Layanan Perkantoran"
  ADD COLUMN kegiatan_code   VARCHAR(20),  -- kode Kegiatan
  ADD COLUMN kegiatan_name   VARCHAR(200),
  ADD COLUMN komponen_code   VARCHAR(10),  -- "001" (gaji) / "002" (operasional)
  ADD COLUMN komponen_name   VARCHAR(100),
  ADD COLUMN volume_ro       NUMERIC(15,2),
  ADD COLUMN satuan_ro       VARCHAR(50),
  ADD COLUMN sumber_dana_kode VARCHAR(10);  -- "RM" / "PNBP" / "PHLN" / "HLN" / "PDN" / "SBSN"
```

**TypeScript types update (`types.ts`):**
```typescript
export interface PaguRow {
  // ... existing fields
  kro_code?: string;
  kro_name?: string;
  kegiatan_code?: string;
  kegiatan_name?: string;
  komponen_code?: '001' | '002' | string;
  komponen_name?: string;
  volume_ro?: number;
  satuan_ro?: string;
  sumber_dana_kode?: 'RM' | 'PNBP' | 'PHLN' | 'HLN' | 'PDN' | 'SBSN' | string;
}
```

### Recommendation Engine (per Konteks 4 — TIDAK auto-modify data)

File: `utils/metadataRecommender.ts` (BARU)

```typescript
export function recommendMetadata(row: PaguRow): {
  kro?: { code: string; name: string; confidence: number };
  komponen?: { code: '001' | '002'; name: string; confidence: number };
  sumber_dana?: { kode: string; confidence: number };
} {
  // Pattern matching berdasarkan kode_bas / description
  // High confidence: 5111xx/5112xx/5114xx → Komponen 001 Belanja Pegawai
  // High confidence: 5211xx (kecuali 521115) → Komponen 002 Operasional Kantor
  // High confidence: "BPJS" in description → Sumber Dana "PNBP"
  // High confidence: kode 53xxxx → KRO + Kegiatan = Layanan Perkantoran biasanya
  // dll.
}
```

### UI (PaguAnggaran.tsx)

- Tambah expandable "Metadata" section per row (collapsed default, expand untuk edit)
- Auto-show recommendation badge dengan "Apply suggestion?" button (Sie Renbang accept/reject/edit)
- Badge color: high confidence = green, medium = amber, manual required = red
- TIDAK auto-fill data tanpa eksplisit Angga klik "Apply"

### Acceptance Criteria

- [ ] Schema migration applied (production Supabase)
- [ ] Existing TA 2025 data: 4 dummy 2024 sections + 10 TA 2025 sections — semua punya field nullable (default NULL)
- [ ] Recommendation engine pattern matching min. 80% high confidence rate untuk current 38 leaf rows TA 2025
- [ ] UI button "Terima Rekomendasi" / "Edit Manual" per row, tidak ada auto-apply

---

## Tier 4 — Validation Engine C1-C10

### Goal
Pre-flight check sebelum cetak Laporan Revisi POK. Block jika hard violation (C1, C6, C9). Soft warning untuk lainnya.

### File: `utils/revisiPOKValidator.ts` (BARU)

```typescript
export interface ConstraintViolation {
  constraint: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  affectedRows: string[]; // row IDs
}

export function validateRevisiPOK(sections: PaguSection[]): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // C1: Net change = 0
  // C2: All rows in same KRO (uses kro_code)
  // C3: All rows in same Kegiatan (uses kegiatan_code)
  // C4: All rows in same Satker (trivial untuk SIKESUMA single-satker)
  // C5: Volume RO tidak berubah (check volume_ro stays same pre/post revisi)
  // C6: 1 jenis belanja sama (2 digit pertama kode_bas: 51/52/53)
  // C7: Sumber dana sama (uses sumber_dana_kode)
  // C8: 1 komponen sama untuk belanja operasional (uses komponen_code)
  // C9: Tidak boleh ada pagu minus pasca revisi
  // C10: Patuh SBM (defer — butuh SBM master data, mark INFO untuk Tier 4 awal)

  return violations;
}
```

### Severity Classification

| Constraint | Severity Default | Rationale |
|---|---|---|
| C1 (net=0) | ERROR (block) | Hard requirement PMK |
| C2-C4 (KRO/Kegiatan/Satker) | ERROR (block) | Hard requirement PMK |
| C5 (volume RO) | WARNING | Tergantung interpretasi |
| C6 (jenis belanja 2-digit) | ERROR (block) | Hard requirement PMK |
| C7 (sumber dana) | ERROR (block) | Hard requirement PMK |
| C8 (komponen) | WARNING | Hanya untuk belanja operasional |
| C9 (pagu minus) | ERROR (block) | Prinsip umum APBN |
| C10 (SBM) | INFO (defer) | Butuh SBM master data |

### UI

1. **Pre-flight banner** di top `PaguAnggaran.tsx`: "✓ Pagu valid untuk Revisi POK" atau "⚠ X violation: ..." dengan list.
2. **Disable button "Usulan Revisi POK"** kalau ada ERROR violation. Show tooltip violation summary.
3. **Validation modal** klik banner: full list violations + affected rows dengan link click-to-row.

### Acceptance Criteria

- [ ] Validator return all violations untuk current TA 2025 state
- [ ] Banner real-time update saat user edit row
- [ ] Button disabled state dengan tooltip
- [ ] Test case: 1 valid scenario + 5 violation scenarios

---

## Tier 5 — Workflow Audit Trail

### Goal
State machine per pengajuan revisi POK (bukan per row). Audit trail lengkap dari Draft → Berlaku Efektif. Snapshot POK per tanggal penetapan KPA.

### Schema Baru: `usulan_revisi`

```sql
CREATE TABLE usulan_revisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis VARCHAR(20) NOT NULL,  -- 'revisi_pok' | 'pagu_berubah'
  tahun_anggaran INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- 'draft' | 'direkomendasi' | 'diteruskan' | 'ditetapkan' | 'berlaku_efektif' | 'ditolak'
  no_sk VARCHAR(100),
  tanggal_pengajuan DATE,
  tanggal_penetapan DATE,  -- tanggal SK Revisi POK
  tanggal_berlaku_efektif DATE,  -- = tanggal_penetapan per §3.6 vKoreksi
  diusulkan_oleh VARCHAR(100),  -- Sie Renbang
  direkomendasi_oleh VARCHAR(100),  -- Karumkit
  ditetapkan_oleh VARCHAR(100),  -- KPA Palembang
  justifikasi TEXT,
  dasar_perintah TEXT,  -- untuk pagu_berubah
  metadata JSONB,  -- flexibility untuk future fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usulan_revisi_perubahan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usulan_id UUID REFERENCES usulan_revisi(id) ON DELETE CASCADE,
  pagu_row_id UUID REFERENCES pagu_row(id),
  nilai_semula NUMERIC(15,2),
  nilai_revisi NUMERIC(15,2),
  alasan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE snapshot_pok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_anggaran INT NOT NULL,
  tanggal_efektif DATE NOT NULL,  -- tanggal SK Revisi POK
  usulan_id UUID REFERENCES usulan_revisi(id),
  snapshot_data JSONB NOT NULL,  -- full pagu state at this date
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### State Machine

```
draft  →  direkomendasi  →  diteruskan  →  ditetapkan  →  berlaku_efektif
   ↓             ↓               ↓             ↓
ditolak       ditolak         ditolak       ditolak
```

Transitions:
- `draft → direkomendasi`: Sie Renbang submit + validasi C1-C10 pass
- `direkomendasi → diteruskan`: Karumkit approve
- `diteruskan → ditetapkan`: Palembang upload SK + tanggal_penetapan
- `ditetapkan → berlaku_efektif`: auto pada tanggal_berlaku_efektif (snapshot_pok created)

### Hard Deadline Tahunan (per §6 vKoreksi)

| Tanggal | Jenis Block |
|---|---|
| 31 Okt | Hard block usulan revisi DJA |
| 30 Nov | Hard block usulan revisi Kanwil DJPb |
| 26 Des | Hard block pemutakhiran POK KPA |
| 31 Des | Hard block revisi pagu minus belanja pegawai |

Soft warning H-7 sebelum deadline.

### UI

1. **New tab "1.5 Riwayat Revisi"** di `App.tsx` — list semua usulan_revisi dengan status timeline.
2. **Submit flow** dari `PaguAnggaran.tsx`: "Usulan Revisi POK" button → modal create new `usulan_revisi` → save draft → state machine progression UI.
3. **Snapshot viewer** — klik snapshot date untuk lihat POK efektif at that time.

### Acceptance Criteria

- [ ] State machine transitions enforce rules (no skipping states)
- [ ] Audit trail lengkap viewable per usulan
- [ ] Snapshot data immutable (no edit after created)
- [ ] Hard deadline warnings active

---

## Tier 6 — Future (Far)

- Sistem jendela revisi pagu (admin Palembang activation per §4.3, §8.1 vKoreksi)
- Multi-role permission (Sie Renbang, Karumkit, Admin Palembang, KPA Palembang) — butuh auth system
- SBM compliance check (C10) — butuh import SBM master data
- Auto-detect "Revisi POK ↔ Revisi DIPA Hal III" via RPD impact (§5 vKoreksi)
- Integrasi metadata SAKTI (optional, butuh API access)

---

## Eksekusi Plan Fresh Session

**Suggested order:**
1. Clone repo + verify Tier 1+2 sudah di main (commit hash di SSOT-REFACTOR-LOG)
2. Wajib baca: `docs/REVISI-POK-PAGU-vKoreksi.md` (full 614 baris)
3. Konfirmasi scope Tier 3 ke dr Ferry sebelum mulai (per "konfirmasi dulu" pattern)
4. Create `feature/tier-3-metadata-schema` branch
5. Schema migration → recommendation engine → UI integration → test
6. Squash merge → main
7. Repeat untuk Tier 4 + Tier 5

**Tools yang relevan:**
- Supabase MCP untuk DB migration
- Vite build untuk verify
- TS compiler untuk type check (filter pre-existing errors)

**Hal yang HARUS dipertahankan:**
- Sprint A-D Item #2 achievements (jangan di-revert)
- Konteks 1-9 Angga (lihat SSOT log Section 0.2)
- Workflow KPA Palembang correction dari Tier 2
- Data policy: no auto-modify

---

*Last updated: 11 Mei 2026 setelah Tier 1+2 closed.*
