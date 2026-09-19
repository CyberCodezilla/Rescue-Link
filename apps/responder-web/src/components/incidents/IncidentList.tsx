import React, { useMemo } from 'react';
import type { IncidentFilters as IncidentFiltersState, IncidentResponse } from '@responder/lib/schema';
import { filterIncidents, sortIncidents } from '@responder/lib/sortIncidents';
import { EmptyState } from '@responder/components/ui/EmptyState';
import { IncidentTableRow, IncidentCard } from './IncidentRow';

interface IncidentListProps {
  incidents: IncidentResponse[];
  filters: IncidentFiltersState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  onClearFilters: () => void;
}

export function IncidentList({ incidents, filters, selectedId, onSelect, onHover, onClearFilters }: IncidentListProps) {
  const visible = useMemo(
    () => sortIncidents(filterIncidents(incidents, filters)),
    [incidents, filters]
  );

  if (incidents.length === 0) {
    return <EmptyState title="No incidents" description="There are currently no incidents to display." />;
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No matching incidents"
        description="Try clearing or changing your filters."
        action={{ label: 'Clear filters', onClick: onClearFilters }}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border border-line bg-surface/90 backdrop-blur-sm md:block shadow-panel">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2/80 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2.5 whitespace-nowrap">ID</th>
              <th className="px-3 py-2.5 whitespace-nowrap">CATEGORY</th>
              <th className="px-3 py-2.5 whitespace-nowrap">PRIORITY</th>
              <th className="px-3 py-2.5 whitespace-nowrap">COORDINATES</th>
              <th className="px-3 py-2.5 whitespace-nowrap">LOGGED</th>
              <th className="px-3 py-2.5 whitespace-nowrap">STATUS</th>
              <th className="px-3 py-2.5 whitespace-nowrap">DEPLOYED UNITS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((incident) => (
              <IncidentTableRow
                key={incident.id}
                incident={incident}
                isSelected={incident.id === selectedId}
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
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </>
  );
}