'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@responder/components/dashboard/DashboardHeader';
import { CriticalAlertBanner } from '@responder/components/dashboard/CriticalAlertBanner';
import { SensorTelemetryPanel } from '@responder/components/dashboard/SensorTelemetryPanel';
import { SummaryCards } from '@responder/components/dashboard/SummaryCards';
import { IncidentFilters } from '@responder/components/incidents/IncidentFilters';
import { IncidentList } from '@responder/components/incidents/IncidentList';
import { IncidentMapClient } from '@responder/components/map/IncidentMapClient';
import { GeofencePanel } from '@responder/components/map/GeofencePanel';
import { MapLayerControls } from '@responder/components/map/MapLayerControls';
import { EmptyState } from '@responder/components/ui/EmptyState';
import { ErrorState } from '@responder/components/ui/ErrorState';
import { IncidentListSkeleton, SummarySkeleton } from '@responder/components/ui/LoadingState';
import { useCriticalAlert } from '@responder/hooks/useCriticalAlert';
import { useHazardLayer } from '@responder/hooks/useHazardLayer';
import { useIncidentStream } from '@responder/hooks/useIncidentStream';
import { useIncidents } from '@responder/hooks/useIncidents';
import { useUnitPositions } from '@responder/hooks/useUnitPositions';
import { unlockCriticalAlertAudio } from '@responder/lib/alertSound';
import { buildDashboardMapLayerData } from '@responder/lib/dashboardIntegration';
import { DEFAULT_FILTERS } from '@responder/lib/schema';
import type { IncidentFilters as IncidentFiltersState } from '@responder/lib/schema';
import type { GeofenceShape } from '@responder/components/map/IncidentMap';

export default function DashboardPage() {
  const router = useRouter();
  const {
    incidents,
    isInitialLoading,
    isRefreshing,
    lastRefreshedAt,
    refreshError,
    refresh,
    applyIncidentUpdate,
  } = useIncidents();
  const [filters, setFilters] = useState<IncidentFiltersState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showSensors, setShowSensors] = useState(false);
  const [showHazardZones, setShowHazardZones] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceShape, setGeofenceShape] = useState<GeofenceShape | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const streamStatus = useIncidentStream({ onIncident: applyIncidentUpdate });
  const { isActive, latestIncident, dismiss } = useCriticalAlert(incidents);
  const { sensors, hazardZones, hasLoaded } = useHazardLayer();
  const { positions: unitPositions } = useUnitPositions();
  const mapLayerData = buildDashboardMapLayerData(sensors, hazardZones, unitPositions);
  const showTelemetry = showSensors || showHazardZones;

  function handleSelect(id: string) {
    setSelectedId(id);
    router.push(`/incidents/${id}`);
  }

  async function handleUnlockAudio() {
    const unlocked = await unlockCriticalAlertAudio();
    setAudioUnlocked(unlocked);
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <DashboardHeader
        lastRefreshedAt={lastRefreshedAt}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        streamStatus={streamStatus}
      />

      <CriticalAlertBanner
        isActive={isActive}
        incident={latestIncident}
        onDismiss={dismiss}
        onView={handleSelect}
      />

      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-line-2 bg-surface-2/80 px-3.5 py-2 font-mono text-xs shadow-sm">
          <p className="text-ink-500">
            {audioUnlocked
              ? 'TACTICAL AUDIO ALERT RELAY: ARMED & ACTIVE'
              : 'TACTICAL AUDIO ALERT RELAY: VISUAL-ONLY (DISARMED)'}
          </p>
          <button
            type="button"
            onClick={handleUnlockAudio}
            disabled={audioUnlocked}
            className="rounded border border-action/40 bg-action/15 px-3 py-1 font-mono text-xs font-bold text-action hover:bg-action/25 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {audioUnlocked ? 'AUDIO RELAY ARMED' : 'ARM AUDIO ALERTS'}
          </button>
        </div>

        {isInitialLoading ? (
          <SummarySkeleton />
        ) : incidents ? (
          <SummaryCards incidents={incidents} />
        ) : null}

        {refreshError && incidents ? (
          <p
            role="alert"
            className="rounded border border-priority-criticalBg bg-priority-criticalBg/40 px-3 py-2 text-sm text-priority-critical"
          >
            Latest refresh failed: {refreshError}. Showing the last data loaded successfully.
          </p>
        ) : null}

        <SensorTelemetryPanel
          sensors={mapLayerData.sensors}
          hazardZones={mapLayerData.hazardZones}
          hasLoaded={hasLoaded}
          visible={showTelemetry}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="flex flex-col gap-4 xl:col-span-7">
            <IncidentFilters filters={filters} onChange={setFilters} />

            {isInitialLoading ? (
              <IncidentListSkeleton />
            ) : incidents === null ? (
              <ErrorState message={refreshError ?? undefined} onRetry={refresh} />
            ) : (
              <IncidentList
                incidents={incidents}
                filters={filters}
                selectedId={selectedId}
                onSelect={handleSelect}
                onClearFilters={() => setFilters(DEFAULT_FILTERS)}
              />
            )}
          </section>

          <section className="relative h-[480px] xl:col-span-5 xl:sticky xl:top-4 xl:h-[calc(100vh-220px)]">
            {incidents ? (
              <IncidentMapClient
                incidents={incidents}
                selectedId={selectedId}
                onSelect={handleSelect}
                sensors={mapLayerData.sensors}
                hazardZones={mapLayerData.hazardZones}
                unitPositions={mapLayerData.unitPositions}
                showSensors={showSensors}
                showHazardZones={showHazardZones}
                showUnits={showUnits}
                geofenceEnabled={geofenceEnabled}
                onGeofenceChange={setGeofenceShape}
              />
            ) : !isInitialLoading ? (
              <EmptyState title="Map unavailable" description="Incident data failed to load." />
            ) : null}

            {incidents ? (
              <>
                <MapLayerControls
                  showSensors={showSensors}
                  onToggleSensors={() => setShowSensors((v) => !v)}
                  showHazardZones={showHazardZones}
                  onToggleHazardZones={() => setShowHazardZones((v) => !v)}
                  showUnits={showUnits}
                  onToggleUnits={() => setShowUnits((v) => !v)}
                  geofenceEnabled={geofenceEnabled}
                  onToggleGeofence={() => setGeofenceEnabled((v) => !v)}
                />
                <GeofencePanel
                  shape={geofenceShape}
                  incidents={incidents}
                  onClear={() => setGeofenceShape(null)}
                  onBatchComplete={refresh}
                />
              </>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
