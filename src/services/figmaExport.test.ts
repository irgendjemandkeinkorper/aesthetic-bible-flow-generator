import { describe, expect, it } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import { FigmaInterchangeSchema } from './figmaInterchange';
import { serializeAestheticBibleToFigma, stringifyFigmaInterchange } from './figmaExport';

describe('serializeAestheticBibleToFigma', () => {
  it('produces a valid, deterministic document with DTCG tokens', () => {
    const bible = INITIAL_PRESETS[0];
    const document = serializeAestheticBibleToFigma(bible, { generatedAt: '2026-08-10T00:00:00.000Z' });

    expect(FigmaInterchangeSchema.safeParse(document).success).toBe(true);
    expect(document.name).toBe(bible.title);
    expect(document.tokens['color/primary']).toEqual(expect.objectContaining({
      $type: 'color', $value: bible.colorSystem.primary.hex,
    }));
    expect(document.pages[0].children.some((node) => node.type === 'frame')).toBe(true);
    expect(document.prototypeConnections).toHaveLength(1);
    expect(stringifyFigmaInterchange(bible, { generatedAt: document.generatedAt })).toBe(JSON.stringify(document, null, 2));
  });

  it('does not mutate the source bible', () => {
    const bible = structuredClone(INITIAL_PRESETS[0]);
    const before = structuredClone(bible);
    serializeAestheticBibleToFigma(bible);
    expect(bible).toEqual(before);
  });
});
