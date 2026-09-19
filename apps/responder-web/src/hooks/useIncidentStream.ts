'use client';

import { useEffect, useRef, useState } from 'react';
import type { IncidentResponse } from '@responder/lib/schema';

export type StreamStatus = 'connecting' | 'live' | 'unavailable';

interface UseIncidentStreamOptions {
  /** Called with a created/updated incident the instant it arrives over SSE. */
  onIncident: (incident: IncidentResponse) => void;
}

/**
 * Real contract (confirmed in apps/api/src/services/eventStream.ts and
 * routes/events.ts): GET /api/events is a Server-Sent Events stream. Every
 * message is sent as `event: incident` with `data` being a JSON-encoded
 * envelope — NOT the incident directly:
 *   { type: 'incident:created' | 'incident:updated' | 'broadcast:sent',
 *     incident: Incident, message?: string, timestamp: number }
 * This hook unwraps `.incident` from that envelope before handing it to the
 * caller.
 */
export function useIncidentStream({ onIncident }: UseIncidentStreamOptions): StreamStatus {
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const onIncidentRef = useRef(onIncident);
  onIncidentRef.current = onIncident;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      setStatus('unavailable');
      return;
    }

    let source: EventSource | null = null;
    let cancelled = false;

    // Timeout fallback: AWS API Gateway buffers chunked SSE streams and disconnects after 29s.
    // If the SSE connection has not opened within 3.5 seconds, gracefully drop back to POLLING
    // mode so the responder UI displays reliable polling telemetry instead of getting stuck on "CONNECTING...".
    const timeoutTimer = setTimeout(() => {
      if (!cancelled) {
        setStatus((prev) => (prev === 'connecting' ? 'unavailable' : prev));
      }
    }, 3500);

    try {
      const apiOrigin =
        process.env.NEXT_PUBLIC_RESCUE_LINK_API_ORIGIN ||
        process.env.RESCUE_LINK_API_ORIGIN ||
        'https://pfqm76wx1g.execute-api.us-east-1.amazonaws.com';
      const baseUrl = apiOrigin.trim().replace(/\/$/, '');
      source = new EventSource(`${baseUrl}/api/events`);
    } catch {
      clearTimeout(timeoutTimer);
      setStatus('unavailable');
      return;
    }

    source.addEventListener('open', () => {
      clearTimeout(timeoutTimer);
      if (!cancelled) setStatus('live');
    });

    source.addEventListener('incident', (event) => {
      if (cancelled) return;
      try {
        const envelope = JSON.parse((event as MessageEvent).data) as {
          type?: string;
          incident?: IncidentResponse;
        };
        if (envelope && envelope.incident) {
          onIncidentRef.current(envelope.incident);
        }
      } catch {
        // Malformed push — ignore this event, polling will still catch up.
      }
    });

    source.addEventListener('error', () => {
      clearTimeout(timeoutTimer);
      if (cancelled) return;
      setStatus('unavailable');
      try {
        source?.close();
      } catch {
        // ignore
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutTimer);
      try {
        source?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  return status;
}
