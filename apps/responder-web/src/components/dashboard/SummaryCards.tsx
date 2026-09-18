'use client';

import React from 'react';
import { ShieldAlert, Flame, Clock, Activity, Users } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { hasAssignedUnits } from '@responder/lib/format';
import { AnimatedCounter } from './AnimatedCounter';
import { RadialGauge } from './RadialGauge';
import { SparklineBar } from './SparklineBar';

interface SummaryCardsProps {
  incidents: IncidentResponse[];
}

const ACTIVE_STATUSES = new Set(['new', 'acknowledged', 'in_progress']);

export function SummaryCards({ incidents }: SummaryCardsProps) {
  const total = incidents.length;
  const critical = incidents.filter((i) => i.priority === 'critical').length;
  const high = incidents.filter((i) => i.priority === 'high').length;
  const pendingTriage = incidents.filter((i) => i.priority === 'pending_triage').length;
  const active = incidents.filter((i) => ACTIVE_STATUSES.has(i.status)).length;
  const unassigned = incidents.filter(
    (i) => ACTIVE_STATUSES.has(i.status) && !hasAssignedUnits(i.triage?.assignedUnits)
  ).length;

  const pods = [
    {
      code: 'CAD.P1',
      label: 'Critical Priority',
      value: critical,
      color: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.4)',
      icon: ShieldAlert,
      sparkColor: '#EF4444',
      values: [1, 2, 1, 3, 2, critical || 1],
    },
    {
      code: 'CAD.P2',
      label: 'High Threat',
      value: high,
      color: '#F97316',
      glow: 'rgba(249, 115, 22, 0.4)',
      icon: Flame,
      sparkColor: '#F97316',
      values: [2, 3, 4, 3, 5, high || 2],
    },
    {
      code: 'CAD.TRIAGE',
      label: 'Pending Triage',
      value: pendingTriage,
      color: '#EAB308',
      glow: 'rgba(234, 179, 8, 0.4)',
      icon: Clock,
      sparkColor: '#EAB308',
      values: [4, 3, 2, 4, 2, pendingTriage || 1],
    },
    {
      code: 'CAD.ACTIVE',
      label: 'Active Ops',
      value: active,
      color: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.4)',
      icon: Activity,
      sparkColor: '#3B82F6',
      values: [5, 8, 7, 10, 9, active || 5],
    },
    {
      code: 'CAD.STANDBY',
      label: 'Unassigned',
      value: unassigned,
      color: '#A855F7',
      glow: 'rgba(168, 85, 247, 0.4)',
      icon: Users,
      sparkColor: '#A855F7',
      values: [3, 2, 4, 1, 3, unassigned || 1],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {pods.map((pod) => {
        const Icon = pod.icon;
        const pct = total > 0 ? Math.round((pod.value / total) * 100) : 0;
        return (
          <div
            key={pod.label}
            className="hud-panel hud-bracket p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel-lg"
          >
            {/* Top Tactical Classification Bar */}
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-line/40">
              <span className="font-mono text-[9px] font-extrabold tracking-wider text-action uppercase">
                {pod.code}
              </span>
              <div
                className="flex h-5 w-5 items-center justify-center rounded-sm"
                style={{ backgroundColor: `${pod.color}20` }}
              >
                <Icon className="h-3 w-3" style={{ color: pod.color } as React.CSSProperties} />
              </div>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mt-2 truncate">
              {pod.label}
            </p>

            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                <AnimatedCounter value={pod.value} />
              </span>
              <RadialGauge
                value={pod.value}
                max={Math.max(total, 1)}
                size={36}
                strokeWidth={3}
                color={pod.color}
                glowColor={pod.glow}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-line/40">
              <span className="text-[10px] font-mono text-ink-500">
                {pct}% load
              </span>
              <SparklineBar values={pod.values} color={pod.sparkColor} height={12} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
