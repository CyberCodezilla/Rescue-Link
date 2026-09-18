'use client';

import React, { useMemo, useState } from 'react';
import { Table, LayoutGrid } from 'lucide-react';
import type { IncidentFilters as IncidentFiltersState, IncidentResponse } from '@responder/lib/schema';
import { filterIncidents, sortIncidents } from '@responder/lib/sortIncidents';
import { EmptyState } from '@responder/components/ui/EmptyState';
import { IncidentTableRow, IncidentCard } from './IncidentRow';

interface IncidentListProps {
  incidents: IncidentResponse[];
  filters: IncidentFiltersState;
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  onClearFilters: () => void;
}

export function IncidentList({
  incidents,
  filters,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onClearFilters,
}: IncidentListProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const visible = useMemo(
    () => sortIncidents(filterIncidents(incidents, filters)),
    [incidents, filters]
  );

  if (incidents.length === 0) {
    return <EmptyState title="CAD Buffer Empty" description="No distress signals active in region." />;
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title="Zero Matching Signals"
        description="Active filter parameters yielded zero results."
        action={{ label: 'Reset Filter Matrix', onClick: onClearFilters }}
      />
    );
  }

  return (
    <div className="hud-panel-topcut w-full">
      {/* Sub-header with Active Signals count, hotkeys, and view switcher */}
      <div className="px-3 py-1.5 bg-surface-2/80 border-b border-line flex items-center justify-between text-[10px] font-mono text-ink-500 uppercase">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">ACTIVE SIGNALS: {visible.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden xl:inline text-ink-500">
            [J/K] NAVIGATE | [SPACE] LOCK
          </span>
          <div className="flex items-center border border-line bg-surface-3/60 p-0.5 rounded">
            <button
              type="button"
              title="Table View (Full Columns)"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-action text-white rounded-sm'
                  : 'text-ink-500 hover:text-white'
              }`}
            >
              <Table className="h-3 w-3" />
              <span className="hidden sm:inline">TABLE</span>
            </button>
            <button
              type="button"
              title="Card View (Stacked)"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-action text-white rounded-sm'
                  : 'text-ink-500 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3 w-3" />
              <span className="hidden sm:inline">CARDS</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-3/50 text-[11px] font-mono text-ink-500 uppercase">
                <th className="px-2.5 py-2 whitespace-nowrap">ID</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Hazard</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Priority</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Location</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Logged</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Status</th>
                <th className="px-2.5 py-2 whitespace-nowrap">Dispatch</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((incident) => (
                <IncidentTableRow
                  key={incident.id}
                  incident={incident}
                  isSelected={incident.id === selectedId}
                  isHovered={incident.id === hoveredId}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
          {visible.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              isSelected={incident.id === selectedId}
              isHovered={incident.id === hoveredId}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </div>
      )}
    </div>
  );
}
