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
});

