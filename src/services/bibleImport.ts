import { z } from 'zod';
import { AestheticBibleSchema } from './schema';
import type { AestheticBible, Run } from '../types';

const RunOutputSchema = z.object({
  runId: z.string().min(1),
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  completedAt: z.string().optional(),
  bible: AestheticBibleSchema,
}).strip();

const RunHistoryExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  outputs: z.array(RunOutputSchema).min(1, 'The run-history export contains no completed runs.'),
}).strip();

export type BibleImportResult =
  | { success: true; bible: AestheticBible; runs?: Run[] }
  | { success: false; error: string };

function validationError(prefix: string, error: z.ZodError): BibleImportResult {
  const firstIssue = error.issues[0];
  const location = firstIssue?.path.length ? ` at ${firstIssue.path.join('.')}` : '';
  return {
    success: false,
    error: `${prefix}${location}: ${firstIssue?.message ?? 'schema validation failed'}`,
  };
}

export function parseAestheticBibleJson(text: string): BibleImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { success: false, error: 'The selected file is not valid JSON.' };
  }

  const isRunHistoryEnvelope = typeof value === 'object'
    && value !== null
    && 'version' in value
    && value.version === 1
    && 'exportedAt' in value
    && typeof value.exportedAt === 'string'
    && 'outputs' in value
    && Array.isArray(value.outputs);

  if (isRunHistoryEnvelope) {
    const validation = RunHistoryExportSchema.safeParse(value);
    if (!validation.success) {
      return validationError('This file is not a valid run-history export', validation.error);
    }
    const runs: Run[] = validation.data.outputs.map((output) => ({
      id: output.runId,
      providerId: output.providerId,
      modelId: output.modelId,
      completedAt: output.completedAt,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      bible: output.bible,
      status: 'success',
      pinned: false,
    }));
    return { success: true, bible: runs[0].bible!, runs };
  }

  const validation = AestheticBibleSchema.safeParse(value);
  if (!validation.success) {
    return validationError('This file is not a valid Aesthetic Bible', validation.error);
  }
  return { success: true, bible: validation.data };
}
