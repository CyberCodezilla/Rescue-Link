'use client';

import React, { useState } from 'react';
import { Radio, Send, X, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { broadcastIncident, ApiError } from '@responder/lib/api';
import { queueBroadcast, updateBroadcastStatus } from '@responder/lib/offlineCache';
import type { IncidentResponse } from '@responder/lib/schema';

interface BroadcastModalProps {
  incident: IncidentResponse;
  onClose: () => void;
  onUpdated: (incident: IncidentResponse) => void;
}

type Channel = 'phone' | 'email' | 'wifi';

const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: 'phone', label: 'Phone (SMS/IVR Relay)' },
  { value: 'email', label: 'Email (Tactical Dispatch)' },
  { value: 'wifi', label: 'Captive Wi-Fi Beacon (Geofenced Grid)' },
];

function defaultTarget(incident: IncidentResponse): { channel: Channel; target: string } {
  const reporter = incident.reporter;
  if (reporter?.contactMethod === 'phone' && reporter.contactValue) {
    return { channel: 'phone', target: reporter.contactValue };
  }
  if (reporter?.contactMethod === 'email' && reporter.contactValue) {
    return { channel: 'email', target: reporter.contactValue };
  }
  return { channel: 'wifi', target: 'All beacons within incident perimeter' };
}

export function BroadcastModal({ incident, onClose, onUpdated }: BroadcastModalProps) {
  const suggested = incident.triage?.suggestedAction ?? '';
  const [message, setMessage] = useState(suggested);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<'sent' | 'queued' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initial = defaultTarget(incident);
  const [channel, setChannel] = useState<Channel>(initial.channel);
  const [target, setTarget] = useState(initial.target);

  function handleChannelChange(next: Channel) {
    setChannel(next);
    if (next === 'phone' && incident.reporter?.contactMethod === 'phone') {
      setTarget(incident.reporter.contactValue ?? '');
    } else if (next === 'email' && incident.reporter?.contactMethod === 'email') {
      setTarget(incident.reporter.contactValue ?? '');
    } else if (next === 'wifi') {
      setTarget('All beacons within incident perimeter');
    } else {
      setTarget('');
    }
  }

  async function handleSend() {
    setIsSending(true);
    setError(null);
    try {
      const response = await broadcastIncident(incident.id, { message, channel, target });

      const outboxEntry = {
        id: `${incident.id}-${Date.now()}`,
        incidentId: incident.id,
        message,
        channel,
        target,
        queuedAt: Date.now(),
        status: (response.success ? 'sent' : 'pending') as 'sent' | 'pending',
      };
      await queueBroadcast(outboxEntry);
      if (response.success) await updateBroadcastStatus(outboxEntry.id, 'sent');
      if (response.incident) onUpdated(response.incident);

      setResult(response.success ? 'sent' : 'queued');
    } catch (err) {
      if (err instanceof ApiError) {
        const outboxEntry = {
          id: `${incident.id}-${Date.now()}`,
          incidentId: incident.id,
          message,
          channel,
          target,
          queuedAt: Date.now(),
          status: 'pending' as const,
        };
        await queueBroadcast(outboxEntry);
        setError(err.message);
        setResult('queued');
      } else {
        setError('Unable to send broadcast.');
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md hud-panel border-line-2 bg-surface p-5 shadow-panel">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-action" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-ink-900">
              BROADCAST FLASH DIRECTIVE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-500 hover:text-ink-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-2 text-xs text-ink-500 font-sans">
          Review and dispatch the AI-generated survival directive to connected field receivers.
        </p>

        {result === null ? (
          <>
            <label className="mt-3.5 block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500" htmlFor="broadcast-message">
              DIRECTIVE MESSAGE
            </label>
            <textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border border-line-2 bg-surface-2 px-3 py-2 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              placeholder="Enter immediate safety instructions..."
            />

            <fieldset className="mt-3">
              <legend className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500">
                UPLINK CHANNEL
              </legend>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {CHANNEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-700 cursor-pointer has-[:checked]:border-action has-[:checked]:bg-action/15 has-[:checked]:text-ink-900"
                  >
                    <input
                      type="radio"
                      name="broadcast-channel"
                      value={option.value}
                      checked={channel === option.value}
                      onChange={() => handleChannelChange(option.value)}
                      className="accent-action"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-3 block text-[10px] font-mono font-bold uppercase tracking-wider text-ink-500" htmlFor="broadcast-target">
              TARGET DESTINATION
            </label>
            <input
              id="broadcast-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={channel === 'wifi'}
              className="mt-1 w-full rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs text-ink-900 placeholder:text-ink-500 focus:border-action focus:outline-none focus:ring-1 focus:ring-action disabled:bg-surface-3 disabled:text-ink-500"
              placeholder={channel === 'phone' ? '+1...' : channel === 'email' ? 'responder@example.com' : ''}
            />

            {error ? (
              <p role="alert" className="mt-2 font-mono text-xs text-priority-critical">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-ink-700 hover:bg-surface-3 hover:text-ink-900 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="flex items-center gap-1.5 rounded bg-danger px-4 py-1.5 font-mono text-xs font-bold text-white hover:bg-danger-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={12} />
                {isSending ? 'TRANSMITTING...' : 'TRANSMIT DIRECTIVE'}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 size={32} className="text-success" />
            <p className="font-mono text-sm font-bold text-ink-900">
              {result === 'sent' ? 'BROADCAST DISPATCH CONFIRMED' : 'QUEUED IN LOCAL OUTBOX'}
            </p>
            <p className="font-mono text-xs text-ink-500">
              {result === 'sent'
                ? 'Directive relayed to destination channels.'
                : 'Offline queue will flush on next network recovery.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded border border-line-2 bg-surface-2 px-4 py-1.5 font-mono text-xs font-bold text-ink-900 hover:bg-surface-3"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
