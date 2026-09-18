# 🚨 RescueLink Monorepo

> **Mission-Critical Disaster Distress Relay, AI Triage & Tactical Evacuation Dispatch System**

RescueLink is an end-to-end emergency disaster management platform designed for zero-telecom blackouts, offline captive Wi-Fi portals, automated AWS Bedrock AI triage, and real-time responder dispatch streaming.

---

## 🏗️ Architecture & Workspace Structure

RescueLink is organized as an `npm` workspace monorepo:

```
RescueLink/
├── apps/
│   ├── api/             # Express REST API, SSE Stream, Bedrock AI Triage & AWS SNS/SES Engine
│   ├── survivor-web/    # Offline-First PWA Edge Terminal for Disaster Victims (IndexedDB Queue)
│   └── responder-web/   # Real-Time Incident Dashboard & Tactical Evacuation Map for Rescuers
└── packages/
    ├── schema/          # Shared Zod Schemas & TypeScript Domain Interfaces (@rescue-link/schema)
    └── config/          # Centralized Environment & Feature Toggle Configuration (@rescue-link/config)
```

---

## ⚡ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Leaflet / Leaflet-Draw, IndexedDB (`idb`)
- **Backend**: Express, TypeScript, Server-Sent Events (SSE), Zod Validation
- **AI & Cloud Services**: AWS Bedrock (Claude Haiku 4.5), DynamoDB, Amazon SNS (SMS), Amazon SES (Email)
- **Tooling**: npm workspaces, Vitest, tsx, TypeScript

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v18+` or `v20+`
- npm `v9+`

### 2. Installation
```bash
git clone https://github.com/CyberCodezilla/Rescue-Link.git
cd RescueLink
npm install
npm run build:packages
```

### 3. Running Services locally

```bash
# Start API Backend (Port 3001)
npm run dev:api

# Start Survivor Web App (Port 3000)
npm run dev:survivor

# Start Responder Web App (Port 3002)
npm run dev:responder
```

### 4. Running Quality & Test Gates

```bash
# Run complete Vitest suite across all workspaces (94+ tests)
npm test

# Run TypeScript typechecks
npm run typecheck

# Full production build
npm run build
```

---

## 📜 License
MIT License - Built for Disaster Relief and Crisis Evacuation Operations.
