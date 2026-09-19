'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Radio,
  ArrowLeft,
  Volume2,
  ShieldAlert,
  Bot,
  Truck,
  Check,
  Zap,
  Battery,
  BatteryCharging,
  BatteryLow,
  Flashlight,
  Moon,
  Mic,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import {
  type IncidentResponse,
  type IncidentCategory,
  type IncidentStatus as IncidentStatusType,
  type Priority,
  type SOSSubmission,
} from '@/lib/validation';
import { fetchWithRetry } from '@/lib/api';
import { isLocalIncidentId } from '@/lib/offlineQueue';
import { useSurvivorStream } from '@/hooks/useSurvivorStream';
import { useBatteryOptimization } from '@/hooks/useBatteryOptimization';
import { useScreenBeacon } from '@/hooks/useScreenBeacon';
import { playAlertChime } from '@/lib/audio';
import { useLanguage } from '@/i18n/LanguageContext';

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
  critical: { bg: '#450a0a', color: '#fca5a5', border: '#ef4444', icon: '🚨', label: 'CRITICAL' },
  high: { bg: '#431407', color: '#fdba74', border: '#f97316', icon: '⚠️', label: 'HIGH' },
  medium: { bg: '#422006', color: '#fde047', border: '#eab308', icon: '⚡', label: 'MEDIUM' },
  low: { bg: '#052e16', color: '#86efac', border: '#22c55e', icon: 'ℹ️', label: 'LOW' },
  pending_triage: { bg: '#0f172a', color: '#94a3b8', border: '#334155', icon: '⏳', label: 'TRIAGE PENDING' },
};

export const IncidentStatus: React.FC<IncidentStatusProps> = ({
  incidentId,
  category,
  isLocal: propIsLocal,
  payload,
  onReset,
}) => {
  const { t, isIndic } = useLanguage();
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

  // Polling fallback loop
  useEffect(() => {
    if (isLocal || isLocalIncidentId(incidentId)) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    fetchIncidentDetails();

    pollTimerRef.current = setInterval(() => {
      fetchIncidentDetails();
    }, recommendedPollIntervalMs);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [incidentId, isLocal, fetchIncidentDetails, recommendedPollIntervalMs]);

  const assignedUnits: string[] =
    incidentData?.triage?.assignedUnits ||
    (incidentData as { assignedUnits?: string[] })?.assignedUnits ||
    [];

  const effectiveStatus: IncidentStatusType =
    assignedUnits.length > 0 && (status === 'new' || status === 'acknowledged')
      ? 'in_progress'
      : status;

  const currentStepIndex = STATUS_STEPS.indexOf(effectiveStatus);
  const safetyDirective = STATIC_SAFETY_DIRECTIVES[category] || STATIC_SAFETY_DIRECTIVES.other;

  const activeDirective =
    liveBroadcastDirective ||
    incidentData?.triage?.suggestedAction ||
    (incidentData as { details?: { immediateAction?: string } })?.details?.immediateAction ||
    null;

  const effectiveAudioBlob = incidentData?.audioBlob || payload?.audioBlob || null;

  const estimatedPayloadBytes = JSON.stringify({
    cat: category,
    desc: incidentData?.description || payload?.description,
    loc: incidentData?.location || payload?.location,
    p: incidentData?.peopleAffected || payload?.peopleAffected,
  }).length;

  const theme = {
    bg: oledMode ? '#000000' : 'transparent',
    cardBg: oledMode ? '#0a0a0a' : '#121826',
    cardBorder: oledMode ? '#333333' : '#1e293b',
    textColor: oledMode ? '#ffffff' : '#f8fafc',
    subTextColor: oledMode ? '#a3a3a3' : '#94a3b8',
  };

  const getStepLabel = (step: IncidentStatusType) => {
    switch (step) {
      case 'new':
        return t.status.stepReported;
      case 'acknowledged':
        return t.status.stepAcknowledged;
      case 'in_progress':
        return t.status.stepInProgress;
      case 'resolved':
      case 'closed':
        return t.status.stepResolved;
      default:
        return step;
    }
  };

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
        backgroundColor: theme.bg,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* FULL-SCREEN NIGHT RESCUE SCREEN STROBE OVERLAY */}
      {isBeaconActive && (
        <div
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
              Flashing SOS Strobe & Alpine Whistle Bursts for Search Units
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
              boxShadow: '0 0 25px rgba(0,0,0,0.9)',
            }}
          >
            STOP BEACON
          </button>
        </div>
      )}

      {/* Header with return button & Survival Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={onReset}
          className={isIndic ? 'indic-text' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: oledMode ? '#171717' : '#1e293b',
            border: `1px solid ${oledMode ? '#404040' : '#334155'}`,
            color: '#cbd5e1',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>{t.status.submitAnother}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Night Beacon Trigger */}
          <button
            onClick={toggleBeacon}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid #f59e0b',
              backgroundColor: '#78350f',
              color: '#fef3c7',
            }}
            title="Flash high-visibility screen strobe and whistle pulses for search helicopters"
          >
            <Flashlight size={14} color="#fde68a" />
            NIGHT BEACON
          </button>

          {/* Battery Status Indicator */}
          {batteryLevel !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: isLowBattery ? '#ef4444' : '#10b981',
                backgroundColor: oledMode ? '#171717' : '#1e293b',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${isLowBattery ? '#b91c1c' : '#334155'}`,
                fontWeight: 600,
              }}
              title={`Device Battery: ${Math.round(batteryLevel * 100)}%`}
            >
              {isCharging ? (
                <BatteryCharging size={14} />
              ) : isLowBattery ? (
                <BatteryLow size={14} />
              ) : (
                <Battery size={14} />
              )}
              <span>{Math.round(batteryLevel * 100)}%</span>
            </div>
          )}

          {/* OLED Survival Mode Toggle */}
          <button
            onClick={toggleOledMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: oledMode ? '1px solid #10b981' : '1px solid #475569',
              backgroundColor: oledMode ? '#042f2e' : '#1e293b',
              color: oledMode ? '#34d399' : '#94a3b8',
            }}
            title="Toggle AMOLED pure black survival mode for maximum battery life"
          >
            {oledMode ? <Zap size={14} color="#34d399" /> : <Moon size={14} />}
            {oledMode ? 'SURVIVAL ON' : 'SURVIVAL'}
          </button>
        </div>
      </div>

      {/* Incident Reference & Telemetry Card */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `2px solid ${isLocal ? '#f59e0b' : '#3b82f6'}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }} className={isIndic ? 'indic-text' : ''}>
              {t.status.incidentId}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {incidentId}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              className={isIndic ? 'indic-text' : ''}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: isLocal ? '#78350f' : '#1e3a8a',
                color: isLocal ? '#fde68a' : '#bfdbfe',
                border: `1px solid ${isLocal ? '#f59e0b' : '#3b82f6'}`,
              }}
            >
              {isLocal ? t.connectivity.offlineActive : t.status.sosTransmitted}
            </span>

            {/* AI Triage Priority Badge */}
            {!isLocal && incidentData?.priority && PRIORITY_BADGE_STYLES[incidentData.priority] && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  backgroundColor: PRIORITY_BADGE_STYLES[incidentData.priority].bg,
                  color: PRIORITY_BADGE_STYLES[incidentData.priority].color,
                  border: `1px solid ${PRIORITY_BADGE_STYLES[incidentData.priority].border}`,
                }}
              >
                {PRIORITY_BADGE_STYLES[incidentData.priority].icon}{' '}
                {PRIORITY_BADGE_STYLES[incidentData.priority].label}
              </span>
            )}
          </div>
        </div>

        {/* PRD LoRa / Satellite Packet Compression Diagnostics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: oledMode ? '#111111' : '#0f172a',
            border: `1px solid ${theme.cardBorder}`,
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} color="#60a5fa" />
            <span>
              Uplink Channel:{' '}
              <strong style={{ color: isLocal ? '#fbbf24' : '#6ee7b7' }}>
                {isLocal ? 'Offline Mesh Queue' : 'Captive Wi-Fi / Sat Relay'}
              </strong>
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
            Payload Size: <strong>~{estimatedPayloadBytes} B</strong> (LoRa / Sat Compliant)
          </div>
        </div>

        {isLocal && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: oledMode ? '#201202' : '#451a03',
              border: '1px solid #b45309',
              borderRadius: '8px',
              padding: '12px',
              color: '#fef3c7',
              fontSize: '14px',
            }}
          >
            <WifiOff size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <strong className={isIndic ? 'indic-text' : ''}>{t.connectivity.offlineActive}</strong>
              <div style={{ fontSize: '13px', color: '#fde68a', marginTop: '2px' }} className={isIndic ? 'indic-text' : ''}>
                {t.connectivity.offlineSubtitle}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ATTACHED VOICE DISTRESS AUDIO DISPATCH CARD */}
      {effectiveAudioBlob && (
        <div
          role="region"
          aria-label="Attached Voice Dispatch"
          style={{
            backgroundColor: oledMode ? '#0a0a0a' : '#1e1b4b',
            border: '2px solid #6366f1',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c7d2fe', fontWeight: 700, fontSize: '15px' }} className={isIndic ? 'indic-text' : ''}>
              <Mic size={18} color="#818cf8" />
              {t.form.audioRecorded}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH PROGRESS / STATUS PIPELINE */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: theme.textColor }} className={isIndic ? 'indic-text' : ''}>
            {t.status.sosTransmitted}
          </h2>
          {isPolling && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#60a5fa' }}>
              <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {(['new', 'acknowledged', 'in_progress', 'resolved'] as IncidentStatusType[]).map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#065f46' : oledMode ? '#171717' : '#1e293b',
                    border: `2px solid ${isCurrent ? '#34d399' : isCompleted ? '#10b981' : oledMode ? '#404040' : '#334155'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={18} color="#34d399" /> : <Clock size={16} color="#64748b" />}
                </div>
                <span
                  className={isIndic ? 'indic-text' : ''}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: isIndic ? 'none' : 'uppercase',
                    color: isCurrent ? '#34d399' : isCompleted ? '#e2e8f0' : '#64748b',
                    lineHeight: 1.2,
                  }}
                >
                  {getStepLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO-WAY FLASH EVACUATION ALERT & DIRECTIVE */}
      <div
        role="region"
        aria-label="Directives"
        style={{
          backgroundColor: oledMode ? '#1e0505' : '#450a0a',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: oledMode ? 'none' : '0 0 25px rgba(239, 68, 68, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} color="#f87171" />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fca5a5', margin: 0 }} className={isIndic ? 'indic-text' : ''}>
                {t.status.suggestedAction}
              </h3>
            </div>
          </div>

          <button
            onClick={playAlertChime}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#7f1d1d',
              border: '1px solid #ef4444',
              color: '#fee2e2',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            title="Play alert tone"
          >
            <Volume2 size={14} />
            Audio Siren
          </button>
        </div>

        <div
          className={isIndic ? 'indic-text' : ''}
          style={{
            backgroundColor: oledMode ? '#000000' : '#1c0505',
            border: '1px solid #7f1d1d',
            borderRadius: '8px',
            padding: '14px',
            color: '#fef2f2',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1.6,
          }}
        >
          {activeDirective || t.status.defaultDirective}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setIsDirectiveAcknowledged(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isDirectiveAcknowledged ? '#065f46' : '#991b1b',
              border: `1px solid ${isDirectiveAcknowledged ? '#10b981' : '#f87171'}`,
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Check size={16} />
            {isDirectiveAcknowledged ? 'DIRECTIVE ACKNOWLEDGED' : 'CONFIRM RECEIPT'}
          </button>
        </div>
      </div>

      {/* Immediate Safety Directives */}
      <div
        role="region"
        aria-label="Immediate Survival Protocol"
        style={{
          backgroundColor: theme.cardBg,
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldAlert size={24} color="#ef4444" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fca5a5' }} className={isIndic ? 'indic-text' : ''}>
            {safetyDirective.title}
          </h3>
        </div>
        <ul style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {safetyDirective.bullets.map((bullet, idx) => (
            <li key={idx} style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 500 }} className={isIndic ? 'indic-text' : ''}>
              {bullet}
            </li>
          ))}
        </ul>

        {/* Assigned units section */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.cardBorder}` }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }} className={isIndic ? 'indic-text' : ''}>
            {t.status.assignedUnits}
          </div>
          {assignedUnits.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {assignedUnits.map((u, i) => (
                <span
                  key={i}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#a7f3d0',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {u}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }} className={isIndic ? 'indic-text' : ''}>
              {t.status.noUnitsYet}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
