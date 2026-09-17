'use client';

import { useState } from 'react';
import { ApiError, updateIncident } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';

interface AssignmentControlProps {
  incident: IncidentResponse;
  onUpdated: (incident: IncidentResponse) => void;
}

/**
 * Phase 4 "Assignment" requirement: a simple responder identifier on
 * `incident.assignedTo` (a plain string, per the master prompt — "a simple
 * text field or simple responder identifier"), written via the existing
 * PATCH /api/incidents/:id endpoint. This is distinct from Phase 2's
 * "Dispatched field units" (`triage.assignedUnits`, see
 * DispatchedUnitsControl.tsx) — assignedTo is "who owns/is responsible for
 * this incident," assignedUnits is "which physical units are en route."
 * They used to be incorrectly conflated in this component (display read
 * assignedTo while save wrote assignedUnits); this fix keeps them separate
 * and each writes only its own field.
 */
export function AssignmentControl({ incident, onUpdated }: AssignmentControlProps) {
  const [value, setValue] = useState(incident.assignedTo ?? '');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsPending(true);
    setError(null);
    setSavedMessage(null);
    try {
      const updated = await updateIncident(incident.id, { assignedTo: value.trim() });
      onUpdated(updated);
      setSavedMessage('Assignment saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save assignment.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink-900">Assignment</h2>
      <p className="mt-1 text-sm text-ink-500">
        {incident.assignedTo ? `Assigned to ${incident.assignedTo}` : 'Unassigned'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="assignedTo">
          Responder identifier
        </label>
        <input
          id="assignedTo"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. responder-42 or a name"
          className="w-full rounded border border-line px-3 py-1.5 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action sm:max-w-xs"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-priority-critical">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p role="status" className="mt-2 text-sm text-status-resolved">
          {savedMessage}
        </p>
      ) : null}
    </section>
  );
}
