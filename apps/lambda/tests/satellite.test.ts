import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { encodeSatellitePacket } from '@rescue-link/schema';
import { handler } from '../src/satellite';

describe('Satellite Lambda ingestion', () => {
  it('normalizes telemetry without touching AWS services', async () => {
    const packetBase64 = encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'IOT-01',
      timestamp: 1789742000,
      type: 'telemetry',
      location: { lat: 11.0168, lng: 76.9558 },
      urgentNeeds: [],
      metric: 'temperature',
      metricValue: 31.5,
    });

    const result = await handler({ packetBase64, provider: 'generic' });
    expect(result.accepted).toBe(true);
    expect(result.type).toBe('telemetry');
    expect(result.metric).toBe('temperature');
    expect(result.value).toBeCloseTo(31.5, 2);
  });
});
