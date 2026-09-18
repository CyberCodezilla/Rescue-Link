import { Incident, IncidentTriage, Priority } from './incident';

export interface HeuristicConfigOptions {
  criticalPeopleThreshold?: number;
  highPeopleThreshold?: number;
  criticalNeeds?: string[];
  criticalCategories?: string[];
  highNeeds?: string[];
  highCategories?: string[];
  heuristicConfidence?: number;
}

const hasAny = (arr: string[], keywords: string[]): boolean =>
  arr.some((item) => keywords.includes(item));

/**
 * Shared heuristic triage engine.
 * Evaluates priority and survival actions based on incident category, casualty count, and urgent needs.
 */
export function generateHeuristicTriage(
  incident: Incident,
  opts?: HeuristicConfigOptions
): { priority: Priority; triage: IncidentTriage } {
  const criticalPeople = opts?.criticalPeopleThreshold ?? 5;
  const highPeople = opts?.highPeopleThreshold ?? 3;
  const criticalNeeds = opts?.criticalNeeds ?? ['medical', 'boat'];
  const criticalCategories = opts?.criticalCategories ?? ['fire'];
  const highNeeds = opts?.highNeeds ?? ['clean_water', 'food'];
  const highCategories = opts?.highCategories ?? ['landslide'];
  const confidence = opts?.heuristicConfidence ?? 0.92;

  const needs = incident.urgentNeeds || [];
  const count = incident.peopleAffected || 1;

  const hasCriticalNeed = hasAny(needs, criticalNeeds);
  const hasCriticalCategory = criticalCategories.includes(incident.category);
  const hasHighNeed = hasAny(needs, highNeeds);
  const hasHighCategory = highCategories.includes(incident.category);

  let priority: Priority = 'medium';
  let suggestedAction = 'Emergency report logged. Conserve device battery and keep emergency whistle ready.';
  let summary = `Standard ${incident.category} alert queued for responder review.`;
  let reasoning = 'Assigned MEDIUM priority for stable non-life-threatening assistance request.';

  if (hasCriticalNeed || count >= criticalPeople || hasCriticalCategory) {
    priority = 'critical';
    suggestedAction =
      incident.category === 'flood'
        ? 'URGENT: Move to roof/highest level immediately. Signal rescue boats with bright cloth.'
        : incident.category === 'fire'
        ? 'CRITICAL: Stay low beneath smoke. Cover face with wet cloth and move away from fire line.'
        : 'CRITICAL: Prepare for immediate medical evacuation. Keep air passages clear.';
    summary = `CRITICAL DISTRESS: ${count} people affected. High casualty risk.`;
    reasoning = `Assigned CRITICAL priority due to urgent needs [${needs.join(', ')}] and ${count} casualties reported.`;
  } else if (hasHighNeed || hasHighCategory || count >= highPeople) {
    priority = 'high';
    suggestedAction =
      incident.category === 'landslide'
        ? 'HIGH HAZARD: Move perpendicular to landslide flow direction toward stable rocky ground.'
        : 'High priority alert registered. Prepare emergency supply pickup zone.';
    summary = `HIGH PRIORITY: ${incident.category} incident requiring active responder intervention.`;
    reasoning = `Assigned HIGH priority based on hazard classification (${incident.category}) and survivor population.`;
  }

  return {
    priority,
    triage: {
      suggestedAction,
      summary,
      reasoning,
      confidence,
    },
  };
}

/**
 * Builds standardized prompt for Bedrock AI triage.
 */
export function buildBedrockTriagePrompt(incident: Incident): string {
  const audioSignal = incident.audioBlob
    ? 'Yes (Recorded voice distress signal attached by survivor)'
    : 'None';

  return `You are an expert emergency dispatch AI for RescueLink. Triage the following disaster SOS report:
Category: ${incident.category}
Description: ${incident.description}
Audio Distress Signal: ${audioSignal}
People Affected: ${incident.peopleAffected}
Urgent Needs: ${incident.urgentNeeds.join(', ') || 'None specified'}
Location: Lat ${incident.location.lat}, Lng ${incident.location.lng}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "priority": "critical" | "high" | "medium" | "low",
  "suggestedAction": "Immediate survival directive for survivor",
  "summary": "Brief dispatcher summary",
  "reasoning": "Reason for priority assignment",
  "confidence": 0.95
}`;
}

/**
 * Parses and validates Bedrock AI JSON output into priority and triage structure.
 */
export function parseBedrockTriageOutput(responseBodyText: string): { priority: Priority; triage: IncidentTriage } {
  const jsonMatch = responseBodyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Bedrock output');
  }

  const data = JSON.parse(jsonMatch[0]);
  const validPriorities: Priority[] = ['critical', 'high', 'medium', 'low'];
  const priority: Priority = validPriorities.includes(data.priority) ? data.priority : 'high';

  return {
    priority,
    triage: {
      suggestedAction: data.suggestedAction || 'Move to high ground immediately.',
      summary: data.summary || `AI Triaged disaster distress call.`,
      reasoning: data.reasoning || 'Evaluated severity based on reported casualty risk.',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
    },
  };
}
