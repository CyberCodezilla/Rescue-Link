import React from 'react';
import type { IncidentResponse, Priority } from '@responder/lib/schema';
import { CATEGORY_LABELS, getCategory } from '@responder/lib/schema';
import { formatLocation, formatTimestamp, hasAssignedUnits } from '@responder/lib/format';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface IncidentRowProps {
  incident: IncidentResponse;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PRIORITY_STRIPES: Record<Priority, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
  pending_triage: 'border-l-slate-500',
};

export function IncidentTableRow({ incident, isSelected, onSelect }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const stripe = PRIORITY_STRIPES[incident.priority] || PRIORITY_STRIPES.pending_triage;

  return (
    <tr
      onClick={() => onSelect(incident.id)}
      aria-selected={isSelected}
      className={`cursor-pointer border-b border-line/60 last:border-0 border-l-4 ${stripe} transition-colors duration-150 ${
        isSelected ? 'bg-action/15 ring-1 ring-action/40' : 'hover:bg-surface-2/60 bg-surface/40'
      }`}
    >
      <td className="px-3 py-2.5 font-mono text-xs font-semibold text-action">{incident.id}</td>
      <td className="px-3 py-2.5 text-xs font-medium text-ink-900">{CATEGORY_LABELS[getCategory(incident)]}</td>
      <td className="px-3 py-2.5">
        <PriorityBadge priority={incident.priority} />
      </td>
      <td className="px-3 py-2.5 text-xs font-mono text-ink-700">{formatLocation(incident.location)}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-ink-500">{formatTimestamp(incident.createdAt)}</td>
      <td className="px-3 py-2.5">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-3 py-2.5 text-xs text-ink-700">
        {hasAssignedUnits(units) ? (
          <span className="font-mono font-semibold text-emerald-400">{units!.join(', ')}</span>
        ) : (
          <span className="text-ink-500 font-mono text-[11px]">UNASSIGNED</span>
        )}
      </td>
    </tr>
  );
}

export function IncidentCard({ incident, isSelected, onSelect }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const stripe = PRIORITY_STRIPES[incident.priority] || PRIORITY_STRIPES.pending_triage;

  return (
    <button
      type="button"
      onClick={() => onSelect(incident.id)}
      aria-pressed={isSelected}
      className={`flex w-full flex-col gap-2 rounded-md border border-line border-l-4 ${stripe} px-3.5 py-3 text-left transition-all ${
        isSelected ? 'border-action bg-action/15 ring-1 ring-action/50' : 'bg-surface hover:bg-surface-2'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-action">{incident.id}</span>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-sm font-semibold text-ink-900">{CATEGORY_LABELS[getCategory(incident)]}</p>
      <p className="font-mono text-xs text-ink-700">{formatLocation(incident.location)}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <StatusBadge status={incident.status} />
        <span className="font-mono text-xs text-ink-500">
          {hasAssignedUnits(units) ? units!.join(', ') : 'Unassigned'}
        </span>
      </div>
      <span className="font-mono text-[10px] text-ink-500">{formatTimestamp(incident.createdAt)}</span>
    </button>
  );
}
