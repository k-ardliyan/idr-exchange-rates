type PoliteOptions = RequestInit & {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  timeoutMs?: number;
};

const DEFAULT_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomJitter = (minMs: number, maxMs: number) =>
  Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

const isRetryableStatus = (status: number) =>
  status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

const parseRetryAfter = (headerValue: string | null): number | null => {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = new Date(headerValue);
  if (!Number.isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return null;
};

export const politeFetch = async (
  url: string,
  options: PoliteOptions = {}
): Promise<Response> => {
  const {
    retries = 3,
    minDelayMs = 300,
    maxDelayMs = 1200,
    backoffMs = 500,
    maxBackoffMs = 8000,
    timeoutMs = 10000,
    headers,
    ...init
  } = options;

  const mergedHeaders: HeadersInit = {
    ...DEFAULT_HEADERS,
    ...(headers || {}),
  };

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    attempt += 1;

    // Friendly pre-request delay with jitter
    await sleep(randomJitter(minDelayMs, maxDelayMs));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        redirect: "follow",
        ...init,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      if (response.ok) {
        clearTimeout(timer);
        return response;
      }

      if (!isRetryableStatus(response.status) || attempt > retries) {
        const bodySnippet = await response.text().catch(() => "");
        clearTimeout(timer);
        const upstreamError = Object.assign(
          new Error(
            `Request failed with status ${response.status}: ${bodySnippet.slice(
              0,
              200
            )}`
          ),
          { name: "UpstreamHttpError", status: response.status }
        );
        throw upstreamError;
      }

      // Compute wait time (Retry-After if present, else exponential backoff with jitter)
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterMs = parseRetryAfter(retryAfterHeader);
      const backoff = Math.min(maxBackoffMs, backoffMs * 2 ** (attempt - 1));
      const jitter = randomJitter(100, 500);
      const waitMs = retryAfterMs ?? backoff + jitter;

      clearTimeout(timer);
      await sleep(waitMs);
      continue;
    } catch (error) {
      lastError = error;
      clearTimeout(timer);
      // For AbortError / network errors, attempt retry if we have attempts left
      if (attempt > retries) break;
      const backoff = Math.min(maxBackoffMs, backoffMs * 2 ** (attempt - 1));
      const jitter = randomJitter(100, 500);
      await sleep(backoff + jitter);
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
};

export const defaultScraperHeaders = DEFAULT_HEADERS;


