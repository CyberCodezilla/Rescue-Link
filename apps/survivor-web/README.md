# 🆘 Survivor Web Application (`apps/survivor-web`)

Offline-first Edge Terminal web application designed for disaster survivors operating on captive emergency Wi-Fi portals, mesh networks, or low-bandwidth cellular connections.

## 🚀 Key Features

1. **IndexedDB Offline Queue (`src/lib/offlineQueue.ts`)**:
   - Persists emergency distress SOS submissions locally when cellular and internet connectivity are lost.
2. **Auto-Reconnection Background Sync (`src/hooks/useSyncQueue.ts`)**:
   - Automatically flushes queued distress submissions to `POST /api/incidents` as soon as network connectivity is restored.
3. **Edge Voice Distress Recorder (`src/hooks/useVoiceRecorder.ts`)**:
   - 1-tap 15-second emergency voice recorder encoding audio to base64 Data URIs (`audioBlob`), allowing AI triage models to evaluate audio distress context.
4. **Structured SOS Submission (`SOSSubmissionSchema`)**:
   - Captures disaster category (`flood`, `landslide`, `fire`, `other`), affected count, urgent needs (`medical`, `boat`, `food`, `clean_water`, `infant_care`), GPS coordinates, and contact details.
5. **Offline ID Polling Guard**:
   - Suspends backend API polling while incident IDs remain local drafts (`local-*`) to prevent unnecessary network 404 requests.
6. **Night Rescue Beacon Helper**:
   - High-luminance visual strobe signal screen helper for night evacuation and search teams.

## 💻 Local Development

```bash
# Run Survivor Web in development mode
npm run dev --workspace=apps/survivor-web

# Run TypeScript type check
npm run typecheck --workspace=apps/survivor-web
```

Application runs at `http://localhost:3000`.
