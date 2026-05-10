// ============================================================================
// SIKESUMA v3.1 · KodeAutocomplete — Sprint B.6
// ============================================================================
// File         : components/KodeAutocomplete.tsx
// Phase        : Sprint B.6 — Autocomplete input untuk kode akun
// Date         : 10 Mei 2026
// Purpose      : Reusable autocomplete input untuk input kode akun.
//                Digunakan di Pagu (BAS dictionary), RAB (Pagu kode list),
//                dan Bill (Pagu kode list).
//
// Modes:
//   'bas'  → suggestions dari utils/basDictionary (KEP-331/2021 + KEP-291/2022)
//   'pagu' → suggestions dari array PaguRow yang di-pass via prop (untuk RAB/Bill)
//
// UX:
//   - User typing → filter suggestions (prefix kode atau partial uraian)
//   - Click/Enter pada suggestion → fill kode + onSelect callback (boleh
//     auto-fill description di parent component)
//   - Visual marker: check ✓ jika kode valid; warning ⚠ jika invalid (kosong = OK)
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, AlertCircle, Sparkles } from 'lucide-react';
import {
  searchBas,
  isValidBasKode,
  isActiveBasKode,
  type BasEntry,
  type BasKategori,
} from '../utils/basDictionary';
import {
  findRecommendations,
  type InternalRecommendation,
} from '../utils/internalRecommendations';

// Generic suggestion type — covers both BAS entries dan Pagu kode list
export interface KodeSuggestion {
  kode:        string;
  uraian:      string;
  meta?:       string; // mis. "BELANJA" or "Pagu 2025 Bekkes"
  isInactive?: boolean; // true untuk BAS yang dinonaktifkan
  /** [HITL] Bila suggestion datang dari internal recommendation, ada justifikasi Angga */
  recommendation?: {
    id: string;
    justification: string;
    source: string;
  };
}

export interface KodeAutocompleteProps {
  /** Current value */
  value: string;
  /** Called on every input change (free-text typing) */
  onChange: (newValue: string) => void;
  /** Called when user picks a suggestion. Parent can auto-fill description, etc. */
  onSelect?: (suggestion: KodeSuggestion) => void;
  /** Source mode */
  mode: 'bas' | 'pagu';
  /** When mode='pagu', list of available kode + uraian (mis. PaguRow leaf nodes) */
  paguOptions?: KodeSuggestion[];
  /** When mode='bas', filter by kategori (mis. ['BELANJA'] untuk Pagu Belanja-only) */
  basKategori?: BasKategori | BasKategori[];
  /** [HITL] Description text untuk match internal recommendations (Angga's klarifikasi).
   *  Optional — kalau di-pass, recommendations dengan justifikasi muncul di top dropdown
   *  dengan badge khusus. Tidak depend mode (bisa untuk 'bas' maupun 'pagu'). */
  description?: string;
  /** Show validation state (✓/⚠ icon) */
  showValidation?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** className passthrough untuk styling parent */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const KodeAutocomplete: React.FC<KodeAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  mode,
  paguOptions = [],
  basKategori,
  description = '',
  showValidation = true,
  placeholder = 'mis. 521115.01',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // [HITL] Internal recommendations berdasarkan description (Angga's klarifikasi).
  // Dimunculkan di top dropdown saat description matches pattern, sebelum BAS results.
  const hitlRecommendations = useMemo<KodeSuggestion[]>(() => {
    if (!description) return [];
    const recs = findRecommendations(description, value);
    return recs.map((r) => {
      // Lookup BAS entry untuk uraian resmi
      const result = searchBas(r.recommended_kode_bas, { activeOnly: false, limit: 1 });
      const basEntry = result.find(e => e.kode === r.recommended_kode_bas);
      return {
        kode: r.recommended_kode_bas,
        uraian: basEntry?.uraian || `Kode ${r.recommended_kode_bas}`,
        meta: '⭐ REKOMENDASI ANGGA',
        recommendation: {
          id: r.id,
          justification: r.justification,
          source: r.source,
        },
      };
    });
  }, [description, value]);

  // Compute suggestions based on mode (with HITL recs prepended)
  const suggestions = useMemo<KodeSuggestion[]>(() => {
    const q = value.trim();
    // Always show HITL recs first if any (even when input empty, as long as description matches)
    let baseSuggestions: KodeSuggestion[] = [];
    if (q || hitlRecommendations.length === 0) {
      if (mode === 'bas') {
        baseSuggestions = searchBas(q, { kategori: basKategori, activeOnly: false, limit: 10 }).map(
          (e: BasEntry) => ({
            kode: e.kode,
            uraian: e.uraian,
            meta: e.kategori + (e.active ? '' : ' • NONAKTIF'),
            isInactive: !e.active,
          })
        );
      } else {
        const ql = q.toLowerCase();
        baseSuggestions = paguOptions
          .filter(o => o.kode.startsWith(q) || o.uraian.toLowerCase().includes(ql))
          .slice(0, 10);
      }
    }

    // Dedupe: kalau HITL rec kode sudah muncul di base, skip dari base
    const hitlKodes = new Set(hitlRecommendations.map(r => r.kode));
    const filteredBase = baseSuggestions.filter(s => !hitlKodes.has(s.kode));
    return [...hitlRecommendations, ...filteredBase].slice(0, 12);
  }, [value, mode, basKategori, paguOptions, hitlRecommendations]);

  // Validation icon
  const validationState = useMemo(() => {
    if (!showValidation || !value.trim()) return null;
    if (mode === 'bas') {
      const stripped = value.trim().split('.')[0]; // canonical 6-digit
      if (isValidBasKode(stripped)) {
        return isActiveBasKode(stripped) ? 'ok' : 'inactive';
      }
      return 'invalid';
    }
    // mode='pagu' — check if exists in paguOptions
    return paguOptions.some(o => o.kode === value.trim()) ? 'ok' : 'invalid';
  }, [value, mode, showValidation, paguOptions]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pickSuggestion = (sug: KodeSuggestion) => {
    onChange(sug.kode);
    setIsOpen(false);
    onSelect?.(sug);
    inputRef.current?.blur();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickSuggestion(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <div className="flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setIsOpen(true); setHighlightIdx(0); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full border-none font-mono font-black text-blue-600 outline-none bg-transparent disabled:bg-slate-100"
        />
        {showValidation && validationState && (
          <span className="ml-1 flex-shrink-0">
            {validationState === 'ok' && <Check size={11} className="text-emerald-500" />}
            {validationState === 'inactive' && <AlertCircle size={11} className="text-amber-500" />}
            {validationState === 'invalid' && <AlertCircle size={11} className="text-red-500" />}
          </span>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 w-[32rem] max-w-[90vw] bg-white border border-slate-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
          {suggestions.map((sug, idx) => {
            const isHitl = !!sug.recommendation;
            return (
            <li
              key={sug.kode + (isHitl ? '-hitl' : '')}
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(sug); }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`px-3 py-2 cursor-pointer text-[11px] border-b border-slate-100 last:border-b-0 ${
                isHitl ? 'bg-amber-50/60 hover:bg-amber-100/60' :
                idx === highlightIdx ? 'bg-blue-50' : 'hover:bg-slate-50'
              } ${sug.isInactive ? 'opacity-60' : ''}`}
              title={sug.recommendation ? `Rekomendasi Angga (${sug.recommendation.id})\n\n${sug.recommendation.justification}\n\nSumber: ${sug.recommendation.source}` : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {isHitl && <Sparkles size={11} className="text-amber-600 flex-shrink-0" />}
                  <span className={`font-mono font-black ${isHitl ? 'text-amber-800' : 'text-blue-700'}`}>{sug.kode}</span>
                </span>
                {sug.meta && (
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${
                    isHitl ? 'text-amber-700' :
                    sug.isInactive ? 'text-amber-600' : 'text-slate-400'
                  }`}>{sug.meta}</span>
                )}
              </div>
              <div className="text-slate-700 mt-0.5 truncate">{sug.uraian}</div>
              {isHitl && sug.recommendation && (
                <div className="text-[9px] text-amber-700 mt-1 italic line-clamp-2">
                  💬 {sug.recommendation.justification.slice(0, 140)}{sug.recommendation.justification.length > 140 ? '…' : ''}
                </div>
              )}
            </li>
          );})}
        </ul>
      )}

      {isOpen && value.trim() && suggestions.length === 0 && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-red-200 rounded-lg shadow-lg z-50 px-3 py-2 text-[11px] text-red-600 font-bold">
          Tidak ada kode yang cocok
          {mode === 'bas' && <span className="block text-[9px] text-slate-500 font-normal mt-0.5">(BAS dictionary KEP-331/2021)</span>}
        </div>
      )}
    </div>
  );
};

export default KodeAutocomplete;
