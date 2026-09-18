import type { HazardZone, IncidentResponse, SensorReading, UnitPosition } from './schema';

export interface DashboardMapLayerData {
  sensors: SensorReading[];
  hazardZones: HazardZone[];
  unitPositions: UnitPosition[];
}

export function buildDashboardMapLayerData(
  sensors: SensorReading[],
  hazardZones: HazardZone[],
  unitPositions: UnitPosition[]
): DashboardMapLayerData {
  return { sensors, hazardZones, unitPositions };
}

export function hasDistressAudio(incident: Pick<IncidentResponse, 'audioBlob'>): boolean {
  return typeof incident.audioBlob === 'string' && incident.audioBlob.trim().length > 0;
}
