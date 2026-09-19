import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual, createHash } from 'node:crypto';
import { CONFIG } from '@rescue-link/config';

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = CONFIG.API_KEY || process.env.API_KEY || 'rescuelink-responder-key-2026';
  const providedKey = req.header('x-api-key');

  if (!providedKey || !safeCompare(providedKey, configuredKey)) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  next();
}
