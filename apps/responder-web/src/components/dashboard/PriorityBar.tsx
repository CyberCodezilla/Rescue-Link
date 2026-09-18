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
    { label: 'Critical', count: counts.critical, color: '#EF4444', bg: 'bg-red-500', glow: 'shadow-red-500/30' },
    { label: 'High', count: counts.high, color: '#F97316', bg: 'bg-orange-500', glow: 'shadow-orange-500/30' },
    { label: 'Medium', count: counts.medium, color: '#EAB308', bg: 'bg-yellow-500', glow: 'shadow-yellow-500/30' },
    { label: 'Low', count: counts.low, color: '#10B981', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
    { label: 'Pending', count: counts.pending, color: '#6B7280', bg: 'bg-gray-500', glow: 'shadow-gray-500/30' },
  ];

  return (
    <div className="glass rounded-xl border border-line p-4 shadow-panel">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
          Triage Priority Balance
        </h3>
        <span className="text-xs font-mono text-ink-500">
          Severity Spectrum
        </span>
      </div>

      {/* Stacked Bar */}
      <div className="mt-3 flex h-3.5 w-full overflow-hidden rounded-full bg-surface-3 p-0.5 ring-1 ring-white/10">
        {total === 0 ? (
          <div className="h-full w-full bg-surface-2 rounded-full" />
        ) : (
          segments.map((seg) => {
            if (seg.count === 0) return null;
            const pct = (seg.count / total) * 100;
            return (
              <div
                key={seg.label}
                title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
                className={`h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full ${seg.bg}`}
                style={{
                  width: `${pct}%`,
                  boxShadow: `0 0 8px ${seg.color}`,
                }}
              />
            );
          })
        )}
      </div>

      {/* Indicators */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full ring-2 ring-white/10"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-medium text-ink-700">{seg.label}:</span>
              <span className="font-bold text-white font-mono">
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
