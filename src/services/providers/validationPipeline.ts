import type { ZodType } from 'zod';

export type RepairRequester = (
  malformedResponse: string,
  validationErrors: string,
  signal?: AbortSignal,
) => Promise<string>;

function extractJson(value: string): string {
  const withoutFence = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const objectStart = withoutFence.indexOf('{');
  const arrayStart = withoutFence.indexOf('[');
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  if (starts.length === 0) return withoutFence;
  const start = Math.min(...starts);
  const objectEnd = withoutFence.lastIndexOf('}');
  const arrayEnd = withoutFence.lastIndexOf(']');
  return withoutFence.slice(start, Math.max(objectEnd, arrayEnd) + 1);
}

function parseJson(value: string): unknown {
  return JSON.parse(extractJson(value));
}

/** Repairs common transport damage without inventing missing domain data. */
export function locallyRepairJson(value: string): unknown {
  const normalized = extractJson(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'(?=\s*[,}])/g, (_, text: string) => `: ${JSON.stringify(text)}`);
  return JSON.parse(normalized);
}

function validationDetails(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function validateWithRepair<T>(
  rawResponse: string,
  schema: ZodType<T>,
  requestRepair?: RepairRequester,
  signal?: AbortSignal,
): Promise<T> {
  let originalError: unknown;
  try {
    return schema.parse(parseJson(rawResponse));
  } catch (error) {
    originalError = error;
  }

  if (requestRepair) {
    try {
      const repaired = await requestRepair(rawResponse, validationDetails(originalError), signal);
      return schema.parse(parseJson(repaired));
    } catch {
      // The deterministic repair below is deliberately the final recovery step.
    }
  }

  try {
    return schema.parse(locallyRepairJson(rawResponse));
  } catch (localError) {
    throw new Error(
      `Provider response failed schema validation and repair: ${validationDetails(localError)}`,
      { cause: originalError },
    );
  }
}

