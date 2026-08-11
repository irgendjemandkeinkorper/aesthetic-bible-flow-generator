import {
  ANTHROPIC_API_KEY_STORAGE_KEY,
  GEMINI_API_KEY_STORAGE_KEY,
  OLLAMA_API_KEY_STORAGE_KEY,
  OPENAI_API_KEY_STORAGE_KEY,
} from './providers';

export const PROVIDER_SETTINGS = [
  { id: 'gemini', label: 'Gemini', storageKey: GEMINI_API_KEY_STORAGE_KEY, available: true },
  { id: 'openai', label: 'OpenAI', storageKey: OPENAI_API_KEY_STORAGE_KEY, available: false },
  { id: 'anthropic', label: 'Anthropic', storageKey: ANTHROPIC_API_KEY_STORAGE_KEY, available: false },
  { id: 'ollama', label: 'Ollama', storageKey: OLLAMA_API_KEY_STORAGE_KEY, available: false },
] as const;

export type ProviderId = (typeof PROVIDER_SETTINGS)[number]['id'];
export type ProviderKeys = Record<ProviderId, string>;

const emptyKeys = (): ProviderKeys => ({ gemini: '', openai: '', anthropic: '', ollama: '' });

export function readProviderKeys(storage: Pick<Storage, 'getItem'>): ProviderKeys {
  return PROVIDER_SETTINGS.reduce((keys, provider) => {
    keys[provider.id] = storage.getItem(provider.storageKey) ?? '';
    return keys;
  }, emptyKeys());
}

export function persistProviderKey(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  providerId: ProviderId,
  value: string,
): string {
  const provider = PROVIDER_SETTINGS.find((candidate) => candidate.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const normalized = value.trim();
  if (normalized) storage.setItem(provider.storageKey, normalized);
  else storage.removeItem(provider.storageKey);
  return normalized;
}
