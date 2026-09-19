import React from 'react';
import { Filter, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DEFAULT_FILTERS,
  IncidentCategoryEnum,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
} from '@responder/lib/schema';
import type { IncidentFilters as IncidentFiltersState } from '@responder/lib/schema';

interface IncidentFiltersProps {
  filters: IncidentFiltersState;
  onChange: (filters: IncidentFiltersState) => void;
}

const selectClasses =
  'rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 font-mono text-xs font-medium text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-150 cursor-pointer hover:border-slate-600 hover:bg-slate-900';

export function IncidentFilters({ filters, onChange }: IncidentFiltersProps) {
  const isFiltered =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.category !== DEFAULT_FILTERS.category;

  return (
    <div className="flex flex-wrap items-end gap-3 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
        <Filter size={14} className="text-blue-400" />
        <span>FILTERS:</span>
      </div>

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
        Status
        <select
          className={selectClasses}
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as IncidentFiltersState['status'] })}
        >
          <option value="active">Active (Default)</option>
          <option value="all">All Statuses</option>
          {STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
        Priority
        <select
          className={selectClasses}
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as IncidentFiltersState['priority'] })}
        >
          <option value="all">All Priorities</option>
          {PRIORITY_ORDER.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
        Category
        <select
          className={selectClasses}
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as IncidentFiltersState['category'] })}
        >
          <option value="all">All Categories</option>
          {IncidentCategoryEnum.options.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>

      {isFiltered ? (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 font-mono text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-all duration-150 shadow-sm active:scale-95"
        >
          <X size={12} />
          <span>CLEAR</span>
        </button>
      ) : null}
    </div>
  );
}
