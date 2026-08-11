import { describe, expect, it } from 'vitest';
import { GenerationGuard } from './generationGuard';

describe('GenerationGuard', () => {
  it('reports a fresh key as generation 0 and current', () => {
    const guard = new GenerationGuard();
    expect(guard.current('ollama')).toBe(0);
    expect(guard.isCurrent('ollama', 0)).toBe(true);
  });

  it('marks an earlier generation stale once a later one starts', () => {
    const guard = new GenerationGuard();
    const first = guard.bump('ollama');
    const second = guard.bump('ollama');

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(guard.isCurrent('ollama', first)).toBe(false);
    expect(guard.isCurrent('ollama', second)).toBe(true);
  });

  it('models two overlapping Settings saves for the same provider: only the newer one commits', () => {
    const guard = new GenerationGuard();

    // Save A starts (e.g. user clicks Save with keyA)...
    const generationA = guard.bump('ollama');
    // ...then Save B starts before A's network call resolves (user edits again and saves).
    const generationB = guard.bump('ollama');

    // A's async configure() finally resolves first (network reordering).
    expect(guard.isCurrent('ollama', generationA)).toBe(false); // A must discard its result.
    // B's async configure() resolves after.
    expect(guard.isCurrent('ollama', generationB)).toBe(true); // B is the one that commits.
  });

  it('keeps generations independent per key', () => {
    const guard = new GenerationGuard();
    const geminiGen = guard.bump('gemini');
    const ollamaGen = guard.bump('ollama');

    expect(guard.isCurrent('gemini', geminiGen)).toBe(true);
    expect(guard.isCurrent('ollama', ollamaGen)).toBe(true);
  });
});
