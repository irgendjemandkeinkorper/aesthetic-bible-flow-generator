import { describe, expect, it, vi } from 'vitest';
import type { ProviderAdapter } from './types';
import { capabilityAllowed, getProviderModelOptions, resolveProviderModel } from './selection';

function adapter(id: string, vision: boolean, imageGeneration: boolean): ProviderAdapter {
  return {
    id, label: id,
    capabilities: { structuredOutput: true, vision, imageGeneration },
    models: [{ id: 'model', label: 'Model', capabilities: { structuredOutput: true, vision, imageGeneration }, inputCostPerMillionTokens: 1, outputCostPerMillionTokens: 2 }],
    validateApiKey: vi.fn(), generateBible: vi.fn(), decodeImage: vi.fn(), auditCohesion: vi.fn(),
  };
}

describe('provider model selection and capability gating', () => {
  it('disables models without configured keys', () => {
    const options = getProviderModelOptions(
      { gemini: 'configured', openai: '', anthropic: '', ollama: '' },
      [adapter('gemini', true, true)],
    );
    expect(options.filter((option) => option.providerId === 'gemini').every((option) => option.enabled)).toBe(true);
    expect(options.filter((option) => option.providerId === 'openai').every((option) => !option.enabled && option.disabledReason?.includes('key'))).toBe(true);
  });

  it('resolves the selected adapter/model and gates capabilities', () => {
    const openai = adapter('openai', true, false);
    const selected = resolveProviderModel('openai:model', [openai]);
    expect(selected).toEqual({ adapter: openai, model: openai.models[0] });
    expect(capabilityAllowed(selected?.model.capabilities, 'vision')).toBe(true);
    expect(capabilityAllowed(selected?.model.capabilities, 'imageGeneration')).toBe(false);
  });

  it('offers a registered Ollama model when its local server URL is configured', () => {
    const ollama = adapter('ollama', false, false);
    const options = getProviderModelOptions(
      { gemini: '', openai: '', anthropic: '', ollama: 'http://localhost:11434' },
      [ollama],
    );
    expect(options.filter((option) => option.providerId === 'ollama')).toEqual(
      expect.arrayContaining([expect.objectContaining({ enabled: true })]),
    );
  });
});
