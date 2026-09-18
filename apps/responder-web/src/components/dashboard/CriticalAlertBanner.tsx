'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { getCategory, CATEGORY_LABELS } from '@/lib/schema';
import type { IncidentResponse } from '@/lib/schema';
import { formatLocation } from '@/lib/format';

interface CriticalAlertBannerProps {
  isActive: boolean;
  incident: IncidentResponse | null;
  onDismiss: () => void;
  onView: (id: string) => void;
}

export function CriticalAlertBanner({ isActive, incident, onDismiss, onView }: CriticalAlertBannerProps) {
  if (!isActive || !incident) return null;

  const isCritical = incident.priority === 'critical';

  return (
    <div
      role="alert"
      className="relative z-30 overflow-hidden border-b border-red-500/40 bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90 px-4 py-2.5 shadow-lg shadow-red-950/50 backdrop-blur-md sm:px-6"
    >
      {/* Ambient glowing top-edge */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-300/40" />
          </span>

          <div className="flex items-center gap-2">
            <span className="rounded bg-red-500/20 px-2 py-0.5 font-mono text-[11px] font-extrabold tracking-wider text-red-300 uppercase ring-1 ring-red-400/30">
              {isCritical ? 'PRIORITY 1 CRITICAL ALERT' : 'EMERGENCY BEACON'}
            </span>
            <span className="hidden sm:inline font-mono text-xs font-semibold text-white">
              [{incident.id.slice(0, 8)}]
            </span>
          </div>

          <p className="text-xs font-medium text-red-100 sm:text-sm">
            <span className="font-bold text-white capitalize">
              {CATEGORY_LABELS[getCategory(incident)]}
            </span>
            {' at '}
            <span className="font-medium text-red-200">{formatLocation(incident.location)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(incident.id)}
            className="flex items-center gap-1.5 rounded-lg border border-red-400/40 bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-600 active:scale-95"
          >
            <span>Triage Incident</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert banner"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
