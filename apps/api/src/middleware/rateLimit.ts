import rateLimit from 'express-rate-limit';
import { CONFIG } from '@rescue-link/config';

/**
 * Public SOS Endpoint Rate Limiter.
 * Prevents automated DDoS attacks, Bedrock AI cost exhaustion, and SMS/Email spam.
 */
export const sosRateLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX_SOS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many SOS submissions from this IP. Please wait before submitting another report.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * General API Rate Limiter for public read routes.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
