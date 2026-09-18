'use client';

import React from 'react';
import { Flame, Waves, Mountain, HelpCircle, Crosshair, ExternalLink } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { CATEGORY_LABELS, getCategory } from '@responder/lib/schema';
import { formatLocation, formatTimestamp, formatCompactTimestamp, hasAssignedUnits } from '@responder/lib/format';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface IncidentRowProps {
  incident: IncidentResponse;
  isSelected: boolean;
  isHovered?: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  onOpenDispatch?: (incident: IncidentResponse) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Waves,
  fire: Flame,
  landslide: Mountain,
  other: HelpCircle,
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#10B981',
  pending_triage: '#64748B',
};

export function IncidentTableRow({ incident, isSelected, isHovered, onSelect, onHover, onOpenDispatch }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const category = getCategory(incident);
  const Icon = CATEGORY_ICONS[category] || HelpCircle;
  const barColor = PRIORITY_COLOR[incident.priority] || '#3B82F6';

  return (
    <tr
      onClick={() => onSelect(incident.id)}
      onMouseEnter={() => onHover?.(incident.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-selected={isSelected}
      className={`group cursor-pointer border-b border-line/40 transition-all duration-150 ${
        isSelected
          ? 'bg-action/20 text-white font-bold'
          : isHovered
          ? 'bg-surface-2 text-white'
          : 'hover:bg-surface-2/60 text-ink-700'
      }`}
    >
      <td className="relative px-2.5 py-2 font-mono text-xs whitespace-nowrap">
        <span
          className="absolute left-0 top-1 bottom-1 w-1"
          style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}` }}
        />
        <div className="flex items-center gap-1.5 pl-1.5">
          {isHovered ? <Crosshair className="h-3 w-3 text-cyan-400 animate-spin" /> : null}
          <span className="font-semibold text-white">{incident.id.slice(0, 8)}</span>
        </div>
      </td>
      <td className="px-2.5 py-2 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
          <Icon className="h-3.5 w-3.5 text-ink-500 group-hover:text-action transition-colors shrink-0" />
          <span>{CATEGORY_LABELS[category]}</span>
        </div>
      </td>
      <td className="px-2.5 py-2 whitespace-nowrap">
        <PriorityBadge priority={incident.priority} />
      </td>
      <td
        className="px-2.5 py-2 text-xs truncate max-w-[130px] text-ink-500 group-hover:text-ink-700 whitespace-nowrap"
        title={formatLocation(incident.location)}
      >
        {formatLocation(incident.location)}
      </td>
      <td
        className="px-2.5 py-2 font-mono text-[11px] text-ink-500 whitespace-nowrap"
        title={formatTimestamp(incident.createdAt)}
      >
        {formatCompactTimestamp(incident.createdAt)}
      </td>
      <td className="px-2.5 py-2 whitespace-nowrap">
        <StatusBadge status={incident.status} />
      </td>
      <td className="px-2.5 py-2 text-xs font-mono whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasAssignedUnits(units) ? (
            <span className="text-action font-semibold">{units!.join(', ')}</span>
          ) : incident.assignedTo ? (
            <span className="text-emerald-400 font-semibold">{incident.assignedTo}</span>
          ) : (
            <span className="text-ink-500 italic">Unassigned</span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDispatch?.(incident);
            }}
            title="Open Slide-over Dispatch Dossier"
            className="inline-flex items-center gap-1 rounded border border-action/40 bg-action/10 px-1.5 py-0.5 text-[10px] font-bold text-action transition-all hover:bg-action hover:text-white"
          >
            <span>ASSIGN</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function IncidentCard({ incident, isSelected, isHovered, onSelect, onHover, onOpenDispatch }: IncidentRowProps) {
  const units = incident.triage?.assignedUnits;
  const category = getCategory(incident);
  const Icon = CATEGORY_ICONS[category] || HelpCircle;
  const barColor = PRIORITY_COLOR[incident.priority] || '#3B82F6';

  return (
    <button
      type="button"
      onClick={() => onSelect(incident.id)}
      onMouseEnter={() => onHover?.(incident.id)}
      onMouseLeave={() => onHover?.(null)}
      aria-pressed={isSelected}
      className={`relative flex w-full flex-col gap-2 p-3 text-left transition-all ${
        isSelected
          ? 'bg-surface-2 border-l-4 border-action shadow-action/20'
          : isHovered
          ? 'bg-surface-2 border-l-4 border-cyan-400'
          : 'bg-surface/80 border-l-4 border-line hover:bg-surface-2/70'
      }`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
        borderLeftColor: isSelected ? '#3B82F6' : barColor,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-ink-500" />
          <span className="font-mono text-xs font-bold text-white">{incident.id.slice(0, 8)}</span>
        </div>
        <PriorityBadge priority={incident.priority} />
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="font-bold text-white">{CATEGORY_LABELS[category]}</span>
        <span className="font-mono text-[10px] text-ink-500">{formatTimestamp(incident.createdAt)}</span>
      </div>

      <p className="text-[11px] text-ink-500 truncate">{formatLocation(incident.location)}</p>

      <div className="flex items-center justify-between pt-1.5 border-t border-line/40 text-[11px] font-mono">
        <StatusBadge status={incident.status} />
        <div className="flex items-center gap-2">
          <span className="text-ink-500 text-[10px]">
            {hasAssignedUnits(units) ? units!.join(', ') : incident.assignedTo || 'Unassigned'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDispatch?.(incident);
            }}
            title="Open Slide-over Dispatch Dossier"
            className="inline-flex items-center gap-1 rounded border border-action/40 bg-action/10 px-1.5 py-0.5 text-[10px] font-bold text-action transition-all hover:bg-action hover:text-white"
          >
            <span>ASSIGN</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </button>
  );
}
