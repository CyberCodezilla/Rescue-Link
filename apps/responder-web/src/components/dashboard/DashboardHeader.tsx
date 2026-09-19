'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import type { StreamStatus } from '@/hooks/useIncidentStream';

interface DashboardHeaderProps {
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  streamStatus?: StreamStatus;
}

const STREAM_LABEL: Record<StreamStatus, string> = {
  connecting: 'CONNECTING...',
  live: 'LIVE RELAY',
  unavailable: 'POLLING (15s)',
};

export function DashboardHeader({ lastRefreshedAt, isRefreshing, onRefresh, streamStatus }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedTime = mounted && lastRefreshedAt
    ? `SYNCED: ${lastRefreshedAt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`
    : 'AWAITING INITIAL SYNC';

  return (
    <header className="flex flex-col gap-3 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sticky top-0 z-30 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-400/40 text-sm font-black text-white tracking-wider font-mono shadow-md">
          RL
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider uppercase font-mono text-slate-100">
              Rescue-Link // Tactical Operations Command
            </h1>
            <span className="rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 font-mono font-bold text-[10px] tracking-wider shadow-sm">
              V2.4 HUD
            </span>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 hud-pulse shadow-[0_0_6px_#34d399]" aria-hidden="true" />
            <span className="font-semibold text-slate-300 text-[11px] font-mono">STATUS: ACTIVE</span>
            {streamStatus ? (
              <>
                <span className="text-slate-600">?</span>
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 bg-slate-900 border border-slate-700/80 font-mono text-[10px] text-slate-300 font-medium">
                  <Activity size={11} className={streamStatus === 'live' ? 'text-emerald-400' : 'text-slate-400'} />
                  {STREAM_LABEL[streamStatus]}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span
          aria-live="polite"
          suppressHydrationWarning
          className="font-mono text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800 rounded-full px-3 py-1"
        >
          {formattedTime}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
        </button>
      </div>
    </header>
  );
}