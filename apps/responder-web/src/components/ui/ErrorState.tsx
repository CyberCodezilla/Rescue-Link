import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="hud-panel flex flex-col items-center justify-center gap-2.5 border-danger/40 bg-danger/10 px-6 py-12 text-center hud-glow-red"
    >
      <AlertOctagon size={28} className="text-danger" />
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-red-200">
        TACTICAL TELEMETRY SYNC FAILURE
      </p>
      {message ? <p className="font-mono text-xs text-red-300 max-w-md">{message}</p> : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 flex items-center gap-1.5 rounded border border-danger/50 bg-danger/20 px-3.5 py-1.5 font-mono text-xs font-bold text-red-200 hover:bg-danger/30 hover:text-white transition-colors"
      >
        <RefreshCw size={12} />
        <span>RETRY SYNC</span>
      </button>
    </div>
  );
}
