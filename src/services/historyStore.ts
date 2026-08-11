import type { Run } from '../types';
import { RunSchema } from './schema';

export const RUN_HISTORY_STORAGE_KEY = 'aesthetic-bible.run-history.v1';

export interface HistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createRunId(run: Run, completedAt: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId ?? `${completedAt}-${run.providerId}-${run.modelId}-${Math.random().toString(36).slice(2)}`;
}

function createLegacyRunId(run: Run, index: number): string {
  const value = JSON.stringify(run);
  let hash = 2166136261;
  for (let position = 0; position < value.length; position += 1) {
    hash ^= value.charCodeAt(position);
    hash = Math.imul(hash, 16777619);
  }
  return `legacy-${(hash >>> 0).toString(36)}-${index}`;
}

export function normalizeCompletedRun(run: Run): Run {
  const completedAt = run.completedAt ?? new Date().toISOString();
  return {
    ...run,
    id: run.id ?? createRunId(run, completedAt),
    completedAt,
    pinned: run.pinned ?? false,
  };
}

export function readRunHistory(storage: HistoryStorage): Run[] {
  try {
    const raw = storage.getItem(RUN_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    let migrated = false;
    const history = parsed.flatMap((candidate, index) => {
      const validation = RunSchema.safeParse(candidate);
      if (!validation.success) return [];
      const run = validation.data;
      if (run.id && run.completedAt && run.pinned !== undefined) return [run];
      migrated = true;
      return [normalizeCompletedRun({ ...run, id: run.id ?? createLegacyRunId(run, index) })];
    });
    if (migrated) {
      try {
        storage.setItem(RUN_HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch {
        // Stable legacy IDs still make the in-memory history usable when storage is read-only.
      }
    }
    return history;
  } catch {
    return [];
  }
}

const MAX_UNPINNED_RUNS = 25;

function writeRunHistory(storage: HistoryStorage, runs: Run[]): Run[] {
  storage.setItem(RUN_HISTORY_STORAGE_KEY, JSON.stringify(runs));
  return runs;
}

function evictExcessUnpinnedRuns(runs: Run[]): Run[] {
  let unpinnedSeen = 0;
  return runs.filter((run) => {
    if (run.pinned) return true;
    unpinnedSeen += 1;
    return unpinnedSeen <= MAX_UNPINNED_RUNS;
  });
}

export function addRunToHistory(storage: HistoryStorage, run: Run): Run[] {
  const completed = normalizeCompletedRun(run);
  const history = readRunHistory(storage).filter((candidate) => candidate.id !== completed.id);
  return writeRunHistory(storage, evictExcessUnpinnedRuns([completed, ...history]));
}

export function importRunsToHistory(storage: HistoryStorage, runs: readonly Run[]): Run[] {
  const validated = runs.map((candidate, index) => {
    const result = RunSchema.safeParse(candidate);
    if (!result.success) {
      const issue = result.error.issues[0];
      const location = issue?.path.length ? ` at ${issue.path.join('.')}` : '';
      throw new Error(`Imported run ${index + 1} is invalid${location}: ${issue?.message ?? 'schema validation failed'}`);
    }
    return normalizeCompletedRun(result.data);
  });

  const existing = readRunHistory(storage);
  const existingIds = new Set(existing.map((run) => run.id));
  const importedIds = new Set<string | undefined>();
  const newRuns = validated.filter((run) => {
    if (existingIds.has(run.id) || importedIds.has(run.id)) return false;
    importedIds.add(run.id);
    return true;
  });

  return writeRunHistory(storage, evictExcessUnpinnedRuns([...newRuns, ...existing]));
}

export function setRunPinned(storage: HistoryStorage, runId: string, pinned: boolean): Run[] {
  return writeRunHistory(storage, readRunHistory(storage).map((run) => (
    run.id === runId ? { ...run, pinned } : run
  )));
}

export function clearRunHistory(storage: HistoryStorage): Run[] {
  storage.removeItem(RUN_HISTORY_STORAGE_KEY);
  return [];
}

export function serializeRunOutputs(runs: readonly Run[]): string {
  const outputs = runs.flatMap((run) => run.bible ? [{
    runId: run.id,
    providerId: run.providerId,
    modelId: run.modelId,
    completedAt: run.completedAt,
    bible: run.bible,
  }] : []);
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), outputs }, null, 2);
}

export function exportRunOutputs(runs: readonly Run[], documentRef: Document = document): void {
  if (runs.every((run) => !run.bible)) throw new Error('Select at least one successful run to export.');
  const blob = new Blob([serializeRunOutputs(runs)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  anchor.href = url;
  anchor.download = `aesthetic-bible-runs-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
