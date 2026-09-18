import { Incident } from './incident';

export function formatSnsSmsMessage(incident: Incident): string {
  const priority = (incident.priority || 'medium').toUpperCase();
  const category = (incident.category || 'disaster').toUpperCase();
  const lat = incident.location?.lat;
  const lng = incident.location?.lng;
  const count = incident.peopleAffected || 1;
  const directive = incident.triage?.suggestedAction || 'Awaiting dispatch';

  return `[RESCUELINK ${priority} ALERT] ${category} at Lat:${lat}, Lng:${lng}. ${count} affected. Directive: ${directive}`;
}

export function formatSnsSubject(incident: Incident): string {
  const priority = (incident.priority || 'medium').toUpperCase();
  return `RescueLink Emergency ${priority} Alert`;
}

export function formatSesEmailSubject(incident: Incident): string {
  const priority = (incident.priority || 'medium').toUpperCase();
  return `[RESCUELINK DISASTER ALERT] ${priority}: ${incident.category}`;
}

export function formatSesEmailHtml(incident: Incident): string {
  const priority = (incident.priority || 'medium').toUpperCase();
  const needs = incident.urgentNeeds?.join(', ') || 'None';
  const directive = incident.triage?.suggestedAction || 'Immediate tactical evaluation required.';

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
      <h2 style="color: #ef4444;">🚨 RESCUELINK EMERGENCY ${priority} ALERT</h2>
      <p><strong>Incident ID:</strong> ${incident.id}</p>
      <p><strong>Category:</strong> ${incident.category}</p>
      <p><strong>Description:</strong> ${incident.description}</p>
      <p><strong>Casualties / Affected:</strong> ${incident.peopleAffected}</p>
      <p><strong>Urgent Needs:</strong> ${needs}</p>
      <p><strong>Coordinates:</strong> Lat ${incident.location?.lat}, Lng ${incident.location?.lng}</p>
      <hr />
      <h3>🤖 AI Triage Survival Directive</h3>
      <p style="background: #fee2e2; padding: 12px; border-left: 4px solid #ef4444; font-weight: bold;">
        ${directive}
      </p>
    </div>
  `;
}
