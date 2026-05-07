// ============================================================================
// SIKESUMA v3.1 — Toast Component (F2.4)
// ============================================================================
// Minimal built-in toast system, no external dependency.
// 
// API pattern: imperative module-level functions (similar to react-hot-toast).
// 
// Usage in any component:
//   import { toast } from './Toast';
//   toast.success('✅ Sinkronisasi berhasil');
//   toast.error('Sync gagal: koneksi terputus');
//   toast.warning('Beberapa data gagal dimuat');
//   toast.info('Loading...');
// 
// In App.tsx root JSX, render <ToastContainer /> once.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// ============================================================================
// Module-level state (no React Context needed)
// ============================================================================
let _toasts: ToastItem[] = [];
let _listeners: Array<(toasts: ToastItem[]) => void> = [];

const _emit = () => _listeners.forEach(l => l([..._toasts]));

const _add = (message: string, type: ToastType, duration: number) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  _toasts = [..._toasts, { id, message, type }];
  _emit();
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    _emit();
  }, duration);
};

const _dismiss = (id: string) => {
  _toasts = _toasts.filter(t => t.id !== id);
  _emit();
};

// ============================================================================
// Public imperative API
// ============================================================================
export const toast = {
  success: (message: string, duration: number = 4000) => _add(message, 'success', duration),
  error:   (message: string, duration: number = 5000) => _add(message, 'error', duration),    // longer untuk read time
  warning: (message: string, duration: number = 4500) => _add(message, 'warning', duration),
  info:    (message: string, duration: number = 4000) => _add(message, 'info', duration),
};

// ============================================================================
// ToastContainer — render this ONCE at App root JSX
// ============================================================================
export const ToastContainer: React.FC = () => {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    _listeners.push(setList);
    return () => {
      _listeners = _listeners.filter(l => l !== setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-md no-print pointer-events-none">
      {list.map(t => (
        <ToastCard key={t.id} toast={t} onDismiss={() => _dismiss(t.id)} />
      ))}
    </div>
  );
};

// ============================================================================
// ToastCard — match v3.1 design (slate base, emerald success, rose error)
// ============================================================================
const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast: t, onDismiss }) => {
  const styles: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-emerald-500 border-emerald-600', icon: <CheckCircle2 size={18} /> },
    error:   { bg: 'bg-rose-500 border-rose-600',       icon: <AlertCircle size={18} /> },
    warning: { bg: 'bg-amber-500 border-amber-600',     icon: <AlertTriangle size={18} /> },
    info:    { bg: 'bg-slate-800 border-slate-900',     icon: <Info size={18} /> },
  };
  const s = styles[t.type];
  return (
    <div className={`${s.bg} text-white px-5 py-4 rounded-[1.5rem] shadow-2xl border-2 flex items-start gap-3 min-w-[280px] pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-300`}>
      <div className="shrink-0 mt-0.5">{s.icon}</div>
      <p className="text-xs font-bold flex-1 leading-relaxed">{t.message}</p>
      <button 
        onClick={onDismiss} 
        className="shrink-0 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ToastContainer;
