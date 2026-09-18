import { describe, it, expect } from 'vitest';
import { hasAssignedUnits } from '../src/lib/format';
import { getCategory } from '../src/lib/schema';
import type { IncidentResponse } from '../src/lib/schema';

describe('Audit Remediation Tests - Responder Web', () => {
  it('hasAssignedUnits accurately evaluates triage.assignedUnits', () => {
    const incidentWithoutUnits: Partial<IncidentResponse> = {
      id: 'inc-1',
      assignedTo: 'Officer Miller', // Dispatcher only, no field units
      triage: {},
    };

    const incidentWithUnits: Partial<IncidentResponse> = {
      id: 'inc-2',
      assignedTo: 'Officer Miller',
      triage: { assignedUnits: ['Boat Unit-4'] },
    };

    // Checking triage.assignedUnits correctly reports unassigned for field teams
    expect(hasAssignedUnits(incidentWithoutUnits.triage?.assignedUnits)).toBe(false);
    expect(hasAssignedUnits(incidentWithUnits.triage?.assignedUnits)).toBe(true);
  });

  it('getCategory properly resolves top-level category and details.category', () => {
    const topLevelIncident: any = {
      category: 'flood',
    };

    const nestedDetailsIncident: any = {
      details: { category: 'fire' },
    };

    const fallbackIncident: any = {};

    expect(getCategory(topLevelIncident)).toBe('flood');
    expect(getCategory(nestedDetailsIncident)).toBe('fire');
    expect(getCategory(fallbackIncident)).toBe('other');
  });
});
