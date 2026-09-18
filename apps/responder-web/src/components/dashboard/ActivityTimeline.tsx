'use client';

import React from 'react';
import { Clock, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { getCategory, CATEGORY_LABELS } from '@responder/lib/schema';
import { formatLocation, formatTimestamp } from '@responder/lib/format';

interface ActivityTimelineProps {
  incidents: IncidentResponse[];
  onSelectIncident: (id: string) => void;
}

export function ActivityTimeline({ incidents, onSelectIncident }: ActivityTimelineProps) {
  // Sort latest first, take recent 6
  const recent = [...incidents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="glass rounded-xl border border-line p-4 shadow-panel">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-action animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Live Incident Stream
          </h3>
        </div>
        <span className="rounded bg-action/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-action uppercase">
          Feed Active
        </span>
      </div>

      <div className="mt-3 divide-y divide-line/40 max-h-[280px] overflow-y-auto pr-1">
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-500">No recent incidents detected.</p>
        ) : (
          recent.map((inc) => {
            const isCritical = inc.priority === 'critical';
            const isHigh = inc.priority === 'high';
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="group flex cursor-pointer items-start justify-between py-2.5 px-2 transition-all duration-150 rounded-lg hover:bg-surface-2/60"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      isCritical
                        ? 'bg-red-500 animate-ping'
                        : isHigh
                        ? 'bg-orange-500'
                        : 'bg-action'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-action transition-colors">
                        {inc.id.slice(0, 8)}...
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold uppercase ${
                          isCritical
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-surface-3 text-ink-500'
                        }`}
                      >
                        {inc.priority}
                      </span>
                    </div>
                    <p className="text-xs text-ink-700 mt-0.5">
                      {CATEGORY_LABELS[getCategory(inc)]} - {formatLocation(inc.location)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono text-[11px] text-ink-500 shrink-0">
                  <span>{formatTimestamp(inc.createdAt)}</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-action" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
