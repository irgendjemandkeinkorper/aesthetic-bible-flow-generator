import type {
  AestheticBible,
  ComparisonAudit,
  CohesionAuditResult,
  DecodedImageAesthetic,
  GenerationPromptInput,
} from '../../types';

export interface ProviderCapabilities {
  structuredOutput: boolean;
  vision: boolean;
  imageGeneration: boolean;
}

export interface ProviderModel {
  id: string;
  label: string;
  capabilities: ProviderCapabilities;
  /** Estimated USD per one million tokens. */
  inputCostPerMillionTokens: number;
  /** Estimated USD per one million tokens. */
  outputCostPerMillionTokens: number;
}

export type CohesionCandidateType =
  | 'Character'
  | 'Environment'
  | 'Item/Weapon'
  | 'UI Component'
  | 'Lore / Story Quest'
  | 'Audio / OST Note';

export interface ProviderAdapter {
  readonly id: string;
  readonly label: string;
  /** Keyless local providers may opt out of the registry's credential guard. */
  readonly requiresApiKey?: boolean;
  readonly capabilities: ProviderCapabilities;
  readonly models: readonly ProviderModel[];

  validateApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean>;
  generateBible(
    brief: GenerationPromptInput,
    model: string,
    signal?: AbortSignal,
  ): Promise<AestheticBible>;
  decodeImage(
    imageBase64: string,
    mimeType: string,
    model: string,
    signal?: AbortSignal,
  ): Promise<DecodedImageAesthetic>;
  auditCohesion(
    bible: AestheticBible,
    candidate: string,
    candidateType: CohesionCandidateType,
    model: string,
    signal?: AbortSignal,
  ): Promise<CohesionAuditResult>;
  auditComparison?(
    bibles: readonly AestheticBible[],
    model: string,
    signal?: AbortSignal,
  ): Promise<ComparisonAudit>;
}
