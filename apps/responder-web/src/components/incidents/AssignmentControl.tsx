'use client';

import { useState } from 'react';
import { UserCheck, Check, ShieldAlert } from 'lucide-react';
import { ApiError, updateIncident } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';

interface AssignmentControlProps {
  incident: IncidentResponse;
  onUpdated: (incident: IncidentResponse) => void;
}

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
    <section className="hud-panel p-4 border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <UserCheck size={14} className="text-action" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
          RESPONDER ASSIGNMENT
        </h2>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-mono text-ink-500 uppercase">Current Owner:</span>
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-line-2 bg-surface-2 text-ink-900">
          {incident.assignedTo || 'UNASSIGNED'}
        </span>
      </div>

      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="assignedTo">
          Responder identifier
        </label>
        <input
          id="assignedTo"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. responder-42 or a name"
          className="w-full rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none focus:ring-1 focus:ring-action sm:max-w-xs"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center justify-center gap-1 rounded border border-line-2 bg-surface-2 px-3.5 py-1.5 font-mono text-xs font-bold text-ink-700 hover:bg-canvas hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'SAVING...' : 'SAVE'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 font-mono text-xs text-priority-critical flex items-center gap-1">
          <ShieldAlert size={12} /> {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p role="status" className="mt-2 font-mono text-xs text-status-resolved flex items-center gap-1">
          <Check size={12} /> {savedMessage}
        </p>
      ) : null}
    </section>
  );
}
