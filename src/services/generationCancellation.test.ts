import { describe, expect, it, vi } from 'vitest';
import { GenerationCancellationRegistry } from './generationCancellation';

describe('GenerationCancellationRegistry', () => {
  it('aborts only the selected generation', () => {
    const registry = new GenerationCancellationRegistry();
    const first = registry.start('openai:model');
    const second = registry.start('gemini:model');
    const firstAbort = vi.fn();
    const secondAbort = vi.fn();
    first.signal.addEventListener('abort', firstAbort);
    second.signal.addEventListener('abort', secondAbort);

    expect(registry.cancel('openai:model')).toBe(true);
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(firstAbort).toHaveBeenCalledOnce();
    expect(secondAbort).not.toHaveBeenCalled();
  });

  it('does not let an older request finish remove its replacement', () => {
    const registry = new GenerationCancellationRegistry();
    const oldController = registry.start('provider:model');
    const replacement = registry.start('provider:model');
    registry.finish('provider:model', oldController);
    expect(registry.isActive('provider:model')).toBe(true);
    expect(replacement.signal.aborted).toBe(false);
  });

  it('aborts every active request during cleanup', () => {
    const registry = new GenerationCancellationRegistry();
    const controllers = [registry.start('one'), registry.start('two')];
    registry.cancelAll();
    expect(controllers.every((controller) => controller.signal.aborted)).toBe(true);
  });
});
