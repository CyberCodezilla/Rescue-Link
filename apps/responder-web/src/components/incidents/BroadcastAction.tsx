'use client';

import React, { useState } from 'react';
import { Radio, AlertOctagon } from 'lucide-react';
import { BroadcastModal } from './BroadcastModal';
import type { IncidentResponse } from '@responder/lib/schema';

interface BroadcastActionProps {
  incident: IncidentResponse;
  onUpdated: (incident: IncidentResponse) => void;
}

export function BroadcastAction({ incident, onUpdated }: BroadcastActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="hud-panel p-4 border border-danger/40 bg-danger/10 hud-glow-red">
      <div className="flex items-center gap-2 border-b border-danger/30 pb-2">
        <AlertOctagon size={16} className="text-danger" />
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-red-200">
          CIVILIAN FLASH DIRECTIVE BROADCAST
        </h2>
      </div>
      <p className="mt-2 text-xs text-red-200/90 leading-relaxed font-sans">
        Transmit real-time safety instructions directly to affected survivor devices, mesh gateways, or geofenced zone beacons.
      </p>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-3 flex items-center gap-2 rounded bg-danger px-4 py-2 font-mono text-xs font-bold text-white hover:bg-danger-hover transition-colors shadow-[0_0_12px_rgba(239,68,68,0.4)]"
      >
        <Radio size={14} />
        <span>BROADCAST FLASH DIRECTIVE</span>
      </button>
      {isOpen ? (
        <BroadcastModal incident={incident} onClose={() => setIsOpen(false)} onUpdated={onUpdated} />
      ) : null}
    </section>
  );
}
