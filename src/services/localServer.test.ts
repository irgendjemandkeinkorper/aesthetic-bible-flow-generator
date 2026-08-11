import { describe, expect, it, vi } from 'vitest';
import { detectLocalServer } from './localServer';

describe('detectLocalServer', () => {
  it('offers local mode when the health endpoint responds successfully', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    await expect(detectLocalServer(fetcher as unknown as typeof fetch)).resolves.toEqual({ available: true });
    expect(fetcher).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }));
  });

  it('falls back to browser mode when the health request fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('offline'));
    await expect(detectLocalServer(fetcher as unknown as typeof fetch)).resolves.toEqual({ available: false });
  });

  it('falls back to browser mode for a non-success health response', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false });
    await expect(detectLocalServer(fetcher as unknown as typeof fetch)).resolves.toEqual({ available: false });
  });

  it('aborts a health request after the configured timeout', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      const health = detectLocalServer(fetcher as typeof fetch, 25);
      await vi.advanceTimersByTimeAsync(25);
      await expect(health).resolves.toEqual({ available: false });
    } finally {
      vi.useRealTimers();
    }
  });
});
