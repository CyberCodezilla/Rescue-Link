'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, Keyboard } from 'lucide-react';
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
import { useKeyboardNavigation } from '@responder/hooks/useKeyboardNavigation';
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
  const [layoutMode, setLayoutMode] = useState<'split' | 'table-focus' | 'map-focus'>('split');

  const streamStatus = useIncidentStream({ onIncident: applyIncidentUpdate });
  const { isActive, latestIncident, dismiss } = useCriticalAlert(incidents);
  const { sensors, hazardZones, hasLoaded } = useHazardLayer();
  const { positions: unitPositions } = useUnitPositions();
  const mapLayerData = buildDashboardMapLayerData(sensors, hazardZones, unitPositions);
  const showTelemetry = showSensors || showHazardZones;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    // Double click or keyboard space navigates, single click focuses map
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, []);

  // Keyboard navigation: [J/K] cycle incidents, [R] refresh, [Esc] clear
  useKeyboardNavigation({
    incidents,
    selectedId,
    onSelect: handleSelect,
    onClear: handleClearSelection,
    onRefresh: refresh,
  });

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
          onView={(id) => router.push(`/incidents/${id}`)}
        />

        <main className="flex flex-1 flex-col gap-4 p-3.5 sm:p-5">
          {/* Tactical Status & Audio Arming Bar */}
          <div className="hud-panel-topcut flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-ink-500">
              {audioUnlocked ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-ink-500" />
              )}
              <span>
                {audioUnlocked
                  ? 'ACOUSTIC ALERT BEACON ARMED // AUDIBLE CRITICAL CHIME ACTIVE'
                  : 'ACOUSTIC ALERTS MUTED // CLICK TO ARM SOUND WARNINGS'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 text-[10px] text-ink-500">
                <Keyboard className="h-3 w-3 text-action" />
                <span>HOTKEYS: [J/K] NEXT/PREV | [R] SYNC | [ESC] RESET</span>
              </div>
              <button
                type="button"
                onClick={handleUnlockAudio}
                disabled={audioUnlocked}
                className="border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-ink-700 transition-all hover:bg-surface-3 hover:text-white disabled:opacity-50"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
              >
                {audioUnlocked ? 'BEACON ARMED' : 'ARM AUDIO'}
              </button>
            </div>
          </div>

          {/* Telemetry Pods */}
          {isInitialLoading ? (
            <SummarySkeleton />
          ) : incidents ? (
            <SummaryCards incidents={incidents} />
          ) : null}

          {/* Threat Distribution & Priority Spectrum */}
          {incidents && incidents.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DonutChart incidents={incidents} />
              <PriorityBar incidents={incidents} />
            </div>
          )}

          {refreshError && incidents ? (
            <div
              role="alert"
              className="border border-red-500/40 bg-red-500/10 p-3 text-xs font-mono text-red-300"
            >
              CAD SYNC WARNING: {refreshError}. Preserving cached operational state.
            </div>
          ) : null}

          <SensorTelemetryPanel
            sensors={mapLayerData.sensors}
            hazardZones={mapLayerData.hazardZones}
            hasLoaded={hasLoaded}
            visible={showTelemetry}
          />

          {/* Tactical Layout Mode Selector */}
          <div className="hud-panel-topcut flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-ink-500">
              <span className="h-1.5 w-1.5 rounded-full bg-action animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                TACTICAL CAD WORKSPACE // DUAL SYNCHRONIZED DISPLAY
              </span>
            </div>
            <div className="flex items-center border border-line bg-surface-3/80 p-0.5 rounded">
              <button
                type="button"
                onClick={() => setLayoutMode('split')}
                title="Split Display: Map and Incident Feed Side-by-Side"
                className={`px-2.5 py-1 text-[10px] font-bold transition-all ${
                  layoutMode === 'split'
                    ? 'bg-action text-white shadow-sm'
                    : 'text-ink-500 hover:text-white'
                }`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
              >
                ⊞ SPLIT VIEW (MAP + DATA)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('table-focus')}
                title="Table Focus: Full-width Table with Map Below"
                className={`px-2.5 py-1 text-[10px] font-bold transition-all ${
                  layoutMode === 'table-focus'
                    ? 'bg-action text-white shadow-sm'
                    : 'text-ink-500 hover:text-white'
                }`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
              >
                ≡ EXPAND TABLE (FULL WIDTH)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('map-focus')}
                title="Map Focus: Full-width Tactical Map"
                className={`px-2.5 py-1 text-[10px] font-bold transition-all ${
                  layoutMode === 'map-focus'
                    ? 'bg-action text-white shadow-sm'
                    : 'text-ink-500 hover:text-white'
                }`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}
              >
                ⛶ EXPAND MAP
              </button>
            </div>
          </div>

          {/* Main Tactical Map & Incident Feed */}
          <div
            className={`flex flex-col gap-4 ${
              layoutMode === 'split'
                ? 'lg:flex-row lg:items-start'
                : layoutMode === 'table-focus'
                ? 'flex-col'
                : 'flex-col-reverse'
            }`}
          >
            <section
              className={`flex flex-col gap-3.5 min-w-0 ${
                layoutMode === 'split'
                  ? 'flex-1 lg:flex-[1.25] xl:flex-[1.3]'
                  : 'w-full'
              }`}
            >
              {/* Tactical Segmented Filters */}
              <IncidentFilters
                filters={filters}
                onChange={setFilters}
                incidents={incidents ?? []}
              />

              {/* Live activity timeline with hover-to-locate */}
              {incidents && incidents.length > 0 && (
                <ActivityTimeline
                  incidents={incidents}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelectIncident={handleSelect}
                  onHoverIncident={setHoveredId}
                />
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
                  hoveredId={hoveredId}
                  onSelect={handleSelect}
                  onHover={setHoveredId}
                  onClearFilters={() => setFilters(DEFAULT_FILTERS)}
                />
              )}
            </section>

            <section
              className={`relative min-w-0 ${
                layoutMode === 'split'
                  ? 'flex-1 h-[480px] lg:sticky lg:top-3 lg:h-[calc(100vh-160px)] lg:flex-[1]'
                  : layoutMode === 'table-focus'
                  ? 'w-full h-[460px]'
                  : 'w-full h-[calc(100vh-160px)]'
              }`}
            >
              {incidents ? (
                <IncidentMapClient
                  incidents={incidents}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={handleSelect}
                  onHover={setHoveredId}
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
