import type { ProviderAdapter } from './types';

export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();
  private activeProviderId: string | null = null;

  async register(adapter: ProviderAdapter, apiKey: string, signal?: AbortSignal): Promise<void> {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Provider "${adapter.id}" is already registered.`);
    }
    if (!apiKey.trim()) throw new Error('An API key is required.');
    if (!(await adapter.validateApiKey(apiKey, signal))) {
      throw new Error(`Invalid API key for provider "${adapter.id}".`);
    }

    this.adapters.set(adapter.id, adapter);
    this.activeProviderId ??= adapter.id;
  }

  unregister(providerId: string): boolean {
    const removed = this.adapters.delete(providerId);
    if (this.activeProviderId === providerId) {
      this.activeProviderId = this.adapters.keys().next().value ?? null;
    }
    return removed;
  }

  setActive(providerId: string): void {
    if (!this.adapters.has(providerId)) {
      throw new Error(`Provider "${providerId}" is not registered.`);
    }
    this.activeProviderId = providerId;
  }

  get(providerId: string): ProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  getActive(): ProviderAdapter | undefined {
    return this.activeProviderId ? this.adapters.get(this.activeProviderId) : undefined;
  }

  list(): readonly ProviderAdapter[] {
    return [...this.adapters.values()];
  }

  clear(): void {
    this.adapters.clear();
    this.activeProviderId = null;
  }
}

export const providerRegistry = new ProviderRegistry();

