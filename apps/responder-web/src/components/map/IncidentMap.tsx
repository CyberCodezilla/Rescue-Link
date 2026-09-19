'use client';

import { Mountain } from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getCategory, CATEGORY_LABELS } from '@responder/lib/schema';
import type { HazardZone, IncidentResponse, Priority, SensorReading, UnitPosition } from '@responder/lib/schema';
import { MapLegend, type MapMode } from './MapLegend';
import { haversineDistanceMeters, estimateEtaMinutes, formatDistance } from '@responder/lib/geo';

const FALLBACK_CENTER: [number, number] = [20.5937, 78.9629];
const FALLBACK_ZOOM = 5;
const FOCUSED_ZOOM = 13;

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
  pending_triage: '#94A3B8',
};

const SENSOR_STATUS_COLOR: Record<SensorReading['status'], string> = {
  normal: '#22C55E',
  watch: '#EAB308',
  critical: '#EF4444',
};

const HAZARD_SEVERITY_COLOR: Record<HazardZone['severity'], string> = {
  watch: '#EAB308',
  warning: '#F97316',
  critical: '#EF4444',
};

function markerIcon(_priority: Priority, isSelected: boolean) {
  const size = isSelected ? 16 : 12;
  const border = isSelected ? '2.5px solid #FFFFFF' : '2px solid #FFFFFF';
  const shadow = isSelected
    ? 'box-shadow: 0 0 10px #EF4444, 0 2px 5px rgba(0,0,0,0.7); transform: scale(1.2);'
    : 'box-shadow: 0 2px 4px rgba(0,0,0,0.6), 0 0 4px rgba(239,68,68,0.7);';

  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;"><div style="width:${size}px;height:${size}px;border-radius:50%;background-color:#EF4444;border:${border};${shadow}"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function sensorIcon(status: SensorReading['status']) {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:18px;height:18px;border-radius:4px;
      background:${SENSOR_STATUS_COLOR[status]};
      border:2px solid #0B0F19;
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
      width:20px;height:20px;border-radius:4px;
      background:#3B82F6;
      border:2px solid #FFFFFF;
      box-shadow:0 0 10px rgba(59,130,246,0.6);
      color:#fff;font-size:11px;font-weight:800;line-height:1;font-family:monospace;
      transform:rotate(45deg);
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
  currentMode?: MapMode;
  onSelectMode?: (mode: MapMode) => void;
  onSelect: (id: string) => void;
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
  currentMode,
  onSelectMode,
  onSelect,
  sensors = [],
  hazardZones = [],
  unitPositions = [],
  showSensors = false,
  showHazardZones = false,
  showUnits = false,
  geofenceEnabled = false,
  onGeofenceChange,
}: IncidentMapProps) {
  const [internalMode, setInternalMode] = useState<MapMode>('satellite');
  const activeMode = currentMode ?? internalMode;
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const thermalLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const sensorLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardLayerRef = useRef<L.LayerGroup | null>(null);
  const unitLayerRef = useRef<L.LayerGroup | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any | null>(null);
  const onGeofenceChangeRef = useRef(onGeofenceChange);
  onGeofenceChangeRef.current = onGeofenceChange;

  const plottable = incidents;

  const unitsByName = useMemo(() => {
    const map = new Map<string, UnitPosition>();
    unitPositions.forEach((p) => map.set(p.unitName, p));
    return map;
  }, [unitPositions]);

  // Map init (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      zoomControl: true,
    });

    sensorLayerRef.current = L.layerGroup().addTo(map);
    hazardLayerRef.current = L.layerGroup().addTo(map);
    unitLayerRef.current = L.layerGroup().addTo(map);
    thermalLayerRef.current = L.layerGroup().addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);


  // Dynamic Smart Multi-Map Base Tile Layer & Thermal Overlay Switcher
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 16;
    let maxNativeZoom: number | undefined = undefined;
    let subdomains: string[] = ['a', 'b', 'c'];
    let attribution = '&copy; Esri &mdash; Tactical Dark HUD';

    const container = map.getContainer();
    if (activeMode === 'satellite') {
      container.classList.remove('leaflet-thermal-mode');
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
      attribution = '&copy; Esri, DigitalGlobe, Earthstar Geographics &mdash; Photorealistic Satellite Recon';
    } else if (activeMode === 'topo') {
      container.classList.remove('leaflet-thermal-mode');
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      maxZoom = 18;
      maxNativeZoom = 17;
      subdomains = ['a', 'b', 'c'];
      attribution = '&copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
    } else if (activeMode === 'thermal') {
      container.classList.add('leaflet-thermal-mode');
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
      attribution = '&copy; Esri, DigitalGlobe &mdash; False-Color Infrared Satellite Thermal Recon';
    } else {
      container.classList.remove('leaflet-thermal-mode');
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 16;
      attribution = '&copy; Esri &mdash; Tactical Dark HUD';
    }

    const newBase = L.tileLayer(tileUrl, { maxZoom, maxNativeZoom, subdomains, attribution });
    newBase.addTo(map);
    baseLayerRef.current = newBase;

    // Handle Thermal Gradient Overlay
    const thermalLayer = thermalLayerRef.current;
    if (thermalLayer) {
      thermalLayer.clearLayers();
      if (activeMode === 'thermal') {
        // Pure false-color thermal infrared satellite map without distracting incident circles
        // Only sensor perimeters if active
        sensors.forEach((s) => {
          if (s.kind === 'fire_perimeter' && s.status === 'critical') {
            L.circle([s.location.lat, s.location.lng], {
              radius: 400,
              color: '#F43F5E',
              weight: 1,
              fillColor: '#F43F5E',
              fillOpacity: 0.2,
            }).addTo(thermalLayer);
          }
        });
      }
    }
  }, [activeMode, plottable, sensors]);

  // Incident markers
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

      marker.bindPopup(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;min-width:170px;background:#131A2B;color:#F8FAFC;padding:4px;border-radius:4px;">
           <strong style="color:#3B82F6;">${incident.id}</strong><br/>
           <span style="color:#CBD5E1;">${category} // ${incident.priority.toUpperCase()}</span><br/>
           <span style="color:#8A93A3;font-size:11px;">${locationLabel}</span><br/>
           <div style="margin-top:6px;"><a href="/incidents/${incident.id}" style="color:#60A5FA;text-decoration:none;font-weight:bold;">TACTICAL DETAILS &rarr;</a></div>
         </div>`
      );

      marker.on('click', () => onSelect(incident.id));
      markersRef.current.set(incident.id, marker);
    });

    if (plottable.length > 0) {
      const bounds = L.latLngBounds(
        plottable.map((incident) => [incident.location.lat, incident.location.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
    } else {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
    }
  }, [plottable]);


  // Hover zoom (zooms in 60% at the respective incident location on hover)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hoveredId) return;
    const marker = markersRef.current.get(hoveredId);
    if (marker) {
      const targetLatLng = marker.getLatLng();
      map.flyTo(targetLatLng, 13, {
        animate: true,
        duration: 0.5,
      });
      marker.openPopup();
    }
  }, [hoveredId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), FOCUSED_ZOOM));
      marker.openPopup();
    }
  }, [selectedId]);

  // Sensor layer
  useEffect(() => {
    const layer = sensorLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showSensors) return;

    sensors.forEach((sensor) => {
      const pct = sensor.thresholdPercent ?? (sensor as any).percentOfThreshold ?? 0;
      const statusStr = (sensor.status || 'normal').toString();
      const marker = L.marker([sensor.location.lat, sensor.location.lng], {
        icon: sensorIcon(sensor.status),
      });
      marker.bindPopup(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;min-width:170px;background:#131A2B;color:#F8FAFC;padding:4px;border-radius:4px;">
           <strong style="color:#EAB308;">${sensor.label}</strong><br/>
           ${sensor.value}${sensor.unit} // ${pct}% threshold<br/>
           STATUS: <strong style="color:${SENSOR_STATUS_COLOR[sensor.status]}">${statusStr.toUpperCase()}</strong>
         </div>`
      );
      layer.addLayer(marker);
    });
  }, [sensors, showSensors]);

  // Hazard zone layer
  useEffect(() => {
    const layer = hazardLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showHazardZones) return;

    hazardZones.forEach((zone) => {
      const label = zone.label || (zone as any).name || 'Hazard Zone';
      const kind = (zone.kind || (zone as any).hazardType || 'hazard').toString();
      const severity = (zone.severity || 'warning').toString();
      const color = HAZARD_SEVERITY_COLOR[zone.severity] || '#F59E0B';

      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radiusMeters,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      });
      circle.bindPopup(
        `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;background:#131A2B;color:#F8FAFC;padding:4px;border-radius:4px;">
           <strong style="color:${color}">${label}</strong><br/>
           TYPE: ${kind.toUpperCase()}<br/>
           SEVERITY: ${severity.toUpperCase()}
         </div>`
      );
      layer.addLayer(circle);
    });
  }, [hazardZones, showHazardZones]);

  // Field unit layer
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
          `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;min-width:180px;background:#131A2B;color:#F8FAFC;padding:4px;border-radius:4px;">
             <strong style="color:#60A5FA;">${unitName}</strong><br/>
             DISTANCE: ${formatDistance(distance)}<br/>
             EST. ETA: ~<strong style="color:#34D399">${eta} MIN</strong>
           </div>`
        );
        layer.addLayer(marker);
      });
    });
  }, [plottable, unitsByName, showUnits]);

  // Geofence drawing
  useEffect(() => {
    const map = mapRef.current;
    const drawnItems = drawnItemsRef.current;
    if (!map || !drawnItems) return;

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
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    function emitShape() {
      const layers = drawnItems!.getLayers();
      const first = layers[0];
      if (!first) {
        onGeofenceChangeRef.current?.(null);
        return;
      }
      if (first instanceof L.Circle) {
        const center = first.getLatLng();
        onGeofenceChangeRef.current?.({
          kind: 'circle',
          center: { lat: center.lat, lng: center.lng },
          radiusMeters: first.getRadius(),
        });
        return;
      }
      if (first instanceof L.Polygon) {
        const latLngs = (first.getLatLngs() as any)[0] as L.LatLng[];
        onGeofenceChangeRef.current?.({
          kind: 'polygon',
          points: latLngs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
        });
      }
    }

    const onCreated = (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      emitShape();
    };

    const onEdited = () => emitShape();
    const onDeleted = () => {
      drawnItems.clearLayers();
      emitShape();
    };

    map.on((L as any).Draw.Event.CREATED, onCreated);
    map.on((L as any).Draw.Event.EDITED, onEdited);
    map.on((L as any).Draw.Event.DELETED, onDeleted);

    return () => {
      map.off((L as any).Draw.Event.CREATED, onCreated);
      map.off((L as any).Draw.Event.EDITED, onEdited);
      map.off((L as any).Draw.Event.DELETED, onDeleted);
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [geofenceEnabled]);

  return (
    <div className="relative h-full w-full rounded-lg border border-line-2 overflow-hidden bg-surface-2 shadow-panel">
      <div
        ref={containerRef}
        className="h-full w-full bg-canvas relative z-0"
        tabIndex={0}
        aria-label="Tactical incident map"
      />

      {/* Accurate Topographic Height & Depth Telemetry Bar (Active in Topo Mode) */}
      {activeMode === 'topo' && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-2 font-mono text-[11px] bg-slate-950/92 border border-amber-500/70 text-amber-400 p-2 rounded-md shadow-xl backdrop-blur-md max-w-sm sm:max-w-md">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <Mountain size={13} className="text-amber-400" />
            <span>HEIGHT & DEPTH RECON:</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40 text-[10px]">
            CONTOURS: 10M & 20M ISOHYPSES
          </span>
          <span className="text-emerald-300 text-[10px]">
            DATUM: <strong>MEAN SEA LEVEL</strong>
          </span>
          <div className="w-full text-[10px] text-amber-200/80 font-sans border-t border-amber-500/30 pt-1 mt-0.5">
            Terrain Profile: <strong>SRTM Contour Isolines &amp; Shaded Relief</strong>
          </div>
        </div>
      )}
    </div>
  );
}





