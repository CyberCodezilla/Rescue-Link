/**
 * Centralized configuration for the RescueLink API.
 * Every key reads from process.env first, falling back to a sensible default.
 * Defaults match the original hardcoded values for backward compatibility.
 */
export const CONFIG = {
  // ── Server ────────────────────────────────────────────────────────────────
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // ── AWS Core ──────────────────────────────────────────────────────────────
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  DYNAMODB_TABLE_INCIDENTS: process.env.DYNAMODB_TABLE_INCIDENTS || 'rescue-incidents',
  /** Set to 'true' explicitly to use the in-memory mock store, default to true in non-production. */
  USE_LOCAL_MOCK_STORE: process.env.USE_LOCAL_MOCK_STORE
    ? process.env.USE_LOCAL_MOCK_STORE === 'true'
    : (process.env.NODE_ENV || 'development') !== 'production',

  // ── Bedrock / LLM ────────────────────────────────────────────────────────
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0',
  BEDROCK_MAX_TOKENS: process.env.BEDROCK_MAX_TOKENS
    ? parseInt(process.env.BEDROCK_MAX_TOKENS, 10)
    : 300,
  BEDROCK_TEMPERATURE: process.env.BEDROCK_TEMPERATURE
    ? parseFloat(process.env.BEDROCK_TEMPERATURE)
    : 0.2,
  /** Timeout in ms for Bedrock AI triage calls before falling back to rule-based triage. */
  BEDROCK_TIMEOUT_MS: process.env.BEDROCK_TIMEOUT_MS
    ? parseInt(process.env.BEDROCK_TIMEOUT_MS, 10)
    : 3500,

  // ── Step Functions ────────────────────────────────────────────────────────
  STATE_MACHINE_ARN: process.env.STATE_MACHINE_ARN || '',

  // ── SNS / SES Notifications ───────────────────────────────────────────────
  SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN || '',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'alerts@rescuelink.org',
  SES_ALERT_RECIPIENT: process.env.SES_ALERT_RECIPIENT || 'responders@rescuelink.org',
  /** Comma-separated list of priority levels that trigger SNS/SES alerts. */
  NOTIFICATION_PRIORITY_GATE: (process.env.NOTIFICATION_PRIORITY_GATE || 'critical,high')
    .split(',')
    .map((s) => s.trim()),

  // ── Heuristic Triage Thresholds ───────────────────────────────────────────
  /** People-affected count at or above which the incident becomes CRITICAL. */
  TRIAGE_CRITICAL_PEOPLE_THRESHOLD: process.env.TRIAGE_CRITICAL_PEOPLE_THRESHOLD
    ? parseInt(process.env.TRIAGE_CRITICAL_PEOPLE_THRESHOLD, 10)
    : 5,
  /** People-affected count at or above which the incident becomes HIGH. */
  TRIAGE_HIGH_PEOPLE_THRESHOLD: process.env.TRIAGE_HIGH_PEOPLE_THRESHOLD
    ? parseInt(process.env.TRIAGE_HIGH_PEOPLE_THRESHOLD, 10)
    : 3,
  /** Comma-separated urgent-need keywords that escalate to CRITICAL. */
  TRIAGE_CRITICAL_NEEDS: (process.env.TRIAGE_CRITICAL_NEEDS || 'medical,boat')
    .split(',')
    .map((s) => s.trim()),
  /** Comma-separated incident categories that escalate to CRITICAL. */
  TRIAGE_CRITICAL_CATEGORIES: (process.env.TRIAGE_CRITICAL_CATEGORIES || 'fire')
    .split(',')
    .map((s) => s.trim()),
  /** Comma-separated urgent-need keywords that escalate to HIGH. */
  TRIAGE_HIGH_NEEDS: (process.env.TRIAGE_HIGH_NEEDS || 'clean_water,food')
    .split(',')
    .map((s) => s.trim()),
  /** Comma-separated incident categories that escalate to HIGH. */
  TRIAGE_HIGH_CATEGORIES: (process.env.TRIAGE_HIGH_CATEGORIES || 'landslide')
    .split(',')
    .map((s) => s.trim()),
  /** Confidence score assigned to heuristic (non-AI) triage results. */
  TRIAGE_HEURISTIC_CONFIDENCE: process.env.TRIAGE_HEURISTIC_CONFIDENCE
    ? parseFloat(process.env.TRIAGE_HEURISTIC_CONFIDENCE)
    : 0.92,

  // ── Broadcast & Security ──────────────────────────────────────────────────
  /** Default communication channel for survivor broadcasts. */
  DEFAULT_BROADCAST_CHANNEL: process.env.DEFAULT_BROADCAST_CHANNEL || 'wifi',
  /** Comma-separated list of allowed CORS origins for production. */
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // ── Authentication & Rate Limiting ─────────────────────────────────────────
  /** Secret API Key for responder/admin management routes. */
  API_KEY: process.env.API_KEY || 'rescuelink-responder-key-2026',
  /** Rate limit window in milliseconds (default: 15 minutes). */
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
    : 15 * 60 * 1000,
  /** Maximum public SOS submissions per IP per window. */
  RATE_LIMIT_MAX_SOS: process.env.RATE_LIMIT_MAX_SOS
    ? parseInt(process.env.RATE_LIMIT_MAX_SOS, 10)
    : 20,
};
