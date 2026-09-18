'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Users, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
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
import { DetailSkeleton } from '@responder/components/ui/LoadingState';
import { ErrorState } from '@responder/components/ui/ErrorState';
import { useIncident } from '@responder/hooks/useIncident';
import { formatLocation, formatTimestamp } from '@responder/lib/format';
import { CATEGORY_LABELS, URGENT_NEED_LABELS, getCategory, getDescription, getPeopleAffected, getUrgentNeeds } from '@responder/lib/schema';

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { incident, isLoading, error, notFound, refresh, setIncident } = useIncident(id);

  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      {/* Tactical Top Bar */}
      <header className="glass sticky top-0 z-20 border-b border-line px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-action transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Command Dashboard</span>
          </Link>
          <span className="font-mono text-xs text-ink-500">Incident Triage Dossier</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        {isLoading ? (
          <DetailSkeleton />
        ) : notFound ? (
          <ErrorState message={`Incident ${id} could not be located in CAD database.`} onRetry={refresh} />
        ) : error || !incident ? (
          <ErrorState message={error ?? undefined} onRetry={refresh} />
        ) : (
          <div className="space-y-4">
            {/* Header Intel Card */}
            <section className="glass rounded-xl border border-line p-5 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-action">
                    Active Incident Dossier
                  </span>
                  <h1 className="font-mono text-xl font-extrabold text-white tracking-tight sm:text-2xl mt-0.5">
                    {incident.id}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={incident.priority} />
                  <StatusBadge status={incident.status} />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-line/60 bg-surface-2/50 p-3.5 sm:grid-cols-3 text-xs">
                <div>
                  <dt className="text-ink-500 font-medium">Hazard Type</dt>
                  <dd className="font-bold text-white mt-0.5">{CATEGORY_LABELS[getCategory(incident)]}</dd>
                </div>
                <div>
                  <dt className="text-ink-500 font-medium">Logged At</dt>
                  <dd className="font-mono text-ink-700 mt-0.5">{formatTimestamp(incident.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500 font-medium">Last Update</dt>
                  <dd className="font-mono text-ink-700 mt-0.5">{formatTimestamp(incident.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            {/* Location & Geospatial */}
            <section className="glass rounded-xl border border-line p-5 shadow-panel">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                <MapPin className="h-4 w-4 text-action" />
                <span>Geospatial Coordinates</span>
              </div>
              <p className="text-base font-semibold text-white">{formatLocation(incident.location)}</p>
              <p className="mt-1 font-mono text-xs text-action font-semibold">
                LAT: {incident.location.lat} | LNG: {incident.location.lng}
              </p>
            </section>

            {/* Survivor Incident Details */}
            <section className="glass rounded-xl border border-line p-5 shadow-panel">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                Field Distress Report
              </h2>
              <div className="rounded-lg bg-surface-2/60 border border-line/60 p-3.5">
                <p className="whitespace-pre-wrap text-sm text-ink-700 font-medium leading-relaxed">
                  {getDescription(incident)}
                </p>
              </div>
            </section>

            {/* People & Urgent Needs */}
            <section className="glass rounded-xl border border-line p-5 shadow-panel">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500 mb-3">
                <Users className="h-4 w-4 text-action" />
                <span>Casualties & Life-Critical Needs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-surface-2/40 border border-line/60 p-3">
                  <span className="text-ink-500">People At Risk:</span>
                  <p className="text-xl font-extrabold text-white font-mono mt-1">
                    {getPeopleAffected(incident)} Individuals
                  </p>
                </div>
                <div className="rounded-lg bg-surface-2/40 border border-line/60 p-3">
                  <span className="text-ink-500">Required Provisions:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {getUrgentNeeds(incident).length > 0 ? (
                      getUrgentNeeds(incident).map((need) => (
                        <span
                          key={need}
                          className="rounded bg-action/20 border border-action/30 px-2 py-0.5 text-[11px] font-semibold text-action"
                        >
                          {URGENT_NEED_LABELS[need]}
                        </span>
                      ))
                    ) : (
                      <span className="text-ink-500 italic">None reported</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* AI Bedrock Triage Card */}
            <TriageCard triage={incident.triage} />

            {/* Survivor Distress Audio */}
            <DistressAudioPlayer incident={incident} />

            {/* Reporter Information */}
            <section className="glass rounded-xl border border-line p-5 shadow-panel">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Reporter</h2>
              {incident.reporter?.contactValue && incident.reporter.contactMethod !== 'none' ? (
                <p className="text-sm font-semibold text-white">
                  {incident.reporter.contactMethod}: {incident.reporter.contactValue}
                </p>
              ) : (
                <p className="text-xs text-ink-500 italic">No reporter contact provided.</p>
              )}
            </section>

            {/* Operational Response Controls */}
            <AssignmentControl incident={incident} onUpdated={setIncident} />
            <DispatchedUnitsControl incident={incident} onUpdated={setIncident} />
            <UnitPositionPanel incident={incident} />
            <BroadcastAction incident={incident} onUpdated={setIncident} />
            <IncidentActions incident={incident} onUpdated={setIncident} />
            <NotificationStatus incident={incident} />
          </div>
        )}
      </main>
    </div>
  );
}
