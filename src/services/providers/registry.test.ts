import { describe, expect, it, vi } from 'vitest';
import type { ProviderAdapter } from './types';
import { ProviderRegistry } from './registry';

function adapter(id: string, valid = true): ProviderAdapter {
  return {
    id,
    label: id,
    capabilities: { structuredOutput: true, vision: false, imageGeneration: false },
    models: [],
    validateApiKey: vi.fn().mockResolvedValue(valid),
    generateBible: vi.fn(),
    decodeImage: vi.fn(),
    auditCohesion: vi.fn(),
  };
}

describe('ProviderRegistry', () => {
  it('validates, registers, and activates a provider', async () => {
    const registry = new ProviderRegistry();
    const gemini = adapter('gemini');
    await registry.register(gemini, 'user-key');
    expect(gemini.validateApiKey).toHaveBeenCalledWith('user-key', undefined);
    expect(registry.getActive()).toBe(gemini);
  });

  it('rejects invalid keys and duplicate provider IDs', async () => {
    const registry = new ProviderRegistry();
    await expect(registry.register(adapter('bad', false), 'invalid')).rejects.toThrow('Invalid API key');
    await registry.register(adapter('gemini'), 'valid');
    await expect(registry.register(adapter('gemini'), 'valid')).rejects.toThrow('already registered');
  });

  it('allows an explicitly keyless provider while still validating reachability', async () => {
    const registry = new ProviderRegistry();
    const ollama = { ...adapter('ollama'), requiresApiKey: false };
    await registry.register(ollama, '');
    expect(ollama.validateApiKey).toHaveBeenCalledWith('', undefined);
    expect(registry.get('ollama')).toBe(ollama);
  });

  it('reports an unavailable keyless provider without calling its config an API key', async () => {
    const registry = new ProviderRegistry();
    const ollama = { ...adapter('ollama', false), requiresApiKey: false };
    await expect(registry.register(ollama, '')).rejects.toThrow('Provider "ollama" is unavailable');
  });

  it('notifies subscribers on register, setActive, unregister, and clear', async () => {
    const registry = new ProviderRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);

    await registry.register(adapter('gemini'), 'valid');
    expect(listener).toHaveBeenCalledTimes(1);

    await registry.register(adapter('openai'), 'valid');
    expect(listener).toHaveBeenCalledTimes(2);

    registry.setActive('openai');
    expect(listener).toHaveBeenCalledTimes(3);

    registry.unregister('openai');
    expect(listener).toHaveBeenCalledTimes(4);
    expect(registry.getActive()?.id).toBe('gemini');

    registry.clear();
    expect(listener).toHaveBeenCalledTimes(5);
    expect(registry.getActive()).toBeUndefined();
  });

  it('stops notifying after unsubscribe, and skips notify on no-op unregister', async () => {
    const registry = new ProviderRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    await registry.register(adapter('gemini'), 'valid');
    expect(listener).toHaveBeenCalledTimes(1);

    expect(registry.unregister('missing')).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    registry.setActive('gemini');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
