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
 * caller. (An earlier version of this hook incorrectly treated the whole
 * envelope as the Incident — fixed once the real endpoint's wire format
 * was confirmed by reading the backend source directly.)
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

    try {
      source = new EventSource('/api/events');
    } catch {
      setStatus('unavailable');
      return;
    }

    source.addEventListener('open', () => {
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
      if (cancelled) return;
      setStatus('unavailable');
      source?.close();
    });

    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);

  return status;
}
