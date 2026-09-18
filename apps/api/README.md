# ⚡ RescueLink Express API Backend (`apps/api`)

The backend API server powering RescueLink disaster response operations.

## 🛰️ Key Features

1. **REST Endpoints**:
   - `POST /api/incidents`: Register new survivor distress SOS alerts.
   - `GET /api/incidents`: Fetch incidents with `status` and `priority` filters.
   - `GET /api/incidents/:id`: Retrieve single incident by UUID.
   - `PATCH /api/incidents/:id`: Update status, priority, unit assignments, and triage.
   - `POST /api/incidents/:id/acknowledge`: Acknowledge incident.
   - `POST /api/incidents/:id/broadcast`: Broadcast tactical evacuation directives.
   - `GET /api/sensors` & `GET /api/hazard-zones`: Environmental telemetry endpoints.
2. **Real-time Streaming**:
   - `GET /api/events`: Zero-latency Server-Sent Events (SSE) broadcast channel.
3. **Automated AI Triage & Notifications**:
   - AWS Bedrock (`Claude Haiku 4.5`) integration with heuristic offline fallback.
   - Amazon SNS SMS and Amazon SES HTML email dispatchers.
4. **Dual Data Persistence**:
   - DynamoDB table `rescue-incidents` with automatic fallbacks to `InMemoryIncidentStore`.

## 💻 Local Development

```bash
npm run dev --workspace=apps/api
```
Server listens at `http://localhost:3001`.
