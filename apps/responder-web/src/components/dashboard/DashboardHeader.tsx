'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, User, LogOut, Radio, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { StreamStatus } from '@/hooks/useIncidentStream';

interface DashboardHeaderProps {
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  streamStatus?: StreamStatus;
}

const STREAM_LABEL: Record<StreamStatus, string> = {
  connecting: 'CONNECTING...',
  live: 'LIVE TELEMETRY',
  unavailable: 'POLLING (15s)',
};

export function DashboardHeader({ lastRefreshedAt, isRefreshing, onRefresh, streamStatus }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { userEmail, userSub, signOut, isAuthenticated } = useAuth();

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
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Brand & System Health Indicator */}
      <div className="flex items-center gap-3.5">
        {/* Futuristic AI Beacon Logo (Replaces plain 'RL' box) */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/30 via-slate-900 to-cyan-950/50 border border-blue-500/40 shadow-[0_0_18px_rgba(59,130,246,0.35)] backdrop-blur-md group hover:border-blue-400/70 hover:shadow-[0_0_24px_rgba(59,130,246,0.5)] transition-all duration-300">
          <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-sm -z-10 group-hover:bg-blue-500/20 transition-all" />
          <Radio className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </span>
        </div>

        {/* Title & Status Pills */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-extrabold tracking-tight text-white font-sans flex items-center">
              Rescue<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Link</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-0.5 font-mono font-bold text-[10px] tracking-wider uppercase shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              <Sparkles size={10} className="text-cyan-400 animate-pulse" />
              AI Command
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 font-mono font-semibold text-[10px] tracking-wider uppercase">
              <ShieldCheck size={11} className="text-emerald-400" />
              Active
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-300 tracking-wide">SYSTEM NOMINAL</span>
            {streamStatus ? (
              <>
                <span className="text-slate-600">&bull;</span>
                <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 bg-slate-900/90 border border-slate-700/70 font-mono text-[10px] text-slate-300 font-medium shadow-inner">
                  <Activity size={11} className={streamStatus === 'live' ? 'text-emerald-400' : 'text-slate-400'} />
                  {STREAM_LABEL[streamStatus]}
                </span>
              </>
            ) : null}
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <span>&bull;</span>
              <span>Autonomous Neural Translation & Triage</span>
            </span>
          </div>
        </div>
      </div>

      {/* User Session, Sync Status & Tactical Controls */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
        {isAuthenticated && userEmail && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/50 to-slate-900/80 px-3 py-1.5 font-mono text-[11px] text-blue-300 shadow-sm backdrop-blur-md">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
              <User size={11} />
            </div>
            <span className="font-semibold text-slate-200">{userEmail}</span>
            {userSub && <span className="text-[9px] text-blue-400/60 font-mono">[{userSub.slice(0, 6)}]</span>}
          </div>
        )}

        <span
          aria-live="polite"
          suppressHydrationWarning
          className="font-mono text-[11px] text-slate-400 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 shadow-inner"
        >
          {formattedTime}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-gradient-to-b from-slate-800 to-slate-900 px-3.5 py-1.5 font-mono text-xs font-bold text-slate-200 hover:text-white hover:border-blue-400/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'} />
          <span>{isRefreshing ? 'SYNCING...' : 'SYNC'}</span>
        </button>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 font-mono text-xs font-bold text-rose-300 hover:bg-rose-900/40 hover:text-white hover:border-rose-400/50 transition-all shadow-sm active:scale-95"
          >
            <LogOut size={12} />
            <span>SIGN OUT</span>
          </button>
        )}
      </div>
    </header>
  );
}
