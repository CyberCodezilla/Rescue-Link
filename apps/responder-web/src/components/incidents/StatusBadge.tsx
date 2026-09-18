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
    shadow: string;
    icon: React.ReactNode;
  }
> = {
  new: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/40',
    shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.25)]',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa] shrink-0" />,
  },
  acknowledged: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    shadow: 'shadow-[0_0_8px_rgba(168,85,247,0.25)]',
    icon: <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc] shrink-0" />,
  },
  in_progress: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    icon: <Play size={9} className="shrink-0 fill-amber-400 text-amber-400" />,
  },
  resolved: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    icon: <Check size={10} className="shrink-0 text-emerald-400 stroke-[3]" />,
  },
  closed: {
    bg: 'bg-slate-800/70',
    text: 'text-slate-400',
    border: 'border-slate-700/50',
    shadow: '',
    icon: <Minus size={10} className="shrink-0 text-slate-400 stroke-[3]" />,
  },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.closed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide transition-all duration-150 ${config.bg} ${config.text} ${config.border} ${config.shadow}`}
    >
      {config.icon}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}
