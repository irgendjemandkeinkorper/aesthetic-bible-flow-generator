import { z } from 'zod';
import {
  GenreCategorySchema,
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
  AestheticBibleType,
  CohesionAuditResultSchema,
  DecodedImageAestheticSchema,
  CohesionAuditRequestSchema,
  GenerationPromptInputSchema
} from './services/schema';

export type GenreCategory = z.infer<typeof GenreCategorySchema>;
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

export type AestheticBible = AestheticBibleType;

export type CohesionAuditRequest = z.infer<typeof CohesionAuditRequestSchema>;
export type CohesionAuditResult = z.infer<typeof CohesionAuditResultSchema>;
export type GenerationPromptInput = z.infer<typeof GenerationPromptInputSchema>;
export type DecodedImageAesthetic = z.infer<typeof DecodedImageAestheticSchema>;
