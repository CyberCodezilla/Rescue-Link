import { Router, Request, Response } from 'express';
import { CONFIG } from '@rescue-link/config';
import { Incident, IncidentSchema } from '@rescue-link/schema';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from '../services/eventStream';

export const workflowCallbackRouter = Router();

workflowCallbackRouter.post('/triage', async (req: Request, res: Response): Promise<void> => {
  const expected = CONFIG.LAMBDA_CALLBACK_SECRET;
  const received = req.header('x-rescuelink-callback-secret') || '';
  if (!expected || received !== expected) {
    res.status(401).json({ error: 'Unauthorized workflow callback' });
    return;
  }

  const parsed = IncidentSchema.safeParse(req.body?.incident);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid incident is required', details: parsed.error.format() });
    return;
  }
  const incident: Incident = parsed.data;

  const updated = await incidentStore.update(incident.id, incident);
  const finalIncident = updated || incident;
  eventStreamManager.broadcast({
    type: 'incident:updated',
    incident: finalIncident,
    timestamp: Date.now(),
  });

  res.status(200).json({ ok: true, incidentId: finalIncident.id });
});
