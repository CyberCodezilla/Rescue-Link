'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ApiError, acknowledgeIncident, updateIncident } from '@responder/lib/api';
import { NEXT_ACTION } from '@responder/lib/schema';
import type { IncidentResponse } from '@responder/lib/schema';

interface IncidentActionsProps {
  incident: IncidentResponse;
  onUpdated: (incident: IncidentResponse) => void;
}

export function IncidentActions({ incident, onUpdated }: IncidentActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = NEXT_ACTION[incident.status];

  if (!action) {
    return (
      <section className="hud-panel p-4 border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line pb-2">
          <ShieldCheck size={14} className="text-status-resolved" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
            RESPONSE LIFECYCLE
          </h2>
        </div>
        <p className="mt-3 font-mono text-xs text-ink-500">
          {incident.status === 'closed' ? 'INCIDENT LIFECYCLE CLOSED // ARCHIVED' : 'NO FURTHER TACTICAL TRANSITIONS AVAILABLE'}
        </p>
      </section>
    );
  }

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const updated =
        incident.status === 'new'
          ? await acknowledgeIncident(incident.id)
          : await updateIncident(incident.id, { status: action!.next });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update this incident.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="hud-panel p-4 border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <ArrowRight size={14} className="text-action" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
          TACTICAL RESPONSE ACTION
        </h2>
      </div>

      <div className="mt-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono text-ink-500">
          <span>NEXT STATUS STAGE:</span>
          <span className="font-bold uppercase text-action tracking-wider">{action.next}</span>
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded border border-action/40 bg-action px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-action-hover active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            'EXECUTING TRANSITION...'
          ) : (
            <>
              <CheckCircle2 size={14} />
              {action.label}
            </>
          )}
        </button>

        {error ? (
          <p role="alert" className="font-mono text-xs text-priority-critical flex items-center gap-1.5 p-2 rounded bg-priority-critical/10 border border-priority-critical/20">
            <AlertTriangle size={13} /> {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
