'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, User, LogOut, Radar, ShieldCheck } from 'lucide-react';
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
      {/* Dynamic Scoped Keyframes for Scanner Radar & Continuous Waves */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radar-wave {
          0% {
            transform: scale(0.4);
            opacity: 0.95;
            border-width: 1.5px;
          }
          60% {
            opacity: 0.45;
            border-width: 1px;
          }
          100% {
            transform: scale(1.75);
            opacity: 0;
            border-width: 0.5px;
          }
        }
      `}} />

      {/* Brand & System Health Indicator */}
      <div className="flex items-center gap-3.5">
        {/* Futuristic Flashlight Scanner Radar Logo with Continuous Smaller Waves */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md overflow-hidden group hover:border-cyan-400/80 transition-all duration-300">
          {/* Faint Concentric Grid / Crosshair Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="h-7 w-7 rounded-full border border-cyan-400/30" />
            <div className="absolute h-4 w-4 rounded-full border border-cyan-400/40" />
            <div className="absolute h-full w-[1px] bg-cyan-400/20" />
            <div className="absolute w-full h-[1px] bg-cyan-400/20" />
          </div>

          {/* Flashlight Scanner Radar Sweep Beam */}
          <div
            className="absolute inset-0 pointer-events-none origin-center"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6,182,212,0.06) 300deg, rgba(56,189,248,0.45) 360deg)',
              animation: 'radar-sweep 2.4s linear infinite',
            }}
          />

          {/* Continuous Smaller Wave 1 */}
          <span
            className="absolute rounded-full border border-cyan-400 pointer-events-none"
            style={{
              width: '18px',
              height: '18px',
              animation: 'radar-wave 2.2s cubic-bezier(0.1, 0.4, 0.8, 1) infinite',
            }}
          />

          {/* Continuous Smaller Wave 2 (Staggered) */}
          <span
            className="absolute rounded-full border border-cyan-300 pointer-events-none"
            style={{
              width: '18px',
              height: '18px',
              animation: 'radar-wave 2.2s cubic-bezier(0.1, 0.4, 0.8, 1) infinite 1.1s',
            }}
          />

          {/* Core Radar Icon */}
          <Radar className="relative z-10 h-5 w-5 text-cyan-400 group-hover:text-cyan-200 transition-colors drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
        </div>

        {/* Title & Status Pills */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-extrabold tracking-tight text-white font-sans flex items-center">
              Rescue<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Link</span>
            </h1>
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
