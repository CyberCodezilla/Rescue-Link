'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, getIncidents } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';

const POLL_INTERVAL_MS = 15_000;

// Persistent in-memory session cache: holds incident data when navigating across pages
let memoryCacheIncidents: IncidentResponse[] | null = null;
let memoryLastRefreshedAt: Date | null = null;

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
  // Initialize immediately from memory cache so returning to dashboard never flashes empty/error
  const [incidents, setIncidents] = useState<IncidentResponse[] | null>(memoryCacheIncidents);
  const [isInitialLoading, setIsInitialLoading] = useState(memoryCacheIncidents === null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(memoryLastRefreshedAt);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const latestRequestId = useRef(0);
  const isFetchingRef = useRef(false);

  const load = useCallback(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const requestId = ++latestRequestId.current;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRefreshing(true);

    getIncidents(controller.signal)
      .then((data) => {
        if (latestRequestId.current !== requestId) return;
        memoryCacheIncidents = data;
        memoryLastRefreshedAt = new Date();
        setIncidents(data);
        setRefreshError(null);
        setLastRefreshedAt(memoryLastRefreshedAt);
      })
      .catch((err: unknown) => {
        // Silently ignore aborts when unmounting or re-requesting
        if ((err as any)?.name === 'AbortError' || err instanceof DOMException) return;
        if (latestRequestId.current !== requestId) return;
        
        // If we already have data in memory cache, NEVER wipe it out on a background sync glitch
        if (memoryCacheIncidents && memoryCacheIncidents.length > 0) {
          setIncidents(memoryCacheIncidents);
        } else {
          setRefreshError(err instanceof ApiError ? err.message : 'Unable to load incidents.');
        }
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
      const base = current || memoryCacheIncidents || [];
      const index = base.findIndex((item) => item.id === incident.id);
      let next: IncidentResponse[];
      if (index === -1) {
        next = [incident, ...base];
      } else {
        next = base.slice();
        next[index] = incident;
      }
      memoryCacheIncidents = next;
      return next;
    });
    setRefreshError(null);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (abortRef.current) {
        abortRef.current.abort();
      }
      isFetchingRef.current = false;
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
