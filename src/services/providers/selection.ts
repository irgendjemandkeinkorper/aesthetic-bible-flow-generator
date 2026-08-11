import type { ProviderKeys } from '../providerSettings';
import { ANTHROPIC_MODELS } from './anthropic';
import { GEMINI_MODELS } from './gemini';
import { OPENAI_MODELS } from './openai';
import type { ProviderAdapter, ProviderCapabilities, ProviderModel } from './types';

export interface ProviderModelOption {
  key: string;
  providerId: 'gemini' | 'openai' | 'anthropic';
  providerLabel: string;
  model: ProviderModel;
  enabled: boolean;
  disabledReason?: string;
}

const CATALOG = [
  { id: 'gemini' as const, label: 'Google Gemini', models: GEMINI_MODELS },
  { id: 'openai' as const, label: 'OpenAI', models: OPENAI_MODELS },
  { id: 'anthropic' as const, label: 'Anthropic', models: ANTHROPIC_MODELS },
];

export function providerModelKey(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`;
}

export function getProviderModelOptions(
  keys: ProviderKeys,
  adapters: readonly ProviderAdapter[],
): ProviderModelOption[] {
  const registered = new Set(adapters.map((adapter) => adapter.id));
  return CATALOG.flatMap((provider) => provider.models.map((model) => {
    const hasKey = Boolean(keys[provider.id].trim());
    const isRegistered = registered.has(provider.id);
    return {
      key: providerModelKey(provider.id, model.id),
      providerId: provider.id,
      providerLabel: provider.label,
      model,
      enabled: hasKey && isRegistered,
      disabledReason: !hasKey ? 'Add a key in Settings' : !isRegistered ? 'Provider is still activating' : undefined,
    };
  }));
}

export function resolveProviderModel(
  selection: string,
  adapters: readonly ProviderAdapter[],
): { adapter: ProviderAdapter; model: ProviderModel } | undefined {
  const separator = selection.indexOf(':');
  if (separator < 1) return undefined;
  const providerId = selection.slice(0, separator);
  const modelId = selection.slice(separator + 1);
  const adapter = adapters.find((candidate) => candidate.id === providerId);
  const model = adapter?.models.find((candidate) => candidate.id === modelId);
  return adapter && model ? { adapter, model } : undefined;
}

export function capabilityAllowed(capabilities: ProviderCapabilities | undefined, capability: keyof ProviderCapabilities): boolean {
  return capabilities?.[capability] === true;
}
