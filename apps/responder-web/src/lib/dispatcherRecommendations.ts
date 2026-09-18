import type { IncidentResponse } from './schema';
import { getCategory, getPeopleAffected, getUrgentNeeds } from './schema';

export interface RescuePlanTemplate {
  id: string;
  name: string;
  category: string;
  leadRole: string;
  units: string[];
  directive: string;
  isCustom?: boolean;
}

export interface IncidentRecommendation {
  leadRole: string;
  recommendedUnits: string[];
  recommendedDirective: string;
  rationale: string;
  priorityAlert: string;
}

/** Built-in Standard Operating Procedure Rescue Plans */
export const DEFAULT_RESCUE_PLANS: RescuePlanTemplate[] = [
  {
    id: 'flood-rapid-evac',
    name: '🌊 Flood Rapid Evacuation',
    category: 'flood',
    leadRole: 'Swiftwater Commander Alpha',
    units: ['Boat Unit-1', 'Swiftwater-Alpha', 'Medic-2'],
    directive: 'URGENT: Move to highest accessible roof level immediately. Signal rescue craft with bright cloth or light.',
  },
  {
    id: 'fire-suppression-evac',
    name: '🔥 Fire Suppression & Evacuation',
    category: 'fire',
    leadRole: 'Fire Incident Marshal',
    units: ['Engine-3', 'Ladder Squad-1', 'Thermal Drone-1', 'Paramedic-1'],
    directive: 'CRITICAL: Stay low beneath smoke line with wet cloth over airway. Evacuate toward windward designated rally point.',
  },
  {
    id: 'landslide-sar',
    name: '⛰ Landslide Search & Rescue',
    category: 'landslide',
    leadRole: 'Search & Rescue Ops Lead',
    units: ['K9 Search Unit', 'Heavy Excavator-1', 'Medic-3', 'Geo-Survey Drone'],
    directive: 'HIGH HAZARD: Move perpendicular to landslide flow direction toward stable bedrock. Avoid running water channels.',
  },
  {
    id: 'mass-casualty-triage',
    name: '🏥 Mass Casualty Emergency Pack',
    category: 'other',
    leadRole: 'Chief Triage Medical Officer',
    units: ['Ambulance-1', 'Ambulance-2', 'Field Hospital-Alpha', 'Air Evac-1'],
    directive: 'MEDICAL PRIORITY: Apply direct pressure to bleeding wounds. Group injured together and signal incoming paramedics.',
  },
  {
    id: 'night-recon-perimeter',
    name: '🌙 Night Aerial Reconnaissance',
    category: 'other',
    leadRole: 'Reconnaissance Tactical Lead',
    units: ['Infrared Drone-2', 'Mobile Floodlight-1', 'Rapid Response Scout'],
    directive: 'Keep phone screen or light source facing sky for aerial infrared drone verification.',
  },
];

const STORAGE_KEY = 'rescuelink_custom_rescue_plans';

/** Load all operational plans (combines built-in defaults and local saved plans) */
export function loadAllRescuePlans(): RescuePlanTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_RESCUE_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESCUE_PLANS;
    const custom: RescuePlanTemplate[] = JSON.parse(raw);
    return [...DEFAULT_RESCUE_PLANS, ...custom];
  } catch {
    return DEFAULT_RESCUE_PLANS;
  }
}

/** Save a new custom operational rescue plan */
export function saveCustomRescuePlan(plan: Omit<RescuePlanTemplate, 'id' | 'isCustom'>): RescuePlanTemplate {
  const newPlan: RescuePlanTemplate = {
    ...plan,
    id: `custom-${Date.now()}`,
    isCustom: true,
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: RescuePlanTemplate[] = raw ? JSON.parse(raw) : [];
      const updated = [...existing, newPlan];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist custom plan:', err);
    }
  }

  return newPlan;
}

/** Delete a custom rescue plan */
export function deleteCustomRescuePlan(planId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const existing: RescuePlanTemplate[] = JSON.parse(raw);
    const updated = existing.filter((p) => p.id !== planId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom plan:', err);
  }
}

/**
 * Smart AI Recommendation Engine:
 * Evaluates incident hazard category, priority severity, casualty count,
 * and reported urgent needs to generate tailored tactical recommendations.
 */
export function generateIncidentRecommendation(incident: IncidentResponse): IncidentRecommendation {
  const category = getCategory(incident);
  const casualties = getPeopleAffected(incident);
  const needs = getUrgentNeeds(incident);
  const isCritical = incident.priority === 'critical';

  // 1. Hazard-specific squad and directive synthesis
  if (category === 'flood') {
    const units = ['Boat Unit-1', 'Swiftwater-Alpha'];
    if (casualties > 3 || needs.includes('medical') || isCritical) {
      units.push('Ambulance-1', 'Rescue Heli-1');
    } else {
      units.push('Supply Drone-1');
    }

    return {
      leadRole: isCritical ? 'Water Rescue Command Chief' : 'Flood Evac Officer',
      recommendedUnits: units,
      recommendedDirective:
        'URGENT: Move to roof or highest accessible platform immediately. Display bright colored fabric for watercraft spotting.',
      rationale: `Detected ${casualties} casualty report(s) in active flood zone with urgent need for ${needs.join(', ') || 'evacuation'}.`,
      priorityAlert: isCritical ? 'CRITICAL WATER SURGE IN PROGRESS' : 'ACTIVE RISING WATER HAZARD',
    };
  }

  if (category === 'fire') {
    const units = ['Engine-3', 'Ladder Squad-1'];
    if (casualties > 2 || isCritical) {
      units.push('Thermal Drone-1', 'Paramedic-1');
    }
    if (needs.includes('medical')) {
      units.push('Ambulance-2');
    }

    return {
      leadRole: 'Fire Incident Marshal',
      recommendedUnits: units,
      recommendedDirective:
        'CRITICAL: Stay low beneath smoke ceiling. Cover airway with wet cloth. Evacuate along upwind perimeter away from burning structures.',
      rationale: `Rapid fire progression reported with ${casualties} individual(s) at risk. Thermal imaging drone deployment recommended.`,
      priorityAlert: isCritical ? 'UNCONTAINED FLAME & SMOKE SPREAD' : 'STRUCTURE FIRE ACTIVE',
    };
  }

  if (category === 'landslide') {
    const units = ['K9 Search Unit', 'Heavy Excavator-1'];
    if (casualties > 1 || isCritical) {
      units.push('Paramedic-1', 'Geo-Survey Drone');
    }

    return {
      leadRole: 'Geotechnical SAR Officer',
      recommendedUnits: units,
      recommendedDirective:
        'HIGH HAZARD: Move perpendicular to debris flow path toward stable rocky terrain. Avoid low-lying riverbeds or slopes.',
      rationale: `Unstable slope failure with ${casualties} person(s) potentially trapped. K9 canine search recommended.`,
      priorityAlert: 'UNSTABLE GROUND // DEBRIS HAZARD',
    };
  }

  // Generic / Medical / Structural collapse
  const defaultUnits = ['Rapid Response Team-1', 'Medic-1'];
  if (casualties > 2 || needs.includes('medical')) {
    defaultUnits.push('Ambulance-1');
  }
  if (isCritical) {
    defaultUnits.push('Tactical Rescue Squad');
  }

  return {
    leadRole: isCritical ? 'Emergency Command Supervisor' : 'Field Operations Coordinator',
    recommendedUnits: defaultUnits,
    recommendedDirective:
      'RESCUE TEAM EN-ROUTE: Stay at your current confirmed location if safe. Conserve phone battery and signal arrival units.',
    rationale: `Distress signal registered with priority: ${incident.priority.toUpperCase()}. Immediate squad deployment dispatched.`,
    priorityAlert: isCritical ? 'URGENT DISTRESS BEACON ACTIVE' : 'STANDARD CAD DISPATCH',
  };
}
