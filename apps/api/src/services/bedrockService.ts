import {
  Incident,
  IncidentTriage,
  Priority,
  generateHeuristicTriage as sharedHeuristicTriage,
  buildBedrockTriagePrompt,
  parseBedrockTriageOutput,
} from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

export interface BedrockTriageResult {
  priority: Priority;
  triage: IncidentTriage;
}

export class BedrockService {
  private lastFailureAt: number | null = null;
  private circuitState: "CLOSED" | "OPEN" = "CLOSED";
  private failureCount = 0;
  private circuitOpenedAt: number | null = null;

  /**
   * Generates AI Triage assessment for an incoming SOS Incident.
   * Gracefully falls back to heuristic rule-based AI engine when AWS credentials are not provided.
   */
  async triageIncident(incident: Incident): Promise<BedrockTriageResult> {
    try {
      return await this.invokeBedrockSDK(incident);
    } catch (error) {
      console.warn('[BedrockService] AWS Bedrock call failed, using heuristic fallback:', error);
    }

    return this.generateHeuristicTriage(incident);
  }

  /** Cached Bedrock SDK client (from rescuer branch perf optimization). */
  private bedrockPromise: Promise<{ client: any; InvokeModelCommand: any }> | null = null;

  private async getBedrockClient() {
    if (!this.bedrockPromise) {
      this.bedrockPromise = (async () => {
        const pkg = '@aws-sdk/client-bedrock-runtime';
        const { BedrockRuntimeClient, InvokeModelCommand } = await import(pkg);
        const client = new BedrockRuntimeClient({ region: CONFIG.AWS_REGION });
        return { client, InvokeModelCommand };
      })();
    }
    return this.bedrockPromise;
  }

  private async invokeBedrockSDK(incident: Incident): Promise<BedrockTriageResult> {
    const { client, InvokeModelCommand } = await this.getBedrockClient();
    const prompt = buildBedrockTriagePrompt(incident);

    const input = {
      modelId: CONFIG.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: CONFIG.BEDROCK_MAX_TOKENS,
        temperature: CONFIG.BEDROCK_TEMPERATURE,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);

    return parseBedrockTriageOutput(responseBody);
  }

  /**
   * Intelligent heuristic AI fallback engine when offline or without active AWS keys.
   */
  public generateHeuristicTriage(incident: Incident): BedrockTriageResult {
    return sharedHeuristicTriage(incident, {
      criticalPeopleThreshold: CONFIG.TRIAGE_CRITICAL_PEOPLE_THRESHOLD,
      highPeopleThreshold: CONFIG.TRIAGE_HIGH_PEOPLE_THRESHOLD,
      criticalNeeds: CONFIG.TRIAGE_CRITICAL_NEEDS,
      criticalCategories: CONFIG.TRIAGE_CRITICAL_CATEGORIES,
      highNeeds: CONFIG.TRIAGE_HIGH_NEEDS,
      highCategories: CONFIG.TRIAGE_HIGH_CATEGORIES,
      heuristicConfidence: CONFIG.TRIAGE_HEURISTIC_CONFIDENCE,
    });
  }
  public getCircuitTelemetry(): {
    circuitState: "CLOSED" | "OPEN";
    consecutiveFailures: number;
    lastFailureAt: number | null;
    circuitOpenedAt: number | null;
  } {
    return {
      circuitState: this.circuitState,
      consecutiveFailures: this.failureCount,
      lastFailureAt: this.lastFailureAt,
      circuitOpenedAt: this.circuitOpenedAt,
    };
  }}

export const bedrockService = new BedrockService();
