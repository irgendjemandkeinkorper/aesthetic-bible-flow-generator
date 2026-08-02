import { z } from 'zod';

// ==========================================
// 1. Core Categories and Enums
// ==========================================

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

// ==========================================
// 2. Sub-structures & Systems
// ==========================================

export const ColorSwatchSchema = z.object({
  name: z.string(),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "Primary hex code format must be a valid 6-character hex code starting with #"
  }),
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
  imageUrl: z.string(),
  philosophyTag: z.string(),
  materialTags: z.array(z.string()),
  lightingProfile: z.string(),
  focalPoint: z.string(),
  pinned: z.boolean().optional()
});

export const FineTuningStateSchema = z.object({
  density: z.number().min(1).max(10),
  contrast: z.number().min(1).max(10),
  eraBlend: z.string(),
  saturation: z.number().min(1).max(10),
  philosophicalDepth: z.number().min(1).max(10)
});

// ==========================================
// 3. Aesthetic Bible Schema & Recursion Helpers
// ==========================================

export const baseAestheticBibleFields = {
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
  fineTuning: FineTuningStateSchema,
};

export const baseAestheticBibleSchema = z.object(baseAestheticBibleFields);

// Inferred non-recursive type helper
export type BaseAestheticBible = z.infer<typeof baseAestheticBibleSchema>;

// Exact type including recursive self-referencing structures
export type AestheticBibleType = BaseAestheticBible & {
  subBibles?: AestheticBibleType[];
};

// Recursive schema definition utilizing z.lazy
export const AestheticBibleSchema: z.ZodType<AestheticBibleType> = baseAestheticBibleSchema.extend({
  subBibles: z.lazy(() => z.array(AestheticBibleSchema)).optional()
});

/**
 * Generates a bounded non-recursive AestheticBible schema up to a specified depth.
 * This is crucial because Gemini and other structured output engines reject recursive schemas.
 *
 * @param depth The maximum level of nesting to allow. Default is 3.
 */
export function expandAestheticBibleSchema(depth: number = 3): z.ZodObject<any> {
  if (depth <= 1) {
    return baseAestheticBibleSchema;
  }
  return baseAestheticBibleSchema.extend({
    subBibles: z.array(expandAestheticBibleSchema(depth - 1)).optional()
  });
}

// ==========================================
// 4. Cohesion Audit & Image Decoding Schemas
// ==========================================

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

// Helper request/input schemas
export const CohesionAuditRequestSchema = z.object({
  bible: AestheticBibleSchema,
  candidateConcept: z.string(),
  candidateType: z.enum([
    'Character',
    'Environment',
    'Item/Weapon',
    'UI Component',
    'Lore / Story Quest',
    'Audio / OST Note'
  ])
});

export const GenerationPromptInputSchema = z.object({
  title: z.string().optional(),
  genre: GenreCategorySchema,
  subgenre: z.string().optional(),
  philosophyAnchors: z.array(z.string()),
  visualMood: z.string(),
  fineTuning: FineTuningStateSchema.optional()
});
