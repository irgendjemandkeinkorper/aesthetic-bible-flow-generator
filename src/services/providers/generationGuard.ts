/**
 * Tracks a per-key generation counter so overlapping async operations for the same key
 * can detect when a newer operation has superseded them and discard their own result
 * instead of racing it. Used to serialize interactive provider-configuration changes
 * (and the initial mount-time auto-configure) against each other per provider id.
 */
export class GenerationGuard {
  private readonly generations = new Map<string, number>();

  /** Bumps and returns the new current generation for `key`. Call before starting async work. */
  bump(key: string): number {
    const next = (this.generations.get(key) ?? 0) + 1;
    this.generations.set(key, next);
    return next;
  }

  /** Returns the current generation for `key` without bumping it (0 if never bumped). */
  current(key: string): number {
    return this.generations.get(key) ?? 0;
  }

  /** True if `generation` is still the latest for `key` — i.e. nothing newer has started. */
  isCurrent(key: string, generation: number): boolean {
    return this.current(key) === generation;
  }
}
