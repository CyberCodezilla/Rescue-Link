import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '@rescue-link/config';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    next();
    return;
  }

  const providedKey = req.header("x-api-key");

  if (!providedKey || providedKey !== configuredKey) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  next();
}
