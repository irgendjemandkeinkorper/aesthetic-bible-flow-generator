import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../../data/presets';
import { GeminiProviderAdapter, type GeminiClientLike } from './gemini';

describe('GeminiProviderAdapter', () => {
  it('returns only canonical schema-validated Bible output', async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(INITIAL_PRESETS[0]) });
    const client: GeminiClientLike = { models: { generateContent } };
    const adapter = new GeminiProviderAdapter('a'.repeat(24), client);

    const result = await adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['clarity'],
      visualMood: 'cinematic',
    }, 'gemini-3.6-flash');

    expect(result).toEqual(INITIAL_PRESETS[0]);
    expect(generateContent).toHaveBeenCalledOnce();
    expect(generateContent.mock.calls[0][0].config.responseMimeType).toBe('application/json');
  });

  it('requests a repair when Gemini returns invalid schema data', async () => {
    const generateContent = vi.fn()
      .mockResolvedValueOnce({ text: '{"title": 12}' })
      .mockResolvedValueOnce({ text: JSON.stringify(INITIAL_PRESETS[0]) });
    const adapter = new GeminiProviderAdapter('a'.repeat(24), { models: { generateContent } });

    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: [],
      visualMood: 'quiet',
    }, 'gemini-3.6-flash')).resolves.toEqual(INITIAL_PRESETS[0]);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});

