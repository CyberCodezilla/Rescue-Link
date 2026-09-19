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
  onHover?: (id: string | null) => void;
}

const PRIORITY_STRIPES: Record<Priority, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
  pending_triage: 'border-l-slate-500',
};

export function IncidentTableRow({ incident, isSelected, onSelect, onHover }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const stripe = PRIORITY_STRIPES[incident.priority] || PRIORITY_STRIPES.pending_triage;

  return (
    <tr
      onClick={() => onSelect(incident.id)}
      onMouseEnter={() => onHover?.(incident.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-selected={isSelected}
      className={`cursor-pointer border-b border-slate-800/60 last:border-0 border-l-4 ${stripe} transition-all duration-150 ${
        isSelected
          ? 'bg-blue-950/40 ring-1 ring-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
          : 'hover:bg-slate-800/50 bg-slate-900/30'
      }`}
    >
      <td className="px-3 py-2.5 font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">{incident.id}</td>
      <td className="px-3 py-2.5 text-xs font-medium text-slate-200 whitespace-nowrap">{CATEGORY_LABELS[getCategory(incident)]}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <PriorityBadge priority={incident.priority} />
      </td>
      <td className="px-3 py-2.5 text-xs font-mono text-slate-300 whitespace-nowrap">{formatLocation(incident.location)}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-slate-400 whitespace-nowrap">{formatTimestamp(incident.createdAt)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-300 whitespace-nowrap">
        {hasAssignedUnits(units) ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono font-bold text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm">
            {units!.join(', ')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium bg-slate-800/70 border border-slate-700/60 text-slate-400">
            UNASSIGNED
          </span>
        )}
      </td>
    </tr>
  );
}

export function IncidentCard({ incident, isSelected, onSelect, onHover }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const stripe = PRIORITY_STRIPES[incident.priority] || PRIORITY_STRIPES.pending_triage;

  return (
    <button
      type="button"
      onClick={() => onSelect(incident.id)}
      onMouseEnter={() => onHover?.(incident.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-pressed={isSelected}
      className={`flex w-full flex-col gap-2 rounded-xl border border-slate-800 border-l-4 ${stripe} px-4 py-3 text-left transition-all duration-200 ${
        isSelected
          ? 'border-blue-500/60 bg-blue-950/40 ring-1 ring-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
          : 'bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-blue-400">{incident.id}</span>
        <PriorityBadge priority={incident.priority} />
      </div>
      <p className="text-sm font-semibold text-slate-100">{CATEGORY_LABELS[getCategory(incident)]}</p>
      <p className="font-mono text-xs text-slate-400">{formatLocation(incident.location)}</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <StatusBadge status={incident.status} />
        {hasAssignedUnits(units) ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono font-bold text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            {units!.join(', ')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium bg-slate-800/70 border border-slate-700 text-slate-400">
            Unassigned
          </span>
        )}
      </div>
      <span className="font-mono text-[10px] text-slate-500">{formatTimestamp(incident.createdAt)}</span>
    </button>
  );
}
