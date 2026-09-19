import { describe, it, expect } from 'vitest';
import { validateApiEnv, validateClientEnv } from '@rescue-link/config';
import { safeCompare } from '../src/middleware/auth';

describe('Security audit fixes', () => {
  it('fails closed for missing production API credentials', () => {
    expect(() => validateApiEnv({ NODE_ENV: 'production' })).toThrow();
  });

  it('requires a client API key in production', () => {
    expect(() => validateClientEnv({ NODE_ENV: 'production', RESCUE_LINK_API_ORIGIN: 'https://example.test' })).toThrow();
  });

  it('uses constant-time comparison semantics', () => {
    expect(safeCompare('secret-value', 'secret-value')).toBe(true);
    expect(safeCompare('secret-value', 'other-value')).toBe(false);
  });
});
