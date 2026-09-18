'use client';

import React, { useState, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SOSForm } from '@/components/SOSForm';
import { IncidentStatus } from '@/components/IncidentStatus';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import type { IncidentCategory, SOSSubmission } from '@/lib/validation';

interface ActiveIncidentState {
  id: string;
  category: IncidentCategory;
  payload: SOSSubmission;
  isLocal: boolean;
}

export default function SurvivorWebPage() {
  const [activeIncident, setActiveIncident] = useState<ActiveIncidentState | null>(null);

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
    <main className="min-h-screen flex flex-col bg-[var(--rl-bg)]">
      {/* High-contrast Offline / Mesh Connectivity Banner */}
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncNow={syncNow}
      />

      {/* Brand Bar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-[var(--rl-border)] bg-[var(--rl-surface)]">
        <div className="flex items-center gap-2 max-w-[680px] mx-auto w-full">
          <div className="w-8 h-8 rounded-lg bg-[var(--rl-accent-soft)] border border-[var(--rl-accent)] flex items-center justify-center text-[var(--rl-accent)]">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-[var(--rl-text)] m-0 leading-tight">
              RESCUELINK
            </h1>
            <p className="text-[11px] text-[var(--rl-text-muted)] m-0 font-medium">
              Emergency Civilian Beacon
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-3 py-4 max-w-[680px] mx-auto w-full">
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
