import React, { useMemo } from 'react';
import { Radio, ShieldAlert, Send, ExternalLink } from 'lucide-react';
import type { IncidentFilters as IncidentFiltersState, IncidentResponse } from '@responder/lib/schema';
import { filterIncidents, sortIncidents } from '@responder/lib/sortIncidents';
import { EmptyState } from '@responder/components/ui/EmptyState';
import { IncidentTableRow, IncidentCard } from './IncidentRow';

interface IncidentListProps {
  incidents: IncidentResponse[];
  filters: IncidentFiltersState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  onClearFilters: () => void;
}

export function IncidentList({ incidents, filters, selectedId, onSelect, onHover, onClearFilters }: IncidentListProps) {
  const visible = useMemo(
    () => sortIncidents(filterIncidents(incidents, filters)),
    [incidents, filters]
  );

  if (incidents.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 p-6 sm:p-8 text-center backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-2xl pointer-events-none rounded-full" />

        {/* Tactical Radar Beacon Visual */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-slate-950/80 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
          </span>
          <Radio className="h-8 w-8 text-cyan-400 animate-pulse" />
        </div>

        {/* Title & Guidance */}
        <div className="mt-4 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
            <ShieldAlert size={12} className="text-amber-400" />
            <span>Tactical Standby // Awaiting Distress Telemetry</span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white font-sans">
            No Active Incidents in Queue
          </h3>

          <p className="mx-auto max-w-lg text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            The Rescuer Dashboard listens for live emergency calls. To test the end-to-end pipeline,
            <span className="text-amber-300 font-semibold"> the Survivor side must report an SOS first</span>.
          </p>
        </div>

        {/* Direct Action Button to Survivor Page */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://survivor.d3uwi22i8lbsov.amplifyapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-2.5 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-3 font-mono text-xs font-black tracking-wider text-slate-950 hover:brightness-110 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-200 active:scale-95 shadow-lg"
          >
            <Send size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            <span>GO TO SURVIVOR PAGE & REPORT SOS</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Guided 3-Step Testing Pipeline Flow */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[10px]">1</span>
              <span>Open Survivor App</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Click the button above to launch the Survivor Portal.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px] font-bold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">2</span>
              <span>Transmit SOS</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Submit in any language (Gujarati, Hindi, Spanish, English).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">3</span>
              <span>Watch Live Triage</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Bedrock triage & translation will populate this screen instantly!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <EmptyState
        title="No matching incidents"
        description="Try clearing or changing your filters."
        action={{ label: 'Clear filters', onClick: onClearFilters }}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border border-line bg-surface/90 backdrop-blur-sm md:block shadow-panel">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2/80 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-500">
              <th className="px-3 py-2.5 whitespace-nowrap">ID</th>
              <th className="px-3 py-2.5 whitespace-nowrap">CATEGORY</th>
              <th className="px-3 py-2.5 whitespace-nowrap">PRIORITY</th>
              <th className="px-3 py-2.5 whitespace-nowrap">COORDINATES</th>
              <th className="px-3 py-2.5 whitespace-nowrap">LOGGED</th>
              <th className="px-3 py-2.5 whitespace-nowrap">STATUS</th>
              <th className="px-3 py-2.5 whitespace-nowrap">DEPLOYED UNITS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((incident) => (
              <IncidentTableRow
                key={incident.id}
                incident={incident}
                isSelected={incident.id === selectedId}
                onSelect={onSelect}
                onHover={onHover}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {visible.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            isSelected={incident.id === selectedId}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </>
  );
}
