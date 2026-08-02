import { describe, it, expect } from 'vitest';
import { AestheticBibleSchema } from './schema';
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
