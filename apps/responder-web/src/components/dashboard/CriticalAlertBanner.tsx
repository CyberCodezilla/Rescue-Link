'use client';

import React from 'react';
import { AlertOctagon, X, ArrowRight } from 'lucide-react';
import { getCategory, CATEGORY_LABELS } from '@/lib/schema';
import type { IncidentResponse } from '@/lib/schema';

interface CriticalAlertBannerProps {
  isActive: boolean;
  incident: IncidentResponse | null;
  onDismiss: () => void;
  onView: (id: string) => void;
}

export function CriticalAlertBanner({ isActive, incident, onDismiss, onView }: CriticalAlertBannerProps) {
  if (!isActive || !incident) return null;

  return (
    <div
      role="alert"
      className="hud-scanline hud-glow-red flex items-center justify-between gap-3 border-b border-red-500/50 bg-red-950/80 px-4 py-2.5 sm:px-6 text-slate-100 backdrop-blur-md z-20 shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <AlertOctagon size={18} className="text-red-400 shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold bg-red-500/25 text-red-200 border border-red-500/40 shadow-sm">
            {incident.priority?.toUpperCase() || 'CRITICAL'}
          </span>
          <p className="text-sm font-semibold text-red-100">
            Emergency Alert: {CATEGORY_LABELS[getCategory(incident)] || 'Incident'} reported at{' '}
            <span className="font-mono text-xs text-red-300">[{incident.id}]</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onView(incident.id)}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold font-mono text-white hover:bg-red-500 active:scale-95 transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        >
          <span>INTERCEPT</span>
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-900/60 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
