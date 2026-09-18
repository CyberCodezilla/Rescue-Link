import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  decodeSatellitePacket,
  encodeSatellitePacket,
  SATELLITE_PACKET_BYTES,
  SATELLITE_WIRE_LIMIT_BYTES,
} from '../src/satellite';

describe('Satellite packet codec', () => {
  it('round-trips a compact SOS packet within the 100-byte wire limit', () => {
    const packet = {
      version: 1 as const,
      packetId: randomUUID(),
      deviceId: 'SAT-001',
      timestamp: 1789742000,
      type: 'sos' as const,
      location: { lat: 12.9716, lng: 77.5946 },
      category: 'fire' as const,
      description: 'FIRE HELP',
      peopleAffected: 2,
      urgentNeeds: ['medical' as const],
    };

    const encoded = encodeSatellitePacket(packet);
    const decoded = decodeSatellitePacket(encoded);

    expect(Buffer.from(encoded, 'base64').length).toBe(SATELLITE_PACKET_BYTES);
    expect(Buffer.from(encoded, 'base64').length).toBeLessThanOrEqual(SATELLITE_WIRE_LIMIT_BYTES);
    expect(decoded).toEqual(packet);
  });

  it('detects tampering through CRC validation', () => {
    const packet = {
      version: 1 as const,
      packetId: randomUUID(),
      deviceId: 'SAT-002',
      timestamp: 1789742000,
      type: 'telemetry' as const,
      location: { lat: 0, lng: 0 },
      urgentNeeds: [],
      metric: 'water_level' as const,
      metricValue: 42.5,
    };

    const encoded = encodeSatellitePacket(packet);
    const bytes = Buffer.from(encoded, 'base64');
    bytes[60] ^= 0x01;

    expect(() => decodeSatellitePacket(bytes.toString('base64'))).toThrow('CRC mismatch');
  });

  it('rejects oversized device identifiers', () => {
    expect(() => encodeSatellitePacket({
      version: 1,
      packetId: randomUUID(),
      deviceId: 'THIS-DEVICE-ID-IS-TOO-LONG',
      timestamp: 1789742000,
      type: 'telemetry',
      location: { lat: 0, lng: 0 },
      urgentNeeds: [],
      metric: 'temperature',
      metricValue: 22,
    })).toThrow('deviceId must be at most');
  });
});
