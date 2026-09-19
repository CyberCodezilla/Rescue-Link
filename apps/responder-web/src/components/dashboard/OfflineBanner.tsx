'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isServingCachedData: boolean;
  lastRefreshedAt: Date | null;
}

export function OfflineBanner({ isServingCachedData, lastRefreshedAt }: OfflineBannerProps) {
  if (!isServingCachedData) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-950/40 px-4 py-2 text-xs font-mono text-amber-200 sm:px-6 backdrop-blur-sm"
    >
      <WifiOff size={14} className="text-amber-400 shrink-0" />
      <span>
        OFFLINE CACHE ACTIVE — Displaying locally cached telemetry
        {lastRefreshedAt
          ? ` as of ${lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : ''}
        . Reconnect to uplink for live tactical sync.
      </span>
    </div>
  );
}
