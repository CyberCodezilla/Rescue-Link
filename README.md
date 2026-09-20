<div align="center">

# 🚨 RESCUE-LINK

**Offline-First Disaster Emergency Response & Tactical AI Command Platform**

<img src="https://img.shields.io/badge/STATUS-LIVE%20OPERATIONAL-00ff88?style=for-the-badge&logo=statuspage">
<img src="https://img.shields.io/badge/AI-Amazon%20Bedrock-blueviolet?style=for-the-badge&logo=amazon">
<img src="https://img.shields.io/badge/PWA-OFFLINE%20FIRST-purple?style=for-the-badge">
<img src="https://img.shields.io/badge/Tests-139%20Passing-success?style=for-the-badge">
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">

<br>
<img src="https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUybTk0b3F6aGlpY3B5YzAyaWppYmJtMDQ2MnN3Zm5zZ3FwNnhoZXNsbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4zq6TRKJKGre5pFbB6/giphy.gif" width="500">
<br>

🆘 *Life-saving infrastructure for disasters, floods, earthquakes & network blackouts*

<img src="https://img.shields.io/github/stars/CyberCodezilla/Rescue-Link?style=social">
<img src="https://img.shields.io/github/forks/CyberCodezilla/Rescue-Link?style=social">
<img src="https://img.shields.io/github/watchers/CyberCodezilla/Rescue-Link?style=social">

</div>

---

## 🌐 Live System

| Service | Link | Status |
|---|---|---|
| 🧍 Survivor Emergency Portal | https://survivor.rescuelink.org | 🟢 Online |
| 🚒 Tactical Responder HUD | https://rescuer.rescuelink.org | 🟢 Online |
| 📚 Documentation | `docs/` | 📖 Available |
| ☁️ Cloud Infrastructure | AWS Serverless Stack | 🟢 Healthy |

---

## ⚡ Mission Overview

**Rescue-Link** is an offline-first disaster communication system connecting trapped survivors with emergency responders during infrastructure failures — combining Progressive Web Apps, offline queues, AI-driven triage, and real-time tactical dashboards.

---

## 🧬 Core Flow

```mermaid
flowchart LR
A[🧍 Survivor] --> B[📱 Offline PWA]
B --> C{Network?}
C -->|Yes| D[API Gateway]
C -->|No| E[IndexedDB Queue] --> D
D --> G[AWS Lambda] --> H[Amazon Bedrock AI]
H --> I{Triage}
I -->|Critical| J[🚨 Immediate Rescue]
I -->|High| K[🚑 Priority Dispatch]
I -->|Medium| L[📍 Monitoring]
G --> M[DynamoDB] --> N[🚒 Responder HUD]
```

## 🏗️ System Architecture

```mermaid
graph TD
SURVIVOR["📱 Survivor PWA"] --> OFFLINE["IndexedDB Offline Queue"]
OFFLINE --> API["Express API + SSE"]
API --> LAMBDA["AWS Lambda"]
LAMBDA --> BEDROCK["Amazon Bedrock AI"]
LAMBDA --> DB["DynamoDB"]
DB --> HUD["🚒 Responder Command HUD"]
SAT["🛰️ Satellite / IoT Sensors"] --> LAMBDA
HUD --> GIS["Leaflet GIS Map"]
HUD --> ALERT["Emergency Broadcast"]
```

## 🔄 SOS Request Sequence

```mermaid
sequenceDiagram
    participant S as 🧍 Survivor
    participant P as 📱 PWA
    participant L as ⚡ Lambda
    participant B as 🧠 Bedrock AI
    participant D as 🗃️ DynamoDB
    participant R as 🚒 Responder HUD

    S->>P: Trigger SOS
    P->>L: Send request (or sync when online)
    L->>B: Analyze emergency text
    B-->>L: Risk score + priority
    L->>D: Persist incident record
    D-->>R: Push real-time update
    R-->>S: Acknowledge + ETA
```

---

## ☁️ AWS Services Used

<div align="center">

<img src="https://img.shields.io/badge/Amazon%20Translate-AI%2FML-blueviolet?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/Amazon%20Bedrock-AI%2FML-blueviolet?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/Amazon%20DynamoDB-Database-4053D6?style=for-the-badge&logo=amazondynamodb">
<img src="https://img.shields.io/badge/Amazon%20EC2-Compute-FF9900?style=for-the-badge&logo=amazonec2">
<img src="https://img.shields.io/badge/AWS%20Amplify-Frontend%20Hosting-FF9900?style=for-the-badge&logo=awsamplify">
<img src="https://img.shields.io/badge/Amazon%20Cognito-Auth-DD344C?style=for-the-badge&logo=amazoncognito">
<img src="https://img.shields.io/badge/AWS%20Lambda-Compute-FF9900?style=for-the-badge&logo=awslambda">
<img src="https://img.shields.io/badge/AWS%20Step%20Functions-Orchestration-FF4F8B?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/Amazon%20SNS-Notifications-FF4F8B?style=for-the-badge&logo=amazonsimplenotificationservice">
<img src="https://img.shields.io/badge/Amazon%20SES-Email-FF4F8B?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/AWS%20IoT%20Core-Telemetry-232F3E?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/AWS%20IAM-Security-DD344C?style=for-the-badge&logo=amazoniam">
<img src="https://img.shields.io/badge/AWS%20SAM%20%2F%20CloudFormation-IaC-FF4F8B?style=for-the-badge&logo=amazonaws">
<img src="https://img.shields.io/badge/Amazon%20CloudWatch-Monitoring-FF4F8B?style=for-the-badge&logo=amazoncloudwatch">

</div>

| # | Service | Purpose |
|---|---|---|
| 1 | Amazon Translate | Multi-language survivor support |
| 2 | Amazon Bedrock | AI emergency triage & risk scoring |
| 3 | Amazon DynamoDB | Incident & responder data store |
| 4 | Amazon EC2 | Backend compute workloads |
| 5 | AWS Amplify | Frontend hosting & CI/CD |
| 6 | Amazon Cognito | Responder/survivor authentication |
| 7 | AWS Lambda | Serverless request processing |
| 8 | AWS Step Functions | Incident workflow orchestration |
| 9 | Amazon SNS | Critical alert broadcasting |
| 10 | Amazon SES | Email notifications |
| 11 | AWS IoT Core | Satellite/sensor telemetry ingestion |
| 12 | AWS IAM | Access control & permissions |
| 13 | AWS SAM / CloudFormation | Infrastructure as code |
| 14 | Amazon CloudWatch | Logging, metrics & alarms |

---

## 🚨 Survivor Portal Features

- 📴 Offline emergency mode — works with zero connectivity
- 🗄️ Local SOS storage with automatic background sync
- 📍 Location capture + 🎙️ audio recording on trigger
- 🔐 Encrypted upload → 🧠 AI triage → 🚑 dispatch

## 🚒 Tactical Responder HUD

- 🗺️ Real-time incident map (Leaflet GIS)
- 👥 Rescue team tracking & priority filters
- 📡 Live sensor monitoring (flood, seismic, acoustic, air quality, signal)
- 📣 Emergency broadcast & audio directives

## 🧠 AI Emergency Intelligence

| Feature | Status |
|---|---|
| Disaster Text Analysis | ✅ |
| Priority Detection | ✅ |
| Confidence Scoring | ✅ |
| AI Failure Backup | ✅ |
| Audit Logging | ✅ |

## 🔐 Security

- Constant-time (SHA256) authentication
- Rate-limited SOS endpoints
- Encrypted communication end-to-end
- Production environment validation
- Full audit trace system

---

## 📂 Repository Structure

```
Rescue-Link/
├── apps/
│   ├── api/
│   ├── lambda/
│   ├── responder-web/
│   └── survivor-web/
├── packages/
│   ├── config/
│   └── schema/
├── docs/
├── template.yaml
└── package.json
```

---

## 🛠️ Local Setup

```bash
git clone https://github.com/CyberCodezilla/Rescue-Link.git
cd Rescue-Link
npm ci
npm run build:packages
npm run dev
```

| Service | Port |
|---|---|
| Survivor Portal | 3000 |
| API Server | 3001 |
| Responder HUD | 3002 |

## 🧪 Testing

```bash
npm test
npm run typecheck
npm run build
```

✅ 139 Tests Passing · ✅ 0 TypeScript Errors · ✅ Production Build Successful

---

<div align="center">

### 🚨 RESCUE-LINK
**Built for the moment when everything else fails**

🛰️ Offline Ready · 🤖 AI Assisted · 🚒 Rescue Focused · 🌎 Disaster Resilient

<img src="https://img.shields.io/badge/Made%20With-❤️%20%26%20Code-red?style=for-the-badge">
<img src="https://img.shields.io/badge/Powered%20By-AWS-6c47ff?style=for-the-badge">

</div>
