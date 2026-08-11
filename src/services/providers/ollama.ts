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
import { fetchWithTimeout } from '../localServer';
import type { CohesionCandidateType, ProviderAdapter, ProviderCapabilities, ProviderModel } from './types';
import { validateWithRepair } from './validationPipeline';

const TEXT_CAPABILITIES: ProviderCapabilities = {
  structuredOutput: true,
  vision: false,
  imageGeneration: false,
};

const VISION_CAPABILITIES: ProviderCapabilities = {
  structuredOutput: true,
  vision: true,
  imageGeneration: false,
};

export const OLLAMA_MODELS: readonly ProviderModel[] = [
  {
    id: 'llama3.2:latest',
    label: 'Llama 3.2 (local)',
    capabilities: TEXT_CAPABILITIES,
    inputCostPerMillionTokens: 0,
    outputCostPerMillionTokens: 0,
  },
  {
    id: 'llava:latest',
    label: 'LLaVA (local vision)',
    capabilities: VISION_CAPABILITIES,
    inputCostPerMillionTokens: 0,
    outputCostPerMillionTokens: 0,
  },
];

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_REACHABILITY_TIMEOUT_MS = 2_000;

function normalizeLocalBaseUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim() || DEFAULT_BASE_URL);
  } catch {
    throw new Error('Ollama URL must use HTTP on localhost, 127.0.0.1, or [::1].');
  }
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (parsed.protocol !== 'http:' || !localHosts.has(parsed.hostname)) {
    throw new Error('Ollama URL must use HTTP on localhost, 127.0.0.1, or [::1].');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Ollama URL must not contain credentials, a query, or a fragment.');
  }
  if (parsed.pathname !== '/' && parsed.pathname !== '') {
    throw new Error('Ollama URL must not contain a path.');
  }
  return parsed.origin;
}

function stripDataUrlPrefix(image: string): string {
  const comma = image.indexOf(',');
  return image.startsWith('data:') && comma >= 0 ? image.slice(comma + 1) : image;
}

export class OllamaProviderAdapter implements ProviderAdapter {
  readonly id = 'ollama';
  readonly label = 'Ollama';
  readonly requiresApiKey = false;
  readonly capabilities = VISION_CAPABILITIES;
  readonly models = OLLAMA_MODELS;

  private readonly baseUrl: string;

  constructor(
    baseUrl = DEFAULT_BASE_URL,
    private readonly request: typeof fetch = fetch,
    private readonly reachabilityTimeoutMs = DEFAULT_REACHABILITY_TIMEOUT_MS,
  ) {
    this.baseUrl = normalizeLocalBaseUrl(baseUrl);
  }

  async validateApiKey(_apiKey: string, signal?: AbortSignal): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      }, this.reachabilityTimeoutMs, this.request);
      return response.ok;
    } catch {
      return false;
    }
  }

  generateBible(brief: GenerationPromptInput, model: string, signal?: AbortSignal): Promise<AestheticBible> {
    return this.generateStructured(
      `Generate a complete aesthetic bible for this creative brief: ${JSON.stringify(brief)}. Use stable unique string IDs, ISO date strings, valid six-digit hex colors, and 4-6 mood-board tiles.`,
      model,
      AestheticBibleSchema,
      signal,
    );
  }

  decodeImage(imageBase64: string, _mimeType: string, model: string, signal?: AbortSignal): Promise<DecodedImageAesthetic> {
    const selected = this.requireModel(model);
    if (!selected.capabilities.vision) throw new Error(`Ollama model "${model}" does not support image input.`);
    return this.generateStructured(
      'Decode the supplied image into a reusable aesthetic direction.',
      model,
      DecodedImageAestheticSchema,
      signal,
      [stripDataUrlPrefix(imageBase64)],
    );
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

  private requireModel(model: string): ProviderModel {
    const selected = this.models.find((candidate) => candidate.id === model);
    if (!selected) throw new Error(`Unsupported Ollama model: ${model}`);
    return selected;
  }

  private async generateStructured<T>(
    prompt: string,
    model: string,
    schema: ZodType<T>,
    signal?: AbortSignal,
    images?: string[],
  ): Promise<T> {
    this.requireModel(model);
    const jsonSchema = z.toJSONSchema(schema);
    const schemaText = JSON.stringify(jsonSchema);
    const raw = await this.generateJson(
      `${prompt}\nReturn only valid JSON matching exactly this JSON Schema:\n${schemaText}`,
      model,
      jsonSchema,
      signal,
      images,
    );
    return validateWithRepair(
      raw,
      schema,
      (malformed, errors) => this.generateJson(
        `Repair this JSON so it satisfies exactly this JSON Schema. Return only the repaired JSON.\nJSON Schema: ${schemaText}\nValidation errors: ${errors}\nJSON: ${malformed}`,
        model,
        jsonSchema,
        signal,
        images,
      ),
      signal,
    );
  }

  private async generateJson(
    prompt: string,
    model: string,
    jsonSchema: unknown,
    signal?: AbortSignal,
    images?: string[],
  ): Promise<string> {
    signal?.throwIfAborted();
    const response = await this.request(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      // Ollama (0.5+) accepts a full JSON Schema as `format`, constraining generation
      // via grammar rather than relying on prompt instructions alone.
      body: JSON.stringify({ model, prompt, stream: false, format: jsonSchema, ...(images ? { images } : {}) }),
      signal,
    });
    const payload = await response.json() as OllamaGenerateResponse;
    if (!response.ok) throw new Error(payload.error || `Ollama request failed (${response.status}).`);
    if (!payload.response?.trim()) throw new Error('Ollama returned an empty response.');
    return payload.response;
  }
}
