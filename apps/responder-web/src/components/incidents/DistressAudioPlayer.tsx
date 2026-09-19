'use client';

import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import { hasDistressAudio } from '@responder/lib/dashboardIntegration';

export function DistressAudioPlayer({ incident }: { incident: IncidentResponse }) {
  if (!hasDistressAudio(incident)) return null;

  return (
    <section className="hud-panel p-4 border border-indigo-500/40 bg-indigo-950/20">
      <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-indigo-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
            Distress Audio
          </h2>
        </div>
        <span className="hud-tag bg-indigo-950 text-indigo-400 border border-indigo-500/40 text-[10px]">
          VOICE SOS
        </span>
      </div>

      <div className="mt-3">
        <audio
          className="w-full h-9 rounded outline-none"
          controls
          preload="metadata"
          src={incident.audioBlob}
          aria-label="Survivor distress audio"
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    </section>
  );
}
