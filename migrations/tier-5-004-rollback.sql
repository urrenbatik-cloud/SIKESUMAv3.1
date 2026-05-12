-- ============================================================================
-- SIKESUMA Tier 5 Phase 1.5 — Emergency Rollback
-- ============================================================================
-- File         : migrations/tier-5-004-rollback.sql
-- Tier/Phase   : Tier 5a — Phase 1.5 (emergency only)
-- Reference    : docs/TIER-5-DESIGN.md §7.1 (rollback procedure)
-- Purpose      : Reverse 001 + 002 + 003 if Tier 5 schema needs to be undone.
--                Used in case of: (a) breaking schema bug discovered post-DDL,
--                (b) Owner direction change forcing schema redesign,
--                (c) clean re-deploy needed.
-- IMPACT       : 🚨 DESTRUCTIVE — drops all Tier 5 data including snapshots.
--                Per OWNER-POLICY: DDL destructive ops require explicit
--                Owner instruction. DO NOT run unless explicit "ya, rollback".
-- Idempotent   : Yes (IF EXISTS guards). Safe even if partial state.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Drop trigger first (depends on table)
-- ───────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS snapshot_pok_immutable ON snapshot_pok;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Drop function (depends on trigger removal)
-- ───────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS snapshot_pok_prevent_update();

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Drop policies (must drop before disabling RLS or dropping tables)
-- ───────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "usulan_revisi anon select V1" ON usulan_revisi;
DROP POLICY IF EXISTS "usulan_revisi anon insert V1" ON usulan_revisi;
DROP POLICY IF EXISTS "usulan_revisi anon update V1" ON usulan_revisi;
DROP POLICY IF EXISTS "usulan_revisi anon delete V1" ON usulan_revisi;

DROP POLICY IF EXISTS "usulan_revisi_perubahan anon select V1" ON usulan_revisi_perubahan;
DROP POLICY IF EXISTS "usulan_revisi_perubahan anon insert V1" ON usulan_revisi_perubahan;
DROP POLICY IF EXISTS "usulan_revisi_perubahan anon update V1" ON usulan_revisi_perubahan;
DROP POLICY IF EXISTS "usulan_revisi_perubahan anon delete V1" ON usulan_revisi_perubahan;

DROP POLICY IF EXISTS "snapshot_pok anon select V1" ON snapshot_pok;
DROP POLICY IF EXISTS "snapshot_pok anon insert V1" ON snapshot_pok;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Drop tables (CASCADE removes FK refs + indexes automatically)
--    Order: snapshot_pok first (references usulan_revisi),
--           then usulan_revisi_perubahan (references usulan_revisi),
--           then usulan_revisi (no inbound FK).
-- ───────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS snapshot_pok CASCADE;
DROP TABLE IF EXISTS usulan_revisi_perubahan CASCADE;
DROP TABLE IF EXISTS usulan_revisi CASCADE;

-- ───────────────────────────────────────────────────────────────────────────
-- End of 004 — Rollback complete.
--   Verify all Tier 5 tables removed:
--     SELECT table_name FROM information_schema.tables
--     WHERE table_schema = 'public'
--       AND table_name IN ('usulan_revisi','usulan_revisi_perubahan','snapshot_pok');
--   Expect: 0 rows.
-- ───────────────────────────────────────────────────────────────────────────
