import { describe, expect, it } from 'vitest';
import {
  ANTHROPIC_API_KEY_STORAGE_KEY,
  GEMINI_API_KEY_STORAGE_KEY,
  OLLAMA_API_KEY_STORAGE_KEY,
  OPENAI_API_KEY_STORAGE_KEY,
} from './providers';
import { persistProviderKey, PROVIDER_SETTINGS, readProviderKeys } from './providerSettings';

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe('provider settings persistence', () => {
  it('marks all implemented cloud adapters as available', () => {
    expect(PROVIDER_SETTINGS.filter((provider) => ['gemini', 'openai', 'anthropic'].includes(provider.id)).every((provider) => provider.available)).toBe(true);
  });
  it('persists trimmed provider keys under provider-specific keys', () => {
    const storage = createStorage();
    persistProviderKey(storage, 'gemini', '  gemini-secret  ');
    persistProviderKey(storage, 'openai', 'openai-secret');
    persistProviderKey(storage, 'anthropic', 'anthropic-secret');
    persistProviderKey(storage, 'ollama', 'ollama-secret');
    expect(storage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBe('gemini-secret');
    expect(storage.getItem(OPENAI_API_KEY_STORAGE_KEY)).toBe('openai-secret');
    expect(storage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY)).toBe('anthropic-secret');
    expect(storage.getItem(OLLAMA_API_KEY_STORAGE_KEY)).toBe('ollama-secret');
    expect(readProviderKeys(storage)).toEqual({
      gemini: 'gemini-secret',
      openai: 'openai-secret',
      anthropic: 'anthropic-secret',
      ollama: 'ollama-secret',
    });
  });

  it('deletes a key immediately when cleared', () => {
    const storage = createStorage();
    persistProviderKey(storage, 'gemini', 'secret');
    persistProviderKey(storage, 'gemini', '');
    expect(storage.getItem(GEMINI_API_KEY_STORAGE_KEY)).toBeNull();
  });
});
