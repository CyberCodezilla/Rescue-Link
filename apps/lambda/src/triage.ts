import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
type Priority = 'critical' | 'high' | 'medium' | 'low' | 'pending_triage';
type Incident = { id: string; createdAt: number; updatedAt: number; status: string; priority: Priority; location: { lat: number; lng: number; label?: string }; reporter?: { contactMethod?: string; contactValue?: string }; category: string; description: string; peopleAffected: number; urgentNeeds: string[]; details?: unknown; triage?: { suggestedAction?: string; confidence?: number; assignedUnits?: string[]; notes?: string; summary?: string; reasoning?: string }; assignedTo?: string; audioBlob?: string };

const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  TABLE: process.env.DYNAMODB_TABLE_INCIDENTS || 'rescue-incidents',
  MODEL_ID: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  MAX_TOKENS: Number(process.env.BEDROCK_MAX_TOKENS || 300),
  TEMPERATURE: Number(process.env.BEDROCK_TEMPERATURE || 0.2),
  CRITICAL_PEOPLE: Number(process.env.TRIAGE_CRITICAL_PEOPLE_THRESHOLD || 5),
  HIGH_PEOPLE: Number(process.env.TRIAGE_HIGH_PEOPLE_THRESHOLD || 3),
  CRITICAL_NEEDS: (process.env.TRIAGE_CRITICAL_NEEDS || 'medical,boat').split(',').map((s) => s.trim()),
  CRITICAL_CATEGORIES: (process.env.TRIAGE_CRITICAL_CATEGORIES || 'fire').split(',').map((s) => s.trim()),
  HIGH_NEEDS: (process.env.TRIAGE_HIGH_NEEDS || 'clean_water,food').split(',').map((s) => s.trim()),
  HIGH_CATEGORIES: (process.env.TRIAGE_HIGH_CATEGORIES || 'landslide').split(',').map((s) => s.trim()),
  CONFIDENCE: Number(process.env.TRIAGE_HEURISTIC_CONFIDENCE || 0.92),
};

const bedrock = new BedrockRuntimeClient({ region: CONFIG.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: CONFIG.AWS_REGION }));

export interface TriageEvent {
  incident: Incident;
}

export interface TriageResult {
  incident: Incident;
  triageSource: 'bedrock' | 'heuristic';
}

const hasAny = (arr: string[], keywords: string[]) => arr.some((item) => keywords.includes(item));

function heuristic(incident: Incident): { priority: Priority; triage: Incident['triage'] } {
  const needs = incident.urgentNeeds || [];
  const count = incident.peopleAffected || 1;
  if (hasAny(needs, CONFIG.CRITICAL_NEEDS) || count >= CONFIG.CRITICAL_PEOPLE || CONFIG.CRITICAL_CATEGORIES.includes(incident.category)) {
    return {
      priority: 'critical',
      triage: {
        suggestedAction: incident.category === 'flood' ? 'URGENT: Move to roof/highest level immediately. Signal rescue boats with bright cloth.' : incident.category === 'fire' ? 'CRITICAL: Stay low beneath smoke. Cover face with wet cloth and move away from fire line.' : 'CRITICAL: Prepare for immediate medical evacuation. Keep air passages clear.',
        summary: `CRITICAL DISTRESS: ${count} people affected. High casualty risk.`,
        reasoning: `Assigned CRITICAL priority due to urgent needs [${needs.join(', ')}] and ${count} casualties reported.`,
        confidence: CONFIG.CONFIDENCE,
      },
    };
  }
  if (hasAny(needs, CONFIG.HIGH_NEEDS) || CONFIG.HIGH_CATEGORIES.includes(incident.category) || count >= CONFIG.HIGH_PEOPLE) {
    return {
      priority: 'high',
      triage: {
        suggestedAction: incident.category === 'landslide' ? 'HIGH HAZARD: Move perpendicular to landslide flow direction toward stable rocky ground.' : 'High priority alert registered. Prepare emergency supply pickup zone.',
        summary: `HIGH PRIORITY: ${incident.category} incident requiring active responder intervention.`,
        reasoning: `Assigned HIGH priority based on hazard classification (${incident.category}) and survivor population.`,
        confidence: CONFIG.CONFIDENCE,
      },
    };
  }
  return {
    priority: 'medium',
    triage: {
      suggestedAction: 'Emergency report logged. Conserve device battery and keep emergency whistle ready.',
      summary: `Standard ${incident.category} alert queued for responder review.`,
      reasoning: 'Assigned MEDIUM priority for stable non-life-threatening assistance request.',
      confidence: CONFIG.CONFIDENCE,
    },
  };
}

async function bedrockTriage(incident: Incident) {
  const prompt = `You are an expert emergency dispatch AI for RescueLink. Triage this disaster SOS report.\nCategory: ${incident.category}\nDescription: ${incident.description}\nPeople Affected: ${incident.peopleAffected}\nUrgent Needs: ${incident.urgentNeeds.join(', ') || 'None specified'}\nLocation: Lat ${incident.location.lat}, Lng ${incident.location.lng}\n\nRespond ONLY with JSON: {"priority":"critical|high|medium|low","suggestedAction":"...","summary":"...","reasoning":"...","confidence":0.95}`;
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: CONFIG.MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: CONFIG.MAX_TOKENS, temperature: CONFIG.TEMPERATURE, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }] }),
  }));
  const body = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(body);
  const text = parsed.content?.[0]?.text || parsed.completion || parsed.output?.text || body;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Bedrock returned no JSON object');
  const data = JSON.parse(match[0]);
  return {
    priority: (['critical', 'high', 'medium', 'low'].includes(data.priority) ? data.priority : 'high') as Priority,
    triage: {
      suggestedAction: data.suggestedAction || 'Immediate tactical evaluation required.',
      summary: data.summary || `AI triaged ${incident.category} incident.`,
      reasoning: data.reasoning || 'AI severity evaluation completed.',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
    },
  };
}

export async function handler(event: TriageEvent): Promise<TriageResult> {
  const incident = event.incident;
  let result: { priority: Priority; triage: Incident['triage'] };
  let triageSource: TriageResult['triageSource'];

  try {
    result = await bedrockTriage(incident);
    triageSource = 'bedrock';
  } catch (error) {
    console.warn('[Lambda/Triage] Bedrock failed, using heuristic fallback:', error);
    result = heuristic(incident);
    triageSource = 'heuristic';
  }

  const stored = await dynamo.send(new GetCommand({ TableName: CONFIG.TABLE, Key: { id: incident.id } }));
  const current = (stored.Item as Incident | undefined) || incident;
  const updated: Incident = {
    ...current,
    priority: result.priority,
    triage: { ...(current.triage || {}), ...(result.triage || {}) },
    updatedAt: Date.now(),
  };

  await dynamo.send(new PutCommand({ TableName: CONFIG.TABLE, Item: updated }));
  return { incident: updated, triageSource };
}
