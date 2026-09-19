import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual, createHash } from 'node:crypto';
import { CONFIG } from '@rescue-link/config';

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // Allow preflight OPTIONS requests without API key check
  if (req.method === 'OPTIONS') {
    return next();
  }

  const configuredKey = CONFIG.API_KEY || process.env.API_KEY || 'rescuelink-responder-key-2026';
  const authHeader = req.header('authorization');
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const providedKey =
    req.header('x-api-key') ||
    req.header('X-API-Key') ||
    bearerKey ||
    (typeof req.query?.apiKey === 'string' ? req.query.apiKey : undefined);

  if (!providedKey || !safeCompare(providedKey, configuredKey)) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  next();
}
