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
  AlertTriangle, Inbox,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  AUDIT_ENTITIES,
  AUDIT_ACTIONS,
  getAuditEntityLabel,
  getAuditActionMeta,
} from '../constants/audit';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLogRow {
  id: string;
  data: {
    entity:      string;
    action:      string;
    entityId:    string;
    user:        string;
    timestamp:   string;
    description: string;
    snapshot:    unknown;
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

  // Modals
  const [detailRow, setDetailRow] = useState<AuditLogRow | null>(null);
  const [clearConfirmStep, setClearConfirmStep] = useState<0 | 1 | 2>(0);
  const [isClearing, setIsClearing] = useState(false);

  // ─── Data Fetch ───────────────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Helper untuk apply filters ke query (DRY antara count + data)
      const applyFilters = <T extends { filter: any; gte: any; lte: any }>(q: T): T => {
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

      // 1. Count query (DB-side aggregate)
      const countQ = supabase.from('audit_log').select('id', { count: 'exact', head: true });
      const { count, error: countErr } = await applyFilters(countQ as any);
      if (countErr) throw countErr;
      setTotalCount(count ?? 0);

      // 2. Data query (paginated)
      const dataQ = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
      const filtered = applyFilters(dataQ as any);
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
  }, [entityFilter, actionFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset to page 0 when filter changes (avoid out-of-range page)
  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter, actionFilter, dateFrom, dateTo]);

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
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm">Memuat...</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={32} className="text-slate-300" />
                    <span className="text-sm font-semibold">Tidak ada entri</span>
                    <span className="text-xs">
                      {entityFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo
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
              return (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
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
                  <td className="p-3 text-sm text-slate-700">{row.data.description}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      className="p-2 hover:bg-slate-200 rounded-lg transition group"
                      title="Lihat detail JSON"
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
    </div>
  );
};

export default AuditLogViewer;
