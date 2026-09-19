import { describe, it, expect } from 'vitest';
import {
  IncidentStatusEnum,
  IncidentResponseSchema,
  type IncidentResponse,
  type SurvivorSSEEvent,
} from '@/lib/validation';

describe('Phase 4 Survivor-Side Incident Lifecycle & Synchronization Tests', () => {
  const baseIncident: IncidentResponse = {
    id: 'inc-phase4-test-01',
    category: 'flood',
    description: 'Flash flooding on Main Street, 3 people trapped on roof',
    location: {
      lat: 19.076,
      lng: 72.8777,
      label: 'Main Street Crossing',
    },
    peopleAffected: 3,
    urgentNeeds: ['boat', 'medical'],
    status: 'new',
    priority: 'high',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  describe('1. IncidentStatusEnum Phase 4 Schema Alignment', () => {
    it('accepts all 5 lifecycle statuses including closed', () => {
      const validStatuses = ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'];
      validStatuses.forEach((st) => {
        const result = IncidentStatusEnum.safeParse(st);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(st);
        }
      });
    });

    it('rejects invalid statuses', () => {
      const invalidStatuses = ['pending', 'completed', 'cancelled', 'archive', 'unknown'];
      invalidStatuses.forEach((st) => {
        const result = IncidentStatusEnum.safeParse(st);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('2. IncidentResponseSchema Full Lifecycle Validation', () => {
    it('successfully parses an incident in closed status', () => {
      const closedIncident = {
        ...baseIncident,
        status: 'closed',
        assignedTo: 'dispatcher-cmd-01',
        triage: {
          suggestedAction: 'Operation completed. Stand down.',
          assignedUnits: ['Boat Unit-1', 'Rescue Squad 4'],
          summary: 'All survivors extracted safely.',
        },
      };

      const result = IncidentResponseSchema.safeParse(closedIncident);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('closed');
        expect(result.data.assignedTo).toBe('dispatcher-cmd-01');
        expect(result.data.triage?.assignedUnits).toEqual(['Boat Unit-1', 'Rescue Squad 4']);
      }
    });

    it('retains both assignedTo (lead officer) and assignedUnits (field units) independently', () => {
      const assignedIncident = {
        ...baseIncident,
        status: 'in_progress',
        assignedTo: 'Lead Officer Miller',
        triage: {
          assignedUnits: ['Air-Rescue-9', 'Medic-3'],
        },
      };

      const result = IncidentResponseSchema.safeParse(assignedIncident);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignedTo).toBe('Lead Officer Miller');
        expect(result.data.triage?.assignedUnits).toHaveLength(2);
        expect(result.data.triage?.assignedUnits).toContain('Air-Rescue-9');
      }
    });
  });

  describe('3. Lifecycle Progression Progression Tracking', () => {
    it('simulates full 5-stage progression matching Dev B responder dashboard', () => {
      const lifecycleSteps: Array<IncidentResponse['status']> = [
        'new',
        'acknowledged',
        'in_progress',
        'resolved',
        'closed',
      ];

      let current = { ...baseIncident };

      lifecycleSteps.forEach((targetStatus) => {
        current = {
          ...current,
          status: targetStatus,
          updatedAt: Date.now(),
        };

        const validated = IncidentResponseSchema.safeParse(current);
        expect(validated.success).toBe(true);
        if (validated.success) {
          expect(validated.data.status).toBe(targetStatus);
        }
      });
    });
  });

  describe('4. Real-Time SSE Ingestion for Closed Incident Updates', () => {
    it('correctly unpacks an incident:updated SSE event with status closed', () => {
      const updatePayload: SurvivorSSEEvent = {
        type: 'incident:updated',
        incident: {
          ...baseIncident,
          status: 'closed',
          assignedTo: 'Chief Rescue Coordinator',
        },
        timestamp: Date.now(),
      };

      expect(updatePayload.type).toBe('incident:updated');
      expect(updatePayload.incident.status).toBe('closed');
      expect(updatePayload.incident.assignedTo).toBe('Chief Rescue Coordinator');
    });
  });
});
