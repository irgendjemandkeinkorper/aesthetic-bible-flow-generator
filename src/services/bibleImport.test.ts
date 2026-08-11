import { describe, expect, it } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import { parseAestheticBibleJson } from './bibleImport';

describe('parseAestheticBibleJson', () => {
  it('loads a valid full Aesthetic Bible', () => {
    const result = parseAestheticBibleJson(JSON.stringify(INITIAL_PRESETS[0]));
    expect(result.success).toBe(true);
    if (result.success) expect(result.bible).toEqual(INITIAL_PRESETS[0]);
  });

  it('rejects invalid data with a readable error instead of throwing', () => {
    expect(() => parseAestheticBibleJson('{"title":"incomplete"}')).not.toThrow();
    const result = parseAestheticBibleJson('{"title":"incomplete"}');
    expect(result.success).toBe(false);
    if (result.success === false) expect(result.error).toContain('not a valid Aesthetic Bible');
  });

  it('rejects malformed JSON without throwing', () => {
    expect(parseAestheticBibleJson('{nope')).toEqual({ success: false, error: 'The selected file is not valid JSON.' });
  });

  it('explicitly strips unknown fields from imported Bibles', () => {
    const input = { ...INITIAL_PRESETS[0], ignoredTopLevel: true, manifesto: { ...INITIAL_PRESETS[0].manifesto, ignoredNested: true } };
    const result = parseAestheticBibleJson(JSON.stringify(input));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.bible).not.toHaveProperty('ignoredTopLevel');
      expect(result.bible.manifesto).not.toHaveProperty('ignoredNested');
    }
  });

  it('treats an unknown outputs field on a Bible as data to strip, not a run-history export', () => {
    const input = { ...INITIAL_PRESETS[0], outputs: [{ malformed: true }] };
    const result = parseAestheticBibleJson(JSON.stringify(input));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.bible).toEqual(INITIAL_PRESETS[0]);
      expect(result.bible).not.toHaveProperty('outputs');
      expect(result.runs).toBeUndefined();
    }
  });

  it('loads and sanitizes run-history-shaped exports', () => {
    const result = parseAestheticBibleJson(JSON.stringify({
      version: 1,
      exportedAt: '2026-08-11T00:00:00.000Z',
      ignored: true,
      outputs: [{
        runId: 'run-1', providerId: 'openai', modelId: 'gpt-test',
        completedAt: '2026-08-11T00:00:00.000Z', bible: INITIAL_PRESETS[0], ignored: true,
      }],
    }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.runs).toHaveLength(1);
      expect(result.runs?.[0]).toEqual(expect.objectContaining({ id: 'run-1', status: 'success', bible: INITIAL_PRESETS[0] }));
      expect(result.runs?.[0]).not.toHaveProperty('ignored');
    }
  });

  it('rejects an invalid run-history export without returning partial runs', () => {
    const result = parseAestheticBibleJson(JSON.stringify({
      version: 1,
      exportedAt: '2026-08-11T00:00:00.000Z',
      outputs: [
        { runId: 'valid', providerId: 'openai', modelId: 'test', bible: INITIAL_PRESETS[0] },
        { runId: 'invalid', providerId: 'openai', modelId: 'test', bible: { title: 'incomplete' } },
      ],
    }));
    expect(result.success).toBe(false);
    if (result.success === false) expect(result.error).toContain('not a valid run-history export');
  });
});
