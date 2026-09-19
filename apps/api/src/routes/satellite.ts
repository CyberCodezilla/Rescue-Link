import { Router, Request, Response } from 'express';
import { SatelliteUplinkRequestSchema } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';
import { satelliteIngressService } from '../services/satelliteIngressService';
import { safeCompare } from '../middleware/auth';
import { IncidentPersistenceError } from '../store/incidentStore';

export const satelliteRouter = Router();

satelliteRouter.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'satellite-uplink',
    enabled: Boolean(CONFIG.SATELLITE_API_KEY),
    wireLimitBytes: 100,
  });
});

satelliteRouter.post('/uplink', async (req: Request, res: Response): Promise<void> => {
  const configuredKey = CONFIG.SATELLITE_API_KEY;
  if (!configuredKey) {
    res.status(503).json({ error: 'Satellite uplink is not configured' });
    return;
  }

  const providedKey = req.header('x-satellite-api-key');
  if (!providedKey || !safeCompare(providedKey, configuredKey)) {
    res.status(401).json({ error: 'Unauthorized satellite uplink' });
    return;
  }

  const parsed = SatelliteUplinkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid satellite uplink payload',
      details: parsed.error.format(),
    });
    return;
  }

  try {
    const result = await satelliteIngressService.ingest(parsed.data);
    res.status(result.duplicate ? 200 : 202).json(result);
  } catch (error) {
    if (error instanceof IncidentPersistenceError) {
      res.status(503).json({ error: 'Satellite incident persistence is temporarily unavailable' });
      return;
    }
    const message = error instanceof Error ? error.message : 'Invalid satellite packet';
    res.status(400).json({ error: message });
  }
});
