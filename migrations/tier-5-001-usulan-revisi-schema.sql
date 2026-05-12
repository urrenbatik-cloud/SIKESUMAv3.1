-- ============================================================================
-- SIKESUMA Tier 5 Phase 1.5 — Schema DDL (R1c hybrid)
-- ============================================================================
-- File         : migrations/tier-5-001-usulan-revisi-schema.sql
-- Tier/Phase   : Tier 5a — Phase 1.5 (DDL prep, Owner-approved per R1c + R2b)
-- Reference    : docs/TIER-5-DESIGN.md §3 (Schema Detail)
-- Decisions    : R1c hybrid (status + tahun_anggaran + jenis columned, rest JSONB)
--                R2b full snapshot per tanggal_efektif
--                R7c snapshot immutability (trigger in 003)
-- Idempotent   : Yes (IF NOT EXISTS guards). Safe to re-run.
-- Rollback     : migrations/tier-5-004-rollback.sql
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Table: usulan_revisi
--    Per pengajuan revisi POK record (state machine driver)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usulan_revisi (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Columned (R1c hybrid — frequent query targets, indexed)
  status VARCHAR(30) NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'direkomendasi',
      'diteruskan',
      'ditetapkan',
      'berlaku_efektif',
      'ditolak'
    )),
  tahun_anggaran INT NOT NULL,
  jenis VARCHAR(20) NOT NULL
    CHECK (jenis IN ('revisi_pok', 'pagu_berubah')),

  -- JSONB flexible (R1c hybrid — rare query, schema flexibility)
  --   shape: UsulanRevisiData (see types/usulanRevisi.ts to be created Phase 2)
  --   includes: no_sk, dates, actors, justifikasi, lhr_apip, validation_attempts[],
  --             manual_override_log[], template_sk_metadata (Tier 5+6 overlap β)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Standard audit columns (envelope JSONB convention — consistent with AP-8)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query paths (per design §3.1)
CREATE INDEX IF NOT EXISTS idx_usulan_revisi_status_tahun
  ON usulan_revisi (status, tahun_anggaran);

CREATE INDEX IF NOT EXISTS idx_usulan_revisi_tahun_jenis
  ON usulan_revisi (tahun_anggaran, jenis);

CREATE INDEX IF NOT EXISTS idx_usulan_revisi_created
  ON usulan_revisi (created_at DESC);

COMMENT ON TABLE usulan_revisi IS
  'SIKESUMA Tier 5 — per pengajuan revisi POK record + state machine driver. '
  'Schema: R1c hybrid (status+tahun_anggaran+jenis columned, rest JSONB).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Table: usulan_revisi_perubahan
--    Per-row diff tracking (apa yang berubah di usulan ini)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usulan_revisi_perubahan (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key — cascade delete when parent usulan deleted
  usulan_id UUID NOT NULL
    REFERENCES usulan_revisi(id) ON DELETE CASCADE,

  -- Columned (frequent join target)
  --   References pagu_row.data.id (envelope JSONB pattern — not a real FK)
  pagu_row_id UUID NOT NULL,

  -- JSONB flexible
  --   shape: UsulanRevisiPerubahanData (see types/usulanRevisi.ts)
  --   includes: kode, description, nilai_semula, nilai_revisi, alasan, section_id
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usulan_revisi_perubahan_usulan
  ON usulan_revisi_perubahan (usulan_id);

CREATE INDEX IF NOT EXISTS idx_usulan_revisi_perubahan_pagu_row
  ON usulan_revisi_perubahan (pagu_row_id);

COMMENT ON TABLE usulan_revisi_perubahan IS
  'SIKESUMA Tier 5 — per-row diff tracking dalam satu usulan_revisi. '
  'Pagu_row_id references pagu_row.data.id (JSONB envelope, app-layer integrity).';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Table: snapshot_pok
--    Full POK state per tanggal_efektif (R2b full snapshot, R7c immutable)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS snapshot_pok (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Columned (R2b — time-travel query target)
  tahun_anggaran INT NOT NULL,
  tanggal_efektif DATE NOT NULL,

  -- Source reference — which usulan generated this snapshot
  usulan_id UUID NOT NULL
    REFERENCES usulan_revisi(id),

  -- JSONB full POK snapshot (R2b — entire pagu_sections state)
  --   shape: SnapshotPokData (see types/usulanRevisi.ts)
  --   includes: pagu_sections[], total_pagu, total_realisasi, generated_from_usulan_id
  snapshot_data JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshot_pok_tahun_tanggal
  ON snapshot_pok (tahun_anggaran, tanggal_efektif DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_pok_usulan
  ON snapshot_pok (usulan_id);

COMMENT ON TABLE snapshot_pok IS
  'SIKESUMA Tier 5 — full POK snapshot per tanggal_efektif (R2b). '
  'IMMUTABLE: trigger in 003 prevents UPDATE. App-layer also no UPDATE endpoint (R7c defense in depth).';

-- ───────────────────────────────────────────────────────────────────────────
-- End of 001 — Tables + indexes created.
--   Verify via:  SELECT table_name FROM information_schema.tables
--                WHERE table_schema = 'public'
--                  AND table_name IN
--                      ('usulan_revisi', 'usulan_revisi_perubahan', 'snapshot_pok');
--   Expect: 3 rows.
-- ───────────────────────────────────────────────────────────────────────────
