'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, Mountain, Flame, Shield } from 'lucide-react';
import { MapLegend, type MapMode } from './MapLegend';
import { CATEGORY_LABELS } from '@responder/lib/schema';
import type { Priority, UnitPosition } from '@responder/lib/schema';

export interface IncidentFocusMapProps {
  location: { lat: number; lng: number; label?: string };
  priority: Priority;
  category: string;
  incidentId: string;
  unitPositions?: UnitPosition[];
}

const MODE_CONFIG: Record<
  MapMode,
  { label: string; url: string; maxZoom: number; attribution: string; icon: React.ReactNode }
> = {
  satellite: {
    label: 'SATELLITE RECON',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri, DigitalGlobe &mdash; Photorealistic Aerial Imagery',
    icon: <Eye size={11} />,
  },
  topo: {
    label: 'TOPOGRAPHY & DEPTH',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri, USGS, NOAA &mdash; Elevation & Contours',
    icon: <Mountain size={11} />,
  },
  thermal: {
    label: 'THERMAL HAZARD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri, DigitalGlobe &mdash; False-Color Infrared Thermal Satellite Recon',
    icon: <Flame size={11} />,
  },
  tactical: {
    label: 'TACTICAL HUD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: '&copy; Esri &mdash; Low-Light Command Grid',
    icon: <Shield size={11} />,
  },
};

export function IncidentFocusMap({
  location,
  priority,
  category,
  incidentId,
  unitPositions = [],
}: IncidentFocusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const [activeMode, setActiveMode] = useState<MapMode>('satellite');

  const { lat, lng } = location;

  // 1. Map Initialization (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Add zoom control at bottom-right so it never collides with ribbons or switchers
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Exact Incident Point Marker: Precise Red Round Dot (no surrounding circles)
    const targetDotIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 14px;
        height: 14px;
        background-color: #EF4444;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6), 0 0 8px rgba(239,68,68,0.8);
      "></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7],
    });

    const marker = L.marker([lat, lng], { icon: targetDotIcon }).addTo(map);
    const categoryLabel = (CATEGORY_LABELS as Record<string, string>)[category] || category;

    marker.bindPopup(
      `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;min-width:180px;background:#0F172A;color:#F8FAFC;padding:6px;border-radius:4px;border:1px solid #EF4444;">
         <div style="color:#EF4444;font-weight:bold;font-size:11px;">EXACT INCIDENT FIX // ${priority.toUpperCase()}</div>
         <strong style="color:#FFFFFF;font-size:13px;">${categoryLabel}</strong><br/>
         <span style="color:#94A3B8;font-size:11px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span><br/>
         <span style="color:#38BDF8;font-size:10px;">ID: ${incidentId.slice(0, 8)}</span>
       </div>`
    );
    marker.openPopup();

    // Plot nearby field units
    unitPositions.forEach((unit) => {
      const uIcon = L.divIcon({
        className: '',
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          width:24px;height:24px;border-radius:4px;
          background:#3B82F6;border:2px solid #FFFFFF;
          color:#FFFFFF;font-family:monospace;font-size:11px;font-weight:bold;
          box-shadow:0 0 10px rgba(59,130,246,0.8);
          transform:rotate(45deg);
        "><span style="transform:rotate(-45deg);">${unit.unitName.slice(0, 2)}</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([unit.lat, unit.lng], { icon: uIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:monospace;font-size:11px;background:#1E293B;color:#FFF;padding:4px;border-radius:4px;">
             <strong>UNIT: ${unit.unitName}</strong><br/>
             GPS: ${unit.lat.toFixed(4)}, ${unit.lng.toFixed(4)}
           </div>`
        );
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, priority, category, incidentId, unitPositions]);

  // 2. Base Tile & Thermal Mode Switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const container = map.getContainer();

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    if (activeMode === 'thermal') {
      container.classList.add('leaflet-thermal-mode');
    } else {
      container.classList.remove('leaflet-thermal-mode');
    }

    const cfg = MODE_CONFIG[activeMode];
    const newBase = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    });
    newBase.addTo(map);
    baseLayerRef.current = newBase;
  }, [activeMode]);

  return (
    <div className="space-y-3 w-full">
      {/* 100% Visible Map Viewport with Exact Incident Red Dot - Zero Distracting Surrounding Circles */}
      <div className="relative h-80 sm:h-96 w-full rounded-lg border border-line-2 overflow-hidden bg-surface-2 shadow-panel">
        {/* Leaflet Map Canvas */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Mode Switcher HUD Bar (Top-Right) */}
        <div className="pointer-events-auto absolute top-2.5 right-2.5 z-[1000] flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 p-1 rounded-md backdrop-blur-md shadow-lg">
          {(Object.keys(MODE_CONFIG) as MapMode[]).map((modeKey) => {
            const isActive = activeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                onClick={() => setActiveMode(modeKey)}
                aria-pressed={isActive}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold tracking-wider transition-all ${
                  isActive
                    ? 'bg-action text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {MODE_CONFIG[modeKey].icon}
                <span className="hidden sm:inline">{MODE_CONFIG[modeKey].label}</span>
              </button>
            );
          })}
        </div>

        {/* Top HUD Telemetry Ribbon */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider z-[1000]">
          <span className="px-2.5 py-1 rounded bg-slate-950/85 border border-slate-700 text-action backdrop-blur-sm shadow">
            {MODE_CONFIG[activeMode].label} // 15.0x
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-950/85 border border-slate-700 text-red-400 backdrop-blur-sm shadow flex items-center gap-1.5 font-bold">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
            EXACT INCIDENT FIX
          </span>
        </div>
      </div>

      {/* OUTSIDE THE MAP: Dedicated Map Recon Legend in Dispatch Form */}
      <MapLegend currentMode={activeMode} />
    </div>
  );
}
