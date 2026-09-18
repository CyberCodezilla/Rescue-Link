import React from 'react';
import { Play, Check, Minus } from 'lucide-react';
import type { IncidentStatus } from '@responder/lib/schema';
import { STATUS_LABELS } from '@responder/lib/schema';

const STATUS_CONFIG: Record<
  IncidentStatus,
  {
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
  }
> = {
  new: {
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-500/50',
    icon: <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />,
  },
  acknowledged: {
    bg: 'bg-purple-950/60',
    text: 'text-purple-400',
    border: 'border-purple-500/50',
    icon: (
      <span className="h-2 w-2 rounded-full border border-purple-400 bg-purple-950 shrink-0 flex items-center justify-center">
        <span className="h-1 w-1 rounded-full bg-purple-400" />
      </span>
    ),
  },
  in_progress: {
    bg: 'bg-orange-950/60',
    text: 'text-orange-400',
    border: 'border-orange-500/50',
    icon: <Play size={10} className="shrink-0 fill-orange-400 text-orange-400" />,
  },
  resolved: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50',
    icon: <Check size={11} className="shrink-0 text-emerald-400 stroke-[3]" />,
  },
  closed: {
    bg: 'bg-slate-900/60',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
    icon: <Minus size={11} className="shrink-0 text-slate-400 stroke-[3]" />,
  },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.closed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}
