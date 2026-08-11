import Anthropic from '@anthropic-ai/sdk';
import { z, type ZodType } from 'zod';
import {
  AestheticBibleSchema,
  CohesionAuditResultSchema,
  DecodedImageAestheticSchema,
} from '../schema';
import type {
  AestheticBible,
  CohesionAuditResult,
  DecodedImageAesthetic,
  GenerationPromptInput,
} from '../../types';
import type { CohesionCandidateType, ProviderAdapter, ProviderCapabilities, ProviderModel } from './types';
import { validateWithRepair } from './validationPipeline';
import { buildAestheticBiblePrompt } from './prompt';

const CAPABILITIES: ProviderCapabilities = {
  structuredOutput: false,
  vision: true,
  imageGeneration: false,
};

export const ANTHROPIC_MODELS: readonly ProviderModel[] = [
  {
    id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    capabilities: CAPABILITIES,
    inputCostPerMillionTokens: 3,
    outputCostPerMillionTokens: 15,
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    capabilities: CAPABILITIES,
    inputCostPerMillionTokens: 1,
    outputCostPerMillionTokens: 5,
  },
];

interface AnthropicTextBlock { type: string; text?: string }
interface AnthropicResponseLike { content: AnthropicTextBlock[] }
export interface AnthropicClientLike {
  messages: {
    create(body: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<AnthropicResponseLike>;
  };
}

export class AnthropicProviderAdapter implements ProviderAdapter {
  readonly id = 'anthropic';
  readonly label = 'Anthropic';
  readonly capabilities = CAPABILITIES;
  readonly models = ANTHROPIC_MODELS;
  private readonly client: AnthropicClientLike;

  constructor(private readonly apiKey: string, client?: AnthropicClientLike) {
    if (!apiKey.trim()) throw new Error('An Anthropic API key is required.');
    this.client = client ?? (new Anthropic({ apiKey, dangerouslyAllowBrowser: true }) as unknown as AnthropicClientLike);
  }

  async validateApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean> {
    signal?.throwIfAborted();
    return apiKey === this.apiKey && /^sk-ant-[A-Za-z0-9_-]{16,}$/.test(apiKey.trim());
  }

  generateBible(brief: GenerationPromptInput, model: string, signal?: AbortSignal): Promise<AestheticBible> {
    return this.generateStructured(
      buildAestheticBiblePrompt(brief),
      model,
      AestheticBibleSchema,
      signal,
    );
  }

  decodeImage(imageBase64: string, mimeType: string, model: string, signal?: AbortSignal): Promise<DecodedImageAesthetic> {
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    return this.generateStructured([
      { type: 'image', source: { type: 'base64', media_type: mimeType, data } },
      { type: 'text', text: 'Decode this image into a reusable aesthetic direction.' },
    ], model, DecodedImageAestheticSchema, signal);
  }

  auditCohesion(
    bible: AestheticBible,
    candidate: string,
    candidateType: CohesionCandidateType,
    model: string,
    signal?: AbortSignal,
  ): Promise<CohesionAuditResult> {
    return this.generateStructured(
      `Audit this ${candidateType} candidate against the aesthetic bible. Candidate: ${candidate}\nAesthetic bible: ${JSON.stringify(bible)}`,
      model,
      CohesionAuditResultSchema,
      signal,
    );
  }

  private async generateStructured<T>(
    content: unknown,
    model: string,
    schema: ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    this.requireModel(model);
    const system = `Return exactly one JSON value with no markdown or commentary. It must match this JSON Schema exactly:\n${JSON.stringify(z.toJSONSchema(schema))}`;
    const request = async (requestContent: unknown, requestSystem = system): Promise<string> => {
      signal?.throwIfAborted();
      const response = await this.client.messages.create({
        model,
        max_tokens: 8192,
        system: requestSystem,
        messages: [{ role: 'user', content: requestContent }],
      }, { signal });
      const text = response.content.filter((block) => block.type === 'text').map((block) => block.text ?? '').join('');
      if (!text.trim()) throw new Error('Anthropic returned an empty response.');
      return text;
    };

    const raw = await request(content);
    return validateWithRepair(
      raw,
      schema,
      (malformed, errors) => request(
        `Repair this JSON. Return JSON only.\nValidation errors: ${errors}\nMalformed JSON: ${malformed}`,
        system,
      ),
      signal,
    );
  }

  private requireModel(modelId: string): void {
    if (!this.models.some((model) => model.id === modelId)) {
      throw new Error(`Unsupported Anthropic model "${modelId}".`);
    }
  }
}
