'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { IncidentCategory, Priority, UnitPosition } from '@responder/lib/schema';
import { CATEGORY_LABELS } from '@responder/lib/schema';

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

export function IncidentFocusMap({
  location,
  priority,
  category,
  incidentId,
  unitPositions = [],
}: IncidentFocusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const { lat, lng } = location;

    // Tactical focused map zoomed in directly at target coordinates (zoom 15)
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark canvas tile layer without watermarks
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
    }).addTo(map);

    const color = PRIORITY_COLOR[priority] || '#EF4444';

    // 500m Hazard & Perimeter Exclusion Ring
    L.circle([lat, lng], {
      radius: 450,
      color: color,
      weight: 1.5,
      opacity: 0.8,
      dashArray: '5, 8',
      fillColor: color,
      fillOpacity: 0.08,
    }).addTo(map);

    // 150m Immediate Danger Core Ring
    L.circle([lat, lng], {
      radius: 150,
      color: color,
      weight: 2,
      opacity: 0.9,
      fillColor: color,
      fillOpacity: 0.18,
    }).addTo(map);

    // Custom Tactical Beacon Target Marker
    const targetIcon = L.divIcon({
      className: '',
      html: `<div style="
        position:relative;
        display:flex;align-items:center;justify-content:center;
        width:36px;height:36px;
      ">
        <div style="
          position:absolute;
          width:36px;height:36px;
          border-radius:50%;
          border:2px solid ${color};
          animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity:0.75;
        "></div>
        <div style="
          width:16px;height:16px;
          background:${color};
          border:2.5px solid #FFFFFF;
          transform:rotate(45deg);
          box-shadow: 0 0 16px ${color};
        "></div>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
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

    // Plot nearby units if available
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
  }, [location, priority, category, incidentId, unitPositions]);

  return (
    <div className="relative h-64 sm:h-72 w-full rounded border border-line-2 overflow-hidden bg-surface-2">
      {/* Leaflet Map Canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Tactical HUD Reticle Overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 border border-action/30 rounded-full flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-action rounded-full animate-ping" />
        </div>
      </div>

      {/* Top HUD Telemetry Ribbon */}
      <div className="pointer-events-none absolute top-2 left-2 right-2 flex items-center justify-between font-mono text-[10px] uppercase font-bold tracking-wider z-[1000]">
        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-action backdrop-blur-sm">
          RECON FIX // TARGET ZOOM (15.0x)
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-status-resolved backdrop-blur-sm">
          PERIMETER 500M
        </span>
      </div>

      {/* Bottom Coordinates Overlay */}
      <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 backdrop-blur-sm z-[1000]">
        GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </div>
    </div>
  );
}