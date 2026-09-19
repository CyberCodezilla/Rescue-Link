'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncNow,
}) => {
  return (
    <aside
      aria-label="Network connectivity and synchronization status"
      className="rl-connectivity-bar"
      data-online={isOnline ? 'true' : 'false'}
    >
      <div className="flex items-center gap-2">
        <span
          className="rl-status-dot"
          data-status={isOnline ? 'online' : 'offline'}
          aria-hidden="true"
        />
        {isOnline ? (
          <Wifi size={16} className="text-[var(--rl-success)]" aria-hidden="true" />
        ) : (
          <WifiOff size={16} className="text-[var(--rl-warning)]" aria-hidden="true" />
        )}
        <span className="text-xs font-semibold">
          {isOnline
            ? 'Live Connection — Edge Uplink Active'
            : 'Offline Mesh Mode — Beacon Queued Locally'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertCircle size={14} className="text-amber-600" />
            <span>
              {pendingCount} queued
            </span>
          </div>
        )}

        {isOnline && pendingCount > 0 && onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="rl-btn rl-btn-primary !py-1 !px-3 !text-xs flex items-center gap-1.5"
          >
            <RefreshCw
              size={12}
              className={isSyncing ? 'rl-spin' : ''}
            />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </aside>
  );
};
