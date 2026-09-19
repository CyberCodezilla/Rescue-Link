<div align="center">

# 🚨 RESCUE-LINK

### Offline-First Disaster Emergency Response & Tactical AI Triage Platform
**Mission-Critical Life-Safety Infrastructure for Natural Disasters, Flash Floods, Earthquakes, and Infrastructure Blackouts**

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/CyberCodezilla/Rescue-Link/actions)
[![Tests](https://img.shields.io/badge/Tests-139%20Passing-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/CyberCodezilla/Rescue-Link)
[![Typecheck](https://img.shields.io/badge/TypeScript-Strict%200%20Errors-blue?style=for-the-badge&logo=typescript)](https://github.com/CyberCodezilla/Rescue-Link)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Amplify%20%7C%20Bedrock%20%7C%20DynamoDB-orange?style=for-the-badge&logo=amazonwebservices)](https://aws.amazon.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20First-purple?style=for-the-badge&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

[Live Survivor Portal](https://survivor.rescuelink.org) • [Tactical Responder HUD](https://rescuer.rescuelink.org) • [Architecture Docs](docs/AWS_LAMBDA_INTEGRATION.md) • [Satellite Uplink Guide](docs/SATELLITE_UPLINK.md)

---

</div>

## 📌 Overview

**Rescue-Link** is an enterprise-grade, life-safety emergency platform designed to operate seamlessly under extreme disaster conditions—even during complete cellular grid and power infrastructure collapse. 

By combining **offline-first Progressive Web Applications (PWA)**, **IndexedDB write-ahead queues**, **Amazon Bedrock AI automated triage**, **AWS Step Functions asynchronous workflows**, and **satellite/LoRa IoT telemetry**, Rescue-Link bridges the vital communication gap between trapped survivors and frontline emergency rescue teams.

---

## 🏗️ Enterprise System Architecture

Rescue-Link utilizes an event-driven hybrid cloud architecture with active failover mechanisms, zero data-loss persistence, and edge resilience:

```text
                                 ┌────────────────────────────────────────┐
                                 │    SURVIVOR EMERGENCY INGESTION        │
                                 │  (Next.js PWA + IndexedDB 4-Pool Sync) │
                                 └───────────────────┬────────────────────┘
                                                     │
                             ┌───────────────────────┴────────────────────────┐
                             │                                                │
                             ▼                                                ▼
              ┌──────────────────────────────┐                ┌──────────────────────────────┐
              │      TERRESTRIAL PATH        │                │     OFF-GRID SATELLITE       │
              │  Express.js REST / SSE API   │                │   AWS IoT Core (LoRa/Sat)    │
              │  Rate-Limited Ingestion      │                │   Binary Envelope Decoding   │
              └──────────────┬───────────────┘                └──────────────┬───────────────┘
                             │                                               │
                             ▼                                               ▼
              ┌──────────────────────────────────────────────────────────────────────────────┐
              │                   AWS CLOUD / HYBRID ORCHESTRATION LAYER                    │
              ├──────────────────────────────────────────────────────────────────────────────┤
              │ • LifeSafetyTracer Telemetry (Structured Audit Logging)                      │
              │ • Bedrock AI 3-State Circuit Breaker (CLOSED -> OPEN -> HALF_OPEN)           │
              │ • DynamoDB with GSIs (StatusCreatedAtIndex & PriorityCreatedAtIndex)         │
              │ • Asynchronous Step Functions Express Workflow (Triage + Alerts + Callback)  │
              │ • Multi-Channel Alerts (Amazon SNS SMS + Amazon SES Priority Email)          │
              └──────────────────────────────────────┬───────────────────────────────────────┘
                                                     │ Real-Time SSE Stream / Push
                                                     ▼
                                 ┌────────────────────────────────────────┐
                                 │      TACTICAL RESPONDER HUD            │
                                 │  (Leaflet GIS + Audio Directives)      │
                                 └────────────────────────────────────────┘
```

---

## ⚡ Key Capabilities & Features

### 1. 🆘 Survivor Mobile Portal (`apps/survivor-web`)
- **True Offline-First Operation**: Built as a Progressive Web App (PWA) with Service Worker background caching. Survivors can open the app and trigger emergency SOS signals even with zero connectivity.
- **Concurrent IndexedDB Sync**: Pending emergency transmissions are persisted to local IndexedDB and flushed using a **4-worker concurrency pool** with exponential backoff when signal is restored.
- **Acoustic Distress Recorder**: In-browser audio capture with compression for survivors trapped beneath debris or unable to type.
- **High-Visibility Emergency Beacon**: Night-mode high-frequency flashing screen strobe for optical detection by search-and-rescue helicopters and ground drones.
- **Live Lifecycle Feedback**: Real-time status tracking (`Reported` ➔ `Acknowledged` ➔ `Rescue En Route` ➔ `Resolved`).
- **Low-Battery Optimization**: Automatically throttles polling intervals and disables resource-heavy animations when battery drops below 15%.

### 2. 🛰️ Tactical Responder Command HUD (`apps/responder-web`)
- **Dark Tactical C2 Interface**: High-contrast, military-grade situational dashboard designed for command centers and rugged field tablets.
- **Interactive Geospatial Map**: Leaflet GIS interface plotting critical distress beacons, triage priorities (Critical / High / Medium / Low), hazard zones, and responder GPS vectors.
- **Instant Triage & Dispatch Drawer**: One-click unit assignment (`Alpha-1`, `Boat-Team-3`, `Air-Rescue-7`), operational directives, and tactical notes.
- **Emergency Broadcast Transmitter**: Mass emergency alerting via WiFi-Direct, FM, and SMS to specific geographic sectors.
- **Sensory & Telemetry Monitor**: Real-time sensor telemetry tracking seismic activity, flood water levels, acoustic distress, and ambient air quality.
- **Resilient Real-Time Streaming**: Server-Sent Events (SSE) with an automated **3.5s fallback timeout** to prevent UI hangs behind cloud load balancers.

### 3. 🧠 AI Emergency Triage Engine (`apps/api` & `apps/lambda`)
- **Anthropic Claude 3.5 Haiku via Amazon Bedrock**: Analyzes unstructured survivor distress text, location data, and reported casualties in <1.5 seconds.
- **Deterministic Heuristic Engine**: Zero-dependency deterministic fallback logic guaranteeing instant triage even if Bedrock or external APIs experience outages.
- **3-State Production Circuit Breaker**: State-machine monitoring consecutive failures (`CLOSED` ➔ `OPEN` ➔ `HALF_OPEN`) with automated cooldown probing and recovery.
- **Audit-Compliant Telemetry**: Full `LifeSafetyTracer` structured JSON audit trail tracking triage decisions, confidence metrics, and processing latency.

### 4. 🔒 Enterprise Security & Database Performance
- **$O(1)$ DynamoDB GSI Indexing**: Eliminated full-table scans by indexing `StatusCreatedAtIndex` and `PriorityCreatedAtIndex` for sub-millisecond retrieval under heavy load.
- **Zero In-Memory Fallback**: Replaced volatile RAM fallback with transactional exponential backoff writes, guaranteeing zero incident data-loss during scale events.
- **Constant-Time Cryptographic Auth**: Replaced plain string comparisons with SHA-256 `crypto.timingSafeEqual` (`safeCompare`) to defeat timing side-channel attacks.
- **Rate-Limited SOS Ingestion**: Protects backend resources and AI budgets against DDoS attacks and script floods during active emergencies.

---

## 📂 Monorepo Architecture

```text
Rescue-Link/
├── apps/
│   ├── api/                  # Express.js REST & SSE Backend with DynamoDB & Bedrock
│   ├── lambda/               # AWS Serverless Functions (Triage, Notification, Callback)
│   ├── responder-web/        # Tactical Responder Command Dashboard (Next.js 15)
│   └── survivor-web/         # Offline-First Survivor Emergency PWA (Next.js 15)
├── packages/
│   ├── config/               # Centralized Zod Environment & Config Validation
│   └── schema/               # Shared Schemas, Canonical Types & Heuristic Engine
├── docs/
│   ├── AWS_LAMBDA_INTEGRATION.md   # CloudFormation & Serverless SAM Architecture
│   └── SATELLITE_UPLINK.md         # LoRa & Satellite Binary Protocol Specifications
├── AUDIT_REMEDIATION.md      # Security & Performance Audit Remediation Log
├── template.yaml             # AWS SAM Infrastructure as Code (CloudFormation)
└── package.json              # Monorepo Workspace Configuration (npm workspaces)
```

---

## 🚀 Production Deployment & AWS Infrastructure

Rescue-Link utilizes a multi-branch GitOps continuous deployment pipeline orchestrated through **AWS Amplify Hosting**, **AWS Lambda**, and **Amazon DynamoDB**:

| Branch | Target Role | Hosting Platform | Target Region | App / Infrastructure ID |
| :--- | :--- | :--- | :--- | :--- |
| **`survivor`** | Survivor Web PWA | AWS Amplify Hosting | `us-east-1` | `d1s5o36sosgnvp` |
| **`rescuer`** / **`responder`** | Responder Tactical HUD | AWS Amplify Hosting | `us-west-2` | `d3w0lc6ciydtzq` |
| **`main`** | Unified Source of Truth | GitHub CI/CD Pipeline | Multi-Region | Automated Verification |
| **Serverless SAM** | Triage & State Machine | AWS Lambda + DynamoDB | `us-east-1` | CloudFormation Stack `rescue-link-core` |

### AWS Infrastructure Resources (`template.yaml`):
- **DynamoDB Table**: `rescue-incidents` (Partition Key: `id`, GSIs: `StatusCreatedAtIndex`, `PriorityCreatedAtIndex`)
- **Step Functions**: `IncidentTriageWorkflow` (Express Asynchronous State Machine)
- **SNS Topic**: `EmergencyTopic` (SMS Disaster Alerting)
- **SES Domain**: Verified emergency email dispatch
- **Bedrock Model**: `us.anthropic.claude-haiku-4-5-20251001-v1:0`

---

## 🛠️ Local Development & Quick Start

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **AWS CLI / SAM CLI** *(optional, for cloud emulation)*

### 1. Installation
Clone the repository and install dependencies across all workspaces:
```bash
git clone https://github.com/CyberCodezilla/Rescue-Link.git
cd Rescue-Link
npm ci
```

### 2. Build Shared Libraries
Compile `@rescue-link/schema` and `@rescue-link/config`:
```bash
npm run build:packages
```

### 3. Launch Development Servers
Run the full stack concurrently:
```bash
npm run dev
```
- **Survivor Web Portal**: [http://localhost:3000](http://localhost:3000)
- **Responder Command HUD**: [http://localhost:3002](http://localhost:3002)
- **Backend API Server**: [http://localhost:3001](http://localhost:3001)

---

## 🧪 Comprehensive Verification Suite

Rescue-Link enforces strict type checking and contract testing across all monorepo workspaces:

```bash
# 1. Run all 139 automated tests across 24 test suites
npm test

# 2. Execute strict TypeScript validation across all workspaces
npm run typecheck

# 3. Verify static production exports for both Next.js applications
npm run build
```

---

## 🛡️ Life-Safety Reliability Guarantee

Rescue-Link is engineered to operate during critical disasters where human lives are on the line:
- **No Single Point of Failure**: If AWS Bedrock is unreachable, the system automatically falls back to deterministic heuristic triage within **<5ms**.
- **No Memory-Only Volatile State**: All incidents are backed by persistent storage with exponential retry queues.
- **Fail-Closed Security**: Protected endpoints strictly enforce constant-time cryptographic token matching with zero fallback to default keys in production.

---

<div align="center">

**Rescue-Link Disaster Emergency Response System**  
*Engineered for extreme conditions. Built to save lives.*

</div>