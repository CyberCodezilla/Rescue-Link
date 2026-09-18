import { Incident } from '@rescue-link/schema';
import { bedrockService } from './bedrockService';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from './eventStream';
import { notificationQueue } from './notificationQueue';
import { LifeSafetyTracer } from './lifeSafetyTracer';
import { CONFIG } from '@rescue-link/config';
import type { SFNClient as SFNClientType, StartExecutionCommand as StartExecutionCommandType } from '@aws-sdk/client-sfn';

export class TriageWorkflowOrchestrator {
  private sfnClientPromise: Promise<{ sfnClient: SFNClientType; StartExecutionCommand: typeof StartExecutionCommandType }> | null = null;

  private async getSfnClient() {
    if (!this.sfnClientPromise) {
      this.sfnClientPromise = (async () => {
        const { SFNClient, StartExecutionCommand } = await import('@aws-sdk/client-sfn');
        const sfnClient = new SFNClient({ region: CONFIG.AWS_REGION });
        return { sfnClient, StartExecutionCommand };
      })();
    }
    return this.sfnClientPromise;
  }

  private async startAwsWorkflow(incident: Incident): Promise<Incident | null> {
    if (!CONFIG.STATE_MACHINE_ARN) return null;

    const { sfnClient, StartExecutionCommand } = await this.getSfnClient();

    const command = new StartExecutionCommand({
      stateMachineArn: CONFIG.STATE_MACHINE_ARN,
      input: JSON.stringify({ incident }),
    });

    const response = await sfnClient.send(command);
    console.log(`[TriageWorkflow] Step Functions execution started for ${incident.id}: ${response.executionArn || 'unknown'}`);
    return incident;
  }

  /**
   * Asynchronously triages an incoming incident using Bedrock AI (or fallback engine),
   * updates the store, broadcasts an SSE update to all connected responders,
   * and enqueues emergency SNS SMS / SES Email notifications for critical/high incidents.
   */
  async runTriage(incident: Incident, traceId?: string): Promise<Incident> {
    const effectiveTraceId = traceId || LifeSafetyTracer.createTraceId(incident.id);

    LifeSafetyTracer.log({
      traceId: effectiveTraceId,
      incidentId: incident.id,
      step: 'TRIAGE_START',
      timestamp: Date.now(),
      status: 'STARTED',
      priority: incident.priority,
    });

    if (CONFIG.STATE_MACHINE_ARN) {
      try {
        const started = await this.startAwsWorkflow(incident);
        if (started) {
          LifeSafetyTracer.log({
            traceId: effectiveTraceId,
            incidentId: incident.id,
            step: 'TRIAGE_COMPLETE',
            timestamp: Date.now(),
            status: 'SUCCESS',
            priority: incident.priority,
            mode: 'step_functions',
          });
          return started;
        }
      } catch (error) {
        console.error(`[TriageWorkflow] Step Functions start failed for ${incident.id}, using local fallback:`, error);
      }
    }

    try {
      const triageResult = await bedrockService.triageIncident(incident, effectiveTraceId);

      const updated = await incidentStore.update(incident.id, {
        priority: triageResult.priority,
        triage: {
          ...(incident.triage || {}),
          ...triageResult.triage,
        },
      });

      const finalIncident = updated || incident;

      LifeSafetyTracer.log({
        traceId: effectiveTraceId,
        incidentId: finalIncident.id,
        step: 'TRIAGE_COMPLETE',
        timestamp: Date.now(),
        status: 'SUCCESS',
        priority: finalIncident.priority,
      });

      // Broadcast updated incident state via SSE
      eventStreamManager.broadcast({
        type: 'incident:updated',
        incident: finalIncident,
        timestamp: Date.now(),
      });

      // Enqueue emergency notifications (SNS/SES) via background NotificationQueue
      notificationQueue.enqueue(finalIncident, effectiveTraceId);

      return finalIncident;
    } catch (error) {
      console.error(`[TriageWorkflow] Failed async triage for incident ${incident.id}:`, error);

      const fallback = bedrockService.generateHeuristicTriage(incident);
      const recovered = await incidentStore.update(incident.id, {
        priority: fallback.priority,
        triage: {
          ...(incident.triage || {}),
          ...fallback.triage,
        },
      });

      const finalIncident = recovered || {
        ...incident,
        priority: fallback.priority,
        triage: {
          ...(incident.triage || {}),
          ...fallback.triage,
        },
      };

      LifeSafetyTracer.log({
        traceId: effectiveTraceId,
        incidentId: finalIncident.id,
        step: 'TRIAGE_COMPLETE',
        timestamp: Date.now(),
        status: 'WARNING',
        priority: finalIncident.priority,
        error: error instanceof Error ? error.message : String(error),
      });

      eventStreamManager.broadcast({
        type: 'incident:updated',
        incident: finalIncident,
        timestamp: Date.now(),
      });

      notificationQueue.enqueue(finalIncident, effectiveTraceId);

      return finalIncident;
    }
  }
}

export const triageWorkflow = new TriageWorkflowOrchestrator();
