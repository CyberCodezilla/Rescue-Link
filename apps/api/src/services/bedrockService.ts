import {
  Incident,
  IncidentTriage,
  Priority,
  generateHeuristicTriage as sharedHeuristicTriage,
  buildBedrockTriagePrompt,
  parseBedrockTriageOutput,
} from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';
import { LifeSafetyTracer } from './lifeSafetyTracer';

export interface BedrockTriageResult {
  priority: Priority;
  triage: IncidentTriage;
}

export class BedrockService {
  private lastFailureAt: number | null = null;
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private halfOpenProbeInFlight = false;
  private failureCount = 0;
  private circuitOpenedAt: number | null = null;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT_MS = 30000;

  /**
   * Generates AI Triage assessment for an incoming SOS Incident.
   * Gracefully falls back to heuristic rule-based AI engine when AWS credentials are not provided or circuit is open.
   */
  async triageIncident(incident: Incident, traceId?: string): Promise<BedrockTriageResult> {
    const effectiveTraceId = traceId || LifeSafetyTracer.createTraceId(incident.id);
    const now = Date.now();

    if (this.circuitState === 'OPEN') {
      if (this.circuitOpenedAt && now - this.circuitOpenedAt > this.RESET_TIMEOUT_MS) {
        this.circuitState = 'HALF_OPEN';
        this.halfOpenProbeInFlight = false;
      } else {
        LifeSafetyTracer.log({
          traceId: effectiveTraceId,
          incidentId: incident.id,
          step: 'BEDROCK_TRIAGE',
          timestamp: now,
          status: 'WARNING',
          metadata: { circuitState: 'OPEN', reason: 'Circuit open cooldown active' },
        });
        return this.generateHeuristicTriage(incident);
      }
    }

    if (this.circuitState === 'HALF_OPEN') {
      if (this.halfOpenProbeInFlight) {
        return this.generateHeuristicTriage(incident);
      }
      this.halfOpenProbeInFlight = true;
    }

    LifeSafetyTracer.log({
      traceId: effectiveTraceId,
      incidentId: incident.id,
      step: 'BEDROCK_TRIAGE',
      timestamp: now,
      status: 'STARTED',
    });

    try {
      const result = await this.invokeBedrockSDK(incident);
      this.failureCount = 0;
      this.circuitState = 'CLOSED';
      this.halfOpenProbeInFlight = false;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureAt = Date.now();
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.circuitState = 'OPEN';
        this.circuitOpenedAt = Date.now();
        this.halfOpenProbeInFlight = false;
      }

      console.warn('[BedrockService] AWS Bedrock call failed, using heuristic fallback:', error);
      LifeSafetyTracer.log({
        traceId: effectiveTraceId,
        incidentId: incident.id,
        step: 'BEDROCK_TRIAGE',
        timestamp: Date.now(),
        status: 'WARNING',
        error: error instanceof Error ? error.message : String(error),
        metadata: { failureCount: this.failureCount, circuitState: this.circuitState },
      });
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
    if (CONFIG.USE_LOCAL_MOCK_STORE || process.env.NODE_ENV === 'test') {
      if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE && !process.env.AWS_EXECUTION_ENV) {
        throw new Error('AWS Bedrock credentials not provided in test/mock mode');
      }
    }

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
    const response = await client.send(command, { abortSignal: AbortSignal.timeout(CONFIG.BEDROCK_TIMEOUT_MS) });
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
    circuitState: "CLOSED" | "OPEN" | "HALF_OPEN";
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
