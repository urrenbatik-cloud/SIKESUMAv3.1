// ============================================================================
// SIKESUMA v3.1 · S5.4 · Deviation Metrics
// ============================================================================
// File          : utils/deviationMetrics.ts
// Phase         : Step 5 / Phase 5.4 — Deviation Dashboard
// Date          : 8 Mei 2026
// Purpose       : Pure compute helpers untuk deviation dashboard. Input
//                 paguSections + rpdSections + absorptionMap + bills + audit
//                 entries → output structured monthly deviation data per
//                 kategori untuk chart rendering.
//
// Non-goals     : Tidak fetch dari Supabase (caller responsibility), tidak
//                 render UI, tidak mutate state. Pure functions only.
//
// Decisions     :
//   §S5.4-D6 A  : Hybrid color coding — bar warna based on reasoning category
//                 kalau ada audit entry; fallback warna kategori pagu kalau no
//                 reasoning. dominantReasoningCategory di-compute di sini.
// ============================================================================

import type { PaguSection, RPDSection, Bill } from '../types';
import { INITIAL_REASONING_CATEGORIES, type ReasoningCategory } from '../constants/audit';

// ─── §1. Types ─────────────────────────────────────────────────────────────

/** Audit log row shape (matches AuditLogViewer + AuditEntryEditModal). */
export interface AuditLogRow {
  id: string;
  data: {
    entity:             string;
    action:             string;
    entityId:           string;
    user:               string;
    timestamp:          string;
    description:        string;
    snapshot:           unknown;
    reasoning?:         string | null;
    reasoningCategory?: string | null;
    dynamicsFactor?:    string | null;
    reviewerNotes?:     string | null;
    isReviewed?:        boolean;
    reviewedAt?:        string | null;
    reviewedBy?:        string | null;
  };
  created_at?: string;
}

/** Monthly cell — single (month, paguSection) data point. */
export interface MonthlyCell {
  month:                       number;       // 1-12
  rpdPlanned:                  number;       // sum from rpdSection rows monthly[`m${month}`]
  realisasiActual:             number;       // sum from absorptionMap matching kodes
  deviationPct:                number;       // ((actual - planned) / planned) * 100; ∞ if planned=0 and actual>0
  contributingBillIds:         string[];     // bills in this month matching kodes
  auditEntryIds:               string[];     // audit entries linked to those bills
  dominantReasoningCategory:   string | null; // most frequent reasoningCategory across entries (for color coding)
  reasoningCategoryBreakdown:  Record<string, number>; // { kebutuhan_darurat: 2, harga_pasar: 1, ... }
}

/** Per-category aggregation across 12 months. */
export interface CategoryDeviation {
  paguSectionId:    string;     // e.g., 'pagu-2024-bekkes'
  paguSectionTitle: string;     // e.g., 'PAGU ANGGARAN BELANJA BEKKES'
  shortLabel:       string;     // e.g., 'Bekkes' (extracted from title)
  baseColor:        string;     // Tailwind color base for this category default ('slate'/'red'/'blue'/'amber'/'purple')
  rowKodes:         string[];   // all kodes in this section (for matching bills/audit)
  monthly:          MonthlyCell[]; // 12 cells, index 0=Jan, 11=Dec
  yearTotalRpd:     number;
  yearTotalReal:    number;
  yearDeviationPct: number;
}

/** Top-level dashboard data shape. */
export interface DeviationData {
  year:           number;
  categories:     CategoryDeviation[];   // typically 4 (Pegawai, Bekkes, Lainnya, Pemeliharaan)
  monthlyTotals: { rpd: number; realisasi: number }[]; // length 12, untuk y-axis scaling
  yearTotalRpd:   number;
  yearTotalReal:  number;
  yearDeviationPct: number;
}


// ─── §2. Helpers ───────────────────────────────────────────────────────────

/** Default Tailwind color per pagu section short label. Fallback 'slate'. */
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  pegawai:      'slate',
  bekkes:       'rose',
  lainnya:      'amber',
  pemeliharaan: 'emerald',
};

/** Extract short label dari paguSection.id (mis. 'pagu-2024-bekkes' → 'Bekkes'). */
function extractShortLabel(paguSectionId: string, fallbackTitle: string): string {
  const match = paguSectionId.match(/^pagu-\d{4}-(.+)$/);
  if (match) {
    const slug = match[1];
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  // Fallback: ambil last word from title
  const words = fallbackTitle.replace('PAGU ANGGARAN BELANJA', '').trim().split(/\s+/);
  return words[words.length - 1]?.charAt(0).toUpperCase() + words[words.length - 1]?.slice(1).toLowerCase() || 'Lainnya';
}

/** Map short label to default tailwind color. */
function getCategoryBaseColor(shortLabel: string): string {
  return DEFAULT_CATEGORY_COLORS[shortLabel.toLowerCase()] ?? 'slate';
}

/** Calculate deviation percentage. Edge case: planned=0. */
function calcDeviationPct(planned: number, actual: number): number {
  if (planned === 0) {
    return actual === 0 ? 0 : Number.POSITIVE_INFINITY;
  }
  return ((actual - planned) / planned) * 100;
}

/** Pick most frequent reasoning category from breakdown. Tie → first one alphabetical. */
function pickDominantCategory(breakdown: Record<string, number>): string | null {
  const entries = Object.entries(breakdown);
  if (entries.length === 0) return null;
  let maxCount = 0;
  let dominant: string | null = null;
  for (const [cat, count] of entries) {
    if (count > maxCount || (count === maxCount && dominant && cat < dominant)) {
      maxCount = count;
      dominant = cat;
    }
  }
  return dominant;
}


// ─── §3. Main Compute ──────────────────────────────────────────────────────

/**
 * Compute deviation dashboard data — pure function, no side effects.
 *
 * Algorithm:
 *   1. Group bills by month (date.startsWith('YYYY-MM'))
 *   2. For each paguSection (skip header rows level=0):
 *      - Collect kodes from rows (level > 0 = real items)
 *      - For each month 1-12:
 *        - rpdPlanned = sum monthly[`m${month}`] from rpdSection rows
 *        - realisasiActual = sum absorptionMap[kode][`m${month}`] for kodes
 *        - contributingBillIds = bills in month with items.akun in kodes
 *        - auditEntryIds = audit entries with entityId in contributingBillIds + entity='bill'
 *        - reasoningCategoryBreakdown = count by reasoningCategory across entries
 *        - dominantReasoningCategory = most frequent
 *        - deviationPct = formula
 *
 * @param year             - Filter year (audit/bills/rpd)
 * @param paguSections     - Pagu data filtered to year
 * @param rpdSections      - RPD data filtered to year
 * @param absorptionMap    - From App.tsx realisasiMetrics (kode → {m1..m12 → total})
 * @param allBills         - Bills (year-filtered)
 * @param auditEntries     - All audit entries (function does year-matching internally)
 */
export function computeDeviation(
  year: number,
  paguSections: PaguSection[],
  rpdSections: RPDSection[],
  absorptionMap: Record<string, Record<string, number>>,
  allBills: Bill[],
  auditEntries: AuditLogRow[],
): DeviationData {
  // 1. Pre-bucket bills by month
  const billsByMonth: Record<number, Bill[]> = {};
  for (let m = 1; m <= 12; m++) billsByMonth[m] = [];
  const yearStr = year.toString();
  for (const bill of allBills) {
    if (!bill.tanggal || !bill.tanggal.startsWith(yearStr)) continue;
    if (bill.status !== 'Lunas') continue; // match realisasiMetrics filter
    try {
      const m = new Date(bill.tanggal).getMonth() + 1; // 1-12
      if (m >= 1 && m <= 12) billsByMonth[m].push(bill);
    } catch {
      // ignore unparseable dates
    }
  }

  // 2. Pre-index audit entries by entityId for fast lookup
  const auditByEntityId: Record<string, AuditLogRow[]> = {};
  for (const entry of auditEntries) {
    if (entry.data.entity !== 'bill') continue;
    const key = entry.data.entityId;
    if (!auditByEntityId[key]) auditByEntityId[key] = [];
    auditByEntityId[key].push(entry);
  }

  // 3. Build category aggregations
  const categories: CategoryDeviation[] = [];

  for (const section of paguSections) {
    // Skip empty sections defensive
    if (!section.rows || section.rows.length === 0) continue;

    // [Sprint B.5] Match RPD section by linkedPaguSectionId === paguSection.id
    const rpdSection = rpdSections.find((rpd) => rpd.linkedPaguSectionId === section.id);

    // Collect kodes — only level > 0 (skip header). Trim whitespace.
    const itemRows = section.rows.filter((r) => r.level > 0);
    const rowKodes = itemRows.map((r) => r.kode.trim()).filter((k) => k.length > 0);

    if (rowKodes.length === 0) continue;

    const shortLabel = extractShortLabel(section.id, section.title);
    const baseColor  = getCategoryBaseColor(shortLabel);

    // 4. Build 12 monthly cells
    const monthly: MonthlyCell[] = [];
    let yearTotalRpd  = 0;
    let yearTotalReal = 0;

    for (let m = 1; m <= 12; m++) {
      const mKey = `m${m}`;

      // RPD planned: sum from RPD section rows monthly[mKey]
      let rpdPlanned = 0;
      if (rpdSection) {
        for (const row of rpdSection.rows) {
          if (row.level > 0) {
            rpdPlanned += (row.monthly?.[mKey as keyof typeof row.monthly] || 0);
          }
        }
      }

      // Realisasi: sum absorptionMap[kode][mKey] for all kodes in this section
      let realisasiActual = 0;
      for (const kode of rowKodes) {
        const codeMap = absorptionMap[kode];
        if (codeMap) {
          realisasiActual += (codeMap[mKey] || 0);
        }
      }

      // Contributing bills + audit entries
      const monthBills = billsByMonth[m] || [];
      const contributingBillIds: string[] = [];
      for (const bill of monthBills) {
        const matches = bill.items.some((it) => rowKodes.includes(it.akun.trim()));
        if (matches) contributingBillIds.push(bill.id);
      }

      const auditEntryIds: string[] = [];
      const reasoningCategoryBreakdown: Record<string, number> = {};
      for (const billId of contributingBillIds) {
        const entries = auditByEntityId[billId] || [];
        for (const entry of entries) {
          auditEntryIds.push(entry.id);
          const cat = entry.data.reasoningCategory;
          if (cat) {
            reasoningCategoryBreakdown[cat] = (reasoningCategoryBreakdown[cat] || 0) + 1;
          }
        }
      }
      const dominantReasoningCategory = pickDominantCategory(reasoningCategoryBreakdown);

      const deviationPct = calcDeviationPct(rpdPlanned, realisasiActual);

      monthly.push({
        month: m,
        rpdPlanned,
        realisasiActual,
        deviationPct,
        contributingBillIds,
        auditEntryIds,
        dominantReasoningCategory,
        reasoningCategoryBreakdown,
      });

      yearTotalRpd  += rpdPlanned;
      yearTotalReal += realisasiActual;
    }

    categories.push({
      paguSectionId: section.id,
      paguSectionTitle: section.title,
      shortLabel,
      baseColor,
      rowKodes,
      monthly,
      yearTotalRpd,
      yearTotalReal,
      yearDeviationPct: calcDeviationPct(yearTotalRpd, yearTotalReal),
    });
  }

  // 5. Compute monthly totals (sum across categories)
  const monthlyTotals: { rpd: number; realisasi: number }[] = [];
  for (let m = 0; m < 12; m++) {
    let rpd = 0;
    let real = 0;
    for (const cat of categories) {
      rpd  += cat.monthly[m]?.rpdPlanned ?? 0;
      real += cat.monthly[m]?.realisasiActual ?? 0;
    }
    monthlyTotals.push({ rpd, realisasi: real });
  }

  const yearTotalRpd  = categories.reduce((s, c) => s + c.yearTotalRpd, 0);
  const yearTotalReal = categories.reduce((s, c) => s + c.yearTotalReal, 0);

  return {
    year,
    categories,
    monthlyTotals,
    yearTotalRpd,
    yearTotalReal,
    yearDeviationPct: calcDeviationPct(yearTotalRpd, yearTotalReal),
  };
}


// ─── §4. Color & Format Helpers (UI-side, but pure) ────────────────────────

/**
 * Hybrid color logic (D-5.4-6 A):
 *   - If dominantReasoningCategory exists → use reasoning category color (vivid)
 *   - Else → use category baseColor (muted)
 *
 * Returns Tailwind base color name. Caller maps to concrete bg-X-500 etc.
 */
export function getHybridColor(
  cell: MonthlyCell,
  categoryBaseColor: string,
  reasoningCategories: ReasoningCategory[] = INITIAL_REASONING_CATEGORIES,
): { color: string; isReasoned: boolean } {
  if (cell.dominantReasoningCategory) {
    const meta = reasoningCategories.find((c) => c.id === cell.dominantReasoningCategory);
    if (meta) {
      return { color: meta.color, isReasoned: true };
    }
  }
  return { color: categoryBaseColor, isReasoned: false };
}

/** Format Rupiah singkat: 1234567 → "1.2M", 1234 → "1.2K", < 1000 → "1234" */
export function formatRpShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`; // milyar
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `${(n / 1_000).toFixed(0)}rb`;
  return n.toFixed(0);
}

/** Format Rupiah full dengan thousand separator. */
export function formatRpFull(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

/** Format deviation percentage with sign + 1 decimal. */
export function formatDeviationPct(pct: number): string {
  if (!Number.isFinite(pct)) return '∞';
  if (pct === 0) return '0%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/** Map deviation severity to color (for line chart point). */
export function getDeviationSeverityColor(pct: number): string {
  if (!Number.isFinite(pct)) return 'rose';
  const abs = Math.abs(pct);
  if (abs >= 50) return 'rose';        // critical (>±50%)
  if (abs >= 20) return 'amber';       // warning (>±20%)
  if (abs >= 10) return 'sky';         // notable
  return 'emerald';                    // healthy (<±10%)
}

/** Indonesian month abbreviation. */
export const MONTH_LABELS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

/** Indonesian month full. */
export const MONTH_LABELS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;
