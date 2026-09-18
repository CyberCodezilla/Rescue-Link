'use client';

import React from 'react';
import { Activity, Radio, RefreshCw, ShieldAlert } from 'lucide-react';
import type { StreamStatus } from '@/hooks/useIncidentStream';

interface DashboardHeaderProps {
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  streamStatus?: StreamStatus;
}

const STREAM_LABEL: Record<StreamStatus, string> = {
  connecting: 'Connecting…',
  live: 'Live Stream Active',
  unavailable: 'Polling Mode (15s)',
};

const STREAM_COLOR: Record<StreamStatus, { dot: string; text: string; ring: string }> = {
  connecting: {
    dot: 'bg-priority-pending',
    text: 'text-ink-500',
    ring: 'border-priority-pending/30',
  },
  live: {
    dot: 'bg-success',
    text: 'text-success',
    ring: 'border-success/40',
  },
  unavailable: {
    dot: 'bg-priority-pending',
    text: 'text-ink-500',
    ring: 'border-line',
  },
};

export function DashboardHeader({
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
  streamStatus,
}: DashboardHeaderProps) {
  const currentStream = streamStatus ? STREAM_COLOR[streamStatus] : null;

  return (
    <header className="glass relative z-20 flex flex-col gap-3 border-b border-line bg-surface/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-action via-blue-600 to-indigo-700 shadow-lg shadow-action/25 ring-1 ring-white/20">
          <ShieldAlert className="h-5 w-5 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
              RescueLink
            </h1>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-action uppercase">
              Command Center
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CAD Online
            </span>
            {streamStatus && currentStream ? (
              <>
                <span className="text-line-2">|</span>
                <span className={`flex items-center gap-1.5 ${currentStream.text}`}>
                  <Radio className="h-3 w-3 animate-pulse" />
                  {STREAM_LABEL[streamStatus]}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Real-time sync vitals & Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 font-mono text-xs text-ink-500 md:flex md:items-center md:gap-2">
          <Activity className="h-3.5 w-3.5 text-action animate-pulse" />
          <span>Last Sync:</span>
          <span className="font-semibold text-ink-700" aria-live="polite">
            {lastRefreshedAt
              ? lastRefreshedAt.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'Syncing...'}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="group relative flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3.5 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition-all duration-150 hover:border-line-2 hover:bg-surface-3 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-ink-500 transition-transform duration-500 group-hover:text-action ${
              isRefreshing ? 'animate-spin text-action' : ''
            }`}
          />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh CAD'}</span>
        </button>
      </div>
    </header>
  );
}
