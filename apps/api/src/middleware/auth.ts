import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual, createHash } from 'node:crypto';
import { CONFIG } from '@rescue-link/config';

export function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a, 'utf8').digest();
  const hashB = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(hashA, hashB);
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // Allow preflight OPTIONS requests without API key check
  if (req.method === 'OPTIONS') {
    return next();
  }

  const configuredKey = CONFIG.API_KEY || process.env.API_KEY || (CONFIG.NODE_ENV !== 'production' ? 'rescuelink-responder-key-2026' : '');
  if (!configuredKey) {
    res.status(503).json({ error: 'API authentication is not configured' });
    return;
  }

  const authHeader = req.header('authorization');
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const rawKey =
    req.header('x-api-key') ||
    req.header('X-API-Key') ||
    bearerKey ||
    (typeof req.query?.apiKey === 'string' ? req.query.apiKey : undefined);

  // Handle case where HTTP parser combined duplicate headers with a comma
  const providedKey = rawKey?.includes(',') ? rawKey.split(',')[0].trim() : rawKey;

  if (!providedKey || !safeCompare(providedKey, configuredKey)) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  next();
}
