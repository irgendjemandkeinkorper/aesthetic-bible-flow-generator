export interface LocalServerHealth {
  available: boolean;
}

export async function detectLocalServer(
  fetcher: typeof fetch = fetch,
  timeoutMs = 2_000,
): Promise<LocalServerHealth> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return { available: response.ok };
  } catch {
    return { available: false };
  } finally {
    clearTimeout(timeout);
  }
}
