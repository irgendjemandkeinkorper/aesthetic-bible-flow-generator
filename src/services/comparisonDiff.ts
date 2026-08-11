import type { AestheticBible, ColorSystem } from '../types';

export type DiffKind = 'equal' | 'added' | 'removed';
export interface DiffSegment { type: DiffKind; value: string }

const MAX_DIFF_MATRIX_CELLS = 1_000_000;
const MAX_DIFF_TOKENS = 10_000;

function tokenize(value: string): string[] {
  return value.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
}

function appendSegment(segments: DiffSegment[], type: DiffKind, value: string): void {
  const previous = segments.at(-1);
  if (previous?.type === type) previous.value += value;
  else segments.push({ type, value });
}

/** Computes a deterministic word-level diff using a longest-common-subsequence table. */
export function diffWords(before: string, after: string): DiffSegment[] {
  if (before === after) return before ? [{ type: 'equal', value: before }] : [];
  const left = tokenize(before);
  const right = tokenize(after);
  if (left.length + right.length > MAX_DIFF_TOKENS
    || (left.length + 1) * (right.length + 1) > MAX_DIFF_MATRIX_CELLS) {
    const segments: DiffSegment[] = [];
    if (after) appendSegment(segments, 'added', after);
    if (before) appendSegment(segments, 'removed', before);
    return segments;
  }
  const table = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      appendSegment(segments, 'equal', left[i]); i += 1; j += 1;
    } else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) {
      appendSegment(segments, 'added', right[j]); j += 1;
    } else {
      appendSegment(segments, 'removed', left[i]); i += 1;
    }
  }
  return segments;
}

function manifestoText(bible: AestheticBible): string {
  const manifesto = bible.manifesto;
  return [
    manifesto.coreThesis,
    manifesto.visualPhilosophy,
    manifesto.emotionalCadence,
    ...manifesto.keyVisualMetaphors,
    ...manifesto.doList,
    ...manifesto.dontList,
  ].join('\n');
}

function promptSpecs(bible: AestheticBible): string {
  const moodPrompts = bible.moodBoard.map((tile) => `${tile.title}: ${tile.promptSpec}`);
  if (bible.musicDirection?.generativePromptSpec) {
    moodPrompts.push(`Music: ${bible.musicDirection.generativePromptSpec}`);
  }
  return moodPrompts.join('\n');
}

export interface PaletteDifference {
  token: keyof Pick<ColorSystem, 'primary' | 'secondary' | 'accent' | 'neutralDark' | 'neutralLight' | 'specularGlow'>;
  before: string;
  after: string;
  changed: boolean;
}

export interface BibleDifference {
  manifesto: DiffSegment[];
  palette: PaletteDifference[];
  promptSpecs: DiffSegment[];
}

export function createBibleDiff(before: AestheticBible, after: AestheticBible): BibleDifference {
  const paletteTokens: PaletteDifference['token'][] = [
    'primary', 'secondary', 'accent', 'neutralDark', 'neutralLight', 'specularGlow',
  ];
  return {
    manifesto: diffWords(manifestoText(before), manifestoText(after)),
    palette: paletteTokens.map((token) => ({
      token,
      before: before.colorSystem[token].hex,
      after: after.colorSystem[token].hex,
      changed: before.colorSystem[token].hex.toLowerCase() !== after.colorSystem[token].hex.toLowerCase(),
    })),
    promptSpecs: diffWords(promptSpecs(before), promptSpecs(after)),
  };
}
