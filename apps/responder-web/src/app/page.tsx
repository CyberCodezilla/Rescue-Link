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
import { MapLegend, type MapMode } from '@responder/components/map/MapLegend';
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
  const [mapMode, setMapMode] = useState<MapMode>('satellite');
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
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 font-mono text-xs font-bold tracking-wider transition-all duration-200 shadow-sm active:scale-95 disabled:cursor-not-allowed ${
              audioUnlocked
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-blue-500/50 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50 hover:text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${audioUnlocked ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-blue-400 shadow-[0_0_6px_#60a5fa] animate-pulse'}`}
            />
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

          <section className="relative xl:col-span-5 xl:sticky xl:top-4 flex flex-col gap-2.5">
            {/* Unified Tactical Map Panel with Dedicated Command Toolbar */}
            <div className="flex flex-col rounded-xl border border-line-2 bg-surface-2 shadow-panel overflow-hidden">
              {/* Tactical Controls Header Toolbar (100% Unobstructed Map Below) */}
              {incidents && (
                <div className="bg-[#0b1329] border-b border-[#1e293b] p-2">
                  <MapLayerControls
                    currentMode={mapMode}
                    onSelectMode={setMapMode}
                    showSensors={showSensors}
                    onToggleSensors={() => setShowSensors((v) => !v)}
                    showHazardZones={showHazardZones}
                    onToggleHazardZones={() => setShowHazardZones((v) => !v)}
                    showUnits={showUnits}
                    onToggleUnits={() => setShowUnits((v) => !v)}
                    geofenceEnabled={geofenceEnabled}
                    onToggleGeofence={() => setGeofenceEnabled((v) => !v)}
                  />
                </div>
              )}

              {/* Map Canvas: 100% Free of Overlapping Buttons */}
              <div className="relative h-[480px] xl:h-[calc(100vh-340px)] w-full">
                {incidents ? (
                  <IncidentMapClient
                    incidents={incidents}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    currentMode={mapMode}
                    onSelectMode={setMapMode}
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

                {incidents && (
                  <GeofencePanel
                    shape={geofenceShape}
                    incidents={incidents}
                    onClear={() => setGeofenceShape(null)}
                    onBatchComplete={refresh}
                  />
                )}
              </div>
            </div>

            {/* OUTSIDE THE MAP: Dedicated Map Recon Legend in Dispatch Form */}
            <MapLegend currentMode={mapMode} />
          </section>
        </div>
      </main>
    </div>
  );
}

