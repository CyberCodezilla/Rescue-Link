# 🆘 Survivor Web Application (`apps/survivor-web`)

Offline-first Edge Terminal application for disaster survivors operating on captive Wi-Fi emergency portals.

## 🚀 Key Features

1. **IndexedDB Offline Queue (`src/lib/offlineQueue.ts`)**:
   - Stores distress SOS submissions locally when cellular and internet connectivity are unavailable.
2. **Auto-Reconnection Background Sync (`src/hooks/useSyncQueue.ts`)**:
   - Flushes queued distress submissions automatically to `POST /api/incidents` once network connects.
3. **Edge Voice Distress Recorder (`src/hooks/useVoiceRecorder.ts`)**:
   - 1-tap 15-second audio recording encoded to base64 Data URIs for voice SOS transmission.
4. **Offline ID Polling Guard**:
   - Suspends server polling while incident IDs are local (`local-*`) to avoid 404 flooding.
5. **Night Rescue Screen Beacon**:
   - High-luminance SOS strobe signal helper for night evacuation teams.

## 💻 Local Development

```bash
npm run dev --workspace=apps/survivor-web
```
App runs at `http://localhost:3000`.
