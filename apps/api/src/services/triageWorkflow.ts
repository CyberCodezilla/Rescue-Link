import { Incident } from '@rescue-link/schema';
import { bedrockService } from './bedrockService';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from './eventStream';
import { notificationQueue } from './notificationQueue';
import { LifeSafetyTracer } from './lifeSafetyTracer';

export class TriageWorkflowOrchestrator {
  /**
   * Asynchronously triages an incoming incident using Bedrock AI (or fallback engine),
   * updates the store, broadcasts an SSE update to all connected responders,
   * and enqueues Amazon SNS SMS / SES Email notifications for critical/high incidents.
   */
  async runTriage(incident: Incident, incomingTraceId?: string): Promise<Incident> {
    const startTime = Date.now();
    const traceId = incomingTraceId || LifeSafetyTracer.createTraceId(incident.id);

    LifeSafetyTracer.log({
      traceId,
      incidentId: incident.id,
      step: 'TRIAGE_START',
      timestamp: startTime,
      status: 'STARTED',
      priority: incident.priority,
      metadata: { category: incident.category, peopleAffected: incident.peopleAffected },
    });

    try {
      const triageResult = await bedrockService.triageIncident(incident, traceId);

      const updated = await incidentStore.update(incident.id, {
        priority: triageResult.priority,
        triage: {
          ...(incident.triage || {}),
          ...triageResult.triage,
        },
      });

      const finalIncident = updated || incident;
      const durationMs = Date.now() - startTime;

      LifeSafetyTracer.log({
        traceId,
        incidentId: incident.id,
        step: 'TRIAGE_COMPLETE',
        timestamp: Date.now(),
        durationMs,
        priority: finalIncident.priority,
        status: 'SUCCESS',
        metadata: { suggestedAction: finalIncident.triage?.suggestedAction },
      });

      // Broadcast updated incident state via SSE
      eventStreamManager.broadcast({
        type: 'incident:updated',
        incident: finalIncident,
        timestamp: Date.now(),
      });

      // Decoupled background notification queue (non-blocking) with trace correlation
      notificationQueue.enqueue(finalIncident, traceId);

      return finalIncident;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      LifeSafetyTracer.log({
        traceId,
        incidentId: incident.id,
        step: 'TRIAGE_COMPLETE',
        timestamp: Date.now(),
        durationMs,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      });

      console.error(`[TriageWorkflow] Failed async triage for incident ${incident.id}:`, error);
      return incident;
    }
  }
}

export const triageWorkflow = new TriageWorkflowOrchestrator();
