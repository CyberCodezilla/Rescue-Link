'use client';

import React from 'react';
import {
  Waves,
  Activity,
  CloudRain,
  Flame,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import type { HazardZone, SensorReading } from '@/lib/schema';

interface SensorTelemetryPanelProps {
  sensors: SensorReading[];
  hazardZones: HazardZone[];
  hasLoaded: boolean;
  visible: boolean;
}

const SENSOR_ICONS: Record<SensorReading['kind'], React.ComponentType<{ size?: number; className?: string }>> = {
  water_level: Waves,
  seismic: Activity,
  weather: CloudRain,
  fire_perimeter: Flame,
};

const SENSOR_KIND_LABEL: Record<SensorReading['kind'], string> = {
  water_level: 'WATER LEVEL RADAR',
  seismic: 'SEISMIC ACCELEROMETER',
  weather: 'METEOROLOGICAL STATION',
  fire_perimeter: 'THERMAL FLIR PERIMETER',
};

const STATUS_CONFIG: Record<
  SensorReading['status'],
  {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  normal: {
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-500/50',
    badgeText: 'NOMINAL',
    icon: <CheckCircle2 size={12} className="text-emerald-400" />,
    glow: '',
  },
  watch: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/40',
    badgeBg: 'bg-amber-950 text-amber-400 border-amber-500/50',
    badgeText: 'WATCH',
    icon: <AlertCircle size={12} className="text-amber-400" />,
    glow: 'hud-glow-orange',
  },
  critical: {
    bg: 'bg-red-950/40',
    border: 'border-red-500/60',
    badgeBg: 'bg-red-950 text-red-400 border-red-500/60',
    badgeText: 'CRITICAL',
    icon: <AlertTriangle size={12} className="text-red-400" />,
    glow: 'hud-glow-red',
  },
};

const HAZARD_CONFIG: Record<
  HazardZone['severity'],
  {
    bg: string;
    border: string;
    badgeBg: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  watch: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/40',
    badgeBg: 'bg-amber-950 text-amber-400 border-amber-500/50',
    icon: <AlertCircle size={12} className="text-amber-400" />,
    glow: '',
  },
  warning: {
    bg: 'bg-orange-950/35',
    border: 'border-orange-500/50',
    badgeBg: 'bg-orange-950 text-orange-400 border-orange-500/60',
    icon: <AlertTriangle size={12} className="text-orange-400" />,
    glow: 'hud-glow-orange',
  },
  critical: {
    bg: 'bg-red-950/40',
    border: 'border-red-500/60',
    badgeBg: 'bg-red-950 text-red-400 border-red-500/60',
    icon: <AlertTriangle size={12} className="text-red-400" />,
    glow: 'hud-glow-red',
  },
};

export function SensorTelemetryPanel({ sensors, hazardZones, hasLoaded, visible }: SensorTelemetryPanelProps) {
  if (!visible) return null;

  if (hasLoaded && sensors.length === 0 && hazardZones.length === 0) {
    return (
      <div className="hud-panel border-dashed border-line-2 bg-surface/50 p-3.5 text-center font-mono text-xs text-ink-500">
        NO ENVIRONMENTAL SENSORS OR ACTIVE HAZARD PERIMETERS DETECTED IN THIS SECTOR
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Sensor telemetry cards */}
      {sensors.map((sensor) => {
        const config = STATUS_CONFIG[sensor.status] || STATUS_CONFIG.normal;
        const IconComponent = SENSOR_ICONS[sensor.kind] || Radio;

        return (
          <div
            key={sensor.id}
            className={`hud-panel p-3 border ${config.border} ${config.bg} ${config.glow} transition-all duration-150`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-2 border border-line-2 text-action">
                  <IconComponent size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs font-bold text-ink-900">{sensor.label}</p>
                    <span className={`hud-tag border flex items-center gap-1 text-[10px] ${config.badgeBg}`}>
                      {config.icon}
                      <span>{config.badgeText}</span>
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
                    {SENSOR_KIND_LABEL[sensor.kind]} // ID: {sensor.id}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-sm font-bold tracking-tight text-ink-900">
                  {sensor.value}{' '}
                  <span className="text-[11px] font-normal text-ink-500">{sensor.unit}</span>
                </p>
                <p className="font-mono text-[11px] font-semibold text-ink-500">
                  <span
                    className={
                      sensor.thresholdPercent >= 90
                        ? 'text-red-400 font-bold'
                        : sensor.thresholdPercent >= 70
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400'
                    }
                  >
                    {sensor.thresholdPercent}%
                  </span>{' '}
                  THRESHOLD
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Hazard Zone cards */}
      {hazardZones.map((zone) => {
        const config = HAZARD_CONFIG[zone.severity] || HAZARD_CONFIG.warning;

        return (
          <div
            key={zone.id}
            className={`hud-panel p-3 border ${config.border} ${config.bg} ${config.glow} transition-all duration-150`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-2 border border-line-2 text-orange-400">
                  <Flame size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs font-bold text-ink-900">{zone.label}</p>
                    <span className={`hud-tag border flex items-center gap-1 text-[10px] ${config.badgeBg}`}>
                      {config.icon}
                      <span className="uppercase">{zone.severity}</span>
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
                    ZONE TYPE: {zone.kind.toUpperCase()} // RADIUS: {zone.radiusMeters}M
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-ink-500">
                <span className="rounded bg-surface-2 px-2 py-0.5 border border-line-2 font-bold text-ink-700">
                  PERIMETER ACTIVE
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
