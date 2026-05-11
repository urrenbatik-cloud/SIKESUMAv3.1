/**
 * Validation Types — Tier 4 Phase 1
 *
 * File: utils/validators/types.ts
 * Created: 11 Mei 2026 (Tier 4 Phase 1, di branch feature/tier-4a-pagu-structure)
 *
 * Domain types untuk validation engine 12 hard constraints (C1-C12) Revisi POK
 * kewenangan KPA per Perdirjen Renhan Kemhan 7/2025 Pasal 22.
 *
 * Reference:
 * - Master domain: docs/REVISI-POK-PAGU-vKoreksi.md §3.3 (canonical C-spec)
 * - Design doc:    docs/TIER-4-DESIGN.md (phasing + UI plan)
 * - SSOT log:      SSOT-REFACTOR-LOG.md §0.8 (Tier 3 metadata) + future §0.9 (Tier 4)
 *
 * Phase 1 scope: Types-only, no implementation. Validators implementation
 * comes in Phase 2b (utils/validators/c1.ts..c5.ts) untuk sub-branch 4a.
 *
 * Phase 1 strategy: Sequential sub-branch per Decision N2 (4a/4b/4c). Types
 * di-define inclusive untuk semua 12 constraint sekarang untuk avoid drift
 * antar sub-branches. Validator FUNCTIONS implemented per-sub-branch sesuai
 * categorization.
 */
import type { PaguSection, PaguRow } from '../../types';

// ────────────────────────────────────────────────────────────────────────
// Constraint identifiers (canonical from vKoreksi v3 §3.3)
// ────────────────────────────────────────────────────────────────────────

/**
 * Canonical constraint IDs C1-C12. Order matches vKoreksi v3 §3.3 table.
 * Used as keys throughout validation engine + UI dashboard.
 */
export type ConstraintId =
  | 'C1'   // Total pagu satker net change = 0
  | 'C2'   // Pergeseran dalam 1 KRO/RO sama
  | 'C3'   // Pergeseran dalam 1 Kegiatan sama
  | 'C4'   // Pergeseran dalam 1 Satker sama
  | 'C5'   // Volume + satuan RO tidak berubah
  | 'C6'   // Jenis belanja tidak berubah (51/52/53/57)
  | 'C7'   // Sumber dana tidak berubah
  | 'C8'   // Memperhatikan LHR APIP (BARU Perdirjen 7/2025)
  | 'C9'   // Tidak boleh akun minus
  | 'C10'  // Sesuai SBM/SBK
  | 'C11'  // Tidak ubah Halaman III DIPA (RPD)
  | 'C12'; // Deadline 27 Desember TA berkenaan

/**
 * Mapping constraint → sub-branch (Decision N2 Owner-approved 11 Mei 2026).
 * Used untuk filter/group di UI dashboard atau test fixture splits.
 */
export type SubBranch = '4a' | '4b' | '4c';

export const CONSTRAINT_SUB_BRANCH: Record<ConstraintId, SubBranch> = {
  C1: '4a', C2: '4a', C3: '4a', C4: '4a', C5: '4a',
  C6: '4b', C7: '4b', C8: '4b', C9: '4b',
  C10: '4c', C11: '4c', C12: '4c',
};

// ────────────────────────────────────────────────────────────────────────
// Status & Severity enums
// ────────────────────────────────────────────────────────────────────────

/**
 * Per-constraint evaluation status.
 *
 * - 'pass'    : All checks passed for this constraint
 * - 'warn'    : Soft constraint violation (e.g., C10 SBM deviasi minor)
 * - 'fail'    : Hard constraint violation (BLOCKER for submission)
 * - 'pending' : Awaiting user input (e.g., C8 LHR APIP acknowledgment)
 * - 'na'      : Not applicable (e.g., C5 saat tidak ada perubahan RO)
 */
export type ConstraintStatus = 'pass' | 'warn' | 'fail' | 'pending' | 'na';

/**
 * Constraint severity classification.
 *
 * - 'blocker' : MUST pass for submission (red badge, prevents submit)
 * - 'warning' : SHOULD pass but user bisa justify deviasi (amber badge)
 * - 'info'    : Informational only (gray badge, future use)
 */
export type ConstraintSeverity = 'blocker' | 'warning' | 'info';

// ────────────────────────────────────────────────────────────────────────
// Constraint specifications catalogue (canonical metadata)
// ────────────────────────────────────────────────────────────────────────

/**
 * Per-constraint static specifications: title, source reference, severity,
 * description. Used by UI dashboard cards + violation messages.
 *
 * Source: vKoreksi v3 §3.3 (verbatim title + pasal). Description elaborates
 * algorithm hint for developer + tooltip text untuk user.
 */
export interface ConstraintSpec {
  id: ConstraintId;
  title: string;          // Short title untuk dashboard card (≤60 char)
  pasal: string;          // Source reference (Perdirjen / Lampiran / Prinsip)
  severity: ConstraintSeverity;
  subBranch: SubBranch;
  description: string;    // Algorithm hint / user tooltip (1-2 sentences)
}

export const CONSTRAINT_SPECS: Record<ConstraintId, ConstraintSpec> = {
  C1: {
    id: 'C1',
    title: 'Total Pagu Satker Net Change = 0',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1',
    severity: 'blocker',
    subBranch: '4a',
    description:
      'Total pagu satker tidak berubah — jumlah Semula seluruh leaves harus sama dengan jumlah Revisi.',
  },
  C2: {
    id: 'C2',
    title: 'Pergeseran dalam 1 KRO/RO yang Sama',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf a',
    severity: 'blocker',
    subBranch: '4a',
    description:
      'Skema 5.a: semua row yang berubah share kro_code yang sama. Skema 5.b/5.c: share ro_code yang sama.',
  },
  C3: {
    id: 'C3',
    title: 'Pergeseran dalam 1 Kegiatan yang Sama',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf a angka 1',
    severity: 'blocker',
    subBranch: '4a',
    description:
      'Semua row yang berubah share kegiatan_code. Untuk RS Batin Tikal = "6507" deterministic.',
  },
  C4: {
    id: 'C4',
    title: 'Pergeseran dalam 1 Satker yang Sama',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf a',
    severity: 'blocker',
    subBranch: '4a',
    description:
      'Semua row yang berubah belong to same satker. Untuk RS Batin Tikal = Satker 685784 Kesdam II/Sriwijaya.',
  },
  C5: {
    id: 'C5',
    title: 'Volume dan Satuan RO Tidak Berubah',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1',
    severity: 'blocker',
    subBranch: '4a',
    description:
      'Per RO: volume_ro dan satuan_ro tidak berubah antara Semula dan Revisi. Skip jika volume_ro/satuan_ro belum diisi (manual fill).',
  },
  C6: {
    id: 'C6',
    title: 'Tidak Ubah Jenis Belanja (51/52/53/57)',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1',
    severity: 'blocker',
    subBranch: '4b',
    description:
      'Per row: 2-digit pertama kode_bas (jenis belanja) tidak berubah Semula↔Revisi.',
  },
  C7: {
    id: 'C7',
    title: 'Tidak Ubah Sumber Dana',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 1',
    severity: 'blocker',
    subBranch: '4b',
    description:
      'Per row: sumber_dana_kode tidak berubah (RM/PNBP/PLN/PDN/HIBAH/SBSN).',
  },
  C8: {
    id: 'C8',
    title: 'Memperhatikan LHR APIP',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 22 huruf b angka 2 (BARU)',
    severity: 'blocker',
    subBranch: '4b',
    description:
      'User wajib explicit acknowledge sudah mempertimbangkan LHR APIP atas RKA TA berkenaan sebelum submit revisi. (v1: simple boolean per Q1 default)',
  },
  C9: {
    id: 'C9',
    title: 'Tidak Boleh Akun Minus',
    pasal: 'Prinsip umum pelaksanaan APBN',
    severity: 'blocker',
    subBranch: '4b',
    description:
      'Per row: jumlahBiayaRevisi >= 0. Sanity check untuk catch data entry typo.',
  },
  C10: {
    id: 'C10',
    title: 'Sesuai SBM/SBK',
    pasal: 'PMK Standar Biaya tahunan (eksternal)',
    severity: 'warning',
    subBranch: '4c',
    description:
      'Per row: hargaSatuanRevisi dalam tolerance SBM/SBK. (v1: flag deviasi % per Q2 default; V2 full lookup later.)',
  },
  C11: {
    id: 'C11',
    title: 'Tidak Ubah Halaman III DIPA (RPD)',
    pasal: 'Lampiran I Bagian 5 kode 5.d Perdirjen Renhan 7/2025',
    severity: 'blocker',
    subBranch: '4c',
    description:
      'Revisi POK tidak boleh mengubah RPD. Jika ya, naik ke revisi DIPA Halaman III (proses berbeda). (v1: simplified detection per Q3 default — flag affected linkedRpdId.)',
  },
  C12: {
    id: 'C12',
    title: 'Deadline 27 Desember TA Berkenaan',
    pasal: 'Perdirjen Renhan 7/2025 Pasal 24 ayat (11) huruf d',
    severity: 'blocker',
    subBranch: '4c',
    description:
      'Submission date < {TA}-12-27. Setelah deadline, revisi POK harus untuk TA berikutnya.',
  },
};

// ────────────────────────────────────────────────────────────────────────
// Violation + Result types
// ────────────────────────────────────────────────────────────────────────

/**
 * Detail satu pelanggaran constraint. Satu ConstraintResult bisa punya
 * multiple violations (mis. C9 minus pada 3 row berbeda).
 */
export interface ConstraintViolation {
  /** ID constraint yang dilanggar */
  constraintId: ConstraintId;
  /** Severity dari constraint (copy dari CONSTRAINT_SPECS untuk convenience) */
  severity: ConstraintSeverity;
  /** Row IDs yang terlibat (untuk inline indicator di Pagu Anggaran tab) */
  affectedRowIds?: string[];
  /** Section IDs yang terlibat (untuk cross-section violations spt C1) */
  affectedSectionIds?: string[];
  /** Human-readable message — ditampilkan di dashboard detail panel */
  message: string;
  /**
   * Constraint-specific detail object. Shape per-constraint:
   * - C1: { totalAwal: number; totalRevisi: number; selisih: number }
   * - C2: { groupingField: 'kro_code'|'ro_code'; groups: Record<string, string[]> }
   * - C5: { roCode: string; field: 'volume_ro'|'satuan_ro'; awal: any; revisi: any }
   * - dll. Free-form object per validator's choice.
   */
  detail?: Record<string, unknown>;
}

/**
 * Hasil evaluasi satu constraint.
 */
export interface ConstraintResult {
  /** ID constraint */
  constraintId: ConstraintId;
  /** Spec metadata (copy dari CONSTRAINT_SPECS untuk convenience) */
  spec: ConstraintSpec;
  /** Status hasil evaluasi */
  status: ConstraintStatus;
  /** List violations (kosong jika status=pass atau na) */
  violations: ConstraintViolation[];
  /** ISO timestamp evaluasi */
  evaluatedAt: string;
  /**
   * Optional summary info — e.g., "5 row violated" atau "Total Awal Rp X
   * tidak match Revisi Rp Y". Used at card-level display.
   */
  summary?: string;
}

/**
 * Aggregate hasil validation untuk semua 12 constraint.
 */
export interface ValidationResult {
  /** Tahun Anggaran yang divalidasi */
  ta: number;
  /** ISO timestamp evaluasi */
  evaluatedAt: string;
  /** Hasil per constraint, key by ConstraintId untuk easy lookup */
  results: Record<ConstraintId, ConstraintResult>;

  // ────────────────────────────────────────────────────────────
  // Aggregate stats (derived dari results untuk dashboard header)
  // ────────────────────────────────────────────────────────────
  passCount: number;
  warnCount: number;
  failCount: number;
  pendingCount: number;
  naCount: number;

  /**
   * Bisa submit revisi POK? true hanya jika:
   *   - 0 status='fail' dengan severity='blocker'
   *   - 0 status='pending'
   * Warnings dan N/A tidak block submission.
   */
  canSubmit: boolean;
}

// ────────────────────────────────────────────────────────────────────────
// Validation context (input untuk validators)
// ────────────────────────────────────────────────────────────────────────

/**
 * Konteks evaluation — sections + auxiliary data.
 * Validators receive this object untuk akses semua data needed.
 */
export interface ValidationContext {
  /** Tahun Anggaran target validation */
  ta: number;
  /** Sections data untuk TA target */
  sections: PaguSection[];
  /** Optional: cross-year sections kalau validator butuh comparison */
  allSectionsByYear?: Record<number, PaguSection[]>;
  /** Optional: rpds data untuk C11 cross-table check (Tier 4c) */
  rpdsData?: unknown[]; // shape TBD di Tier 4c
  /** Optional: LHR APIP acknowledgment untuk C8 (Tier 4b) */
  lhrApipAcknowledged?: boolean;
  /** Optional: SBM dictionary untuk C10 (Tier 4c) */
  sbmDictionary?: unknown; // shape TBD di Tier 4c
  /** Evaluation timestamp untuk C12 deadline check */
  evaluatedAt?: Date;
}

// ────────────────────────────────────────────────────────────────────────
// Validator function signature (per-constraint module export)
// ────────────────────────────────────────────────────────────────────────

/**
 * Signature untuk validator function per constraint.
 * Tier 4a Phase 2b akan implement: c1.ts, c2.ts, c3.ts, c4.ts, c5.ts.
 * Tier 4b: c6.ts, c7.ts, c8.ts, c9.ts.
 * Tier 4c: c10.ts, c11.ts, c12.ts.
 *
 * Each validator pure function — no side effects. Return ConstraintResult.
 */
export type Validator = (ctx: ValidationContext) => ConstraintResult;

// ────────────────────────────────────────────────────────────────────────
// Re-export underlying domain types for convenience
// ────────────────────────────────────────────────────────────────────────

export type { PaguSection, PaguRow };
