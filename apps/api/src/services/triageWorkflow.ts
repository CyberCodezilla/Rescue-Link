import { Incident } from '@rescue-link/schema';
import { bedrockService } from './bedrockService';
import { incidentStore } from '../store/incidentStore';
import { eventStreamManager } from './eventStream';
import { notificationService } from './notificationService';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@smithy/signature-v4';
import { createHash } from 'node:crypto';
import { CONFIG } from '@rescue-link/config';

export class TriageWorkflowOrchestrator {
  private async startAwsWorkflow(incident: Incident): Promise<Incident | null> {
    if (!CONFIG.STATE_MACHINE_ARN) return null;

    class NodeSha256 {
      private hash = createHash('sha256');
      update(data: Uint8Array | string): void { this.hash.update(data); }
      async digest(): Promise<Uint8Array> { return this.hash.digest(); }
    }

    const credentials = await defaultProvider()();
    const url = new URL(`https://states.${CONFIG.AWS_REGION}.amazonaws.com/`);
    const body = JSON.stringify({ stateMachineArn: CONFIG.STATE_MACHINE_ARN, input: JSON.stringify({ incident }) });
    const request = {
      method: 'POST',
      protocol: url.protocol,
      hostname: url.hostname,
      path: url.pathname,
      query: {},
      headers: {
        host: url.hostname,
        'content-type': 'application/x-amz-json-1.0',
        'x-amz-target': 'AWSStepFunctions.StartExecution',
      },
      body,
    };
    const signer = new SignatureV4({
      credentials,
      region: CONFIG.AWS_REGION,
      service: 'states',
      sha256: NodeSha256 as any,
    });
    const signed = await signer.sign(request);
    const response = await fetch(url, {
      method: 'POST',
      headers: signed.headers as Record<string, string>,
      body,
    });
    const responseText = await response.text();
    if (!response.ok) throw new Error(`Step Functions StartExecution failed (${response.status}): ${responseText}`);
    const parsed = JSON.parse(responseText) as { executionArn?: string };
    console.log(`[TriageWorkflow] Step Functions execution started for ${incident.id}: ${parsed.executionArn || 'unknown'}`);
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
      return incident;
    }
  }
}

export const triageWorkflow = new TriageWorkflowOrchestrator();
