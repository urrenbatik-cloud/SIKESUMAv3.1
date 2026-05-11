# Fixtures untuk Tier 3 — Pagu Metadata Recommender

**Tanggal generate:** 11 Mei 2026
**Sumber data:** Live Supabase `pagu_sections` (PostgREST anon key, read-only)
**Approved by:** Owner dr Ferry (Decision C, 11 Mei 2026)

---

## Tujuan

Fixture ini adalah **snapshot ground truth** untuk validasi `utils/metadataRecommender.ts` (Tier 3 Phase 2). Berisi 38 true leaves dari TA 2025 (per algoritma traversal-based di SSOT §0.7.2) lengkap dengan `expected_recommendation` per row.

Saat recommender diimplementasi, output-nya dibandingkan ke `expected_recommendation` di fixture ini → harus match. Acceptance criteria: **≥80% aggregate HIGH confidence** untuk fields kritikal (kro + ro + komponen + sumber_dana). **Current: 92,1% (35/38 leaves)** ✓ PASS.

## File

| File | Isi | Size |
|---|---|---|
| `pagu-leaves-ta2025.json` | 38 leaves + metadata + expected_recommendation per row | ~50 KB |
| `README.md` | Dokumentasi ini | ~5 KB |

## Struktur JSON Fixture

```jsonc
{
  "$schema": "tier-3-fixture-v1",
  "generated_at": "2026-05-11T...",
  "generator_version": "1.0.0",
  "source": {
    "type": "supabase-live",
    "url": "https://qjijsftbytozcoyrtric.supabase.co",
    "method": "PostgREST anon-key, read-only"
  },
  "context": {
    "ta": 2025,
    "satker": "685784 Kesdam II/Sriwijaya",
    "sub_komponen": "F (Rumkit Tk.IV Batin Tikal Pangkal Pinang)"
  },
  "mapping_rules_source": "RKKS 2025 §12.2 + corrected Decision B (11 Mei 2026)",
  "leaf_detection_algorithm": "Traversal-based per SSOT §0.7.2",
  "total_leaves": 38,
  "confidence_summary": { /* aggregate stats */ },
  "leaves": [
    {
      "section_id": "pagu-2025-bekkes",
      "row_id": "row-...",
      "kode": "521811.05",
      "kode_bas": "521811",
      "description": "Obat & BMHP YANMASUM (REKANAN)",
      "level": 1,
      "is_standalone_leaf_l0": false,
      "volume": 1,
      "satuan": "TAHUN",
      "hargaSatuanAwal": 72995000,
      "hargaSatuanRevisi": 72995000,
      "effective_awal": 72995000,
      "effective_revisi": 72995000,
      "sumberDana": "PNBP",
      "expected_recommendation": {
        "kro":          { "code": "EBA", "name": "...", "confidence": "high" },
        "kegiatan":     { "code": "6507", "name": "...", "confidence": "high" },
        "ro":           { "code": "962", "confidence": "high" },
        "komponen":     { "code": "3", "name": "...", "confidence": "high" },
        "sumber_dana":  { "kode": "PNBP", "confidence": "high" },
        "volume_ro":    { "value": null, "confidence": "low" },
        "satuan_ro":    { "value": null, "confidence": "low" }
      }
    },
    /* ... 37 more leaves ... */
  ]
}
```

## Mapping Rules Applied (Per RKKS 2025 §12.2 + Decision B Corrected)

| kode_bas family | KRO | RO | Komponen | Confidence Notes |
|---|---|---|---|---|
| `521xxx`, `522112`, `522113`, `524111` | EBA | 962 | 3 | All HIGH — deterministic per §12.2 |
| `523111` (Pemeliharaan Gedung) | CCB | 4 | 3 | All HIGH — §12.2 explicit |
| `523122` (BMP) | CCB | — | 3 | KRO MEDIUM (by analogy pemeliharaan); RO LOW; Komp HIGH (prefix 523) |
| `532111.*.A` (Alsintor) | CAB | 5 | 52 | All HIGH (per §12.2 + Konteks 4 Angga) |
| `532111.*.B` (Alkes) | CAB | 1 | 52 | All HIGH (per §12.2 + Konteks 4 Angga) |
| `532111.C` (Alsatri standalone) | CAB | — | 52 | KRO MEDIUM (Alsatri belum di §12.2, rencana TA 2026); RO LOW; Komp HIGH |
| `536111` (Modal Lainnya — XDR) | CAB | — | 52 | KRO MEDIUM (by analogy 53xxxx); RO LOW; Komp HIGH (prefix-based) |

**Sumber dana inference:**
- `description` contains `BPJS` atau `YANMASUM` → `PNBP` HIGH
- `sumberDana` field `PNBP` → `PNBP` HIGH
- `sumberDana` field `RM` → `RM` HIGH
- Lainnya → LOW

**volume_ro / satuan_ro:** LOW default untuk semua row — butuh DIPA Petikan data eksternal (manual fill by Sie Renbang).

## Confidence Distribution (Snapshot 11 Mei 2026)

```
Field           High  Medium   Low   %High
─────────────────────────────────────────
kro              35       3     0    92.1%
kegiatan         38       0     0   100.0%
ro               35       0     3    92.1%
komponen         38       0     0   100.0%
sumber_dana      38       0     0   100.0%

Aggregate HIGH (all of kro+ro+komponen+sumber_dana = high):
  35/38 = 92.1%   ✓ PASS (threshold ≥80% per Decision C)
```

**3 leaves yang TIDAK ALL-HIGH (perlu Angga review):**
- `523122` BELANJA BMP (KRO=CCB medium by analogy, RO=null low)
- `532111.C` ALSATRI (KRO=CAB medium karena Alsatri belum di §12.2, RO=null low)
- `536111` BELAJA APLIKASI XDR (KRO=CAB medium by analogy 53xxxx, RO=null low)

Ini adalah 3 row yang nanti **harus manual review oleh Angga** via UI "Edit Manual" button (Phase 3 UI integration). Recommendation engine akan tampilkan badge AMBER untuk row-row ini.

## Regenerasi Fixture

Jika data Supabase berubah (mis. data TA 2026 masuk, atau Angga modifikasi row TA 2025), fixture perlu di-regenerasi:

### Prerequisites
- Python 3.x (built-in stdlib cukup, no external deps)
- Network access ke `https://qjijsftbytozcoyrtric.supabase.co`
- Anon key (lihat owner's session credential file)

### Steps

```bash
# 1. Setup script (atau pakai existing dari ai-session)
python3 - << 'PY'
# Copy paste isi generator script dari commit history feature/tier-3-metadata-schema
# Atau request fresh dari AI session
PY

# 2. Run
python3 generate_fixture.py

# 3. Output di utils/fixtures/pagu-leaves-ta2025.json + console stats
```

**Catatan:** Saat regenerate, jika `expected_recommendation` per row berubah karena mapping rule update (mis. Alsatri masuk §12.2 di RKKS 2026), update mapping rules di script terlebih dahulu. Fixture adalah snapshot ground truth — jangan edit JSON langsung, edit logic generator.

## Lifecycle Fixture

| Event | Action |
|---|---|
| Phase 2 Recommender implementation | Compare `recommender(leaf)` output ke `leaf.expected_recommendation` per row |
| Phase 3 UI integration | Sample data untuk UI demo (38 leaves untuk badge visualization) |
| Tier 4 Validation engine | Cross-check constraint violation detection menggunakan known-state data |
| TA 2026 data masuk | Regenerate fixture → snapshot baru |
| Master domain update (mis. RKKS 2026) | Update mapping rules → regenerate fixture |

## Reference

- **Mapping rules source:** `docs/REVISI-POK-PAGU-vKoreksi.md §12.2` (RKKS 2025 inventory)
- **Konteks Angga:** Konteks 4 (.A/.B/.C subkode untuk 532111), lihat `SSOT-REFACTOR-LOG.md §0.2`
- **Leaf detection:** `SSOT-REFACTOR-LOG.md §0.7.2` (traversal-based, NOT level>0)
- **Anti-pattern catalogue:** `SSOT-REFACTOR-LOG.md §0.7.5` (AP-1 wajib dihindari)
- **Tier 3 blueprint:** `docs/TIER-3-PLUS-PLAN.md`

---

*Generated as part of Tier 3 Phase 2a (test fixture-first approach, per Decision C Owner-approved 11 Mei 2026).*
