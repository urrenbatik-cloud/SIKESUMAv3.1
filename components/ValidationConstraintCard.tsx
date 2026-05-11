// ============================================================================
// SIKESUMA v3.1 · ValidationConstraintCard — Phase 3b UI
// ============================================================================
// File          : components/ValidationConstraintCard.tsx
// Phase         : Tier 4a Phase 3b — UI integration
// Date          : 11 Mei 2026
//
// Renders single constraint card di dashboard Validasi Revisi POK.
// Supports 6 visual states (5 dari ConstraintStatus + 1 rendering-only
// 'todo' untuk C6-C12 placeholder). Card click → onSelect callback yang
// parent gunakan untuk show detail panel.
//
// Spec source: docs/TIER-4A-PHASE-3-UI-DESIGN.md §4 (card state spec)
// ============================================================================

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  MinusCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { ConstraintResult, ConstraintStatus } from '../utils/validators/types';
import { isTodoState, getTodoSubBranch } from '../utils/validators/runAllValidators';

// ─── Style mapping per state ────────────────────────────────────────────

type CardVisualState = ConstraintStatus | 'todo';

interface CardStyleConfig {
  borderClass: string;
  bgClass: string;
  textClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconAnimate?: string;
  label: string;
}

const STATE_STYLES: Record<CardVisualState, CardStyleConfig> = {
  pass: {
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    badgeBgClass: 'bg-emerald-100',
    badgeTextClass: 'text-emerald-700',
    icon: CheckCircle2,
    label: 'PASS',
  },
  warn: {
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    badgeBgClass: 'bg-amber-100',
    badgeTextClass: 'text-amber-700',
    icon: AlertTriangle,
    label: 'WARN',
  },
  fail: {
    borderClass: 'border-red-500',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    badgeBgClass: 'bg-red-100',
    badgeTextClass: 'text-red-700',
    icon: XCircle,
    label: 'FAIL',
  },
  pending: {
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    badgeBgClass: 'bg-blue-100',
    badgeTextClass: 'text-blue-700',
    icon: Loader2,
    iconAnimate: 'animate-spin',
    label: 'PENDING',
  },
  na: {
    borderClass: 'border-slate-300',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-500',
    badgeBgClass: 'bg-slate-200',
    badgeTextClass: 'text-slate-600',
    icon: MinusCircle,
    label: 'N/A',
  },
  todo: {
    borderClass: 'border-slate-200 border-dashed',
    bgClass: 'bg-white',
    textClass: 'text-slate-400',
    badgeBgClass: 'bg-slate-100',
    badgeTextClass: 'text-slate-400',
    icon: Clock,
    label: 'BELUM TERSEDIA',
  },
};

// ─── Card component ────────────────────────────────────────────────────

interface ValidationConstraintCardProps {
  result: ConstraintResult;
  isSelected?: boolean;
  onSelect?: () => void;
}

const ValidationConstraintCard: React.FC<ValidationConstraintCardProps> = ({
  result,
  isSelected = false,
  onSelect,
}) => {
  // Determine visual state — implemented validators use status,
  // C6-C12 detected via TODO_MARKER → 'todo' rendering
  const visualState: CardVisualState = isTodoState(result) ? 'todo' : result.status;
  const style = STATE_STYLES[visualState];
  const Icon = style.icon;
  const isTodo = visualState === 'todo';
  const subBranch = getTodoSubBranch(result);

  // Extract clean summary text (strip TODO_MARKER prefix if present)
  const summaryText = isTodo
    ? `Akan diimplementasi di Tier ${subBranch ?? '?'}`
    : (result.summary ?? '');

  // Selected card → ring outline untuk visual emphasis
  const ringClass = isSelected ? 'ring-2 ring-offset-2 ring-slate-400' : '';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isTodo}
      className={`
        ${style.borderClass} ${style.bgClass} ${ringClass}
        border-2 rounded-2xl p-4 shadow-sm transition-all
        ${isTodo ? 'cursor-not-allowed opacity-75' : 'hover:shadow-md cursor-pointer'}
        text-left w-full flex flex-col gap-2
      `.replace(/\s+/g, ' ').trim()}
      aria-label={`Constraint ${result.constraintId} status ${style.label}`}
    >
      {/* Header — badge ID + status icon */}
      <div className="flex items-center justify-between">
        <div className={`
          ${style.badgeBgClass} ${style.badgeTextClass}
          rounded-md px-2 py-0.5 font-mono font-black text-[11px]
        `.replace(/\s+/g, ' ').trim()}>
          {result.constraintId}
        </div>
        <Icon
          size={20}
          className={`${style.textClass} ${style.iconAnimate ?? ''}`.trim()}
        />
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-slate-700 leading-tight">
        {result.spec.title}
      </h3>

      {/* Pasal reference */}
      <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-tight">
        {result.spec.pasal}
      </p>

      {/* Summary line */}
      <p className={`text-xs ${style.textClass} mt-auto pt-1 line-clamp-2`}>
        {summaryText}
      </p>

      {/* Action button (hide untuk todo) */}
      {!isTodo && onSelect && (
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${style.textClass} pt-1`}>
          Lihat Detail
          <ChevronRight size={14} />
        </div>
      )}
    </button>
  );
};

export default ValidationConstraintCard;
