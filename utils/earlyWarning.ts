// ============================================================================
// SIKESUMA v3.1 · S5.5 · Early Warning Engine
// ============================================================================
// File          : utils/earlyWarning.ts
// Phase         : Step 5 / Phase 5.5 — Early Warning Engine
// Date          : 9 Mei 2026
// Purpose       : Pure compute helpers untuk pattern detection & threshold-based
//                 alerts dari deviation data (output Phase 5.4).
//
// Non-goals     : Tidak fetch dari Supabase (caller responsibility), tidak
//                 render UI, tidak mutate state. Pure functions only.
//
// Decisions     :
//   §S5.5-D1    : 3-tier severity: info (≥10%), warning (≥20%), critical (≥50%)
//   §S5.5-D2    : 4 pattern types: spike, gradual_inflation, cliff_drop,
//                 sustained_overspend
//   §S5.5-D3    : Placement integrated in DeviationDashboard (panel between
//                 header and charts)
//   §S5.5-D4    : Thresholds configurable via system_settings.warning_thresholds
//                 (fallback ke defaults)
// ============================================================================

import type {
  DeviationData,
  CategoryDeviation,
  MonthlyCell,
} from './deviationMetrics';

// ─── §1. Types ─────────────────────────────────────────────────────────────

/** Severity tiers for alerts. */
export type WarningSeverity = 'info' | 'warning' | 'critical';

/** Pattern types detected from monthly trajectories. */
export type WarningPattern =
  | 'threshold_breach'       // single month exceeds deviation threshold
  | 'spike'                  // sudden jump >30% month-to-month
  | 'gradual_inflation'      // 3+ consecutive months rising
  | 'cliff_drop'             // sudden drop >40% month-to-month (underspend signal)
  | 'sustained_overspend';   // 3+ months above warning threshold

/** Single warning alert. */
export interface WarningAlert {
  id:             string;          // unique key for React rendering
  severity:       WarningSeverity;
  pattern:        WarningPattern;
  categoryLabel:  string;          // e.g., 'Bekkes'
  categoryId:     string;          // paguSectionId
  monthRange:     number[];        // affected months (1-indexed)
  deviationPct:   number;          // representative deviation %
  message:        string;          // Indonesian human-readable description
  recommendation: string;          // actionable suggestion
}

/** Configurable threshold settings. */
export interface WarningThresholds {
  /** Deviation % absolute to trigger info alert */
  infoThresholdPct:      number;   // default 10
  /** Deviation % absolute to trigger warning alert */
  warningThresholdPct:   number;   // default 20
  /** Deviation % absolute to trigger critical alert */
  criticalThresholdPct:  number;   // default 50
  /** Month-to-month % change to detect spike */
  spikeThresholdPct:     number;   // default 30
  /** Month-to-month % drop to detect cliff */
  cliffDropThresholdPct: number;   // default 40
  /** Minimum consecutive months for gradual pattern */
  gradualMinMonths:      number;   // default 3
  /** Minimum consecutive months for sustained pattern */
  sustainedMinMonths:    number;   // default 3
}

/** Top-level early warning result. */
export interface EarlyWarningResult {
  alerts:          WarningAlert[];
  criticalCount:   number;
  warningCount:    number;
  infoCount:       number;
  totalAlerts:     number;
  overallHealth:   'healthy' | 'watch' | 'at_risk' | 'critical';
  healthMessage:   string;
}


// ─── §2. Defaults ──────────────────────────────────────────────────────────

export const DEFAULT_WARNING_THRESHOLDS: WarningThresholds = {
  infoThresholdPct:      10,
  warningThresholdPct:   20,
  criticalThresholdPct:  50,
  spikeThresholdPct:     30,
  cliffDropThresholdPct: 40,
  gradualMinMonths:      3,
  sustainedMinMonths:    3,
};


// ─── §3. Pattern Detection Helpers ─────────────────────────────────────────

/**
 * Classify severity based on absolute deviation percentage.
 */
function classifySeverity(
  absPct: number,
  thresholds: WarningThresholds,
): WarningSeverity | null {
  if (absPct >= thresholds.criticalThresholdPct) return 'critical';
  if (absPct >= thresholds.warningThresholdPct) return 'warning';
  if (absPct >= thresholds.infoThresholdPct) return 'info';
  return null;
}

/**
 * Detect single-month threshold breaches.
 */
function detectThresholdBreaches(
  category: CategoryDeviation,
  thresholds: WarningThresholds,
  currentMonth: number,
): WarningAlert[] {
  const alerts: WarningAlert[] = [];

  for (let mIdx = 0; mIdx < currentMonth && mIdx < 12; mIdx++) {
    const cell = category.monthly[mIdx];
    if (!cell || cell.rpdPlanned === 0) continue;

    const absPct = Math.abs(cell.deviationPct);
    if (!Number.isFinite(absPct)) continue;

    const severity = classifySeverity(absPct, thresholds);
    if (!severity) continue;

    // Only emit for warning+ to avoid noise (info captured by patterns)
    if (severity === 'info') continue;

    const isOver = cell.deviationPct > 0;
    const direction = isOver ? 'melebihi' : 'di bawah';

    alerts.push({
      id: `threshold-${category.paguSectionId}-m${mIdx + 1}`,
      severity,
      pattern: 'threshold_breach',
      categoryLabel: category.shortLabel,
      categoryId: category.paguSectionId,
      monthRange: [mIdx + 1],
      deviationPct: cell.deviationPct,
      message: `${category.shortLabel} bulan ${mIdx + 1}: realisasi ${direction} RPD sebesar ${Math.abs(cell.deviationPct).toFixed(1)}%`,
      recommendation: isOver
        ? 'Evaluasi kebutuhan revisi pagu ke atas atau realokasi dari pos lain.'
        : 'Periksa apakah ada keterlambatan pengadaan atau kebutuhan percepatan belanja.',
    });
  }

  return alerts;
}

/**
 * Detect spike pattern — sudden jump >threshold% from previous month.
 * Compares actual realisasi values (not deviation from RPD).
 */
function detectSpikes(
  category: CategoryDeviation,
  thresholds: WarningThresholds,
  currentMonth: number,
): WarningAlert[] {
  const alerts: WarningAlert[] = [];

  for (let mIdx = 1; mIdx < currentMonth && mIdx < 12; mIdx++) {
    const prev = category.monthly[mIdx - 1];
    const curr = category.monthly[mIdx];
    if (!prev || !curr) continue;
    if (prev.realisasiActual <= 0) continue; // can't calc % change from zero

    const pctChange = ((curr.realisasiActual - prev.realisasiActual) / prev.realisasiActual) * 100;

    if (pctChange >= thresholds.spikeThresholdPct) {
      const absDev = Math.abs(curr.deviationPct);
      const severity: WarningSeverity = absDev >= thresholds.criticalThresholdPct
        ? 'critical'
        : absDev >= thresholds.warningThresholdPct
          ? 'warning'
          : 'info';

      alerts.push({
        id: `spike-${category.paguSectionId}-m${mIdx + 1}`,
        severity,
        pattern: 'spike',
        categoryLabel: category.shortLabel,
        categoryId: category.paguSectionId,
        monthRange: [mIdx, mIdx + 1],
        deviationPct: curr.deviationPct,
        message: `${category.shortLabel}: lonjakan belanja +${pctChange.toFixed(0)}% dari bulan ${mIdx} ke bulan ${mIdx + 1}.`,
        recommendation: 'Investigasi penyebab lonjakan — cek apakah ada kebutuhan darurat, backlog belanja, atau anomali data.',
      });
    }
  }

  return alerts;
}

/**
 * Detect cliff drop — sudden decrease >threshold% month-to-month.
 */
function detectCliffDrops(
  category: CategoryDeviation,
  thresholds: WarningThresholds,
  currentMonth: number,
): WarningAlert[] {
  const alerts: WarningAlert[] = [];

  for (let mIdx = 1; mIdx < currentMonth && mIdx < 12; mIdx++) {
    const prev = category.monthly[mIdx - 1];
    const curr = category.monthly[mIdx];
    if (!prev || !curr) continue;
    if (prev.realisasiActual <= 0) continue;

    const pctChange = ((prev.realisasiActual - curr.realisasiActual) / prev.realisasiActual) * 100;

    if (pctChange >= thresholds.cliffDropThresholdPct) {
      alerts.push({
        id: `cliff-${category.paguSectionId}-m${mIdx + 1}`,
        severity: 'warning',
        pattern: 'cliff_drop',
        categoryLabel: category.shortLabel,
        categoryId: category.paguSectionId,
        monthRange: [mIdx, mIdx + 1],
        deviationPct: curr.deviationPct,
        message: `${category.shortLabel}: penurunan tajam -${pctChange.toFixed(0)}% dari bulan ${mIdx} ke bulan ${mIdx + 1}.`,
        recommendation: 'Periksa apakah ada gangguan supply, penundaan pengadaan, atau pergeseran belanja ke periode berikutnya.',
      });
    }
  }

  return alerts;
}

/**
 * Detect gradual inflation — N consecutive months of rising realisasi
 * where at least one month exceeds info threshold.
 */
function detectGradualInflation(
  category: CategoryDeviation,
  thresholds: WarningThresholds,
  currentMonth: number,
): WarningAlert[] {
  const alerts: WarningAlert[] = [];
  const limit = Math.min(currentMonth, 12);

  let streakStart = 0;
  let streakLen = 1;

  for (let mIdx = 1; mIdx < limit; mIdx++) {
    const prev = category.monthly[mIdx - 1];
    const curr = category.monthly[mIdx];

    if (curr && prev && curr.realisasiActual > prev.realisasiActual && prev.realisasiActual > 0) {
      streakLen++;
    } else {
      // Emit if streak was long enough
      if (streakLen >= thresholds.gradualMinMonths) {
        const peakMonth = streakStart + streakLen - 1;
        const peakDev = category.monthly[peakMonth]?.deviationPct ?? 0;
        const absPeakDev = Math.abs(peakDev);
        if (absPeakDev >= thresholds.infoThresholdPct) {
          const months = Array.from({ length: streakLen }, (_, i) => streakStart + i + 1);
          alerts.push({
            id: `gradual-${category.paguSectionId}-m${months[0]}-${months[months.length - 1]}`,
            severity: absPeakDev >= thresholds.warningThresholdPct ? 'warning' : 'info',
            pattern: 'gradual_inflation',
            categoryLabel: category.shortLabel,
            categoryId: category.paguSectionId,
            monthRange: months,
            deviationPct: peakDev,
            message: `${category.shortLabel}: kenaikan bertahap selama ${streakLen} bulan berturut-turut (bulan ${months[0]}–${months[months.length - 1]}).`,
            recommendation: 'Trend kenaikan konsisten mungkin mengindikasikan inflasi harga atau peningkatan volume. Pertimbangkan penyesuaian RPD.',
          });
        }
      }
      streakStart = mIdx;
      streakLen = 1;
    }
  }

  // Check trailing streak
  if (streakLen >= thresholds.gradualMinMonths) {
    const peakMonth = streakStart + streakLen - 1;
    const peakDev = category.monthly[peakMonth]?.deviationPct ?? 0;
    const absPeakDev = Math.abs(peakDev);
    if (absPeakDev >= thresholds.infoThresholdPct) {
      const months = Array.from({ length: streakLen }, (_, i) => streakStart + i + 1);
      alerts.push({
        id: `gradual-${category.paguSectionId}-m${months[0]}-${months[months.length - 1]}`,
        severity: absPeakDev >= thresholds.warningThresholdPct ? 'warning' : 'info',
        pattern: 'gradual_inflation',
        categoryLabel: category.shortLabel,
        categoryId: category.paguSectionId,
        monthRange: months,
        deviationPct: peakDev,
        message: `${category.shortLabel}: kenaikan bertahap selama ${streakLen} bulan berturut-turut (bulan ${months[0]}–${months[months.length - 1]}).`,
        recommendation: 'Trend kenaikan konsisten mungkin mengindikasikan inflasi harga atau peningkatan volume. Pertimbangkan penyesuaian RPD.',
      });
    }
  }

  return alerts;
}

/**
 * Detect sustained overspend — N consecutive months where deviation
 * exceeds warning threshold (overspend side only).
 */
function detectSustainedOverspend(
  category: CategoryDeviation,
  thresholds: WarningThresholds,
  currentMonth: number,
): WarningAlert[] {
  const alerts: WarningAlert[] = [];
  const limit = Math.min(currentMonth, 12);

  let streakStart = -1;
  let streakLen = 0;

  for (let mIdx = 0; mIdx < limit; mIdx++) {
    const cell = category.monthly[mIdx];
    if (cell && Number.isFinite(cell.deviationPct) && cell.deviationPct >= thresholds.warningThresholdPct) {
      if (streakLen === 0) streakStart = mIdx;
      streakLen++;
    } else {
      if (streakLen >= thresholds.sustainedMinMonths) {
        const months = Array.from({ length: streakLen }, (_, i) => streakStart + i + 1);
        const maxDev = Math.max(...months.map(m => category.monthly[m - 1]?.deviationPct ?? 0));
        alerts.push({
          id: `sustained-${category.paguSectionId}-m${months[0]}-${months[months.length - 1]}`,
          severity: maxDev >= thresholds.criticalThresholdPct ? 'critical' : 'warning',
          pattern: 'sustained_overspend',
          categoryLabel: category.shortLabel,
          categoryId: category.paguSectionId,
          monthRange: months,
          deviationPct: maxDev,
          message: `${category.shortLabel}: overspend berkelanjutan selama ${streakLen} bulan (bulan ${months[0]}–${months[months.length - 1]}), puncak deviasi +${maxDev.toFixed(1)}%.`,
          recommendation: 'Pola overspend berkelanjutan adalah sinyal kuat untuk mengajukan revisi pagu. Segera siapkan proposal revisi.',
        });
      }
      streakLen = 0;
    }
  }

  // Trailing
  if (streakLen >= thresholds.sustainedMinMonths) {
    const months = Array.from({ length: streakLen }, (_, i) => streakStart + i + 1);
    const maxDev = Math.max(...months.map(m => category.monthly[m - 1]?.deviationPct ?? 0));
    alerts.push({
      id: `sustained-${category.paguSectionId}-m${months[0]}-${months[months.length - 1]}`,
      severity: maxDev >= thresholds.criticalThresholdPct ? 'critical' : 'warning',
      pattern: 'sustained_overspend',
      categoryLabel: category.shortLabel,
      categoryId: category.paguSectionId,
      monthRange: months,
      deviationPct: maxDev,
      message: `${category.shortLabel}: overspend berkelanjutan selama ${streakLen} bulan (bulan ${months[0]}–${months[months.length - 1]}), puncak deviasi +${maxDev.toFixed(1)}%.`,
      recommendation: 'Pola overspend berkelanjutan adalah sinyal kuat untuk mengajukan revisi pagu. Segera siapkan proposal revisi.',
    });
  }

  return alerts;
}


// ─── §4. Main Compute ──────────────────────────────────────────────────────

/**
 * Run all pattern detectors and threshold checks. Returns sorted alerts
 * (critical first, then warning, then info).
 *
 * @param deviationData - Output from computeDeviation() (Phase 5.4)
 * @param thresholds    - Configurable thresholds (defaults applied if omitted)
 * @param upToMonth     - Analyze up to this month (1-12). Default: 12 (full year).
 *                        Useful for partial-year analysis (e.g., current month).
 */
export function analyzeWarnings(
  deviationData: DeviationData,
  thresholds: WarningThresholds = DEFAULT_WARNING_THRESHOLDS,
  upToMonth: number = 12,
): EarlyWarningResult {
  const allAlerts: WarningAlert[] = [];
  const currentMonth = Math.min(Math.max(upToMonth, 1), 12);

  for (const category of deviationData.categories) {
    // Run all 4 pattern detectors + threshold breach
    allAlerts.push(...detectThresholdBreaches(category, thresholds, currentMonth));
    allAlerts.push(...detectSpikes(category, thresholds, currentMonth));
    allAlerts.push(...detectCliffDrops(category, thresholds, currentMonth));
    allAlerts.push(...detectGradualInflation(category, thresholds, currentMonth));
    allAlerts.push(...detectSustainedOverspend(category, thresholds, currentMonth));
  }

  // Deduplicate by id (patterns may overlap on same month)
  const seen = new Set<string>();
  const unique = allAlerts.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort: critical first → warning → info, then by month ascending
  const severityOrder: Record<WarningSeverity, number> = { critical: 0, warning: 1, info: 2 };
  unique.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (a.monthRange[0] ?? 0) - (b.monthRange[0] ?? 0);
  });

  const criticalCount = unique.filter((a) => a.severity === 'critical').length;
  const warningCount = unique.filter((a) => a.severity === 'warning').length;
  const infoCount = unique.filter((a) => a.severity === 'info').length;

  // Overall health assessment
  let overallHealth: EarlyWarningResult['overallHealth'];
  let healthMessage: string;

  if (criticalCount > 0) {
    overallHealth = 'critical';
    healthMessage = `${criticalCount} peringatan kritis terdeteksi — segera evaluasi kebutuhan revisi pagu.`;
  } else if (warningCount > 0) {
    overallHealth = 'at_risk';
    healthMessage = `${warningCount} peringatan aktif — pantau perkembangan dan siapkan analisis deviasi.`;
  } else if (infoCount > 0) {
    overallHealth = 'watch';
    healthMessage = `${infoCount} catatan informasi — deviasi masih dalam batas, tetap dipantau.`;
  } else {
    overallHealth = 'healthy';
    healthMessage = 'Tidak ada peringatan — realisasi sesuai rencana.';
  }

  return {
    alerts: unique,
    criticalCount,
    warningCount,
    infoCount,
    totalAlerts: unique.length,
    overallHealth,
    healthMessage,
  };
}


// ─── §5. Formatting Helpers ────────────────────────────────────────────────

/** Pattern label (Indonesian). */
export const PATTERN_LABELS: Record<WarningPattern, string> = {
  threshold_breach:    'Deviasi Melampaui Batas',
  spike:               'Lonjakan Mendadak',
  gradual_inflation:   'Kenaikan Bertahap',
  cliff_drop:          'Penurunan Tajam',
  sustained_overspend: 'Overspend Berkelanjutan',
};

/** Pattern icon (emoji). */
export const PATTERN_ICONS: Record<WarningPattern, string> = {
  threshold_breach:    '⚠️',
  spike:               '📈',
  gradual_inflation:   '📊',
  cliff_drop:          '📉',
  sustained_overspend: '🔥',
};

/** Severity display config. */
export const SEVERITY_CONFIG: Record<WarningSeverity, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  icon: string;
}> = {
  critical: {
    label: 'Kritis',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
    icon: '🔴',
  },
  warning: {
    label: 'Peringatan',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
    icon: '🟡',
  },
  info: {
    label: 'Informasi',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    dotClass: 'bg-sky-500',
    icon: '🔵',
  },
};

/** Health status display config. */
export const HEALTH_CONFIG: Record<EarlyWarningResult['overallHealth'], {
  label: string;
  bgClass: string;
  textClass: string;
  icon: string;
}> = {
  healthy: {
    label: 'Sehat',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    icon: '✅',
  },
  watch: {
    label: 'Pantau',
    bgClass: 'bg-sky-100',
    textClass: 'text-sky-800',
    icon: '👁️',
  },
  at_risk: {
    label: 'Berisiko',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    icon: '⚡',
  },
  critical: {
    label: 'Kritis',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    icon: '🚨',
  },
};

/** Format month range for display. */
export function formatMonthRange(months: number[]): string {
  if (months.length === 0) return '';
  if (months.length === 1) return `Bulan ${months[0]}`;
  return `Bulan ${months[0]}–${months[months.length - 1]}`;
}
