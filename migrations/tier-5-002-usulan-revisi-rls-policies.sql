-- ============================================================================
-- SIKESUMA Tier 5 Phase 1.5 — RLS Policies (R5a single-user proxy V1)
-- ============================================================================
-- File         : migrations/tier-5-002-usulan-revisi-rls-policies.sql
-- Tier/Phase   : Tier 5a — Phase 1.5 (Owner-approved per R5a)
-- Reference    : docs/TIER-5-DESIGN.md §2.1 R5a (single-user proxy)
-- Decision     : V1 permissive anon — mirror existing envelope JSONB tables
--                (pagu_sections, bills) yang sudah anon-writable.
--                V2 (R5b) will tighten ke role-based access (Sie Renbang,
--                Karumkit, KPA) saat Supabase auth integrated.
-- Idempotent   : Yes (DROP POLICY IF EXISTS + CREATE POLICY pattern).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on all three tables
--    Defensive default — explicit policy required for access.
--    V1 policies below grant permissive access matching existing pattern.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE usulan_revisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE usulan_revisi_perubahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_pok ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. usulan_revisi — V1 permissive for anon (R5a single-user proxy)
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usulan_revisi anon select V1" ON usulan_revisi;
CREATE POLICY "usulan_revisi anon select V1"
  ON usulan_revisi
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "usulan_revisi anon insert V1" ON usulan_revisi;
CREATE POLICY "usulan_revisi anon insert V1"
  ON usulan_revisi
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "usulan_revisi anon update V1" ON usulan_revisi;
CREATE POLICY "usulan_revisi anon update V1"
  ON usulan_revisi
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "usulan_revisi anon delete V1" ON usulan_revisi;
CREATE POLICY "usulan_revisi anon delete V1"
  ON usulan_revisi
  FOR DELETE
  TO anon
  USING (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. usulan_revisi_perubahan — V1 permissive for anon
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usulan_revisi_perubahan anon select V1" ON usulan_revisi_perubahan;
CREATE POLICY "usulan_revisi_perubahan anon select V1"
  ON usulan_revisi_perubahan
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "usulan_revisi_perubahan anon insert V1" ON usulan_revisi_perubahan;
CREATE POLICY "usulan_revisi_perubahan anon insert V1"
  ON usulan_revisi_perubahan
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "usulan_revisi_perubahan anon update V1" ON usulan_revisi_perubahan;
CREATE POLICY "usulan_revisi_perubahan anon update V1"
  ON usulan_revisi_perubahan
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "usulan_revisi_perubahan anon delete V1" ON usulan_revisi_perubahan;
CREATE POLICY "usulan_revisi_perubahan anon delete V1"
  ON usulan_revisi_perubahan
  FOR DELETE
  TO anon
  USING (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. snapshot_pok — INSERT + SELECT only (R7c immutability — no UPDATE/DELETE)
--    Note: even though policies block UPDATE/DELETE, the DB trigger in 003
--    is the authoritative immutability enforcement. Defense in depth.
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "snapshot_pok anon select V1" ON snapshot_pok;
CREATE POLICY "snapshot_pok anon select V1"
  ON snapshot_pok
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "snapshot_pok anon insert V1" ON snapshot_pok;
CREATE POLICY "snapshot_pok anon insert V1"
  ON snapshot_pok
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No UPDATE policy — snapshot is immutable per R7c
-- No DELETE policy — snapshot retention; only DROP TABLE via rollback removes

-- ───────────────────────────────────────────────────────────────────────────
-- End of 002 — RLS enabled + permissive V1 policies.
--   Verify via:  SELECT schemaname, tablename, policyname, cmd
--                FROM pg_policies
--                WHERE tablename IN ('usulan_revisi','usulan_revisi_perubahan','snapshot_pok')
--                ORDER BY tablename, cmd;
--   Expect: 4 policies for usulan_revisi + 4 for perubahan + 2 for snapshot_pok = 10 rows.
-- ───────────────────────────────────────────────────────────────────────────
