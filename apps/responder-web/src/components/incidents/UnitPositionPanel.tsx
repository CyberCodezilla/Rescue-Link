'use client';

import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useUnitPositions } from '@responder/hooks/useUnitPositions';
import { haversineDistanceMeters, estimateEtaMinutes, formatDistance } from '@responder/lib/geo';
import type { IncidentResponse } from '@responder/lib/schema';

interface UnitPositionPanelProps {
  incident: IncidentResponse;
}

export function UnitPositionPanel({ incident }: UnitPositionPanelProps) {
  const units = incident.triage?.assignedUnits || [];
  const { getPosition, reportPosition } = useUnitPositions();
  const [drafts, setDrafts] = useState<Record<string, { lat: string; lng: string }>>({});

  if (units.length === 0) return null;

  async function handleSave(unitName: string) {
    const draft = drafts[unitName];
    const lat = Number(draft?.lat);
    const lng = Number(draft?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    await reportPosition(unitName, lat, lng);
  }

  return (
    <section className="hud-panel p-4 border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <Navigation size={14} className="text-action" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
          FIELD UNIT TELEMETRY LOG
        </h2>
      </div>

      <ul className="mt-3 space-y-2.5">
        {units.map((unitName) => {
          const position = getPosition(unitName);
          const distance = position
            ? haversineDistanceMeters(position, incident.location)
            : null;

          return (
            <li key={unitName} className="rounded border border-line-2 bg-surface-2/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-action">{unitName}</span>
                {distance !== null ? (
                  <span className="font-mono text-[11px] text-emerald-400">
                    {formatDistance(distance)} // ~{estimateEtaMinutes(distance)} MIN ETA
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-ink-500">NO TELEMETRY LOGGED</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="LATITUDE"
                  value={drafts[unitName]?.lat ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [unitName]: { ...prev[unitName], lat: e.target.value, lng: prev[unitName]?.lng ?? '' },
                    }))
                  }
                  className="w-28 rounded border border-line-2 bg-surface px-2.5 py-1 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="LONGITUDE"
                  value={drafts[unitName]?.lng ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [unitName]: { ...prev[unitName], lng: e.target.value, lat: prev[unitName]?.lat ?? '' },
                    }))
                  }
                  className="w-28 rounded border border-line-2 bg-surface px-2.5 py-1 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSave(unitName)}
                  className="rounded border border-line-2 bg-surface-2 px-3 py-1 font-mono text-xs font-semibold text-ink-700 hover:bg-surface-3 hover:text-ink-900 transition-colors"
                >
                  LOG FIX
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
