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
});
