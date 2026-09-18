import React from 'react';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import type { IncidentTriage } from '@responder/lib/schema';

export function TriageCard({ triage }: { triage: IncidentTriage | undefined }) {
  const hasTriage =
    triage && (triage.suggestedAction || triage.summary || triage.reasoning);

  if (!hasTriage) {
    return (
      <section className="hud-panel p-4 border border-line-2 bg-surface/80">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-action" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
            BEDROCK AI TRIAGE RECOMMENDATION
          </h2>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-xs font-mono text-ink-500">
          <AlertCircle size={14} className="text-priority-pending" />
          <span>Automated triage pipeline pending analysis...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="hud-panel p-4 border border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            BEDROCK AI TRIAGE DIRECTIVE
          </h2>
        </div>
        <span className="hud-tag bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px]">
          HIGH CONFIDENCE
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {triage.summary ? (
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-cyan-400/80">
              SITUATION SUMMARY
            </p>
            <p className="mt-0.5 text-xs text-ink-700 leading-relaxed font-sans">{triage.summary}</p>
          </div>
        ) : null}

        {triage.suggestedAction ? (
          <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-500/30">
            <p className="text-[10px] font-mono font-bold uppercase text-cyan-300">
              TACTICAL DIRECTIVE
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ink-900 leading-relaxed font-sans">
              {triage.suggestedAction}
            </p>
          </div>
        ) : null}

        {triage.reasoning ? (
          <div>
            <p className="text-[10px] font-mono font-bold uppercase text-ink-500">
              AI MODEL REASONING
            </p>
            <p className="mt-0.5 text-[11px] text-ink-500 leading-relaxed font-sans">{triage.reasoning}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
