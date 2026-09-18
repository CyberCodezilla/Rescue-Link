import { Router, Request, Response } from 'express';
import { CONFIG } from '@rescue-link/config';
import { bedrockService } from '../services/bedrockService';
import { incidentStore } from '../store/incidentStore';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
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
