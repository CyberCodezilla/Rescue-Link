'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, getIncidents } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';

const POLL_INTERVAL_MS = 15_000;

// Module-level persistent cache across client-side page navigations (Dashboard <-> Dispatcher)
let memoryIncidentsCache: IncidentResponse[] | null = null;
let memoryLastRefreshedAt: Date | null = null;

function getInitialIncidents(): IncidentResponse[] | null {
  if (memoryIncidentsCache && memoryIncidentsCache.length > 0) {
    return memoryIncidentsCache;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('rescuelink_incidents_cache');
      if (stored) {
        const parsed = JSON.parse(stored) as IncidentResponse[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryIncidentsCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore sessionStorage exceptions
    }
  }
  return null;
}

function getInitialTimestamp(): Date | null {
  if (memoryLastRefreshedAt) return memoryLastRefreshedAt;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('rescuelink_synced_at');
      if (stored) {
        const parsed = new Date(stored);
        if (!isNaN(parsed.getTime())) {
          memoryLastRefreshedAt = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

interface UseIncidentsState {
  incidents: IncidentResponse[] | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  refreshError: string | null;
  refresh: () => void;
  applyIncidentUpdate: (incident: IncidentResponse) => void;
}

export function useIncidents(): UseIncidentsState {
  const initialData = getInitialIncidents();
  const initialTime = getInitialTimestamp();

  const [incidents, setIncidents] = useState<IncidentResponse[] | null>(initialData);
  const [isInitialLoading, setIsInitialLoading] = useState(initialData === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(initialTime);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const latestRequestId = useRef(0);
  const isFetchingRef = useRef(false);

  const load = useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const requestId = ++latestRequestId.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);

    getIncidents(controller.signal)
      .then((data) => {
        if (latestRequestId.current !== requestId) return;

        // Update in-memory and session storage cache
        memoryIncidentsCache = data;
        const now = new Date();
        memoryLastRefreshedAt = now;

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('rescuelink_incidents_cache', JSON.stringify(data));
            sessionStorage.setItem('rescuelink_synced_at', now.toISOString());
          } catch {
            // Ignore
          }
        }

        setIncidents(data);
        setRefreshError(null);
        setLastRefreshedAt(now);
      })
      .catch((err: unknown) => {
        const isAbort =
          (err as any)?.name === 'AbortError' ||
          err instanceof DOMException ||
          controller.signal.aborted;
        if (isAbort) return;
        if (latestRequestId.current !== requestId) return;

        const errorMsg = err instanceof ApiError ? err.message : 'Unable to load incidents.';
        // If we already hold incidents in state, do not blank out the dashboard; keep displaying existing data
        setRefreshError(errorMsg);
      })
      .finally(() => {
        if (latestRequestId.current === requestId) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
        isFetchingRef.current = false;
      });
  }, []);

  const applyIncidentUpdate = useCallback((incident: IncidentResponse) => {
    setIncidents((current) => {
      let next: IncidentResponse[];
      if (!current) {
        next = [incident];
      } else {
        const index = current.findIndex((item) => item.id === incident.id);
        if (index === -1) {
          next = [incident, ...current];
        } else {
          next = current.slice();
          next[index] = incident;
        }
      }

      memoryIncidentsCache = next;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('rescuelink_incidents_cache', JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
    setRefreshError(null);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [load]);

  return {
    incidents,
    isInitialLoading,
    isRefreshing,
    lastRefreshedAt,
    refreshError,
    refresh: load,
    applyIncidentUpdate,
  };
}
