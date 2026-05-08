// ============================================================================
// SIKESUMA v3.1 · DevLogViewer
// ============================================================================
// Display untuk constants/devLog.ts — sub-tab "Riwayat Pengembangan" di
// SettingsModule. Tujuan: predecessor (Sie Renbang asli) bisa observe
// progress development tanpa kontak langsung.
//
// Sections:
//   1. Project header — overview + stats summary
//   2. Roadmap section — collapsible "Next Development Goals"
//   3. Filter bar — type filter + search
//   4. Timeline — entries (newest first) dengan expandable detail
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, Calendar, User, Tag,
  ExternalLink, FileCode, Target, BookOpen, GitBranch,
} from 'lucide-react';
import {
  DEV_LOG_ENTRIES,
  DEV_LOG_TYPE_META,
  PROJECT_METADATA,
  ROADMAP,
  getDevLogStats,
  type DevLogEntry,
  type DevLogType,
  type RoadmapItem,
} from '../constants/devLog';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rose:    'bg-rose-100 text-rose-800 border border-rose-200',
  amber:   'bg-amber-100 text-amber-800 border border-amber-200',
  blue:    'bg-blue-100 text-blue-800 border border-blue-200',
  violet:  'bg-violet-100 text-violet-800 border border-violet-200',
  indigo:  'bg-indigo-100 text-indigo-800 border border-indigo-200',
  stone:   'bg-stone-100 text-stone-700 border border-stone-200',
  pink:    'bg-pink-100 text-pink-800 border border-pink-200',
};

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  high:     'bg-rose-100 text-rose-800 border border-rose-200',
  medium:   'bg-amber-100 text-amber-800 border border-amber-200',
  low:      'bg-slate-100 text-slate-700 border border-slate-200',
  deferred: 'bg-stone-100 text-stone-600 border border-stone-200',
};

const PRIORITY_LABEL: Record<string, string> = {
  high:     '🔴 Prioritas Tinggi',
  medium:   '🟡 Prioritas Sedang',
  low:      '⚪ Prioritas Rendah',
  deferred: '⏸️ Defer',
};

function formatDate(iso: string): string {
  // YYYY-MM-DD → "8 Mei 2026" (id-ID)
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

const DevLogViewer: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<DevLogType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showRoadmap, setShowRoadmap] = useState(true);

  // Aggregate stats — memoized, recomputed only on mount
  const stats = useMemo(() => getDevLogStats(), []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result: DevLogEntry[] = [...DEV_LOG_ENTRIES];

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.phase.toLowerCase().includes(q) ||
        e.author.toLowerCase().includes(q)
      );
    }

    // Sort by date desc (newest first)
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [typeFilter, searchQuery]);

  // Roadmap grouped by priority
  const roadmapByPriority = useMemo(() => {
    const groups: Record<string, RoadmapItem[]> = { high: [], medium: [], low: [], deferred: [] };
    for (const item of ROADMAP) {
      groups[item.priority].push(item);
    }
    return groups;
  }, []);

  // Entry expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── §1. Project Header + Stats ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-400" />
              {PROJECT_METADATA.name}
            </h2>
            <p className="text-sm text-slate-300 mt-1">{PROJECT_METADATA.description}</p>
            <div className="mt-3 flex gap-3 flex-wrap text-xs">
              <a
                href={PROJECT_METADATA.repoURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                <GitBranch size={12} />
                <span>GitHub</span>
                <ExternalLink size={10} />
              </a>
              <a
                href={PROJECT_METADATA.liveURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                <ExternalLink size={12} />
                <span>Live App</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs min-w-[200px]">
            <Stat label="Total Entri" value={String(stats.totalEntries)} />
            <Stat label="Kontributor" value={String(stats.contributorsCount)} />
            <Stat label="Update Awal" value={formatDate(stats.earliestDate)} compact />
            <Stat label="Update Akhir" value={formatDate(stats.latestDate)} compact />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">
            Phase Sekarang
          </div>
          <div className="text-sm text-emerald-300 font-semibold">
            {PROJECT_METADATA.currentPhase}
          </div>
        </div>
      </div>

      {/* ─── §2. Roadmap (Collapsible) ───────────────────────────────────── */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowRoadmap((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center gap-2">
            <Target size={18} className="text-amber-700" />
            <span className="font-bold text-amber-900">Peta Jalan Pengembangan</span>
            <span className="text-xs text-amber-700">({ROADMAP.length} target)</span>
          </div>
          {showRoadmap ? <ChevronDown size={18} className="text-amber-700" /> : <ChevronRight size={18} className="text-amber-700" />}
        </button>
        {showRoadmap && (
          <div className="px-4 pb-4 space-y-4">
            {(['high', 'medium', 'low', 'deferred'] as const).map((priority) => {
              const items = roadmapByPriority[priority];
              if (!items || items.length === 0) return null;
              return (
                <div key={priority}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {PRIORITY_LABEL[priority]} <span className="text-slate-400 font-normal">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 hover:border-amber-400 transition"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">
                                {item.id}
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">{item.goal}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_BADGE_CLASS[item.priority]}`}>
                            {item.estimate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── §3. Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Jenis</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[160px] focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="all">Semua Jenis</option>
            {Object.entries(DEV_LOG_TYPE_META).map(([id, meta]) => (
              <option key={id} value={id}>{meta.icon} {meta.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-600 mb-1">Cari</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Judul, deskripsi, phase, author..."
              className="border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-white text-sm w-full focus:ring-2 focus:ring-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 self-center">
          <strong className="text-slate-900">{filteredEntries.length}</strong> dari {DEV_LOG_ENTRIES.length} entri
        </div>
      </div>

      {/* ─── §4. Timeline ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">Tidak ada entri yang cocok dengan filter.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const meta = DEV_LOG_TYPE_META[entry.type];
            const badgeClass = TYPE_BADGE_CLASS[meta.color] || TYPE_BADGE_CLASS.stone;
            const isExpanded = expandedIds.has(entry.id);

            return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition"
              >
                {/* Card header (always visible) */}
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full text-left p-4 hover:bg-slate-50 transition flex items-start gap-3"
                >
                  <div className="text-xl mt-0.5 flex-shrink-0" aria-hidden>
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {entry.phase}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(entry.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {entry.author}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    {isExpanded
                      ? <ChevronDown size={16} className="text-slate-400" />
                      : <ChevronRight size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/50 space-y-3">
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {entry.description}
                    </div>

                    {entry.files && entry.files.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/70">
                        <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <FileCode size={12} />
                          File terkait
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.files.map((f) => (
                            <span key={f} className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.decisions && entry.decisions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/70">
                        <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <Tag size={12} />
                          Keputusan / Referensi
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.decisions.map((d) => (
                            <span key={d} className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.related && entry.related.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/70">
                        <div className="text-xs font-semibold text-slate-600 mb-1.5">
                          Entri terkait
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.related.map((rid) => {
                            const linked = DEV_LOG_ENTRIES.find((e) => e.id === rid);
                            return (
                              <button
                                key={rid}
                                onClick={() => {
                                  // Auto-expand the related entry + scroll to top
                                  setExpandedIds((prev) => new Set(prev).add(rid));
                                  setSearchQuery('');
                                  setTypeFilter('all');
                                }}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-200 transition"
                                title={linked?.title || rid}
                              >
                                → {linked?.title.slice(0, 50) || rid}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
        💡 Update log: edit <code className="font-mono bg-slate-100 px-1 rounded">constants/devLog.ts</code> di GitHub →
        commit & push → live di sini setelah Vercel auto-deploy (~1-2 menit).
      </div>
    </div>
  );
};

// ─── Stat Sub-component ────────────────────────────────────────────────────

const Stat: React.FC<{ label: string; value: string; compact?: boolean }> = ({ label, value, compact }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
    <div className={compact ? "text-xs text-white font-semibold" : "text-base text-white font-bold"}>{value}</div>
  </div>
);

export default DevLogViewer;
