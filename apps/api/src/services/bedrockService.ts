import { Incident, IncidentTriage, Priority } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

/** Helper: checks if any element of `arr` is present in `keywords`. */
const hasAny = (arr: string[], keywords: string[]): boolean =>
  arr.some((item) => keywords.includes(item));

export interface BedrockTriageResult {
  priority: Priority;
  triage: IncidentTriage;
}

export class BedrockService {
  private circuitOpen = false;
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_COOLDOWN_MS = 60000;

  /**
   * Returns current Bedrock AI circuit breaker telemetry.
   */
  public getCircuitTelemetry() {
    this.checkCircuitReset();
    return {
      circuitState: this.circuitOpen ? ('OPEN' as const) : ('CLOSED' as const),
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  private checkCircuitReset(): void {
    if (this.circuitOpen && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime > this.RESET_COOLDOWN_MS) {
        console.log('[BedrockService] Circuit breaker cooldown elapsed. Resetting circuit to CLOSED state.');
        this.circuitOpen = false;
        this.consecutiveFailures = 0;
      }
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.circuitOpen = false;
  }

  private recordFailure(err: unknown): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.circuitOpen = true;
      console.error(
        `🚨 [BedrockService] Circuit breaker TRIPPED to OPEN state due to ${this.consecutiveFailures} consecutive failures. Cooldown: ${this.RESET_COOLDOWN_MS / 1000}s. Error:`,
        err
      );
    }
  }

  /**
   * Helper: Timeout wrapper to guarantee Bedrock AI calls resolve within CONFIG.BEDROCK_TIMEOUT_MS.
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Bedrock API call timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });
  }

  /**
   * Helper: Exponential Backoff & Retry wrapper for transient Bedrock calls.
   */
  private async retryWithBackoff<T>(fn: () => Promise<T>, retries = 2, delayMs = 250): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt > retries) throw err;
        const backoff = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[BedrockService] Transient error (attempt ${attempt}/${retries + 1}). Retrying in ${backoff}ms...`);
        await new Promise((res) => setTimeout(res, backoff));
      }
    }
    throw new Error('Retry failed');
  }

  /**
   * Generates AI Triage assessment for an incoming SOS Incident.
   * Gracefully falls back to heuristic rule-based AI engine when AWS credentials are not provided, circuit is open, or AI call times out.
   */
  async triageIncident(incident: Incident): Promise<BedrockTriageResult> {
    this.checkCircuitReset();

    const hasAwsKeys = Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE);

    if (!hasAwsKeys) {
      console.info(`[BedrockService] TRIAGE_MODE: 'heuristic_fallback' | Reason: AWS credentials absent | Incident: ${incident.id}`);
      return this.generateHeuristicTriage(incident);
    }

    if (this.circuitOpen) {
      console.warn(`[BedrockService] TRIAGE_MODE: 'heuristic_fallback' | Reason: Circuit breaker is OPEN | Incident: ${incident.id}`);
      return this.generateHeuristicTriage(incident);
    }

    try {
      const timeoutMs = CONFIG.BEDROCK_TIMEOUT_MS || 3500;
      const result = await this.withTimeout(
        this.retryWithBackoff(() => this.invokeBedrockSDK(incident)),
        timeoutMs
      );
      this.recordSuccess();
      console.info(`[BedrockService] TRIAGE_MODE: 'bedrock' | Model: ${CONFIG.BEDROCK_MODEL_ID} | Priority: ${result.priority} | Incident: ${incident.id}`);
      return result;
    } catch (error) {
      this.recordFailure(error);
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      console.warn(
        `[BedrockService] TRIAGE_MODE: 'heuristic_fallback' | Reason: ${isTimeout ? 'Bedrock API call timed out' : 'Bedrock SDK invocation failed'} | Incident: ${incident.id}`,
        error
      );
      return this.generateHeuristicTriage(incident);
    }
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

    const prompt = `Human: You are an expert emergency dispatch AI for RescueLink. Triage the following disaster SOS report:
Category: ${incident.category}
Description: ${incident.description}${incident.audioBlob ? '\nSpoken Audio Distress SOS: Attached (Recorded voice message from survivor)' : ''}
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
}
Assistant:`;

    const input = {
      modelId: CONFIG.BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt,
        max_tokens_to_sample: CONFIG.BEDROCK_MAX_TOKENS,
        temperature: CONFIG.BEDROCK_TEMPERATURE,
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(responseBody);
    const aiText = parsed.completion || parsed.output?.text || responseBody;

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Bedrock output');
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      priority: data.priority || 'high',
      triage: {
        suggestedAction: data.suggestedAction || 'Move to high ground immediately.',
        summary: data.summary || `AI Triaged ${incident.category} distress call.`,
        reasoning: data.reasoning || 'Evaluated severity based on reported casualty risk.',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
      },
    };
  }

  /**
   * Intelligent heuristic AI fallback engine when offline or without active AWS keys.
   */
  private generateHeuristicTriage(incident: Incident): BedrockTriageResult {
    let priority: Priority = 'medium';
    let suggestedAction = 'Stay calm, keep location service active, and await rescue team dispatch.';
    let summary = `Triage completed for ${incident.category} alert.`;
    let reasoning = 'Standard distress priority based on reported needs.';

    const needs = incident.urgentNeeds || [];
    const count = incident.peopleAffected || 1;

    const hasCriticalNeed = hasAny(needs, CONFIG.TRIAGE_CRITICAL_NEEDS);
    const hasCriticalCategory = CONFIG.TRIAGE_CRITICAL_CATEGORIES.includes(incident.category);
    const hasHighNeed = hasAny(needs, CONFIG.TRIAGE_HIGH_NEEDS);
    const hasHighCategory = CONFIG.TRIAGE_HIGH_CATEGORIES.includes(incident.category);

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
      summary = `HIGH PRIORITY: ${incident.category} incident requiring active responder intervention.`;
      reasoning = `Assigned HIGH priority based on hazard classification (${incident.category}) and survivor population.`;
    } else {
      priority = 'medium';
      suggestedAction = 'Emergency report logged. Conserve device battery and keep emergency whistle ready.';
      summary = `Standard ${incident.category} alert queued for responder review.`;
      reasoning = 'Assigned MEDIUM priority for stable non-life-threatening assistance request.';
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
}

export const bedrockService = new BedrockService();
