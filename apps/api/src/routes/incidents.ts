import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  SOSSubmissionSchema,
  Incident,
  IncidentStatusEnum,
  PriorityEnum,
  IncidentTriageSchema,
} from '@rescue-link/schema';
import { incidentStore } from '../store/incidentStore';
import { triageWorkflow } from '../services/triageWorkflow';
import { translateDistressMessage } from '../services/translationService';
import { eventStreamManager } from '../services/eventStream';
import { LifeSafetyTracer } from '../services/lifeSafetyTracer';
import { CONFIG } from '@rescue-link/config';
import { requireApiKey } from '../middleware/auth';
import { sosRateLimit } from '../middleware/rateLimit';

export const incidentsRouter = Router();

// POST /api/incidents - Create SOS Incident
incidentsRouter.post('/', sosRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parseResult = SOSSubmissionSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid SOS submission payload',
      details: parseResult.error.format(),
    });
    return;
  }

  const payload = parseResult.data;
  const now = Date.now();

  const translation = await translateDistressMessage(payload.description);

  const newIncident: Incident = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    status: 'new',
    priority: 'pending_triage',
    location: payload.location,
    reporter: payload.reporter,
    category: payload.category,
    description: payload.description,
    translatedDescription: translation.translatedDescription,
    detectedLanguage: translation.detectedLanguage,
    peopleAffected: payload.peopleAffected,
    urgentNeeds: payload.urgentNeeds,
    audioBlob: payload.audioBlob,
    triage: {
      translatedDescription: translation.translatedDescription,
      detectedLanguage: translation.detectedLanguage,
    },
    details: {
      category: payload.category,
      description: payload.description,
      peopleAffected: payload.peopleAffected,
      urgentNeeds: payload.urgentNeeds,
    },
  };

  const traceId = LifeSafetyTracer.createTraceId(newIncident.id);
  LifeSafetyTracer.log({
    traceId,
    incidentId: newIncident.id,
    step: 'ROUTE_RECVD',
    timestamp: now,
    status: 'STARTED',
    priority: newIncident.priority,
  });

  let created: Incident;
  try {
    created = await incidentStore.create(newIncident);
  } catch (error) {
    console.error(`[IncidentsRouter] Persistent incident create failed for ${newIncident.id}:`, error);
    res.status(503).json({ error: 'Incident persistence is temporarily unavailable' });
    return;
  }

  // Broadcast creation to connected SSE clients
  eventStreamManager.broadcast({
    type: 'incident:created',
    incident: created,
    timestamp: now,
  });

  // Trigger background AI triage workflow
  triageWorkflow.runTriage(created, traceId).catch((err) => {
    console.error(`[IncidentsRouter] Triage background task error for ${created.id}:`, err);
  });

  res.status(201).json(created);
});

// GET /api/incidents - List Incidents
incidentsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, priority, q, since, page: pageQuery, limit: limitQuery } = req.query;

  const statuses =
    typeof status === 'string'
      ? status.split(',').map((value) => value.trim()).filter(Boolean)
      : [];

  const validStatuses = statuses.filter(
    (value) => IncidentStatusEnum.safeParse(value).success
  ) as Incident['status'][];

  const validPriority =
    typeof priority === 'string' && PriorityEnum.safeParse(priority).success
      ? (priority as Incident['priority'])
      : undefined;

  const searchQuery = typeof q === 'string' && q.trim() !== '' ? q.trim() : undefined;

  let sinceTimestamp: number | undefined = undefined;
  if (typeof since === 'string' && since.trim() !== '') {
    const parsed = Number(since);
    if (!Number.isNaN(parsed)) {
      sinceTimestamp = parsed;
    } else {
      const dateParsed = Date.parse(since);
      if (!Number.isNaN(dateParsed)) {
        sinceTimestamp = dateParsed;
      }
    }
  }

  let list = await incidentStore.list({
    status: validStatuses.length > 0 ? validStatuses : undefined,
    priority: validPriority,
    q: searchQuery,
    since: sinceTimestamp,
  });

  const hasPagination =
    typeof pageQuery === 'string' || typeof limitQuery === 'string';

  if (hasPagination) {
    const page = Math.max(1, Number.parseInt(String(pageQuery || '1'), 10) || 1);
    const limit = Math.max(1, Number.parseInt(String(limitQuery || '20'), 10) || 20);
    const totalCount = list.length;
    const start = (page - 1) * limit;
    const incidents = list.slice(start, start + limit);

    res.status(200).json({
      incidents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: start + incidents.length < totalCount,
      },
    });
    return;
  }

  res.status(200).json(list);
});

// GET /api/incidents/:id - Get Single Incident
incidentsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const incident = await incidentStore.getById(id);

  if (!incident) {
    res.status(404).json({ error: 'Incident not found', id });
    return;
  }

  res.status(200).json(incident);
});

// PATCH /api/incidents/:id - Update status / assignment / triage
incidentsRouter.patch('/:id', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await incidentStore.getById(id);

  if (!existing) {
    res.status(404).json({ error: 'Incident not found', id });
    return;
  }

  const { status, priority, assignedTo, triage } = req.body;

  const updates: Partial<Incident> = {};
  if (status && IncidentStatusEnum.safeParse(status).success) {
    updates.status = status;
  }
  if (priority && PriorityEnum.safeParse(priority).success) {
    updates.priority = priority;
  }
  if (typeof assignedTo === 'string') {
    updates.assignedTo = assignedTo;
  }
  if (triage && typeof triage === 'object') {
    const parsedTriage = IncidentTriageSchema.partial().safeParse(triage);
    if (parsedTriage.success) {
      updates.triage = {
        ...(existing.triage || {}),
        ...parsedTriage.data,
      };
    }
  }

  let updated: Incident | null;
  try {
    updated = await incidentStore.update(id, updates);
  } catch (error) {
    console.error(`[IncidentsRouter] Persistent incident update failed for ${id}:`, error);
    res.status(503).json({ error: 'Incident persistence is temporarily unavailable' });
    return;
  }
  if (updated) {
    eventStreamManager.broadcast({
      type: 'incident:updated',
      incident: updated,
      timestamp: Date.now(),
    });
  }

  res.status(200).json(updated);
});

// POST /api/incidents/:id/acknowledge - Convenience endpoint
incidentsRouter.post('/:id/acknowledge', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await incidentStore.getById(id);

  if (!existing) {
    res.status(404).json({ error: 'Incident not found', id });
    return;
  }

  let updated: Incident | null;
  try {
    updated = await incidentStore.update(id, {
      status: 'acknowledged',
      assignedTo: req.body.assignedTo || existing.assignedTo,
    });
  } catch (error) {
    console.error(`[IncidentsRouter] Persistent acknowledge failed for ${id}:`, error);
    res.status(503).json({ error: 'Incident persistence is temporarily unavailable' });
    return;
  }

  if (updated) {
    eventStreamManager.broadcast({
      type: 'incident:updated',
      incident: updated,
      timestamp: Date.now(),
    });
  }

  res.status(200).json(updated);
});

// POST /api/incidents/:id/broadcast - Send tactical directive broadcast to survivor / zone
incidentsRouter.post('/:id/broadcast', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await incidentStore.getById(id);

  if (!existing) {
    res.status(404).json({ error: 'Incident not found', id });
    return;
  }

  const { message, channel, target } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Broadcast message is required' });
    return;
  }

  const updatedTriage = {
    ...(existing.triage || {}),
    suggestedAction: message,
    notes: `Broadcast sent via ${channel || CONFIG.DEFAULT_BROADCAST_CHANNEL} to ${target || 'zone'}: ${message}`,
  };

  let updated: Incident | null;
  try {
    updated = await incidentStore.update(id, { triage: updatedTriage });
  } catch (error) {
    console.error(`[IncidentsRouter] Persistent broadcast update failed for ${id}:`, error);
    res.status(503).json({ error: 'Incident persistence is temporarily unavailable' });
    return;
  }

  if (updated) {
    eventStreamManager.broadcast({
      type: 'broadcast:sent',
      incident: updated,
      message,
      timestamp: Date.now(),
    });
  }

  res.status(200).json({
    success: true,
    broadcastId: uuidv4(),
    incidentId: id,
    channel: channel || CONFIG.DEFAULT_BROADCAST_CHANNEL,
    deliveredAt: Date.now(),
    incident: updated,
  });
});
