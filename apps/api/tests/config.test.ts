import { describe, it, expect } from 'vitest';
import { validateApiEnv, validateClientEnv, ApiEnvSchema, ClientEnvSchema } from '@rescue-link/config';

describe('Centralized Environment Schema Validation', () => {
  it('validates default API configuration correctly when environment variables are missing', () => {
    const config = validateApiEnv({});
    expect(config.PORT).toBe(3001);
    expect(config.NODE_ENV).toBe('development');
    expect(config.AWS_REGION).toBe('us-east-1');
    expect(config.BEDROCK_MAX_TOKENS).toBe(300);
    expect(config.BEDROCK_TIMEOUT_MS).toBe(3500);
    expect(config.API_KEY).toBe('rescuelink-responder-key-2026');
  });

  it('parses and coerces custom env overrides correctly', () => {
    const customEnv = {
      PORT: '8080',
      NODE_ENV: 'production',
      API_KEY: 'prod-secure-key-999',
      AWS_REGION: 'us-west-2',
      BEDROCK_MAX_TOKENS: '500',
      BEDROCK_TIMEOUT_MS: '5000',
      USE_LOCAL_MOCK_STORE: 'true',
      NOTIFICATION_PRIORITY_GATE: 'critical,high,medium',
    };

    const config = validateApiEnv(customEnv);
    expect(config.PORT).toBe(8080);
    expect(config.NODE_ENV).toBe('production');
    expect(config.API_KEY).toBe('prod-secure-key-999');
    expect(config.AWS_REGION).toBe('us-west-2');
    expect(config.BEDROCK_MAX_TOKENS).toBe(500);
    expect(config.BEDROCK_TIMEOUT_MS).toBe(5000);
    expect(config.USE_LOCAL_MOCK_STORE).toBe(true);
    expect(config.NOTIFICATION_PRIORITY_GATE).toEqual(['critical', 'high', 'medium']);
  });

  it('requires explicit non-default API_KEY in production mode', () => {
    const prodWithoutApiKey = {
      NODE_ENV: 'production',
    };
    expect(() => validateApiEnv(prodWithoutApiKey as any)).toThrow('API_KEY environment variable must be explicitly defined in production');
  });

  it('fails validation on invalid enum or malformed numerical input', () => {
    const invalidEnv = {
      PORT: 'not-a-number',
      NODE_ENV: 'invalid_env_name',
    };

    expect(() => validateApiEnv(invalidEnv as any)).toThrow();
  });

  it('validates client configuration schema', () => {
    const clientConfig = validateClientEnv({
      RESCUE_LINK_API_ORIGIN: 'http://13.218.236.205:3001',
      NEXT_PUBLIC_API_KEY: 'custom-key-123',
    });

    expect(clientConfig.RESCUE_LINK_API_ORIGIN).toBe('http://13.218.236.205:3001');
    expect(clientConfig.NEXT_PUBLIC_API_KEY).toBe('custom-key-123');
  });
});
