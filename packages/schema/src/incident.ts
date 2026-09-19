import { z } from 'zod';

export const IncidentStatusEnum = z.enum([
  'new',
  'acknowledged',
  'in_progress',
  'resolved',
  'closed',
]);
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>;

export const PriorityEnum = z.enum([
  'critical',
  'high',
  'medium',
  'low',
  'pending_triage',
]);
export type Priority = z.infer<typeof PriorityEnum>;

export const IncidentCategoryEnum = z.enum(['flood', 'landslide', 'fire', 'other']);
export type IncidentCategory = z.infer<typeof IncidentCategoryEnum>;

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

export const HouseholdCompositionSchema = z.object({
  adults: z.coerce.number().int().min(0).default(1),
  childrenUnder5: z.coerce.number().int().min(0).default(0),
  elderly: z.coerce.number().int().min(0).default(0),
  pregnantOrLactating: z.coerce.number().int().min(0).default(0),
  disabled: z.coerce.number().int().min(0).default(0),
});
export type HouseholdComposition = z.infer<typeof HouseholdCompositionSchema>;

export const LocationContextSchema = z.object({
  landmark: z.string().optional(),
  shelterName: z.string().optional(),
  roadAccessBlocked: z.boolean().optional(),
});
export type LocationContext = z.infer<typeof LocationContextSchema>;

export const IncidentDetailsSchema = z.object({
  category: IncidentCategoryEnum,
  description: z.string().min(1, 'Description is required'),
  peopleAffected: z.coerce.number().int().min(1).default(1),
  urgentNeeds: z.array(UrgentNeedEnum).default([]),
  householdComposition: HouseholdCompositionSchema.optional(),
  locationContext: LocationContextSchema.optional(),
});
export type IncidentDetails = z.infer<typeof IncidentDetailsSchema>;

export const IncidentTriageSchema = z.object({
  suggestedAction: z.string().optional(),
  confidence: z.number().optional(),
  assignedUnits: z.array(z.string()).optional(),
  notes: z.string().optional(),
  summary: z.string().optional(),
  reasoning: z.string().optional(),
  translatedDescription: z.string().optional(),
  detectedLanguage: z.string().optional(),
});
export type IncidentTriage = z.infer<typeof IncidentTriageSchema>;

export const SOSSubmissionSchema = z.object({
  category: IncidentCategoryEnum,
  description: z.string().min(1, 'Description is required'),
  location: LocationSchema,
  peopleAffected: z.coerce.number().int().min(1).default(1),
  urgentNeeds: z.array(UrgentNeedEnum).default([]),
  reporter: ReporterSchema.optional(),
  audioBlob: z.string().optional(),
  householdComposition: HouseholdCompositionSchema.optional(),
  locationContext: LocationContextSchema.optional(),
});
export type SOSSubmission = z.infer<typeof SOSSubmissionSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.number().optional().default(() => Date.now()),
  updatedAt: z.coerce.number().optional().default(() => Date.now()),
  status: IncidentStatusEnum.optional().default('new'),
  priority: PriorityEnum.optional().default('pending_triage'),
  location: LocationSchema.optional().default({ lat: 0, lng: 0 }),
  reporter: ReporterSchema.optional(),
  category: IncidentCategoryEnum.optional().default('other'),
  description: z.string().optional().default(''),
  peopleAffected: z.coerce.number().optional().default(1),
  urgentNeeds: z.array(UrgentNeedEnum).optional().default([]),
  details: IncidentDetailsSchema.optional(),
  triage: IncidentTriageSchema.optional(),
  translatedDescription: z.string().optional(),
  detectedLanguage: z.string().optional(),
  assignedTo: z.string().optional(),
  audioBlob: z.string().optional(),
  householdComposition: HouseholdCompositionSchema.optional(),
  locationContext: LocationContextSchema.optional(),
});
export type Incident = z.infer<typeof IncidentSchema>;
