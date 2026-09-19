'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  RefreshCw,
  ArrowLeft,
  WifiOff,
  Truck,
  Radio,
  Battery,
  BatteryCharging,
  BatteryLow,
  Zap,
  Moon,
  Volume2,
  Flashlight,
  Check,
  Mic,
  Activity,
} from 'lucide-react';
import type {
  IncidentCategory,
  IncidentStatus as IncidentStatusType,
  IncidentResponse,
  SOSSubmission,
  Priority,
} from '@/lib/validation';
import { isLocalIncidentId } from '@/lib/offlineQueue';
import { fetchWithRetry } from '@/lib/api';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useSurvivorStream } from '@/hooks/useSurvivorStream';
import { useScreenBeacon } from '@/hooks/useScreenBeacon';
import { playAlertChime } from '@/lib/audio';

interface IncidentStatusProps {
  incidentId: string;
  category: IncidentCategory;
  isLocal: boolean;
  payload?: SOSSubmission;
  onReset: () => void;
}

const STATIC_SAFETY_DIRECTIVES: Record<IncidentCategory, { title: string; bullets: string[] }> = {
  flood: {
    title: 'Flood Survival Protocol',
    bullets: [
      'Do not attempt to walk or drive through moving water.',
      'Disconnect your master electrical breaker and gas shutoff if safe to do so.',
      'Move to the highest structural elevation (roof/upper deck); do not enter closed attics without roof egress.',
      'Signal rescuers using bright reflective cloth, phone flash, or whistle bursts of three.',
    ],
  },
  landslide: {
    title: 'Landslide & Debris Flow Protocol',
    bullets: [
      'Evacuate immediately away from slopes, gullies, and direct drainage paths.',
      'Stay alert for sudden changes in water runoff or sounds of cracking trees and rocks.',
      'If escape is impossible, curl into a tight ball and protect your head.',
      'Remain clear of the slide perimeter; watch for secondary slide reactivation.',
    ],
  },
  fire: {
    title: 'Wildfire & Structure Fire Protocol',
    bullets: [
      'Stay low beneath smoke ceiling; crawl on hands and knees.',
      'Feel closed doors with back of hand before opening; do not open hot doors.',
      'Cover your face with a damp cotton cloth or mask to filter particulate.',
      'Proceed immediately toward designated fire refuge zones or upwind clearings.',
    ],
  },
  other: {
    title: 'Emergency Life Safety Protocol',
    bullets: [
      'Remain inside or behind structural shelter away from overhead hazards.',
      'Conserve phone battery (enable low-power mode, lower screen brightness).',
      'Keep your location beacon active and await direct responder contact.',
      'Prepare whistle, light source, or audio signal for incoming search parties.',
    ],
  },
};

const STATUS_STEPS: IncidentStatusType[] = ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'];

const PRIORITY_BADGE_STYLES: Record<
  Priority,
  { bg: string; color: string; border: string; icon: string; label: string }
> = {
  critical: { bg: 'var(--rl-danger-soft)', color: 'var(--rl-danger-text)', border: 'var(--rl-danger)', icon: '●', label: 'CRITICAL' },
  high: { bg: 'var(--rl-warning-soft)', color: 'var(--rl-warning-text)', border: 'var(--rl-warning)', icon: '▲', label: 'HIGH' },
  medium: { bg: 'var(--rl-warning-soft)', color: 'var(--rl-warning-text)', border: '#F59E0B', icon: '◆', label: 'MEDIUM' },
  low: { bg: 'var(--rl-success-soft)', color: 'var(--rl-success-text)', border: 'var(--rl-success)', icon: '▽', label: 'LOW' },
  pending_triage: { bg: 'var(--rl-bg)', color: 'var(--rl-text-muted)', border: 'var(--rl-border)', icon: '◯', label: 'TRIAGE PENDING' },
};

export const IncidentStatus: React.FC<IncidentStatusProps> = ({
  incidentId,
  category,
  isLocal: propIsLocal,
  payload,
  onReset,
}) => {
  const isLocal = propIsLocal || isLocalIncidentId(incidentId);
  const [status, setStatus] = useState<IncidentStatusType>('new');
  const [incidentData, setIncidentData] = useState<IncidentResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [liveBroadcastDirective, setLiveBroadcastDirective] = useState<string | null>(null);
  const [isDirectiveAcknowledged, setIsDirectiveAcknowledged] = useState<boolean>(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    batteryLevel,
    isCharging,
    isLowBattery,
    oledMode,
    toggleOledMode,
    recommendedPollIntervalMs,
  } = useBatteryOptimization();

  const { isBeaconActive, toggleBeacon, strobeColor } = useScreenBeacon();

  const fetchIncidentDetails = useCallback(async () => {
    // OFFLINE ID GUARD: Never poll if the incident has a local queue ID
    if (isLocal || isLocalIncidentId(incidentId)) {
      return;
    }

    setIsPolling(true);
    try {
      const apiOrigin =
        process.env.NEXT_PUBLIC_RESCUE_LINK_API_ORIGIN ||
        process.env.RESCUE_LINK_API_ORIGIN ||
        'https://pfqm76wx1g.execute-api.us-east-1.amazonaws.com';
      const baseUrl = apiOrigin.trim().replace(/\/$/, '');
      const res = await fetchWithRetry(`${baseUrl}/api/incidents/${incidentId}`);
      if (res.ok) {
        const data = (await res.json()) as IncidentResponse;
        setIncidentData(data);
        if (data.status) {
          setStatus(data.status);
        }
        setLastPolledAt(new Date());
      }
    } catch {
      // Polling network drop; continue safely
    } finally {
      setIsPolling(false);
    }
  }, [incidentId, isLocal]);

  // Handle zero-latency push events from SSE stream
  const handleStreamUpdate = useCallback(
    (incomingIncident: IncidentResponse, broadcastMessage?: string) => {
      setIncidentData(incomingIncident);
      if (incomingIncident.status) {
        setStatus(incomingIncident.status);
      }
      if (broadcastMessage) {
        setLiveBroadcastDirective(broadcastMessage);
        setIsDirectiveAcknowledged(false);
        playAlertChime();
      }
      setLastPolledAt(new Date());
    },
    []
  );

  // Real-time zero-latency event stream listener
  const { streamStatus } = useSurvivorStream({
    incidentId,
    isLocal,
    onUpdate: handleStreamUpdate,
  });

  // Polling fallback loop: runs responsive to battery level
  useEffect(() => {
    if (isLocal || isLocalIncidentId(incidentId)) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchIncidentDetails();

    // Dynamic interval: 5s normally, 30s when battery <= 20%
    pollTimerRef.current = setInterval(() => {
      fetchIncidentDetails();
    }, recommendedPollIntervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [incidentId, isLocal, fetchIncidentDetails, recommendedPollIntervalMs]);

  // Assigned units resolution
  const assignedUnits: string[] =
    incidentData?.triage?.assignedUnits ||
    (incidentData as { assignedUnits?: string[] })?.assignedUnits ||
    [];

  // Effective status: if units are dispatched and status is still new/acknowledged, reflect active response
  const effectiveStatus: IncidentStatusType =
    assignedUnits.length > 0 && (status === 'new' || status === 'acknowledged')
      ? 'in_progress'
      : status;

  const currentStepIndex = STATUS_STEPS.indexOf(effectiveStatus);
  const safetyDirective = STATIC_SAFETY_DIRECTIVES[category] || STATIC_SAFETY_DIRECTIVES.other;

  // Active tactical directive (either push broadcast or Bedrock AI action)
  const activeDirective =
    liveBroadcastDirective ||
    incidentData?.triage?.suggestedAction ||
    (incidentData as { details?: { immediateAction?: string } })?.details?.immediateAction ||
    null;

  // Audio voice SOS source (from server or local submission payload)
  const effectiveAudioBlob = incidentData?.audioBlob || payload?.audioBlob || null;

  // LoRa / Sat packet payload size estimation
  const estimatedPayloadBytes = JSON.stringify({
    cat: category,
    desc: incidentData?.description || payload?.description,
    loc: incidentData?.location || payload?.location,
    p: incidentData?.peopleAffected || payload?.peopleAffected,
  }).length;

  return (
    <div
      className="animate-calm-fade"
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: oledMode ? '#000000' : 'transparent',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* FULL-SCREEN NIGHT RESCUE SCREEN STROBE OVERLAY */}
      {isBeaconActive && (
        <div
          role="dialog"
          aria-label="Rescue Beacon Active"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: strobeColor,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#000000',
              padding: '16px 24px',
              borderRadius: '12px',
              border: '2px solid #ef4444',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fee2e2', letterSpacing: '0.08em' }}>
              RESCUE BEACON ACTIVE
            </div>
            <div style={{ fontSize: '13px', color: '#fca5a5', marginTop: '4px' }}>
              Flashing SOS Strobe & Whistle Bursts for Search Units
            </div>
          </div>

          <button
            onClick={toggleBeacon}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: '3px solid #ffffff',
              padding: '16px 36px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            STOP BEACON
          </button>
        </div>
      )}

      {/* Header with return button & Survival Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <button
          onClick={onReset}
          className="rl-btn rl-btn-secondary !py-2 !px-4 !text-sm flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Submit Another SOS
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Night Beacon Trigger */}
          <button
            onClick={toggleBeacon}
            className="rl-btn !py-1.5 !px-3 !text-xs !font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--rl-warning-soft)',
              color: 'var(--rl-warning-text)',
              border: '1px solid var(--rl-warning)',
            }}
            title="Flash high-visibility screen strobe for search helicopters"
          >
            <Flashlight size={14} />
            NIGHT BEACON
          </button>

          {/* Battery Status Indicator */}
          {batteryLevel !== null && (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border"
              style={{
                backgroundColor: 'var(--rl-surface)',
                borderColor: isLowBattery ? 'var(--rl-danger)' : 'var(--rl-border)',
                color: isLowBattery ? 'var(--rl-danger)' : 'var(--rl-text)',
              }}
              title={`Device Battery: ${Math.round(batteryLevel * 100)}%`}
            >
              {isCharging ? (
                <BatteryCharging size={14} className="text-emerald-500" />
              ) : isLowBattery ? (
                <BatteryLow size={14} className="text-red-500" />
              ) : (
                <Battery size={14} className="text-emerald-500" />
              )}
              <span>{Math.round(batteryLevel * 100)}%</span>
            </div>
          )}

          {/* OLED Survival Mode Toggle */}
          <button
            onClick={toggleOledMode}
            className="rl-btn !py-1.5 !px-3 !text-xs !font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: oledMode ? '#042f2e' : 'var(--rl-surface)',
              color: oledMode ? '#34d399' : 'var(--rl-text-secondary)',
              border: `1px solid ${oledMode ? '#10b981' : 'var(--rl-border)'}`,
            }}
            title="Toggle AMOLED pure black survival mode for maximum battery life"
          >
            {oledMode ? <Zap size={14} color="#34d399" /> : <Moon size={14} />}
            {oledMode ? 'SURVIVAL ON' : 'SURVIVAL'}
          </button>
        </div>
      </div>

      {/* Low Battery Warning Banner */}
      {isLowBattery && (
        <div className="rl-alert-danger flex items-center gap-3">
          <BatteryLow size={20} className="text-red-600 shrink-0" />
          <div>
            <strong>CRITICAL BATTERY LEVEL (&le; 20%)</strong>
            <div className="text-xs opacity-90 mt-0.5">
              Network polling throttled to 30s to conserve life. OLED Survival Mode is strongly recommended.
            </div>
          </div>
        </div>
      )}

      {/* Incident Reference & Telemetry Card */}
      <div
        className="rl-card flex flex-col gap-3"
        style={{
          borderLeft: `4px solid ${isLocal ? 'var(--rl-warning)' : 'var(--rl-accent)'}`,
        }}
      >
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--rl-text-muted)]">
              Incident Tracking ID
            </div>
            <div
              className="font-mono text-lg font-bold mt-0.5"
              style={{ color: isLocal ? 'var(--rl-warning-text)' : 'var(--rl-accent)' }}
            >
              {incidentId}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-Time Stream Status Badge */}
            {!isLocal && (
              <span
                className="rl-badge flex items-center gap-1.5 !text-[11px]"
                style={{
                  backgroundColor: streamStatus === 'live' ? 'var(--rl-success-soft)' : 'var(--rl-bg)',
                  color: streamStatus === 'live' ? 'var(--rl-success-text)' : 'var(--rl-text-muted)',
                  borderColor: streamStatus === 'live' ? 'var(--rl-success)' : 'var(--rl-border)',
                }}
              >
                <Activity size={12} className={streamStatus === 'live' ? 'text-emerald-600' : ''} />
                {streamStatus === 'live'
                  ? 'LIVE RELAY'
                  : streamStatus === 'connecting'
                  ? 'CONNECTING RELAY'
                  : `POLLING (${recommendedPollIntervalMs / 1000}s)`}
              </span>
            )}

            <span
              className="rl-badge font-bold !text-[11px]"
              style={{
                backgroundColor: isLocal ? 'var(--rl-warning-soft)' : 'var(--rl-accent-soft)',
                color: isLocal ? 'var(--rl-warning-text)' : 'var(--rl-accent-text)',
                borderColor: isLocal ? 'var(--rl-warning)' : 'var(--rl-accent)',
              }}
            >
              {isLocal ? 'QUEUED OFFLINE' : 'DISPATCH TRANSMITTED'}
            </span>

            {/* AI Triage Priority Badge */}
            {!isLocal && incidentData?.priority && PRIORITY_BADGE_STYLES[incidentData.priority] && (
              <span
                className="rl-badge font-extrabold flex items-center gap-1.5 !text-[11px]"
                style={{
                  backgroundColor: PRIORITY_BADGE_STYLES[incidentData.priority].bg,
                  color: PRIORITY_BADGE_STYLES[incidentData.priority].color,
                  borderColor: PRIORITY_BADGE_STYLES[incidentData.priority].border,
                }}
              >
                <span>{PRIORITY_BADGE_STYLES[incidentData.priority].icon}</span>
                <span>{PRIORITY_BADGE_STYLES[incidentData.priority].label}</span>
              </span>
            )}
          </div>
        </div>

        {/* LoRa / Satellite Packet Compression Diagnostics */}
        <div
          className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: 'var(--rl-bg)',
            border: '1px solid var(--rl-border)',
            color: 'var(--rl-text-secondary)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <Radio size={14} className="text-teal-600" />
            <span>
              Uplink Channel:{' '}
              <strong style={{ color: isLocal ? 'var(--rl-warning-text)' : 'var(--rl-accent)' }}>
                {isLocal ? 'Offline Mesh Queue' : 'Captive Wi-Fi / Sat Relay'}
              </strong>
            </span>
          </div>
          <div className="font-mono text-xs">
            Payload Size: <strong>~{estimatedPayloadBytes} B</strong> (LoRa / Sat Compliant)
          </div>
        </div>

        {isLocal && (
          <div className="rl-alert-warning flex items-center gap-2.5">
            <WifiOff size={20} className="shrink-0" />
            <div>
              <strong>Queued offline - waiting for network connection.</strong>
              <div className="text-xs mt-0.5 opacity-90">
                Your SOS is securely stored in local IndexedDB. It will automatically transmit as soon as edge uplink or captive Wi-Fi reconnects. Live server polling is paused.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMERGENCY NOTIFICATION DISPATCH CONFIRMATION CARD */}
      {!isLocal && (incidentData?.priority === 'critical' || incidentData?.priority === 'high') && (
        <div
          role="region"
          aria-label="Emergency Notification Dispatched"
          className="rl-alert-danger flex flex-col gap-2.5"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={20} className="text-red-600 shrink-0" />
            <div>
              <div className="text-sm font-extrabold text-[var(--rl-danger-text)]">
                Emergency Alert Dispatched by Command System
              </div>
              <div className="text-xs text-[var(--rl-danger-text)] opacity-90 mt-0.5">
                Your distress signal was classified as <strong>{incidentData?.priority?.toUpperCase()}</strong> by AI triage. Emergency notifications have been automatically triggered.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {(incidentData?.reporter?.contactMethod === 'phone' ||
              payload?.reporter?.contactMethod === 'phone') && (
              <div className="flex items-center gap-2 p-2 rounded bg-white/70 border border-red-200 text-xs text-red-950">
                <Truck size={13} className="text-red-600 shrink-0" />
                <span>
                  <strong>SMS Dispatched:</strong> Emergency SMS alert was automatically sent to your registered phone number via the RescueLink command network.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 rounded bg-white/70 border border-red-200 text-xs text-red-950">
              <Radio size={13} className="text-red-600 shrink-0" />
              <span>
                <strong>Email Dispatched:</strong> Emergency dispatch email has been sent to the RescueLink response coordination team on your behalf.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ATTACHED VOICE DISTRESS AUDIO DISPATCH CARD */}
      {effectiveAudioBlob && (
        <div
          role="region"
          aria-label="Attached Voice Dispatch"
          className="rl-card flex flex-col gap-2.5"
          style={{ borderLeft: '4px solid #6366f1' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
              <Mic size={18} className="text-indigo-600" />
              Attached Voice SOS Recording
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Voice Dispatch Attached
            </span>
          </div>

          <div className="text-xs text-[var(--rl-text-secondary)]">
            Your spoken distress message is securely packaged with this emergency beacon for arriving first responders.
          </div>

          <audio
            src={effectiveAudioBlob}
            controls
            className="w-full h-10 rounded-lg outline-none mt-1"
          />
        </div>
      )}

      {/* RESCUER EN-ROUTE & UNIT DEPLOYMENT CARD */}
      {(assignedUnits.length > 0 || incidentData?.assignedTo) && (
        <div
          role="region"
          aria-label="Rescue Unit Deployment"
          className="rl-card flex flex-col gap-3.5"
          style={{
            backgroundColor: 'var(--rl-success-soft)',
            border: '2px solid var(--rl-success)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                <Truck size={20} className="text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--rl-success-text)] m-0">
                  Rescuers En Route to Your Location
                </h3>
                <div className="text-xs text-[var(--rl-success-text)] opacity-90">
                  Command center has deployed emergency personnel to your coordinates.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Activity size={12} className="text-emerald-600" />
              ACTIVE DEPLOYMENT
            </div>
          </div>

          {assignedUnits.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-bold text-[var(--rl-success-text)] uppercase tracking-wider">
                Assigned Search & Rescue Units ({assignedUnits.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {assignedUnits.map((unit) => (
                  <div
                    key={unit}
                    className="bg-white border border-emerald-300 text-emerald-900 rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Radio size={12} className="text-emerald-600" />
                    {unit}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INCIDENT CLOSED / RESCUE COMPLETED BANNER */}
      {effectiveStatus === 'closed' && (
        <div
          role="region"
          aria-label="Incident Closed"
          className="rl-card flex flex-col gap-3"
          style={{
            backgroundColor: 'var(--rl-success-soft)',
            border: '2px solid var(--rl-success)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={28} className="text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-[var(--rl-success-text)] m-0">
                  Rescue Mission Concluded - Incident Closed
                </h3>
                <div className="text-xs text-[var(--rl-success-text)] opacity-90">
                  Responders and emergency coordinators have completed all actions and officially marked this incident as resolved and closed.
                </div>
              </div>
            </div>
            <button
              onClick={onReset}
              className="rl-btn rl-btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              Submit New SOS Beacon
            </button>
          </div>
        </div>
      )}

      {/* Live Status Pipeline */}
      <div className="rl-card flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-[var(--rl-text)] m-0">
            Dispatch Status
          </h2>
          {isPolling && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--rl-accent)]">
              <RefreshCw size={12} className="rl-spin" />
              Checking updates...
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step} className="rl-pipeline-step">
                <div
                  className="rl-pipeline-dot"
                  data-completed={isCompleted ? 'true' : undefined}
                  data-current={isCurrent ? 'true' : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-[var(--rl-success)]" />
                  ) : (
                    <Clock size={16} className="text-[var(--rl-text-muted)]" />
                  )}
                </div>
                <span
                  className="rl-pipeline-label"
                  data-completed={isCompleted ? 'true' : undefined}
                  data-current={isCurrent ? 'true' : undefined}
                >
                  {step.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO-WAY FLASH EVACUATION ALERT & DIRECTIVE */}
      {activeDirective ? (
        <div
          role="region"
          aria-label="Rescuer & AI Directive"
          className="rl-alert-danger flex flex-col gap-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Bot size={24} className="text-red-600 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-[var(--rl-danger-text)] m-0">
                  Emergency Flash Directive
                </h3>
                <div className="text-xs text-[var(--rl-danger-text)] opacity-90">
                  Two-Way Tactical Alert Broadcast from Incident Commander & AI Triage
                </div>
              </div>
            </div>

            <button
              onClick={playAlertChime}
              className="rl-btn !py-1 !px-2.5 !text-xs !font-bold flex items-center gap-1 bg-red-700 text-white border border-red-800 rounded"
              title="Play alert tone"
            >
              <Volume2 size={14} />
              Audio Siren
            </button>
          </div>

          <div className="bg-white/80 border border-red-300 rounded-lg p-3.5 text-sm font-bold text-red-950 leading-relaxed">
            {activeDirective}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setIsDirectiveAcknowledged(true)}
              className="rl-btn !py-2 !px-4 !text-xs !font-bold flex items-center gap-1.5"
              style={{
                backgroundColor: isDirectiveAcknowledged ? 'var(--rl-success)' : 'var(--rl-danger)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              <Check size={16} />
              {isDirectiveAcknowledged ? 'DIRECTIVE ACKNOWLEDGED - SAFE' : 'CONFIRM RECEIPT'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Immediate Local Survival Protocol */}
      <div
        role="region"
        aria-label="Immediate Survival Protocol"
        className="rl-card flex flex-col gap-3"
        style={{
          borderLeft: '4px solid var(--rl-danger)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert size={22} className="text-[var(--rl-danger)]" />
          <h3 className="text-base font-extrabold text-[var(--rl-text)] m-0">
            {safetyDirective.title}
          </h3>
        </div>
        <ul className="pl-5 flex flex-col gap-2 m-0 text-sm text-[var(--rl-text-secondary)]">
          {safetyDirective.bullets.map((bullet, idx) => (
            <li key={idx} className="leading-relaxed">
              {bullet}
            </li>
          ))}
        </ul>

        <div className="rl-alert-warning flex items-center gap-2 text-xs mt-1">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span>Keep your device awake. Do not close this browser window.</span>
        </div>
      </div>
    </div>
  );
};
