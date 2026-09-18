'use client';

import React from 'react';

interface RadialGaugeProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  glowColor?: string;
  children?: React.ReactNode;
}

export function RadialGauge({
  value,
  max,
  size = 46,
  strokeWidth = 4,
  color,
  glowColor,
  children,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform transition-all duration-700 ease-out"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated fill circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: glowColor ? `drop-shadow(0 0 4px ${glowColor})` : undefined,
          }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
