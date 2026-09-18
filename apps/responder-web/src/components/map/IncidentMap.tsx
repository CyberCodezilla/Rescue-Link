'use client';

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

function markerIcon(priority: Priority, isSelected: boolean) {
  const color = PRIORITY_COLOR[priority] || '#94A3B8';
  const shadow = isSelected ? `box-shadow: 0 0 15px ${color}; transform: scale(1.25);` : '';

  if (priority === 'critical') {
    // Critical: Pulsing Diamond ◆
    return L.divIcon({
      className: '',
      html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:20px;height:20px;
        ${shadow}
      ">
        <div style="
          width:13px;height:13px;
          background:${color};
          border:2px solid #FFFFFF;
          transform:rotate(45deg);
          box-shadow: 0 0 10px ${color};
        "></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  if (priority === 'high') {
    // High: Triangle-Up ▲
    return L.divIcon({
      className: '',
      html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:20px;height:20px;
        ${shadow}
      ">
        <div style="
          width: 0; height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 14px solid ${color};
          filter: drop-shadow(0 0 4px ${color});
        "></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  if (priority === 'pending_triage') {
    // Pending: Hollow Circle ○
    return L.divIcon({
      className: '',
      html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:18px;height:18px;
        ${shadow}
      ">
        <div style="
          width:12px;height:12px;
          border-radius:50%;
          border:2px solid ${color};
          background:#0B0F19;
        "></div>
      </div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  if (priority === 'low') {
    // Low: Small Circle
    return L.divIcon({
      className: '',
      html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:16px;height:16px;
        ${shadow}
      ">
        <div style="
          width:8px;height:8px;
          border-radius:50%;
          background:${color};
          border:1.5px solid #FFFFFF;
        "></div>
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  // Medium: Circle ●
  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:18px;height:18px;
      ${shadow}
    ">
      <div style="
        width:12px;height:12px;
        border-radius:50%;
        background:${color};
        border:2px solid #FFFFFF;
      "></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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
  const [internalMode, setInternalMode] = useState<MapMode>('tactical');
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
    let attribution = '&copy; Esri &mdash; Tactical Dark HUD';

    if (activeMode === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
      attribution = '&copy; Esri, DigitalGlobe, Earthstar Geographics &mdash; Photorealistic Satellite Recon';
    } else if (activeMode === 'topo') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
      attribution = '&copy; Esri, USGS, NOAA &mdash; Topographic Elevation & Contours';
    } else if (activeMode === 'thermal') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 16;
      attribution = '&copy; Esri &mdash; Infrared Thermal Heat Intensity Analysis';
    }

    const newBase = L.tileLayer(tileUrl, { maxZoom, attribution });
    newBase.addTo(map);
    baseLayerRef.current = newBase;

    // Handle Thermal Gradient Overlay
    const thermalLayer = thermalLayerRef.current;
    if (thermalLayer) {
      thermalLayer.clearLayers();
      if (activeMode === 'thermal') {
        // Draw heat intensity zones around incidents
        plottable.forEach((inc) => {
          const { lat, lng } = inc.location;
          const isCritical = inc.priority === 'critical';
          const radius = isCritical ? 1800 : 1000;
          const heatColor = isCritical ? '#EF4444' : inc.priority === 'high' ? '#F97316' : '#EAB308';

          // Outer ambient thermal heat glow
          L.circle([lat, lng], {
            radius: radius * 1.5,
            color: heatColor,
            weight: 0,
            fillColor: heatColor,
            fillOpacity: 0.12,
          }).addTo(thermalLayer);

          // Core thermal intensity center
          L.circle([lat, lng], {
            radius: radius * 0.6,
            color: heatColor,
            weight: 1,
            fillColor: heatColor,
            fillOpacity: 0.28,
          }).addTo(thermalLayer);
        });

        // Overlay sensor heat points
        sensors.forEach((s) => {
          if (s.kind === 'fire_perimeter' || s.status === 'critical') {
            L.circle([s.location.lat, s.location.lng], {
              radius: 600,
              color: '#F43F5E',
              weight: 1,
              fillColor: '#F43F5E',
              fillOpacity: 0.25,
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
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full bg-canvas relative z-0"
        tabIndex={0}
        aria-label="Tactical incident map"
      />
      <MapLegend currentMode={activeMode} className="absolute bottom-3 left-3 z-[1000]" />
    </div>
  );
}
