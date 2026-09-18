import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  Incident,
  formatSnsSmsMessage,
  formatSnsSubject,
  formatSesEmailSubject,
  formatSesEmailHtml,
} from '@rescue-link/schema';
import { parseListEnv } from '@rescue-link/config';

const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN || '',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || '',
  SES_ALERT_RECIPIENT: process.env.SES_ALERT_RECIPIENT || '',
  PRIORITIES: parseListEnv(process.env.NOTIFICATION_PRIORITY_GATE, 'critical,high'),
};

const sns = new SNSClient({ region: CONFIG.AWS_REGION });
const ses = new SESClient({ region: CONFIG.AWS_REGION });

export interface NotificationEvent {
  incident: Incident;
}

export interface NotificationResult {
  incident: Incident;
  snsSent: boolean;
  sesSent: boolean;
}

export async function handler(event: NotificationEvent): Promise<NotificationResult> {
  const incident = event.incident;
  if (!CONFIG.PRIORITIES.includes(incident.priority)) {
    return { incident, snsSent: false, sesSent: false };
  }

  const smsText = formatSnsSmsMessage(incident);
  let snsSent = false;
  let sesSent = false;

  const phoneNumber = incident.reporter?.contactMethod === 'phone' ? incident.reporter.contactValue : undefined;
  if (CONFIG.SNS_TOPIC_ARN || phoneNumber) {
    try {
      await sns.send(
        new PublishCommand({
          ...(CONFIG.SNS_TOPIC_ARN ? { TopicArn: CONFIG.SNS_TOPIC_ARN } : { PhoneNumber: phoneNumber }),
          Message: smsText,
          Subject: formatSnsSubject(incident),
        })
      );
      snsSent = true;
    } catch (error) {
      console.error('[Lambda/Notifications] SNS failed:', error);
    }
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: CONFIG.SES_FROM_EMAIL,
        Destination: { ToAddresses: [CONFIG.SES_ALERT_RECIPIENT] },
        Message: {
          Subject: { Data: formatSesEmailSubject(incident) },
          Body: { Html: { Data: formatSesEmailHtml(incident) } },
        },
      })
    );
    sesSent = true;
  } catch (error) {
    console.error('[Lambda/Notifications] SES failed:', error);
  }

  return { incident, snsSent, sesSent };
}
