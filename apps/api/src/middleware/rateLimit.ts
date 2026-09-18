import rateLimit from 'express-rate-limit';
import { CONFIG } from '@rescue-link/config';

export const sosRateLimit = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX_SOS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

export const generalRateLimit = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
