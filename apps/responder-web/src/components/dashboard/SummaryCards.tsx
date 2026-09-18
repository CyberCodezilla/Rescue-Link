'use client';

import React from 'react';
import type { IncidentResponse } from '@responder/lib/schema';
import { hasAssignedUnits } from '@responder/lib/format';
import { AnimatedCounter } from './AnimatedCounter';

interface SummaryCardsProps {
  incidents: IncidentResponse[];
}

const ACTIVE_STATUSES = new Set(['new', 'acknowledged', 'in_progress']);

export function SummaryCards({ incidents }: SummaryCardsProps) {
  const critical = incidents.filter((i) => i.priority === 'critical').length;
  const high = incidents.filter((i) => i.priority === 'high').length;
  const pendingTriage = incidents.filter((i) => i.priority === 'pending_triage').length;
  const active = incidents.filter((i) => ACTIVE_STATUSES.has(i.status)).length;
  const unassigned = incidents.filter(
    (i) => ACTIVE_STATUSES.has(i.status) && !hasAssignedUnits(i.triage?.assignedUnits)
  ).length;

  const metrics = [
    {
      label: 'CRITICAL',
      value: critical,
      accent: 'text-priority-critical',
      borderColor: 'border-l-priority-critical',
      bgGlow: critical > 0 ? 'hud-glow-red' : '',
    },
    {
      label: 'HIGH PRIORITY',
      value: high,
      accent: 'text-priority-high',
      borderColor: 'border-l-priority-high',
      bgGlow: high > 0 ? 'hud-glow-orange' : '',
    },
    {
      label: 'PENDING TRIAGE',
      value: pendingTriage,
      accent: 'text-priority-pending',
      borderColor: 'border-l-priority-pending',
      bgGlow: '',
    },
    {
      label: 'ACTIVE INCIDENTS',
      value: active,
      accent: 'text-action',
      borderColor: 'border-l-action',
      bgGlow: '',
    },
    {
      label: 'UNASSIGNED UNITS',
      value: unassigned,
      accent: 'text-ink-700',
      borderColor: 'border-l-ink-500',
      bgGlow: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`hud-panel px-4 py-3 border-l-4 ${metric.borderColor} ${metric.bgGlow} transition-all duration-200 hover:border-line-2`}
        >
          <p className="text-[10px] font-bold tracking-wider text-ink-500 uppercase font-mono">
            {metric.label}
          </p>
          <p className={`mt-1 text-2xl font-bold font-mono tracking-tight ${metric.accent}`}>
            <AnimatedCounter value={metric.value} />
          </p>
        </div>
      ))}
    </div>
  );
}
