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
    shadow: string;
    icon: React.ReactNode;
  }
> = {
  critical: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/40',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.25)]',
    icon: <AlertTriangle size={11} className="shrink-0 text-red-400" />,
  },
  high: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/40',
    shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.25)]',
    icon: <ChevronUp size={12} className="shrink-0 text-orange-400 stroke-[3]" />,
  },
  medium: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    icon: <Diamond size={10} className="shrink-0 text-amber-400 fill-amber-400" />,
  },
  low: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    icon: <ChevronDown size={12} className="shrink-0 text-emerald-400 stroke-[3]" />,
  },
  pending_triage: {
    bg: 'bg-slate-800/70',
    text: 'text-slate-300',
    border: 'border-slate-600/40',
    shadow: '',
    icon: <Circle size={9} className="shrink-0 text-slate-400" />,
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.pending_triage;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-150 hover:scale-[1.02] ${config.bg} ${config.text} ${config.border} ${config.shadow}`}
    >
      {config.icon}
      <span>{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}
