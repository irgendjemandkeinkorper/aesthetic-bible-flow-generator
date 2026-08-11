import { AestheticBibleSchema } from './schema';
import type { AestheticBible } from '../types';

export type BibleImportResult =
  | { success: true; bible: AestheticBible }
  | { success: false; error: string };

export function parseAestheticBibleJson(text: string): BibleImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { success: false, error: 'The selected file is not valid JSON.' };
  }

  const validation = AestheticBibleSchema.safeParse(value);
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const location = firstIssue?.path.length ? ` at ${firstIssue.path.join('.')}` : '';
    return {
      success: false,
      error: `This file is not a valid Aesthetic Bible${location}: ${firstIssue?.message ?? 'schema validation failed'}`,
    };
  }

  return { success: true, bible: validation.data };
}
