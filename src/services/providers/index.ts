export * from './types';
export * from './registry';
export * from './gemini';
export * from './openai';
export * from './anthropic';
export * from './metrics';
export * from './validationPipeline';
export * from './selection';

import { GeminiProviderAdapter } from './gemini';
import { OpenAIProviderAdapter } from './openai';
import { AnthropicProviderAdapter } from './anthropic';
import { providerRegistry } from './registry';

export const GEMINI_API_KEY_STORAGE_KEY = 'aesthetic-bible:gemini-api-key';
export const OPENAI_API_KEY_STORAGE_KEY = 'aesthetic-bible:openai-api-key';
export const ANTHROPIC_API_KEY_STORAGE_KEY = 'aesthetic-bible:anthropic-api-key';
export const OLLAMA_API_KEY_STORAGE_KEY = 'aesthetic-bible:ollama-api-key';

/** Registers a browser-side Gemini adapter using a key supplied by the user. */
export async function configureGeminiProvider(apiKey: string, signal?: AbortSignal): Promise<void> {
  providerRegistry.unregister('gemini');
  const adapter = new GeminiProviderAdapter(apiKey);
  await providerRegistry.register(adapter, apiKey, signal);
  providerRegistry.setActive(adapter.id);
}

export async function configureOpenAIProvider(apiKey: string, signal?: AbortSignal): Promise<void> {
  providerRegistry.unregister('openai');
  const adapter = new OpenAIProviderAdapter(apiKey);
  await providerRegistry.register(adapter, apiKey, signal);
}

export async function configureAnthropicProvider(apiKey: string, signal?: AbortSignal): Promise<void> {
  providerRegistry.unregister('anthropic');
  const adapter = new AnthropicProviderAdapter(apiKey);
  await providerRegistry.register(adapter, apiKey, signal);
}
