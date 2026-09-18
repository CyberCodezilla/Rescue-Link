'use client';

import React from 'react';
import { Flame, Waves, Mountain, HelpCircle, Users } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { CATEGORY_LABELS, getCategory } from '@responder/lib/schema';
import { formatLocation, formatTimestamp, hasAssignedUnits } from '@responder/lib/format';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface IncidentRowProps {
  incident: IncidentResponse;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Waves,
  fire: Flame,
  landslide: Mountain,
  other: HelpCircle,
};

const PRIORITY_BAR_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#10B981',
  pending_triage: '#6B7280',
};

export function IncidentTableRow({ incident, isSelected, onSelect }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const category = getCategory(incident);
  const Icon = CATEGORY_ICONS[category] || HelpCircle;
  const barColor = PRIORITY_BAR_COLOR[incident.priority] || '#3B82F6';

  return (
    <tr
      onClick={() => onSelect(incident.id)}
      aria-selected={isSelected}
      className={`group cursor-pointer border-b border-line/60 transition-all duration-150 hover:bg-surface-2/80 ${
        isSelected ? 'bg-action/10 ring-1 ring-inset ring-action/40' : ''
      }`}
    >
      <td className="relative px-3 py-2.5 font-mono text-xs text-ink-500 group-hover:text-white">
        {/* Left accent bar */}
        <span
          className="absolute left-0 top-1 bottom-1 w-1 rounded-r-sm"
          style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}` }}
        />
        <span className="font-semibold">{incident.id.slice(0, 8)}</span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-ink-500 group-hover:text-action transition-colors" />
          <span>{CATEGORY_LABELS[category]}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <PriorityBadge priority={incident.priority} />
      </td>
      <td className="px-3 py-2.5 text-xs text-ink-700 max-w-[140px] truncate">
        {formatLocation(incident.location)}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs text-ink-500">
        {formatTimestamp(incident.createdAt)}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-3 py-2.5 text-xs font-mono">
        {hasAssignedUnits(units) ? (
          <span className="text-action font-semibold">{units!.join(', ')}</span>
        ) : (
          <span className="text-ink-500 italic">Unassigned</span>
        )}
      </td>
    </tr>
  );
}

export function IncidentCard({ incident, isSelected, onSelect }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const category = getCategory(incident);
  const Icon = CATEGORY_ICONS[category] || HelpCircle;
  const barColor = PRIORITY_BAR_COLOR[incident.priority] || '#3B82F6';

  return (
    <button
      type="button"
      onClick={() => onSelect(incident.id)}
      aria-pressed={isSelected}
      className={`relative flex w-full flex-col gap-2.5 overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 shadow-sm ${
        isSelected
          ? 'border-action bg-surface-2 ring-1 ring-action/50 shadow-action/10'
          : 'border-line bg-surface/70 hover:border-line-2 hover:bg-surface-2/60'
      }`}
    >
      {/* Top accent border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: barColor, boxShadow: `0 0 8px ${barColor}` }}
      />

      <div className="flex items-center justify-between gap-2 mt-0.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ink-500" />
          <span className="font-mono text-xs font-bold text-white">{incident.id.slice(0, 8)}...</span>
        </div>
        <PriorityBadge priority={incident.priority} />
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-white">{CATEGORY_LABELS[category]}</p>
        <span className="font-mono text-[11px] text-ink-500">{formatTimestamp(incident.createdAt)}</span>
      </div>

      <p className="text-xs text-ink-700 truncate">{formatLocation(incident.location)}</p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/40 text-xs">
        <StatusBadge status={incident.status} />
        <span className="font-mono text-[11px] text-ink-500">
          {hasAssignedUnits(units) ? (
            <span className="text-action font-medium">{units!.join(', ')}</span>
          ) : (
            'Unassigned'
          )}
        </span>
      </div>
    </button>
  );
}
