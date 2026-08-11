import { describe, expect, it, vi } from 'vitest';
import { INITIAL_PRESETS } from '../../data/presets';
import { OpenAIProviderAdapter } from './openai';

const decoded = {
  title: 'Weathered observatory',
  genreMatch: 'Clockwork',
  subgenreMatch: 'Astral industrialism',
  category: 'Environment' as const,
  summaryDescription: 'A brass observatory under cold stars.',
  promptSpec: 'weathered brass observatory, cold starlight',
  philosophyTag: 'Mechanism versus infinity',
  dominantMaterials: ['brass', 'stone'],
  lightingProfile: 'cold rim light',
  extractedPalette: [{ name: 'Brass', hex: '#AA7733', usage: 'trim' }],
  doAndDontGuidelines: { doList: ['show wear'], dontList: ['use plastic'] },
};

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('OpenAIProviderAdapter', () => {
  it('requests strict JSON Schema output and validates the response', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(INITIAL_PRESETS[0]));
    const adapter = new OpenAIProviderAdapter(`sk-${'a'.repeat(24)}`, request);

    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['clarity'],
      visualMood: 'cinematic',
    }, 'gpt-4.1-mini')).resolves.toEqual(INITIAL_PRESETS[0]);

    const [, init] = request.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.response_format).toMatchObject({ type: 'json_schema', json_schema: { strict: true } });
    expect(body.response_format.json_schema.schema.type).toBe('object');
    expect(init.headers).toMatchObject({ Authorization: `Bearer sk-${'a'.repeat(24)}` });
  });

  it('marks every schema property required for strict mode and tolerates explicit nulls for optional fields', async () => {
    const bibleWithNullPinned = {
      ...INITIAL_PRESETS[0],
      moodBoard: INITIAL_PRESETS[0].moodBoard.map((tile) => ({ ...tile, pinned: null })),
    };
    const request = vi.fn().mockResolvedValue(jsonResponse(bibleWithNullPinned));
    const adapter = new OpenAIProviderAdapter(`sk-${'d'.repeat(24)}`, request);

    const result = await adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['clarity'],
      visualMood: 'cinematic',
    }, 'gpt-4.1-mini');
    expect(result.id).toBe(INITIAL_PRESETS[0].id);
    expect(result.moodBoard.every((tile) => tile.pinned === undefined)).toBe(true);

    const body = JSON.parse(String((request.mock.calls[0][1] as RequestInit).body));
    const moodBoardItemSchema = body.response_format.json_schema.schema.properties.moodBoard.items;
    expect(moodBoardItemSchema.required).toEqual(expect.arrayContaining(Object.keys(moodBoardItemSchema.properties)));
    expect(moodBoardItemSchema.properties.pinned.type).toEqual(expect.arrayContaining(['null']));
  });

  it('sends image data as a vision content part', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(decoded));
    const adapter = new OpenAIProviderAdapter(`sk-${'b'.repeat(24)}`, request);
    await expect(adapter.decodeImage('YWJj', 'image/png', 'gpt-4.1-mini')).resolves.toEqual(decoded);
    const body = JSON.parse(String((request.mock.calls[0][1] as RequestInit).body));
    expect(body.messages[1].content[1]).toEqual({ type: 'image_url', image_url: { url: 'data:image/png;base64,YWJj' } });
  });

  it('repairs a schema-invalid response before returning it', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ title: 12 }))
      .mockResolvedValueOnce(jsonResponse(INITIAL_PRESETS[0]));
    const adapter = new OpenAIProviderAdapter(`sk-${'c'.repeat(24)}`, request);
    await expect(adapter.generateBible({
      genre: INITIAL_PRESETS[0].genre,
      philosophyAnchors: ['repair'],
      visualMood: 'quiet',
    }, 'gpt-4.1')).resolves.toEqual(INITIAL_PRESETS[0]);
    expect(request).toHaveBeenCalledTimes(2);
    const repairBody = JSON.parse(String((request.mock.calls[1][1] as RequestInit).body));
    expect(repairBody.messages[1].content).toContain('Repair this JSON');
  });
});
