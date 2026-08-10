import { describe, it, expect } from 'vitest';
import { AestheticBibleSchema, FineTuningStateSchema } from './schema';
import { INITIAL_PRESETS } from '../data/presets';

describe('Aesthetic Bible Schema', () => {
  it('should validate all initial presets successfully', () => {
    INITIAL_PRESETS.forEach(preset => {
      const result = AestheticBibleSchema.safeParse(preset);
      if (!result.success) {
        console.error('Validation failed for preset:', preset.title, result.error.issues);
      }
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid schemas missing critical fields', () => {
    const invalidPreset = {
      id: 'test',
      title: 'Missing Genre'
    };
    const result = AestheticBibleSchema.safeParse(invalidPreset);
    expect(result.success).toBe(false);
  });
});

describe('FineTuningStateSchema', () => {
  const validFineTuning = {
    density: 5,
    contrast: 5,
    eraBlend: 'Contemporary with retro-futurist influences',
    saturation: 5,
    philosophicalDepth: 5
  };

  const numericFields = [
    'density',
    'contrast',
    'saturation',
    'philosophicalDepth'
  ] as const;

  it.each(numericFields)('rejects zero for %s', field => {
    const result = FineTuningStateSchema.safeParse({
      ...validFineTuning,
      [field]: 0
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'too_small',
            path: [field],
            minimum: 1
          })
        ])
      );
    }
  });

  it.each(numericFields)('accepts one for %s', field => {
    const result = FineTuningStateSchema.safeParse({
      ...validFineTuning,
      [field]: 1
    });

    expect(result.success).toBe(true);
  });

  it('continues to accept an existing valid fine-tuning payload', () => {
    expect(FineTuningStateSchema.safeParse(validFineTuning).success).toBe(true);
  });
});
