import { describe, it, expect } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import { AestheticBibleSchema, expandAestheticBibleSchema } from './schema';

describe('Aesthetic Bible Schema Validation', () => {
  it('should validate all initial presets successfully', () => {
    expect(INITIAL_PRESETS.length).toBeGreaterThan(0);

    for (const preset of INITIAL_PRESETS) {
      const result = AestheticBibleSchema.safeParse(preset);
      if (!result.success) {
        console.error('Validation errors for preset:', preset.id, result.error.errors);
      }
      expect(result.success).toBe(true);
    }
  });

  it('should fail validation when required fields are missing', () => {
    // Clone a valid preset and remove a required field
    const basePreset = JSON.parse(JSON.stringify(INITIAL_PRESETS[0]));

    // Remove title
    const { title, ...missingTitle } = basePreset;
    const result1 = AestheticBibleSchema.safeParse(missingTitle);
    expect(result1.success).toBe(false);
    if (!result1.success) {
      const issuePaths = result1.error.issues.map(i => i.path.join('.'));
      expect(issuePaths).toContain('title');
    }

    // Remove genre
    const { genre, ...missingGenre } = basePreset;
    const result2 = AestheticBibleSchema.safeParse(missingGenre);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      const issuePaths = result2.error.issues.map(i => i.path.join('.'));
      expect(issuePaths).toContain('genre');
    }
  });

  it('should fail validation when primary color hex is invalid', () => {
    const basePreset = JSON.parse(JSON.stringify(INITIAL_PRESETS[0]));

    const invalidHexCodes = [
      '123456',       // Missing #
      '#123',          // Too short (3 chars instead of 6)
      '#12345',        // Too short (5 chars instead of 6)
      '#1234567',      // Too long (7 chars instead of 6)
      '#XYZ123',       // Invalid hex characters
      'rgb(255,0,0)',  // Completely invalid format
    ];

    for (const invalidHex of invalidHexCodes) {
      const modifiedPreset = {
        ...basePreset,
        colorSystem: {
          ...basePreset.colorSystem,
          primary: {
            ...basePreset.colorSystem.primary,
            hex: invalidHex,
          },
        },
      };

      const result = AestheticBibleSchema.safeParse(modifiedPreset);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hexIssue = result.error.issues.find(i => i.path.join('.') === 'colorSystem.primary.hex');
        expect(hexIssue).toBeDefined();
      }
    }
  });

  it('should support recursive sub-bibles', () => {
    const basePreset = JSON.parse(JSON.stringify(INITIAL_PRESETS[0]));

    // Add sub-bibles recursively
    const nestedPreset = {
      ...basePreset,
      subBibles: [
        {
          ...basePreset,
          id: 'nested-level-1',
          subBibles: [
            {
              ...basePreset,
              id: 'nested-level-2',
            }
          ]
        }
      ]
    };

    const result = AestheticBibleSchema.safeParse(nestedPreset);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subBibles?.[0].id).toBe('nested-level-1');
      expect(result.data.subBibles?.[0].subBibles?.[0].id).toBe('nested-level-2');
    }
  });

  it('should expand non-recursive schema with correct nesting using expandAestheticBibleSchema', () => {
    // depth 1 has no nested subBibles (or rather, subBibles field isn't added to the schema object)
    const schemaDepth1 = expandAestheticBibleSchema(1);
    expect(schemaDepth1.shape.subBibles).toBeUndefined();

    // depth 2 has subBibles, which is an array of depth 1 schemas (so its elements do not have subBibles)
    const schemaDepth2 = expandAestheticBibleSchema(2);
    expect(schemaDepth2.shape.subBibles).toBeDefined();

    // depth 3 has subBibles, which is an array of depth 2 schemas (which have subBibles, whose elements do not have subBibles)
    const schemaDepth3 = expandAestheticBibleSchema(3);
    expect(schemaDepth3.shape.subBibles).toBeDefined();
  });
});
