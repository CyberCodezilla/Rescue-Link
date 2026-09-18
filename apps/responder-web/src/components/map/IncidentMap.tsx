'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getCategory, CATEGORY_LABELS } from '@responder/lib/schema';
import type { HazardZone, IncidentResponse, Priority, SensorReading, UnitPosition } from '@responder/lib/schema';
import { haversineDistanceMeters, estimateEtaMinutes, formatDistance } from '@responder/lib/geo';

const FALLBACK_CENTER: [number, number] = [20.5937, 78.9629];
const FALLBACK_ZOOM = 5;
const FOCUSED_ZOOM = 15;
const HOVER_ZOOM = 9;

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#10B981',
  pending_triage: '#64748B',
};

const SENSOR_STATUS_COLOR: Record<SensorReading['status'], string> = {
  normal: '#10B981',
  watch: '#EAB308',
  critical: '#EF4444',
};

const HAZARD_SEVERITY_COLOR: Record<HazardZone['severity'], string> = {
  watch: '#EAB308',
  warning: '#F97316',
  critical: '#EF4444',
};

function markerIcon(priority: Priority, isSelected: boolean) {
  const size = isSelected ? 22 : 16;
  const color = PRIORITY_COLOR[priority] || '#3B82F6';
  return L.divIcon({
    className: 'incident-marker-icon',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${isSelected ? `<span class="animate-ping" style="position:absolute;width:100%;height:100%;border-radius:50%;background:${color};opacity:0.6;"></span>` : ''}
        <span style="
          display:block;
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          border:2px solid #FFFFFF;
          box-shadow:0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.6);
        "></span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function sensorIcon(status: SensorReading['status']) {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:18px;height:18px;border-radius:3px;
      background:${SENSOR_STATUS_COLOR[status]};
      border:2px solid #FFFFFF;
      box-shadow:0 0 8px ${SENSOR_STATUS_COLOR[status]};
      color:#fff;font-size:10px;font-weight:800;line-height:1;font-family:monospace;
    ">S</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function unitIcon() {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:20px;height:20px;border-radius:3px;
      background:#3B82F6;
      border:2px solid #FFFFFF;
      box-shadow:0 0 10px #3B82F6;
      color:#fff;font-size:10px;font-weight:800;line-height:1;
      transform:rotate(45deg);font-family:monospace;
    "><span style="transform:rotate(-45deg);">U</span></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export type GeofenceShape =
  | { kind: 'circle'; center: { lat: number; lng: number }; radiusMeters: number }
  | { kind: 'polygon'; points: { lat: number; lng: number }[] };

export interface IncidentMapProps {
  incidents: IncidentResponse[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  sensors?: SensorReading[];
  hazardZones?: HazardZone[];
  unitPositions?: UnitPosition[];
  showSensors?: boolean;
  showHazardZones?: boolean;
  showUnits?: boolean;
  geofenceEnabled?: boolean;
  onGeofenceChange?: (shape: GeofenceShape | null) => void;
}

export function IncidentMap({
  incidents,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  sensors = [],
  hazardZones = [],
  unitPositions = [],
  showSensors = false,
  showHazardZones = false,
  showUnits = false,
  geofenceEnabled = false,
  onGeofenceChange,
}: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const reticleLayerRef = useRef<L.LayerGroup | null>(null);
  const sensorLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardLayerRef = useRef<L.LayerGroup | null>(null);
  const unitLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any | null>(null);

  const plottable = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.location &&
        typeof incident.location.lat === 'number' &&
        typeof incident.location.lng === 'number' &&
        !Number.isNaN(incident.location.lat) &&
        !Number.isNaN(incident.location.lng)
    );
  }, [incidents]);

  const unitsByName = useMemo(() => {
    const map = new Map<string, UnitPosition>();
    unitPositions.forEach((p) => map.set(p.unitName, p));
    return map;
  }, [unitPositions]);

  // Map Init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      zoomControl: true,
    });

    const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const tileAttr = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION || '&copy; OpenStreetMap &copy; CARTO';

    L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: 19,
    }).addTo(map);

    sensorLayerRef.current = L.layerGroup().addTo(map);
    hazardLayerRef.current = L.layerGroup().addTo(map);
    unitLayerRef.current = L.layerGroup().addTo(map);
    reticleLayerRef.current = L.layerGroup().addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Incident Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    plottable.forEach((incident) => {
      const { lat, lng, label } = incident.location;
      const isSelected = incident.id === selectedId;

      const marker = L.marker([lat, lng], { icon: markerIcon(incident.priority, isSelected) }).addTo(map);
      const category = CATEGORY_LABELS[getCategory(incident)];
      const locationLabel = label ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const priColor = PRIORITY_COLOR[incident.priority] || '#3B82F6';

      marker.bindPopup(
        `<div style="
          background:#0D1322;
          color:#E2E8F0;
          font-family:Inter,-apple-system,sans-serif;
          padding:10px 12px;
          min-width:200px;
          border-left:3px solid ${priColor};
          box-shadow:0 4px 14px rgba(0,0,0,0.7);
        ">
          <div style="font-family:monospace;font-size:10px;color:#94A3B8;letter-spacing:0.05em;text-transform:uppercase;">
            INCIDENT // ${incident.id.slice(0, 8)}
          </div>
          <div style="font-size:14px;font-weight:700;color:#FFFFFF;margin-top:2px;">
            ${category}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11px;">
            <span style="background:${priColor}30;color:${priColor};border:1px solid ${priColor}50;padding:1px 6px;border-radius:2px;font-weight:700;text-transform:uppercase;font-size:10px;">
              ${incident.priority}
            </span>
            <span style="color:#94A3B8;">${locationLabel}</span>
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
            <a href="/incidents/${incident.id}" style="color:#38BDF8;font-size:11px;font-weight:700;text-decoration:none;">
              Full Tactical Dossier &rarr;
            </a>
          </div>
        </div>`,
        { className: 'hud-tactical-popup', offset: [0, -6] }
      );

      marker.on('click', () => onSelect(incident.id));
      if (onHover) {
        marker.on('mouseover', () => onHover(incident.id));
        marker.on('mouseout', () => onHover(null));
      }
      markersRef.current.set(incident.id, marker);
    });

    if (plottable.length > 0 && !selectedId && !hoveredId) {
      const bounds = L.latLngBounds(
        plottable.map((incident) => [incident.location.lat, incident.location.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
    }
  }, [plottable, onSelect, onHover]);

  // HOVER-TO-LOCATE: Smooth Pan + 50% Zoom + Target Reticle
  useEffect(() => {
    const map = mapRef.current;
    const reticleLayer = reticleLayerRef.current;
    if (!map || !reticleLayer) return;

    reticleLayer.clearLayers();
    if (!hoveredId) return;

    const incident = plottable.find((i) => i.id === hoveredId);
    if (!incident) return;

    const { lat, lng } = incident.location;
    const priColor = PRIORITY_COLOR[incident.priority] || '#3B82F6';

    // Smoothly pan to target
    map.panTo([lat, lng], { animate: true, duration: 0.5 });
    
    // Zoom 50% in if zoomed out
    if (map.getZoom() < HOVER_ZOOM) {
      map.setZoom(HOVER_ZOOM, { animate: true });
    }

    // Attach animated tactical radar crosshair
    const reticleIcon = L.divIcon({
      className: 'radar-target-reticle',
      html: `
        <div style="position:relative;width:64px;height:64px;margin-left:-32px;margin-top:-32px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <span class="animate-reticle-ping" style="
            position:absolute;width:44px;height:44px;border-radius:50%;
            border:2px solid ${priColor};
            box-shadow:0 0 16px ${priColor};
          "></span>
          <svg class="animate-reticle-spin" width="56" height="56" viewBox="0 0 56 56" style="position:absolute;">
            <circle cx="28" cy="28" r="22" stroke="${priColor}" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity="0.8"/>
            <line x1="28" y1="2" x2="28" y2="10" stroke="${priColor}" stroke-width="2"/>
            <line x1="28" y1="46" x2="28" y2="54" stroke="${priColor}" stroke-width="2"/>
            <line x1="2" y1="28" x2="10" y2="28" stroke="${priColor}" stroke-width="2"/>
            <line x1="46" y1="28" x2="54" y2="28" stroke="${priColor}" stroke-width="2"/>
          </svg>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
    });

    L.marker([lat, lng], { icon: reticleIcon, interactive: false }).addTo(reticleLayer);

    const marker = markersRef.current.get(hoveredId);
    if (marker && !marker.isPopupOpen()) {
      marker.openPopup();
    }
  }, [hoveredId, plottable]);

  // CLICK-TO-LOCK: Street-Level Zoom Lock (15)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const marker = markersRef.current.get(selectedId);
    if (marker) {
      map.flyTo(marker.getLatLng(), FOCUSED_ZOOM, { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedId]);

  // Sensors Layer
  useEffect(() => {
    const layer = sensorLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showSensors) return;

    sensors.forEach((sensor) => {
      const pct = sensor.thresholdPercent ?? Math.round((sensor.value / 100) * 100);
      const marker = L.marker([sensor.location.lat, sensor.location.lng], {
        icon: sensorIcon(sensor.status),
      });
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:13px;min-width:170px;">
           <strong>${sensor.label}</strong><br/>
           ${sensor.value}${sensor.unit} · ${pct}% of threshold<br/>
           Status: ${sensor.status.toUpperCase()}
         </div>`
      );
      layer.addLayer(marker);
    });
  }, [sensors, showSensors]);

  // Hazard Zone Layer
  useEffect(() => {
    const layer = hazardLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showHazardZones) return;

    hazardZones.forEach((zone) => {
      const label = zone.label || 'Hazard Zone';
      const kind = (zone.kind || 'hazard').toString();
      const severity = (zone.severity || 'warning').toString();
      const color = HAZARD_SEVERITY_COLOR[zone.severity] || '#f59e0b';

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color,
        fillColor: color,
        fillOpacity: 0.12,
        weight: 2,
      });
      circle.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:13px;">
           <strong>${label}</strong><br/>
           ${kind.toUpperCase()} · ${severity.toUpperCase()}
         </div>`
      );
      layer.addLayer(circle);
    });
  }, [hazardZones, showHazardZones]);

  // Field Unit Layer
  useEffect(() => {
    const layer = unitLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showUnits) return;

    plottable.forEach((incident) => {
      const assignedUnits = incident.triage?.assignedUnits || [];
      assignedUnits.forEach((unitName) => {
        const position = unitsByName.get(unitName);
        if (!position) return;

        const marker = L.marker([position.lat, position.lng], { icon: unitIcon() });
        const distance = haversineDistanceMeters(position, incident.location);
        const eta = estimateEtaMinutes(distance);

        marker.bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:13px;min-width:180px;">
             <strong>${unitName}</strong><br/>
             ${formatDistance(distance)} from incident ${incident.id}<br/>
             ~${eta} min ETA (straight-line estimate)
           </div>`
        );
        layer.addLayer(marker);
      });
    });
  }, [plottable, unitsByName, showUnits]);

  // Geofence Drawing
  useEffect(() => {
    const map = mapRef.current;
    const drawn = drawnItemsRef.current;
    if (!map || !drawn) return;

    if (!geofenceEnabled) {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
      return;
    }

    const drawControl = new (L.Control as any).Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: false },
        circle: {},
        rectangle: false,
        marker: false,
        circlemarker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawn,
        remove: true,
      },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
      const layer = e.layer;
      drawn.addLayer(layer);

      if (!onGeofenceChange) return;
      if (e.layerType === 'circle') {
        const center = layer.getLatLng();
        onGeofenceChange({
          kind: 'circle',
          center: { lat: center.lat, lng: center.lng },
          radiusMeters: layer.getRadius(),
        });
      } else if (e.layerType === 'polygon') {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        onGeofenceChange({
          kind: 'polygon',
          points: latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
        });
      }
    });

    return () => {
      map.removeControl(drawControl);
      drawControlRef.current = null;
    };
  }, [geofenceEnabled, onGeofenceChange]);

  return <div ref={containerRef} className="h-full w-full" />;
}
