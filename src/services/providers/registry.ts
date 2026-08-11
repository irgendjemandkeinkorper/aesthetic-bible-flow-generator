import type { ProviderAdapter } from './types';

export type ProviderRegistryListener = () => void;

export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();
  private activeProviderId: string | null = null;
  private readonly listeners = new Set<ProviderRegistryListener>();

  /** Subscribes to registration/active-provider changes; returns an unsubscribe function. */
  subscribe(listener: ProviderRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  async register(adapter: ProviderAdapter, apiKey: string, signal?: AbortSignal): Promise<void> {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Provider "${adapter.id}" is already registered.`);
    }
    if (adapter.requiresApiKey !== false && !apiKey.trim()) throw new Error('An API key is required.');
    if (!(await adapter.validateApiKey(apiKey, signal))) {
      throw new Error(adapter.requiresApiKey === false
        ? `Provider "${adapter.id}" is unavailable.`
        : `Invalid API key for provider "${adapter.id}".`);
    }

    this.adapters.set(adapter.id, adapter);
    this.activeProviderId ??= adapter.id;
    this.notify();
  }

  unregister(providerId: string): boolean {
    const removed = this.adapters.delete(providerId);
    if (this.activeProviderId === providerId) {
      this.activeProviderId = this.adapters.keys().next().value ?? null;
    }
    if (removed) this.notify();
    return removed;
  }

  setActive(providerId: string): void {
    if (!this.adapters.has(providerId)) {
      throw new Error(`Provider "${providerId}" is not registered.`);
    }
    this.activeProviderId = providerId;
    this.notify();
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
    this.notify();
  }
}

export const providerRegistry = new ProviderRegistry();
