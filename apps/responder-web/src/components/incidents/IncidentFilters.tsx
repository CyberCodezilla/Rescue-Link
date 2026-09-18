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
  'rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-900 focus:border-action focus:outline-none focus:ring-1 focus:ring-action transition-colors cursor-pointer';

export function IncidentFilters({ filters, onChange }: IncidentFiltersProps) {
  const isFiltered =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.category !== DEFAULT_FILTERS.category;

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 bg-surface/50 border border-line rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-ink-500 uppercase tracking-wider mr-1">
        <Filter size={14} className="text-action" />
        <span>FILTERS:</span>
      </div>

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500">
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

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500">
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

      <label className="flex flex-col gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500">
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
          className="flex items-center gap-1 rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-ink-700 hover:text-ink-900 hover:bg-surface-3 transition-colors"
        >
          <X size={12} />
          CLEAR
        </button>
      ) : null}
    </div>
  );
}
