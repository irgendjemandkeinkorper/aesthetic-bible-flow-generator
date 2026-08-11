import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../../data/presets';
import { AnthropicProviderAdapter, type AnthropicClientLike } from './anthropic';

describe('AnthropicProviderAdapter', () => {
  it('injects the JSON shape and repairs schema-invalid responses', async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '{"title":12}' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: JSON.stringify(INITIAL_PRESETS[0]) }] });
    const adapter = new AnthropicProviderAdapter(`sk-ant-${'a'.repeat(24)}`, { messages: { create } });

    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['clarity'],
      visualMood: 'cinematic',
    }, 'claude-sonnet-4-5')).resolves.toEqual(INITIAL_PRESETS[0]);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0].system).toContain('JSON Schema');
    expect(create.mock.calls[1][0].messages[0].content).toContain('Validation errors');
  });

  it('uses an Anthropic base64 vision block for image decoding', async () => {
    const decoded = {
      title: 'Reference', genreMatch: 'Fantasy', subgenreMatch: 'Gothic', category: 'Environment',
      summaryDescription: 'A scene', promptSpec: 'a scene', philosophyTag: 'Decay',
      dominantMaterials: ['stone'], lightingProfile: 'moonlight',
      extractedPalette: [{ name: 'Night', hex: '#112233', usage: 'background' }],
      doAndDontGuidelines: { doList: ['texture'], dontList: ['gloss'] },
    };
    const create = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(decoded) }] });
    const client: AnthropicClientLike = { messages: { create } };
    const adapter = new AnthropicProviderAdapter(`sk-ant-${'b'.repeat(24)}`, client);
    await adapter.decodeImage('data:image/png;base64,YWJj', 'image/png', 'claude-haiku-4-5');
    expect(create.mock.calls[0][0].messages[0].content[0]).toEqual({
      type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'YWJj' },
    });
  });
});
