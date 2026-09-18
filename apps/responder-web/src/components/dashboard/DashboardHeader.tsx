'use client';

import React from 'react';
import { Activity, Radio, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';
import type { StreamStatus } from '@/hooks/useIncidentStream';

interface DashboardHeaderProps {
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  streamStatus?: StreamStatus;
}

const STREAM_LABEL: Record<StreamStatus, string> = {
  connecting: 'SYNCHRONIZING...',
  live: 'CAD STREAM LIVE',
  unavailable: 'STANDBY POLLING (15s)',
};

export function DashboardHeader({
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
  streamStatus,
}: DashboardHeaderProps) {
  return (
    <header className="relative z-20 border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Mission Status */}
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-9 w-9 items-center justify-center bg-gradient-to-br from-action via-blue-700 to-indigo-900 border border-action/50 shadow-md shadow-action/30"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
          >
            <ShieldAlert className="h-4 w-4 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white sm:text-base font-mono">
                RESCUELINK // TACTICAL DISPATCH
              </h1>
              <span className="hud-tag hidden sm:inline">STATION: CAD-01</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-ink-500">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM OPERATIONAL
              </span>
              <span className="text-line-2">|</span>
              <span className="text-action flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                {streamStatus ? STREAM_LABEL[streamStatus] : 'STREAM ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time sync vitals & Actions */}
        <div className="flex items-center gap-3 font-mono">
          <div className="hidden border border-line bg-surface-2/60 px-3 py-1 text-xs text-ink-500 md:flex md:items-center md:gap-2">
            <Activity className="h-3.5 w-3.5 text-action animate-pulse" />
            <span>LAST SYNC:</span>
            <span className="font-bold text-white" aria-live="polite">
              {lastRefreshedAt
                ? lastRefreshedAt.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'SYNCHRONIZING...'}
            </span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-700 transition-all hover:bg-surface-3 hover:text-white active:scale-95 disabled:opacity-50"
            style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
          >
            <RefreshCw
              className={`h-3 w-3 text-ink-500 ${
                isRefreshing ? 'animate-spin text-action' : ''
              }`}
            />
            <span>{isRefreshing ? 'SYNCING...' : 'SYNC [R]'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
