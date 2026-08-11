import { GoogleGenAI } from '@google/genai';
import { z, type ZodType } from 'zod';
import {
  AestheticBibleSchema,
  ComparisonAuditSchema,
  CohesionAuditResultSchema,
  DecodedImageAestheticSchema,
} from '../schema';
import type {
  AestheticBible,
  ComparisonAudit,
  CohesionAuditResult,
  DecodedImageAesthetic,
  GenerationPromptInput,
} from '../../types';
import type { CohesionCandidateType, ProviderAdapter, ProviderCapabilities, ProviderModel } from './types';
import { validateWithRepair } from './validationPipeline';
import { buildAestheticBiblePrompt } from './prompt';
import { buildComparisonAuditPrompt } from '../comparisonAuditor';

interface GeminiResponseLike {
  text?: string;
}

export interface GeminiClientLike {
  models: {
    generateContent(request: Record<string, unknown>): Promise<GeminiResponseLike>;
  };
}

const CAPABILITIES: ProviderCapabilities = {
  structuredOutput: true,
  vision: true,
  // This adapter currently supports text and vision requests only. Mood-board
  // image generation remains an Express-server capability.
  imageGeneration: false,
};

export const GEMINI_MODELS: readonly ProviderModel[] = [
  {
    id: 'gemini-3.6-flash',
    label: 'Gemini 3.6 Flash',
    capabilities: CAPABILITIES,
    inputCostPerMillionTokens: 0.3,
    outputCostPerMillionTokens: 2.5,
  },
];

function abortIfRequested(signal?: AbortSignal): void {
  signal?.throwIfAborted();
}

function responseText(response: GeminiResponseLike): string {
  if (!response.text?.trim()) throw new Error('Gemini returned an empty response.');
  return response.text;
}

export class GeminiProviderAdapter implements ProviderAdapter {
  readonly id = 'gemini';
  readonly label = 'Google Gemini';
  readonly capabilities = CAPABILITIES;
  readonly models = GEMINI_MODELS;

  private readonly client: GeminiClientLike;

  constructor(private readonly apiKey: string, client?: GeminiClientLike) {
    if (!apiKey.trim()) throw new Error('A Gemini API key is required.');
    this.client = client ?? (new GoogleGenAI({ apiKey }) as unknown as GeminiClientLike);
  }

  async validateApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean> {
    abortIfRequested(signal);
    // Avoid spending a billable request during registration. Requests still surface
    // revoked or unauthorized keys through the normal adapter error path.
    return apiKey === this.apiKey && apiKey.trim().length >= 20;
  }

  async generateBible(
    brief: GenerationPromptInput,
    model: string,
    signal?: AbortSignal,
  ): Promise<AestheticBible> {
    const prompt = buildAestheticBiblePrompt(brief);
    return this.generateStructured(prompt, model, AestheticBibleSchema, signal);
  }

  async decodeImage(
    imageBase64: string,
    mimeType: string,
    model: string,
    signal?: AbortSignal,
  ): Promise<DecodedImageAesthetic> {
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const contents = [{
      role: 'user',
      parts: [
        { inlineData: { data, mimeType } },
        { text: 'Decode this image into a reusable aesthetic direction. Return only schema-compliant JSON.' },
      ],
    }];
    return this.generateStructured(contents, model, DecodedImageAestheticSchema, signal);
  }

  async auditCohesion(
    bible: AestheticBible,
    candidate: string,
    candidateType: CohesionCandidateType,
    model: string,
    signal?: AbortSignal,
  ): Promise<CohesionAuditResult> {
    const prompt = `Audit the candidate against the aesthetic bible. Return a 0-100 score, verdict, concise summary, alignment points, drift warnings, and actionable fixes.
Candidate type: ${candidateType}
Candidate: ${candidate}
Aesthetic bible: ${JSON.stringify(bible)}`;
    return this.generateStructured(prompt, model, CohesionAuditResultSchema, signal);
  }

  auditComparison(bibles: readonly AestheticBible[], model: string, signal?: AbortSignal): Promise<ComparisonAudit> {
    return this.generateStructured(buildComparisonAuditPrompt(bibles), model, ComparisonAuditSchema, signal);
  }

  private async generateStructured<T>(
    contents: unknown,
    model: string,
    schema: ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    this.requireModel(model);
    abortIfRequested(signal);
    const request = async (requestContents: unknown): Promise<string> => {
      abortIfRequested(signal);
      const response = await this.client.models.generateContent({
        model,
        contents: requestContents,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: z.toJSONSchema(schema),
          abortSignal: signal,
        },
      });
      abortIfRequested(signal);
      return responseText(response);
    };

    const raw = await request(contents);
    return validateWithRepair(
      raw,
      schema,
      (malformed, errors) => request(`Repair the following JSON so it conforms exactly to the supplied response schema. Return JSON only.\nValidation errors:\n${errors}\nMalformed JSON:\n${malformed}`),
      signal,
    );
  }

  private requireModel(modelId: string): void {
    if (!this.models.some((model) => model.id === modelId)) {
      throw new Error(`Unsupported Gemini model "${modelId}".`);
    }
  }
}
