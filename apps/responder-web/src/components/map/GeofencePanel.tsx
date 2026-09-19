'use client';

import React, { useState } from 'react';
import { Layers, CheckCircle2, X } from 'lucide-react';
import { batchUpdateStatus } from '@/lib/api';
import { isPointInCircle, isPointInPolygon } from '@/lib/geo';
import type { GeofenceShape } from '@/components/map/IncidentMap';
import type { IncidentResponse, IncidentStatus } from '@/lib/schema';

interface GeofencePanelProps {
  shape: GeofenceShape | null;
  incidents: IncidentResponse[];
  onClear: () => void;
  onBatchComplete: () => void;
}

const BULK_ACTIONS: { label: string; status: IncidentStatus }[] = [
  { label: 'ACKNOWLEDGE ALL', status: 'acknowledged' },
  { label: 'DISPATCH ALL', status: 'in_progress' },
  { label: 'RESOLVE ALL', status: 'resolved' },
];

export function GeofencePanel({ shape, incidents, onClear, onBatchComplete }: GeofencePanelProps) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!shape) return null;

  const matched = incidents.filter((incident) => {
    const point = { lat: incident.location.lat, lng: incident.location.lng };
    if (shape.kind === 'circle') return isPointInCircle(point, shape.center, shape.radiusMeters);
    return isPointInPolygon(point, shape.points);
  });

  async function runBatch(status: IncidentStatus) {
    setIsPending(true);
    setResult(null);
    try {
      const { succeeded, failed } = await batchUpdateStatus(
        matched.map((i) => i.id),
        status
      );
      setResult(
        failed.length === 0
          ? `Updated ${succeeded.length} incident${succeeded.length === 1 ? '' : 's'}.`
          : `Updated ${succeeded.length}, ${failed.length} failed.`
      );
      onBatchComplete();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md absolute bottom-4 left-4 right-4 z-[1000] sm:right-auto sm:max-w-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-blue-400" />
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
            {matched.length} INCIDENT{matched.length === 1 ? '' : 'S'} IN TACTICAL GEOFENCE
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
        >
          <X size={12} />
          <span>CLEAR</span>
        </button>
      </div>

      {matched.length === 0 ? (
        <p className="mt-2 font-mono text-xs text-slate-400">
          Draw a circle or polygon over the tactical grid to capture incidents.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {BULK_ACTIONS.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => runBatch(action.status)}
              disabled={isPending}
              className="rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 font-mono text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-150 shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'DEPLOYING...' : action.label}
            </button>
          ))}
        </div>
      )}

      {result ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <CheckCircle2 size={12} />
          <span>{result}</span>
        </div>
      ) : null}
    </div>
  );
}
