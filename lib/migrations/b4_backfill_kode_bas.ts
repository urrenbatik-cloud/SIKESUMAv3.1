/**
 * Migration B.4 — Backfill kode_bas di pagu_sections.data.rows[]
 *
 * Status:  ✅ EXECUTED 10 Mei 2026 dengan persetujuan Angga
 *          (lihat SPRINT-B4-RESPONS-ANGGA.md untuk justifikasi per row).
 *
 * Hasil eksekusi:
 *   - 28 row di-update dengan kode_bas
 *   - 2 row baru di-insert (split 521311.01 → Listrik 75% + Air 25%)
 *   - 2 row di-delete (521411.03 duplikat di pagu-2025-modal)
 *   - 3 orphan parent header rows skipped (kode 521311/521411 tidak valid BAS,
 *     header doesn't need kode_bas anyway)
 *   - Total: 37/40 row sekarang punya kode_bas; 3 orphan parents tetap null.
 *
 * Hard blockers yang di-resolve sebelum eksekusi:
 *   1. HB#1 — Obat/BMHP: kode_bas = 521811 (BUKAN 521813 yang adalah Pita Cukai
 *      per KEP-331 verbatim). Proposal awal (sebelum Angga review) salah.
 *   2. HB#2 — Honor: SEMUA Honor di RS Batin Tikal = 521115. Kriteria KEP-331
 *      "continuous monthly" cocok untuk TKS, Nakes (combined by-design), dan
 *      Pengelola. Saran 521213 di proposal salah.
 *   3. HB#3 — BMP = Bahan Bakar Minyak dan Pelumas (Permenhan 5/2020), bukan
 *      Bahan Makanan. kode_bas = 523122 (Belanja BMP Khusus Non Pertamina).
 *
 * Idempotent: aman dijalankan ulang. Kalau row.kode_bas sudah sama dengan
 * target, di-skip tanpa update.
 */

import { supabase } from '../supabase';

const MAPPING_PENDING_APPROVAL = false; // ✅ Approved by Angga 10 Mei 2026

const KODE_BAS_BACKFILL: Record<string, string> = {
  // === pagu-2024-bekkes (TA 2024 dummy) ===
  'row-2024-bk-h':   '521211',
  'row-2024-bk-1':   '521811',  // Obat-obatan
  'row-2024-bk-2':   '521811',  // BMHP
  'row-2024-bk-3':   '521811',  // Oksigen + Reagen
  // === pagu-2024-lainnya ===
  // row-2024-ln-h orphan (521311 invalid); row-2024-ln-1 → split
  'row-2024-ln-2':   '522112',
  'row-2024-ln-3':   '522191',
  // === pagu-2024-pegawai === HB#2
  'row-2024-pgw-h':  '521115',
  'row-2024-pgw-1':  '521115',  // Honor TKS
  'row-2024-pgw-2':  '521115',  // Honor Pengelola
  // === pagu-2024-pemeliharaan ===
  'row-2024-pm-1':   '523121',  // Perbaikan Alat Medis
  'row-2024-pm-2':   '523111',  // Perbaikan Bangunan
  // === pagu-2025-bekkes === HB#1
  'row-2025-bk-h':   '521811',
  'row-2025-bk-1':   '521811',
  'row-2025-bk-2':   '521811',
  'row-2025-bk-3':   '521111',  // ATK
  'row-2025-bk-4':   '522191',
  'row-2025-bk-5':   '522191',
  'row-2025-bk-6':   '522191',
  'row-2025-bk-7':   '522191',
  // === pagu-2025-jasa === HB#2
  'row-2025-js-h':   '521115',
  'row-2025-js-1':   '521115',
  'row-2025-js-2':   '521115',
  'row-2025-js-3':   '521115',
  // === pagu-2025-modal === (md-h orphan, md-3 deleted)
  'row-2025-md-1':   '532111',  // Modal Peralatan
  'row-2025-md-2':   '536111',  // Modal Lainnya
  // === pagu-2025-operasional ===
  'row-2025-op-h':   '521112',
  'row-2025-op-7':   '521112',  // Makan Pasien
  'row-2025-op-2':   '522191',  // LAUNDRY
  'row-2025-op-8':   '522112',  // internet
  'row-2025-op-9':   '521211',  // Cetak
  'row-2025-op-10':  '524111',  // BPD
  'row-2025-op-12':  '523122',  // BMP HB#3
  'row-2025-op-11':  '532111',  // Pengadaan Alkes (substansi MODAL §2.3)
  // === pagu-2025-pemeliharaan ===
  'row-2025-pm-h':   '523111',
  'row-2025-pm-1':   '523111',
};

const ROWS_TO_DELETE: string[] = ['row-2025-md-3'];

const SPLIT_OPS = [
  {
    sectionId: 'pagu-2024-lainnya',
    sourceRowId: 'row-2024-ln-1',
    newRows: [
      {
        id: 'row-2024-ln-1a', kode: '522111.01', kode_bas: '522111',
        description: 'Listrik (split 75% dari 521311.01)',
        volume: 1, satuan: 'Tahun', level: 1, sumberDana: 'RM',
        hargaSatuanAwal: 150_000_000, hargaSatuanRevisi: 150_000_000,
        jumlahBiayaAwal: 150_000_000, jumlahBiayaRevisi: 150_000_000,
      },
      {
        id: 'row-2024-ln-1b', kode: '522113.01', kode_bas: '522113',
        description: 'Air (split 25% dari 521311.01)',
        volume: 1, satuan: 'Tahun', level: 1, sumberDana: 'RM',
        hargaSatuanAwal: 50_000_000, hargaSatuanRevisi: 50_000_000,
        jumlahBiayaAwal: 50_000_000, jumlahBiayaRevisi: 50_000_000,
      },
    ],
  },
];

const ORPHAN_PARENTS = new Set(['row-2024-ln-h', 'row-2024-pm-h', 'row-2025-md-h']);

export interface BackfillResult {
  updated:     number;
  inserted:    number;
  deleted:     number;
  skipped:     number;
  unmappedRows: string[];
}

export async function backfillKodeBas(): Promise<BackfillResult> {
  if (MAPPING_PENDING_APPROVAL) {
    throw new Error('Migration belum di-approve. Lihat SPRINT-B4-RESPONS-ANGGA.md.');
  }
  const { data, error } = await supabase.from('pagu_sections').select('*');
  if (error) throw error;
  if (!data) return { updated: 0, inserted: 0, deleted: 0, skipped: 0, unmappedRows: [] };

  const result: BackfillResult = { updated: 0, inserted: 0, deleted: 0, skipped: 0, unmappedRows: [] };

  for (const section of data) {
    const body = (section.data || {}) as { rows?: any[] };
    if (!Array.isArray(body.rows)) { result.skipped++; continue; }

    let sectionDirty = false;
    const newRows: any[] = [];
    for (const row of body.rows) {
      const rid = row.id;
      if (ROWS_TO_DELETE.includes(rid)) {
        result.deleted++;
        sectionDirty = true;
        continue;
      }
      const split = SPLIT_OPS.find(op => op.sourceRowId === rid && op.sectionId === section.id);
      if (split) {
        split.newRows.forEach(nr => { newRows.push(nr); result.inserted++; });
        result.deleted++;
        sectionDirty = true;
        continue;
      }
      const targetKodeBas = KODE_BAS_BACKFILL[rid];
      if (targetKodeBas !== undefined) {
        if (row.kode_bas !== targetKodeBas) {
          row.kode_bas = targetKodeBas;
          result.updated++;
          sectionDirty = true;
        } else {
          result.skipped++;
        }
      } else if (ORPHAN_PARENTS.has(rid)) {
        result.skipped++;
      } else if ((row.kode || '').trim()) {
        result.unmappedRows.push(`${section.id}/${rid} (${row.kode})`);
      }
      newRows.push(row);
    }

    if (sectionDirty) {
      body.rows = newRows;
      const { error: updErr } = await supabase
        .from('pagu_sections')
        .update({ data: body })
        .eq('id', section.id);
      if (updErr) console.error(`Failed to update ${section.id}:`, updErr);
      else console.log(`✅ ${section.id}: applied`);
    }
  }
  return result;
}
