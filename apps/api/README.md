# ⚡ RescueLink Express API Backend (`apps/api`)

The backend API server powering RescueLink disaster response operations, emergency triage workflows, and real-time responder dispatch.

## 🛰️ Key Features & Architecture

### 1. REST Endpoints
- `POST /api/incidents`: Register survivor distress SOS alerts (protected by `sosRateLimit` rate-limiting middleware).
- `GET /api/incidents`: Fetch incidents with `status`, `priority`, search query (`q`), timestamp delta (`since`), and envelope pagination (`page`, `limit`).
- `GET /api/incidents/:id`: Retrieve single incident by UUID.
- `PATCH /api/incidents/:id`: Update status, priority, unit assignments, and triage details (requires `x-api-key` auth header).
- `POST /api/incidents/:id/acknowledge`: Acknowledge distress incident (requires `x-api-key`).
- `POST /api/incidents/:id/broadcast`: Broadcast tactical evacuation directives (requires `x-api-key`).
- `GET /api/sensors` & `GET /api/hazard-zones`: Environmental sensor telemetry and hazard zone endpoints.
- `GET /api/health`: Health status endpoint returning database persistence and AI circuit telemetry.

### 2. Real-time Streaming & Scalable Pub/Sub
- `GET /api/events`: Server-Sent Events (SSE) broadcast channel for real-time responder dashboard updates.
- **Pluggable Adapters**: Supports `LocalBroadcastAdapter` for single-node execution and `PubSubBroadcastAdapter` for multi-node horizontal scaling across API instances.

### 3. Automated AI Triage & Circuit Breaker
- **AWS Bedrock Integration**: Evaluates emergency distress payloads using Anthropic Claude Haiku 4.5 (`us.anthropic.claude-haiku-4-5-20251001-v1:0`).
- **Resilient Circuit Breaker**: Tracks consecutive failures (`circuitState`: `CLOSED` ↔ `OPEN`). Trips to `OPEN` after 3 failures, bypassing AWS SDK calls during a 30-second cooldown period directly to the shared heuristic triage evaluator.

### 4. Background Notification Queue & Life-Safety Tracing
- **`NotificationQueue`**: Non-blocking background worker queue that dispatches Amazon SNS SMS messages and Amazon SES HTML emails with retry handling.
- **`LifeSafetyTracer`**: Emits structured correlation trace logs (`ROUTE_RECVD` → `TRIAGE_START` → `BEDROCK_TRIAGE` → `TRIAGE_COMPLETE` → `QUEUE_ENQUEUE` → `NOTIFICATION_DISPATCH` → `NOTIFICATION_COMPLETE`).

### 5. Data Persistence & DynamoDB Indexing
- **DynamoDB Persistence**: Interacts with table `rescue-incidents` using `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`.
- **GSI Optimization**: Executes targeted `QueryCommand` queries on the `StatusCreatedAtIndex` Global Secondary Index when filtering by single status for fast index retrieval.
- **In-Memory Fallback**: Seamless fallback to `InMemoryIncidentStore` when operating offline or in test environments (`USE_LOCAL_MOCK_STORE=true`).

## 💻 Local Development & Testing

```bash
# Run API server in development mode
npm run dev --workspace=apps/api

# Run TypeScript type check
npm run typecheck --workspace=apps/api

# Run Vitest unit & contract test suite
npm run test --workspace=apps/api
```

Server listens at `http://localhost:3001`.
