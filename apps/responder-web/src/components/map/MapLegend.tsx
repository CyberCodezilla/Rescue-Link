'use client';

import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Layers, Flame, Mountain, Eye, Shield } from 'lucide-react';
import type { Priority } from '@responder/lib/schema';

export type MapMode = 'satellite' | 'topo' | 'thermal' | 'tactical';

interface MapLegendProps {
  currentMode: MapMode;
  className?: string;
}

export function MapLegend({ currentMode, className = '' }: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

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
          {/* Active Mode Dynamic Legend */}
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

          {/* Incident Priority Marker Shapes */}
          <div>
            <span className="text-[10px] font-bold uppercase text-ink-500 tracking-wider block mb-1">
              PRIORITY MARKER GEOMETRY
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rotate-45 border border-white bg-red-500 shadow-[0_0_6px_#EF4444]" />
                <span className="text-red-400 font-bold">CRITICAL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-0 w-0 border-x-[5px] border-x-transparent border-b-[9px] border-b-orange-500" />
                <span className="text-orange-400 font-bold">HIGH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rotate-45 border border-amber-400 bg-amber-500" />
                <span className="text-amber-400 font-bold">MEDIUM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-400 bg-slate-800" />
                <span className="text-slate-400 font-bold">PENDING</span>
              </div>
            </div>
          </div>

          {/* Field Assets Icons */}
          <div className="border-t border-line-2 pt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 rotate-45 items-center justify-center rounded border border-white bg-blue-600 text-[9px] font-bold text-white">
                <span className="-rotate-45">U</span>
              </span>
              <span className="text-ink-700">Units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-900 bg-yellow-500 text-[9px] font-bold text-slate-950">
                S
              </span>
              <span className="text-ink-700">Sensors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-ink-700">Hazards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}