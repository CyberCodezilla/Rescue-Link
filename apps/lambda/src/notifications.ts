import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
type Incident = { id: string; priority: string; category: string; description: string; peopleAffected: number; location: { lat: number; lng: number }; urgentNeeds: string[]; reporter?: { contactMethod?: string; contactValue?: string }; triage?: { suggestedAction?: string } };
const CONFIG = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN || '',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || '',
  SES_ALERT_RECIPIENT: process.env.SES_ALERT_RECIPIENT || '',
  PRIORITIES: (process.env.NOTIFICATION_PRIORITY_GATE || 'critical,high').split(',').map((s) => s.trim()),
};

const sns = new SNSClient({ region: CONFIG.AWS_REGION });
const ses = new SESClient({ region: CONFIG.AWS_REGION });

export interface NotificationEvent { incident: Incident; }
export interface NotificationResult { incident: Incident; snsSent: boolean; sesSent: boolean; }

export async function handler(event: NotificationEvent): Promise<NotificationResult> {
  const incident = event.incident;
  if (!CONFIG.PRIORITIES.includes(incident.priority)) {
    return { incident, snsSent: false, sesSent: false };
  }

  const smsText = `[RESCUELINK ${incident.priority.toUpperCase()} ALERT] ${incident.category.toUpperCase()} at Lat:${incident.location.lat}, Lng:${incident.location.lng}. ${incident.peopleAffected} affected. Directive: ${incident.triage?.suggestedAction || 'Awaiting dispatch'}`;
  let snsSent = false;
  let sesSent = false;

  const phoneNumber = incident.reporter?.contactMethod === 'phone' ? incident.reporter.contactValue : undefined;
  if (CONFIG.SNS_TOPIC_ARN || phoneNumber) {
    try {
      await sns.send(new PublishCommand({
        ...(CONFIG.SNS_TOPIC_ARN ? { TopicArn: CONFIG.SNS_TOPIC_ARN } : { PhoneNumber: phoneNumber }),
        Message: smsText,
        Subject: `RescueLink Emergency ${incident.priority.toUpperCase()} Alert`,
      }));
      snsSent = true;
    } catch (error) {
      console.error('[Lambda/Notifications] SNS failed:', error);
    }
  }

  try {
    await ses.send(new SendEmailCommand({
      Source: CONFIG.SES_FROM_EMAIL,
      Destination: { ToAddresses: [CONFIG.SES_ALERT_RECIPIENT] },
      Message: {
        Subject: { Data: `[RESCUELINK DISASTER ALERT] ${incident.priority.toUpperCase()}: ${incident.category}` },
        Body: { Html: { Data: `<div style="font-family:Arial"><h2>RESCUELINK EMERGENCY ${incident.priority.toUpperCase()} ALERT</h2><p><b>Incident:</b> ${incident.id}</p><p><b>Category:</b> ${incident.category}</p><p><b>Description:</b> ${incident.description}</p><p><b>Affected:</b> ${incident.peopleAffected}</p><p><b>Coordinates:</b> ${incident.location.lat}, ${incident.location.lng}</p><p><b>Directive:</b> ${incident.triage?.suggestedAction || 'Immediate tactical evaluation required.'}</p></div>` } },
      },
    }));
    sesSent = true;
  } catch (error) {
    console.error('[Lambda/Notifications] SES failed:', error);
  }

  return { incident, snsSent, sesSent };
}
