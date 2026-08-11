export * from './types';
export * from './registry';
export * from './gemini';
export * from './metrics';
export * from './validationPipeline';

import { GeminiProviderAdapter } from './gemini';
import { providerRegistry } from './registry';

export const GEMINI_API_KEY_STORAGE_KEY = 'aesthetic-bible:gemini-api-key';

/** Registers a browser-side Gemini adapter using a key supplied by the user. */
export async function configureGeminiProvider(apiKey: string, signal?: AbortSignal): Promise<void> {
  providerRegistry.unregister('gemini');
  const adapter = new GeminiProviderAdapter(apiKey);
  await providerRegistry.register(adapter, apiKey, signal);
  providerRegistry.setActive(adapter.id);
}

