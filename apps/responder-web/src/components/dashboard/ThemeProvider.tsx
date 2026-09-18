'use client';

import React, { useEffect } from 'react';
import type { IncidentResponse } from '@responder/lib/schema';
import { getCategory } from '@responder/lib/schema';

interface ThemeProviderProps {
  incidents: IncidentResponse[] | null;
  children: React.ReactNode;
}

export function ThemeProvider({ incidents, children }: ThemeProviderProps) {
  useEffect(() => {
    if (!incidents || incidents.length === 0) return;

    const floodCount = incidents.filter((i) => getCategory(i) === 'flood').length;
    const fireCount = incidents.filter((i) => getCategory(i) === 'fire').length;
    const landslideCount = incidents.filter((i) => getCategory(i) === 'landslide').length;

    let accent = '#3B82F6';
    let glow = 'rgba(59, 130, 246, 0.15)';

    if (fireCount > floodCount && fireCount > landslideCount) {
      // Fire dominant: warm amber
      accent = '#F97316';
      glow = 'rgba(249, 115, 22, 0.20)';
    } else if (floodCount > fireCount && floodCount > landslideCount) {
      // Flood dominant: cyan
      accent = '#06B6D4';
      glow = 'rgba(6, 182, 212, 0.20)';
    } else if (landslideCount > fireCount && landslideCount > floodCount) {
      // Landslide dominant: gold
      accent = '#EAB308';
      glow = 'rgba(234, 179, 8, 0.20)';
    }

    document.documentElement.style.setProperty('--ctx-accent', accent);
    document.documentElement.style.setProperty('--ctx-glow', glow);
  }, [incidents]);

  return <>{children}</>;
}
