'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, User, LogOut, ShieldCheck } from 'lucide-react';
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
        {/* Tactical Circular Motion Radar Scope (Hardware-accelerated native SVG 360° sweep + waves) */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950/95 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md overflow-hidden group hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all duration-300">
          <svg
            viewBox="0 0 40 40"
            className="h-10 w-10 shrink-0 rounded-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="headerRadarBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#082f49" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#020617" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="headerBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
              <filter id="headerRadarGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Scope Outer Bezel */}
            <circle cx="20" cy="20" r="19" fill="url(#headerRadarBg)" stroke="#0ea5e9" strokeWidth="1.2" strokeOpacity="0.7" />

            {/* Static Tactical Grid Rings & Crosshairs */}
            <circle cx="20" cy="20" r="13.5" stroke="#0284c7" strokeWidth="0.7" strokeOpacity="0.4" />
            <circle cx="20" cy="20" r="7.5" stroke="#0284c7" strokeWidth="0.7" strokeOpacity="0.45" />
            <line x1="2" y1="20" x2="38" y2="20" stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.3" />
            <line x1="20" y1="2" x2="20" y2="38" stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.3" />

            {/* Continuous Smaller Radar Wave 1 */}
            <circle cx="20" cy="20" r="2" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.9">
              <animate attributeName="r" values="2; 18" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="stroke-width" values="1.2; 0.5" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* Continuous Smaller Radar Wave 2 (Staggered) */}
            <circle cx="20" cy="20" r="2" stroke="#22d3ee" strokeWidth="1.2" fill="none" opacity="0.9">
              <animate attributeName="r" values="2; 18" begin="1.1s" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0" begin="1.1s" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="stroke-width" values="1.2; 0.5" begin="1.1s" dur="2.2s" repeatCount="indefinite" />
            </circle>

            {/* Active Circular Motion Rotating Scanner Sweep (Continuous 360° Rotation) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 20 20"
                to="360 20 20"
                dur="2s"
                repeatCount="indefinite"
              />
              {/* Flashlight Scanner Sector */}
              <path d="M 20 20 L 20 1 A 19 19 0 0 1 39 20 Z" fill="url(#headerBeamGradient)" />
              {/* Leading High-Intensity Scanner Needle */}
              <line
                x1="20"
                y1="20"
                x2="39"
                y2="20"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeLinecap="round"
                filter="url(#headerRadarGlow)"
              />
            </g>

            {/* Detected Target Blip */}
            <circle cx="28" cy="11" r="1.5" fill="#38bdf8" filter="url(#headerRadarGlow)">
              <animate attributeName="opacity" values="0.1; 0.1; 1; 0.6; 0.1; 0.1" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Central Radar Transmitter Beacon */}
            <circle cx="20" cy="20" r="2.2" fill="#38bdf8" filter="url(#headerRadarGlow)" />
            <circle cx="20" cy="20" r="1" fill="#ffffff" />
          </svg>
        </div>

        {/* Title & Status Pills */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base font-extrabold tracking-tight text-white font-sans flex items-center">
              Rescue<span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Link</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 font-mono font-semibold text-[10px] tracking-wider uppercase">
              <ShieldCheck size={11} className="text-emerald-400" />
              Active
            </span>

            {/* Distinctive Cyber-Tactical Live Telemetry Tab */}
            {streamStatus ? (
              <div
                className={`relative inline-flex items-center gap-2 rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider transition-all duration-300 ${
                  streamStatus === 'live'
                    ? 'border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/50 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                    : streamStatus === 'connecting'
                    ? 'border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-slate-950 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border border-slate-700/60 bg-slate-900/80 text-slate-400'
                }`}
              >
                {/* Active Multi-Bar Signal Frequency Visualizer */}
                {streamStatus === 'live' ? (
                  <div className="flex items-end gap-[2px] h-3 px-0.5" aria-hidden="true">
                    <span className="w-[2.5px] rounded-full bg-emerald-400 animate-[pulse_1s_ease-in-out_infinite] h-2" />
                    <span className="w-[2.5px] rounded-full bg-emerald-400 animate-[pulse_1.4s_ease-in-out_infinite_0.2s] h-3" />
                    <span className="w-[2.5px] rounded-full bg-cyan-400 animate-[pulse_1.1s_ease-in-out_infinite_0.4s] h-2.5" />
                    <span className="w-[2.5px] rounded-full bg-emerald-400 animate-[pulse_1.3s_ease-in-out_infinite_0.1s] h-2" />
                  </div>
                ) : (
                  <Activity size={12} className={streamStatus === 'connecting' ? 'text-amber-400 animate-spin' : 'text-slate-500'} />
                )}

                {/* Telemetry Label with glowing status dot */}
                <div className="flex items-center gap-1.5">
                  {streamStatus === 'live' && (
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  )}
                  <span className="text-[10px] tracking-widest font-extrabold uppercase bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    {STREAM_LABEL[streamStatus]}
                  </span>
                </div>

                {/* Subtle Real-Time Feed Tag */}
                {streamStatus === 'live' && (
                  <span className="hidden sm:inline-block text-[9px] font-mono text-emerald-400/80 border-l border-emerald-500/30 pl-1.5 uppercase font-medium">
                    REAL-TIME
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-300 tracking-wide">SYSTEM NOMINAL</span>
            <span className="text-slate-600">&bull;</span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
              Autonomous Neural Translation & Triage
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
