# Tier 3+ Re-Architecture Plan — SIKESUMA TA 2026

**Status:** Pending — execute di fresh session dengan feature branches.
**Date:** 11 Mei 2026 (updated dengan vKoreksi v3)
**Authoritative Domain Reference:** [`docs/REVISI-POK-PAGU-vKoreksi.md`](./docs/REVISI-POK-PAGU-vKoreksi.md) — **v3** (1145 baris)
**Pedoman tertinggi:** **Perdirjen Renhan Kemhan No. 7 Tahun 2025** sebagai *lex specialis* dari PMK 62/2023.
**Dependencies:** Tier 1+2 ✅ DONE (master doc v3 integrated, LaporanRevisi.tsx workflow Kakesdam fixed)

---

## ⭐ Baseline Data dari RKKS 2025 (vKoreksi v3 §12.2)

**Identitas anggaran RS Batin Tikal (sub-komponen F):**
```
Kementerian/Lembaga (BA): 012 (Kementerian Pertahanan)
Unit Organisasi (UO):     22  (TNI Angkatan Darat)
Satker:                   685784 (Kesdam II/Sriwijaya) ← satker pengelola
Sub-Komponen:             F  (Rumkit Tk.IV Batin Tikal Pangkal Pinang)
Alokasi PNBP TA 2025:     Rp 987.995.000 (BPJS ≈ Rp 770 jt + Yanmasum ≈ Rp 218 jt)
```

**Hierarki klasifikasi aktual RKKS 2025:**
```
Program 012.01.AC PROGRAM PROFESIONALISME DAN KESEJAHTERAAN PRAJURIT
└── Kegiatan 6507 Penyelenggaraan Kesehatan Matra Darat
    ├── KRO CAB Sarana Bidang Kesehatan
    │   ├── RO 1 Pengadaan Alat Kesehatan PNBP dan BLU (Komponen 52)
    │   │   └── Sub-Komponen F: Akun 532111 (Belanja Modal Peralatan)
    │   └── RO 5 Pengadaan Alsintor Kesehatan PNBP dan BLU
    ├── KRO CCB OM Sarana Bidang Kesehatan
    │   └── RO 4 Pemeliharaan Gedung dan Bangunan (Komponen 3)
    │       └── Sub-Komponen F: Akun 523111
    └── KRO EBA Layanan Dukungan Manajemen Internal
        └── RO 962 Layanan Umum (Komponen 3) — Rp 857.995.000
            └── Sub-Komponen F: RS Batin Tikal
                ├── 521111 Belanja Keperluan Perkantoran   (Rp 15 jt)
                ├── 521112 Belanja Pengadaan Bahan Makanan (Rp 100 jt)
                ├── 521115 Honor Operasional Satuan Kerja  (Rp 370 jt)
                ├── 521119 Belanja Barang Operasional Lainnya (Rp 15 jt)
                ├── 521811 Belanja Barang Persediaan Konsumsi (Rp 333 jt)
                ├── 522112 Belanja Langganan Telpon         (Rp 10 jt)
                ├── 523122 Beban BMP dan Pelumas Non Pertamina (Rp 5 jt)
                └── 524111 Beban Perjalanan Dinas Biasa     (Rp 10 jt)
```

**Implikasi untuk Tier 3+:**
Data konkret ini menjadi **seed values** untuk recommendation engine. Sie Renbang bisa accept/edit. Schema migration nullable, tapi recommendation tinggi confidence untuk pola yang sudah ada di RKKS 2025.

---

## Konteks untuk Fresh Session

**Timing:** TA 2025 sudah lewat (data historis, Rp 2.7M, jangan di-modify). TA 2026 belum mulai. Window perfect untuk schema re-architecture sebelum data live masuk.

**Data Policy (Konteks 4 dr Ferry):** AI/automation TIDAK auto-modify pagu_row data. Migration data manual oleh Angga (Sie Renbang preference: "learning by doing"). Aplikasi sebagai recommendation engine.

**Branching:**
- Tier 3 → `feature/tier-3-metadata-schema`
- Tier 4 → `feature/tier-4-validation-c1-c10` (depends Tier 3)
- Tier 5 → `feature/tier-5-audit-trail` (depends Tier 4)
- Tier 6 → `feature/tier-6-template-sk-revisi-pok` (depends Tier 5; ⭐ NEW priority dari v3 §13)
- Squash merge ke main setelah tested + Angga/Karumkit approved

**Mandatory reading sebelum start:**
1. `docs/REVISI-POK-PAGU-vKoreksi.md` **v3** (1145 baris) — **wajib pertama**, terutama:
   - Section 3 Revisi POK (Pasal 22 Perdirjen Renhan 7/2025)
   - Section 6 Batas Waktu (Pasal 24)
   - Section 12 Klarifikasi Sie Renbang (6 Q&A Angga)
   - Section 13 Template SK Revisi POK (5 sub-templates)
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

## Tier 4 — Validation Engine C1-C11

### Goal
Pre-flight check sebelum cetak Usulan Revisi POK. Block jika hard violation. Soft warning untuk lainnya. Per Pasal 22 Perdirjen Renhan Kemhan No. 7 Tahun 2025.

### File: `utils/revisiPOKValidator.ts` (BARU)

```typescript
export interface ConstraintViolation {
  constraint: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9' | 'C10' | 'C11';
  pasal: string;  // mis. "Pasal 22 huruf a angka 1 Perdirjen Renhan 7/2025"
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  affectedRows: string[]; // row IDs
}

export function validateRevisiPOK(sections: PaguSection[]): ConstraintViolation[] {
  // C1: Net change = 0 (PMK 62/2023 + Perdirjen Renhan 7/2025 Pasal 22)
  // C2: All rows in same KRO (Pasal 22 huruf a angka 1)
  // C3: All rows in same Kegiatan (Pasal 22 huruf a angka 1)
  // C4: All rows in same Satker (685784 Kesdam II/SWJ — trivial single-satker)
  // C5: Volume RO tidak berubah (Pasal 22 huruf a angka 2)
  // C6: 1 jenis belanja sama (Pasal 22 huruf a angka 2)
  // C7: Sumber dana sama (Pasal 22 huruf a angka 2)
  // C8: 1 komponen sama untuk belanja operasional (FAQ DJA)
  // C9: Tidak boleh pagu minus pasca revisi
  // C10: Patuh SBM (PMK Standar Biaya tahunan)
  // C11: Memperhatikan LHR APIP (Pasal 22 huruf b angka 4) — ⭐ BARU v3
}
```

### Severity Classification

| Constraint | Pasal Reference | Severity Default | Rationale |
|---|---|---|---|
| C1 (net=0) | PMK 62/2023 + Pasal 22 PR7/2025 | ERROR (block) | Hard requirement |
| C2-C4 (KRO/Kegiatan/Satker) | Pasal 22(a)(1) PR7/2025 | ERROR (block) | Hard requirement |
| C5 (volume RO) | Pasal 22(a)(2) PR7/2025 | ERROR (block) | Hard requirement |
| C6 (jenis belanja 2-digit) | Pasal 22(a)(2) PR7/2025 | ERROR (block) | Hard requirement |
| C7 (sumber dana) | Pasal 22(a)(2) PR7/2025 | ERROR (block) | Hard requirement |
| C8 (komponen) | FAQ DJA | WARNING | Hanya untuk belanja operasional |
| C9 (pagu minus) | Prinsip umum APBN | ERROR (block) | |
| C10 (SBM) | PMK Standar Biaya tahunan | INFO (defer) | Butuh SBM master data |
| C11 (LHR APIP) | Pasal 22(b)(4) PR7/2025 | WARNING | ⭐ BARU v3 — butuh interaction LHR submission |

### UI

1. **Pre-flight banner** di top `PaguAnggaran.tsx`: "✓ Pagu valid untuk Revisi POK" atau "⚠ X violation: ..." dengan list.
2. **Disable button "Usulan Revisi POK"** kalau ada ERROR violation. Show tooltip violation summary.
3. **Validation modal** klik banner: full list violations + affected rows dengan link click-to-row + reference Pasal.
4. **C11 LHR APIP**: special UI untuk input LHR reference (nomor LHR, tanggal) — link ke usulan_revisi.

### Acceptance Criteria

- [ ] Validator return all violations untuk current TA 2025 state (baseline test)
- [ ] Banner real-time update saat user edit row
- [ ] Button disabled state dengan tooltip Pasal reference
- [ ] Test case: 1 valid scenario + 6 violation scenarios

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

## Tier 6 — Template SK Revisi POK Implementation (⭐ BARU v3)

### Goal
Generate full set dokumen formal Revisi POK sesuai Template Section 13 vKoreksi v3 — siap submit ke Kakesdam II/Sriwijaya selaku KPA.

### Scope

Per Section 13 vKoreksi v3, ada 5 sub-templates yang harus di-generate:

**13.1 — Surat Usulan Revisi POK** (dari Karumkit ke Kakesdam II/Sriwijaya)
- Kop Kesdam II/Sriwijaya
- Nomor surat: B/.../KESDAM-II-SWJ/RUMKIT-IV-BT/<bulan-tahun>
- Lampiran: matriks semula-menjadi + justifikasi
- Tanda tangan: Karumkit (rekomendasi)

**13.2 — Lampiran Matriks Perubahan (Semula – Menjadi)**
- Table format dengan kolom: Kode Akun | Uraian | Semula | Menjadi | Selisih | Alasan
- Footer: subtotal pengurangan + subtotal penambahan + net change verification

**13.3 — SK Revisi POK** (Ditetapkan oleh Kakesdam II/Sriwijaya selaku KPA)
- Kop Kesdam II/Sriwijaya
- Nomor: Kep/.../<bulan>/<tahun>
- Pertimbangan: a) hasil rekomendasi Karumkit, b) memperhatikan LHR APIP, c) sesuai Pasal 22 Perdirjen Renhan 7/2025
- Dasar Hukum: list 5-7 referensi
- Memutuskan: rincian perubahan pagu per akun
- Tanggal penetapan + tanda tangan Kakesdam

**13.4 — Surat Pernyataan Tanggung Jawab KPA** (Lampiran SK)
- Pernyataan KPA bahwa revisi POK telah memenuhi C1-C11
- Tanda tangan + materai

**13.5 — Template Kop Surat RS Batin Tikal** (PROPOSAL v3)
- Format kop yang diusulkan (per Sie Renbang: belum ada kop standar untuk RS Batin Tikal)
- Logo TNI AD + Kesdam II/Sriwijaya + RS Batin Tikal
- Alamat lengkap Pangkal Pinang

### File: `components/templateSKGenerator.tsx` (BARU di Tier 6)

```typescript
interface TemplateSKProps {
  usulan: UsulanRevisi;  // dari Tier 5 audit trail
  template: '13.1' | '13.2' | '13.3' | '13.4';
  data: {
    karumkit: { name: string; rank: string; nrp: string };
    kakesdam: { name: string; rank: string; nrp: string };
    saksi_apip?: { lhr_no: string; tanggal: string };
    // ...
  };
}
```

Sub-components untuk setiap template, print-ready dengan kop dinamis sesuai jenis dokumen.

### Acceptance Criteria

- [ ] Template 13.1-13.4 generate-able sesuai data real `usulan_revisi` (Tier 5)
- [ ] Print preview match contoh di Section 13 vKoreksi v3
- [ ] Tanggal + nomor SK auto-generated
- [ ] Verification check: data SK match dengan validated revisi POK (C1-C11 pass)
- [ ] Template 13.5 (Kop RS Batin Tikal) optional — pending approval format

### Dependencies

- Tier 3 (metadata KRO/Kegiatan/Komponen untuk pertimbangan SK)
- Tier 4 (validasi C1-C11 pass sebelum bisa generate SK)
- Tier 5 (usulan_revisi entity sebagai data source)

---

## Tier 7 — Future (Far)

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
