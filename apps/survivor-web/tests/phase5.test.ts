import { describe, it, expect } from 'vitest';
import {
  PriorityEnum,
  IncidentStatusEnum,
  IncidentResponseSchema,
  ReporterSchema,
  type IncidentResponse,
} from '@/lib/validation';

/**
 * Phase 5: Emergency Notification Integration Tests
 *
 * These tests validate Dev A's survivor-web integration with Dev C's
 * Amazon SNS / SES emergency notification engine.
 *
 * Key contract:
 * - When POST /api/incidents creates an incident, bedrockService assigns a `priority`.
 * - notificationService.sendCriticalAlert() fires SNS SMS + SES Email for 'critical' or 'high' incidents.
 * - SNS SMS is targeted at incident.reporter.contactValue when contactMethod === 'phone'.
 * - SES Email is always dispatched for critical/high regardless of contactMethod.
 */

describe('Phase 5 Emergency Notification Integration Tests', () => {
  // -----------------------------------------------------------------------
  // 1. Priority Enum Validation — matches Dev C's triage priority output
  // -----------------------------------------------------------------------
  describe('1. PriorityEnum — Dev C AI Triage Output Contract', () => {
    it('accepts all valid triage priority levels', () => {
      const validPriorities = ['critical', 'high', 'medium', 'low', 'pending_triage'];
      validPriorities.forEach((p) => {
        const result = PriorityEnum.safeParse(p);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBe(p);
      });
    });

    it('rejects unknown priority levels', () => {
      const invalid = ['urgent', 'severe', 'none', 'emergency', ''];
      invalid.forEach((p) => {
        const result = PriorityEnum.safeParse(p);
        expect(result.success).toBe(false);
      });
    });
  });

  // -----------------------------------------------------------------------
  // 2. IncidentResponseSchema — correctly surfaces priority from API response
  // -----------------------------------------------------------------------
  describe('2. IncidentResponseSchema — Priority Field Parsing', () => {
    const baseIncident = {
      id: 'inc-phase5-001',
      category: 'flood',
      description: 'Rising waters on Main Street',
      location: { lat: 19.076, lng: 72.877 },
      peopleAffected: 4,
      urgentNeeds: ['boat'],
      status: 'in_progress',
      createdAt: Date.now(),
    };

    it('parses a CRITICAL priority incident correctly', () => {
      const result = IncidentResponseSchema.safeParse({
        ...baseIncident,
        priority: 'critical',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('critical');
      }
    });

    it('parses a HIGH priority incident correctly', () => {
      const result = IncidentResponseSchema.safeParse({
        ...baseIncident,
        priority: 'high',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('high');
      }
    });

    it('parses MEDIUM, LOW, and PENDING_TRIAGE priorities correctly', () => {
      (['medium', 'low', 'pending_triage'] as const).forEach((p) => {
        const result = IncidentResponseSchema.safeParse({ ...baseIncident, priority: p });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.priority).toBe(p);
      });
    });
  });

  // -----------------------------------------------------------------------
  // 3. ReporterSchema — validates the contact details Dev C's SNS reads from
  // -----------------------------------------------------------------------
  describe('3. ReporterSchema — Dev C SNS SMS Contact Contract', () => {
    it('validates phone contactMethod with a phone number (enables SNS SMS)', () => {
      const result = ReporterSchema.safeParse({
        contactMethod: 'phone',
        contactValue: '+91-9876543210',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactMethod).toBe('phone');
        expect(result.data.contactValue).toBe('+91-9876543210');
      }
    });

    it('validates email contactMethod with an email (enables SES coordination dispatch)', () => {
      const result = ReporterSchema.safeParse({
        contactMethod: 'email',
        contactValue: 'survivor@rescue.org',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contactMethod).toBe('email');
        expect(result.data.contactValue).toBe('survivor@rescue.org');
      }
    });

    it("accepts 'none' contactMethod without a contactValue", () => {
      const result = ReporterSchema.safeParse({ contactMethod: 'none' });
      expect(result.success).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Notification Display Logic — mirrors Dev C's sendCriticalAlert() trigger
  // -----------------------------------------------------------------------
  describe('4. Notification Dispatch Logic (mirrors Dev C notificationService)', () => {
    const shouldShowNotificationBanner = (priority: IncidentResponse['priority']): boolean =>
      priority === 'critical' || priority === 'high';

    const shouldShowSmsBadge = (
      priority: IncidentResponse['priority'],
      contactMethod: string | undefined
    ): boolean =>
      shouldShowNotificationBanner(priority) && contactMethod === 'phone';

    it('shows notification banner for CRITICAL priority', () => {
      expect(shouldShowNotificationBanner('critical')).toBe(true);
    });

    it('shows notification banner for HIGH priority', () => {
      expect(shouldShowNotificationBanner('high')).toBe(true);
    });

    it('does NOT show notification banner for MEDIUM, LOW, or PENDING_TRIAGE', () => {
      expect(shouldShowNotificationBanner('medium')).toBe(false);
      expect(shouldShowNotificationBanner('low')).toBe(false);
      expect(shouldShowNotificationBanner('pending_triage')).toBe(false);
    });

    it('shows SMS badge when priority is CRITICAL and contactMethod is phone', () => {
      expect(shouldShowSmsBadge('critical', 'phone')).toBe(true);
    });

    it('shows SMS badge when priority is HIGH and contactMethod is phone', () => {
      expect(shouldShowSmsBadge('high', 'phone')).toBe(true);
    });

    it('does NOT show SMS badge when contactMethod is email even if priority is CRITICAL', () => {
      expect(shouldShowSmsBadge('critical', 'email')).toBe(false);
    });

    it('does NOT show SMS badge when contactMethod is none even if priority is HIGH', () => {
      expect(shouldShowSmsBadge('high', 'none')).toBe(false);
    });

    it('does NOT show SMS badge for medium priority even with phone contact', () => {
      expect(shouldShowSmsBadge('medium', 'phone')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Full Incident with Notification-Relevant Fields Parsed
  // -----------------------------------------------------------------------
  describe('5. Full incident payload with reporter + priority (critical/phone → SNS)', () => {
    it('validates a full critical incident with phone reporter matching Dev C SNS contract', () => {
      const result = IncidentResponseSchema.safeParse({
        id: 'inc-phase5-sns-001',
        category: 'fire',
        description: 'Structure fire with trapped occupants on 3rd floor',
        location: { lat: 28.6139, lng: 77.209, label: 'Connaught Place, Delhi' },
        peopleAffected: 6,
        urgentNeeds: ['medical', 'boat'],
        status: 'acknowledged',
        priority: 'critical',
        createdAt: Date.now(),
        reporter: {
          contactMethod: 'phone',
          contactValue: '+91-9888877776',
        },
        triage: {
          suggestedAction: 'CRITICAL: Evacuate via stairwell B immediately. Do not use elevators.',
          confidence: 0.96,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('critical');
        expect(result.data.reporter?.contactMethod).toBe('phone');
        expect(result.data.reporter?.contactValue).toBe('+91-9888877776');
        expect(result.data.triage?.suggestedAction).toContain('CRITICAL');
      }
    });
  });
});
