'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Radio,
  Users,
  Send,
  BookmarkPlus,
  Layers,
  MapPin,
  Flame,
  Waves,
  Mountain,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { IncidentResponse } from '@responder/lib/schema';
import {
  CATEGORY_LABELS,
  URGENT_NEED_LABELS,
  getCategory,
  getDescription,
  getPeopleAffected,
  getUrgentNeeds,
  NEXT_ACTION,
} from '@responder/lib/schema';
import { formatLocation, formatTimestamp, hasAssignedUnits } from '@responder/lib/format';
import { ApiError, updateIncident, acknowledgeIncident } from '@responder/lib/api';
import { PriorityBadge } from '@responder/components/incidents/PriorityBadge';
import { StatusBadge } from '@responder/components/incidents/StatusBadge';
import { DistressAudioPlayer } from '@responder/components/incidents/DistressAudioPlayer';
import { BroadcastModal } from '@responder/components/incidents/BroadcastModal';
import { TriageCard } from '@responder/components/incidents/TriageCard';
import { UnitPositionPanel } from '@responder/components/incidents/UnitPositionPanel';
import { NotificationStatus } from '@responder/components/incidents/NotificationStatus';
import {
  generateIncidentRecommendation,
  loadAllRescuePlans,
  saveCustomRescuePlan,
  type RescuePlanTemplate,
} from '@responder/lib/dispatcherRecommendations';

interface DispatchDrawerProps {
  incident: IncidentResponse;
  onClose: () => void;
  onUpdated: (incident: IncidentResponse) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Waves,
  fire: Flame,
  landslide: Mountain,
  other: HelpCircle,
};

export function DispatchDrawer({ incident, onClose, onUpdated }: DispatchDrawerProps) {
  const category = getCategory(incident);
  const Icon = CATEGORY_ICONS[category] || HelpCircle;
  const casualties = getPeopleAffected(incident);
  const urgentNeeds = getUrgentNeeds(incident);

  // Recommendation engine
  const recommendation = useMemo(() => generateIncidentRecommendation(incident), [incident]);

  // Operational plans
  const [plans, setPlans] = useState<RescuePlanTemplate[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [newPlanName, setNewPlanName] = useState<string>('');
  const [showSavePlan, setShowSavePlan] = useState<boolean>(false);

  // Form states
  const [assignedToDraft, setAssignedToDraft] = useState<string>(incident.assignedTo ?? '');
  const [unitDraft, setUnitDraft] = useState<string>('');
  const [unitsList, setUnitsList] = useState<string[]>(incident.triage?.assignedUnits ?? []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Broadcast modal trigger
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Sync state when incident changes
  useEffect(() => {
    setAssignedToDraft(incident.assignedTo ?? '');
    setUnitsList(incident.triage?.assignedUnits ?? []);
    setPlans(loadAllRescuePlans());
    setStatusMessage(null);
    setErrorMessage(null);
  }, [incident]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Apply AI Bedrock Recommendation in 1 click
  const handleApplyRecommendation = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const mergedUnits = Array.from(new Set([...unitsList, ...recommendation.recommendedUnits]));
      const updated = await updateIncident(incident.id, {
        assignedTo: recommendation.leadRole,
        triage: { assignedUnits: mergedUnits },
      });
      setAssignedToDraft(recommendation.leadRole);
      setUnitsList(mergedUnits);
      onUpdated(updated);
      setStatusMessage('AI Recommendation successfully applied and dispatched.');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to apply recommendation.');
    } finally {
      setIsSaving(false);
    }
  }, [incident.id, unitsList, recommendation, onUpdated]);

  // Apply a selected Stored Rescue Plan
  const handleApplyPlan = useCallback(
    async (planId: string) => {
      setSelectedPlanId(planId);
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      setIsSaving(true);
      setErrorMessage(null);
      try {
        const mergedUnits = Array.from(new Set([...unitsList, ...plan.units]));
        const updated = await updateIncident(incident.id, {
          assignedTo: plan.leadRole,
          triage: { assignedUnits: mergedUnits },
        });
        setAssignedToDraft(plan.leadRole);
        setUnitsList(mergedUnits);
        onUpdated(updated);
        setStatusMessage(`Rescue Plan "${plan.name}" successfully deployed.`);
      } catch (err) {
        setErrorMessage(err instanceof ApiError ? err.message : 'Failed to apply plan.');
      } finally {
        setIsSaving(false);
      }
    },
    [incident.id, plans, unitsList, onUpdated]
  );

  // Save current setup as a new custom plan
  const handleSaveCustomPlan = () => {
    if (!newPlanName.trim() || unitsList.length === 0) return;
    const saved = saveCustomRescuePlan({
      name: newPlanName.trim(),
      category,
      leadRole: assignedToDraft || 'Lead Tactical Officer',
      units: unitsList,
      directive: recommendation.recommendedDirective,
    });
    setPlans(loadAllRescuePlans());
    setSelectedPlanId(saved.id);
    setNewPlanName('');
    setShowSavePlan(false);
    setStatusMessage(`Custom template "${saved.name}" saved for future incidents.`);
  };

  // Save Lead Dispatcher
  const handleSaveAssignedTo = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateIncident(incident.id, { assignedTo: assignedToDraft.trim() });
      onUpdated(updated);
      setStatusMessage('Lead dispatcher assignment updated.');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to save lead dispatcher.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add individual unit
  const handleAddUnit = async (nameToAdd?: string) => {
    const unitName = (nameToAdd || unitDraft).trim();
    if (!unitName || unitsList.includes(unitName)) return;

    const nextUnits = [...unitsList, unitName];
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateIncident(incident.id, {
        triage: { assignedUnits: nextUnits },
      });
      setUnitsList(nextUnits);
      setUnitDraft('');
      onUpdated(updated);
      setStatusMessage(`Dispatched ${unitName}.`);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to dispatch unit.');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove individual unit
  const handleRemoveUnit = async (unitName: string) => {
    const nextUnits = unitsList.filter((u) => u !== unitName);
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateIncident(incident.id, {
        triage: { assignedUnits: nextUnits },
      });
      setUnitsList(nextUnits);
      onUpdated(updated);
      setStatusMessage(`Unit ${unitName} stood down.`);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Failed to update units.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lifecycle status transition
  const action = NEXT_ACTION[incident.status];
  const handleStatusTransition = async () => {
    if (!action) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated =
        incident.status === 'new'
          ? await acknowledgeIncident(incident.id)
          : await updateIncident(incident.id, { status: action.next });
      onUpdated(updated);
      setStatusMessage(`Incident marked as ${action.label}.`);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Status update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        role="dialog"
        aria-label={`Dispatch Dossier for Incident ${incident.id}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl md:max-w-2xl flex-col bg-surface border-l border-line shadow-2xl backdrop-blur-xl animate-fade-in"
      >
        {/* Drawer Header */}
        <header className="border-b border-line bg-surface-2/90 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-action/20 border border-action/40 text-action">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{incident.id}</span>
                  <PriorityBadge priority={incident.priority} />
                  <StatusBadge status={incident.status} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-ink-500 mt-0.5">
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span>•</span>
                  <span>{formatTimestamp(incident.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-action bg-action/10 border border-action/30 px-2 py-0.5 rounded">
                INCIDENT DOSSIER
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dispatch drawer"
                className="rounded border border-line p-1 text-ink-500 hover:bg-surface-3 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Feedback Banners */}
        {statusMessage && (
          <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-4 py-2 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-950/60 border-b border-red-500/30 px-4 py-2 text-xs font-mono text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* GEOSPATIAL COORDINATES & LOCATION */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono font-bold text-white uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-action" />
                <span>Geospatial Coordinates</span>
              </div>
              <span className="font-mono text-[11px] text-action font-semibold">
                LAT: {incident.location.lat} | LNG: {incident.location.lng}
              </span>
            </div>
            <p className="text-xs font-semibold text-white">{formatLocation(incident.location)}</p>
          </section>

          {/* AI SMART RECOMMENDATIONS CARD */}
          <section className="hud-panel p-4 border border-cyan-500/40 bg-cyan-950/20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>AI Bedrock Operational Recommendation</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {recommendation.priorityAlert}
              </span>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed mb-3">
              {recommendation.rationale}
            </p>

            <div className="rounded bg-surface/80 border border-line p-2.5 mb-3 text-xs space-y-1.5 font-mono">
              <div>
                <span className="text-ink-500">Recommended Lead: </span>
                <span className="text-white font-semibold">{recommendation.leadRole}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-ink-500">Recommended Squads: </span>
                {recommendation.recommendedUnits.map((u) => (
                  <span
                    key={u}
                    className="px-1.5 py-0.5 rounded bg-action/20 text-action border border-action/30 text-[11px] font-bold"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyRecommendation}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-cyan-600/20"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>⚡ 1-CLICK APPLY AI RECOMMENDATION</span>
            </button>
          </section>

          {/* COMMON RESCUE TEAM PLANS (STORED TEMPLATES) */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-action" />
                <span>Common Rescue Team Plans (Stored Templates)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSavePlan(!showSavePlan)}
                className="flex items-center gap-1 text-[11px] font-semibold text-action hover:text-white transition-colors"
              >
                <BookmarkPlus className="h-3 w-3" />
                <span>{showSavePlan ? 'Cancel' : 'Save As Template'}</span>
              </button>
            </div>

            {/* Quick Plan Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleApplyPlan(plan.id)}
                  disabled={isSaving}
                  className={`flex flex-col text-left p-2.5 rounded border transition-all ${
                    selectedPlanId === plan.id
                      ? 'border-action bg-action/20 text-white'
                      : 'border-line/70 bg-surface/60 hover:bg-surface hover:border-line text-ink-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{plan.name}</span>
                  <span className="text-[10px] font-mono text-ink-500 mt-1 truncate">
                    {plan.units.join(', ')}
                  </span>
                </button>
              ))}
            </div>

            {/* Save Custom Plan Form */}
            {showSavePlan && (
              <div className="rounded border border-line/80 bg-surface/90 p-3 space-y-2 text-xs">
                <span className="font-semibold text-white">Save Current Units as Quick Plan:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Squad Bravo Rapid Water Pack"
                    className="flex-1 rounded border border-line bg-surface-2 px-2.5 py-1 text-xs text-white focus:border-action focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomPlan}
                    disabled={!newPlanName.trim() || unitsList.length === 0}
                    className="rounded bg-action hover:bg-action-hover px-3 py-1 font-bold text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* LEAD DISPATCHER ASSIGNMENT */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-4 space-y-2.5">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Lead Dispatcher / Assigned Officer
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={assignedToDraft}
                onChange={(e) => setAssignedToDraft(e.target.value)}
                placeholder="e.g. Officer-42 or Chief-Johnson"
                className="flex-1 rounded border border-line bg-surface-3/50 px-3 py-1.5 text-xs text-white font-mono focus:border-action focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveAssignedTo}
                disabled={isSaving}
                className="rounded border border-line bg-action px-3 py-1.5 text-xs font-bold text-white hover:bg-action-hover disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {/* Quick role suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-ink-500">Quick suggestions:</span>
              {['Commander-Alpha', 'Hazmat-Marshal', 'SAR-Lead', 'Station-Chief'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAssignedToDraft(role)}
                  className="rounded border border-line px-1.5 py-0.5 text-ink-500 hover:text-white hover:border-action transition-colors"
                >
                  {role}
                </button>
              ))}
            </div>
          </section>

          {/* DISPATCHED FIELD UNITS */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Dispatched Rescue Units ({unitsList.length})
              </h3>
              {hasAssignedUnits(unitsList) && (
                <span className="text-[11px] font-mono text-emerald-400">● Units Deployed</span>
              )}
            </div>

            {/* Active unit chips */}
            {unitsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unitsList.map((unit) => (
                  <span
                    key={unit}
                    className="inline-flex items-center gap-1.5 rounded-full border border-action/40 bg-action/20 px-2.5 py-1 text-xs font-semibold text-action"
                  >
                    <span>{unit}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(unit)}
                      disabled={isSaving}
                      aria-label={`Stand down ${unit}`}
                      className="text-action hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-500 italic">No rescue units dispatched yet.</p>
            )}

            {/* Add custom unit */}
            <div className="flex gap-2">
              <input
                type="text"
                value={unitDraft}
                onChange={(e) => setUnitDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUnit();
                  }
                }}
                placeholder="Add unit callsign (e.g. Boat-4, Medic-2)"
                className="flex-1 rounded border border-line bg-surface-3/50 px-3 py-1.5 text-xs text-white font-mono focus:border-action focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddUnit()}
                disabled={isSaving || !unitDraft.trim()}
                className="flex items-center gap-1 rounded border border-line bg-surface-3 px-3 py-1.5 text-xs font-bold text-white hover:bg-action disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                <span>Dispatch</span>
              </button>
            </div>

            {/* Quick squad chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
              <span className="text-ink-500">Quick squads:</span>
              {[
                'Boat Unit-1',
                'Swiftwater-Alpha',
                'Engine-3',
                'Ladder-1',
                'K9 Search-1',
                'Medic-1',
                'Drone Recon-1',
                'Ambulance-2',
              ].map((squad) => (
                <button
                  key={squad}
                  type="button"
                  onClick={() => handleAddUnit(squad)}
                  disabled={unitsList.includes(squad) || isSaving}
                  className="rounded border border-line/60 bg-surface px-1.5 py-0.5 text-ink-500 hover:text-action hover:border-action transition-colors disabled:opacity-40"
                >
                  +{squad}
                </button>
              ))}
            </div>
          </section>

          {/* SURVIVOR DISTRESS AUDIO */}
          <DistressAudioPlayer incident={incident} />

          {/* AI BEDROCK TRIAGE INTEL */}
          {incident.triage && (
            <div className="border border-line/60 rounded-lg overflow-hidden">
              <TriageCard triage={incident.triage} />
            </div>
          )}

          {/* DISPATCHED UNIT GPS TELEMETRY */}
          <UnitPositionPanel incident={incident} />

          {/* EMERGENCY DIRECTIVE BROADCAST */}
          <section className="rounded-lg border border-red-500/40 bg-red-950/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>Flash Tactical Directive Broadcast</span>
              </div>
            </div>
            <p className="text-xs text-ink-700">
              Transmit instant safety alerts directly to the survivor's screen or geofenced zone.
            </p>
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-md shadow-red-600/20"
            >
              <Send className="h-3.5 w-3.5" />
              <span>TRANSMIT SAFETY DIRECTIVE</span>
            </button>
          </section>

          {/* CASUALTIES & LIFE-CRITICAL REPORT */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-mono font-bold text-white uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-action" />
              <span>Casualties & Life-Critical Needs</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="rounded bg-surface/70 border border-line/60 p-2">
                <span className="text-ink-500">People At Risk:</span>
                <p className="text-base font-extrabold text-white mt-0.5">{casualties} Individuals</p>
              </div>
              <div className="rounded bg-surface/70 border border-line/60 p-2">
                <span className="text-ink-500">Urgent Needs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {urgentNeeds.length > 0 ? (
                    urgentNeeds.map((need) => (
                      <span
                        key={need}
                        className="rounded bg-action/20 border border-action/30 px-1.5 py-0.5 text-[10px] font-semibold text-action"
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
            <div className="rounded bg-surface/70 border border-line/60 p-2.5">
              <span className="text-ink-500 font-semibold">Survivor Distress Narrative:</span>
              <p className="text-ink-700 mt-1 leading-relaxed">{getDescription(incident)}</p>
            </div>
          </section>

          {/* REPORTER INFORMATION */}
          <section className="rounded-lg border border-line bg-surface-2/60 p-3.5 space-y-1 text-xs">
            <span className="font-mono font-bold text-white uppercase tracking-wider block">Reporter Information</span>
            {incident.reporter?.contactValue && incident.reporter.contactMethod !== 'none' ? (
              <p className="text-white font-medium">
                <span className="text-ink-500 capitalize">{incident.reporter.contactMethod}: </span>
                {incident.reporter.contactValue}
              </p>
            ) : (
              <p className="text-ink-500 italic">No reporter contact details provided.</p>
            )}
          </section>

          {/* AUTOMATED ALERT NOTIFICATION PIPELINE */}
          <NotificationStatus incident={incident} />

          {/* INCIDENT LIFECYCLE ACTION */}
          {action && (
            <section className="rounded-lg border border-line bg-surface-2/60 p-4 space-y-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Incident Lifecycle Action
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStatusTransition}
                  disabled={isSaving}
                  className="rounded bg-action hover:bg-action-hover text-white px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : `Advance Status: ${action.label}`}
                </button>
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Broadcast Modal Overlay if triggered */}
      {isBroadcastOpen && (
        <BroadcastModal
          incident={incident}
          onClose={() => setIsBroadcastOpen(false)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
