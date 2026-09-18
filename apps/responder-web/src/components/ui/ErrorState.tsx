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
      className="rounded-xl border border-red-500/40 bg-red-950/20 px-6 py-12 text-center hud-glow-red flex flex-col items-center justify-center gap-2.5 backdrop-blur-md shadow-md"
    >
      <AlertOctagon size={28} className="text-red-400" />
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-red-200">
        TACTICAL TELEMETRY SYNC FAILURE
      </p>
      {message ? <p className="font-mono text-xs text-red-300 max-w-md">{message}</p> : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900/30 px-4 py-1.5 font-mono text-xs font-bold text-red-200 hover:bg-red-800/50 hover:text-white transition-all duration-150 shadow-sm active:scale-95"
      >
        <RefreshCw size={12} />
        <span>RETRY SYNC</span>
      </button>
    </div>
  );
}
