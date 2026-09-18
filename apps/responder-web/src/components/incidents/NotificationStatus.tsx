'use client';

import { useState } from 'react';
import { triggerTestNotification } from '@responder/lib/api';
import type { IncidentResponse } from '@responder/lib/schema';

export function NotificationStatus({ incident }: { incident: IncidentResponse }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ snsSent: boolean; sesSent: boolean; mode: 'aws' | 'mock' } | null>(null);

  async function handleTest() {
    setIsPending(true);
    setMessage(null);
    setResult(null);
    try {
      const response = await triggerTestNotification();
      if (!response.success || !response.result) {
        setMessage('Test notification failed. The API did not confirm dispatch.');
        return;
      }
      setResult(response.result);
      setMessage(response.result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Test notification failed.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Dispatched Alerts (SNS / SES)</h2>
          <p className="mt-1 text-xs text-ink-500">Notification delivery status is not reported on the incident API.</p>
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={isPending}
          className="rounded border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Sending test…' : 'Trigger Test Notification'}
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded border border-line bg-canvas px-3 py-2">
          <span className="font-medium text-ink-700">SNS</span>
          <span className="ml-2 text-ink-500">Status unavailable from incident API</span>
        </div>
        <div className="rounded border border-line bg-canvas px-3 py-2">
          <span className="font-medium text-ink-700">SES</span>
          <span className="ml-2 text-ink-500">Status unavailable from incident API</span>
        </div>
      </div>

      {message ? (
        <p role="status" className="mt-3 text-xs text-ink-600">
          {message}
        </p>
      ) : null}

      {result ? (
        <p className="mt-2 text-xs text-ink-500">
          Test API result: SNS {result.snsSent ? 'dispatched' : 'not dispatched'} · SES {result.sesSent ? 'dispatched' : 'not dispatched'} · mode {result.mode}.
        </p>
      ) : null}

      <p className="mt-2 text-[11px] text-ink-400">Incident: {incident.id}</p>
    </section>
  );
}
