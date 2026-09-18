import { Incident } from '@rescue-link/schema';
import { notificationService, NotificationResult } from './notificationService';

export interface NotificationJob {
  id: string;
  incident: Incident;
  enqueuedAt: number;
  attempts: number;
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
  enqueue(incident: Incident): void {
    const job: NotificationJob = {
      id: `job-${incident.id}-${Date.now()}`,
      incident,
      enqueuedAt: Date.now(),
      attempts: 0,
    };

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

      try {
        job.attempts++;
        await notificationService.sendCriticalAlert(job.incident);
        this.completedCount++;
      } catch (err) {
        console.error(`[NotificationQueue] Failed notification job ${job.id} (attempt ${job.attempts}):`, err);
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
