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

const MODES: Array<{ id: MapMode; label: string; icon: React.ReactNode }> = [
  { id: 'satellite', label: 'SATELLITE', icon: <Eye size={12} /> },
  { id: 'topo', label: 'TOPO', icon: <Mountain size={12} /> },
  { id: 'thermal', label: 'THERMAL', icon: <Flame size={12} /> },
  { id: 'tactical', label: 'TACTICAL', icon: <Shield size={12} /> },
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
      className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider transition-colors shadow-sm ${
        active
          ? 'bg-[#1e293b] border-[#60a5fa] text-[#ffffff] shadow-[0_0_8px_rgba(59,130,246,0.4)]'
          : 'bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]'
      }`}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: active ? dotColor : '#475569',
          boxShadow: active ? `0 0 6px ${dotColor}` : 'none',
        }}
        aria-hidden="true"
      />
      {icon}
      <span className="truncate">{label}</span>
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
    <div className="flex flex-col gap-1.5 w-full">
      {/* Row 1: Base Map Mode Switcher (4 Equal Columns) */}
      <div className="grid grid-cols-4 gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#334155] shadow-sm">
        {MODES.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              aria-pressed={isActive}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md font-mono text-[10px] sm:text-[11px] font-bold tracking-wider transition-colors ${
                isActive
                  ? 'bg-[#2563eb] text-[#ffffff] border border-[#60a5fa] shadow-[0_0_10px_rgba(37,99,235,0.6)]'
                  : 'bg-[#1e293b] text-[#f1f5f9] border border-[#334155] hover:bg-[#334155] hover:text-white'
              }`}
            >
              {m.icon}
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Overlays / Feature Filters (4 Equal Columns) */}
      <div className="grid grid-cols-4 gap-1">
        <ToggleChip
          label="SENSORS"
          active={showSensors}
          onClick={onToggleSensors}
          icon={<Activity size={12} />}
          dotColor="#EAB308"
        />
        <ToggleChip
          label="HAZARDS"
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
    </div>
  );
}
