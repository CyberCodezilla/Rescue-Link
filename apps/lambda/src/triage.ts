import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  Incident,
  Priority,
  generateHeuristicTriage,
  buildBedrockTriagePrompt,
  parseBedrockTriageOutput,
} from '@rescue-link/schema';
import { parseListEnv, parseNumberEnv, parseIntegerEnv } from '@rescue-link/config';

const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  TABLE: process.env.DYNAMODB_TABLE_INCIDENTS || 'rescue-incidents',
  MODEL_ID: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  MAX_TOKENS: parseIntegerEnv(process.env.BEDROCK_MAX_TOKENS, 300),
  TIMEOUT_MS: parseIntegerEnv(process.env.BEDROCK_TIMEOUT_MS, 3500),
  TEMPERATURE: parseNumberEnv(process.env.BEDROCK_TEMPERATURE, 0.2),
  CRITICAL_PEOPLE: parseIntegerEnv(process.env.TRIAGE_CRITICAL_PEOPLE_THRESHOLD, 5),
  HIGH_PEOPLE: parseIntegerEnv(process.env.TRIAGE_HIGH_PEOPLE_THRESHOLD, 3),
  CRITICAL_NEEDS: parseListEnv(process.env.TRIAGE_CRITICAL_NEEDS, 'medical,boat'),
  CRITICAL_CATEGORIES: parseListEnv(process.env.TRIAGE_CRITICAL_CATEGORIES, 'fire'),
  HIGH_NEEDS: parseListEnv(process.env.TRIAGE_HIGH_NEEDS, 'clean_water,food'),
  HIGH_CATEGORIES: parseListEnv(process.env.TRIAGE_HIGH_CATEGORIES, 'landslide'),
  CONFIDENCE: parseNumberEnv(process.env.TRIAGE_HEURISTIC_CONFIDENCE, 0.92),
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

function heuristic(incident: Incident): { priority: Priority; triage: Incident['triage'] } {
  return generateHeuristicTriage(incident, {
    criticalPeopleThreshold: CONFIG.CRITICAL_PEOPLE,
    highPeopleThreshold: CONFIG.HIGH_PEOPLE,
    criticalNeeds: CONFIG.CRITICAL_NEEDS,
    criticalCategories: CONFIG.CRITICAL_CATEGORIES,
    highNeeds: CONFIG.HIGH_NEEDS,
    highCategories: CONFIG.HIGH_CATEGORIES,
    heuristicConfidence: CONFIG.CONFIDENCE,
  });
}

async function bedrockTriage(incident: Incident) {
  const prompt = buildBedrockTriagePrompt(incident);
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: CONFIG.MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ anthropic_version: 'bedrock-2023-05-31', max_tokens: CONFIG.MAX_TOKENS, temperature: CONFIG.TEMPERATURE, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }] }),
  }), { abortSignal: AbortSignal.timeout(CONFIG.TIMEOUT_MS) });
  const body = new TextDecoder().decode(response.body);
  return parseBedrockTriageOutput(body);
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
