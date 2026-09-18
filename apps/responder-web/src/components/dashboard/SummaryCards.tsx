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

  const cards = [
    {
      label: 'Critical Priority',
      value: critical,
      color: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.4)',
      icon: ShieldAlert,
      cardBorder: 'hover:border-red-500/50',
      sparkColor: '#EF4444',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
      values: [1, 2, 1, 3, 2, critical || 1],
    },
    {
      label: 'High Severity',
      value: high,
      color: '#F97316',
      glow: 'rgba(249, 115, 22, 0.4)',
      icon: Flame,
      cardBorder: 'hover:border-orange-500/50',
      sparkColor: '#F97316',
      badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      values: [2, 3, 4, 3, 5, high || 2],
    },
    {
      label: 'Pending Triage',
      value: pendingTriage,
      color: '#EAB308',
      glow: 'rgba(234, 179, 8, 0.4)',
      icon: Clock,
      cardBorder: 'hover:border-yellow-500/50',
      sparkColor: '#EAB308',
      badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      values: [4, 3, 2, 4, 2, pendingTriage || 1],
    },
    {
      label: 'Active Operations',
      value: active,
      color: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.4)',
      icon: Activity,
      cardBorder: 'hover:border-blue-500/50',
      sparkColor: '#3B82F6',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      values: [5, 8, 7, 10, 9, active || 5],
    },
    {
      label: 'Unassigned Units',
      value: unassigned,
      color: '#A855F7',
      glow: 'rgba(168, 85, 247, 0.4)',
      icon: Users,
      cardBorder: 'hover:border-purple-500/50',
      sparkColor: '#A855F7',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      values: [3, 2, 4, 1, 3, unassigned || 1],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`glass relative overflow-hidden rounded-xl border border-line p-3.5 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel-lg ${card.cardBorder}`}
          >
            {/* Ambient accent top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: card.color, boxShadow: `0 0 8px ${card.color}` }}
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 truncate">
                {card.label}
              </span>
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: card.color } as React.CSSProperties} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                <AnimatedCounter value={card.value} />
              </span>
              <RadialGauge
                value={card.value}
                max={Math.max(total, 1)}
                size={38}
                strokeWidth={3.5}
                color={card.color}
                glowColor={card.glow}
              />
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/40">
              <span className="text-[10px] font-medium text-ink-500">
                {total > 0 ? `${Math.round((card.value / total) * 100)}% of total` : '0%'}
              </span>
              <SparklineBar values={card.values} color={card.sparkColor} height={14} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
