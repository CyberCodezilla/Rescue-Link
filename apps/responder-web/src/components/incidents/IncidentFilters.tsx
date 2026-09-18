'use client';

import React from 'react';
import { Filter, RotateCcw, ShieldAlert, Waves, Flame, Mountain, Layers } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DEFAULT_FILTERS,
  IncidentCategoryEnum,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
} from '@responder/lib/schema';
import type { IncidentFilters as IncidentFiltersState, IncidentResponse } from '@responder/lib/schema';
import { getCategory } from '@responder/lib/schema';

interface IncidentFiltersProps {
  filters: IncidentFiltersState;
  onChange: (filters: IncidentFiltersState) => void;
  incidents?: IncidentResponse[];
}

export function IncidentFilters({ filters, onChange, incidents = [] }: IncidentFiltersProps) {
  const isFiltered =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.category !== DEFAULT_FILTERS.category;

  // Real-time counts
  const criticalCount = incidents.filter((i) => i.priority === 'critical').length;
  const highCount = incidents.filter((i) => i.priority === 'high').length;
  const activeCount = incidents.filter((i) => ['new', 'acknowledged', 'in_progress'].includes(i.status)).length;
  const floodCount = incidents.filter((i) => getCategory(i) === 'flood').length;
  const fireCount = incidents.filter((i) => getCategory(i) === 'fire').length;
  const landslideCount = incidents.filter((i) => getCategory(i) === 'landslide').length;

  return (
    <div className="hud-panel-topcut p-3.5 shadow-panel">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="hud-tag">FILTER.MATRIX</span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Tactical Segmentation
          </span>
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-[11px] font-mono text-action hover:text-white transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET ALL</span>
          </button>
        )}
      </div>

      {/* Segmented Status/Priority Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'active', priority: 'all' })}
          className={`px-2.5 py-1 text-xs font-mono font-semibold transition-all ${
            filters.status === 'active' && filters.priority === 'all'
              ? 'bg-action text-white shadow-sm shadow-action/30 border-b-2 border-white'
              : 'bg-surface-2/60 text-ink-500 hover:bg-surface-2 hover:text-ink-700'
          }`}
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        >
          ACTIVE [{activeCount}]
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...filters, status: 'all', priority: 'all' })}
          className={`px-2.5 py-1 text-xs font-mono font-semibold transition-all ${
            filters.status === 'all' && filters.priority === 'all'
              ? 'bg-action text-white shadow-sm shadow-action/30 border-b-2 border-white'
              : 'bg-surface-2/60 text-ink-500 hover:bg-surface-2 hover:text-ink-700'
          }`}
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        >
          ALL [{incidents.length}]
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...filters, priority: filters.priority === 'critical' ? 'all' : 'critical' })}
          className={`px-2.5 py-1 text-xs font-mono font-bold transition-all flex items-center gap-1 ${
            filters.priority === 'critical'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/40 border-b-2 border-white'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>CRITICAL [{criticalCount}]</span>
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...filters, priority: filters.priority === 'high' ? 'all' : 'high' })}
          className={`px-2.5 py-1 text-xs font-mono font-bold transition-all ${
            filters.priority === 'high'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/40 border-b-2 border-white'
              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
          }`}
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        >
          HIGH [{highCount}]
        </button>
      </div>

      {/* Hazard Category Toggle Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line/40 text-[11px] font-mono">
        <span className="text-ink-500 uppercase tracking-wider text-[10px] mr-1">Hazard:</span>
        {[
          { id: 'all', label: 'ALL', count: incidents.length, icon: Layers },
          { id: 'flood', label: 'FLOOD', count: floodCount, icon: Waves, color: '#06B6D4' },
          { id: 'fire', label: 'FIRE', count: fireCount, icon: Flame, color: '#F97316' },
          { id: 'landslide', label: 'SLIDE', count: landslideCount, icon: Mountain, color: '#EAB308' },
        ].map((item) => {
          const isSelected = filters.category === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ ...filters, category: item.id as any })}
              className={`flex items-center gap-1 px-2 py-0.5 transition-all ${
                isSelected
                  ? 'bg-surface-3 text-white border-b border-action font-bold'
                  : 'bg-surface-2/40 text-ink-500 hover:text-ink-700 hover:bg-surface-2'
              }`}
            >
              <Icon className="h-3 w-3" style={item.color ? { color: item.color } : {}} />
              <span>{item.label} ({item.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
