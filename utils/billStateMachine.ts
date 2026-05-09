// ============================================================================
// SIKESUMA v3.1 · Bill State Machine — Sprint C.5
// ============================================================================
// File         : utils/billStateMachine.ts
// Phase        : Sprint C.5 — N1 enforcement: Bill status transitions
// Date         : 10 Mei 2026
// Purpose      : Validasi & audit trail untuk perubahan Bill.status. Lattice
//                rule N1: state transitions harus follow flow yang valid dan
//                tercatat untuk audit trail.
//
// Rule:
//   - Draft → Verifikasi    (butuh items.length > 0 & semua akun valid)
//   - Verifikasi → Lunas    (butuh tanggal valid)
//   - Verifikasi → Draft    (rollback edit, audit logged)
//   - Lunas → (terminal)    (tidak boleh kecuali admin override + audit)
//   - Draft → Lunas         (TIDAK BOLEH — wajib via Verifikasi dulu)
// ============================================================================

import type { Bill, BillStatus, BillingItem, PaguSection } from '../types';

export interface TransitionResult {
  ok: boolean;
  /** Pesan untuk user UI bila ok=false. */
  reason?: string;
  /** Daftar item yang akun-nya tidak valid (untuk highlighting di UI). */
  invalidItems?: { id: string; akun: string; namaBarang: string }[];
}

/**
 * Validate apakah transisi dari `from` ke `to` diizinkan + prerequisites terpenuhi.
 * Tidak melakukan transisi — caller bertanggung jawab apply lewat applyTransition().
 */
export function canTransition(
  bill: Bill,
  to: BillStatus,
  paguSections: PaguSection[] = []
): TransitionResult {
  const from = bill.status;

  if (from === to) {
    return { ok: false, reason: `Status sudah '${to}', tidak ada perubahan` };
  }

  // Build set of valid kode (semua leaf nodes Pagu untuk validasi akun)
  const validKodes = new Set<string>();
  paguSections.forEach(sec => {
    sec.rows.forEach((row, idx) => {
      const kode = row.kode.trim();
      if (!kode) return;
      const next = sec.rows[idx + 1];
      const hasChildren = next && next.level > row.level;
      if (!hasChildren) validKodes.add(kode);
    });
  });

  // Transition rules
  switch (from) {
    case 'Draft':
      if (to === 'Verifikasi') {
        if (!bill.items || bill.items.length === 0) {
          return { ok: false, reason: 'Tagihan belum punya item — tambah minimal 1 item dulu' };
        }
        // Validate akun per item against Pagu (only enforce if paguSections provided)
        if (paguSections.length > 0) {
          const invalidItems = bill.items.filter(it => {
            const akun = (it.akun || '').trim();
            return !akun || !validKodes.has(akun);
          });
          if (invalidItems.length > 0) {
            return {
              ok: false,
              reason: `${invalidItems.length} item punya akun yang tidak ada di Pagu — perbaiki dulu`,
              invalidItems: invalidItems.map(it => ({ id: it.id, akun: it.akun, namaBarang: it.namaBarang })),
            };
          }
        }
        // Validate basic numerical sanity
        const totalNominal = bill.items.reduce((sum, it) => sum + (it.volume * it.hargaSatuan), 0);
        if (totalNominal <= 0) {
          return { ok: false, reason: 'Total nominal tagihan harus > 0' };
        }
        return { ok: true };
      }
      if (to === 'Lunas') {
        return { ok: false, reason: 'Tidak boleh skip dari Draft langsung ke Lunas — verifikasi dulu' };
      }
      break;

    case 'Verifikasi':
      if (to === 'Lunas') {
        if (!bill.tanggal) {
          return { ok: false, reason: 'Tanggal pembayaran wajib diisi sebelum tandai Lunas' };
        }
        return { ok: true };
      }
      if (to === 'Draft') {
        // Rollback — allowed but audit-logged
        return { ok: true };
      }
      break;

    case 'Lunas':
      // Lunas adalah terminal state. Boleh kembali via admin override
      // (caller harus pass override flag — di sini default tidak boleh).
      return {
        ok: false,
        reason: 'Bill sudah Lunas — tidak boleh diubah kecuali admin override (audit trail)',
      };
  }

  return { ok: false, reason: `Transisi tidak valid: ${from} → ${to}` };
}

/**
 * Apply transition + log entry. Caller harus sudah call canTransition() dan
 * dapat ok=true; ini hanya melakukan apply (idempotent — kalau sudah di state
 * target, return Bill apa adanya).
 *
 * Returns Bill baru dengan status updated dan statusLog entry baru.
 */
export function applyTransition(
  bill: Bill,
  to: BillStatus,
  options?: { by?: string; reason?: string }
): Bill {
  if (bill.status === to) return bill;

  const newLog = [
    ...(bill.statusLog || []),
    {
      from: bill.status,
      to,
      at: new Date().toISOString(),
      by: options?.by,
      reason: options?.reason,
    },
  ];

  return {
    ...bill,
    status: to,
    statusLog: newLog,
  };
}

/**
 * Convenience: cek + apply dalam satu call. Returns null bila transition gagal.
 */
export function tryTransition(
  bill: Bill,
  to: BillStatus,
  paguSections: PaguSection[] = [],
  options?: { by?: string; reason?: string }
): { bill: Bill; result: TransitionResult } {
  const result = canTransition(bill, to, paguSections);
  if (!result.ok) {
    return { bill, result };
  }
  return { bill: applyTransition(bill, to, options), result };
}
