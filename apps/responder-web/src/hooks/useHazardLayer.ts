'use client';

import { useEffect, useState } from 'react';
import { getHazardZones, getSensors } from '@/lib/api';
import type { HazardZone, SensorReading } from '@/lib/schema';

const POLL_INTERVAL_MS = 60_000;

// Persistent memory cache across client navigations
let memorySensors: SensorReading[] = [];
let memoryHazardZones: HazardZone[] = [];
let memoryHasLoaded = false;

interface UseHazardLayerState {
  sensors: SensorReading[];
  hazardZones: HazardZone[];
  hasLoaded: boolean;
}

export function useHazardLayer(): UseHazardLayerState {
  const [sensors, setSensors] = useState<SensorReading[]>(memorySensors);
  const [hazardZones, setHazardZones] = useState<HazardZone[]>(memoryHazardZones);
  const [hasLoaded, setHasLoaded] = useState(memoryHasLoaded);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const [sensorData, zoneData] = await Promise.all([
          getSensors(controller.signal),
          getHazardZones(controller.signal),
        ]);
        if (cancelled) return;
        memorySensors = sensorData;
        memoryHazardZones = zoneData;
        memoryHasLoaded = true;

        setSensors(sensorData);
        setHazardZones(zoneData);
        setHasLoaded(true);
      } catch (err: unknown) {
        if (cancelled || (err as { name?: string })?.name === 'AbortError') {
          return;
        }
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { sensors, hazardZones, hasLoaded };
}

export const useTelemetryLayer = useHazardLayer;
