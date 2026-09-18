type Incident = Record<string, unknown> & { id: string };
const CONFIG = {
  CALLBACK_URL: process.env.RESCUELINK_CALLBACK_URL || '',
  CALLBACK_SECRET: process.env.LAMBDA_CALLBACK_SECRET || '',
};

export interface CallbackEvent {
  incident: Incident;
  snsSent?: boolean;
  sesSent?: boolean;
  triageSource?: string;
}

export async function handler(event: CallbackEvent) {
  if (!CONFIG.CALLBACK_URL) return { delivered: false, reason: 'callback-url-not-configured' };
  const response = await fetch(CONFIG.CALLBACK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-rescuelink-callback-secret': CONFIG.CALLBACK_SECRET,
    },
    body: JSON.stringify(event),
  });
  if (!response.ok) throw new Error(`Callback failed with HTTP ${response.status}`);
  return { delivered: true };
}
