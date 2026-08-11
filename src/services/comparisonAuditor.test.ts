import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import type { Run } from '../types';
import type { ProviderAdapter } from './providers/types';
import { auditRunComparison, buildComparisonAuditPrompt } from './comparisonAuditor';

const audit = {
  summary: 'Two related directions.',
  convergence: ['Shared geometry'],
  divergence: ['Different palettes'],
  recommendations: ['Prototype both'],
};

function run(id: string): Run {
  return {
    id, providerId: 'test', modelId: 'model', latencyMs: 1,
    inputTokens: 1, outputTokens: 1, costUsd: 0,
    bible: { ...INITIAL_PRESETS[0], id }, status: 'success',
  };
}

function adapter(): ProviderAdapter {
  return {
    id: 'test', label: 'Test',
    capabilities: { structuredOutput: true, vision: false, imageGeneration: false },
    models: [{ id: 'model', label: 'Model', capabilities: { structuredOutput: true, vision: false, imageGeneration: false }, inputCostPerMillionTokens: 0, outputCostPerMillionTokens: 0 }],
    validateApiKey: vi.fn(), generateBible: vi.fn(), decodeImage: vi.fn(), auditCohesion: vi.fn(),
    auditComparison: vi.fn().mockResolvedValue(audit),
  };
}

describe('comparison auditor', () => {
  it('uses the configured adapter with the selected successful runs', async () => {
    const provider = adapter();
    await expect(auditRunComparison(provider, [run('one'), run('two')], 'model')).resolves.toEqual(audit);
    expect(provider.auditComparison).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'one' }), expect.objectContaining({ id: 'two' })],
      'model',
      undefined,
    );
  });

  it('rejects unsupported cardinality and invalid adapter output', async () => {
    await expect(auditRunComparison(adapter(), [run('one')], 'model')).rejects.toThrow('between two and four');
    const invalid = adapter();
    invalid.auditComparison = vi.fn().mockResolvedValue({ summary: 'missing arrays' });
    await expect(auditRunComparison(invalid, [run('one'), run('two')], 'model')).rejects.toThrow();
  });

  it('builds a compact prompt without mood-board image data', () => {
    const prompt = buildComparisonAuditPrompt([INITIAL_PRESETS[0], INITIAL_PRESETS[1]]);
    expect(prompt).toContain(INITIAL_PRESETS[0].title);
    expect(prompt).toContain('promptSpecs');
    expect(prompt).not.toContain('imageUrl');
  });
});
