-- ============================================================================
-- SIKESUMA Tier 5 Phase 1.5 — Snapshot POK Immutability Trigger (R7c)
-- ============================================================================
-- File         : migrations/tier-5-003-snapshot-pok-immutability.sql
-- Tier/Phase   : Tier 5a — Phase 1.5 (Owner-approved per R7c)
-- Reference    : docs/TIER-5-DESIGN.md §3.3 + §2 R7c
-- Decision     : R7c — Snapshot immutability via DB trigger + app no-UPDATE
--                endpoint. Defense in depth. DB trigger = authoritative,
--                app layer = secondary guard.
-- Idempotent   : Yes (CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Trigger function — reject UPDATE attempts
--    PLPGSQL function raises exception when any UPDATE on snapshot_pok runs.
--    Includes row id in error message for traceability.
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION snapshot_pok_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'snapshot_pok records are immutable per Tier 5 R7c — cannot UPDATE row id=%',
    OLD.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION snapshot_pok_prevent_update IS
  'SIKESUMA Tier 5 R7c — rejects UPDATE on snapshot_pok rows. '
  'Snapshots are point-in-time POK state; modification would corrupt audit trail.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Trigger — wire function to BEFORE UPDATE on snapshot_pok
-- ───────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS snapshot_pok_immutable ON snapshot_pok;

CREATE TRIGGER snapshot_pok_immutable
  BEFORE UPDATE ON snapshot_pok
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_pok_prevent_update();

COMMENT ON TRIGGER snapshot_pok_immutable ON snapshot_pok IS
  'SIKESUMA Tier 5 R7c — fires before any UPDATE on snapshot_pok. '
  'Combined with app-layer no-UPDATE endpoint (services/usulanRevisiService.ts) '
  'gives defense in depth against accidental snapshot mutation.';

-- ───────────────────────────────────────────────────────────────────────────
-- End of 003 — Immutability trigger active.
--   Verify trigger exists:
--     SELECT trigger_name, event_manipulation, action_timing
--     FROM information_schema.triggers
--     WHERE event_object_table = 'snapshot_pok';
--   Expect: 1 row: snapshot_pok_immutable | UPDATE | BEFORE
--
--   Smoke test (negative — should fail with our exception):
--     -- After 001+002+003 + an INSERT, try:
--     -- UPDATE snapshot_pok SET tahun_anggaran = 9999 WHERE id = '<some-uuid>';
--     -- Expected: ERROR: snapshot_pok records are immutable per Tier 5 R7c ...
-- ───────────────────────────────────────────────────────────────────────────
