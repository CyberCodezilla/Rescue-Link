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
      accent: 'text-red-400',
      borderStripe: 'border-l-red-500',
      badgeBg: 'bg-red-500/15 border-red-500/30 text-red-300',
      bgGlow: critical > 0 ? 'hud-glow-red' : '',
    },
    {
      label: 'HIGH PRIORITY',
      value: high,
      accent: 'text-orange-400',
      borderStripe: 'border-l-orange-500',
      badgeBg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
      bgGlow: high > 0 ? 'hud-glow-orange' : '',
    },
    {
      label: 'PENDING TRIAGE',
      value: pendingTriage,
      accent: 'text-slate-400',
      borderStripe: 'border-l-slate-500',
      badgeBg: 'bg-slate-800/80 border-slate-700 text-slate-300',
      bgGlow: '',
    },
    {
      label: 'ACTIVE INCIDENTS',
      value: active,
      accent: 'text-blue-400',
      borderStripe: 'border-l-blue-500',
      badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      bgGlow: '',
    },
    {
      label: 'UNASSIGNED UNITS',
      value: unassigned,
      accent: 'text-amber-400',
      borderStripe: 'border-l-amber-500',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      bgGlow: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-md px-4 py-3.5 border-l-4 ${metric.borderStripe} ${metric.bgGlow} transition-all duration-200 hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              {metric.label}
            </span>
          </div>
          <p className={`mt-1.5 text-2xl font-black font-mono tracking-tight ${metric.accent}`}>
            <AnimatedCounter value={metric.value} />
          </p>
        </div>
      ))}
    </div>
  );
}
