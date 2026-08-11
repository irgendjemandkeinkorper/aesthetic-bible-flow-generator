import { describe, expect, it } from 'vitest';
import { INITIAL_PRESETS } from '../data/presets';
import type { Run } from '../types';
import {
  RUN_HISTORY_STORAGE_KEY,
  addRunToHistory,
  clearRunHistory,
  readRunHistory,
  serializeRunOutputs,
  setRunPinned,
  type HistoryStorage,
} from './historyStore';

function createStorage(): HistoryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function completedRun(overrides: Partial<Run> = {}): Run {
  return {
    providerId: 'openai', modelId: 'test', latencyMs: 12,
    inputTokens: 10, outputTokens: 20, costUsd: 0.01,
    bible: INITIAL_PRESETS[0], status: 'success', ...overrides,
  };
}

describe('run history store', () => {
  it('persists completed runs and tolerates malformed records', () => {
    const storage = createStorage();
    const history = addRunToHistory(storage, completedRun());
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual(expect.objectContaining({ id: expect.any(String), completedAt: expect.any(String), pinned: false }));
    expect(readRunHistory(storage)).toEqual(history);

    storage.setItem(RUN_HISTORY_STORAGE_KEY, JSON.stringify([history[0], { invalid: true }]));
    expect(readRunHistory(storage)).toEqual(history);
  });

  it('pins a run and clears history', () => {
    const storage = createStorage();
    const [run] = addRunToHistory(storage, completedRun({ id: 'run-1' }));
    expect(setRunPinned(storage, run.id!, true)[0].pinned).toBe(true);
    expect(clearRunHistory(storage)).toEqual([]);
    expect(readRunHistory(storage)).toEqual([]);
  });

  it('migrates legacy runs to stable IDs before pinning', () => {
    const storage = createStorage();
    storage.setItem(RUN_HISTORY_STORAGE_KEY, JSON.stringify([completedRun()]));

    const [legacyRun] = readRunHistory(storage);
    expect(legacyRun.id).toMatch(/^legacy-/);
    expect(readRunHistory(storage)[0].id).toBe(legacyRun.id);
    expect(setRunPinned(storage, legacyRun.id!, true)[0].pinned).toBe(true);
  });

  it('evicts the oldest unpinned runs beyond the cap while keeping pinned runs', () => {
    const storage = createStorage();
    let history: Run[] = [];
    for (let index = 0; index < 30; index += 1) {
      history = addRunToHistory(storage, completedRun({ id: `run-${index}` }));
    }
    expect(history).toHaveLength(25);
    expect(history[0].id).toBe('run-29');
    expect(history.some((run) => run.id === 'run-0')).toBe(false);

    history = setRunPinned(storage, 'run-29', true);
    for (let index = 30; index < 60; index += 1) {
      history = addRunToHistory(storage, completedRun({ id: `run-${index}` }));
    }
    expect(history.some((run) => run.id === 'run-29')).toBe(true);
  });

  it('exports only completed outputs with their provider metadata', () => {
    const text = serializeRunOutputs([
      completedRun({ id: 'success' }),
      completedRun({ id: 'failed', bible: null, status: 'failed' }),
    ]);
    const document = JSON.parse(text);
    expect(document.version).toBe(1);
    expect(document.outputs).toHaveLength(1);
    expect(document.outputs[0]).toEqual(expect.objectContaining({ runId: 'success', providerId: 'openai' }));
  });
});
