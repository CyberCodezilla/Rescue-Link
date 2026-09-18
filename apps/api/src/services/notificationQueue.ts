import { Incident } from '@rescue-link/schema';
import { notificationService, NotificationResult } from './notificationService';
import { LifeSafetyTracer } from './lifeSafetyTracer';

export interface NotificationJob {
  id: string;
  incident: Incident;
  enqueuedAt: number;
  attempts: number;
  traceId?: string;
}

export class NotificationQueue {
  private queue: NotificationJob[] = [];
  private isProcessing = false;
  private completedCount = 0;
  private failedCount = 0;

  /**
   * Enqueues an incident for background SNS/SES notification dispatch.
   * Immediately returns to avoid blocking the survivor HTTP response path.
   */
  enqueue(incident: Incident, traceId?: string): void {
    const effectiveTraceId = traceId || LifeSafetyTracer.createTraceId(incident.id);
    const job: NotificationJob = {
      id: `job-${incident.id}-${Date.now()}`,
      incident,
      enqueuedAt: Date.now(),
      attempts: 0,
      traceId: effectiveTraceId,
    };

    LifeSafetyTracer.log({
      traceId: effectiveTraceId,
      incidentId: incident.id,
      step: 'QUEUE_ENQUEUE',
      timestamp: Date.now(),
      status: 'SUCCESS',
      priority: incident.priority,
      metadata: { jobId: job.id },
    });

    this.queue.push(job);
    this.processQueue().catch((err) => {
      console.error('[NotificationQueue] Error processing background job:', err);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      const startTime = Date.now();
      const effectiveTraceId = job.traceId || LifeSafetyTracer.createTraceId(job.incident.id);

      LifeSafetyTracer.log({
        traceId: effectiveTraceId,
        incidentId: job.incident.id,
        step: 'NOTIFICATION_DISPATCH',
        timestamp: startTime,
        status: 'STARTED',
        priority: job.incident.priority,
        metadata: { jobId: job.id, attempt: job.attempts + 1 },
      });

      try {
        job.attempts++;
        const result = await notificationService.sendCriticalAlert(job.incident, effectiveTraceId);
        this.completedCount++;

        LifeSafetyTracer.log({
          traceId: effectiveTraceId,
          incidentId: job.incident.id,
          step: 'NOTIFICATION_COMPLETE',
          timestamp: Date.now(),
          durationMs: Date.now() - startTime,
          status: 'SUCCESS',
          priority: job.incident.priority,
          mode: result.mode,
          metadata: { snsSent: result.snsSent, sesSent: result.sesSent, attempts: job.attempts },
        });
      } catch (err) {
        const durationMs = Date.now() - startTime;
        console.error(`[NotificationQueue] Failed notification job ${job.id} (attempt ${job.attempts}):`, err);

        LifeSafetyTracer.log({
          traceId: effectiveTraceId,
          incidentId: job.incident.id,
          step: 'NOTIFICATION_COMPLETE',
          timestamp: Date.now(),
          durationMs,
          status: 'FAILED',
          error: err instanceof Error ? err.message : String(err),
          metadata: { jobId: job.id, attempt: job.attempts },
        });

        if (job.attempts < 2) {
          this.queue.push(job); // Re-queue once for transient retry
        } else {
          this.failedCount++;
        }
      }
    }

    this.isProcessing = false;
  }

  getStats() {
    return {
      pendingJobs: this.queue.length,
      isProcessing: this.isProcessing,
      completedJobs: this.completedCount,
      failedJobs: this.failedCount,
    };
  }
}

export const notificationQueue = new NotificationQueue();
