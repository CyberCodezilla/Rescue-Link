/**
 * Shared fetch client with exponential backoff & rate limit (HTTP 429) retry logic
 * for the Survivor Web Application.
 */

export interface FetchRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit & { signal?: AbortSignal },
  retryOptions: FetchRetryOptions = {}
): Promise<Response> {
  const maxRetries = retryOptions.maxRetries ?? 3;
  const initialDelayMs = retryOptions.initialDelayMs ?? 400;
  const backoffFactor = retryOptions.backoffFactor ?? 2;

  let attempt = 0;

  while (attempt <= maxRetries) {
    if (init?.signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }

    try {
      const response = await fetch(url, init);

      // HTTP 429 Rate Limit backoff
      if (response.status === 429) {
        if (attempt < maxRetries) {
          attempt++;
          const retryAfterHeader = response.headers.get('Retry-After');
          const baseDelay = retryAfterHeader
            ? (parseInt(retryAfterHeader, 10) * 1000) || (initialDelayMs * Math.pow(backoffFactor, attempt - 1))
            : (initialDelayMs * Math.pow(backoffFactor, attempt - 1));
          // Full decorrelated jitter (75% - 125% of base delay) to prevent thundering herd spikes
          const delayMs = Math.floor(baseDelay * 0.75 + Math.random() * (baseDelay * 0.5));

          console.warn(`[SurvivorAPI] Rate limited (429) on ${url}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms (jittered)...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }

      // Gateway/Server error backoff (502, 503, 504)
      if (response.status >= 502 && response.status <= 504) {
        if (attempt < maxRetries) {
          attempt++;
          const delayMs = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
          console.warn(`[SurvivorAPI] Server error (${response.status}) on ${url}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }

      return response;
    } catch (err) {
      if ((err as any)?.name === 'AbortError' || err instanceof DOMException || init?.signal?.aborted) {
        throw err;
      }

      if (attempt < maxRetries) {
        attempt++;
        const delayMs = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
        console.warn(`[SurvivorAPI] Network error on ${url}. Retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Request failed after ${maxRetries} retries`);
}
