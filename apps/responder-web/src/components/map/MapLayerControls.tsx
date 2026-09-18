'use client';

import React from 'react';
import { Eye, Mountain, Flame, Shield, Activity, AlertTriangle, Radio, Crop } from 'lucide-react';
import type { MapMode } from './MapLegend';

interface MapLayerControlsProps {
  currentMode: MapMode;
  onSelectMode: (mode: MapMode) => void;
  showSensors: boolean;
  onToggleSensors: () => void;
  showHazardZones: boolean;
  onToggleHazardZones: () => void;
  showUnits: boolean;
  onToggleUnits: () => void;
  geofenceEnabled: boolean;
  onToggleGeofence: () => void;
}

const MODES: Array<{ id: MapMode; label: string; icon: React.ReactNode; color: string }> = [
  { id: 'satellite', label: 'SATELLITE', icon: <Eye size={12} />, color: '#10B981' },
  { id: 'topo', label: 'TOPO', icon: <Mountain size={12} />, color: '#F59E0B' },
  { id: 'thermal', label: 'THERMAL', icon: <Flame size={12} />, color: '#F43F5E' },
  { id: 'tactical', label: 'TACTICAL', icon: <Shield size={12} />, color: '#38BDF8' },
];

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
      className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[11px] font-semibold transition-all shadow-sm ${
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
  currentMode,
  onSelectMode,
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
    <div className="pointer-events-auto absolute right-3 top-3 z-[1000] flex flex-col gap-1.5 rounded-lg border border-line bg-surface/95 p-2 shadow-panel backdrop-blur-md max-w-sm">
      {/* Base Map Mode Switcher */}
      <div className="flex items-center gap-1 bg-surface-2/80 p-1 rounded border border-line-2">
        {MODES.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              aria-pressed={isActive}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-bold tracking-wider transition-all ${
                isActive
                  ? 'bg-action text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'text-ink-500 hover:text-ink-900 hover:bg-surface'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overlays / Feature Filters */}
      <div className="flex flex-wrap justify-end gap-1 pt-0.5">
        <ToggleChip
          label="SENSORS"
          active={showSensors}
          onClick={onToggleSensors}
          icon={<Activity size={11} />}
          dotColor="#EAB308"
        />
        <ToggleChip
          label="HAZARDS"
          active={showHazardZones}
          onClick={onToggleHazardZones}
          icon={<AlertTriangle size={11} />}
          dotColor="#EF4444"
        />
        <ToggleChip
          label="UNITS"
          active={showUnits}
          onClick={onToggleUnits}
          icon={<Radio size={11} />}
          dotColor="#3B82F6"
        />
        <ToggleChip
          label="GEOFENCE"
          active={geofenceEnabled}
          onClick={onToggleGeofence}
          icon={<Crop size={11} />}
          dotColor="#8B5CF6"
        />
      </div>
    </div>
  );
}