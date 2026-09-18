'use client';

import React, { useState } from 'react';
import { Radio, Plus, X } from 'lucide-react';
import { ApiError, updateIncident } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';
import { hasAssignedUnits } from '@responder/lib/format';

interface DispatchedUnitsControlProps {
  incident: IncidentResponse;
  onUpdated: (incident: IncidentResponse) => void;
}

export function DispatchedUnitsControl({ incident, onUpdated }: DispatchedUnitsControlProps) {
  const [draft, setDraft] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const units = incident.triage?.assignedUnits ?? [];

  async function persist(nextUnits: string[]) {
    setIsPending(true);
    setError(null);
    try {
      const updated = await updateIncident(incident.id, { triage: { assignedUnits: nextUnits } });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update dispatched units.');
    } finally {
      setIsPending(false);
    }
  }

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed || units.includes(trimmed)) return;
    setDraft('');
    persist([...units, trimmed]);
  }

  function handleRemove(unit: string) {
    persist(units.filter((u) => u !== unit));
  }

  return (
    <section className="hud-panel p-4 border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <Radio size={14} className="text-action" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
          ASSIGNED TACTICAL UNITS
        </h2>
      </div>

      {hasAssignedUnits(units) ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {units.map((unit) => (
            <li
              key={unit}
              className="flex items-center gap-2 rounded border border-action/40 bg-action/15 px-3 py-1 font-mono text-xs font-bold text-action"
            >
              <span>{unit}</span>
              <button
                type="button"
                onClick={() => handleRemove(unit)}
                disabled={isPending}
                aria-label={`Remove ${unit}`}
                className="text-action hover:text-white disabled:opacity-50 transition-colors"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 font-mono text-xs text-ink-500">No field units dispatched yet.</p>
      )}

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="unitName">
          Unit callsign
        </label>
        <input
          id="unitName"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="e.g. SAR-Unit-4"
          className="w-full rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none focus:ring-1 focus:ring-action sm:max-w-xs"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !draft.trim()}
          className="flex items-center justify-center gap-1 rounded border border-action/40 bg-action px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-action-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={12} />
          {isPending ? 'ASSIGNING...' : 'DISPATCH UNIT'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 font-mono text-xs text-priority-critical">
          {error}
        </p>
      ) : null}
    </section>
  );
}
