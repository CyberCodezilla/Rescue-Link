'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Layers, Flame, Mountain, Eye, Shield, Radio, Activity, AlertTriangle } from 'lucide-react';
import type { Priority } from '@responder/lib/schema';

export type MapMode = 'satellite' | 'topo' | 'thermal' | 'tactical';

interface MapLegendProps {
  currentMode: MapMode;
  variant?: 'panel' | 'floating';
  className?: string;
}

export function MapLegend({ currentMode, variant = 'panel', className = '' }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (variant === 'floating') {
    return (
      <div
        className={`pointer-events-auto rounded-lg border border-line bg-surface/95 p-3 shadow-panel backdrop-blur-md text-ink-900 font-mono text-xs transition-all ${className}`}
        style={{ maxWidth: '280px' }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-action">
            <Info size={13} />
            <span>MAP RECON LEGEND</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded p-0.5 text-ink-500 hover:text-ink-900 hover:bg-surface-2 transition-colors"
            aria-label={isOpen ? 'Collapse map legend' : 'Expand map legend'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-2.5 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wider block mb-1">
                ACTIVE LAYER // {currentMode.toUpperCase()}
              </span>
              {currentMode === 'satellite' && (
                <div className="rounded border border-line-2 bg-surface-2/60 p-2 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Eye size={12} />
                    <span>True-Color Photorealistic Satellite</span>
                  </div>
                  <p className="text-[10px] text-ink-500 font-sans leading-tight">
                    High-res aerial photography showing physical buildings, waterbodies, rooftops, and vegetation.
                  </p>
                </div>
              )}
              {currentMode === 'topo' && (
                <div className="rounded border border-line-2 bg-surface-2/60 p-2 text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Mountain size={12} />
                    <span>Topographic & Elevation Contours</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-500">
                    <span>Sea Level / Basin</span>
                    <span>High Ridge / Summit</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-yellow-200" />
                  <p className="text-[10px] text-ink-500 font-sans leading-tight">
                    Contour intervals show terrain elevation, slope angles, and flood run-off channels.
                  </p>
                </div>
              )}
              {currentMode === 'thermal' && (
                <div className="rounded border border-line-2 bg-surface-2/60 p-2 text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <Flame size={12} />
                    <span>Thermal Hazard & Heat Intensity</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-500">
                    <span>Normal (22°C)</span>
                    <span>Extreme (65°C+)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 via-amber-400 to-red-600" />
                  <p className="text-[10px] text-ink-500 font-sans leading-tight">
                    Thermal hotspots indicate active wildfire fronts, casualty clustering, and sensor alerts.
                  </p>
                </div>
              )}
              {currentMode === 'tactical' && (
                <div className="rounded border border-line-2 bg-surface-2/60 p-2 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Shield size={12} />
                    <span>Command Center Tactical HUD</span>
                  </div>
                  <p className="text-[10px] text-ink-500 font-sans leading-tight">
                    Low-light vector contrast map with sharp coordinate grids for tactical clarity.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dedicated External Dispatcher Recon Panel (Full width, placed outside map)
  return (
    <div
      className={`w-full rounded-lg border border-line bg-surface/95 p-3.5 shadow-panel text-ink-900 font-mono text-xs transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-action">
          <Info size={14} />
          <span className="text-xs">MAP RECON & TELEMETRY LEGEND</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-action/20 border border-action/40 text-action font-semibold">
            {currentMode.toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold text-ink-500 hover:text-ink-900 hover:bg-surface-2 border border-line-2 transition-colors"
          aria-label={isOpen ? 'Collapse map legend' : 'Expand map legend'}
        >
          <span>{isOpen ? 'COLLAPSE' : 'EXPAND'}</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Column 1: Active Layer Recon Intel */}
          <div className="rounded border border-line-2 bg-surface-2/60 p-2.5 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wider block mb-1">
                ACTIVE LAYER SPECTRUM // {currentMode.toUpperCase()}
              </span>

              {currentMode === 'satellite' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <Eye size={13} />
                    <span>True-Color Photorealistic Satellite</span>
                  </div>
                  <p className="text-[11px] text-ink-500 font-sans leading-relaxed">
                    ESRI World Imagery high-res reconnaissance showing physical terrain, streets, buildings, and vegetation.
                  </p>
                </div>
              )}

              {currentMode === 'topo' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <Mountain size={13} />
                    <span>Topographic & Elevation Contours</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-500">
                    <span>Sea Level / Basin</span>
                    <span>High Ridge / Summit</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-yellow-200" />
                  <p className="text-[11px] text-ink-500 font-sans leading-relaxed">
                    Contour intervals and shaded relief depict terrain slope, elevation gradients, and drainage basins.
                  </p>
                </div>
              )}

              {currentMode === 'thermal' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                    <Flame size={13} />
                    <span>Thermal Hazard & Infrared Heat Intensity</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-500">
                    <span>Ambient (22°C)</span>
                    <span>Extreme Hotspot (65°C+)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 via-amber-400 to-red-600" />
                  <p className="text-[11px] text-ink-500 font-sans leading-relaxed">
                    FLIR false-color infrared satellite recon highlights thermal anomalies, active fire fronts, and casualty clusters.
                  </p>
                </div>
              )}

              {currentMode === 'tactical' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                    <Shield size={13} />
                    <span>Command Center Tactical Dark HUD</span>
                  </div>
                  <p className="text-[11px] text-ink-500 font-sans leading-relaxed">
                    High-contrast dark vector map optimized for low-light command rooms and coordinate tracking.
                  </p>
                </div>
              )}
            </div>
            <div className="text-[10px] text-ink-500 uppercase tracking-wider pt-1 border-t border-line-2">
              RESOLUTION: HIGH PRECISION RECON
            </div>
          </div>

          {/* Column 2: Incident Ground Target Dot */}
          <div className="rounded border border-line-2 bg-surface-2/60 p-2.5 space-y-2">
            <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wider block mb-1">
              INCIDENT GROUND TARGET
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-surface/50 border border-line-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-[0_0_6px_#EF4444]" />
                  <span className="text-red-400 font-bold">EXACT INCIDENT POINT</span>
                </div>
                <span className="text-[10px] text-ink-500 font-mono">RED DOT</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-surface/50 border border-line-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500 shadow-[0_0_10px_#EF4444] scale-110" />
                  <span className="text-action font-bold">FOCUSED INCIDENT TARGET</span>
                </div>
                <span className="text-[10px] text-action font-mono">15.0x ZOOM</span>
              </div>
              <div className="p-1 text-[10px] text-ink-500 font-sans leading-tight">
                Precise un-obscured coordinates for clear visual navigation and immediate tactical dispatch.
              </div>
            </div>
          </div>

          {/* Column 3: Field Assets & Telemetry */}
          <div className="rounded border border-line-2 bg-surface-2/60 p-2.5 space-y-2">
            <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wider block mb-1">
              FIELD ASSETS & PERIMETERS
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-surface/50 border border-line-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 rotate-45 items-center justify-center rounded border border-white bg-blue-600 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(59,130,246,0.6)]">
                    <span className="-rotate-45">U</span>
                  </span>
                  <span className="text-ink-900 font-semibold">Dispatched Unit</span>
                </div>
                <span className="text-[10px] text-action font-mono">LIVE GPS</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-surface/50 border border-line-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-900 bg-yellow-500 text-[9px] font-bold text-slate-950 shadow-[0_0_6px_rgba(234,179,8,0.6)]">
                    S
                  </span>
                  <span className="text-ink-900 font-semibold">Telemetry Sensor</span>
                </div>
                <span className="text-[10px] text-yellow-400 font-mono">DATA FEED</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-surface/50 border border-line-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#EF4444]" />
                  <span className="text-ink-900 font-semibold">Hazard Perimeter</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono">500M ZONE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

