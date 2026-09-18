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
      className="hud-scanline hud-glow-red flex items-center justify-between gap-3 border-b border-danger bg-red-950/80 px-4 py-2.5 sm:px-6 text-ink-900 backdrop-blur-sm z-20"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
        </span>
        <AlertOctagon size={18} className="text-danger shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hud-tag bg-danger/20 text-danger border border-danger/40">
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
          className="flex items-center gap-1 rounded bg-danger px-3 py-1 text-xs font-bold text-white hover:bg-danger-hover transition-colors shadow-sm"
        >
          <span>INTERCEPT</span>
          <ArrowRight size={12} />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-1 rounded text-red-300 hover:text-white hover:bg-red-900/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
