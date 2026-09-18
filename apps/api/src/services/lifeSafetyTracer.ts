/**
 * Structured Telemetry & Tracing Logger for RescueLink Life-Safety Critical Path:
 * (Incidents Route -> TriageWorkflow -> BedrockService -> NotificationQueue -> NotificationService)
 */

export interface LifeSafetyTraceContext {
  traceId: string;
  incidentId: string;
  step: 'ROUTE_RECVD' | 'TRIAGE_START' | 'BEDROCK_TRIAGE' | 'TRIAGE_COMPLETE' | 'QUEUE_ENQUEUE' | 'NOTIFICATION_DISPATCH' | 'NOTIFICATION_COMPLETE';
  timestamp: number;
  durationMs?: number;
  priority?: string;
  mode?: string;
  status: 'STARTED' | 'SUCCESS' | 'WARNING' | 'FAILED';
  error?: string;
  metadata?: Record<string, unknown>;
}

export class LifeSafetyTracer {
  /**
   * Generates a unique correlation trace ID for tracking a distress alert through the pipeline.
   */
  static createTraceId(incidentId: string): string {
    return `trace-${incidentId.slice(0, 8)}-${Date.now()}`;
  }

  /**
   * Emits structured JSON telemetry log for real-time CloudWatch / Datadog ingestion.
   */
  static log(ctx: LifeSafetyTraceContext): void {
    const payload = {
      tag: '[LIFE_SAFETY_TRACE]',
      ...ctx,
      isoTime: new Date(ctx.timestamp).toISOString(),
    };

    if (ctx.status === 'FAILED') {
      console.error(JSON.stringify(payload));
    } else if (ctx.status === 'WARNING') {
      console.warn(JSON.stringify(payload));
    } else {
      console.info(JSON.stringify(payload));
    }
  }
}
