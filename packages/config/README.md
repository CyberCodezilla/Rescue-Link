# ⚙️ Shared Config Package (`@rescue-link/config`)

Centralized environment variable validation, parsing helper functions, feature toggles, and sensible fallback defaults across RescueLink applications and Lambda services.

## 🛠️ Main Exports

- **`validateApiEnv(env)`**: Parses and validates API environment variables, enforcing strict production constraints when `NODE_ENV=production`.
- **`validateClientEnv(env)`**: Validates client-side configuration parameters and API origin URLs.
- **`parseListEnv(raw, fallback)`**: Robustly splits comma-delimited string variables into cleaned arrays.
- **`parseNumberEnv(raw, fallback)`**: Coerces environment variables into valid finite numbers.
- **`parseIntegerEnv(raw, fallback)`**: Coerces environment variables into valid integers.

## 🔑 Exported Configuration Keys & Defaults

| Key | Description | Default / Fallback |
|-----|-------------|--------------------|
| `PORT` | Express API Server Port | `3001` |
| `NODE_ENV` | Runtime Environment (`development` \| `test` \| `production`) | `development` |
| `API_KEY` | API Security Key for Responder operations | empty in development, required in production |
| `AWS_REGION` | AWS Region for Bedrock, DynamoDB, SNS, SES | `us-east-1` |
| `DYNAMODB_TABLE_INCIDENTS` | DynamoDB Table Name | `rescue-incidents` |
| `USE_LOCAL_MOCK_STORE` | Force in-memory store in dev/test | `false` |
| `BEDROCK_MODEL_ID` | Anthropic Bedrock Model ID | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |
| `BEDROCK_MAX_TOKENS` | Maximum tokens for AI triage completion | `300` |
| `BEDROCK_TIMEOUT_MS` | AI Triage timeout in milliseconds | `3500` |
| `BEDROCK_TEMPERATURE` | AI Triage sampling temperature | `0.2` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` (1 min) |
| `RATE_LIMIT_MAX_SOS` | Max SOS submissions per rate limit window | `30` |
| `NOTIFICATION_PRIORITY_GATE` | Priorities triggering SNS/SES alerts | `['critical', 'high']` |
| `SES_FROM_EMAIL` | Amazon SES Verified Sender Email | `alerts@rescuelink.org` |
| `SES_ALERT_RECIPIENT` | Amazon SES Emergency Recipient Email | `responders@rescuelink.org` |
| `STATE_MACHINE_ARN` | AWS Step Functions State Machine ARN | `''` (local fallback mode) |
| `LAMBDA_CALLBACK_SECRET` | Secret key for Lambda SSE callback verification | `''` |

## 🔒 Production Validation Rules

When `NODE_ENV=production`, `validateApiEnv()` enforces strict safety checks:
1. `API_KEY` must be explicitly defined and cannot be the default placeholder (empty in development, required in production).
2. `DYNAMODB_TABLE_INCIDENTS` cannot be empty.
3. `SES_FROM_EMAIL` and `SES_ALERT_RECIPIENT` cannot contain `example.com` placeholder domains.
4. `LAMBDA_CALLBACK_SECRET` must be explicitly configured and at least 32 characters.
