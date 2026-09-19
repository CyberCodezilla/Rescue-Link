import {
  Incident,
  formatSnsSmsMessage,
  formatSnsSubject,
  formatSesEmailSubject,
  formatSesEmailHtml,
} from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

export interface NotificationResult {
  snsSent: boolean;
  sesSent: boolean;
  mode: 'aws' | 'mock';
  message: string;
}

export class NotificationService {
  /**
   * Main entry point to send critical/high priority disaster notifications via Amazon SNS and SES.
   */
  async sendCriticalAlert(incident: Incident, _traceId?: string): Promise<NotificationResult> {
    if (!CONFIG.NOTIFICATION_PRIORITY_GATE.includes(incident.priority)) {
      return {
        snsSent: false,
        sesSent: false,
        mode: 'mock',
        message: `Incident priority '${incident.priority}' does not require critical notifications.`,
      };
    }

    const hasAwsRuntimeCredentials = Boolean(
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_PROFILE ||
      process.env.AWS_EXECUTION_ENV ||
      CONFIG.NODE_ENV === 'production'
    );

    if (hasAwsRuntimeCredentials) {
      try {
        const [snsResult, sesResult] = await Promise.all([
          this.sendSnsNotification(incident),
          this.sendSesNotification(incident),
        ]);
        return {
          snsSent: snsResult,
          sesSent: sesResult,
          mode: 'aws',
          message: `AWS notification result: SNS ${snsResult ? 'dispatched' : 'not dispatched'}; SES ${sesResult ? 'dispatched' : 'not dispatched'}.`,
        };
      } catch (error) {
        console.warn('[NotificationService] AWS alert dispatch error, using local fallback:', error);
      }
    }

    // Local logging is not delivery. Never report mock output as SNS/SES success.
    this.logMockNotification(incident);
    return {
      snsSent: false,
      sesSent: false,
      mode: 'mock',
      message: 'SNS/SES delivery was not performed. AWS notification credentials are unavailable or dispatch failed.'
    };
  }

  private snsPromise: Promise<{ snsClient: any; PublishCommand: any }> | null = null;
  private sesPromise: Promise<{ sesClient: any; SendEmailCommand: any }> | null = null;

  private async getSnsClient() {
    if (!this.snsPromise) {
      this.snsPromise = (async () => {
        const snsPkg = '@aws-sdk/client-sns';
        const { SNSClient, PublishCommand } = await import(snsPkg);
        const snsClient = new SNSClient({ region: CONFIG.AWS_REGION });
        return { snsClient, PublishCommand };
      })();
    }
    return this.snsPromise;
  }

  private async getSesClient() {
    if (!this.sesPromise) {
      this.sesPromise = (async () => {
        const sesPkg = '@aws-sdk/client-ses';
        const { SESClient, SendEmailCommand } = await import(sesPkg);
        const sesClient = new SESClient({ region: CONFIG.AWS_REGION });
        return { sesClient, SendEmailCommand };
      })();
    }
    return this.sesPromise;
  }

  /**
   * Send SNS SMS / Topic alert via AWS SDK v3
   */
  private async sendSnsNotification(incident: Incident): Promise<boolean> {
    try {
      const { snsClient, PublishCommand } = await this.getSnsClient();

      const command = new PublishCommand({
        TopicArn: CONFIG.SNS_TOPIC_ARN || undefined,
        PhoneNumber: incident.reporter?.contactMethod === 'phone' ? incident.reporter.contactValue : undefined,
        Message: formatSnsSmsMessage(incident),
        Subject: formatSnsSubject(incident),
      });

      await snsClient.send(command);
      console.log(`[NotificationService] AWS SNS SMS dispatched for incident ${incident.id}`);
      return true;
    } catch (err) {
      console.warn(`[NotificationService] AWS SNS publish failed for incident ${incident.id}:`, err);
      return false;
    }
  }

  /**
   * Send SES HTML Email alert via AWS SDK v3
   */
  private async sendSesNotification(incident: Incident): Promise<boolean> {
    try {
      const { sesClient, SendEmailCommand } = await this.getSesClient();

      const command = new SendEmailCommand({
        Source: CONFIG.SES_FROM_EMAIL,
        Destination: {
          ToAddresses: [CONFIG.SES_ALERT_RECIPIENT],
        },
        Message: {
          Subject: {
            Data: formatSesEmailSubject(incident),
          },
          Body: {
            Html: { Data: formatSesEmailHtml(incident) },
          },
        },
      });

      await sesClient.send(command);
      console.log(`[NotificationService] AWS SES Email dispatched for incident ${incident.id}`);
      return true;
    } catch (err) {
      console.warn(`[NotificationService] AWS SES email failed for incident ${incident.id}:`, err);
      return false;
    }
  }

  /**
   * Formatted Local Console Mock Notification Engine
   */
  private logMockNotification(incident: Incident): void {
    const divider = '=======================================================';
    console.log(`\n${divider}`);
    console.log(`📱 [LOCAL MOCK SNS SMS ALERT] (${incident.priority.toUpperCase()})`);
    console.log(`   To: ${incident.reporter?.contactValue || 'All Response Units'}`);
    console.log(`   Message: ${formatSnsSmsMessage(incident)}`);
    console.log(`📧 [LOCAL MOCK SES EMAIL DISPATCH]`);
    console.log(`   From: ${CONFIG.SES_FROM_EMAIL} -> To: ${CONFIG.SES_ALERT_RECIPIENT}`);
    console.log(`   Subject: ${formatSesEmailSubject(incident)}`);
    console.log(`${divider}\n`);
  }
}

export const notificationService = new NotificationService();
