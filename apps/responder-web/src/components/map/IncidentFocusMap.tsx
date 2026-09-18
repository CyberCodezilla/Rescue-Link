'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, Mountain, Flame, Shield, MapPin, ShieldAlert } from 'lucide-react';
import type { IncidentCategory, Priority, UnitPosition } from '@responder/lib/schema';
import { CATEGORY_LABELS } from '@responder/lib/schema';
import { MapLegend, type MapMode } from './MapLegend';

export interface IncidentFocusMapProps {
  location: { lat: number; lng: number; label?: string };
  priority: Priority;
  category: IncidentCategory;
  incidentId: string;
  unitPositions?: UnitPosition[];
}

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  pending_triage: '#94A3B8',
};

const MODE_CONFIG: Record<
  MapMode,
  { label: string; url: string; maxZoom: number; attribution: string; icon: React.ReactNode }
> = {
  satellite: {
    label: 'SATELLITE RECON',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri &mdash; Photorealistic Aerial Recon',
    icon: <Eye size={11} />,
  },
  topo: {
    label: 'TOPOGRAPHY & DEPTH',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: '&copy; Esri, USGS &mdash; Elevation & Contours',
    icon: <Mountain size={11} />,
  },
  thermal: {
    label: 'THERMAL HAZARD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: '&copy; Esri &mdash; Infrared Thermal Gradient',
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
  const thermalLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeMode, setActiveMode] = useState<MapMode>('satellite');

  const { lat, lng } = location;
  const color = PRIORITY_COLOR[priority] || '#EF4444';

  // 1. Map Initialization (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    thermalLayerRef.current = L.layerGroup().addTo(map);

    // 500m Hazard Exclusion Ring
    L.circle([lat, lng], {
      radius: 450,
      color: color,
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 8',
      fillColor: color,
      fillOpacity: 0.08,
    }).addTo(map);

    // 150m Immediate Hazard Core
    L.circle([lat, lng], {
      radius: 150,
      color: color,
      weight: 2.5,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.22,
    }).addTo(map);

    // Custom Tactical Beacon Target Marker
    const targetIcon = L.divIcon({
      className: '',
      html: `<div style="
        position:relative;
        display:flex;align-items:center;justify-content:center;
        width:40px;height:40px;
      ">
        <div style="
          position:absolute;
          width:40px;height:40px;
          border-radius:50%;
          border:2px solid ${color};
          animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity:0.8;
        "></div>
        <div style="
          width:18px;height:18px;
          background:${color};
          border:2.5px solid #FFFFFF;
          transform:rotate(45deg);
          box-shadow: 0 0 18px ${color};
        "></div>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([lat, lng], { icon: targetIcon }).addTo(map);
    const categoryLabel = CATEGORY_LABELS[category] || category;

    marker.bindPopup(
      `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;min-width:180px;background:#0F172A;color:#F8FAFC;padding:6px;border-radius:4px;border:1px solid ${color};">
         <div style="color:${color};font-weight:bold;font-size:11px;">TARGET FIX // ${priority.toUpperCase()}</div>
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
  }, [lat, lng, color, priority, category, incidentId, unitPositions]);

  // 2. Base Tile & Thermal Mode Switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    const cfg = MODE_CONFIG[activeMode];
    const newBase = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    });
    newBase.addTo(map);
    baseLayerRef.current = newBase;

    // Thermal layer handling
    const thermalLayer = thermalLayerRef.current;
    if (thermalLayer) {
      thermalLayer.clearLayers();
      if (activeMode === 'thermal') {
        // High-intensity thermal core
        L.circle([lat, lng], {
          radius: 800,
          color: '#EF4444',
          weight: 0,
          fillColor: '#EF4444',
          fillOpacity: 0.35,
        }).addTo(thermalLayer);

        // Radiant heat dispersal ring
        L.circle([lat, lng], {
          radius: 1400,
          color: '#F97316',
          weight: 0,
          fillColor: '#F97316',
          fillOpacity: 0.18,
        }).addTo(thermalLayer);
      }
    }
  }, [activeMode, lat, lng]);

  return (
    <div className="relative h-72 sm:h-80 w-full rounded-lg border border-line-2 overflow-hidden bg-surface-2 shadow-panel">
      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Mode Switcher HUD Bar (Top-Right) */}
      <div className="pointer-events-auto absolute top-2 right-2 z-[1000] flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 p-1 rounded-md backdrop-blur-md shadow-lg">
        {(Object.keys(MODE_CONFIG) as MapMode[]).map((modeKey) => {
          const isActive = activeMode === modeKey;
          return (
            <button
              key={modeKey}
              type="button"
              onClick={() => setActiveMode(modeKey)}
              aria-pressed={isActive}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-bold tracking-wider transition-all ${
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

      {/* Tactical HUD Reticle Overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 border border-action/40 rounded-full flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-action rounded-full animate-ping" />
        </div>
      </div>

      {/* Top HUD Telemetry Ribbon */}
      <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider z-[1000]">
        <span className="px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-action backdrop-blur-sm shadow">
          {MODE_CONFIG[activeMode].label} // 15.0x
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-950/85 border border-slate-700 text-status-resolved backdrop-blur-sm shadow hidden sm:inline">
          500M PERIMETER
        </span>
      </div>

      {/* Bottom Floating Dynamic Map Legend */}
      <MapLegend
        currentMode={activeMode}
        className="absolute bottom-2 left-2 z-[1000] scale-90 origin-bottom-left"
      />
    </div>
  );
}