// ============================================================================
// SIKESUMA v3.1 · RealisasiBucket — Coexistence Primitive
// ============================================================================
// File          : utils/realisasiBucket.ts
// Phase         : P3 — RealisasiBucket Implementation
// Date          : 10 Mei 2026
// Purpose       : The "missing primitive" at the coexistence point where
//                 lattice constraints (Pagu→RAB→RPD) meet non-lattice events
//                 (Bills, PatientClaims, Staff payroll).
//
// Architecture  :
//   Source Event   →   Matching Machine   →   Bucket        →   Presentation
//   Bill/Claim          Draft→Verif→Lunas      kode×bulan        LRA tab
//                       + validation gate      postings[]        Observables
//   Non-Lattice         Bridge/Matching        Coexistence       Lattice
//
// Key invariants:
//   L6: Realisasi = Σ(Lunas only)
//   L7: LRA = Pagu - Realisasi
//   IV: Every bucket posting traces back to exactly one source event.
//
// Backward compatibility:
//   buildBucketRegistry() returns `absorptionMap` in the same shape as the
//   old realisasiMetrics, so consumers can migrate incrementally.
// ============================================================================

import type { Bill, PaguSection, PatientClaim, Employee, Doctor, RPDSection } from '../types';

// ─── §1. Types ─────────────────────────────────────────────────────────────

/** Single posting = one non-lattice event mapped to a bucket. */
export interface BucketPosting {
  sourceId:    string;                          // Bill.id | 'claim-{id}' | 'staff-tks-m{n}' | 'transport-m{n}'
  sourceType:  'BILL' | 'CLAIM_JASA' | 'STAFF_TKS' | 'STAFF_TRANSPORT';
  amount:      number;                          // Rupiah
  description: string;                          // human-readable trace
  postedAt:    string;                          // ISO date of the source event
}

/** Bucket = coexistence point for one kode akun × one month. */
export interface RealisasiBucket {
  kodeAkun:       string;                       // lattice anchor
  tahun:          number;
  bulan:          number;                        // 1–12
  postings:       BucketPosting[];               // individual events
  totalRealisasi: number;                        // Σ postings[].amount (computed)
}

/** IV (Independent Verification) check result for one bucket. */
export interface IVCheckResult {
  kodeAkun:     string;
  bulan:        number;
  severity:     'OK' | 'WARNING' | 'ERROR';
  code:         string;                          // e.g. 'IV-OVER-PAGU', 'IV-RPD-DEVIATION'
  message:      string;
  bucketTotal:  number;
  reference:    number;                          // pagu ceiling or RPD planned
}

/** Registry = complete collection of all buckets + derived views. */
export interface BucketRegistry {
  // Core data
  buckets:        Record<string, Record<number, RealisasiBucket>>;  // kode → bulan → bucket
  flatBuckets:    RealisasiBucket[];                                // all buckets as flat list

  // Backward-compatible view (drop-in for old absorptionMap)
  absorptionMap:  Record<string, Record<string, number>>;           // kode → {m1..m12 → total}

  // Aggregated totals
  totalPagu:      number;
  totalReal:      number;

  // IV check results
  ivChecks:       IVCheckResult[];
}

// ─── §2. Bucket Builder ────────────────────────────────────────────────────

/** Internal helper: get or create a bucket in the registry. */
function getOrCreateBucket(
  buckets: Record<string, Record<number, RealisasiBucket>>,
  kodeAkun: string,
  bulan: number,
  tahun: number,
): RealisasiBucket {
  if (!buckets[kodeAkun]) buckets[kodeAkun] = {};
  if (!buckets[kodeAkun][bulan]) {
    buckets[kodeAkun][bulan] = {
      kodeAkun,
      tahun,
      bulan,
      postings: [],
      totalRealisasi: 0,
    };
  }
  return buckets[kodeAkun][bulan];
}

/** Post a single event to a bucket. */
function postToBucket(
  buckets: Record<string, Record<number, RealisasiBucket>>,
  kodeAkun: string,
  bulan: number,
  tahun: number,
  posting: BucketPosting,
): void {
  const cleanCode = kodeAkun.trim();
  if (!cleanCode) return;
  const bucket = getOrCreateBucket(buckets, cleanCode, bulan, tahun);
  bucket.postings.push(posting);
  bucket.totalRealisasi += posting.amount;
}

// ─── §3. Fee Calculation Import ────────────────────────────────────────────
// These are needed for jasa posting. We import them as parameters to keep
// the utility pure (no dependency on BPJS module internals).

export interface JasaAccountMap {
  tks:       string;  // e.g. '521115.01'
  nakes:     string;  // e.g. '521115.02'
  pengelola: string;  // e.g. '521115.03'
}

export interface JasaMonthlyData {
  bulan:         number;   // 1–12
  tksTotal:      number;   // total TKS honor for this month
  nakesTotal:    number;   // transport + jasa nakes
  pengelolaTotal: number;  // pengelola + manajemen + casemix
}

// ─── §4. Main Builder ──────────────────────────────────────────────────────

export interface BuildBucketRegistryInput {
  paguSections:     PaguSection[];
  rpdSections:      RPDSection[];
  bills:            Bill[];
  jasaMonthlyData:  JasaMonthlyData[];   // pre-computed from BPJS logic
  jasaAccountMap:   JasaAccountMap;
  selectedYear:     number | 'ALL';
  budgetViewMode:   'SEMULA' | 'REVISI' | 'SEMUA';
}

/**
 * Build the complete BucketRegistry from source events.
 *
 * Replaces the old `realisasiMetrics` useMemo in App.tsx. Returns the same
 * `absorptionMap` shape for backward compatibility, plus rich bucket data
 * with individual postings and IV checks.
 */
export function buildBucketRegistry(input: BuildBucketRegistryInput): BucketRegistry {
  const { paguSections, rpdSections, bills, jasaMonthlyData, jasaAccountMap, selectedYear, budgetViewMode } = input;
  const yearFilter = selectedYear === 'ALL' ? '' : selectedYear.toString();
  const tahun = selectedYear === 'ALL' ? 2025 : selectedYear;

  const buckets: Record<string, Record<number, RealisasiBucket>> = {};

  // ── Step 1: Post bill events (L6: Lunas only) ──
  bills
    .filter(b => b.status === 'Lunas' && b.tanggal.startsWith(yearFilter))
    .forEach(bill => {
      const bDate = new Date(bill.tanggal);
      const monthNum = bDate.getMonth() + 1;
      bill.items.forEach(item => {
        const amount = item.volume * item.hargaSatuan;
        postToBucket(buckets, item.akun, monthNum, tahun, {
          sourceId:    bill.id,
          sourceType:  'BILL',
          amount,
          description: `${bill.namaTagihan} — ${item.namaBarang}`,
          postedAt:    bill.tanggal,
        });
      });
    });

  // ── Step 2: Post jasa/staff events ──
  jasaMonthlyData.forEach(jmd => {
    if (jmd.tksTotal > 0) {
      postToBucket(buckets, jasaAccountMap.tks, jmd.bulan, tahun, {
        sourceId:    `staff-tks-m${jmd.bulan}`,
        sourceType:  'STAFF_TKS',
        amount:      jmd.tksTotal,
        description: `Honor TKS bulan ${jmd.bulan}`,
        postedAt:    `${tahun}-${String(jmd.bulan).padStart(2, '0')}-01`,
      });
    }
    if (jmd.nakesTotal > 0) {
      postToBucket(buckets, jasaAccountMap.nakes, jmd.bulan, tahun, {
        sourceId:    `nakes-m${jmd.bulan}`,
        sourceType:  'CLAIM_JASA',
        amount:      jmd.nakesTotal,
        description: `Transport + Jasa Nakes bulan ${jmd.bulan}`,
        postedAt:    `${tahun}-${String(jmd.bulan).padStart(2, '0')}-01`,
      });
    }
    if (jmd.pengelolaTotal > 0) {
      postToBucket(buckets, jasaAccountMap.pengelola, jmd.bulan, tahun, {
        sourceId:    `pengelola-m${jmd.bulan}`,
        sourceType:  'CLAIM_JASA',
        amount:      jmd.pengelolaTotal,
        description: `Jasa Pengelola bulan ${jmd.bulan}`,
        postedAt:    `${tahun}-${String(jmd.bulan).padStart(2, '0')}-01`,
      });
    }
  });

  // ── Step 3: Build absorptionMap (backward compatibility) ──
  const absorptionMap: Record<string, Record<string, number>> = {};
  for (const [kode, monthMap] of Object.entries(buckets)) {
    absorptionMap[kode] = {};
    for (const [bulanStr, bucket] of Object.entries(monthMap)) {
      absorptionMap[kode][`m${bulanStr}`] = bucket.totalRealisasi;
    }
  }

  // ── Step 4: Compute totals (from paguSections, like the old code) ──
  let totalPagu = 0;
  let totalReal = 0;
  paguSections.forEach(sec => {
    const minLvl = sec.rows.length > 0 ? Math.min(...sec.rows.map(r => r.level)) : 0;
    sec.rows.filter(r => r.level === minLvl).forEach(r => {
      totalPagu += (budgetViewMode === 'SEMULA' ? r.jumlahBiayaAwal : r.jumlahBiayaRevisi) || 0;
      const rowMonthlyData = absorptionMap[r.kode.trim()] || {};
      totalReal += Object.values(rowMonthlyData).reduce((sum, val) => sum + val, 0);
    });
  });

  // ── Step 5: Flatten buckets ──
  const flatBuckets: RealisasiBucket[] = [];
  for (const monthMap of Object.values(buckets)) {
    for (const bucket of Object.values(monthMap)) {
      flatBuckets.push(bucket);
    }
  }

  // ── Step 6: IV checks ──
  const ivChecks = runIVChecks(buckets, paguSections, rpdSections, budgetViewMode);

  return { buckets, flatBuckets, absorptionMap, totalPagu, totalReal, ivChecks };
}

// ─── §5. IV (Independent Verification) ────────────────────────────────────

/**
 * Run IV checks: validate buckets against lattice constraints.
 * - IV-OVER-PAGU: yearly realisasi for a kode exceeds pagu ceiling
 * - IV-RPD-DEVIATION: monthly realisasi deviates > 30% from RPD planned
 * - IV-ORPHAN: bucket kode has no matching pagu row (potential miscoding)
 */
function runIVChecks(
  buckets: Record<string, Record<number, RealisasiBucket>>,
  paguSections: PaguSection[],
  rpdSections: RPDSection[],
  budgetViewMode: 'SEMULA' | 'REVISI' | 'SEMUA',
): IVCheckResult[] {
  const checks: IVCheckResult[] = [];

  // Build pagu lookup: kode → ceiling
  const paguByKode: Record<string, number> = {};
  const allPaguKodes = new Set<string>();
  paguSections.forEach(sec => {
    sec.rows.forEach(r => {
      const cleanCode = r.kode.trim();
      if (!cleanCode) return;
      allPaguKodes.add(cleanCode);
      // Use leaf nodes only
      const isLeaf = r.level === Math.max(...sec.rows.filter(sr => sr.kode.trim().startsWith(cleanCode.split('.')[0])).map(sr => sr.level));
      if (r.level > 0 || sec.rows.length === 1) {
        paguByKode[cleanCode] = (budgetViewMode === 'SEMULA' ? r.jumlahBiayaAwal : r.jumlahBiayaRevisi) || 0;
      }
    });
  });

  // Build RPD lookup: kode → monthly planned
  const rpdByKode: Record<string, Record<string, number>> = {};
  rpdSections.forEach(sec => {
    sec.rows.forEach(row => {
      const cleanCode = row.kode.trim();
      if (!cleanCode) return;
      rpdByKode[cleanCode] = { ...row.monthly } as unknown as Record<string, number>;
    });
  });

  // Check each bucket kode
  for (const [kode, monthMap] of Object.entries(buckets)) {
    const yearTotal = Object.values(monthMap).reduce((sum, b) => sum + b.totalRealisasi, 0);
    const paguCeiling = paguByKode[kode];

    // IV-ORPHAN: kode exists in buckets but not in pagu
    if (paguCeiling === undefined) {
      // Only warn for child kodes (with dot) that have significant amounts
      if (kode.includes('.') && yearTotal > 0) {
        checks.push({
          kodeAkun: kode, bulan: 0, severity: 'WARNING',
          code: 'IV-ORPHAN',
          message: `Kode ${kode} memiliki realisasi Rp ${yearTotal.toLocaleString('id-ID')} tapi tidak ditemukan di Pagu`,
          bucketTotal: yearTotal, reference: 0,
        });
      }
    } else {
      // IV-OVER-PAGU: yearly realisasi > pagu
      if (yearTotal > paguCeiling && paguCeiling > 0) {
        const overPct = ((yearTotal - paguCeiling) / paguCeiling * 100).toFixed(1);
        checks.push({
          kodeAkun: kode, bulan: 0, severity: 'ERROR',
          code: 'IV-OVER-PAGU',
          message: `Kode ${kode}: Realisasi (${yearTotal.toLocaleString('id-ID')}) melebihi Pagu (${paguCeiling.toLocaleString('id-ID')}) sebesar ${overPct}%`,
          bucketTotal: yearTotal, reference: paguCeiling,
        });
      }
    }

    // IV-RPD-DEVIATION: monthly check
    const rpdMonthly = rpdByKode[kode];
    if (rpdMonthly) {
      for (const [bulanStr, bucket] of Object.entries(monthMap)) {
        const bulan = parseInt(bulanStr);
        const planned = (rpdMonthly as any)[`m${bulan}`] || 0;
        if (planned > 0 && bucket.totalRealisasi > 0) {
          const deviationPct = Math.abs((bucket.totalRealisasi - planned) / planned * 100);
          if (deviationPct > 30) {
            checks.push({
              kodeAkun: kode, bulan, severity: 'WARNING',
              code: 'IV-RPD-DEVIATION',
              message: `Kode ${kode} bulan ${bulan}: deviasi ${deviationPct.toFixed(0)}% dari RPD (Rencana: ${planned.toLocaleString('id-ID')}, Aktual: ${bucket.totalRealisasi.toLocaleString('id-ID')})`,
              bucketTotal: bucket.totalRealisasi, reference: planned,
            });
          }
        }
      }
    }
  }

  return checks.sort((a, b) => {
    const sevOrder = { ERROR: 0, WARNING: 1, OK: 2 };
    return (sevOrder[a.severity] - sevOrder[b.severity]) || a.kodeAkun.localeCompare(b.kodeAkun);
  });
}

// ─── §6. Query Helpers ─────────────────────────────────────────────────────

/** Get all postings for a specific kode across all months. */
export function getPostingsForKode(
  registry: BucketRegistry,
  kodeAkun: string,
): BucketPosting[] {
  const monthMap = registry.buckets[kodeAkun];
  if (!monthMap) return [];
  return Object.values(monthMap).flatMap(b => b.postings);
}

/** Get postings for a specific kode + month. */
export function getPostingsForKodeBulan(
  registry: BucketRegistry,
  kodeAkun: string,
  bulan: number,
): BucketPosting[] {
  return registry.buckets[kodeAkun]?.[bulan]?.postings || [];
}

/** Get yearly total realisasi for a kode. */
export function getYearlyTotal(
  registry: BucketRegistry,
  kodeAkun: string,
): number {
  const monthMap = registry.buckets[kodeAkun];
  if (!monthMap) return 0;
  return Object.values(monthMap).reduce((sum, b) => sum + b.totalRealisasi, 0);
}

/** Get all kode akun that have postings. */
export function getActiveKodes(registry: BucketRegistry): string[] {
  return Object.keys(registry.buckets);
}

/** Count total postings across all buckets (for dashboard stats). */
export function getTotalPostingCount(registry: BucketRegistry): number {
  return registry.flatBuckets.reduce((sum, b) => sum + b.postings.length, 0);
}
