'use client';

import React from 'react';
import { Clock, ArrowRight, Crosshair } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { getCategory, CATEGORY_LABELS } from '@responder/lib/schema';
import { formatLocation, formatTimestamp } from '@responder/lib/format';

interface ActivityTimelineProps {
  incidents: IncidentResponse[];
  selectedId: string | null;
  hoveredId?: string | null;
  onSelectIncident: (id: string) => void;
  onHoverIncident?: (id: string | null) => void;
}

export function ActivityTimeline({
  incidents,
  selectedId,
  hoveredId,
  onSelectIncident,
  onHoverIncident,
}: ActivityTimelineProps) {
  const recent = [...incidents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="hud-panel-topcut p-3.5 shadow-panel">
      <div className="flex items-center justify-between pb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="hud-tag">STREAM.LIVE</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Incident Telemetry Feed
          </h3>
        </div>
        <span className="font-mono text-[10px] text-action tracking-wider animate-pulse">
          HOVER // RADAR ACQUIRE
        </span>
      </div>

      <div className="mt-2 divide-y divide-line/30 max-h-[260px] overflow-y-auto pr-1">
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-500 font-mono">CAD stream idling — awaiting telemetry.</p>
        ) : (
          recent.map((inc) => {
            const isCritical = inc.priority === 'critical';
            const isHigh = inc.priority === 'high';
            const isSelected = inc.id === selectedId;
            const isHovered = inc.id === hoveredId;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                onMouseEnter={() => onHoverIncident?.(inc.id)}
                onMouseLeave={() => onHoverIncident?.(null)}
                className={`group flex cursor-pointer items-start justify-between py-2 px-2 transition-all duration-150 border-l-2 ${
                  isSelected
                    ? 'border-action bg-action/15 text-white'
                    : isHovered
                    ? 'border-cyan-400 bg-surface-2/80 text-white'
                    : 'border-transparent hover:border-line-2 hover:bg-surface-2/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 flex items-center justify-center shrink-0">
                    {isHovered ? (
                      <Crosshair className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isCritical
                            ? 'bg-red-500 animate-ping'
                            : isHigh
                            ? 'bg-orange-500'
                            : 'bg-action'
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-white group-hover:text-action">
                        {inc.id.slice(0, 8)}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-wider ${
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
                    <p className="text-[11px] text-ink-700 mt-0.5">
                      {CATEGORY_LABELS[getCategory(inc)]} — {formatLocation(inc.location)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono text-[10px] text-ink-500 shrink-0">
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
