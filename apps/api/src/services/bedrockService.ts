import { Incident, IncidentTriage, Priority } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

const hasAny = (arr: string[], keywords: string[]): boolean =>
  arr.some((item) => keywords.includes(item));

export interface BedrockTriageResult {
  priority: Priority;
  triage: IncidentTriage;
}

export interface CircuitTelemetry {
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  consecutiveFailures: number;
}

export class BedrockService {
  private bedrockPromise: Promise<{
    client: any;
    InvokeModelCommand: any;
  }> | null = null;

  private consecutiveFailures = 0;

  async triageIncident(incident: Incident): Promise<BedrockTriageResult> {
    try {
      const result = await this.invokeBedrockSDK(incident);
      this.consecutiveFailures = 0;
      return result;
    } catch (error) {
      this.consecutiveFailures += 1;
      console.warn(
        '[BedrockService] AWS Bedrock call failed, using heuristic fallback:',
        error
      );
      return this.generateHeuristicTriage(incident);
    }
  }

  getCircuitTelemetry(): CircuitTelemetry {
    return {
      circuitState: 'CLOSED',
      failureCount: this.consecutiveFailures,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  public generateHeuristicTriage(incident: Incident): BedrockTriageResult {
    let priority: Priority = 'medium';
    let suggestedAction =
      'Stay calm, keep location service active, and await rescue team dispatch.';
    let summary = `Triage completed for ${incident.category} alert.`;
    let reasoning = 'Standard distress priority based on reported needs.';

    const needs = incident.urgentNeeds || [];
    const count = incident.peopleAffected || 1;

    const hasCriticalNeed = hasAny(
      needs,
      CONFIG.TRIAGE_CRITICAL_NEEDS
    );
    const hasCriticalCategory =
      CONFIG.TRIAGE_CRITICAL_CATEGORIES.includes(incident.category);
    const hasHighNeed = hasAny(needs, CONFIG.TRIAGE_HIGH_NEEDS);
    const hasHighCategory =
      CONFIG.TRIAGE_HIGH_CATEGORIES.includes(incident.category);

    if (
      hasCriticalNeed ||
      count >= CONFIG.TRIAGE_CRITICAL_PEOPLE_THRESHOLD ||
      hasCriticalCategory
    ) {
      priority = 'critical';
      suggestedAction =
        incident.category === 'flood'
          ? 'URGENT: Move to roof/highest level immediately. Signal rescue boats with bright cloth.'
          : incident.category === 'fire'
            ? 'CRITICAL: Stay low beneath smoke. Cover face with wet cloth and move away from fire line.'
            : 'CRITICAL: Prepare for immediate medical evacuation. Keep air passages clear.';
      summary = `CRITICAL DISTRESS: ${count} people affected. High casualty risk.`;
      reasoning = `Assigned CRITICAL priority due to urgent needs [${needs.join(', ')}] and ${count} casualties reported.`;
    } else if (
      hasHighNeed ||
      hasHighCategory ||
      count >= CONFIG.TRIAGE_HIGH_PEOPLE_THRESHOLD
    ) {
      priority = 'high';
      suggestedAction =
        incident.category === 'landslide'
          ? 'HIGH HAZARD: Move perpendicular to landslide flow direction toward stable rocky ground.'
          : 'High priority alert registered. Prepare emergency supply pickup zone.';
      summary =
        `HIGH PRIORITY: ${incident.category} incident requiring active responder intervention.`;
      reasoning =
        `Assigned HIGH priority based on hazard classification (${incident.category}) and survivor population.`;
    } else {
      priority = 'medium';
      suggestedAction =
        'Emergency report logged. Conserve device battery and keep emergency whistle ready.';
      summary = `Standard ${incident.category} alert queued for responder review.`;
      reasoning =
        'Assigned MEDIUM priority for stable non-life-threatening assistance request.';
    }

    return {
      priority,
      triage: {
        suggestedAction,
        summary,
        reasoning,
        confidence: CONFIG.TRIAGE_HEURISTIC_CONFIDENCE,
      },
    };
  }

  private async getBedrockClient() {
    if (!this.bedrockPromise) {
      this.bedrockPromise = (async () => {
        const pkg = '@aws-sdk/client-bedrock-runtime';
        const { BedrockRuntimeClient, InvokeModelCommand } =
          await import(pkg);
        const client = new BedrockRuntimeClient({
          region: CONFIG.AWS_REGION,
          requestHandler: undefined,
        });
        return { client, InvokeModelCommand };
      })();
    }
    return this.bedrockPromise;
  }

  private async invokeBedrockSDK(
    incident: Incident
  ): Promise<BedrockTriageResult> {
    const { client, InvokeModelCommand } = await this.getBedrockClient();

    const prompt = `You are an expert emergency dispatch AI for RescueLink. Triage the following disaster SOS report:
Category: ${incident.category}
Description: ${incident.description}
People Affected: ${incident.peopleAffected}
Urgent Needs: ${incident.urgentNeeds.join(', ') || 'None specified'}
Location: Lat ${incident.location.lat}, Lng ${incident.location.lng}

Respond ONLY with a valid JSON object:
{
  "priority": "critical" | "high" | "medium" | "low",
  "suggestedAction": "Immediate survival directive for survivor",
  "summary": "Brief dispatcher summary",
  "reasoning": "Reason for priority assignment",
  "confidence": 0.95
}`;

    const command = new InvokeModelCommand({
      modelId: CONFIG.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: CONFIG.BEDROCK_MAX_TOKENS,
        temperature: CONFIG.BEDROCK_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
      }),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(responseBody);
    const aiText =
      parsed.content?.[0]?.text ||
      parsed.completion ||
      parsed.output?.text ||
      responseBody;

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Bedrock output');
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      priority: data.priority || 'high',
      triage: {
        suggestedAction:
          data.suggestedAction || 'Move to high ground immediately.',
        summary:
          data.summary ||
          `AI Triaged ${incident.category} distress call.`,
        reasoning:
          data.reasoning ||
          'Evaluated severity based on reported casualty risk.',
        confidence:
          typeof data.confidence === 'number' ? data.confidence : 0.9,
      },
    };
  }
}

export const bedrockService = new BedrockService();
