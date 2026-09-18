'use client';

import React from 'react';

interface SparklineBarProps {
  values?: number[];
  color?: string;
  height?: number;
}

export function SparklineBar({
  values = [2, 4, 3, 6, 5, 8],
  color = '#3B82F6',
  height = 18,
}: SparklineBarProps) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1" style={{ height }} aria-hidden="true">
      {values.map((v, i) => {
        const barHeight = Math.max(Math.round((v / max) * height), 3);
        const isLast = i === values.length - 1;
        return (
          <div
            key={i}
            className="w-1 rounded-t-sm transition-all duration-500 ease-out"
            style={{
              height: `${barHeight}px`,
              backgroundColor: color,
              opacity: isLast ? 1 : 0.25 + (i / values.length) * 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
