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
import { eventStreamManager } from '../services/eventStream';
import { CONFIG } from '@rescue-link/config';
import { requireApiKey } from '../middleware/auth';

export const incidentsRouter = Router();

// POST /api/incidents - Create SOS Incident
incidentsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
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
    peopleAffected: payload.peopleAffected,
    urgentNeeds: payload.urgentNeeds,
    audioBlob: payload.audioBlob,
    details: {
      category: payload.category,
      description: payload.description,
      peopleAffected: payload.peopleAffected,
      urgentNeeds: payload.urgentNeeds,
    },
  };

  const created = await incidentStore.create(newIncident);

  // Broadcast creation to connected SSE clients
  eventStreamManager.broadcast({
    type: 'incident:created',
    incident: created,
    timestamp: now,
  });

  // Trigger background AI triage workflow
  triageWorkflow.runTriage(created).catch((err) => {
    console.error(`[IncidentsRouter] Triage background task error for ${created.id}:`, err);
  });

  res.status(201).json(created);
});

// GET /api/incidents - List Incidents
incidentsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const statusQuery =
    typeof req.query.status === 'string' ? req.query.status : undefined;
  const priorityQuery =
    typeof req.query.priority === 'string' ? req.query.priority : undefined;

  const statusValues = statusQuery
    ? statusQuery.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  const priorityValues = priorityQuery
    ? priorityQuery.split(',').map((value) => value.trim()).filter(Boolean)
    : [];

  const statusFilters = statusValues.filter(
    (value) => IncidentStatusEnum.safeParse(value).success
  );
  const priorityFilters = priorityValues.filter(
    (value) => PriorityEnum.safeParse(value).success
  );

  let incidents = await incidentStore.list();

  if (statusFilters.length > 0) {
    incidents = incidents.filter((incident) =>
      statusFilters.includes(incident.status)
    );
  }

  if (priorityFilters.length > 0) {
    incidents = incidents.filter((incident) =>
      priorityFilters.includes(incident.priority)
    );
  }

  const pageRaw = Number(req.query.page);
  const limitRaw = Number(req.query.limit);
  const hasPagination =
    Number.isInteger(pageRaw) ||
    Number.isInteger(limitRaw) ||
    req.query.page !== undefined ||
    req.query.limit !== undefined;

  if (!hasPagination) {
    res.status(200).json(incidents);
    return;
  }

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, 100)
      : 20;

  const total = incidents.length;
  const startIndex = (page - 1) * limit;
  const paged = incidents.slice(startIndex, startIndex + limit);

  res.status(200).json({
    incidents: paged,
    pagination: {
      page,
      limit,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      hasMore: startIndex + paged.length < total,
    },
  });
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
incidentsRouter.patch('/:id', requireApiKey): Promise<void> => {
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

  const updated = await incidentStore.update(id, updates);
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
incidentsRouter.post('/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await incidentStore.getById(id);

  if (!existing) {
    res.status(404).json({ error: 'Incident not found', id });
    return;
  }

  const updated = await incidentStore.update(id, {
    status: 'acknowledged',
    assignedTo: req.body.assignedTo || existing.assignedTo,
  });

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
incidentsRouter.post('/:id/broadcast', async (req: Request, res: Response): Promise<void> => {
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

  const updated = await incidentStore.update(id, { triage: updatedTriage });

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




