import { z } from 'zod';

/**
 * Shared Zod Schema for Backend API Environment Variables.
 */
export const ApiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // AWS Core
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Storage & Database
  DYNAMODB_TABLE_INCIDENTS: z.string().default('rescue-incidents'),
  USE_LOCAL_MOCK_STORE: z
    .union([z.boolean(), z.string()])
    .transform((val) => (typeof val === 'boolean' ? val : val === 'true'))
    .optional(),

  // Bedrock AI Configuration
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-haiku-4-5-20251001-v1:0'),
  BEDROCK_MAX_TOKENS: z.coerce.number().int().positive().default(300),
  BEDROCK_TEMPERATURE: z.coerce.number().min(0).max(1).default(0.2),
  BEDROCK_TIMEOUT_MS: z.coerce.number().int().positive().default(3500),

  // Step Functions & Notifications
  STATE_MACHINE_ARN: z.string().optional().default(''),
  SNS_TOPIC_ARN: z.string().optional().default(''),
  SES_FROM_EMAIL: z.string().default('alerts@rescuelink.org'),
  SES_ALERT_RECIPIENT: z.string().default('responders@rescuelink.org'),
  NOTIFICATION_PRIORITY_GATE: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default(['critical', 'high']),

  // Heuristic Triage Thresholds
  TRIAGE_CRITICAL_PEOPLE_THRESHOLD: z.coerce.number().int().positive().default(5),
  TRIAGE_HIGH_PEOPLE_THRESHOLD: z.coerce.number().int().positive().default(3),
  TRIAGE_CRITICAL_NEEDS: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default(['medical', 'boat']),
  TRIAGE_CRITICAL_CATEGORIES: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default(['fire']),
  TRIAGE_HIGH_NEEDS: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default(['clean_water', 'food']),
  TRIAGE_HIGH_CATEGORIES: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default(['landslide']),
  TRIAGE_HEURISTIC_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.92),

  // Broadcast & Security
  DEFAULT_BROADCAST_CHANNEL: z.string().default('wifi'),
  ALLOWED_ORIGINS: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val))
    .default([]),

  // Authentication & Rate Limiting
  API_KEY: z.string().default('rescuelink-responder-key-2026'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_SOS: z.coerce.number().int().positive().default(20),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

/**
 * Shared Zod Schema for Web Client Environment Variables.
 */
export const ClientEnvSchema = z.object({
  RESCUE_LINK_API_ORIGIN: z.string().default('http://localhost:3001'),
  NEXT_PUBLIC_API_KEY: z.string().default('rescuelink-responder-key-2026'),
  NEXT_PUBLIC_RESCUE_LINK_API_ORIGIN: z.string().optional(),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

/**
 * Validates process.env against ApiEnvSchema and returns strongly-typed config.
 * Throws a descriptive error at startup if environment variables are invalid.
 */
export function validateApiEnv(rawEnv: Record<string, unknown> = process.env): ApiEnv {
  const result = ApiEnvSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 2);
    console.error('🚨 [CONFIG ERROR] Invalid API Environment Configuration:\n', formatted);
    throw new Error(`Invalid API Environment Configuration:\n${formatted}`);
  }

  const parsed = result.data;

  const effectiveUseMock =
    parsed.USE_LOCAL_MOCK_STORE !== undefined
      ? parsed.USE_LOCAL_MOCK_STORE
      : parsed.NODE_ENV !== 'production';

  return {
    ...parsed,
    USE_LOCAL_MOCK_STORE: effectiveUseMock,
  };
}

/**
 * Validates client environment variables at Next.js build/startup time.
 */
export function validateClientEnv(rawEnv: Record<string, unknown> = process.env): ClientEnv {
  const result = ClientEnvSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 2);
    console.error('🚨 [CONFIG ERROR] Invalid Web Client Environment Configuration:\n', formatted);
    throw new Error(`Invalid Web Client Environment Configuration:\n${formatted}`);
  }
  return result.data;
}

/**
 * Master validated environment config object.
 */
export const CONFIG = validateApiEnv(process.env);
