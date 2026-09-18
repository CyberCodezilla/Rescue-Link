'use client';

import React, { useMemo } from 'react';
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
    <>
      <div className="hidden overflow-hidden hud-panel-topcut md:block">
        <div className="px-3 py-1.5 bg-surface-2/80 border-b border-line flex items-center justify-between text-[10px] font-mono text-ink-500 uppercase">
          <span>ACTIVE SIGNALS: {visible.length}</span>
          <span>KEYBOARD: [J/K] NAVIGATE | [SPACE] LOCK</span>
        </div>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-3/50 text-[11px] font-mono text-ink-500 uppercase">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Hazard</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Logged</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Dispatch</th>
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

      <div className="space-y-2 md:hidden">
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
    </>
  );
}
