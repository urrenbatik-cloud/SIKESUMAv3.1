
import React, { useState } from 'react';
import { Calendar, Filter, ChevronDown, Check, Clock, CalendarDays, BarChart3 } from 'lucide-react';
import { YEARS } from '../constants';

export type FilterMode = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'RANGE';

export interface LocalFilterState {
  mode: FilterMode;
  day: string; // YYYY-MM-DD
  month: number;
  year: number | 'ALL';
  startDate: string;
  endDate: string;
}

interface LocalFilterBarProps {
  onFilterChange: (filter: LocalFilterState) => void;
  initialYear?: number | 'ALL';
}

const LocalFilterBar: React.FC<LocalFilterBarProps> = ({ onFilterChange, initialYear = 2025 }) => {
  const [filter, setFilter] = useState<LocalFilterState>({
    mode: 'MONTHLY',
    day: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: initialYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const modes: { id: FilterMode; label: string; icon: any }[] = [
    { id: 'DAILY', label: 'Harian', icon: <Clock size={14} /> },
    { id: 'MONTHLY', label: 'Bulanan', icon: <CalendarDays size={14} /> },
    { id: 'YEARLY', label: 'Tahunan', icon: <BarChart3 size={14} /> },
    { id: 'RANGE', label: 'Rentang', icon: <Filter size={14} /> },
  ];

  const handleUpdate = (newFields: Partial<LocalFilterState>) => {
    const updated = { ...filter, ...newFields };
    setFilter(updated);
    onFilterChange(updated);
  };

  return (
    <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-lg flex flex-wrap items-center gap-6 no-print">
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => handleUpdate({ mode: m.id })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              filter.mode === m.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-slate-200"></div>

      <div className="flex items-center gap-4 animate-in fade-in duration-300">
        {filter.mode === 'DAILY' && (
          <input 
            type="date" 
            value={filter.day}
            onChange={e => handleUpdate({ day: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50"
          />
        )}

        {filter.mode === 'MONTHLY' && (
          <div className="flex gap-2">
            <select 
              value={filter.month} 
              onChange={e => handleUpdate({ month: Number(e.target.value) })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
            >
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select 
              value={filter.year} 
              onChange={e => handleUpdate({ year: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
            >
              <option value="ALL">Semua Tahun</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {filter.mode === 'YEARLY' && (
          <select 
            value={filter.year} 
            onChange={e => handleUpdate({ year: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) })}
            className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-2 text-xs font-bold outline-none"
          >
            <option value="ALL">Semua Tahun</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {filter.mode === 'RANGE' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={filter.startDate}
              onChange={e => handleUpdate({ startDate: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
            />
            <span className="text-slate-300 font-bold">s/d</span>
            <input 
              type="date" 
              value={filter.endDate}
              onChange={e => handleUpdate({ endDate: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
            />
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
         <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Audit Lokalnya Aktif</span>
      </div>
    </div>
  );
};

export default LocalFilterBar;
