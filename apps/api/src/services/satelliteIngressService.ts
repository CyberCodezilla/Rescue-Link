import {
  createSatelliteEnvelope,
  Incident,
  SatellitePacketEnvelope,
  SatelliteUplinkRequest,
} from '@rescue-link/schema';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from './eventStream';
import { triageWorkflow } from './triageWorkflow';

export interface SatelliteIngestResult {
  accepted: true;
  duplicate: boolean;
  packetId: string;
  deviceId: string;
  type: SatellitePacketEnvelope['packet']['type'];
  rawBytes: number;
  incident?: Incident;
  telemetry?: {
    metric: string;
    value: number;
    lat: number;
    lng: number;
    timestamp: number;
  };
}

function incidentFromSos(envelope: SatellitePacketEnvelope): Incident {
  const packet = envelope.packet;
  if (packet.type !== 'sos' || !packet.category || !packet.description || !packet.peopleAffected) {
    throw new Error('Satellite SOS packet is missing required incident fields');
  }
  const createdAt = packet.timestamp * 1000;
  return {
    id: `sat-${packet.packetId}`,
    createdAt,
    updatedAt: createdAt,
    status: 'new',
    priority: 'pending_triage',
    location: packet.location,
    category: packet.category,
    description: packet.description,
    peopleAffected: packet.peopleAffected,
    urgentNeeds: packet.urgentNeeds,
    reporter: { contactMethod: 'none' },
    details: {
      category: packet.category,
      description: packet.description,
      peopleAffected: packet.peopleAffected,
      urgentNeeds: packet.urgentNeeds,
    },
    triage: {
      notes: `Satellite uplink from device ${packet.deviceId} via ${envelope.provider}.`,
    },
  };
}

export class SatelliteIngressService {
  async ingest(request: SatelliteUplinkRequest): Promise<SatelliteIngestResult> {
    const envelope = createSatelliteEnvelope(request);
    const { packet } = envelope;

    if (packet.type === 'telemetry') {
      return {
        accepted: true,
        duplicate: false,
        packetId: packet.packetId,
        deviceId: packet.deviceId,
        type: packet.type,
        rawBytes: envelope.rawBytes,
        telemetry: {
          metric: packet.metric || 'unknown',
          value: packet.metricValue || 0,
          lat: packet.location.lat,
          lng: packet.location.lng,
          timestamp: packet.timestamp,
        },
      };
    }

    const incident = incidentFromSos(envelope);
    const existing = await incidentStore.getById(incident.id);
    if (existing) {
      return {
        accepted: true,
        duplicate: true,
        packetId: packet.packetId,
        deviceId: packet.deviceId,
        type: packet.type,
        rawBytes: envelope.rawBytes,
        incident: existing,
      };
    }

    let created: Incident;
    try {
      created = await incidentStore.create(incident);
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        const duplicate = await incidentStore.getById(incident.id);
        if (duplicate) {
          return {
            accepted: true,
            duplicate: true,
            packetId: packet.packetId,
            deviceId: packet.deviceId,
            type: packet.type,
            rawBytes: envelope.rawBytes,
            incident: duplicate,
          };
        }
      }
      throw error;
    }
    eventStreamManager.broadcast({
      type: 'incident:created',
      incident: created,
      timestamp: Date.now(),
    });

    void triageWorkflow.runTriage(created).catch((error) => {
      console.error(`[SatelliteIngress] Triage failed for ${created.id}:`, error);
    });

    return {
      accepted: true,
      duplicate: false,
      packetId: packet.packetId,
      deviceId: packet.deviceId,
      type: packet.type,
      rawBytes: envelope.rawBytes,
      incident: created,
    };
  }
}

export const satelliteIngressService = new SatelliteIngressService();
