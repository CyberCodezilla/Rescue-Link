import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { encodeSatellitePacket } from '@rescue-link/schema';

beforeAll(() => {
  process.env.SATELLITE_API_KEY = 'satellite-test-key';
  process.env.USE_LOCAL_MOCK_STORE = 'true';
});

describe('Satellite uplink API', () => {
  it('reports satellite ingress health without exposing credentials', async () => {
    const { app } = await import('../src/app');
    const res = await request(app).get('/api/satellite/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.wireLimitBytes).toBe(100);
    expect(res.body).not.toHaveProperty('apiKey');
  });

  it('rejects requests without the satellite API key', async () => {
    const { app } = await import('../src/app');
    const res = await request(app).post('/api/satellite/uplink').send({});
    expect(res.status).toBe(401);
  });

  it('ingests a valid SOS packet and creates an incident', async () => {
    const { app } = await import('../src/app');
    const packetBase64 = encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'SAT-API-1',
      timestamp: 1789742000,
      type: 'sos',
      location: { lat: 12.9716, lng: 77.5946 },
      category: 'fire',
      description: 'FIRE HELP',
      peopleAffected: 2,
      urgentNeeds: ['medical'],
    });

    const res = await request(app)
      .post('/api/satellite/uplink')
      .set('x-satellite-api-key', 'satellite-test-key')
      .send({ provider: 'generic', packetBase64, signalStrength: -83 });

    expect(res.status).toBe(202);
    expect(res.body.accepted).toBe(true);
    expect(res.body.duplicate).toBe(false);
    expect(res.body.incident.id).toMatch(/^sat-/);
    expect(res.body.incident.category).toBe('fire');
  });

  it('treats a repeated SOS packet as idempotent', async () => {
    const { app } = await import('../src/app');
    const packetBase64 = encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'SAT-API-2',
      timestamp: 1789742000,
      type: 'sos',
      location: { lat: 28.6139, lng: 77.209 },
      category: 'flood',
      description: 'ROOF HELP',
      peopleAffected: 3,
      urgentNeeds: ['boat'],
    });

    const first = await request(app)
      .post('/api/satellite/uplink')
      .set('x-satellite-api-key', 'satellite-test-key')
      .send({ packetBase64 });
    const second = await request(app)
      .post('/api/satellite/uplink')
      .set('x-satellite-api-key', 'satellite-test-key')
      .send({ packetBase64 });

    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.incident.id).toBe(first.body.incident.id);
  });

  it('accepts compact telemetry packets without creating incidents', async () => {
    const { app } = await import('../src/app');
    const packetBase64 = encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'SAT-SENSOR',
      timestamp: 1789742000,
      type: 'telemetry',
      location: { lat: 19.076, lng: 72.8777 },
      urgentNeeds: [],
      metric: 'water_level',
      metricValue: 91.25,
    });

    const res = await request(app)
      .post('/api/satellite/uplink')
      .set('x-satellite-api-key', 'satellite-test-key')
      .send({ provider: 'generic', packetBase64 });

    expect(res.status).toBe(202);
    expect(res.body.type).toBe('telemetry');
    expect(res.body.telemetry.metric).toBe('water_level');
    expect(res.body.telemetry.value).toBeCloseTo(91.25, 2);
    expect(res.body.incident).toBeUndefined();
  });

  it('rejects a tampered packet', async () => {
    const { app } = await import('../src/app');
    const packetBase64 = encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'SAT-BAD',
      timestamp: 1789742000,
      type: 'telemetry',
      location: { lat: 0, lng: 0 },
      urgentNeeds: [],
      metric: 'vibration',
      metricValue: 3.14,
    });
    const bytes = Buffer.from(packetBase64, 'base64');
    bytes[60] ^= 1;

    const res = await request(app)
      .post('/api/satellite/uplink')
      .set('x-satellite-api-key', 'satellite-test-key')
      .send({ packetBase64: bytes.toString('base64') });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('CRC mismatch');
  });
});
