import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../../data/presets';
import type { ProviderAdapter } from './types';
import { estimateCostUsd, runBibleGeneration, setRunObserver } from './metrics';

describe('provider run metrics', () => {
  it('computes token and cost estimates and emits the completed run', async () => {
    const model = {
      id: 'test-model',
      label: 'Test',
      capabilities: { structuredOutput: true, vision: false, imageGeneration: false },
      inputCostPerMillionTokens: 1,
      outputCostPerMillionTokens: 2,
    };
    const adapter: ProviderAdapter = {
      id: 'test',
      label: 'Test',
      capabilities: model.capabilities,
      models: [model],
      validateApiKey: vi.fn().mockResolvedValue(true),
      generateBible: vi.fn().mockResolvedValue(INITIAL_PRESETS[0]),
      decodeImage: vi.fn(),
      auditCohesion: vi.fn(),
    };
    const observer = vi.fn();
    setRunObserver(observer);

    const run = await runBibleGeneration(adapter, {
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: [],
      visualMood: 'high contrast',
    }, model.id);

    expect(run.status).toBe('success');
    expect(run.bible).toEqual(INITIAL_PRESETS[0]);
    expect(run.inputTokens).toBeGreaterThan(0);
    expect(run.outputTokens).toBeGreaterThan(0);
    expect(run.costUsd).toBe(estimateCostUsd(model, run.inputTokens, run.outputTokens));
    expect(run.latencyMs).toBeGreaterThanOrEqual(0);
    expect(observer).toHaveBeenCalledWith(run);
    setRunObserver();
  });
});

