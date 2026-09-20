'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Radio, X } from 'lucide-react';
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
import IncidentDetailClient from './incidents/[id]/IncidentDetailClient';

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
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('satellite');
  const [showSensors, setShowSensors] = useState(false);
  const [showHazardZones, setShowHazardZones] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceShape, setGeofenceShape] = useState<GeofenceShape | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const measureTarget = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('survivor-sos-btn');
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setTargetRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
      }
    }
  }, []);

  // Trigger spotlight on every fresh page visit / manual refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      setShowSpotlight(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Actively measure button coordinates whenever spotlight is visible
  useEffect(() => {
    if (!showSpotlight) return;
    measureTarget();
    const id = requestAnimationFrame(measureTarget);
    const t1 = setTimeout(measureTarget, 60);
    const t2 = setTimeout(measureTarget, 250);
    const t3 = setTimeout(measureTarget, 600);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
    };
  }, [showSpotlight, measureTarget]);

  // Non-annoying UX: instant dismiss on Escape key or gentle dismiss if user scrolls down
  useEffect(() => {
    if (!showSpotlight) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSpotlight(false);
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 80) {
        setShowSpotlight(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showSpotlight]);

  function handleDismissSpotlight() {
    setShowSpotlight(false);
  }

  const streamStatus = useIncidentStream({ onIncident: applyIncidentUpdate });
  const { isActive, latestIncident, dismiss } = useCriticalAlert(incidents);
  const { sensors, hazardZones, hasLoaded } = useHazardLayer();
  const { positions: unitPositions } = useUnitPositions();
  const mapLayerData = buildDashboardMapLayerData(sensors, hazardZones, unitPositions);
  const showTelemetry = showSensors || showHazardZones;

  // Client-side deep link route watcher for AWS Amplify static hosting & deep links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseRoute = () => {
      const match = window.location.pathname.match(/\/incidents\/([a-zA-Z0-9_-]+)/);
      if (match && match[1] && match[1] !== 'demo') {
        setActiveIncidentId(match[1]);
        return;
      }
      const queryId = new URLSearchParams(window.location.search).get('incident');
      if (queryId) {
        setActiveIncidentId(queryId);
        return;
      }
      setActiveIncidentId(null);
    };

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  function handleSelect(id: string) {
    setSelectedId(id);
    setActiveIncidentId(id);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/incidents/${id}`);
    }
  }

  async function handleUnlockAudio() {
    const unlocked = await unlockCriticalAlertAudio();
    setAudioUnlocked(unlocked);
  }

  // If a deep incident is requested (via direct URL /incidents/<id> or ?incident=<id>),
  // seamlessly render the tactical incident dossier
  if (activeIncidentId) {
    return (
      <IncidentDetailClient
        initialId={activeIncidentId}
        onBack={() => {
          setActiveIncidentId(null);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
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
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-2 bg-surface-2/80 px-4 py-2.5 font-mono text-xs shadow-sm">
          <p className="text-ink-500 flex items-center gap-2">
            <span className="text-slate-400">TACTICAL AUDIO RELAY:</span>
            <span className={audioUnlocked ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {audioUnlocked ? 'ARMED & ACTIVE' : 'VISUAL-ONLY (DISARMED)'}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dedicated High-Contrast Action Button Beside ARM AUDIO ALERTS */}
            <a
              id="survivor-sos-btn"
              href="https://survivor.d3uwi22i8lbsov.amplifyapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleDismissSpotlight()}
              className={`relative inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 font-mono text-xs font-black tracking-wider transition-all duration-300 active:scale-95 shadow-md ${
                showSpotlight
                  ? 'z-[60] border-amber-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.95)] ring-4 ring-amber-400/90 animate-pulse'
                  : 'border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 text-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.4)]'
              }`}
              title="Open Survivor Portal to report or simulate an emergency SOS"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              </span>
              <Radio size={13} />
              <span>REPORT SURVIVOR SOS</span>
              <ExternalLink size={12} />
            </a>

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
          <section className="flex flex-col gap-4 xl:col-span-7" aria-label="Incident queue">
            {incidents && incidents.length === 0 && (
              <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-blue-950/40 p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                    </span>
                    <div>
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-200">
                        SURVIVOR SIDE MUST REPORT SOS FIRST
                      </p>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                        Tactical queue is on standby. Click below to launch the Survivor Portal and dispatch an emergency distress call.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://survivor.d3uwi22i8lbsov.amplifyapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 font-mono text-xs font-black tracking-wider transition-all duration-150 shadow-md active:scale-95"
                  >
                    <span>GO TO SURVIVOR PAGE</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

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

          <section className="relative xl:col-span-5 xl:sticky xl:top-4 flex flex-col gap-2.5" aria-label="Map view">
            <div className="flex flex-col rounded-xl border border-line-2 bg-surface-2 shadow-panel overflow-hidden">
              {/* Tactical Controls Header Toolbar */}
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

              {/* Map Canvas */}
              <div className="relative h-[480px] xl:h-[calc(100vh-340px)] w-full">
                {incidents ? (
                  <IncidentMapClient
                    incidents={incidents}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    hoveredId={hoveredId}
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

            {/* OUTSIDE THE MAP: Dedicated Map Recon Legend */}
            <MapLegend currentMode={mapMode} />
          </section>
        </div>
      </main>

      {/* ================================================================
          TACTICAL ONBOARDING SPOTLIGHT OVERLAY & TUTORIAL CARD (Z-INDEX 9999)
          Positioned at the very end of the page to dominate all DOM stacking contexts
          ================================================================ */}
      {showSpotlight && (
        <div className="fixed inset-0 z-[9990] pointer-events-none">
          {/* Dark Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-[3px] pointer-events-auto transition-opacity duration-300"
            onClick={() => handleDismissSpotlight()}
            aria-hidden="true"
          />

          {/* Fully Illuminated Active Button Clone at z-[9995] Directly Above the Backdrop */}
          {targetRect && (
            <a
              href="https://survivor.d3uwi22i8lbsov.amplifyapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleDismissSpotlight()}
              style={{
                position: 'fixed',
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
              }}
              className="pointer-events-auto z-[9995] inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-3.5 py-1.5 font-mono text-xs font-black tracking-wider text-slate-950 shadow-[0_0_40px_rgba(245,158,11,1)] ring-4 ring-amber-400/90 animate-pulse hover:brightness-110 active:scale-95"
              title="Open Survivor Portal to report an emergency SOS"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950 shadow-[0_0_6px_#000]" />
              </span>
              <Radio size={13} className="text-slate-950" />
              <span>REPORT SURVIVOR SOS</span>
              <ExternalLink size={12} className="text-slate-950" />
            </a>
          )}

          {/* Floating Tutorial Pointer Card at z-[9999] */}
          <div
            style={
              targetRect
                ? {
                    position: 'fixed',
                    top: targetRect.top + targetRect.height + 12,
                    left: Math.max(16, targetRect.left + targetRect.width - 380),
                  }
                : {
                    position: 'fixed',
                    top: '140px',
                    right: '24px',
                  }
            }
            className="pointer-events-auto z-[9999] w-[380px] max-w-[calc(100vw-32px)]"
          >
            <div className="relative rounded-2xl border-2 border-amber-400 bg-slate-950 p-5 text-left shadow-[0_0_50px_rgba(0,0,0,0.95)]">
              {/* Top pointer arrow pointing up directly at the button */}
              <div
                style={{
                  right: targetRect
                    ? Math.min(Math.max(20, Math.round(targetRect.width / 2) - 10), 160)
                    : 60,
                }}
                className="absolute -top-2.5 h-5 w-5 rotate-45 border-t-2 border-l-2 border-amber-400 bg-slate-950"
              />

              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/40">
                    !
                  </span>
                  <span>STEP 1: REPORT SOS FIRST</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismissSpotlight()}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title="Dismiss tutorial"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-sm font-bold text-white font-sans">
                  Survivor SOS Required First
                </p>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  The Rescuer Dashboard listens for emergency distress calls.
                  <span className="text-amber-300 font-semibold block mt-1">
                    Click the highlighted button above to open the Survivor Portal and dispatch a test distress call.
                  </span>
                </p>
              </div>

              <div className="mt-3.5 rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[11px] text-slate-400 space-y-1.5">
                <div className="text-cyan-400 flex items-center gap-2 font-semibold">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[10px]">1</span>
                  <span>Click &apos;REPORT SURVIVOR SOS&apos; button</span>
                </div>
                <div className="text-amber-300 flex items-center gap-2 font-semibold">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">2</span>
                  <span>Send distress message (in any language)</span>
                </div>
                <div className="text-emerald-400 flex items-center gap-2 font-semibold">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">3</span>
                  <span>Watch Amazon Bedrock AI triage appear here!</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDismissSpotlight()}
                  className="text-[11px] font-mono font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <span>Got it</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">Esc</kbd>
                </button>

                <a
                  href="https://survivor.d3uwi22i8lbsov.amplifyapp.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleDismissSpotlight()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 font-mono text-xs font-black tracking-wider transition-all duration-150 shadow-md active:scale-95"
                >
                  <span>OPEN SURVIVOR APP</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
