import { z } from 'zod';

/**
 * Shared Monorepo Incident Data Contract matching packages/schema/src/incident.ts
 */

export const IncidentCategoryEnum = z.enum(['flood', 'landslide', 'fire', 'other']);
export type IncidentCategory = z.infer<typeof IncidentCategoryEnum>;

export const PriorityEnum = z.enum(['critical', 'high', 'medium', 'low', 'pending_triage']);
export type Priority = z.infer<typeof PriorityEnum>;

export const IncidentStatusEnum = z.enum([
  'new',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed',
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

export const UrgentNeedEnum = z.enum([
  'medical',
  'boat',
  'food',
  'clean_water',
  'infant_care',
  'sanitation',
  'shelter',
  'psychosocial_support',
  'evacuation',
]);
export type UrgentNeed = z.infer<typeof UrgentNeedEnum>;

export const ContactMethodEnum = z.enum(['email', 'phone', 'none']);
export type ContactMethod = z.infer<typeof ContactMethodEnum>;

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const ReporterSchema = z.object({
  contactMethod: ContactMethodEnum.optional().default('none'),
  contactValue: z.string().optional(),
});
export type Reporter = z.infer<typeof ReporterSchema>;

export const SOSSubmissionSchema = z.object({
  category: IncidentCategoryEnum,
  description: z.string().min(1, 'Please describe the emergency situation'),
  location: LocationSchema,
  peopleAffected: z.coerce.number().int().min(1, 'At least 1 person must be affected').default(1),
  urgentNeeds: z.array(UrgentNeedEnum).default([]),
  reporter: ReporterSchema.optional(),
  audioBlob: z.string().optional(),
});
export type SOSSubmission = z.infer<typeof SOSSubmissionSchema>;

export const IncidentTriageSchema = z.object({
  suggestedAction: z.string().optional(),
  confidence: z.number().optional(),
  assignedUnits: z.array(z.string()).optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
  reasoning: z.string().optional(),
});
export type IncidentTriage = z.infer<typeof IncidentTriageSchema>;

export const IncidentResponseSchema = z.object({
  id: z.string(),
  category: IncidentCategoryEnum.optional().default('other'),
  description: z.string().optional().default(''),
  location: LocationSchema.optional().default({ lat: 0, lng: 0 }),
  peopleAffected: z.coerce.number().optional().default(1),
  urgentNeeds: z.array(UrgentNeedEnum).optional().default([]),
  reporter: ReporterSchema.optional(),
  status: IncidentStatusEnum.optional().default('new'),
  priority: PriorityEnum.optional().default('pending_triage'),
  createdAt: z.union([z.string(), z.number()]).optional().default(() => Date.now()),
  updatedAt: z.union([z.string(), z.number()]).optional().default(() => Date.now()),
  triage: IncidentTriageSchema.optional(),
  audioBlob: z.string().optional(),
  details: z.object({
    category: IncidentCategoryEnum.optional().default('other'),
    description: z.string().optional().default(''),
    peopleAffected: z.coerce.number().optional().default(1),
    urgentNeeds: z.array(UrgentNeedEnum).optional().default([]),
  }).optional(),
  assignedTo: z.string().optional(),
});
export type IncidentResponse = z.infer<typeof IncidentResponseSchema>;

export interface PendingIncident {
  localId: string;
  createdAt: number;
  status: 'queued' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  payload: SOSSubmission;
  errorMessage?: string;
}

export interface BroadcastMessage {
  id?: string;
  message: string;
  channel?: 'wifi' | 'sms' | 'email' | string;
  deliveredAt?: number;
}

export interface SurvivorSSEEvent {
  type: 'incident:created' | 'incident:updated' | 'broadcast:sent';
  incident: IncidentResponse;
  message?: string;
  timestamp: number;
}
