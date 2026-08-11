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

const CAPABILITIES: ProviderCapabilities = {
  structuredOutput: true,
  vision: true,
  imageGeneration: false,
};

export const OPENAI_MODELS: readonly ProviderModel[] = [
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 mini',
    capabilities: CAPABILITIES,
    inputCostPerMillionTokens: 0.4,
    outputCostPerMillionTokens: 1.6,
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    capabilities: CAPABILITIES,
    inputCostPerMillionTokens: 2,
    outputCostPerMillionTokens: 8,
  },
];

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

/**
 * OpenAI's strict structured-output mode requires every object property to be listed in
 * `required`; properties that are optional in the source Zod schema are instead modeled as
 * nullable so the model can emit `null` for "not present" rather than omitting the key.
 */
function toStrictJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStrictJsonSchema);
  if (node === null || typeof node !== 'object') return node;

  const schema = { ...(node as Record<string, unknown>) };
  if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object') {
    const properties = schema.properties as Record<string, unknown>;
    const originalRequired = new Set(Array.isArray(schema.required) ? schema.required as string[] : []);
    const propertyKeys = Object.keys(properties);

    schema.properties = Object.fromEntries(propertyKeys.map((key) => {
      const value = toStrictJsonSchema(properties[key]) as Record<string, unknown>;
      if (originalRequired.has(key)) return [key, value];

      const existingType = value.type;
      const nullableType = Array.isArray(existingType)
        ? [...new Set([...existingType, 'null'])]
        : existingType
          ? [existingType, 'null']
          : existingType;
      return [key, nullableType ? { ...value, type: nullableType } : value];
    }));
    schema.required = propertyKeys;
    schema.additionalProperties = false;
  } else {
    for (const key of Object.keys(schema)) {
      schema[key] = toStrictJsonSchema(schema[key]);
    }
  }
  return schema;
}

/** OpenAI emits `null` for schema-optional fields; strip those keys so Zod's `.optional()` (which expects `undefined`) still validates. */
function stripExplicitNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripExplicitNulls);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => [k, stripExplicitNulls(v)]),
  );
}

export type OpenAIFetch = typeof fetch;

export class OpenAIProviderAdapter implements ProviderAdapter {
  readonly id = 'openai';
  readonly label = 'OpenAI';
  readonly capabilities = CAPABILITIES;
  readonly models = OPENAI_MODELS;

  constructor(private readonly apiKey: string, private readonly request: OpenAIFetch = fetch) {
    if (!apiKey.trim()) throw new Error('An OpenAI API key is required.');
  }

  async validateApiKey(apiKey: string, signal?: AbortSignal): Promise<boolean> {
    signal?.throwIfAborted();
    return apiKey === this.apiKey && /^sk-[A-Za-z0-9_-]{16,}$/.test(apiKey.trim());
  }

  generateBible(brief: GenerationPromptInput, model: string, signal?: AbortSignal): Promise<AestheticBible> {
    return this.generateStructured(
      `Generate a complete aesthetic bible for this creative brief: ${JSON.stringify(brief)}. Use stable unique string IDs, ISO date strings, valid six-digit hex colors, and 4-6 mood-board tiles.`,
      model,
      'aesthetic_bible',
      AestheticBibleSchema,
      signal,
    );
  }

  decodeImage(imageBase64: string, mimeType: string, model: string, signal?: AbortSignal): Promise<DecodedImageAesthetic> {
    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
    return this.generateStructured([
      { type: 'text', text: 'Decode this image into a reusable aesthetic direction.' },
      { type: 'image_url', image_url: { url: imageUrl } },
    ], model, 'decoded_image_aesthetic', DecodedImageAestheticSchema, signal);
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
      'cohesion_audit',
      CohesionAuditResultSchema,
      signal,
    );
  }

  private async generateStructured<T>(
    content: unknown,
    model: string,
    schemaName: string,
    schema: ZodType<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    this.requireModel(model);
    const jsonSchema = toStrictJsonSchema(z.toJSONSchema(schema));
    const request = async (requestContent: unknown): Promise<string> => {
      signal?.throwIfAborted();
      const response = await this.request('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Return only JSON that satisfies the supplied strict response schema.' },
            { role: 'user', content: requestContent },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: schemaName, strict: true, schema: jsonSchema },
          },
        }),
        signal,
      });
      const payload = await response.json() as OpenAIResponse;
      if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed (${response.status}).`);
      const text = payload.choices?.[0]?.message?.content;
      if (!text?.trim()) throw new Error('OpenAI returned an empty response.');
      // Strict mode returns explicit `null` for schema-optional fields; strip them so the
      // shared Zod schemas' `.optional()` fields (which expect `undefined`, not `null`) validate.
      try {
        return JSON.stringify(stripExplicitNulls(JSON.parse(text)));
      } catch {
        return text;
      }
    };

    const raw = await request(content);
    return validateWithRepair(
      raw,
      schema,
      (malformed, errors) => request(`Repair this JSON to satisfy the response schema. Return JSON only.\nErrors: ${errors}\nJSON: ${malformed}`),
      signal,
    );
  }

  private requireModel(modelId: string): void {
    if (!this.models.some((model) => model.id === modelId)) {
      throw new Error(`Unsupported OpenAI model "${modelId}".`);
    }
  }
}
