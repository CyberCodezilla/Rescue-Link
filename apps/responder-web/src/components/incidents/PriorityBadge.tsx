import React from 'react';
import { AlertTriangle, ChevronUp, Diamond, ChevronDown, Circle } from 'lucide-react';
import type { Priority } from '@responder/lib/schema';
import { PRIORITY_LABELS } from '@responder/lib/schema';

const PRIORITY_CONFIG: Record<
  Priority,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  critical: {
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    border: 'border-red-500/60',
    icon: <AlertTriangle size={12} className="shrink-0 text-red-400" />,
  },
  high: {
    bg: 'bg-orange-950/60',
    text: 'text-orange-400',
    border: 'border-orange-500/60',
    icon: <ChevronUp size={13} className="shrink-0 text-orange-400 stroke-[3]" />,
  },
  medium: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-500/60',
    icon: <Diamond size={11} className="shrink-0 text-amber-400 fill-amber-400" />,
  },
  low: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-500/60',
    icon: <ChevronDown size={13} className="shrink-0 text-emerald-400 stroke-[3]" />,
  },
  pending_triage: {
    bg: 'bg-slate-900/60',
    text: 'text-slate-400',
    border: 'border-slate-600/60',
    icon: <Circle size={10} className="shrink-0 text-slate-400" />,
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.pending_triage;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider uppercase ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}
