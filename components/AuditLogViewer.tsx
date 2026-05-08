// ============================================================================
// SIKESUMA v3.1 · S3.2.3 · AuditLogViewer
// ============================================================================
// Riwayat Aktivitas — UI untuk inspect audit_log table.
//
// Features:
//   - Filter by entity (23 options) + action (10 options) + date range
//   - Pagination 100 entries per page (DB-side via supabase.range)
//   - Table dengan color-coded action badges
//   - Detail modal: pretty-print JSON snapshot (Decision §S3.2-Detail Opsi A)
//   - Clear-all button dengan double-confirm (Decision §S3.2-Clear Opsi A)
//
// Data flow: directly fetches dari `audit_log` table via supabase client.
// Filter applied DB-side menggunakan JSONB `data->>field` operators.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Trash2, FileJson, ChevronLeft, ChevronRight, X,
  AlertTriangle, Inbox, CheckCircle2, Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchReasoningCategories } from '../lib/audit';
import {
  AUDIT_ENTITIES,
  AUDIT_ACTIONS,
  getAuditEntityLabel,
  getAuditActionMeta,
  getReasoningCategoryMeta,
  getCategoryBadgeClasses,
  type ReasoningCategory,
} from '../constants/audit';
import AuditEntryEditModal from './AuditEntryEditModal';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLogRow {
  id: string;
  data: {
    entity:             string;
    action:             string;
    entityId:           string;
    user:               string;
    timestamp:          string;
    description:        string;
    snapshot:           unknown;
    // [S5.3] Reasoning fields (filled via Tinjauan Audit modal)
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

const PAGE_SIZE = 100;

// Map Tailwind color name dari constants ke concrete badge classes.
// Tailwind requires literal classnames (not interpolated) for purge to work.
const ACTION_BADGE_CLASS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  blue:    'bg-blue-100 text-blue-800 border border-blue-200',
  rose:    'bg-rose-100 text-rose-800 border border-rose-200',
  amber:   'bg-amber-100 text-amber-800 border border-amber-200',
  stone:   'bg-stone-100 text-stone-700 border border-stone-200',
};

// ─── Component ──────────────────────────────────────────────────────────────

const AuditLogViewer: React.FC = () => {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // [S5.3] Filters baru — status review + reasoning category
  // Default 'unreviewed' per T5-A: drives backfill workflow
  const [statusFilter, setStatusFilter]     = useState<'all' | 'reviewed' | 'unreviewed'>('unreviewed');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // [S5.3] Summary counts (pre status filter, post other filters)
  const [reviewedCount, setReviewedCount]     = useState(0);
  const [unreviewedCount, setUnreviewedCount] = useState(0);

  // [S5.3] Categories cache — fetched once on mount
  const [categories, setCategories] = useState<ReasoningCategory[]>([]);

  // Modals
  const [detailRow, setDetailRow] = useState<AuditLogRow | null>(null);
  const [editingRow, setEditingRow] = useState<AuditLogRow | null>(null); // [S5.3]
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1 | 2>(0);
  const [isClearing, setIsClearing] = useState(false);

  // [S5.3] Load reasoning categories once on mount (with system_settings fallback)
  useEffect(() => {
    fetchReasoningCategories().then(setCategories).catch(() => {
      // Defensive: fetchReasoningCategories already has its own fallback,
      // but catch for any unexpected throws.
    });
  }, []);

  // ─── Data Fetch ───────────────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Helper untuk apply BASE filters (entity/action/date) ke query — DRY antara
      // count + data + summary chip queries.
      const applyBaseFilters = <T extends { filter: any; gte: any; lte: any }>(q: T): T => {
        let next = q as any;
        if (entityFilter !== 'all') {
          next = next.filter('data->>entity', 'eq', entityFilter);
        }
        if (actionFilter !== 'all') {
          next = next.filter('data->>action', 'eq', actionFilter);
        }
        if (dateFrom) {
          next = next.gte('created_at', dateFrom);
        }
        if (dateTo) {
          next = next.lte('created_at', `${dateTo}T23:59:59.999Z`);
        }
        return next as T;
      };

      // [S5.3] Apply status + category filters on top of base filters.
      // isReviewed stored as string 'true'/'false' (per Phase 5.1 §S5.1 design —
      // see audit-handover doc "isReviewed = string 'false' from boolean stored").
      const applyAllFilters = <T extends { filter: any; gte: any; lte: any }>(q: T): T => {
        let next = applyBaseFilters(q) as any;
        if (statusFilter === 'reviewed') {
          next = next.filter('data->>isReviewed', 'eq', 'true');
        } else if (statusFilter === 'unreviewed') {
          // Match BOTH 'false' (Phase 5.1+ entries) AND null (pre-S5.1 legacy).
          // Supabase doesn't support OR easily here — workaround: neq 'true'.
          next = next.filter('data->>isReviewed', 'neq', 'true');
        }
        if (categoryFilter !== 'all') {
          next = next.filter('data->>reasoningCategory', 'eq', categoryFilter);
        }
        return next as T;
      };

      // [S5.3] §1. Summary chip counts (using BASE filters, regardless of status filter).
      // These power the clickable chips above the filter bar.
      const reviewedQ = supabase.from('audit_log').select('id', { count: 'exact', head: true })
        .filter('data->>isReviewed', 'eq', 'true');
      const { count: revCount, error: revErr } = await applyBaseFilters(reviewedQ as any);
      if (revErr) throw revErr;
      setReviewedCount(revCount ?? 0);

      const unreviewedQ = supabase.from('audit_log').select('id', { count: 'exact', head: true })
        .filter('data->>isReviewed', 'neq', 'true');
      const { count: unrevCount, error: unrevErr } = await applyBaseFilters(unreviewedQ as any);
      if (unrevErr) throw unrevErr;
      setUnreviewedCount(unrevCount ?? 0);

      // §2. Total count query (with status + category filter for current view)
      const countQ = supabase.from('audit_log').select('id', { count: 'exact', head: true });
      const { count, error: countErr } = await applyAllFilters(countQ as any);
      if (countErr) throw countErr;
      setTotalCount(count ?? 0);

      // §3. Data query (paginated, all filters)
      const dataQ = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
      const filtered = applyAllFilters(dataQ as any);
      const paged = filtered.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, error: dataErr } = await paged;
      if (dataErr) throw dataErr;

      setRows((data ?? []) as AuditLogRow[]);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat audit log');
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [entityFilter, actionFilter, dateFrom, dateTo, statusFilter, categoryFilter, page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset to page 0 when filter changes (avoid out-of-range page)
  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter, actionFilter, dateFrom, dateTo, statusFilter, categoryFilter]);

  // ─── Clear All Handler (double-confirm) ───────────────────────────────────

  const handleClearAll = async () => {
    setIsClearing(true);
    setError(null);
    try {
      // Supabase delete requires a filter; use neq on a never-matching id
      const { error: delErr } = await supabase
        .from('audit_log')
        .delete()
        .neq('id', '__nonexistent_sentinel__');
      if (delErr) throw delErr;
      setRows([]);
      setTotalCount(0);
      setClearConfirmStep(0);
      // Re-load to confirm empty
      await loadEntries();
    } catch (err: any) {
      setError(`Clear gagal: ${err?.message || 'unknown'}`);
    } finally {
      setIsClearing(false);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const displayStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const displayEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* [S5.3] Summary chips — clickable filter shortcuts (T5-A: default unreviewed) */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('unreviewed')}
          className={`px-3 py-1.5 rounded-full text-sm border transition flex items-center gap-1.5 ${
            statusFilter === 'unreviewed'
              ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-sm'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Clock size={14} />
          {unreviewedCount} Belum Direview
        </button>
        <button
          onClick={() => setStatusFilter('reviewed')}
          className={`px-3 py-1.5 rounded-full text-sm border transition flex items-center gap-1.5 ${
            statusFilter === 'reviewed'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold shadow-sm'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 size={14} />
          {reviewedCount} Direview
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          📊 Semua ({reviewedCount + unreviewedCount})
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Entitas</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[160px] focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="all">Semua Entitas</option>
            {AUDIT_ENTITIES.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Aksi</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[140px] focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="all">Semua Aksi</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* [S5.3] Status filter (also accessible via chips above) */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Status Tinjauan</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'reviewed' | 'unreviewed')}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[140px] focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="all">Semua</option>
            <option value="unreviewed">Belum Direview</option>
            <option value="reviewed">Sudah Direview</option>
          </select>
        </div>

        {/* [S5.3] Reasoning category filter */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Kategori Alasan</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm min-w-[160px] focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => loadEntries()}
          disabled={isLoading}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>

        <button
          onClick={() => setClearConfirmStep(1)}
          disabled={isLoading || isClearing || totalCount === 0}
          className="bg-red-50 text-red-700 border border-red-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 size={16} />
          Bersihkan Semua
        </button>

        <div className="ml-auto flex flex-col text-xs text-slate-500 self-center">
          <span>Total: <strong className="text-slate-900">{totalCount}</strong> entri</span>
          {totalCount > 0 && (
            <span>Tampil: {displayStart}–{displayEnd}</span>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600 tracking-wide">
            <tr>
              <th className="p-3 text-left whitespace-nowrap w-32">Status</th>
              <th className="p-3 text-left whitespace-nowrap">Waktu</th>
              <th className="p-3 text-left">Entitas</th>
              <th className="p-3 text-left">Aksi</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="p-3 text-center">Detail</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm">Memuat...</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={32} className="text-slate-300" />
                    <span className="text-sm font-semibold">Tidak ada entri</span>
                    <span className="text-xs">
                      {entityFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo || statusFilter !== 'all' || categoryFilter !== 'all'
                        ? 'Coba ubah filter atau reset.'
                        : 'Belum ada aktivitas tercatat.'}
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.map((row) => {
              const meta = getAuditActionMeta(row.data.action);
              const badgeClass = ACTION_BADGE_CLASS[meta.color] || ACTION_BADGE_CLASS.stone;
              const date = new Date(row.data.timestamp);
              const dateStr = date.toLocaleString('id-ID', {
                year: '2-digit', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              });
              // [S5.3] Reasoning rendering helpers
              const isReviewed = row.data.isReviewed === true;
              const catMeta = getReasoningCategoryMeta(row.data.reasoningCategory, categories);
              return (
                <tr
                  key={row.id}
                  className={`border-t border-slate-100 cursor-pointer transition ${
                    isReviewed ? 'hover:bg-emerald-50/50' : 'hover:bg-amber-50/50'
                  }`}
                  onClick={() => setEditingRow(row)}
                  title="Klik untuk tinjau / edit reasoning"
                >
                  {/* [S5.3] Status indicator column */}
                  <td className="p-3 whitespace-nowrap">
                    {isReviewed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                        Direview
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200" />
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-slate-700 whitespace-nowrap font-mono">{dateStr}</td>
                  <td className="p-3 text-sm">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {getAuditEntityLabel(row.data.entity)}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-700">
                    <div>{row.data.description}</div>
                    {/* [S5.3] Inline reasoning preview when reviewed */}
                    {isReviewed && catMeta && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getCategoryBadgeClasses(catMeta.color)}`}>
                          🏷️ {catMeta.label}
                        </span>
                        {row.data.dynamicsFactor && (
                          <span className="text-[11px] text-slate-500 italic truncate max-w-[200px]" title={row.data.dynamicsFactor}>
                            "{row.data.dynamicsFactor}"
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDetailRow(row)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition group"
                      title="Lihat raw JSON"
                    >
                      <FileJson size={16} className="text-slate-500 group-hover:text-slate-900" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Halaman <strong className="text-slate-900">{page + 1}</strong> dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 transition"
              title="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-100 transition"
              title="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal — Decision §S3.2-Detail Opsi A: pretty-print JSON */}
      {detailRow && (
        <div
          className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailRow(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Detail Entri Audit</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{detailRow.id}</p>
              </div>
              <button
                onClick={() => setDetailRow(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition"
                title="Tutup"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words">
{JSON.stringify(detailRow.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Clear-all confirmation modal — double-confirm flow */}
      {clearConfirmStep > 0 && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle size={24} className="text-red-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-700 mb-1">
                  Konfirmasi Bersihkan Semua
                </h3>
                <p className="text-xs text-slate-500">
                  Langkah {clearConfirmStep} dari 2
                </p>
              </div>
            </div>

            {clearConfirmStep === 1 && (
              <>
                <p className="text-sm text-slate-700 mb-2">
                  Anda akan menghapus <strong>{totalCount} entri audit log</strong> secara permanen.
                </p>
                <p className="text-sm text-slate-600 mb-5">
                  Aksi ini <strong className="text-red-700">TIDAK dapat di-undo</strong>.
                  Audit history akan hilang dari database.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setClearConfirmStep(0)}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => setClearConfirmStep(2)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition"
                  >
                    Lanjut →
                  </button>
                </div>
              </>
            )}

            {clearConfirmStep === 2 && (
              <>
                <p className="text-sm text-slate-700 mb-2">
                  Konfirmasi <strong>terakhir</strong>. Klik tombol merah untuk menghapus.
                </p>
                <p className="text-sm text-slate-600 mb-5">
                  Yakin ingin lanjut?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setClearConfirmStep(0)}
                    disabled={isClearing}
                    className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold transition disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={isClearing}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isClearing && <RefreshCw size={14} className="animate-spin" />}
                    {isClearing ? 'Menghapus...' : 'Hapus Semua'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* [S5.3] Tinjauan modal — open dari row click */}
      {editingRow && (
        <AuditEntryEditModal
          row={editingRow}
          categories={categories}
          onClose={() => setEditingRow(null)}
          onSaved={() => loadEntries()}
        />
      )}
    </div>
  );
};

export default AuditLogViewer;
