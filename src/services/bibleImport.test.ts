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
});
