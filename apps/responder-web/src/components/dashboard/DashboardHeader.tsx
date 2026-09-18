'use client';

import React from 'react';
import { RefreshCw, Radio, Activity } from 'lucide-react';
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
  return (
    <header className="flex flex-col gap-3 border-b border-line bg-surface/80 backdrop-blur-md px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sticky top-0 z-30 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-action/20 border border-action/40 text-sm font-extrabold text-action tracking-wider font-mono">
          RL
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-wider uppercase font-mono text-ink-900">
              Rescue-Link // Tactical Operations Command
            </h1>
            <span className="hud-tag bg-action-soft text-action border border-action/30 text-[10px]">
              V2.4 HUD
            </span>
          </div>
          <p className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-success hud-pulse" aria-hidden="true" />
            <span className="font-semibold text-ink-700">STATUS: ACTIVE</span>
            {streamStatus ? (
              <>
                <span className="text-ink-300">•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-ink-500">
                  <Activity size={12} className={streamStatus === 'live' ? 'text-success' : 'text-ink-500'} />
                  {STREAM_LABEL[streamStatus]}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-500">
        <span aria-live="polite" className="font-mono text-[11px] text-ink-500">
          {lastRefreshedAt
            ? `SYNCED: ${lastRefreshedAt.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : 'AWAITING INITIAL SYNC'}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-ink-700 hover:bg-surface-3 hover:text-ink-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
        </button>
      </div>
    </header>
  );
}
