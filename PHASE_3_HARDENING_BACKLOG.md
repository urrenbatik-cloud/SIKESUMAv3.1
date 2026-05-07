# Phase 3 Hardening Backlog — SIKESUMA v3.1

**Created:** 7 Mei 2026 (Sequence 4 F3.5)
**Predecessor:** Step 2 v2 complete (Phase 2 backbone production-ready)
**Successor:** Phase 3 implementation session (when prioritized by stakeholders)

---

## Overview

Setelah Step 2 v2 complete, aplikasi production-ready untuk soft-launch operational use, tapi belum hardened untuk full enterprise deployment di RS TNI AD. Phase 3 = security + audit + scale concerns.

**Scope keseluruhan:** ~15-20 jam aktual implementation + 5-8 jam testing + verifikasi.

**Priority order (rekomendasi):** P3.1 → P3.2 → P3.3 (parallel boleh setelah P3.1 done) → P3.4-P3.6 (deferable per stakeholder needs).

---

## P3.1 — RLS Tighten ke Role-Based Authenticated

**Priority:** **HIGH** — current PERMISSIVE ALL = anyone with anon key bisa CRUD semua data
**Effort:** 3-5 jam
**Risk:** Medium (perlu backward-compatible migration)

### Decisions Needed

1. **User role hierarchy** — sesuai struktur Sie Renbang:
   - **Admin** — full access semua tabel + Storage
   - **Sie Renbang** — RKKS module (pagu, RPD, RAB) + master data (doctors, employees) + targets
   - **Verifikator** — Klaim BPJS verifikasi + jasa_verification_files upload + read pagu
   - **Bendaharawan** — Bills + payment status + pagu read-only
2. **Auth mechanism** — Supabase Auth (email/password) atau custom JWT?
3. **Login UI** — currently belum ada, perlu add login form + auth state di App.tsx

### Implementation Steps

1. **DROP** semua "Enable all access for all users" PERMISSIVE policies
2. **CREATE** role-based policies per tabel:
   - `pagu_sections` — admin/renbang full, others read-only
   - `bills` — admin/bendaharawan full, others read-only
   - `patient_claims` — admin/verifikator full, others read-only
   - dst.
3. **Migrate user accounts** — populate auth.users dengan staff data
4. **App.tsx changes** — add auth context, login flow, conditional rendering per role
5. **Test matrix** — login as each role × test CRUD per tabel

### Open Questions

- Single sign-on dengan AD account TNI? Atau Supabase managed auth?
- Password reset flow — email-based atau admin manual?
- Multi-RS scenario — per-tenant data isolation di multi-RS template (Step 4)?

---

## P3.2 — Storage Bucket Private + Signed URL

**Priority:** **HIGH** — public URL jasa-verification accessible by anyone with link
**Effort:** 2-3 jam
**Risk:** Low (incremental change)

### Decisions Needed

1. **Signed URL expiry** — 1 hour, 24 hours, atau session-based?
2. **Auth for signed URL** — generate per-request based on user role?
3. **Caching strategy** — local IndexedDB blob cache untuk avoid re-download?

### Implementation Steps

1. Run migration:
   ```sql
   UPDATE storage.buckets SET public = false WHERE id = 'jasa-verification';
   ```
2. Drop public policies, replace dengan authenticated policies
3. ServiceBillRecap.tsx changes:
   - Replace `getPublicUrl()` dengan `createSignedUrl(path, expirySeconds)`
   - Add token refresh logic kalau URL expired
4. Test cross-user access (Verifikator's URL tidak accessible by Bendaharawan tanpa proper RLS)

### Storage Cleanup Side-Effect

Saat Storage migrate ke private, existing public URLs di `jasa_verification_files.data` rows jadi invalid. Perlu:
- Migration script untuk re-generate signed URLs
- Atau lazy regeneration (App.tsx detect expired URL → regenerate on view)

---

## P3.3 — Audit Log Table Rebuild

**Priority:** **MEDIUM-HIGH** — required for compliance + debugging trail
**Effort:** 3-4 jam
**Risk:** Low (additive)

### Context

Grup B `audit_log` table di-drop di Sequence 1 (3,180 rows) — old schema. Phase 3 = rebuild fresh dengan modern schema.

### Decisions Needed

1. **Triggered events** — INSERT/UPDATE/DELETE pada semua 9 transactional tables?
2. **Sensitive data redaction** — log NIK/NPWP atau redact?
3. **Retention period** — 6 bulan, 1 tahun, indefinite?
4. **Storage strategy** — DB table atau write-only S3-compatible storage?

### Schema Proposal

```sql
CREATE TABLE audit_log (
  id text PRIMARY KEY,                  -- 'audit-{timestamp}-{uuid}'
  data jsonb NOT NULL,                  -- { table, action, before, after, user_id, role, ip }
  created_at timestamptz DEFAULT now()
);

CREATE INDEX audit_log_table_idx ON audit_log ((data->>'table'));
CREATE INDEX audit_log_user_idx ON audit_log ((data->>'user_id'));
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
```

### Implementation Steps

1. CREATE TABLE `audit_log` (envelope JSONB pattern konsisten)
2. CREATE TRIGGERS pada 9 transactional tables:
   - `BEFORE INSERT/UPDATE/DELETE → audit_log_trigger()`
   - Function captures user_id (auth.uid()), role, before/after row
3. App.tsx — optional UI "Activity Log" untuk Admin role
4. Test trigger fires correctly + redaction works

### Special Case

File upload events ke Storage juga perlu logged (per roadmap §F2.2 NEW v2 — defer to Step 4 dulu, but bisa masuk Phase 3 kalau ready).

---

## P3.4 — PII Encryption At Rest

**Priority:** **MEDIUM** — depend pada compliance requirement Pusrenkes/TNI AD
**Effort:** 2-3 jam
**Risk:** Medium (key management complexity)

### Fields untuk Encrypt

- `employees.data.nik` — NIK pegawai
- `employees.data.npwp` — NPWP
- `employees.data.noRekening` — No rekening bank
- `doctors.data.nik` — NIK dokter
- `doctors.data.npwp` — NPWP dokter
- `bills.data.npwp` — NPWP rekanan
- `bills.data.noRekening` — No rekening rekanan

### Approach Options

**(a) Supabase Vault** — built-in encryption (preferred, but Pro tier feature)
**(b) Application-layer encryption** — encrypt di App.tsx sebelum sync, decrypt setelah load (works on Free tier, but key management responsibility)
**(c) Defer** — Pusrenkes/TNI AD belum require encryption, skip until mandated

### Decision Drivers

- Free tier vs Pro tier upgrade decision
- Compliance requirements explicit
- Performance impact (encryption/decryption overhead)

---

## P3.5 — Backup Strategy

**Priority:** **MEDIUM** — currently relying on Supabase managed backups
**Effort:** 1-2 jam (planning + setup)
**Risk:** Low

### Current State

- Free tier: tidak ada point-in-time recovery
- Manual backup via JSONB inline ke `system_settings` (used in Sequence 1)

### Phase 3 Plan

1. **Pro tier upgrade** — sekitar $25/month, unlocks:
   - Daily automated backups (7-day retention)
   - Point-in-time recovery (24-hour granularity)
   - 8 GB database (vs 500 MB Free tier)
   - 100 GB Storage (vs 1 GB Free tier)
2. **Backup verification protocol** — monthly restore test ke staging environment
3. **Disaster recovery runbook** — dokumentasi step-by-step kalau perlu restore

### Trigger untuk Upgrade

- DB approaching 500 MB (currently <50 MB, ample headroom)
- Storage approaching 1 GB (10 MB × 100 files = 1 GB)
- Compliance audit findings demand point-in-time recovery
- Production incident requiring data recovery

---

## P3.6 — Monitoring + Alerting

**Priority:** **LOW-MEDIUM** — nice-to-have, not blocking
**Effort:** 2-3 jam
**Risk:** Low (observability only)

### Metrics to Track

1. **Storage quota** — bucket size approaching 1 GB Free tier limit
2. **Sync failure rate** — alert kalau >5% syncs gagal dalam 24 jam
3. **Auth failure rate** — alert kalau >10 failed logins per hour (potential brute force)
4. **DB row count growth** — alert kalau pagu_sections, bills, patient_claims grow unexpectedly
5. **Slow queries** — alert kalau query >2 detik

### Implementation Approach

- Supabase Studio dashboard untuk basic monitoring (built-in, no setup)
- Webhook integration ke Slack/Telegram untuk Sie Renbang alerts
- Custom usage logging via `system_settings.usage_log` (atau separate table)

---

## P3 Decision Matrix Summary

| Priority | Item | Free Tier OK? | Effort | Blocking for Soft-Launch? |
|---|---|---|---|---|
| HIGH | P3.1 RLS role-based | ✅ Yes | 3-5 jam | **Yes** kalau multi-user di production |
| HIGH | P3.2 Storage private + signed URL | ✅ Yes | 2-3 jam | Low (data tidak super sensitive yet) |
| MED-HIGH | P3.3 Audit log rebuild | ✅ Yes | 3-4 jam | **Yes** kalau ada compliance audit |
| MED | P3.4 PII encryption | ⚠️ Pro tier preferred | 2-3 jam | No (depend on compliance) |
| MED | P3.5 Backup strategy | ⚠️ Pro tier needed | 1-2 jam | No (acceptable risk for soft-launch) |
| LOW-MED | P3.6 Monitoring | ✅ Yes | 2-3 jam | No (nice-to-have) |

**Total Phase 3: ~15-20 jam aktual + 5-8 jam testing.**

---

## Anchor Prompt untuk Phase 3 Implementation Session

> Sesi ini adalah Phase 3 hardening untuk SIKESUMA. Step 2 v2 selesai — aplikasi production-grade tapi RLS masih PERMISSIVE ALL + Storage bucket public.
>
> Goal: prioritize HIGH items dulu (P3.1 RLS role-based, P3.2 Storage private). MED items per stakeholder priority.
>
> Inputs wajib: PHASE_3_HARDENING_BACKLOG.md (file ini), SIKESUMA-AUDIT-HANDOVER-v1_4.md, App.tsx current, 4 component files current.
>
> Pre-flight kickoff: tanya stakeholder — (1) user role hierarchy, (2) Supabase Auth atau custom JWT, (3) Storage signed URL expiry, (4) compliance requirements untuk encryption + audit log.
>
> Pattern: outline-first, diagnostic-first SQL, atomic transaction, smoke test setiap milestone, file versioning preserve.

---

## Closing Notes

Phase 3 = optional hardening for Phase 2 backbone. Step 2 v2 is **functionally complete** — aplikasi siap dipakai operational di RS Batin Tikal dengan caveat:
- Single-user assumption OK (semua user pakai same anon key untuk now)
- Backup via Supabase managed (Free tier acceptable risk)
- File storage public (acceptable kalau Sie Renbang OK dengan model)

Phase 3 graduates aplikasi ke "enterprise-grade" untuk multi-RS template scale (Step 4).

---

*End of Phase 3 hardening backlog. Implementation per priority + stakeholder needs.*
