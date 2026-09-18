import { Router, Request, Response } from 'express';
import { CONFIG } from '@rescue-link/config';
import { incidentStore } from '../store/incidentStore';
import { bedrockService } from '../services/bedrockService';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'rescue-link-api',
    environment: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString(),
    telemetry: {
      persistence: incidentStore.getStoreTelemetry(),
      aiCircuit: bedrockService.getCircuitTelemetry(),
    },
  });
});
