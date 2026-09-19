'use client';

import React, { useState } from 'react';
import {
  Flame,
  Waves,
  Mountain,
  AlertOctagon,
  MapPin,
  Users,
  Plus,
  Minus,
  Check,
  Send,
  Loader2,
  Phone,
  Mail,
  HelpCircle,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import {
  SOSSubmissionSchema,
  type SOSSubmission,
  type IncidentCategory,
  type UrgentNeed,
  type ContactMethod,
} from '@/lib/validation';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceSOSPlayer } from '@/components/VoiceSOSPlayer';
import { enqueueIncident } from '@/lib/offlineQueue';
import { fetchWithRetry } from '@/lib/api';

interface SOSFormProps {
  isOnline: boolean;
  onSubmitted: (submission: {
    id: string;
    category: IncidentCategory;
    payload: SOSSubmission;
    isLocal: boolean;
  }) => void;
  onQueueUpdated?: () => void;
}

const CATEGORIES: Array<{
  id: IncidentCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  accentColor: string;
}> = [
  { id: 'flood', label: 'Flood / Water', icon: Waves, accentColor: '#0891B2' },
  { id: 'fire', label: 'Fire / Wildfire', icon: Flame, accentColor: '#DC2626' },
  { id: 'landslide', label: 'Landslide / Debris', icon: Mountain, accentColor: '#D97706' },
  { id: 'other', label: 'Other Threat', icon: AlertOctagon, accentColor: '#7C3AED' },
];

const URGENT_NEEDS: Array<{ id: UrgentNeed; label: string }> = [
  { id: 'medical', label: 'Medical Aid' },
  { id: 'boat', label: 'Rescue Boat' },
  { id: 'food', label: 'Food Ration' },
  { id: 'clean_water', label: 'Clean Water' },
  { id: 'infant_care', label: 'Infant Care' },
  { id: 'sanitation', label: 'Sanitation / WASH' },
  { id: 'shelter', label: 'Emergency Shelter' },
  { id: 'psychosocial_support', label: 'Psychosocial Support' },
  { id: 'evacuation', label: 'Immediate Evacuation' },
];

export const SOSForm: React.FC<SOSFormProps> = ({
  isOnline,
  onSubmitted,
  onQueueUpdated,
}) => {
  const [category, setCategory] = useState<IncidentCategory>('flood');
  const [description, setDescription] = useState<string>('');
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [urgentNeeds, setUrgentNeeds] = useState<UrgentNeed[]>([]);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('none');
  const [contactValue, setContactValue] = useState<string>('');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [childrenUnder5, setChildrenUnder5] = useState<number>(0);
  const [elderly, setElderly] = useState<number>(0);
  const [pregnantOrLactating, setPregnantOrLactating] = useState<number>(0);
  const [disabled, setDisabled] = useState<number>(0);
  const [landmark, setLandmark] = useState<string>('');
  const [shelterName, setShelterName] = useState<string>('');
  const [roadAccessBlocked, setRoadAccessBlocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const {
    location,
    loading: geoLoading,
    error: geoError,
    captureLocation,
    setManualLocation,
  } = useGeolocation();

  const toggleUrgentNeed = (need: UrgentNeed) => {
    setUrgentNeeds((prev) =>
      prev.includes(need) ? prev.filter((item) => item !== need) : [...prev, need]
    );
  };

  const handleManualCoordinateChange = (latVal: string, lngVal: string) => {
    setManualLat(latVal);
    setManualLng(lngVal);
    const parsedLat = parseFloat(latVal);
    const parsedLng = parseFloat(lngVal);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setManualLocation({
        lat: parsedLat,
        lng: parsedLng,
        label: 'Manual Coordinate Entry',
      });
    }
  };

  const voice = useVoiceRecorder(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    let currentLocation = location;
    if (!currentLocation) {
      const parsedLat = parseFloat(manualLat);
      const parsedLng = parseFloat(manualLng);
      if (
        Number.isFinite(parsedLat) &&
        Number.isFinite(parsedLng) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLng >= -180 &&
        parsedLng <= 180
      ) {
        currentLocation = {
          lat: parsedLat,
          lng: parsedLng,
          label: 'Manual Coordinate Entry',
        };
      } else {
        setFormErrors([
          'Location required: Please acquire your GPS position or enter valid latitude (-90 to 90) and longitude (-180 to 180) coordinates.',
        ]);
        return;
      }
    }

    const finalDescription = description.trim() || (voice.audioBase64 ? 'Voice SOS Audio Message Recorded' : '');

    const payloadCandidate = {
      category,
      description: finalDescription,
      location: currentLocation,
      peopleAffected: Math.max(1, Number(peopleAffected) || 1),
      urgentNeeds,
      audioBlob: voice.audioBase64 || undefined,
      reporter: {
        contactMethod,
        contactValue: contactValue.trim() || undefined,
      },
      householdComposition: {
        adults: Math.max(0, (Number(peopleAffected) || 1) - childrenUnder5 - elderly),
        childrenUnder5,
        elderly,
        pregnantOrLactating,
        disabled,
      },
      locationContext: {
        landmark: landmark.trim() || undefined,
        shelterName: shelterName.trim() || undefined,
        roadAccessBlocked,
      },
    };

    const validationResult = SOSSubmissionSchema.safeParse(payloadCandidate);

    if (!validationResult.success) {
      const messages = validationResult.error.errors.map(
        (err) => `${err.path.join('.') || 'Form'}: ${err.message}`
      );
      setFormErrors(messages);
      return;
    }

    const validPayload = validationResult.data;
    setIsSubmitting(true);

    // If offline, or if online POST fails, enqueue directly into IndexedDB
    if (!isOnline) {
      try {
        const queued = await enqueueIncident(validPayload);
        if (onQueueUpdated) onQueueUpdated();
        onSubmitted({
          id: queued.localId,
          category,
          payload: validPayload,
          isLocal: true,
        });
      } catch {
        setFormErrors(['Failed to save report to local emergency cache. Please retry.']);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const apiOrigin =
        process.env.NEXT_PUBLIC_RESCUE_LINK_API_ORIGIN ||
        process.env.RESCUE_LINK_API_ORIGIN ||
        'https://pfqm76wx1g.execute-api.us-east-1.amazonaws.com';
      const baseUrl = apiOrigin.trim().replace(/\/$/, '');
      const response = await fetchWithRetry(`${baseUrl}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(
          errBody?.error || `Server responded with HTTP ${response.status}`
        );
      }

      const serverData = await response.json();

      onSubmitted({
        id: serverData.id,
        category,
        payload: validPayload,
        isLocal: false,
      });
    } catch (err) {
      // Degrade to offline queue on network failure
      try {
        const queued = await enqueueIncident(validPayload);
        if (onQueueUpdated) onQueueUpdated();
        onSubmitted({
          id: queued.localId,
          category,
          payload: validPayload,
          isLocal: true,
        });
      } catch {
        setFormErrors([
          err instanceof Error
            ? err.message
            : 'Failed to submit or queue your distress report. Please retry.',
        ]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rl-stagger-1"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--rl-danger)', letterSpacing: '-0.01em' }}>
          Emergency Distress SOS
        </h1>
        <p style={{ color: 'var(--rl-text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Transmit your location and hazard details to nearby rescue responders.
        </p>
      </div>

      {/* Validation Errors Display */}
      {formErrors.length > 0 && (
        <div role="alert" className="rl-alert-danger" style={{ fontSize: '14px' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--rl-danger)' }}>
            Please complete the following:
          </div>
          <ul style={{ paddingLeft: '20px', color: 'var(--rl-danger-text)' }}>
            {formErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1: Hazard Category */}
      <div className="rl-stagger-2">
        <span className="rl-step-label">1. Select Hazard Category</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className="rl-category-card touch-target-large"
                data-selected={isSelected}
                style={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderLeftWidth: '4px',
                  borderLeftColor: isSelected ? cat.accentColor : 'transparent',
                }}
              >
                <Icon size={28} color={isSelected ? cat.accentColor : 'var(--rl-text-muted)'} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--rl-text)' : 'var(--rl-text-secondary)' }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Immediate Situation Description */}
      <div className="rl-stagger-3">
        <label htmlFor="sos-description" className="rl-step-label">
          2. Describe Immediate Threat / Trapped State
        </label>
        <textarea
          id="sos-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Water at ceiling level, 3 people trapped in attic, power lines down outside..."
          rows={3}
          className="rl-input"
          style={{ resize: 'vertical', fontSize: '15px' }}
        />

        {/* 1-Tap Voice Distress Recording */}
        <div style={{ marginTop: '10px' }}>
          {!voice.audioUrl ? (
            <button
              type="button"
              onClick={voice.isRecording ? voice.stopRecording : voice.startRecording}
              className="rl-btn"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--rl-radius-sm)',
                border: voice.isRecording
                  ? '2px solid var(--rl-danger)'
                  : '2px solid var(--rl-border-strong)',
                backgroundColor: voice.isRecording
                  ? 'var(--rl-danger-soft)'
                  : 'var(--rl-surface)',
                color: voice.isRecording ? 'var(--rl-danger)' : 'var(--rl-text-secondary)',
                fontSize: '13px',
              }}
            >
              {voice.isRecording ? (
                <>
                  <Square size={16} />
                  <span>Recording Voice SOS ({voice.recordingDuration}s / 30s) — Click to Complete</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>1-Tap: Record Voice Distress (30s Max)</span>
                </>
              )}
            </button>
          ) : (
            <VoiceSOSPlayer
              audioUrl={voice.audioUrl}
              durationSeconds={voice.recordingDuration}
              onDiscard={voice.clearRecording}
            />
          )}

          {voice.error && (
            <div style={{ color: 'var(--rl-danger)', fontSize: '12px', marginTop: '6px' }}>
              {voice.error}
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Location Capture */}
      <div className="rl-stagger-4">
        <span className="rl-step-label">3. Emergency Location (GPS or Manual)</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={captureLocation}
            disabled={geoLoading}
            className="rl-btn touch-target-large"
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 'var(--rl-radius-sm)',
              border: location
                ? '2px solid var(--rl-success)'
                : '2px solid var(--rl-accent)',
              backgroundColor: location
                ? 'var(--rl-success-soft)'
                : 'var(--rl-surface)',
              color: location ? 'var(--rl-success-text)' : 'var(--rl-text)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: geoLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {geoLoading ? (
              <>
                <Loader2 size={20} className="rl-spin" />
                <span>Acquiring GPS Fix...</span>
              </>
            ) : location ? (
              <>
                <Check size={20} />
                <span>GPS Locked: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
              </>
            ) : (
              <>
                <MapPin size={20} />
                <span>Capture GPS Coordinates</span>
              </>
            )}
          </button>

          {geoError && (
            <div className="rl-alert-warning">
              <MapPin size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{geoError} — Enter coordinates manually below.</span>
            </div>
          )}

          {/* Manual coordinate fallback */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label htmlFor="manual-lat" className="rl-label">Latitude</label>
              <input
                id="manual-lat"
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => handleManualCoordinateChange(e.target.value, manualLng)}
                placeholder="-90 to 90"
                className="rl-input"
                style={{ fontSize: '14px' }}
              />
            </div>
            <div>
              <label htmlFor="manual-lng" className="rl-label">Longitude</label>
              <input
                id="manual-lng"
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => handleManualCoordinateChange(manualLat, e.target.value)}
                placeholder="-180 to 180"
                className="rl-input"
                style={{ fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: People Affected */}
      <div className="rl-stagger-5">
        <span className="rl-step-label">4. Individuals Requiring Rescue</span>
        <div className="rl-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Users size={16} color="var(--rl-accent)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rl-text-secondary)' }}>
              Total individuals with you (including yourself)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setPeopleAffected((prev) => Math.max(1, (prev || 1) - 1))}
              aria-label="Decrease people affected"
              className="rl-counter-btn"
            >
              <Minus size={18} />
            </button>

            <input
              type="number"
              min={1}
              value={peopleAffected}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setPeopleAffected(val);
                else if (e.target.value === '') setPeopleAffected(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setPeopleAffected((prev) => (prev || 0) + 1);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setPeopleAffected((prev) => Math.max(1, (prev || 1) - 1));
                }
              }}
              aria-label="Total individuals with you"
              className="rl-counter-display"
              style={{
                width: '64px',
                height: '48px',
                border: '1px solid var(--rl-border)',
                borderRadius: 'var(--rl-radius-sm)',
                backgroundColor: 'var(--rl-surface)',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            />

            <button
              type="button"
              onClick={() => setPeopleAffected((prev) => (prev || 0) + 1)}
              aria-label="Increase people affected"
              className="rl-counter-btn"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Household Vulnerability Breakdown */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--rl-border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rl-text)', display: 'block', marginBottom: '8px' }}>
              Vulnerable Individuals in Group:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: 'var(--rl-text-secondary)', fontSize: '12px' }}>Children (&lt; 5 yrs)</label>
                <input
                  type="number"
                  min={0}
                  value={childrenUnder5}
                  onChange={(e) => setChildrenUnder5(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="rl-input"
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: 'var(--rl-text-secondary)', fontSize: '12px' }}>Elderly (60+ yrs)</label>
                <input
                  type="number"
                  min={0}
                  value={elderly}
                  onChange={(e) => setElderly(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="rl-input"
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: 'var(--rl-text-secondary)', fontSize: '12px' }}>Pregnant / Lactating</label>
                <input
                  type="number"
                  min={0}
                  value={pregnantOrLactating}
                  onChange={(e) => setPregnantOrLactating(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="rl-input"
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: 'var(--rl-text-secondary)', fontSize: '12px' }}>Persons with Disabilities</label>
                <input
                  type="number"
                  min={0}
                  value={disabled}
                  onChange={(e) => setDisabled(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="rl-input"
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Context & Accessibility */}
      <div className="rl-stagger-5">
        <span className="rl-step-label">Location Context & Road Access</span>
        <div className="rl-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="rl-label" style={{ fontSize: '12px' }}>Nearest Landmark / River Bank / Bridge</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Bagmati River bridge, 200m north of temple"
              className="rl-input"
              style={{ fontSize: '13px' }}
            />
          </div>
          <div>
            <label className="rl-label" style={{ fontSize: '12px' }}>Temporary Shelter / Camp Name (If applicable)</label>
            <input
              type="text"
              value={shelterName}
              onChange={(e) => setShelterName(e.target.value)}
              placeholder="e.g. Local School Relief Camp #2"
              className="rl-input"
              style={{ fontSize: '13px' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--rl-danger)' }}>
            <input
              type="checkbox"
              checked={roadAccessBlocked}
              onChange={(e) => setRoadAccessBlocked(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--rl-danger)' }}
            />
            <span>Road Access Cut Off / Bridge Destroyed (Helicopter / Boat Required)</span>
          </label>
        </div>
      </div>

      {/* Step 5: Urgent Needs Multi-Select */}
      <div className="rl-stagger-6">
        <span className="rl-step-label">5. Urgent Resource Needs (Select All That Apply)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {URGENT_NEEDS.map((need) => {
            const isSelected = urgentNeeds.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => toggleUrgentNeed(need.id)}
                className="rl-pill"
                data-selected={isSelected}
              >
                {isSelected && <Check size={16} color="var(--rl-accent)" />}
                {need.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 6: Reporter Contact (Optional) */}
      <div className="rl-stagger-7">
        <span className="rl-step-label">6. Contact Method for Rescuers (Optional)</span>
        <div className="rl-card" style={{ padding: '14px' }}>
          <div className="rl-segment-group">
            {(['none', 'phone', 'email'] as ContactMethod[]).map((method) => {
              const isSelected = contactMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setContactMethod(method)}
                  className="rl-segment"
                  data-selected={isSelected}
                >
                  {method === 'phone' && <Phone size={14} />}
                  {method === 'email' && <Mail size={14} />}
                  {method === 'none' && <HelpCircle size={14} />}
                  {method === 'none' ? 'None' : method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              );
            })}
          </div>

          {contactMethod !== 'none' && (
            <input
              type={contactMethod === 'email' ? 'email' : 'tel'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={
                contactMethod === 'phone'
                  ? 'Enter phone number (e.g. +1 555-0199)'
                  : 'Enter email address'
              }
              className="rl-input"
              style={{ marginTop: '10px', fontSize: '14px' }}
            />
          )}

          {/* Phase 5: SNS/SES Notification Helper Text */}
          {contactMethod === 'phone' && (
            <div className="rl-alert-success" style={{ marginTop: '10px' }}>
              <Phone size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
              <span>
                <strong>Emergency SMS Active:</strong> Your phone number enables an automatic emergency SMS alert to be dispatched directly to you the moment your distress signal reaches our command center.
              </span>
            </div>
          )}
          {contactMethod === 'email' && (
            <div className="rl-alert-info" style={{ marginTop: '10px' }}>
              <Mail size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
              <span>
                <strong>Emergency Email Active:</strong> An HTML emergency dispatch notification will be sent to the RescueLink response coordination team on your behalf when your SOS is received.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transmit SOS Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rl-btn rl-btn-danger touch-target-large"
        style={{ width: '100%' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={22} className="rl-spin" />
            <span>TRANSMITTING DISTRESS SIGNAL...</span>
          </>
        ) : (
          <>
            <Send size={22} />
            <span>TRANSMIT DISTRESS SOS</span>
          </>
        )}
      </button>
    </form>
  );
};