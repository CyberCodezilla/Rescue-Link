'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { t, isIndic } = useLanguage();

  return (
    <aside
      aria-label="Network connectivity and synchronization status"
      style={{
        padding: '12px 16px',
        backgroundColor: isOnline ? (pendingCount > 0 ? '#b45309' : '#065f46') : '#7f1d1d',
        color: '#ffffff',
        borderBottom: `2px solid ${isOnline ? (pendingCount > 0 ? '#f59e0b' : '#10b981') : '#ef4444'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: isIndic ? 'normal' : '0.02em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isOnline ? (
          <Wifi size={20} color="#34d399" aria-hidden="true" />
        ) : (
          <WifiOff size={20} color="#fca5a5" aria-hidden="true" />
        )}
        <span className={isIndic ? 'indic-text' : ''}>
          {isOnline ? t.connectivity.onlineActive : t.connectivity.offlineActive}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {pendingCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <AlertCircle size={16} color="#fbbf24" />
            <span className={isIndic ? 'indic-text' : ''}>
              {pendingCount} {t.connectivity.pendingCount}
            </span>
          </div>
        )}

        {isOnline && pendingCount > 0 && onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isSyncing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span className={isIndic ? 'indic-text' : ''}>
              {isSyncing ? t.connectivity.syncing : t.connectivity.syncNow}
            </span>
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
};