/**
 * Migration B.5 — Rename JSONB key linkedSectionId → linkedPaguSectionId di rpds
 *
 * Tanggal: 10 Mei 2026
 * Status:  ✅ Dieksekusi successfully (9/9 rpds rows renamed)
 *
 * Tujuan: Untuk konsistensi naming dengan RABCategory.linkedPaguSectionId,
 * rename JSONB key di rpds.data dari `linkedSectionId` ke `linkedPaguSectionId`.
 *
 * Loader (App.tsx line 322) tetap accept old key sebagai fallback agar aman
 * jika ada rows lama yang belum di-migrate. Migration ini sekedar membersihkan
 * data agar JSONB hanya pakai key baru.
 *
 * Idempotent: aman dijalankan berkali-kali — yang sudah punya key baru di-skip.
 */

import { supabase } from '../supabase';

export async function renameLinkedSectionIdKey(): Promise<{ updated: number; skipped: number }> {
  const { data, error } = await supabase.from('rpds').select('*');
  if (error) throw error;
  if (!data) return { updated: 0, skipped: 0 };

  let updated = 0;
  let skipped = 0;

  for (const row of data) {
    const body = (row.data || {}) as Record<string, any>;
    if ('linkedPaguSectionId' in body) {
      skipped++; // already migrated
      continue;
    }
    if (!('linkedSectionId' in body)) {
      console.warn(`Skip ${row.id}: neither key present`);
      skipped++;
      continue;
    }
    const newBody: Record<string, any> = { ...body, linkedPaguSectionId: body.linkedSectionId };
    delete newBody.linkedSectionId;

    const { error: updErr } = await supabase
      .from('rpds')
      .update({ data: newBody })
      .eq('id', row.id);
    if (updErr) {
      console.error(`Failed to update ${row.id}:`, updErr);
      skipped++;
    } else {
      console.log(`✅ ${row.id}: linkedSectionId → linkedPaguSectionId`);
      updated++;
    }
  }

  return { updated, skipped };
}
