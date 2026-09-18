'use client';

import React from 'react';
import { Flame, Mountain, Waves, HelpCircle } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { getCategory } from '@responder/lib/schema';
import { AnimatedCounter } from './AnimatedCounter';

interface DonutChartProps {
  incidents: IncidentResponse[];
}

interface CategorySlice {
  id: string;
  label: string;
  count: number;
  color: string;
  glow: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function DonutChart({ incidents }: DonutChartProps) {
  const total = incidents.length;

  const counts = {
    flood: incidents.filter((i) => getCategory(i) === 'flood').length,
    fire: incidents.filter((i) => getCategory(i) === 'fire').length,
    landslide: incidents.filter((i) => getCategory(i) === 'landslide').length,
    other: incidents.filter((i) => getCategory(i) === 'other').length,
  };

  const slices: CategorySlice[] = [
    { id: 'flood', label: 'Flood / Water', count: counts.flood, color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)', icon: Waves },
    { id: 'fire', label: 'Fire / Wildfire', count: counts.fire, color: '#F97316', glow: 'rgba(249, 115, 22, 0.4)', icon: Flame },
    { id: 'landslide', label: 'Landslide', count: counts.landslide, color: '#EAB308', glow: 'rgba(234, 179, 8, 0.4)', icon: Mountain },
    { id: 'other', label: 'Other Hazard', count: counts.other, color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.4)', icon: HelpCircle },
  ];

  const size = 150;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="hud-panel hud-bracket p-4 shadow-panel">
      <div className="flex items-center justify-between pb-2.5 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="hud-tag">DIST.HAZARD</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Threat Breakdown
          </h3>
        </div>
        <span className="font-mono text-xs text-ink-500">
          [{total} ACTIVE]
        </span>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-around gap-4">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="-rotate-90 transform">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {total > 0 &&
              slices.map((slice) => {
                if (slice.count === 0) return null;
                const slicePercent = slice.count / total;
                const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += slicePercent;

                return (
                  <circle
                    key={slice.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="none"
                    style={{
                      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: `drop-shadow(0 0 3px ${slice.glow})`,
                    }}
                  />
                );
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              <AnimatedCounter value={total} />
            </span>
            <span className="text-[9px] font-bold tracking-wider text-ink-500 uppercase font-mono">
              SIGNALS
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 w-full max-w-xs">
          {slices.map((slice) => {
            const Icon = slice.icon;
            const pct = total > 0 ? Math.round((slice.count / total) * 100) : 0;
            return (
              <div
                key={slice.id}
                className="flex items-center justify-between border border-line/40 bg-surface-2/40 px-2.5 py-1.5 transition-colors hover:bg-surface-2"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-sm"
                    style={{ backgroundColor: `${slice.color}20` }}
                  >
                    <Icon className="h-3 w-3" style={{ color: slice.color }} />
                  </div>
                  <span className="text-xs font-medium text-ink-700">{slice.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-bold text-white">{slice.count}</span>
                  <span className="text-[10px] text-ink-500">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
