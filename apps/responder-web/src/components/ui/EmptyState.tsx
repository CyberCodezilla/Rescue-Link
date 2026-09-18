import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-line-2 bg-surface-2/30 px-6 py-12 text-center">
      <Inbox size={28} className="text-ink-500" />
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink-900">{title}</p>
      <p className="font-mono text-xs text-ink-500 max-w-sm">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded border border-line-2 bg-surface-2 px-3.5 py-1.5 font-mono text-xs font-semibold text-ink-700 hover:text-ink-900 hover:bg-surface-3 transition-colors"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
