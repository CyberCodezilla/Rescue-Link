import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center backdrop-blur-sm shadow-sm">
      <Inbox size={28} className="text-slate-500" />
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">{title}</p>
      <p className="font-mono text-xs text-slate-400 max-w-sm">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 font-mono text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-all duration-150 shadow-sm active:scale-95"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
