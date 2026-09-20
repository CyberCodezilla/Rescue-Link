```
██████╗ ███████╗███████╗ ██████╗██╗   ██╗███████╗    ██╗     ██╗███╗   ██╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██╔════╝██║   ██║██╔════╝    ██║     ██║████╗  ██║██║ ██╔╝
██████╔╝█████╗  ███████╗██║     ██║   ██║█████╗      ██║     ██║██╔██╗ ██║█████╔╝ 
██╔══██╗██╔══╝  ╚════██║██║     ██║   ██║██╔══╝      ██║     ██║██║╚██╗██║██╔═██╗ 
██║  ██║███████╗███████║╚██████╗╚██████╔╝███████╗    ███████╗██║██║ ╚████║██║  ██╗
╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

<div align="center">

### 🚨 Offline-First Disaster Emergency Response & Tactical AI Command Platform

<img src="https://img.shields.io/badge/STATUS-LIVE%20OPERATIONAL-00ff88?style=for-the-badge&logo=statuspage">
<img src="https://img.shields.io/badge/POWERED%20BY-AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
<img src="https://img.shields.io/badge/AI-Amazon%20Bedrock-blueviolet?style=for-the-badge&logo=amazon">
<img src="https://img.shields.io/badge/PWA-OFFLINE%20FIRST-purple?style=for-the-badge">
<img src="https://img.shields.io/badge/Tests-139%20Passing-success?style=for-the-badge">
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">

<br>
<img src="https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUybTk0b3F6aGlpY3B5YzAyaWppYmJtMDQ2MnN3Zm5zZ3FwNnhoZXNsbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4zq6TRKJKGre5pFbB6/giphy.gif" width="500">
<br>

🆘 *Life-saving infrastructure for disasters, floods, earthquakes & network blackouts*
🏆 *Built on AWS — Serverless, AI-Native, Mission Critical*

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

**Rescue-Link** is an offline-first disaster communication system connecting trapped survivors with emergency responders during infrastructure failures — powered end-to-end by **AWS**, combining Progressive Web Apps, offline queues, AI-driven triage, and real-time tactical dashboards.

---

<div align="center">

## ☁️ POWERED BY AWS

<img src="https://img.shields.io/badge/-Built%20Entirely%20On%20Amazon%20Web%20Services-232F3E?style=for-the-badge&logo=amazonaws&logoColor=FF9900">

</div>

### 🧠 Key AWS Services Leveraged

| AWS Service | Role in Rescue-Link |
|---|---|
| 🛰️ **AWS IoT Core** | Ultra-low-bandwidth MQTT distress ingestion with offline-first client buffering for blacked-out networks |
| 🧠 **Amazon Bedrock** (Claude 3 / Titan) | Autonomous medical & hazard triage, casualty extraction, priority classification, and gear recommendations |
| 🌍 **Amazon Translate** | Instant translation of survivor distress messages from any language into English, while archiving original source transcripts |
| 🗃️ **Amazon DynamoDB** | Single-digit millisecond latency persistence for active incidents, geospatial coordinates, and responder audits |
| 📣 **Amazon SNS & SES** | Immediate broadcast dispatch of high-priority mission alerts via SMS and email to field rescue teams |
| 🔐 **AWS Amplify & Amazon Cognito** | Serverless, high-availability global hosting with tactical role-based authentication for emergency personnel |

---

## 🧬 Core Flow

```mermaid
flowchart LR
A[🧍 Survivor] --> B[📱 Offline PWA]
B --> C{Network?}
C -->|Yes| D[AWS IoT Core]
C -->|No| E[IndexedDB Queue] --> D
D --> G[AWS Lambda] --> H["🧠 Amazon Bedrock<br/>Claude 3 / Titan"]
H --> T[Amazon Translate]
H --> I{Triage}
I -->|Critical| J[🚨 Immediate Rescue]
I -->|High| K[🚑 Priority Dispatch]
I -->|Medium| L[📍 Monitoring]
G --> M[Amazon DynamoDB] --> N[🚒 Responder HUD]
M --> S["Amazon SNS / SES<br/>Alert Broadcast"]
```

## 🏗️ System Architecture

```mermaid
graph TD
SURVIVOR["📱 Survivor PWA"] --> OFFLINE["IndexedDB Offline Queue"]
OFFLINE --> IOT["🛰️ AWS IoT Core<br/>MQTT Ingestion"]
IOT --> LAMBDA["⚡ AWS Lambda"]
LAMBDA --> BEDROCK["🧠 Amazon Bedrock<br/>AI Triage Engine"]
LAMBDA --> TRANSLATE["🌍 Amazon Translate"]
LAMBDA --> DB["🗃️ Amazon DynamoDB"]
DB --> ALERT["📣 Amazon SNS / SES<br/>Rescue Team Alerts"]
DB --> HUD["🚒 Responder Command HUD"]
AUTH["🔐 Amazon Cognito"] --> HUD
HOST["☁️ AWS Amplify"] --> SURVIVOR
HOST --> HUD
HUD --> GIS["Leaflet GIS Map"]
```

## 🔄 SOS Request Sequence

```mermaid
sequenceDiagram
    participant S as 🧍 Survivor
    participant P as 📱 PWA
    participant IOT as 🛰️ AWS IoT Core
    participant L as ⚡ Lambda
    participant B as 🧠 Bedrock AI
    participant TR as 🌍 Translate
    participant D as 🗃️ DynamoDB
    participant SNS as 📣 SNS/SES
    participant R as 🚒 Responder HUD

    S->>P: Trigger SOS (any language)
    P->>IOT: Publish distress (or sync when online)
    IOT->>L: Forward event
    L->>TR: Translate message
    TR-->>L: English transcript
    L->>B: Analyze emergency + risk score
    B-->>L: Triage priority + recommendations
    L->>D: Persist incident record
    D-->>SNS: Trigger alert on high priority
    SNS-->>R: SMS + Email dispatch
    D-->>R: Push real-time update
    R-->>S: Acknowledge + ETA
```

---

## ☁️ Full AWS Services Stack

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
- 🌍 Auto-translated distress messages (Amazon Translate)
- 🔐 Encrypted upload → 🧠 AI triage → 🚑 dispatch

## 🚒 Tactical Responder HUD

- 🗺️ Real-time incident map (Leaflet GIS)
- 👥 Rescue team tracking & priority filters
- 📡 Live sensor monitoring (flood, seismic, acoustic, air quality, signal)
- 📣 Emergency broadcast & audio directives

## 🧠 AI Emergency Intelligence (Amazon Bedrock)

| Feature | Status |
|---|---|
| Disaster Text Analysis | ✅ |
| Priority / Hazard Classification | ✅ |
| Casualty Extraction | ✅ |
| Gear Recommendations | ✅ |
| Confidence Scoring | ✅ |
| AI Failure Backup | ✅ |
| Audit Logging | ✅ |

## 🔐 Security

- Amazon Cognito role-based authentication for emergency personnel
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

```
██████╗ ███████╗███████╗ ██████╗██╗   ██╗███████╗    ██╗     ██╗███╗   ██╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██╔════╝██║   ██║██╔════╝    ██║     ██║████╗  ██║██║ ██╔╝
██████╔╝█████╗  ███████╗██║     ██║   ██║█████╗      ██║     ██║██╔██╗ ██║█████╔╝ 
██╔══██╗██╔══╝  ╚════██║██║     ██║   ██║██╔══╝      ██║     ██║██║╚██╗██║██╔═██╗ 
██║  ██║███████╗███████║╚██████╗╚██████╔╝███████╗    ███████╗██║██║ ╚████║██║  ██╗
╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**Built for the moment when everything else fails**

🛰️ Offline Ready · 🤖 AI Assisted · 🚒 Rescue Focused · 🌎 Disaster Resilient · ☁️ AWS Powered

<img src="https://img.shields.io/badge/Made%20With-❤️%20%26%20Code-red?style=for-the-badge">
<img src="https://img.shields.io/badge/Powered%20By-AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">

</div>
