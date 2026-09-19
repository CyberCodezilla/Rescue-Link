'use client';

import React, { useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SOSForm } from '@/components/SOSForm';
import { IncidentStatus } from '@/components/IncidentStatus';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useLanguage } from '@/i18n/LanguageContext';
import type { IncidentCategory, SOSSubmission } from '@/lib/validation';

interface ActiveIncidentState {
  id: string;
  category: IncidentCategory;
  payload: SOSSubmission;
  isLocal: boolean;
}

export default function SurvivorWebPage() {
  const [activeIncident, setActiveIncident] = useState<ActiveIncidentState | null>(null);
  const { t, isIndic, dir } = useLanguage();

  // Sync callback: If a pending local report is synced, upgrade its ID to the server UUID
  const handleIncidentSynced = useCallback(
    ({ localId, serverId }: { localId: string; serverId: string }) => {
      setActiveIncident((current) => {
        if (current && current.isLocal && current.id === localId) {
          return {
            ...current,
            id: serverId,
            isLocal: false,
          };
        }
        return current;
      });
    },
    []
  );

  const { isOnline, pendingCount, isSyncing, syncNow, refreshPendingCount } =
    useSyncQueue(handleIncidentSynced);

  const handleSubmitted = (submission: {
    id: string;
    category: IncidentCategory;
    payload: SOSSubmission;
    isLocal: boolean;
  }) => {
    setActiveIncident(submission);
    refreshPendingCount();
  };

  const handleReset = () => {
    setActiveIncident(null);
  };

  return (
    <main
      dir={dir}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0d14',
      }}
    >
      {/* High-contrast Offline / Mesh Connectivity Banner */}
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={syncNow}
      />

      {/* Sleek Tactical Brand Header with Language Switcher */}
      <header
        style={{
          padding: '12px 20px',
          backgroundColor: '#121826',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '680px',
            width: '100%',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#064e3b',
                border: '1.5px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                flexShrink: 0,
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1
                  className={isIndic ? 'indic-text' : ''}
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    letterSpacing: isIndic ? 'normal' : '0.04em',
                    color: '#f8fafc',
                    margin: 0,
                  }}
                >
                  {t.brand.title}
                </h1>
                <span
                  className={isIndic ? 'indic-text' : ''}
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: isIndic ? 'normal' : '0.05em',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {t.brand.beacon}
                </span>
              </div>
              <p
                className={isIndic ? 'indic-text' : ''}
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: 0,
                  marginTop: '2px',
                  lineHeight: 1.3,
                }}
              >
                {t.brand.subtitle}
              </p>
            </div>
          </div>

          {/* Quick-Access Multilingual Selector */}
          <div style={{ flexShrink: 0 }}>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div style={{ flex: 1, padding: '20px 12px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        {activeIncident ? (
          <IncidentStatus
            key={activeIncident.id}
            incidentId={activeIncident.id}
            category={activeIncident.category}
            isLocal={activeIncident.isLocal}
            payload={activeIncident.payload}
            onReset={handleReset}
          />
        ) : (
          <SOSForm
            isOnline={isOnline}
            onSubmitted={handleSubmitted}
            onQueueUpdated={refreshPendingCount}
          />
        )}
      </div>
    </main>
  );
}