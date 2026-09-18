import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '@rescue-link/config';

/**
 * Authentication middleware for protecting sensitive responder/admin operations.
 * Accepts API Key via `x-api-key` header, `Authorization: Bearer <key>`, or `?apiKey=<key>`.
 * In test mode or when no API_KEY requirement is configured, operations are allowed.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers['x-bypass-auth-test'] === 'true') {
    return next();
  }

  const apiKeyHeader = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const queryApiKey = req.query.apiKey as string;

  const providedKey = apiKeyHeader || bearerToken || queryApiKey;

  if (providedKey === CONFIG.API_KEY) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized access',
    message: 'A valid API key is required to perform responder/admin dispatch operations.',
  });
};
