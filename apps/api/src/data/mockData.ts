/**
 * Mock / seed data for sensor telemetry and hazard zones.
 *
 * TODO: In production, replace these static arrays with queries to:
 *  - An IoT sensor pipeline (AWS IoT Core / Kinesis) for real-time sensor data
 *  - A geospatial database (PostGIS / DynamoDB) for hazard zone boundaries
 *
 * These mock values are used when CONFIG.USE_LOCAL_MOCK_STORE is true
 * or when no external data source is configured.
 */

export interface MockSensor {
  id: string;
  label: string;
  kind: string;
  type: string;
  value: number;
  unit: string;
  thresholdPercent: number;
  percentOfThreshold: number;
  status: string;
  location: { lat: number; lng: number };
  updatedAt: number;
}

export interface MockHazardZone {
  id: string;
  label: string;
  name: string;
  kind: string;
  hazardType: string;
  severity: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  description: string;
}

/** Returns mock sensor data with live-relative timestamps. */
export function getMockSensors(): MockSensor[] {
  return [
    {
      id: 'sensor-1',
      label: 'River Gauge #4 (High Water)',
      kind: 'water_level',
      type: 'water_level',
      value: 8.4,
      unit: 'm',
      thresholdPercent: 93,
      percentOfThreshold: 93,
      status: 'watch',
      location: { lat: 37.775, lng: -122.418 },
      updatedAt: Date.now() - 120000,
    },
    {
      id: 'sensor-2',
      label: 'Seismic Station Bravo',
      kind: 'seismic',
      type: 'seismic',
      value: 4.2,
      unit: 'M',
      thresholdPercent: 84,
      percentOfThreshold: 84,
      status: 'normal',
      location: { lat: 37.78, lng: -122.422 },
      updatedAt: Date.now() - 300000,
    },
    {
      id: 'sensor-3',
      label: 'Fire Perimeter Thermal Array',
      kind: 'fire_perimeter',
      type: 'fire_perimeter',
      value: 340,
      unit: '°C',
      thresholdPercent: 113,
      percentOfThreshold: 113,
      status: 'critical',
      location: { lat: 37.768, lng: -122.412 },
      updatedAt: Date.now() - 45000,
    },
  ];
}

/** Returns mock hazard zone polygons. */
export function getMockHazardZones(): MockHazardZone[] {
  return [
    {
      id: 'zone-flood-north',
      label: 'North River Basin Inundation Zone',
      name: 'North River Basin Inundation Zone',
      kind: 'flood',
      hazardType: 'flood',
      severity: 'warning',
      center: { lat: 37.7749, lng: -122.4194 },
      radiusMeters: 1500,
      description: 'Active flash flooding and rising water levels.',
    },
    {
      id: 'zone-landslide-east',
      label: 'East Ridge Soil Debris Risk Zone',
      name: 'East Ridge Soil Debris Risk Zone',
      kind: 'landslide',
      hazardType: 'landslide',
      severity: 'critical',
      center: { lat: 37.782, lng: -122.405 },
      radiusMeters: 800,
      description: 'Slope instability and debris flow warning.',
    },
  ];
}
