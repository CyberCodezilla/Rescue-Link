'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  FileText,
  PhoneCall,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { AssignmentControl } from '@responder/components/incidents/AssignmentControl';
import { BroadcastAction } from '@responder/components/incidents/BroadcastAction';
import { DispatchedUnitsControl } from '@responder/components/incidents/DispatchedUnitsControl';
import { DistressAudioPlayer } from '@responder/components/incidents/DistressAudioPlayer';
import { NotificationStatus } from '@responder/components/incidents/NotificationStatus';
import { IncidentActions } from '@responder/components/incidents/IncidentActions';
import { PriorityBadge } from '@responder/components/incidents/PriorityBadge';
import { StatusBadge } from '@responder/components/incidents/StatusBadge';
import { TriageCard } from '@responder/components/incidents/TriageCard';
import { UnitPositionPanel } from '@responder/components/incidents/UnitPositionPanel';
import { IncidentFocusMapClient } from '@responder/components/map/IncidentFocusMapClient';
import { DetailSkeleton } from '@responder/components/ui/LoadingState';
import { ErrorState } from '@responder/components/ui/ErrorState';
import { useIncident } from '@responder/hooks/useIncident';
import { formatLocation, formatTimestamp } from '@responder/lib/format';
import {
  CATEGORY_LABELS,
  URGENT_NEED_LABELS,
  getCategory,
  getDescription,
  getPeopleAffected,
  getUrgentNeeds,
} from '@responder/lib/schema';

export interface IncidentDetailClientProps {
  initialId?: string;
  onBack?: () => void;
}

export default function IncidentDetailClient({ initialId, onBack }: IncidentDetailClientProps = {}) {
  const params = useParams<{ id: string }>();
  const idFromPath =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/\/incidents\/([a-zA-Z0-9_-]+)/)?.[1] ||
        new URLSearchParams(window.location.search).get('incident') ||
        undefined
      : undefined;

  const id = initialId || params?.id || idFromPath || '';
  const { incident, isLoading, error, notFound, refresh, setIncident } = useIncident(id);

  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      {/* Tactical HUD Header */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md px-4 py-3 sm:px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-action hover:bg-surface hover:text-action-hover transition-colors"
              >
                <ArrowLeft size={13} />
                <span>DASHBOARD</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded border border-line-2 bg-surface-2 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-action hover:bg-surface hover:text-action-hover transition-colors"
              >
                <ArrowLeft size={13} />
                <span>DASHBOARD</span>
              </Link>
            )}
            <div className="h-4 w-px bg-line" />
            <div className="flex items-center gap-2 font-mono text-xs text-ink-500 uppercase tracking-widest">
              <span>TACTICAL DOSSIER</span>
              <span>//</span>
              <span className="text-ink-900 font-bold">{id ? id.slice(0, 8) : ''}</span>
            </div>
          </div>

          {incident && (
            <div className="flex items-center gap-2.5">
              <PriorityBadge priority={incident.priority} />
              <StatusBadge status={incident.status} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {isLoading ? (
          <DetailSkeleton />
        ) : notFound ? (
          <ErrorState message={`Incident ${id} could not be found.`} onRetry={refresh} />
        ) : error || !incident ? (
          <ErrorState message={error ?? undefined} onRetry={refresh} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Primary Intel & Distress Telemetry (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Dossier Overview Card */}
              <section className="hud-panel p-5 border border-line bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-action animate-pulse" />
                    <h1 className="font-mono text-base font-bold text-ink-900 tracking-tight">
                      INCIDENT // {incident.id}
                    </h1>
                  </div>
                  <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded border border-line-2 bg-surface-2 text-action font-semibold">
                    {CATEGORY_LABELS[getCategory(incident)]}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded border border-line-2 bg-surface-2/40">
                    <dt className="text-ink-500 uppercase flex items-center gap-1.5">
                      <Clock size={12} /> LOGGED TIMESTAMP
                    </dt>
                    <dd className="mt-1 font-bold text-ink-900">
                      {formatTimestamp(incident.createdAt)}
                    </dd>
                  </div>
                  <div className="p-3 rounded border border-line-2 bg-surface-2/40">
                    <dt className="text-ink-500 uppercase flex items-center gap-1.5">
                      <Activity size={12} /> LAST TELEMETRY UPDATE
                    </dt>
                    <dd className="mt-1 font-bold text-ink-900">
                      {formatTimestamp(incident.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Narrative Threat Assessment */}
              <section className="hud-panel p-5 border border-line bg-surface">
                <div className="flex items-center gap-2 border-b border-line pb-2 mb-3">
                  <FileText size={14} className="text-action" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
                    SITUATION REPORT
                  </h2>
                </div>
                <p className="text-sm text-ink-900 leading-relaxed font-sans bg-canvas p-3 rounded border border-line-2">
                  {getDescription(incident)}
                </p>
              </section>

              {/* AI Triage & Evacuation Directives */}
              <TriageCard triage={incident.triage} />

              {/* High-Resolution Focus Reconnaissance Map */}
              <section className="hud-panel p-5 border border-line bg-surface">
                <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-action" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
                      TACTICAL RECONNAISSANCE MAP // 15.0X ZOOM
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] text-ink-500">
                    {formatLocation(incident.location)}
                  </span>
                </div>
                <IncidentFocusMapClient
                  location={incident.location}
                  priority={incident.priority}
                  category={getCategory(incident)}
                  incidentId={incident.id}
                />
              </section>

              {/* Civilian Distress Audio Recording */}
              <DistressAudioPlayer incident={incident} />

              {/* Casualty & Urgent Needs Metrics */}
              <section className="hud-panel p-5 border border-line bg-surface">
                <div className="flex items-center gap-2 border-b border-line pb-2 mb-3">
                  <Users size={14} className="text-action" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
                    CASUALTY IMPACT &amp; SUPPLY REQUIREMENTS
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-3 rounded border border-line-2 bg-surface-2/40">
                    <span className="text-ink-500 uppercase block mb-1">CIVILIANS AT RISK:</span>
                    <span className="text-xl font-bold text-ink-900">
                      {getPeopleAffected(incident)}
                    </span>
                  </div>
                  <div className="p-3 rounded border border-line-2 bg-surface-2/40">
                    <span className="text-ink-500 uppercase block mb-1">URGENT NEEDS:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {getUrgentNeeds(incident).length > 0 ? (
                        getUrgentNeeds(incident).map((need) => (
                          <span
                            key={need}
                            className="px-2 py-0.5 rounded border border-priority-high/30 bg-priority-high/10 font-mono text-xs font-bold text-priority-high uppercase"
                          >
                            {URGENT_NEED_LABELS[need]}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-500">None logged</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Tactical Actions & Communications (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Primary Action Button */}
              <IncidentActions incident={incident} onUpdated={setIncident} />

              {/* Field Units Dispatch */}
              <DispatchedUnitsControl incident={incident} onUpdated={setIncident} />

              {/* Responder Assignment */}
              <AssignmentControl incident={incident} onUpdated={setIncident} />

              {/* Satellite / Alert Notification Uplink */}
              <NotificationStatus incident={incident} />

              {/* Civilian Flash Directive Broadcast */}
              <BroadcastAction incident={incident} onUpdated={setIncident} />

              {/* Tactical Unit Coordinates Map Feed */}
              <UnitPositionPanel incident={incident} />

              {/* Reporter Contact Info */}
              <section className="hud-panel p-4 border border-line bg-surface">
                <div className="flex items-center gap-2 border-b border-line pb-2 mb-2.5">
                  <PhoneCall size={14} className="text-action" />
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-ink-900">
                    REPORTER DOSSIER
                  </h2>
                </div>
                {incident.reporter?.contactValue && incident.reporter.contactMethod !== 'none' ? (
                  <div className="font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink-500 uppercase">CHANNEL:</span>
                      <span className="font-bold text-ink-900 uppercase">
                        {incident.reporter.contactMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-500 uppercase">IDENTIFIER:</span>
                      <span className="font-bold text-action">
                        {incident.reporter.contactValue}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-500 font-mono">No contact info submitted.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
