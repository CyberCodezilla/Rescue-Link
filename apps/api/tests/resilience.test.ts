import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { bedrockService } from '../src/services/bedrockService';
import { incidentStore } from '../src/store/incidentStore';

describe('Resilience & Telemetry Unit Tests', () => {
  it('GET /api/health includes persistence and AI circuit telemetry', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('telemetry');
    expect(res.body.telemetry).toHaveProperty('persistence');
    expect(res.body.telemetry).toHaveProperty('aiCircuit');
    expect(res.body.telemetry.aiCircuit.circuitState).toBe('CLOSED');
  });

  it('exposes circuit telemetry state via bedrockService', () => {
    const telemetry = bedrockService.getCircuitTelemetry();
    expect(telemetry).toHaveProperty('circuitState');
    expect(telemetry.circuitState).toBe('CLOSED');
    expect(telemetry.consecutiveFailures).toBe(0);
  });

  it('exposes store telemetry via incidentStore', () => {
    const telemetry = incidentStore.getStoreTelemetry();
    expect(telemetry).toHaveProperty('activeStore');
    expect(telemetry).toHaveProperty('fallbackCount');
  });

  it('degrades to heuristic rule-based triage on AI timeout or credential absence without failing request', async () => {
    const result = await bedrockService.triageIncident({
      id: 'timeout-test-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: 'pending_triage',
      category: 'fire',
      description: 'Trapped near smoke line',
      peopleAffected: 4,
      urgentNeeds: ['medical'],
      location: { lat: 37.77, lng: -122.41 },
    });

    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('triage');
    expect(result.priority).toBe('critical');
    expect(result.triage.suggestedAction).toContain('CRITICAL');
  });

  it('enforces IncidentSchema validation at store persistence boundary and rejects malformed objects', async () => {
    const malformedIncident: any = {
      id: 'malformed-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'invalid_status_enum',
      priority: 'critical',
      category: 'fire',
      description: 'Test',
      peopleAffected: -5,
      urgentNeeds: [],
      location: { lat: 999, lng: 999 }, // Out of bounds coordinates
    };

    await expect(incidentStore.create(malformedIncident)).rejects.toThrow();
  });

  it('guarantees triageWorkflow degrades to heuristic triage when Bedrock AI crashes or throws', async () => {
    const { triageWorkflow } = await import('../src/services/triageWorkflow');
    const { bedrockService } = await import('../src/services/bedrockService');

    // Temporarily stub triageIncident to throw an unhandled exception
    const originalTriage = bedrockService.triageIncident;
    bedrockService.triageIncident = async () => {
      throw new Error('Simulated AWS Bedrock Service Unavailable 503');
    };

    try {
      const incident = await incidentStore.create({
        id: 'triage-crash-recovery-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'new',
        priority: 'pending_triage',
        category: 'flood',
        description: 'Water entering ground floor rapidly',
        peopleAffected: 6,
        urgentNeeds: ['boat', 'medical'],
        location: { lat: 37.7749, lng: -122.4194 },
      });

      const triaged = await triageWorkflow.runTriage(incident);

      // Verify incident did NOT stay in pending_triage, but degraded to rule-based critical triage
      expect(triaged.priority).toBe('critical');
      expect(triaged.triage?.suggestedAction).toContain('roof');
      expect(triaged.status).toBe('new');

      // Verify store was updated
      const stored = await incidentStore.getById(incident.id);
      expect(stored?.priority).toBe('critical');
    } finally {
      bedrockService.triageIncident = originalTriage;
    }
  });

  it('enforces IncidentSchema validation on store updates and rejects invalid updates', async () => {
    const valid = await incidentStore.create({
      id: 'update-schema-test-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: 'pending_triage',
      category: 'flood',
      description: 'Minor injury',
      peopleAffected: 1,
      urgentNeeds: [],
      location: { lat: 37.77, lng: -122.41 },
    });

    const malformedUpdate: any = {
      status: 'non_existent_status_enum',
    };

    await expect(incidentStore.update(valid.id, malformedUpdate)).rejects.toThrow();
  });

  it('does not increment store fallbackCount on pure schema validation failures', async () => {
    const initialFallbackCount = incidentStore.getStoreTelemetry().fallbackCount;

    const invalid: any = {
      id: 'schema-only-fail',
      createdAt: 'not-a-timestamp',
      status: 'invalid',
    };

    try {
      await incidentStore.create(invalid);
    } catch {
      // Expected Zod validation rejection
    }

    const currentFallbackCount = incidentStore.getStoreTelemetry().fallbackCount;
    expect(currentFallbackCount).toBe(initialFallbackCount);
  });

  it('LifeSafetyTracer formats trace IDs and logs structured telemetry', async () => {
    const { LifeSafetyTracer } = await import('../src/services/lifeSafetyTracer');

    const traceId = LifeSafetyTracer.createTraceId('inc-test-123456');
    expect(traceId).toMatch(/^trace-inc-test-\d+$/);

    // Verify structured logger runs cleanly
    expect(() => {
      LifeSafetyTracer.log({
        traceId,
        incidentId: 'inc-test-123456',
        step: 'ROUTE_RECVD',
        timestamp: Date.now(),
        status: 'STARTED',
        priority: 'pending_triage',
      });
    }).not.toThrow();
  });
});
