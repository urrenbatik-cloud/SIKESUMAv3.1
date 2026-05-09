/**
 * Migration A3 — Backfill `tahun` field di pagu_sections (Sprint A3)
 *
 * Tanggal: 10 Mei 2026
 * Status:  ✅ Dieksekusi successfully (9/9 sections backfilled)
 *
 * Tujuan: Untuk pagu_sections yang sudah ada di Supabase tapi belum punya
 * field `data.tahun`, parse tahun dari ID pattern `pagu-{YYYY}-{slug}` dan
 * backfill ke JSONB. New sections (dibuat setelah commit A3) akan langsung
 * include `tahun` via App.tsx onAddSection handler.
 *
 * Cara menjalankan kembali (idempotent):
 *   - Buka browser console di sikesumav31.vercel.app saat Anda sudah login
 *   - Paste fungsi backfillTahun() di bawah, panggil
 *   - Atau jalankan manual via curl/Python script (lihat logs Sprint A)
 */

import { supabase } from './supabase';

export async function backfillTahun(): Promise<{ updated: number; skipped: number }> {
  const { data, error } = await supabase.from('pagu_sections').select('*');
  if (error) throw error;
  if (!data) return { updated: 0, skipped: 0 };

  let updated = 0;
  let skipped = 0;

  for (const row of data) {
    const body = (row.data || {}) as { tahun?: number };
    if (typeof body.tahun === 'number') {
      skipped++;
      continue; // sudah ada tahun
    }
    const match = String(row.id || '').match(/^pagu-(\d{4})-/);
    if (!match) {
      console.warn(`Skip ${row.id}: ID tidak match pattern pagu-YYYY-*`);
      skipped++;
      continue;
    }
    const tahun = parseInt(match[1], 10);
    const newData = { ...body, tahun };
    const { error: updErr } = await supabase
      .from('pagu_sections')
      .update({ data: newData })
      .eq('id', row.id);
    if (updErr) {
      console.error(`Failed to update ${row.id}:`, updErr);
      skipped++;
    } else {
      console.log(`✅ ${row.id}: tahun=${tahun}`);
      updated++;
    }
  }

  return { updated, skipped };
}
