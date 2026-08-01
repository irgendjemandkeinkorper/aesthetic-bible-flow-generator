export type GenreCategory = 
  | 'Grimdark Fantasy'
  | 'Cyberpunk / Synth-Noir'
  | 'Solarpunk Biophilia'
  | 'Eldritch Cosmic Horror'
  | 'Cassette Futurism'
  | 'Clockwork / Dieselpunk Alchemy'
  | 'Brutalist Space Opera'
  | 'Post-Apocalyptic Scavenger'
  | 'Cyber-Zen Shinto'
  | 'Custom / Hybrid Speculative';

export type MoodTileCategory = 
  | 'Environment' 
  | 'Character' 
  | 'Item/Prop' 
  | 'Architecture' 
  | 'UI/HUD' 
  | 'Lighting & FX';

export interface ColorSwatch {
  name: string;
  hex: string;
  usage: string;
}

export interface ColorSystem {
  primary: ColorSwatch;
  secondary: ColorSwatch;
  accent: ColorSwatch;
  neutralDark: ColorSwatch;
  neutralLight: ColorSwatch;
  specularGlow: ColorSwatch;
  paletteNotes: string;
}

export interface TypographyRole {
  name: string;
  category: string;
  usage: string;
}

export interface TypographySystem {
  displayFont: TypographyRole;
  headingFont: TypographyRole;
  bodyFont: TypographyRole;
  monoFont: TypographyRole;
  hierarchyRules: string[];
}

export interface ShapeAndForm {
  dominantGeometry: string;
  silhouetteStyle: string;
  materialAndTextures: string[];
  gritAndWeathering: string;
}

export interface InterfaceAndHUD {
  diegeticType: 'Diegetic (In-World)' | 'Minimalist Holo-Wireframe' | 'Ornate Tactile Analog' | 'Biomechanical Neural HUD';
  layoutDensity: 'Sparse & Cinematic' | 'Dense Tactical Data' | 'Ornate & Layered';
  tactileAudioTone: string;
  motionGuidelines: string;
}

export interface Manifesto {
  coreThesis: string;
  visualPhilosophy: string;
  emotionalCadence: string;
  keyVisualMetaphors: string[];
  doList: string[];
  dontList: string[];
}

export interface MoodBoardTile {
  id: string;
  title: string;
  category: MoodTileCategory;
  description: string;
  promptSpec: string;
  imageUrl: string;
  philosophyTag: string;
  materialTags: string[];
  lightingProfile: string;
  focalPoint: string;
  pinned?: boolean;
}

export interface FineTuningState {
  density: number; // 1 - 10
  contrast: number; // 1 - 10
  eraBlend: string;
  saturation: number; // 1 - 10
  philosophicalDepth: number; // 1 - 10
}

export interface AestheticBible {
  id: string;
  title: string;
  tagline: string;
  genre: GenreCategory;
  subgenre: string;
  createdAt: string;
  updatedAt: string;
  philosophyAnchors: string[];
  manifesto: Manifesto;
  colorSystem: ColorSystem;
  typographySystem: TypographySystem;
  shapeAndForm: ShapeAndForm;
  interfaceAndHUD: InterfaceAndHUD;
  moodBoard: MoodBoardTile[];
  fineTuning: FineTuningState;
}

export interface CohesionAuditRequest {
  bible: AestheticBible;
  candidateConcept: string;
  candidateType: 'Character' | 'Environment' | 'Item/Weapon' | 'UI Component' | 'Lore / Story Quest' | 'Audio / OST Note';
}

export interface CohesionAuditResult {
  score: number; // 0-100
  verdict: string;
  summary: string;
  alignmentPoints: string[];
  driftWarnings: string[];
  suggestedFixes: string[];
}

export interface GenerationPromptInput {
  title?: string;
  genre: GenreCategory;
  subgenre?: string;
  philosophyAnchors: string[];
  visualMood: string;
  fineTuning?: FineTuningState;
}

export interface DecodedImageAesthetic {
  title: string;
  genreMatch: string;
  subgenreMatch: string;
  category: MoodTileCategory;
  summaryDescription: string;
  promptSpec: string;
  philosophyTag: string;
  dominantMaterials: string[];
  lightingProfile: string;
  extractedPalette: ColorSwatch[];
  doAndDontGuidelines: {
    doList: string[];
    dontList: string[];
  };
}

