import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../../data/presets';
import { OllamaProviderAdapter } from './ollama';

function response(body: unknown, ok = true, status = ok ? 200 : 500): Response {
  return { ok, status, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe('OllamaProviderAdapter', () => {
  it('checks /api/tags without a key using a bounded abort signal', async () => {
    const request = vi.fn().mockResolvedValue(response({ models: [] }));
    const adapter = new OllamaProviderAdapter('http://localhost:11434', request as typeof fetch);
    await expect(adapter.validateApiKey('')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.objectContaining({
      method: 'GET',
      signal: expect.any(AbortSignal),
    }));
  });

  it('aborts a reachability check after the configured timeout', async () => {
    vi.useFakeTimers();
    const request = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const adapter = new OllamaProviderAdapter('http://127.0.0.1:11434', request as typeof fetch, 25);
    const validation = adapter.validateApiKey('');
    await vi.advanceTimersByTimeAsync(25);
    await expect(validation).resolves.toBe(false);
    vi.useRealTimers();
  });

  it('uses non-streaming JSON generation and validates the result', async () => {
    const request = vi.fn().mockResolvedValue(response({ response: JSON.stringify(INITIAL_PRESETS[0]) }));
    const adapter = new OllamaProviderAdapter('http://localhost:11434', request as typeof fetch);
    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['local'],
      visualMood: 'quiet',
    }, 'llama3.2:latest')).resolves.toEqual(INITIAL_PRESETS[0]);

    const body = JSON.parse(String((request.mock.calls[0][1] as RequestInit).body));
    expect(body).toMatchObject({ model: 'llama3.2:latest', stream: false });
    expect(body.format).toMatchObject({ type: 'object' });
    expect(body.prompt).toContain(JSON.stringify(body.format));
    expect(request.mock.calls[0][0]).toBe('http://localhost:11434/api/generate');
  });

  it('uses the validation pipeline repair request for invalid structured output', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response({ response: '{"title":12}' }))
      .mockResolvedValueOnce(response({ response: JSON.stringify(INITIAL_PRESETS[0]) }));
    const adapter = new OllamaProviderAdapter(undefined, request as typeof fetch);
    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: [],
      visualMood: 'quiet',
    }, 'llama3.2:latest')).resolves.toEqual(INITIAL_PRESETS[0]);
    expect(request).toHaveBeenCalledTimes(2);
    const repair = JSON.parse(String((request.mock.calls[1][1] as RequestInit).body));
    expect(repair.prompt).toContain('Repair this JSON');
  });

  it('rejects non-local and path-bearing server URLs', () => {
    expect(() => new OllamaProviderAdapter('https://example.com')).toThrow('localhost');
    expect(() => new OllamaProviderAdapter('http://localhost:11434/api')).toThrow('must not contain a path');
  });

  it('rejects a malformed URL with the same friendly message instead of a raw parser error', () => {
    expect(() => new OllamaProviderAdapter('not a url')).toThrow('localhost');
  });
});
