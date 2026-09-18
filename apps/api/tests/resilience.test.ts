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
});
