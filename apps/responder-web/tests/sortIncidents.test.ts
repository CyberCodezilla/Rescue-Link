import { describe, expect, it } from 'vitest';
import { filterIncidents, sortIncidents } from '@responder/lib/sortIncidents';
import { formatLocation, hasAssignedUnits } from '@responder/lib/format';
import type { IncidentResponse } from '@responder/lib/schema';

function makeIncident(overrides: Partial<IncidentResponse>): IncidentResponse {
  return {
    id: 'inc-1',
    category: 'flood',
    description: 'test',
    location: { lat: 1, lng: 2 },
    peopleAffected: 1,
    urgentNeeds: [],
    status: 'new',
    priority: 'medium',
    createdAt: 1767225600000,
  updatedAt: 1767225600000,    ...overrides,
  };
}

describe('filterIncidents', () => {
  it('returns all incidents when filters are "all"', () => {
    const incidents = [makeIncident({ id: 'a' }), makeIncident({ id: 'b' })];
    expect(filterIncidents(incidents, { status: 'all', priority: 'all', category: 'all' })).toHaveLength(2);
  });

  it('filters by status, priority, and category independently', () => {
    const incidents = [
      makeIncident({ id: 'a', status: 'new', priority: 'critical', category: 'flood' }),
      makeIncident({ id: 'b', status: 'resolved', priority: 'low', category: 'fire' }),
    ];

    expect(filterIncidents(incidents, { status: 'new', priority: 'all', category: 'all' })).toEqual([
      incidents[0],
    ]);
    expect(filterIncidents(incidents, { status: 'all', priority: 'low', category: 'all' })).toEqual([
      incidents[1],
    ]);
    expect(filterIncidents(incidents, { status: 'all', priority: 'all', category: 'fire' })).toEqual([
      incidents[1],
    ]);
  });

  it('"active" status matches new/acknowledged/in_progress but excludes resolved/closed', () => {
    const incidents = [
      makeIncident({ id: 'new', status: 'new' }),
      makeIncident({ id: 'ack', status: 'acknowledged' }),
      makeIncident({ id: 'progress', status: 'in_progress' }),
      makeIncident({ id: 'resolved', status: 'resolved' }),
      makeIncident({ id: 'closed', status: 'closed' }),
    ];

    const active = filterIncidents(incidents, { status: 'active', priority: 'all', category: 'all' });
    expect(active.map((i) => i.id).sort()).toEqual(['ack', 'new', 'progress']);
  });
});

describe('sortIncidents', () => {
  it('orders by priority first: critical before pending_triage', () => {
    const incidents = [
      makeIncident({ id: 'low', priority: 'low' }),
      makeIncident({ id: 'critical', priority: 'critical' }),
      makeIncident({ id: 'pending', priority: 'pending_triage' }),
    ];

    const sorted = sortIncidents(incidents);
    expect(sorted.map((i) => i.id)).toEqual(['critical', 'low', 'pending']);
  });

  it('breaks ties within the same priority by most recently updated first', () => {
    const incidents = [
      makeIncident({ id: 'older', priority: 'high', updatedAt: 1767225600000 }),
      makeIncident({ id: 'newer', priority: 'high', updatedAt: 1767312000000 }),
    ];

    const sorted = sortIncidents(incidents);
    expect(sorted.map((i) => i.id)).toEqual(['newer', 'older']);
  });
});

describe('formatLocation', () => {
  it('prefers the label when present', () => {
    expect(formatLocation({ lat: 1, lng: 2, label: 'Downtown' })).toBe('Downtown');
  });

  it('falls back to coordinates when no label exists', () => {
    expect(formatLocation({ lat: 37.7749, lng: -122.4194 })).toBe('37.7749, -122.4194');
  });
});

describe('hasAssignedUnits', () => {
  it('is false for undefined or empty arrays', () => {
    expect(hasAssignedUnits(undefined)).toBe(false);
    expect(hasAssignedUnits([])).toBe(false);
  });

  it('is true when at least one unit is present', () => {
    expect(hasAssignedUnits(['Unit 4'])).toBe(true);
  });
});
