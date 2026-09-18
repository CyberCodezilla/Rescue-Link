'use client';

import React, { useState } from 'react';
import { Send, Radio, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
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
    <section className="hud-panel p-4 border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <Send size={14} className="text-action" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
            EMERGENCY NOTIFICATION UPLINK (SNS / SES)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={isPending}
          className="rounded border border-line-2 bg-surface-2 px-3 py-1 font-mono text-xs font-semibold text-ink-700 hover:bg-surface-3 hover:text-ink-900 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'TRANSMITTING...' : 'TEST UPLINK'}
        </button>
      </div>

      <div className="mt-3 grid gap-2.5 text-xs sm:grid-cols-2">
        <div className="flex items-center justify-between rounded border border-line-2 bg-surface-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-orange-400" />
            <span className="font-mono font-bold text-ink-900">AWS SNS</span>
          </div>
          <span className="font-mono text-[11px] text-ink-500">GATEWAY ACTIVE</span>
        </div>
        <div className="flex items-center justify-between rounded border border-line-2 bg-surface-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-blue-400" />
            <span className="font-mono font-bold text-ink-900">AWS SES</span>
          </div>
          <span className="font-mono text-[11px] text-ink-500">SMTP DISPATCH</span>
        </div>
      </div>

      {message ? (
        <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-ink-700">
          <CheckCircle2 size={13} className="text-success" />
          <span>{message}</span>
        </div>
      ) : null}

      {result ? (
        <p className="mt-2 font-mono text-[11px] text-ink-500">
          DISPATCH TELEMETRY: SNS [{result.snsSent ? 'SENT' : 'SKIPPED'}] // SES [{result.sesSent ? 'SENT' : 'SKIPPED'}] // ENGINE [{result.mode.toUpperCase()}]
        </p>
      ) : null}

      <p className="mt-2 font-mono text-[10px] text-ink-500">INCIDENT ID: {incident.id}</p>
    </section>
  );
}
