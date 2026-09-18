import { Incident } from '@rescue-link/schema';
import { bedrockService } from './bedrockService';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from './eventStream';
import { notificationService } from './notificationService';
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
   * and triggers Amazon SNS SMS / SES Email notifications for critical/high incidents.
   */
  async runTriage(incident: Incident): Promise<Incident> {
    if (CONFIG.STATE_MACHINE_ARN) {
      try {
        const started = await this.startAwsWorkflow(incident);
        if (started) return started;
      } catch (error) {
        console.error(`[TriageWorkflow] Step Functions start failed for ${incident.id}, using local fallback:`, error);
      }
    }

    try {
      const triageResult = await bedrockService.triageIncident(incident);

      const updated = await incidentStore.update(incident.id, {
        priority: triageResult.priority,
        triage: {
          ...(incident.triage || {}),
          ...triageResult.triage,
        },
      });

      const finalIncident = updated || incident;

      // Broadcast updated incident state via SSE
      eventStreamManager.broadcast({
        type: 'incident:updated',
        incident: finalIncident,
        timestamp: Date.now(),
      });

      // Dispatch emergency notifications (SNS/SES) if priority is critical or high
      notificationService.sendCriticalAlert(finalIncident).catch((err) => {
        console.error(`[TriageWorkflow] Notification trigger failed for ${finalIncident.id}:`, err);
      });

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

      eventStreamManager.broadcast({
        type: 'incident:updated',
        incident: finalIncident,
        timestamp: Date.now(),
      });

      return finalIncident;
    }
  }
}

export const triageWorkflow = new TriageWorkflowOrchestrator();
