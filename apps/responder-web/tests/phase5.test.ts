import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DistressAudioPlayer } from '@responder/components/incidents/DistressAudioPlayer';
import { PriorityBadge } from '@responder/components/incidents/PriorityBadge';
import { buildDashboardMapLayerData } from '@responder/lib/dashboardIntegration';
import type { HazardZone, IncidentResponse, SensorReading, UnitPosition, Priority } from '@responder/lib/schema';

function makeIncident(overrides: Partial<IncidentResponse> = {}): IncidentResponse {
  return {
    id: 'incident-1',
    createdAt: 1767225600000,
    updatedAt: 1767225600000,
    status: 'new',
    priority: 'medium',
    location: { lat: 12, lng: 80 },
    category: 'flood',
    description: 'Test incident',
    peopleAffected: 2,
    urgentNeeds: [],
    ...overrides,
  };
}

describe('Phase 5 responder integration', () => {
  it('renders the distress audio player when audioBlob exists', () => {
    const html = renderToStaticMarkup(
      createElement(DistressAudioPlayer, { incident: makeIncident({ audioBlob: 'data:audio/webm;base64,TEST' }) })
    );
    expect(html).toContain('Distress Audio');
    expect(html).toContain('<audio');
    expect(html).toContain('controls');
    expect(html).toContain('data:audio/webm;base64,TEST');
  });

  it('does not render an audio player when audioBlob is absent', () => {
    const html = renderToStaticMarkup(createElement(DistressAudioPlayer, { incident: makeIncident() }));
    expect(html).toBe('');
  });

  it('renders all five priority badges', () => {
    const priorities: Priority[] = ['critical', 'high', 'medium', 'low', 'pending_triage'];
    for (const priority of priorities) {
      const html = renderToStaticMarkup(createElement(PriorityBadge, { priority }));
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain(
        ({
          critical: 'Critical',
          high: 'High',
          medium: 'Medium',
          low: 'Low',
          pending_triage: 'Pending Triage',
        } as Record<Priority, string>)[priority]
      );
    }
  });

  it('passes sensors, hazard zones, and field unit positions through the map integration boundary', () => {
    const sensors: SensorReading[] = [
      {
        id: 'sensor-1',
        label: 'River Sensor #4',
        kind: 'water_level',
        location: { lat: 12, lng: 80 },
        value: 92,
        unit: '%',
        thresholdPercent: 92,
        status: 'critical',
        updatedAt: 1767225600000,
      },
    ];
    const hazardZones: HazardZone[] = [
      {
        id: 'zone-1',
        label: 'Flood Zone A',
        kind: 'flood',
        severity: 'critical',
        center: { lat: 12, lng: 80 },
        radiusMeters: 500,
      },
    ];
    const unitPositions: UnitPosition[] = [
      { unitName: 'Medic-2', lat: 12.01, lng: 80.01, reportedAt: 1767225600000 },
    ];

    const data = buildDashboardMapLayerData(sensors, hazardZones, unitPositions);
    expect(data.sensors).toBe(sensors);
    expect(data.hazardZones).toBe(hazardZones);
    expect(data.unitPositions).toBe(unitPositions);
  });
});
