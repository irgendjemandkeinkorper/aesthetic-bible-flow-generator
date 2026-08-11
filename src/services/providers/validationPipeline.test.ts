import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateWithRepair } from './validationPipeline';

const ExampleSchema = z.object({ name: z.string(), values: z.array(z.number()) });

describe('validateWithRepair', () => {
  it('uses the LLM repair response after validation failure', async () => {
    const requestRepair = vi.fn().mockResolvedValue('{"name":"fixed","values":[1,2]}');
    await expect(validateWithRepair('{"name":3}', ExampleSchema, requestRepair))
      .resolves.toEqual({ name: 'fixed', values: [1, 2] });
    expect(requestRepair.mock.calls[0][1]).toContain('values');
  });

  it('falls back to deterministic repair for malformed JSON', async () => {
    const requestRepair = vi.fn().mockRejectedValue(new Error('repair unavailable'));
    await expect(validateWithRepair("```json\n{'name':'fixed','values':[1,2,],}\n```", ExampleSchema, requestRepair))
      .resolves.toEqual({ name: 'fixed', values: [1, 2] });
  });
});

