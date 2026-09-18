'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { DashboardHeader } from '@responder/components/dashboard/DashboardHeader';
import { CriticalAlertBanner } from '@responder/components/dashboard/CriticalAlertBanner';
import { SensorTelemetryPanel } from '@responder/components/dashboard/SensorTelemetryPanel';
import { SummaryCards } from '@responder/components/dashboard/SummaryCards';
import { DonutChart } from '@responder/components/dashboard/DonutChart';
import { PriorityBar } from '@responder/components/dashboard/PriorityBar';
import { ActivityTimeline } from '@responder/components/dashboard/ActivityTimeline';
import { ThemeProvider } from '@responder/components/dashboard/ThemeProvider';
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
    <ThemeProvider incidents={incidents}>
      <div className="flex min-h-screen flex-col bg-canvas text-ink-900">
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
          {/* Tactical status bar */}
          <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-ink-500">
              {audioUnlocked ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-ink-500" />
              )}
              <span>
                {audioUnlocked
                  ? 'Acoustic alert beacon armed (audible priority tone enabled).'
                  : 'Acoustic alerts muted. Click arm audio for sound warnings.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlockAudio}
              disabled={audioUnlocked}
              className="rounded-lg border border-line bg-surface-2 px-3 py-1 font-semibold text-ink-700 transition-all hover:bg-surface-3 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {audioUnlocked ? 'Acoustic Armed' : 'Arm Audio Beacon'}
            </button>
          </div>

          {/* Stat Pods */}
          {isInitialLoading ? (
            <SummarySkeleton />
          ) : incidents ? (
            <SummaryCards incidents={incidents} />
          ) : null}

          {/* Visual Intelligence Grid: Threat Distribution & Priority Spectrum */}
          {incidents && incidents.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DonutChart incidents={incidents} />
              <PriorityBar incidents={incidents} />
            </div>
          )}

          {refreshError && incidents ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm"
            >
              CAD Sync Alert: {refreshError}. Preserving latest cached telemetry.
            </div>
          ) : null}

          <SensorTelemetryPanel
            sensors={mapLayerData.sensors}
            hazardZones={mapLayerData.hazardZones}
            hasLoaded={hasLoaded}
            visible={showTelemetry}
          />

          {/* Main Tactical Map & Incident Feed */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <section className="flex flex-1 flex-col gap-4 lg:max-w-xl">
              <IncidentFilters filters={filters} onChange={setFilters} />

              {/* Live activity timeline component */}
              {incidents && incidents.length > 0 && (
                <ActivityTimeline incidents={incidents} onSelectIncident={handleSelect} />
              )}

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

            <section className="relative h-[440px] flex-1 lg:sticky lg:top-4 lg:h-[calc(100vh-200px)]">
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
                <EmptyState title="Tactical Map Offline" description="Telemetry stream unavailable." />
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
    </ThemeProvider>
  );
}
