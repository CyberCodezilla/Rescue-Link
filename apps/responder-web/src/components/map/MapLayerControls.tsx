'use client';

import React from 'react';
import { Layers, Activity, AlertTriangle, Radio, Crop } from 'lucide-react';

interface MapLayerControlsProps {
  showSensors: boolean;
  onToggleSensors: () => void;
  showHazardZones: boolean;
  onToggleHazardZones: () => void;
  showUnits: boolean;
  onToggleUnits: () => void;
  geofenceEnabled: boolean;
  onToggleGeofence: () => void;
}

function ToggleChip({
  label,
  active,
  onClick,
  icon,
  dotColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  dotColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs font-semibold transition-all shadow-sm ${
        active
          ? 'border-action bg-action/20 text-action shadow-[0_0_10px_rgba(59,130,246,0.3)]'
          : 'border-line-2 bg-surface-2/90 text-ink-500 hover:text-ink-700 hover:bg-surface-3'
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: active ? dotColor : '#475569' }}
        aria-hidden="true"
      />
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function MapLayerControls({
  showSensors,
  onToggleSensors,
  showHazardZones,
  onToggleHazardZones,
  showUnits,
  onToggleUnits,
  geofenceEnabled,
  onToggleGeofence,
}: MapLayerControlsProps) {
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-[1000] flex flex-wrap justify-end gap-1.5 rounded-lg border border-line bg-surface/90 p-2 shadow-panel backdrop-blur-md">
      <ToggleChip
        label="SENSORS"
        active={showSensors}
        onClick={onToggleSensors}
        icon={<Activity size={12} />}
        dotColor="#EAB308"
      />
      <ToggleChip
        label="HAZARD ZONES"
        active={showHazardZones}
        onClick={onToggleHazardZones}
        icon={<AlertTriangle size={12} />}
        dotColor="#EF4444"
      />
      <ToggleChip
        label="UNITS"
        active={showUnits}
        onClick={onToggleUnits}
        icon={<Radio size={12} />}
        dotColor="#3B82F6"
      />
      <ToggleChip
        label="GEOFENCE"
        active={geofenceEnabled}
        onClick={onToggleGeofence}
        icon={<Crop size={12} />}
        dotColor="#8B5CF6"
      />
    </div>
  );
}
