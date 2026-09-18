# ⚙️ Shared Config Package (`@rescue-link/config`)

Centralized environment variables, feature toggles, and sensible fallback defaults for RescueLink services.

## 🛠️ Exported Config Keys

| Key | Description | Default |
|-----|-------------|---------|
| `PORT` | API Server Port | `3001` |
| `NODE_ENV` | Runtime Environment | `development` |
| `AWS_REGION` | AWS Data Region | `us-east-1` |
| `DYNAMODB_TABLE_INCIDENTS` | DynamoDB Table Name | `rescue-incidents` |
| `USE_LOCAL_MOCK_STORE` | Force Memory Store Flag | `true` in dev unless set |
| `BEDROCK_MODEL_ID` | Claude LLM Model ID | `anthropic.claude-haiku-4-5-20251001-v1:0` |
| `SES_FROM_EMAIL` | Sender Email for SES | `alerts@rescuelink.org` |
| `SES_ALERT_RECIPIENT` | Recipient Email for SES | `responders@rescuelink.org` |
