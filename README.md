# RescueLink

Offline-first disaster emergency response platform featuring survivor SOS ingestion, AI-driven emergency triage, automated responder dispatch, real-time SSE event streaming, structured telemetry, and cloud resilience via AWS Lambda, Step Functions, DynamoDB, SNS, and SES.

## 🏗️ System Architecture

RescueLink operates in a hybrid deployment mode: Express.js powers the high-concurrency REST API, local background notification queue, and long-lived Server-Sent Events (SSE) connections, while AWS Step Functions orchestrates cloud-native asynchronous emergency processing.

```text
Survivor SOS → Express API → LifeSafetyTracer Telemetry
                              ├─ Local Path: Bedrock AI / Circuit Breaker → NotificationQueue (SNS/SES) → SSE Stream
                              └─ AWS Cloud Path: Step Functions State Machine
                                                 ├─ Triage Lambda → AWS Bedrock → DynamoDB
                                                 ├─ Notification Lambda → SNS SMS / SES Email
                                                 └─ Callback Lambda → Express Callback → SSE Broadcast
```

## 🛠️ Key Monorepo Components

- **`apps/api`**: Express.js REST & SSE API with rate limiting, background `NotificationQueue`, `BedrockService` circuit breaker, and DynamoDB GSI queries.
- **`apps/lambda`**: AWS Lambda functions (`triage`, `notifications`, `callback`, `satellite`) for serverless emergency workflow execution.
- **`apps/survivor-web`**: Offline-first Next.js PWA with IndexedDB offline queue, voice distress recorder, and auto-sync worker.
- **`apps/responder-web`**: Real-time responder tactical dashboard with map visualization, unit assignment, and SSE updates.
- **`packages/schema`**: Shared Zod schemas, TypeScript types, domain models, heuristic triage evaluator, and alert notification formatters.
- **`packages/config`**: Centralized environment variable validation (`validateApiEnv`, `validateClientEnv`) and helper parsers.

## 📚 Documentation & Reference Guides

- `docs/AWS_LAMBDA_INTEGRATION.md`: Serverless deployment and SAM template configuration (`template.yaml`).
- `docs/SATELLITE_UPLINK.md`: Satellite and LoRa emergency uplink integration via AWS IoT Core.
