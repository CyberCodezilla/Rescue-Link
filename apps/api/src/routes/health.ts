import { Router, Request, Response } from 'express';
import { CONFIG } from '@rescue-link/config';
import { incidentStore } from '../store/incidentStore';
import { bedrockService } from '../services/bedrockService';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const persistence = incidentStore.getStoreTelemetry();
  const aiCircuit = bedrockService.getCircuitTelemetry();

  const isHealthy = !persistence.isProductionFallbackAlert;

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'rescue-link-api',
    environment: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString(),
    telemetry: {
      persistence,
      aiCircuit,
    },
  });
});
