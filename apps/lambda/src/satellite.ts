import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { decodeSatellitePacket, SatellitePacket } from '@rescue-link/schema';

const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  TABLE: process.env.DYNAMODB_TABLE_INCIDENTS || 'rescue-incidents',
  STATE_MACHINE_ARN: process.env.STATE_MACHINE_ARN || '',
};

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: CONFIG.AWS_REGION }));
const sfn = new SFNClient({ region: CONFIG.AWS_REGION });

type SatelliteEvent = {
  packetBase64?: string;
  provider?: string;
  receivedAt?: number;
  signalStrength?: number;
};

function toIncident(packet: SatellitePacket) {
  if (packet.type !== 'sos' || !packet.category || !packet.description || !packet.peopleAffected) {
    throw new Error('Satellite SOS packet is missing required fields');
  }
  const createdAt = packet.timestamp * 1000;
  return {
    id: `sat-${packet.packetId}`,
    createdAt,
    updatedAt: createdAt,
    status: 'new',
    priority: 'pending_triage',
    location: packet.location,
    reporter: { contactMethod: 'none' },
    category: packet.category,
    description: packet.description,
    peopleAffected: packet.peopleAffected,
    urgentNeeds: packet.urgentNeeds,
    details: {
      category: packet.category,
      description: packet.description,
      peopleAffected: packet.peopleAffected,
      urgentNeeds: packet.urgentNeeds,
    },
    triage: {
      notes: `Satellite uplink from device ${packet.deviceId}.`,
    },
  };
}

export async function handler(event: SatelliteEvent): Promise<Record<string, unknown>> {
  if (!event.packetBase64) throw new Error('packetBase64 is required');
  const packet = decodeSatellitePacket(event.packetBase64);

  if (packet.type === 'telemetry') {
    return {
      accepted: true,
      packetId: packet.packetId,
      deviceId: packet.deviceId,
      type: packet.type,
      metric: packet.metric,
      value: packet.metricValue,
      location: packet.location,
      receivedAt: event.receivedAt || Date.now(),
    };
  }

  const incident = toIncident(packet);
  const existing = await dynamo.send(new GetCommand({
    TableName: CONFIG.TABLE,
    Key: { id: incident.id },
  }));

  if (existing.Item) {
    return {
      accepted: true,
      duplicate: true,
      packetId: packet.packetId,
      incidentId: incident.id,
    };
  }

  try {
    await dynamo.send(new PutCommand({
      TableName: CONFIG.TABLE,
      Item: incident,
      ConditionExpression: 'attribute_not_exists(id)',
    }));
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        accepted: true,
        duplicate: true,
        packetId: packet.packetId,
        incidentId: incident.id,
      };
    }
    throw error;
  }

  let executionArn: string | undefined;
  if (CONFIG.STATE_MACHINE_ARN) {
    const result = await sfn.send(new StartExecutionCommand({
      stateMachineArn: CONFIG.STATE_MACHINE_ARN,
      input: JSON.stringify({ incident }),
      name: `sat-${packet.packetId}`.slice(0, 80),
    }));
    executionArn = result.executionArn;
  }

  return {
    accepted: true,
    duplicate: false,
    packetId: packet.packetId,
    incidentId: incident.id,
    executionArn,
  };
}
