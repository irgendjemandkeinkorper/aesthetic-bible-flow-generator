import { describe, expect, it } from 'vitest';
import { AestheticBibleSchema } from '../services/schema';
import { INITIAL_PRESETS } from './presets';

describe('creative-direction presets', () => {
  it('keeps every curated preset valid and fully showcases M5 fields', () => {
    for (const preset of INITIAL_PRESETS) {
      expect(AestheticBibleSchema.safeParse(preset).success, preset.title).toBe(true);
      expect(preset.gamePerspective, preset.title).toBeTruthy();
      expect(preset.mechanicsArchetype, preset.title).toBeTruthy();
      expect(preset.renderingStyle, preset.title).toBeTruthy();
      expect(preset.artisticInfluences?.length, preset.title).toBeGreaterThan(0);
      expect(preset.musicDirection?.coreThemeSpec, preset.title).toBeTruthy();
      expect(preset.musicDirection?.instrumentation.length, preset.title).toBeGreaterThan(0);
      expect(preset.musicDirection?.generativePromptSpec, preset.title).toBeTruthy();
    }
  });
});
