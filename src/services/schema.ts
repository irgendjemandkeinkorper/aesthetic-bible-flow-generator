import { z } from 'zod';

export const GenreCategorySchema = z.enum([
  'Grimdark Fantasy',
  'Cyberpunk / Synth-Noir',
  'Solarpunk Biophilia',
  'Eldritch Cosmic Horror',
  'Cassette Futurism',
  'Clockwork / Dieselpunk Alchemy',
  'Brutalist Space Opera',
  'Post-Apocalyptic Scavenger',
  'Cyber-Zen Shinto',
  'Custom / Hybrid Speculative'
]);

export const MoodTileCategorySchema = z.enum([
  'Environment',
  'Character',
  'Item/Prop',
  'Architecture',
  'UI/HUD',
  'Lighting & FX'
]);

export const ColorSwatchSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid 6-character hex code (e.g. #FF00FF)' }),
  usage: z.string()
});

export const ColorSystemSchema = z.object({
  primary: ColorSwatchSchema,
  secondary: ColorSwatchSchema,
  accent: ColorSwatchSchema,
  neutralDark: ColorSwatchSchema,
  neutralLight: ColorSwatchSchema,
  specularGlow: ColorSwatchSchema,
  paletteNotes: z.string()
});

export const TypographyRoleSchema = z.object({
  name: z.string(),
  category: z.string(),
  usage: z.string()
});

export const TypographySystemSchema = z.object({
  displayFont: TypographyRoleSchema,
  headingFont: TypographyRoleSchema,
  bodyFont: TypographyRoleSchema,
  monoFont: TypographyRoleSchema,
  hierarchyRules: z.array(z.string())
});

export const ShapeAndFormSchema = z.object({
  dominantGeometry: z.string(),
  silhouetteStyle: z.string(),
  materialAndTextures: z.array(z.string()),
  gritAndWeathering: z.string()
});

export const InterfaceAndHUDSchema = z.object({
  diegeticType: z.enum([
    'Diegetic (In-World)',
    'Minimalist Holo-Wireframe',
    'Ornate Tactile Analog',
    'Biomechanical Neural HUD'
  ]),
  layoutDensity: z.enum([
    'Sparse & Cinematic',
    'Dense Tactical Data',
    'Ornate & Layered'
  ]),
  tactileAudioTone: z.string(),
  motionGuidelines: z.string()
});

export const ManifestoSchema = z.object({
  coreThesis: z.string(),
  visualPhilosophy: z.string(),
  emotionalCadence: z.string(),
  keyVisualMetaphors: z.array(z.string()),
  doList: z.array(z.string()),
  dontList: z.array(z.string())
});

export const MoodBoardTileSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: MoodTileCategorySchema,
  description: z.string(),
  promptSpec: z.string(),
  imageUrl: z.string(), // Allowing simple URLs or base64 data URIs
  philosophyTag: z.string(),
  materialTags: z.array(z.string()),
  lightingProfile: z.string(),
  focalPoint: z.string(),
  pinned: z.boolean().optional()
});

export const FineTuningStateSchema = z.object({
  density: z.number().min(1, { message: 'Density must be at least 1' }).max(10),
  contrast: z.number().min(1, { message: 'Contrast must be at least 1' }).max(10),
  eraBlend: z.string(),
  saturation: z.number().min(1, { message: 'Saturation must be at least 1' }).max(10),
  philosophicalDepth: z.number().min(1, { message: 'Philosophical depth must be at least 1' }).max(10)
});

export const AestheticBibleSchema = z.object({
  id: z.string(),
  title: z.string(),
  tagline: z.string(),
  genre: GenreCategorySchema,
  subgenre: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  philosophyAnchors: z.array(z.string()),
  manifesto: ManifestoSchema,
  colorSystem: ColorSystemSchema,
  typographySystem: TypographySystemSchema,
  shapeAndForm: ShapeAndFormSchema,
  interfaceAndHUD: InterfaceAndHUDSchema,
  moodBoard: z.array(MoodBoardTileSchema),
  fineTuning: FineTuningStateSchema
});

export const CohesionAuditResultSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.string(),
  summary: z.string(),
  alignmentPoints: z.array(z.string()),
  driftWarnings: z.array(z.string()),
  suggestedFixes: z.array(z.string())
});

export const DecodedImageAestheticSchema = z.object({
  title: z.string(),
  genreMatch: z.string(),
  subgenreMatch: z.string(),
  category: MoodTileCategorySchema,
  summaryDescription: z.string(),
  promptSpec: z.string(),
  philosophyTag: z.string(),
  dominantMaterials: z.array(z.string()),
  lightingProfile: z.string(),
  extractedPalette: z.array(ColorSwatchSchema),
  doAndDontGuidelines: z.object({
    doList: z.array(z.string()),
    dontList: z.array(z.string())
  })
});

/**
 * Generic schema flattener / expander helper to bound complex schemas
 * for LLM-native structured outputs.
 */
export function getExpandedSchemaFields(depth: number = 3): Record<string, any> {
  // Simple expansion representation mapping of types for LLMs
  return {
    description: 'Aesthetic Bible design system schema description',
    maxDepthBound: depth,
    schemas: {
      AestheticBible: 'AestheticBibleSchema',
      CohesionAuditResult: 'CohesionAuditResultSchema',
      DecodedImageAesthetic: 'DecodedImageAestheticSchema'
    }
  };
}
