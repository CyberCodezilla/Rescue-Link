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
});
