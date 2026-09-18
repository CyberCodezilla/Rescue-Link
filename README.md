<div align="center">

<!-- LOGO -->
```
██████╗ ███████╗███████╗ ██████╗██╗   ██╗███████╗██╗     ██╗███╗   ██╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██╔════╝██║   ██║██╔════╝██║     ██║████╗  ██║██║ ██╔╝
██████╔╝█████╗  ███████╗██║     ██║   ██║█████╗  ██║     ██║██╔██╗ ██║█████╔╝
██╔══██╗██╔══╝  ╚════██║██║     ██║   ██║██╔══╝  ██║     ██║██║╚██╗██║██╔═██╗
██║  ██║███████╗███████║╚██████╗╚██████╔╝███████╗███████╗██║██║ ╚████║██║  ██╗
╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
                    🆘  OFFLINE-FIRST EMERGENCY RESPONSE PLATFORM  🆘
```

# 🆘 RescueLink

**AI-Powered Triage • Real-Time Dispatch • Survivor Tracking • Offline-First**

[![CI](https://img.shields.io/badge/CI-passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/CyberCodezilla/Rescue-Link)
[![Tests](https://img.shields.io/badge/tests-98%2F98%20passing-success?style=for-the-badge&logo=vitest)](https://github.com/CyberCodezilla/Rescue-Link)
[![Phase](https://img.shields.io/badge/Phase-6%20Complete-blueviolet?style=for-the-badge)](https://github.com/CyberCodezilla/Rescue-Link)
[![TypeScript](https://img.shields.io/badge/TypeScript-monorepo-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://github.com/CyberCodezilla/Rescue-Link)
[![License](https://img.shields.io/badge/status-clean%20%26%20pushed-informational?style=for-the-badge)](https://github.com/CyberCodezilla/Rescue-Link)

[🔗 Repository](https://github.com/CyberCodezilla/Rescue-Link) • [🌿 Final Dev 2 Branch](https://github.com/CyberCodezilla/Rescue-Link/tree/feature/responder-final-phase)

</div>

---

## 🆘 What is RescueLink?

RescueLink is an **emergency response platform** built as a TypeScript npm-workspace monorepo, purpose-built for disaster scenarios where connectivity is unreliable. It connects survivors, AI triage, and field responders into a single resilient system.

| Layer | Description |
|---|---|
| 🆘 Survivor Web | Offline-capable SOS submission & rescue tracking |
| 🛰️ Responder Command Dashboard | Live incident management & dispatch |
| 🚑 Backend API | Express + TypeScript REST/SSE backend |
| 🧠 AI Emergency Triage | AWS Bedrock (Claude 3 Haiku) + heuristic fallback |
| 🗄️ DynamoDB Storage | Persistent + local fallback storage |
| ⚡ Server-Sent Events | Real-time updates with polling fallback |
| 📡 Environmental Sensors | Live telemetry layer |
| 🌋 Hazard Zones | Geofenced danger zones on the map |
| 📣 Amazon SNS / SES | Critical/high-priority notifications |

> Survivor SOS requests persist locally during network loss. Responder data falls back to cached data. Real-time SSE updates fall back to polling.

---

## 🏗️ Architecture

```mermaid
flowchart TB
    SW["🆘 Survivor Web<br/>Next.js + React"] -->|POST /api/incidents| API["🚑 RescueLink API<br/>Express + TypeScript"]
    API --> AI["🧠 AI Triage<br/>AWS Bedrock"]
    API --> DB[("🗄️ DynamoDB<br/>+ Local Fallback")]
    AI --> SNS["📣 SNS / SES"]
    API --> SSE["⚡ SSE Event Stream"]
    SSE --> RW["🛰️ Responder Web<br/>Command Dashboard"]
    SENSORS["📡 Sensors"] --> API
    HAZARDS["🌋 Hazard Zones"] --> API
    API --> RW

    style SW fill:#1e3a5f,color:#fff
    style RW fill:#1e3a5f,color:#fff
    style API fill:#7c2d12,color:#fff
    style AI fill:#4c1d95,color:#fff
    style DB fill:#065f46,color:#fff
    style SNS fill:#78350f,color:#fff
    style SSE fill:#b91c1c,color:#fff
```

---

## 🧩 Monorepo Structure

```
rescue-link-monorepo/
│
├── apps/
│   ├── api/                    → REST API, SSE, AI triage, DynamoDB, SNS/SES, telemetry
│   ├── responder-web/          → Command dashboard, incident mgmt, maps, dispatch, alerts
│   └── survivor-web/           → SOS submission, voice distress, offline queue, tracking
│
├── packages/
│   ├── schema/                 → Shared Zod contracts
│   └── config/                 → Shared configuration
│
├── tests/
│   └── contract/
│
├── Dev A (Sahil).md
├── Dev B (Anurag).md
├── Dev C (Yash).md
├── package.json
└── package-lock.json
```

---

## ⚙️ Technology Stack

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonaws&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat-square&logo=amazondynamodb&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)
![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

</div>

| Category | Stack |
|---|---|
| **Frontend** | React 19 • Next.js 15 • TypeScript • Tailwind CSS • Lucide React |
| **Backend** | Node.js • Express • TypeScript • Zod |
| **Mapping** | Leaflet • Leaflet Draw • OpenStreetMap |
| **AI** | AWS Bedrock • Claude 3 Haiku • Heuristic fallback |
| **Storage** | DynamoDB • IndexedDB • In-memory fallback |
| **Realtime** | Server-Sent Events • Polling |
| **Notifications** | Amazon SNS • Amazon SES |
| **Testing** | Vitest • Supertest • Contract tests |
| **DevOps** | npm workspaces • GitHub Actions |

---

## 🚨 Emergency Response Flow

```mermaid
flowchart TD
    A["🆘 Survivor"] --> B["📱 Submit SOS"]
    B --> C["🚑 API"]
    C --> D[("🗄️ Store Incident")]
    C --> E["🧠 AI Triage"]
    E --> E1["Priority"]
    E --> E2["Summary"]
    E --> E3["Reasoning"]
    E --> E4["Suggested Action"]
    E --> E5["Confidence"]
    C -->|critical/high| F["📣 SNS / SES"]
    C --> G["⚡ SSE Event"]
    G --> H["🛰️ Responder Dashboard"]
    H --> I1["Acknowledge"]
    H --> I2["Assign Responder"]
    H --> I3["Deploy Field Units"]
    H --> I4["Start Rescue"]
    H --> I5["Broadcast Directive"]
    H --> I6["Resolve"]
    H --> I7["Close"]
    I7 --> Z["✅ Mission Closed"]
```

---

## 🔄 Incident Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NEW: 🆕
    NEW --> ACKNOWLEDGED: 🟡
    ACKNOWLEDGED --> IN_PROGRESS: 🔵
    IN_PROGRESS --> RESOLVED: 🟢
    RESOLVED --> CLOSED: ⚪
    CLOSED --> [*]
```

---

## 🛰️ Responder Command Center

**Dashboard**
- Live incident counters
- Active incident view
- Priority / category / status filtering
- Priority-aware sorting
- 15-second polling + SSE live updates + polling fallback
- Offline cache & connection status

**Incident Detail**
- Coordinates, people affected, urgent needs, reporter details
- AI triage summary, reasoning, suggested action, confidence score
- Priority badge, distress audio, assignment
- Field unit deployment, tactical broadcast
- Lifecycle controls, notification status

---

## 🗺️ Map Intelligence

```mermaid
flowchart LR
    subgraph MAP["🗺️ Incident Map"]
        M1["🚨 Incident Markers"]
        M2["📡 Sensor Layer"]
        M3["🌋 Hazard Zone Layer"]
        M4["🚒 Field Unit Layer"]
        M5["📐 Geofence Tool"]
        M6["🎛️ Layer Controls"]
    end
```

**Features:** priority-based marker styling • sensor telemetry cards • point-in-circle & point-in-polygon checks • bulk incident actions • OpenStreetMap tiles • service-worker tile caching

---

## 🎙️ Voice Distress

```mermaid
flowchart TD
    A["🧑 Survivor"] --> B["🎙️ MediaRecorder"]
    B --> C["📦 audioBlob"]
    C -->|Online| D["POST /api/incidents"]
    C -->|Offline| E[("IndexedDB")]
    E --> F["Sync Queue"]
    F --> G["Backend"]
    D --> G
    G --> H["🎧 Responder Player"]
```

Responder behavior: uses the real `incident.audioBlob` • shows native browser audio controls when audio exists • shows no empty player when audio is absent • preserves the existing backend contract.

---

## 🔔 Critical Alert System

```mermaid
flowchart TD
    A["⚡ SSE Stream"] --> B["useIncidentStream"]
    C["15s Polling"] --> B
    B --> D["useCriticalAlert"]
    D --> E["ID Deduplication"]
    E --> F["🚨 Banner"]
    E --> G["🔊 Chime"]
    G --> H["User Audio Unlock"]
```

Supports: critical & fire incidents • SSE + polling fallback • duplicate alert prevention • reduced-motion behavior • browser audio restrictions with explicit unlock.

---

## 🧠 AI Triage Pipeline

```mermaid
flowchart TD
    A["SOS Submission"] --> B["Zod Validation"]
    B --> C["AWS Bedrock"]
    C --> D["Priority"]
    C --> E["Summary"]
    C --> F["Reasoning"]
    C --> G["Suggested Action"]
    C --> H["Confidence"]
    D & E & F & G & H --> I["Responder Dashboard"]
    C -.->|AWS unavailable| J["Heuristic Fallback"]
    J --> I
```

---

## 📡 Realtime + Offline Resilience

```mermaid
flowchart TD
    N["NETWORK"] --> S1["⚡ SSE"]
    N --> S2["🔄 Polling"]
    S1 --> R["🛰️ Responder UI"]
    S2 --> R
    N -.->|Network Loss| L["IndexedDB Cache"]
    N -.->|Network Loss| Q["Offline Queue"]
    L --> RC["Reconnect Sync"]
    Q --> RC
    RC --> API["API"]
```

**Survivor resilience:** IndexedDB incident queue • automatic reconnect sync • local incident IDs • offline tracking • battery-aware polling • OLED survival mode • service worker • night beacon • voice distress persistence

**Responder resilience:** IndexedDB incident cache • offline banner • SSE with polling fallback • cached map tiles • offline broadcast outbox • loading/empty/error states

---

## 📣 SNS / SES Notifications

```mermaid
flowchart TD
    A["New Incident"] --> B["🧠 AI Priority"]
    B -->|critical/high| C["📱 Amazon SNS"]
    B -->|critical/high| D["📧 Amazon SES"]
```

**Test endpoint:** `POST /api/notifications/test`

Responder UI: trigger test notification • loading state • duplicate-click protection • API result reporting • honest delivery status.

> Incident-level SNS/SES delivery fields are not exposed by the incident schema. Local mock mode reports `{ "snsSent": false, "sesSent": false }`. Console logging is **not** treated as AWS delivery.

---

## 🔌 API Surface

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/incidents` | Create incident |
| `GET` | `/api/incidents` | List incidents |
| `GET` | `/api/incidents/:id` | Fetch incident |
| `PATCH` | `/api/incidents/:id` | Update incident |
| `POST` | `/api/incidents/:id/acknowledge` | Acknowledge incident |
| `POST` | `/api/incidents/:id/broadcast` | Tactical broadcast |
| `GET` | `/api/events` | SSE stream |
| `GET` | `/api/sensors` | Sensor telemetry |
| `GET` | `/api/hazard-zones` | Hazard zones |
| `POST` | `/api/notifications/test` | Test notification |
| `GET` | `/api/health` | Health check |

---

## 👥 Developer Ownership

```mermaid
flowchart LR
    subgraph A["🅰️ Dev A · Sahil"]
        A1["apps/survivor-web"]
        A2["Offline SOS"]
        A3["Voice Distress"]
        A4["Rescue Tracking"]
        A5["Survival Mode"]
    end
    subgraph B["🅱️ Dev B · Anurag"]
        B1["apps/responder-web"]
        B2["Maps & Dispatch"]
        B3["Incident Lifecycle"]
        B4["Alerts"]
        B5["Phase 6 Integration"]
    end
    subgraph C["🅲 Dev C · Yash"]
        C1["apps/api"]
        C2["packages/schema"]
        C3["packages/config"]
        C4["AI Triage & Storage"]
        C5["SSE & AWS Notifications"]
    end
```

---

## 🧪 Final Verification — QA Gate

| Check | Status |
|---|---|
| TypeScript Typecheck | ✅ PASS |
| Vitest Test Files | ✅ 15 / 15 |
| Vitest Tests | ✅ 98 / 98 |
| Responder Build | ✅ PASS |
| Monorepo Build | ✅ PASS |
| CI | ✅ PASS |
| `git diff --check` | ✅ PASS |
| Working Tree | ✅ CLEAN |
| Final Branch | ✅ PUSHED |

---

## 📊 Test Distribution

```mermaid
pie showData
    title 98 Tests Across the Monorepo
    "Survivor Web (43)" : 43
    "Responder Web (28)" : 28
    "API (5)" : 5
    "Contract (13)" : 13
    "Schema (4)" : 4
```

| Module | Suite | Count |
|---|---|---|
| Survivor Web | Offline Queue | 6 |
| Survivor Web | Phase 2 | 6 |
| Survivor Web | Phase 3 | 8 |
| Survivor Web | Phase 4 | 6 |
| Survivor Web | Phase 5 | 17 |
| Responder Web | Lifecycle | 4 |
| Responder Web | Geography | 11 |
| Responder Web | Sorting | 9 |
| Responder Web | Phase 5 Integration | 4 |
| API | Notifications | 2 |
| API | Triage | 3 |
| Contract | Incidents | 13 |
| Schema | Validation | 4 |
| **Total** | | **98 / 98 ✅** |

---

## 📈 Project Status

```mermaid
%%{init: {'theme':'dark'}}%%
gantt
    title RescueLink — Module Completion
    dateFormat  X
    axisFormat %s
    section Core
    Survivor Web            :done, 0, 1
    Responder Web           :done, 0, 1
    API                     :done, 0, 1
    Shared Schema           :done, 0, 1
    section Intelligence
    AI Triage               :done, 0, 1
    DynamoDB Adapter        :done, 0, 1
    SSE                     :done, 0, 1
    Sensors                 :done, 0, 1
    Hazard Zones            :done, 0, 1
    section Comms & Resilience
    SNS / SES               :done, 0, 1
    Offline Support         :done, 0, 1
    Voice Distress          :done, 0, 1
    Critical Alerts         :done, 0, 1
    Incident Lifecycle      :done, 0, 1
    Phase 6 Dev 2           :done, 0, 1
```

---

## 🚀 Local Setup

```bash
# Install dependencies
npm install

# Build shared packages
npm run build:packages

# Typecheck
npm run typecheck

# Run tests
npm test

# Build the responder workspace
npm run build --workspace=@rescue-link/responder-web

# Full build
npm run build

# CI pipeline
npm run ci
```

---

## ▶️ Run Services

| Service | Command | URL |
|---|---|---|
| 🚑 API | `npm run dev:api` | http://localhost:3001 |
| 🆘 Survivor Web | `npm run dev:survivor` | http://localhost:3000 |
| 🛰️ Responder Web | `npm run dev:responder` | http://localhost:3002 |

---

## 🧪 Complete Verification Command

```bash
npm run typecheck && npm test && npm run build --workspace=@rescue-link/responder-web && npm run lint && npm run build && npm run ci && git diff --check
```

---

## 📁 Dev 2 File Structure (Responder Web)

```
apps/responder-web/
│
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── incidents/[id]/page.tsx
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CriticalAlertBanner.tsx
│   │   │   ├── SensorTelemetryPanel.tsx
│   │   │   └── SummaryCards.tsx
│   │   │
│   │   ├── incidents/
│   │   │   ├── DistressAudioPlayer.tsx
│   │   │   ├── NotificationStatus.tsx
│   │   │   ├── IncidentActions.tsx
│   │   │   ├── AssignmentControl.tsx
│   │   │   └── DispatchedUnitsControl.tsx
│   │   │
│   │   └── map/
│   │       ├── IncidentMap.tsx
│   │       ├── IncidentMapClient.tsx
│   │       └── MapLayerControls.tsx
│   │
│   ├── hooks/
│   │   ├── useCriticalAlert.ts
│   │   ├── useHazardLayer.ts
│   │   └── useIncidentStream.ts
│   │
│   └── lib/
│       ├── alertSound.ts
│       ├── api.ts
│       └── dashboardIntegration.ts
│
└── tests/
    ├── phase5.test.ts
    ├── lifecycle.test.ts
    ├── geo.test.ts
    └── sortIncidents.test.ts
```

---

## 🛠️ Phase 6 Dev 2 Deliverables

```mermaid
flowchart TD
    subgraph D1["1️⃣ Voice Distress Audio"]
        direction LR
        d1a["incident.audioBlob"] --> d1b["DistressAudioPlayer"] --> d1c["&lt;audio controls&gt;"]
    end
    subgraph D2["2️⃣ Hazard Map Wiring"]
        direction LR
        d2a["useHazardLayer()"] --> d2b["sensors + hazardZones + field units"] --> d2c["IncidentMapClient"] --> d2d["IncidentMap"]
    end
    subgraph D3["3️⃣ Critical Alerts"]
        direction LR
        d3a["useIncidentStream()"] --> d3b["useCriticalAlert()"] --> d3c["Deduplication"] --> d3d["Banner + Chime"]
    end
    subgraph D4["4️⃣ Notification Status"]
        direction LR
        d4a["Incident API"] --> d4b["NotificationStatus"] --> d4c["Actual API State"] --> d4d["No Fabricated Delivery Status"]
    end
    subgraph D5["5️⃣ Test Coverage"]
        d5a["Audio rendering"]
        d5b["Priority badges"]
        d5c["Hazard map wiring"]
        d5d["Sensor wiring"]
        d5e["Field unit wiring"]
    end
```

---

## 🔐 Engineering Principles

- ✅ Shared schema remains the contract source
- ✅ Existing functionality is preserved
- ✅ Real backend contracts are used
- ✅ No fake AWS delivery states
- ✅ No fabricated telemetry
- ✅ Offline behavior remains explicit
- ✅ Browser audio restrictions are respected
- ✅ SSE and polling work together
- ✅ Field-unit assignment stays separate from lead responder assignment
- ✅ Graceful fallbacks preserve dashboard operation
- ✅ Automated checks run before delivery

---

## 📚 Documentation

| File | Covers |
|---|---|
| `Dev A (Sahil).md` | Survivor Web implementation and phase history |
| `Dev B (Anurag).md` | Responder Web implementation, Phase 6 integration, verification & handoff |
| `Dev C (Yash).md` | API, shared schema, AWS infrastructure, AI triage, storage, SSE, SNS/SES |

---

## 📌 Final Git State

| Field | Value |
|---|---|
| Branch | `feature/responder-final-phase` |
| Commit | `a44d2b106a46ff73c979c874bb45985f702dc0ac` |
| Status | 🟢 CLEAN |
| Remote | 🟢 PUSHED |
| Verification | 98/98 tests • typecheck ✅ • responder build ✅ • monorepo build ✅ • CI ✅ • `git diff --check` ✅ |

---

<div align="center">

### 🆘 SURVIVOR → 🧠 TRIAGE → 🛰️ DISPATCH → 🚒 RESCUE → ✅ CLOSURE

**RESCUELINK**

[![GitHub](https://img.shields.io/badge/View%20on-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/CyberCodezilla/Rescue-Link)

</div>
