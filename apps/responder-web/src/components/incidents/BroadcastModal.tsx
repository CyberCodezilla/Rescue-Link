'use client';

import { useState } from 'react';
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
  { value: 'phone', label: 'Phone (SMS/IVR)' },
  { value: 'email', label: 'Email' },
  { value: 'wifi', label: 'Captive Wi-Fi banner (geofenced zone)' },
];

/**
 * Picks the most sensible default channel from what we actually know about
 * the reporter, but the dispatcher can always override it — the PRD lists
 * three distinct channels, so this is a real choice, not just inferred.
 */
function defaultTarget(incident: IncidentResponse): { channel: Channel; target: string } {
  const reporter = incident.reporter;
  if (reporter?.contactMethod === 'phone' && reporter.contactValue) {
    return { channel: 'phone', target: reporter.contactValue };
  }
  if (reporter?.contactMethod === 'email' && reporter.contactValue) {
    return { channel: 'email', target: reporter.contactValue };
  }
  return { channel: 'wifi', target: 'All devices within incident radius' };
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
      setTarget('All devices within incident radius');
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
        // Real network/server failure (not the "endpoint doesn't exist"
        // case anymore — that's fixed — but a field tablet can still lose
        // connectivity mid-request). Queue locally so nothing is lost.
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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink-900/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-base font-semibold text-ink-900">Broadcast flash alert</h2>
        <p className="mt-1 text-sm text-ink-500">
          Reviews the Bedrock AI safety directive before sending to the survivor or geofenced zone.
        </p>

        {result === null ? (
          <>
            <label className="mt-4 block text-xs font-medium text-ink-500" htmlFor="broadcast-message">
              Message
            </label>
            <textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border border-line px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              placeholder="Safety directive for the affected area…"
            />

            <fieldset className="mt-3">
              <legend className="text-xs font-medium text-ink-500">Recipient channel</legend>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {CHANNEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 rounded border border-line px-2.5 py-1.5 text-sm text-ink-700 has-[:checked]:border-action has-[:checked]:bg-action-soft"
                  >
                    <input
                      type="radio"
                      name="broadcast-channel"
                      value={option.value}
                      checked={channel === option.value}
                      onChange={() => handleChannelChange(option.value)}
                      className="accent-action"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-3 block text-xs font-medium text-ink-500" htmlFor="broadcast-target">
              Target
            </label>
            <input
              id="broadcast-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={channel === 'wifi'}
              className="mt-1 w-full rounded border border-line px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action disabled:bg-canvas disabled:text-ink-500"
              placeholder={channel === 'phone' ? '+91…' : channel === 'email' ? 'name@example.com' : ''}
            />

            {error ? (
              <p role="alert" className="mt-2 text-sm text-priority-critical">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !message.trim() || !target.trim()}
                className="rounded bg-danger px-3.5 py-1.5 text-sm font-medium text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? 'Sending…' : 'Send broadcast'}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            {result === 'sent' ? (
              <p className="text-sm text-success">Broadcast delivered.</p>
            ) : (
              <p className="text-sm text-priority-pending">
                Couldn&rsquo;t reach the server just now, so this was saved to the local outbox
                instead of being lost. It will show as pending until it can be retried.
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-line px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-canvas"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
