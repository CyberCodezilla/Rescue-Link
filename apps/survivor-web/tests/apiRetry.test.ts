import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry } from '../src/lib/api';

describe('Survivor Client API Retry Logic', () => {
  it('retries on HTTP 429 Rate Limit responses with exponential backoff and succeeds when server responds 200', async () => {
    let calls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Retry-After': '0' },
        });
      }
      return new Response(JSON.stringify({ id: 'srv-100', status: 'new' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    const response = await fetchWithRetry('/api/incidents', {}, { maxRetries: 2, initialDelayMs: 10 });
    expect(response.status).toBe(200);
    expect(calls).toBe(2);

    vi.unstubAllGlobals();
  });

  it('exhausts retries and returns final HTTP 429 response when server stays rate-limited', async () => {
    const mockFetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Retry-After': '0' },
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    const response = await fetchWithRetry('/api/incidents', {}, { maxRetries: 2, initialDelayMs: 10 });
    expect(response.status).toBe(429);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.unstubAllGlobals();
  });
});
