export interface LocalServerHealth {
  available: boolean;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 2_000,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, timeoutMs);
  init.signal?.addEventListener('abort', abort, { once: true });
  if (init.signal?.aborted) controller.abort();

  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }
}

export async function detectLocalServer(
  fetcher: typeof fetch = fetch,
  timeoutMs = 2_000,
): Promise<LocalServerHealth> {
  try {
    const response = await fetchWithTimeout('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, timeoutMs, fetcher);
    return { available: response.ok };
  } catch {
    return { available: false };
  }
}
