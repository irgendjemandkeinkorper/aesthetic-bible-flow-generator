import { describe, expect, it } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import { createBibleDiff, diffWords } from './comparisonDiff';

describe('comparison diff', () => {
  it('reports word-level additions and removals while preserving both texts', () => {
    const result = diffWords('quiet brass machine', 'quiet silver machine');
    expect(result).toEqual([
      { type: 'equal', value: 'quiet ' },
      { type: 'added', value: 'silver' },
      { type: 'removed', value: 'brass' },
      { type: 'equal', value: ' machine' },
    ]);
    expect(result.filter((part) => part.type !== 'added').map((part) => part.value).join('')).toBe('quiet brass machine');
    expect(result.filter((part) => part.type !== 'removed').map((part) => part.value).join('')).toBe('quiet silver machine');
  });

  it('compares manifesto, palette, and prompt specifications without mutating inputs', () => {
    const before = structuredClone(INITIAL_PRESETS[0]);
    const after = structuredClone(before);
    after.manifesto.coreThesis += ' Evolved.';
    after.colorSystem.primary.hex = '#123456';
    after.moodBoard[0].promptSpec += ' cinematic';
    const result = createBibleDiff(before, after);
    expect(result.manifesto.some((part) => part.type === 'added')).toBe(true);
    expect(result.palette.find((item) => item.token === 'primary')?.changed).toBe(true);
    expect(result.promptSpecs.some((part) => part.type === 'added')).toBe(true);
    expect(INITIAL_PRESETS[0].colorSystem.primary.hex).toBe(before.colorSystem.primary.hex);
  });

  it('uses a lossless bounded fallback for inputs too large for the LCS matrix', () => {
    const before = Array.from({ length: 1_001 }, () => 'before').join(' ');
    const after = Array.from({ length: 1_001 }, () => 'after').join(' ');
    const result = diffWords(before, after);

    expect(result).toEqual([
      { type: 'added', value: after },
      { type: 'removed', value: before },
    ]);
  });
});
