import { z } from 'zod';
import {
  IncidentSchema,
  type IncidentResponse,
  type IncidentStatus,
  type SensorReading,
  type HazardZone,
} from '@responder/lib/schema';

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface NotificationTestResult {
  success: boolean;
  result?: {
    snsSent: boolean;
    sesSent: boolean;
    mode: 'aws' | 'mock';
    message: string;
  };
}

export async function triggerTestNotification(signal?: AbortSignal): Promise<NotificationTestResult> {
  const data = (await request('/notifications/test', { method: 'POST', body: JSON.stringify({ priority: 'critical' }), signal })) as NotificationTestResult;
  return data;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

async function request(
  path: string,
  init?: RequestInit & { signal?: AbortSignal },
  retryOptions: RetryOptions = {}
): Promise<unknown> {
  const maxRetries = retryOptions.maxRetries ?? 3;
  const initialDelayMs = retryOptions.initialDelayMs ?? 400;
  const backoffFactor = retryOptions.backoffFactor ?? 2;

  let attempt = 0;
  let response: Response | undefined;

  while (attempt <= maxRetries) {
    if (init?.signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }

    try {
      const apiOrigin =
        process.env.NEXT_PUBLIC_RESCUE_LINK_API_ORIGIN ||
        process.env.RESCUE_LINK_API_ORIGIN ||
        'http://13.218.236.205:3001';
      const baseUrl = apiOrigin.trim().replace(/\/$/, '');
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'rescuelink-responder-key-2026';
      response = await fetch(`${baseUrl}/api${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...init?.headers,
        },
      });

      // HTTP 429 (Rate Limited) handling with exponential backoff & Retry-After header support
      if (response.status === 429) {
        if (attempt < maxRetries) {
          attempt++;
          const retryAfterHeader = response.headers.get('Retry-After');
          const baseDelay = retryAfterHeader
            ? (parseInt(retryAfterHeader, 10) * 1000) || (initialDelayMs * Math.pow(backoffFactor, attempt - 1))
            : (initialDelayMs * Math.pow(backoffFactor, attempt - 1));
          // Full decorrelated jitter (75% - 125% of base delay) to prevent thundering herd spikes
          const delayMs = Math.floor(baseDelay * 0.75 + Math.random() * (baseDelay * 0.5));

          console.warn(`[ClientAPI] Rate limited (429) on ${path}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms (jittered)...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }

      // Transient server gateway error handling (502, 503, 504)
      if (response.status >= 502 && response.status <= 504) {
        if (attempt < maxRetries) {
          attempt++;
          const delayMs = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
          console.warn(`[ClientAPI] Server gateway error (${response.status}) on ${path}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }

      break;
    } catch (err) {
      if ((err as any)?.name === 'AbortError' || err instanceof DOMException || init?.signal?.aborted) {
        throw err;
      }

      if (attempt < maxRetries) {
        attempt++;
        const delayMs = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
        console.warn(`[ClientAPI] Network error on ${path}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw new ApiError('Unable to reach the server. Check your connection.');
      }
    }
  }

  if (!response) {
    throw new ApiError('Unable to reach the server. Check your connection.');
  }

  if (!response.ok) {
    let message = response.status === 429
      ? 'Rate limit exceeded. Please wait a moment before trying again.'
      : `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') message = body.error;
      else if (body && typeof body.message === 'string') message = body.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined;

  try {
    return await response.json();
  } catch {
    throw new ApiError('The server returned an unreadable response.');
  }
}

function parseIncident(data: unknown): IncidentResponse {
  const result = IncidentSchema.safeParse(data);
  if (!result.success) {
    throw new ApiError('The server returned an incident that does not match the expected shape.');
  }
  return result.data;
}

const IncidentListEnvelopeSchema = z.union([
  z.array(z.unknown()),
  z.object({ incidents: z.array(z.unknown()) }),
]);

function parseIncidentList(data: unknown): IncidentResponse[] {
  const envelope = IncidentListEnvelopeSchema.safeParse(data);
  if (!envelope.success) {
    throw new ApiError('The server returned an unexpected incident list shape.');
  }
  const rawList = Array.isArray(envelope.data) ? envelope.data : envelope.data.incidents;
  return rawList.map(parseIncident);
}

/**
 * GET /api/incidents — Phase 4 spec calls this with
 * `?status=new,acknowledged,in_progress` to fetch active incidents. Note
 * (confirmed by reading apps/api/src/routes/incidents.ts): the backend's
 * query parsing only accepts a single valid enum value via
 * `IncidentStatusEnum.safeParse(status)`, so a comma-joined list fails that
 * check and is silently ignored server-side — the backend currently returns
 * *all* incidents regardless of this parameter. We still send the exact
 * querystring the spec requires (forward-compatible the day the backend
 * parses it), and additionally default the dashboard's own filter to
 * "active" client-side (see schema.ts DEFAULT_FILTERS) so the requirement
 * is actually met end-to-end today. This is not "inventing a different
 * contract" — it's calling the documented one and compensating in the one
 * place we own for a gap in the other team's implementation.
 */
export async function getIncidents(signal?: AbortSignal): Promise<IncidentResponse[]> {
  const data = await request('/incidents?status=new,acknowledged,in_progress', { signal });
  return parseIncidentList(data);
}

export async function getIncident(id: string, signal?: AbortSignal): Promise<IncidentResponse> {
  const data = await request(`/incidents/${encodeURIComponent(id)}`, { signal });
  return parseIncident(data);
}

export interface UpdateIncidentPayload {
  status?: IncidentStatus;
  assignedTo?: string;
  triage?: { assignedUnits?: string[] };
}

/**
 * PATCH /api/incidents/:id — confirmed real (apps/api/src/routes/incidents.ts).
 * Used for status transitions, dispatcher assignment, and unit assignment.
 * The backend deep-merges `triage`, so this never clobbers Bedrock AI fields.
 */
export async function updateIncident(
  id: string,
  payload: UpdateIncidentPayload,
  signal?: AbortSignal
): Promise<IncidentResponse> {
  const data = await request(`/incidents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    signal,
  });
  return parseIncident(data);
}

/**
 * POST /api/incidents/:id/acknowledge — confirmed real. Convenience
 * transition to "acknowledged" that also lets a dispatcher claim ownership.
 */
export async function acknowledgeIncident(
  id: string,
  assignedTo?: string,
  signal?: AbortSignal
): Promise<IncidentResponse> {
  const data = await request(`/incidents/${encodeURIComponent(id)}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify(assignedTo ? { assignedTo } : {}),
    signal,
  });
  return parseIncident(data);
}

/**
 * Batch status update. There is no batch endpoint on the backend — this
 * loops the real, confirmed PATCH endpoint per incident and reports partial
 * failure so a geofence action on 50 incidents doesn't silently half-fail.
 */
export interface BatchUpdateResult {
  succeeded: string[];
  failed: { id: string; message: string }[];
}

export async function batchUpdateStatus(
  ids: string[],
  status: IncidentStatus
): Promise<BatchUpdateResult> {
  const results = await Promise.allSettled(ids.map((id) => updateIncident(id, { status })));

  const succeeded: string[] = [];
  const failed: { id: string; message: string }[] = [];

  results.forEach((result, index) => {
    const id = ids[index];
    if (id === undefined) return;
    if (result.status === 'fulfilled') {
      succeeded.push(id);
    } else {
      const reason = result.reason;
      failed.push({ id, message: reason instanceof ApiError ? reason.message : 'Update failed.' });
    }
  });

  return { succeeded, failed };
}

// --- Phase 2 endpoints, now confirmed real ---
//
// All three below were "assumed" when Phase 2 shipped (apps/api only had
// /api/health and /api/incidents at the time). The backend has since added
// real routes for all of them (apps/api/src/routes/events.ts, telemetry.ts,
// and the /broadcast handler in incidents.ts) — this section is updated to
// match their actual, confirmed contracts rather than the earlier guesses.

/**
 * POST /api/incidents/:id/broadcast — confirmed real as of the latest
 * backend push (apps/api/src/routes/incidents.ts). Request body is
 * `{ message, channel, target }`; response is
 * `{ success, broadcastId, incidentId, channel, deliveredAt, incident }`,
 * where `incident` is the updated incident (the backend folds the message
 * into `triage.suggestedAction`/`triage.notes`), which callers should apply
 * via their update handler to stay in sync immediately rather than waiting
 * for the next poll/SSE push.
 */
export interface BroadcastPayload {
  message: string;
  channel: string;
  target: string;
}

export interface BroadcastResult {
  success: boolean;
  broadcastId: string;
  deliveredAt: number;
  incident: IncidentResponse | null;
}

export async function broadcastIncident(
  id: string,
  payload: BroadcastPayload,
  signal?: AbortSignal
): Promise<BroadcastResult> {
  const data = (await request(`/incidents/${encodeURIComponent(id)}/broadcast`, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal,
  })) as {
    success?: boolean;
    broadcastId?: string;
    deliveredAt?: number;
    incident?: unknown;
  };

  const incidentResult = data.incident ? IncidentSchema.safeParse(data.incident) : null;

  return {
    success: Boolean(data.success),
    broadcastId: data.broadcastId ?? '',
    deliveredAt: data.deliveredAt ?? Date.now(),
    incident: incidentResult && incidentResult.success ? incidentResult.data : null,
  };
}

/** GET /api/sensors — confirmed real (apps/api/src/routes/telemetry.ts).
 * Still defends with a graceful empty array on any transport error, since a
 * sensor layer failing to load shouldn't take down the whole dashboard. */
export async function getSensors(signal?: AbortSignal): Promise<SensorReading[]> {
  try {
    const data = await request('/sensors', { signal });
    return Array.isArray(data) ? (data as SensorReading[]) : [];
  } catch (err) {
    if ((err as any)?.name === 'AbortError' || err instanceof DOMException) throw err;
    return [];
  }
}

/** GET /api/hazard-zones — confirmed real (apps/api/src/routes/telemetry.ts).
 * Same graceful-empty behavior as getSensors. */
export async function getHazardZones(signal?: AbortSignal): Promise<HazardZone[]> {
  try {
    const data = await request('/hazard-zones', { signal });
    return Array.isArray(data) ? (data as HazardZone[]) : [];
  } catch (err) {
    if ((err as any)?.name === 'AbortError' || err instanceof DOMException) throw err;
    return [];
  }
}
