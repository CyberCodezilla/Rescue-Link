import { Router, Request, Response } from 'express';
import { getMockSensors, getMockHazardZones } from '../data/mockData';

export const telemetryRouter = Router();

// GET /api/sensors - Environmental Telemetry Sensors
telemetryRouter.get('/sensors', (req: Request, res: Response): void => {
  // TODO: When a real IoT pipeline is connected, query it here
  // and only fall back to getMockSensors() when USE_LOCAL_MOCK_STORE is true.
  const sensors = getMockSensors();
  res.status(200).json(sensors);
});

// GET /api/hazard-zones - Active Disaster Hazard Zones
telemetryRouter.get('/hazard-zones', (req: Request, res: Response): void => {
  // TODO: When a geospatial database is connected, query it here
  // and only fall back to getMockHazardZones() when USE_LOCAL_MOCK_STORE is true.
  const hazardZones = getMockHazardZones();
  res.status(200).json(hazardZones);
});
