import { describe, test, expect } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import { AestheticBibleSchema } from '../schemas';

describe('Vitest Setup & Schema Verification', () => {
  test('Vitest is running correctly', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
  });

  test('INITIAL_PRESETS should match AestheticBible Zod schema successfully', () => {
    expect(INITIAL_PRESETS.length).toBeGreaterThan(0);

    INITIAL_PRESETS.forEach((preset) => {
      const result = AestheticBibleSchema.safeParse(preset);
      if (!result.success) {
        console.error('Validation failure for preset:', preset.id, result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });
});
