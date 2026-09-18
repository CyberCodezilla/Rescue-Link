'use client';

import React from 'react';

import type { IncidentResponse } from '@responder/lib/schema';
import { hasDistressAudio } from '@responder/lib/dashboardIntegration';

export function DistressAudioPlayer({ incident }: { incident: IncidentResponse }) {
  if (!hasDistressAudio(incident)) return null;

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink-900">Distress Audio</h2>
      <audio
        className="mt-2 w-full"
        controls
        preload="metadata"
        src={incident.audioBlob}
        aria-label="Survivor distress audio"
      >
        Your browser does not support audio playback.
      </audio>
    </section>
  );
}
