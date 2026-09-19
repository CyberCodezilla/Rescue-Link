import { z } from 'zod';

const MAGIC_0 = 0x52;
const MAGIC_1 = 0x4c;
const PACKET_VERSION = 1;
const MAX_PACKET_BYTES = 100;
const DEVICE_ID_BYTES = 16;
const DESCRIPTION_BYTES = 32;
const HEADER_BYTES = 2 + 1 + 1 + 16 + DEVICE_ID_BYTES + 4 + 4 + 4 + 1 + 1 + 1 + 1;
const CRC_BYTES = 4;
const PACKET_BYTES = HEADER_BYTES + DESCRIPTION_BYTES + 1 + 4 + CRC_BYTES;

export const SatelliteProviderEnum = z.enum(['generic', 'iridium', 'starlink', 'other']);
export type SatelliteProvider = z.infer<typeof SatelliteProviderEnum>;

export const SatellitePacketTypeEnum = z.enum(['sos', 'telemetry']);
export type SatellitePacketType = z.infer<typeof SatellitePacketTypeEnum>;

export const SatelliteMetricEnum = z.enum(['water_level', 'vibration', 'temperature', 'pressure', 'unknown']);
export type SatelliteMetric = z.infer<typeof SatelliteMetricEnum>;

export const SatelliteUplinkRequestSchema = z.object({
  provider: SatelliteProviderEnum.default('generic'),
  packetBase64: z.string().min(4).max(140),
  receivedAt: z.number().int().positive().optional(),
  signalStrength: z.number().finite().optional(),
});
export type SatelliteUplinkRequest = z.infer<typeof SatelliteUplinkRequestSchema>;

export interface SatellitePacket {
  version: 1;
  packetId: string;
  deviceId: string;
  timestamp: number;
  type: SatellitePacketType;
  location: { lat: number; lng: number };
  category?: 'flood' | 'landslide' | 'fire' | 'other';
  description?: string;
  peopleAffected?: number;
  urgentNeeds: Array<'medical' | 'boat' | 'food' | 'clean_water' | 'infant_care'>;
  metric?: SatelliteMetric;
  metricValue?: number;
}

export interface SatellitePacketEnvelope {
  provider: SatelliteProvider;
  receivedAt: number;
  signalStrength?: number;
  packet: SatellitePacket;
  rawBytes: number;
}

const CATEGORY_TO_BYTE = { flood: 0, landslide: 1, fire: 2, other: 3 } as const;
const BYTE_TO_CATEGORY = ['flood', 'landslide', 'fire', 'other'] as const;
const METRIC_TO_BYTE = { unknown: 0, water_level: 1, vibration: 2, temperature: 3, pressure: 4 } as const;
const BYTE_TO_METRIC = ['unknown', 'water_level', 'vibration', 'temperature', 'pressure'] as const;
const NEED_TO_BIT = { medical: 1, boat: 2, food: 4, clean_water: 8, infant_care: 16 } as const;
const BIT_TO_NEED: Array<[number, keyof typeof NEED_TO_BIT]> = [
  [1, 'medical'],
  [2, 'boat'],
  [4, 'food'],
  [8, 'clean_water'],
  [16, 'infant_care'],
];

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, false);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function uuidToBytes(uuid: string): Uint8Array {
  const normalized = uuid.replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/i.test(normalized)) throw new Error('packetId must be a UUID');
  return Uint8Array.from(normalized.match(/.{2}/g)!.map((value) => parseInt(value, 16)));
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function utf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function decodeBase64(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error('packetBase64 is not valid base64');
  }
  return new Uint8Array(Buffer.from(value, 'base64'));
}

export function encodeSatellitePacket(packet: SatellitePacket): string {
  if (packet.version !== PACKET_VERSION) throw new Error('Unsupported satellite packet version');
  const description = packet.description || '';
  const descriptionBytes = utf8Bytes(description);
  const deviceBytes = utf8Bytes(packet.deviceId);
  if (deviceBytes.length === 0) throw new Error('deviceId is required');
  if (deviceBytes.length > DEVICE_ID_BYTES) throw new Error(`deviceId must be at most ${DEVICE_ID_BYTES} UTF-8 bytes`);
  if (descriptionBytes.length > DESCRIPTION_BYTES) throw new Error(`description must be at most ${DESCRIPTION_BYTES} UTF-8 bytes`);
  if (!Number.isInteger(packet.timestamp) || packet.timestamp <= 0) throw new Error('timestamp must be a positive integer');
  if (packet.location.lat < -90 || packet.location.lat > 90 || packet.location.lng < -180 || packet.location.lng > 180) {
    throw new Error('location is outside valid coordinate bounds');
  }
  if (packet.type === 'sos' && (!packet.category || !packet.description || !packet.peopleAffected)) {
    throw new Error('SOS packets require category, description, and peopleAffected');
  }
  if (packet.peopleAffected !== undefined && (!Number.isInteger(packet.peopleAffected) || packet.peopleAffected < 1 || packet.peopleAffected > 255)) {
    throw new Error('peopleAffected must be an integer between 1 and 255');
  }

  const bytes = new Uint8Array(PACKET_BYTES);
  const view = new DataView(bytes.buffer);
  bytes[0] = MAGIC_0;
  bytes[1] = MAGIC_1;
  bytes[2] = PACKET_VERSION;
  bytes[3] = packet.type === 'sos' ? 1 : 2;
  bytes.set(uuidToBytes(packet.packetId), 4);
  bytes.set(deviceBytes, 20);
  writeUint32(view, 36, packet.timestamp);
  writeUint32(view, 40, Math.round(packet.location.lat * 1_000_000));
  writeUint32(view, 44, Math.round(packet.location.lng * 1_000_000));
  bytes[48] = packet.category ? CATEGORY_TO_BYTE[packet.category] : 3;
  bytes[49] = packet.peopleAffected || 0;
  bytes[50] = packet.urgentNeeds.reduce((mask, need) => mask | NEED_TO_BIT[need], 0);
  bytes[51] = descriptionBytes.length;
  bytes.set(descriptionBytes, 52);
  const metricByte = packet.metric === 'water_level' ? 1 : packet.metric === 'vibration' ? 2 : packet.metric === 'temperature' ? 3 : packet.metric === 'pressure' ? 4 : 0;
  bytes[84] = metricByte;
  view.setFloat32(85, packet.metricValue || 0, false);
  writeUint32(view, 89, crc32(bytes.subarray(0, 89)));

  const encoded = encodeBase64(bytes);
  if (bytes.length > MAX_PACKET_BYTES) throw new Error('Satellite packet exceeds 100-byte wire limit');
  return encoded;
}

export function decodeSatellitePacket(packetBase64: string): SatellitePacket {
  const bytes = decodeBase64(packetBase64);
  if (bytes.length > MAX_PACKET_BYTES) throw new Error('Satellite packet exceeds 100-byte wire limit');
  if (bytes.length !== PACKET_BYTES) throw new Error(`Invalid satellite packet length: expected ${PACKET_BYTES} bytes`);
  if (bytes[0] !== MAGIC_0 || bytes[1] !== MAGIC_1) throw new Error('Invalid satellite packet magic');
  if (bytes[2] !== PACKET_VERSION) throw new Error('Unsupported satellite packet version');
  if (crc32(bytes.subarray(0, 89)) !== readUint32(new DataView(bytes.buffer), 89)) throw new Error('Satellite packet CRC mismatch');

  const view = new DataView(bytes.buffer);
  const typeByte = bytes[3];
  if (typeByte !== 1 && typeByte !== 2) throw new Error('Unsupported satellite packet type');
  const deviceEnd = bytes.indexOf(0, 20);
  const deviceBytes = bytes.slice(20, deviceEnd === -1 ? 36 : deviceEnd);
  const descriptionLength = bytes[51];
  if (descriptionLength > DESCRIPTION_BYTES) throw new Error('Invalid description length');
  const description = decodeUtf8(bytes.slice(52, 52 + descriptionLength));
  if (bytes[48] > 3) throw new Error('Unsupported satellite category');
  if (bytes[84] > 4) throw new Error('Unsupported satellite metric');
  const category = BYTE_TO_CATEGORY[bytes[48]];
  const metric = BYTE_TO_METRIC[bytes[84]];
  const needs = BIT_TO_NEED.filter(([bit]) => (bytes[50] & bit) !== 0).map(([, need]) => need);
  const packet: SatellitePacket = {
    version: 1,
    packetId: bytesToUuid(bytes.slice(4, 20)),
    deviceId: decodeUtf8(deviceBytes),
    timestamp: readUint32(view, 36),
    type: typeByte === 1 ? 'sos' : 'telemetry',
    location: {
      lat: view.getInt32(40, false) / 1_000_000,
      lng: view.getInt32(44, false) / 1_000_000,
    },
    urgentNeeds: needs,
  };
  if (typeByte === 1) {
    packet.category = category;
    packet.description = description;
    packet.peopleAffected = bytes[49];
  } else {
    packet.metric = metric;
    packet.metricValue = view.getFloat32(85, false);
  }
  return packet;
}

export function createSatelliteEnvelope(
  request: SatelliteUplinkRequest,
): SatellitePacketEnvelope {
  const packet = decodeSatellitePacket(request.packetBase64);
  const bytes = decodeBase64(request.packetBase64);
  return {
    provider: request.provider,
    receivedAt: request.receivedAt || Date.now(),
    signalStrength: request.signalStrength,
    packet,
    rawBytes: bytes.length,
  };
}

export const SATELLITE_WIRE_LIMIT_BYTES = MAX_PACKET_BYTES;
export const SATELLITE_PACKET_BYTES = PACKET_BYTES;
