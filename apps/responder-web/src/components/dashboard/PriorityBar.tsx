'use client';

import React from 'react';
import type { IncidentResponse } from '@responder/lib/schema';
import { AnimatedCounter } from './AnimatedCounter';

interface PriorityBarProps {
  incidents: IncidentResponse[];
}

export function PriorityBar({ incidents }: PriorityBarProps) {
  const total = incidents.length;

  const counts = {
    critical: incidents.filter((i) => i.priority === 'critical').length,
    high: incidents.filter((i) => i.priority === 'high').length,
    medium: incidents.filter((i) => i.priority === 'medium').length,
    low: incidents.filter((i) => i.priority === 'low').length,
    pending: incidents.filter((i) => i.priority === 'pending_triage').length,
  };

  const segments = [
    { label: 'Critical', count: counts.critical, color: '#EF4444', bg: 'bg-red-500' },
    { label: 'High', count: counts.high, color: '#F97316', bg: 'bg-orange-500' },
    { label: 'Medium', count: counts.medium, color: '#EAB308', bg: 'bg-yellow-500' },
    { label: 'Low', count: counts.low, color: '#10B981', bg: 'bg-emerald-500' },
    { label: 'Pending', count: counts.pending, color: '#64748B', bg: 'bg-slate-500' },
  ];

  return (
    <div className="hud-panel hud-bracket p-4 shadow-panel">
      <div className="flex items-center justify-between pb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="hud-tag">SPECTRUM.PRIORITY</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Severity Distribution
          </h3>
        </div>
        <span className="text-xs font-mono text-ink-500">
          TRIAGE RATIO
        </span>
      </div>

      {/* Segmented Tactical Bar */}
      <div className="mt-3.5 flex h-3 w-full overflow-hidden bg-surface-3 p-0.5 border border-line">
        {total === 0 ? (
          <div className="h-full w-full bg-surface-2" />
        ) : (
          segments.map((seg) => {
            if (seg.count === 0) return null;
            const pct = (seg.count / total) * 100;
            return (
              <div
                key={seg.label}
                title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
                className={`h-full transition-all duration-700 ease-out ${seg.bg}`}
                style={{
                  width: `${pct}%`,
                  boxShadow: `0 0 6px ${seg.color}`,
                }}
              />
            );
          })
        )}
      </div>

      {/* Numerical Indicators */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2" style={{ backgroundColor: seg.color }} />
              <span className="text-ink-500 text-[11px]">{seg.label}:</span>
              <span className="font-bold text-white">
                <AnimatedCounter value={seg.count} />
              </span>
              <span className="text-[10px] text-ink-500">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
