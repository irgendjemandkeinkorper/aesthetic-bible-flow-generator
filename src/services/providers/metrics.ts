import type { AestheticBible, GenerationPromptInput, Run } from '../../types';
import type { ProviderAdapter, ProviderModel } from './types';

export function estimateTokens(value: unknown): number {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateCostUsd(model: ProviderModel, inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * model.inputCostPerMillionTokens)
    + (outputTokens * model.outputCostPerMillionTokens)
  ) / 1_000_000;
}

export async function runBibleGeneration(
  adapter: ProviderAdapter,
  brief: GenerationPromptInput,
  modelId: string,
  signal?: AbortSignal,
): Promise<Run> {
  const model = adapter.models.find((candidate) => candidate.id === modelId);
  if (!model) throw new Error(`Model "${modelId}" is not available from provider "${adapter.id}".`);

  const startedAt = performance.now();
  let bible: AestheticBible;
  try {
    bible = await adapter.generateBible(brief, modelId, signal);
  } catch (error) {
    const failedRun: Run = {
      providerId: adapter.id,
      modelId,
      latencyMs: Math.max(0, performance.now() - startedAt),
      inputTokens: estimateTokens(brief),
      outputTokens: 0,
      costUsd: estimateCostUsd(model, estimateTokens(brief), 0),
      bible: null,
      status: signal?.aborted ? 'aborted' : 'failed',
    };
    adapterRunObserver?.(failedRun);
    throw error;
  }

  const inputTokens = estimateTokens(brief);
  const outputTokens = estimateTokens(bible);
  const run: Run = {
    providerId: adapter.id,
    modelId,
    latencyMs: Math.max(0, performance.now() - startedAt),
    inputTokens,
    outputTokens,
    costUsd: estimateCostUsd(model, inputTokens, outputTokens),
    bible,
    status: 'success',
  };
  adapterRunObserver?.(run);
  return run;
}

export type RunObserver = (run: Run) => void;
let adapterRunObserver: RunObserver | undefined;

export function setRunObserver(observer?: RunObserver): void {
  adapterRunObserver = observer;
}
