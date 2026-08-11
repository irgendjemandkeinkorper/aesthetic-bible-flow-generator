import { z } from 'zod';
import {
  GenreCategorySchema,
  GamePerspectiveSchema,
  MechanicsArchetypeSchema,
  RenderingStyleSchema,
  MoodTileCategorySchema,
  ColorSwatchSchema,
  ColorSystemSchema,
  TypographyRoleSchema,
  TypographySystemSchema,
  ShapeAndFormSchema,
  InterfaceAndHUDSchema,
  ManifestoSchema,
  MoodBoardTileSchema,
  FineTuningStateSchema,
  MusicDirectionSchema,
  AestheticBibleSchema,
  CohesionAuditResultSchema,
  DecodedImageAestheticSchema,
  RunStatusSchema,
  RunSchema,
  ComparisonAuditSchema
} from './services/schema';

export type GenreCategory = z.infer<typeof GenreCategorySchema>;
export type GamePerspective = z.infer<typeof GamePerspectiveSchema>;
export type MechanicsArchetype = z.infer<typeof MechanicsArchetypeSchema>;
export type RenderingStyle = z.infer<typeof RenderingStyleSchema>;
export type MoodTileCategory = z.infer<typeof MoodTileCategorySchema>;
export type ColorSwatch = z.infer<typeof ColorSwatchSchema>;
export type ColorSystem = z.infer<typeof ColorSystemSchema>;
export type TypographyRole = z.infer<typeof TypographyRoleSchema>;
export type TypographySystem = z.infer<typeof TypographySystemSchema>;
export type ShapeAndForm = z.infer<typeof ShapeAndFormSchema>;
export type InterfaceAndHUD = z.infer<typeof InterfaceAndHUDSchema>;
export type Manifesto = z.infer<typeof ManifestoSchema>;
export type MoodBoardTile = z.infer<typeof MoodBoardTileSchema>;
export type FineTuningState = z.infer<typeof FineTuningStateSchema>;
export type MusicDirection = z.infer<typeof MusicDirectionSchema>;
export type AestheticBible = z.infer<typeof AestheticBibleSchema>;
export type CohesionAuditResult = z.infer<typeof CohesionAuditResultSchema>;
export type DecodedImageAesthetic = z.infer<typeof DecodedImageAestheticSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type Run = z.infer<typeof RunSchema>;
export type ComparisonAudit = z.infer<typeof ComparisonAuditSchema>;

export interface CohesionAuditRequest {
  bible: AestheticBible;
  candidateConcept: string;
  candidateType: 'Character' | 'Environment' | 'Item/Weapon' | 'UI Component' | 'Lore / Story Quest' | 'Audio / OST Note';
}

export interface GenerationPromptInput {
  title?: string;
  genre: GenreCategory;
  subgenre?: string;
  philosophyAnchors: string[];
  visualMood: string;
  gamePerspective?: GamePerspective;
  mechanicsArchetype?: MechanicsArchetype;
  renderingStyle?: RenderingStyle;
  artisticInfluences?: string[];
  musicTempo?: string;
  musicTexture?: string;
  musicInstrumentation?: string[];
  ambientMood?: string;
  fineTuning?: FineTuningState;
}
