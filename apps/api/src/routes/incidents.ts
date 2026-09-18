import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  SOSSubmissionSchema,
  Incident,
  IncidentStatus,
  Priority,
  IncidentStatusEnum,
  PriorityEnum,
  IncidentTriageSchema,
} from '@rescue-link/schema';
import { incidentStore } from '../store/incidentStore';
import { triageWorkflow } from '../services/triageWorkflow';
import { LifeSafetyTracer } from '../services/lifeSafetyTracer';
import { eventStreamManager } from '../services/eventStream';
import { CONFIG } from '@rescue-link/config';
import { sosRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

export const incidentsRouter = Router();

// POST /api/incidents - Create SOS Incident (Rate limited to prevent spam/cost exhaustion)
incidentsRouter.post('/', sosRateLimiter, async (req: Request, res: Response): Promise<void> => {
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

  const traceId = LifeSafetyTracer.createTraceId(newIncident.id);
  LifeSafetyTracer.log({
    traceId,
    incidentId: newIncident.id,
    step: 'ROUTE_RECVD',
    timestamp: now,
    status: 'STARTED',
    priority: newIncident.priority,
    metadata: {
      category: payload.category,
      peopleAffected: payload.peopleAffected,
      ip: req.ip,
    },
  });

  const created = await incidentStore.create(newIncident);

  // Broadcast creation to connected SSE clients
  eventStreamManager.broadcast({
    type: 'incident:created',
    incident: created,
    timestamp: now,
  });

  // Trigger background AI triage workflow with correlated traceId
  triageWorkflow.runTriage(created, traceId).catch((err) => {
    console.error(`[IncidentsRouter] Triage background task error for ${created.id}:`, err);
  });

  res.status(201).json(created);
});

// GET /api/incidents - List Incidents with Multi-filtering, Search & Pagination
incidentsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, priority, q, since, page, limit, paginated } = req.query;

  // Process comma-separated status filters
  const parseStatuses = (val: unknown): IncidentStatus[] | undefined => {
    if (typeof val !== 'string') return undefined;
    const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
    const valid = parts.filter((p) => IncidentStatusEnum.safeParse(p).success) as IncidentStatus[];
    return valid.length > 0 ? valid : undefined;
  };

  // Process comma-separated priority filters
  const parsePriorities = (val: unknown): Priority[] | undefined => {
    if (typeof val !== 'string') return undefined;
    const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
    const valid = parts.filter((p) => PriorityEnum.safeParse(p).success) as Priority[];
    return valid.length > 0 ? valid : undefined;
  };

  const parsedStatus = parseStatuses(status);
  const parsedPriority = parsePriorities(priority);
  const searchQuery = typeof q === 'string' ? q : undefined;
  const sinceTime = typeof since === 'string' && !isNaN(parseInt(since, 10)) ? parseInt(since, 10) : undefined;

  const list = await incidentStore.list({
    status: parsedStatus,
    priority: parsedPriority,
    q: searchQuery,
    since: sinceTime,
  });

  const shouldPaginate = Boolean(page || limit || paginated === 'true');

  if (shouldPaginate) {
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedItems = list.slice(startIndex, startIndex + pageSize);

    res.status(200).json({
      incidents: paginatedItems,
      pagination: {
        totalCount,
        page: pageNum,
        limit: pageSize,
        totalPages,
        hasMore: pageNum < totalPages,
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

// PATCH /api/incidents/:id - Update status / assignment / triage (Protected)
incidentsRouter.patch('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
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

// POST /api/incidents/:id/acknowledge - Convenience endpoint (Protected)
incidentsRouter.post('/:id/acknowledge', requireAuth, async (req: Request, res: Response): Promise<void> => {
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

// POST /api/incidents/:id/broadcast - Send tactical directive broadcast to survivor / zone (Protected)
incidentsRouter.post('/:id/broadcast', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
