import type { AestheticBible, ComparisonAudit, Run } from '../types';
import { ComparisonAuditSchema } from './schema';
import type { ProviderAdapter } from './providers/types';

export function buildComparisonAuditPrompt(bibles: readonly AestheticBible[]): string {
  const compactBibles = bibles.map((bible) => ({
    title: bible.title,
    manifesto: bible.manifesto,
    colorSystem: bible.colorSystem,
    typographySystem: bible.typographySystem,
    shapeAndForm: bible.shapeAndForm,
    musicDirection: bible.musicDirection,
    promptSpecs: bible.moodBoard.map(({ title, promptSpec }) => ({ title, promptSpec })),
  }));
  return `Compare these aesthetic bibles. Summarize their overall relationship, list concrete convergence points, list meaningful divergences, and recommend how a designer should interpret the alternatives. Do not rank providers or infer quality from provider identity.\nAesthetic bibles: ${JSON.stringify(compactBibles)}`;
}

export async function auditRunComparison(
  adapter: ProviderAdapter,
  runs: readonly Run[],
  modelId: string,
  signal?: AbortSignal,
): Promise<ComparisonAudit> {
  const bibles = runs.flatMap((run) => run.bible ? [run.bible] : []);
  if (bibles.length < 2 || bibles.length > 4) {
    throw new Error('A comparison audit requires between two and four successful runs.');
  }
  if (!adapter.auditComparison) {
    throw new Error(`${adapter.label} does not support comparison audits.`);
  }
  signal?.throwIfAborted();
  const audit = await adapter.auditComparison(bibles, modelId, signal);
  signal?.throwIfAborted();
  return ComparisonAuditSchema.parse(audit);
}
