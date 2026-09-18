'use client';

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
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
  'rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors focus:border-action focus:outline-none focus:ring-1 focus:ring-action hover:border-line-2';

export function IncidentFilters({ filters, onChange }: IncidentFiltersProps) {
  const isFiltered =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.category !== DEFAULT_FILTERS.category;

  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3 shadow-panel">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
        <Filter className="h-3.5 w-3.5 text-action" />
        <span>Filters</span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span>Status:</span>
          <select
            className={selectClasses}
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as IncidentFiltersState['status'] })}
          >
            <option value="active">Active (Default)</option>
            <option value="all">All Incidents</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span>Priority:</span>
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

        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span>Category:</span>
          <select
            className={selectClasses}
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as IncidentFiltersState['category'] })}
          >
            <option value="all">All Hazards</option>
            {IncidentCategoryEnum.options.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-3 px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-2 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
