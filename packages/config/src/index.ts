export interface ApiEnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  AWS_REGION: string;
  DYNAMODB_TABLE_INCIDENTS: string;
  USE_LOCAL_MOCK_STORE: boolean;
  BEDROCK_MODEL_ID: string;
  BEDROCK_MAX_TOKENS: number;
  BEDROCK_TIMEOUT_MS: number;
  BEDROCK_TEMPERATURE: number;
  STATE_MACHINE_ARN: string;
  RESCUELINK_CALLBACK_URL: string;
  LAMBDA_CALLBACK_SECRET: string;
  SNS_TOPIC_ARN: string;
  SES_FROM_EMAIL: string;
  SES_ALERT_RECIPIENT: string;
  NOTIFICATION_PRIORITY_GATE: string[];
  TRIAGE_CRITICAL_PEOPLE_THRESHOLD: number;
  TRIAGE_HIGH_PEOPLE_THRESHOLD: number;
  TRIAGE_CRITICAL_NEEDS: string[];
  TRIAGE_CRITICAL_CATEGORIES: string[];
  TRIAGE_HIGH_NEEDS: string[];
  TRIAGE_HIGH_CATEGORIES: string[];
  TRIAGE_HEURISTIC_CONFIDENCE: number;
  DEFAULT_BROADCAST_CHANNEL: string;
  API_KEY: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_SOS: number;
}

export interface ClientEnvironmentConfig {
  RESCUE_LINK_API_ORIGIN: string;
  NEXT_PUBLIC_API_KEY: string;
}

type Env = Record<string, string | undefined>;

const numberValue = (
  env: Env,
  key: string,
  fallback: number,
  min?: number,
  max?: number
): number => {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key} must be a valid number`);
  if (min !== undefined && value < min) throw new Error(`${key} is below minimum`);
  if (max !== undefined && value > max) throw new Error(`${key} is above maximum`);
  return value;
};

const integerValue = (
  env: Env,
  key: string,
  fallback: number,
  min?: number,
  max?: number
): number => {
  const value = numberValue(env, key, fallback, min, max);
  if (!Number.isInteger(value)) throw new Error(`${key} must be an integer`);
  return value;
};

const listValue = (env: Env, key: string, fallback: string): string[] =>
  (env[key] || fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export function validateApiEnv(env: Env = process.env): ApiEnvironmentConfig {
  const nodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const apiKey = env.API_KEY ?? 'rescuelink-responder-key-2026';

  return {
    PORT: integerValue(env, 'PORT', 3001, 1, 65535),
    NODE_ENV: nodeEnv as ApiEnvironmentConfig['NODE_ENV'],
    AWS_REGION: env.AWS_REGION || 'us-east-1',
    DYNAMODB_TABLE_INCIDENTS: env.DYNAMODB_TABLE_INCIDENTS || 'rescue-incidents',
    USE_LOCAL_MOCK_STORE: env.USE_LOCAL_MOCK_STORE === 'true',

    BEDROCK_MODEL_ID:
      env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
    BEDROCK_MAX_TOKENS: integerValue(env, 'BEDROCK_MAX_TOKENS', 300, 1, 100000),
    BEDROCK_TIMEOUT_MS: integerValue(env, 'BEDROCK_TIMEOUT_MS', 3500, 100, 120000),
    BEDROCK_TEMPERATURE: numberValue(env, 'BEDROCK_TEMPERATURE', 0.2, 0, 2),

    STATE_MACHINE_ARN: env.STATE_MACHINE_ARN || '',
    RESCUELINK_CALLBACK_URL: env.RESCUELINK_CALLBACK_URL || '',
    LAMBDA_CALLBACK_SECRET: env.LAMBDA_CALLBACK_SECRET || '',

    SNS_TOPIC_ARN: env.SNS_TOPIC_ARN || '',
    SES_FROM_EMAIL: env.SES_FROM_EMAIL || 'alerts@rescuelink.org',
    SES_ALERT_RECIPIENT: env.SES_ALERT_RECIPIENT || 'responders@rescuelink.org',
    NOTIFICATION_PRIORITY_GATE: listValue(
      env,
      'NOTIFICATION_PRIORITY_GATE',
      'critical,high'
    ),

    TRIAGE_CRITICAL_PEOPLE_THRESHOLD: integerValue(
      env,
      'TRIAGE_CRITICAL_PEOPLE_THRESHOLD',
      5,
      1
    ),
    TRIAGE_HIGH_PEOPLE_THRESHOLD: integerValue(
      env,
      'TRIAGE_HIGH_PEOPLE_THRESHOLD',
      3,
      1
    ),
    TRIAGE_CRITICAL_NEEDS: listValue(
      env,
      'TRIAGE_CRITICAL_NEEDS',
      'medical,boat'
    ),
    TRIAGE_CRITICAL_CATEGORIES: listValue(
      env,
      'TRIAGE_CRITICAL_CATEGORIES',
      'fire'
    ),
    TRIAGE_HIGH_NEEDS: listValue(
      env,
      'TRIAGE_HIGH_NEEDS',
      'clean_water,food'
    ),
    TRIAGE_HIGH_CATEGORIES: listValue(
      env,
      'TRIAGE_HIGH_CATEGORIES',
      'landslide'
    ),
    TRIAGE_HEURISTIC_CONFIDENCE: numberValue(
      env,
      'TRIAGE_HEURISTIC_CONFIDENCE',
      0.92,
      0,
      1
    ),

    DEFAULT_BROADCAST_CHANNEL:
      env.DEFAULT_BROADCAST_CHANNEL || 'wifi',

    API_KEY: apiKey,
    RATE_LIMIT_WINDOW_MS: integerValue(
      env,
      'RATE_LIMIT_WINDOW_MS',
      60000,
      1000
    ),
    RATE_LIMIT_MAX_SOS: integerValue(
      env,
      'RATE_LIMIT_MAX_SOS',
      30,
      1
    ),
  };
}

export function validateClientEnv(
  env: Env = process.env
): ClientEnvironmentConfig {
  const origin =
    env.RESCUE_LINK_API_ORIGIN ||
    env.NEXT_PUBLIC_API_ORIGIN ||
    'http://localhost:3001';

  try {
    new URL(origin);
  } catch {
    throw new Error('RESCUE_LINK_API_ORIGIN must be a valid URL');
  }

  return {
    RESCUE_LINK_API_ORIGIN: origin,
    NEXT_PUBLIC_API_KEY: env.NEXT_PUBLIC_API_KEY || 'rescuelink-responder-key-2026',
  };
}

export const CONFIG = {
  ...validateApiEnv(process.env),
  SATELLITE_API_KEY: process.env.SATELLITE_API_KEY || '',
  SATELLITE_IOT_TOPIC: process.env.SATELLITE_IOT_TOPIC || 'rescuelink/satellite/+/uplink',
  SATELLITE_GATEWAY_URL: process.env.SATELLITE_GATEWAY_URL || '',
  SATELLITE_GATEWAY_SECRET: process.env.SATELLITE_GATEWAY_SECRET || '',
};
