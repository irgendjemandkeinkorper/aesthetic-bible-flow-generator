import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Pin, PinOff, RefreshCw, Trash2, X } from 'lucide-react';
import type { ComparisonAudit, Run } from '../types';
import { auditRunComparison } from '../services/comparisonAuditor';
import { createBibleDiff, type DiffSegment } from '../services/comparisonDiff';
import type { ProviderAdapter } from '../services/providers';

interface ComparisonWorkspaceProps {
  runs: Run[];
  activeAdapter?: ProviderAdapter;
  onClose: () => void;
  onPin: (runId: string, pinned: boolean) => void;
  onClear: () => void;
  onExport: (runs: Run[]) => void;
}

function runKey(run: Run): string {
  return run.id ?? `${run.providerId}:${run.modelId}:${run.completedAt ?? run.bible?.id ?? run.latencyMs}`;
}

const DiffText: React.FC<{ segments: DiffSegment[] }> = ({ segments }) => (
  <div className="whitespace-pre-wrap text-xs leading-6 text-slate-300">
    {segments.map((segment, index) => (
      <span key={`${index}-${segment.type}`} className={segment.type === 'added'
        ? 'bg-emerald-900/70 text-emerald-200'
        : segment.type === 'removed'
          ? 'bg-rose-950/70 text-rose-300 line-through'
          : ''}>{segment.value}</span>
    ))}
  </div>
);

export const ComparisonWorkspace: React.FC<ComparisonWorkspaceProps> = ({
  runs,
  activeAdapter,
  onClose,
  onPin,
  onClear,
  onExport,
}) => {
  const successfulRuns = useMemo(() => runs.filter((run) => run.status === 'success' && run.bible), [runs]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => successfulRuns.slice(0, 4).map(runKey));
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [audit, setAudit] = useState<ComparisonAudit | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const syncingScroll = useRef(false);

  const selectedRuns = useMemo(
    () => selectedIds.flatMap((id) => successfulRuns.find((run) => runKey(run) === id) ?? []),
    [selectedIds, successfulRuns],
  );

  useEffect(() => {
    const available = new Set(successfulRuns.map(runKey));
    setSelectedIds((current) => current.filter((id) => available.has(id)).slice(0, 4));
  }, [successfulRuns]);

  useEffect(() => {
    const ids = selectedRuns.map(runKey);
    setLeftId((current) => ids.includes(current) ? current : (ids[0] ?? ''));
    setRightId((current) => ids.includes(current) && current !== (ids[0] ?? '') ? current : (ids[1] ?? ids[0] ?? ''));
  }, [selectedRuns]);

  const auditSelectionKey = selectedRuns.map(runKey).join('\0');
  useEffect(() => {
    setAudit(null);
    setAuditError(null);
    setIsAuditing(false);
    if (selectedRuns.length < 2 || !activeAdapter) return;
    const model = activeAdapter.models.find((candidate) => selectedRuns.some((run) => (
      run.providerId === activeAdapter.id && run.modelId === candidate.id
    ))) ?? activeAdapter.models[0];
    if (!model) {
      setAuditError(`${activeAdapter.label} has no comparison-capable model.`);
      return;
    }
    const controller = new AbortController();
    setIsAuditing(true);
    void auditRunComparison(activeAdapter, selectedRuns, model.id, controller.signal)
      .then(setAudit)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setAuditError(error instanceof Error ? error.message : 'Comparison audit failed.');
      })
      .finally(() => { if (!controller.signal.aborted) setIsAuditing(false); });
    return () => controller.abort();
  }, [activeAdapter, auditSelectionKey]); // selectedRuns is represented by a stable key to avoid duplicate paid requests.

  const leftRun = selectedRuns.find((run) => runKey(run) === leftId);
  const rightRun = selectedRuns.find((run) => runKey(run) === rightId);
  const difference = leftRun?.bible && rightRun?.bible && leftId !== rightId
    ? createBibleDiff(leftRun.bible, rightRun.bible)
    : null;

  const toggleRun = (id: string): void => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((candidate) => candidate !== id)
      : current.length < 4 ? [...current, id] : current);
  };

  const syncScroll = (sourceIndex: number, scrollTop: number): void => {
    if (syncingScroll.current) return;
    syncingScroll.current = true;
    columnRefs.current.forEach((column, index) => {
      if (column && index !== sourceIndex) column.scrollTop = scrollTop;
    });
    requestAnimationFrame(() => { syncingScroll.current = false; });
  };

  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Run history & comparison</h2>
          <p className="text-xs text-slate-400">Select two to four completed runs. Comparison columns scroll together.</p>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"><X className="h-4 w-4" /> Close comparison</button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">History ({runs.length})</span>
          <div className="flex gap-2">
            <button disabled={!selectedRuns.length} onClick={() => onExport(selectedRuns)} className="flex items-center gap-1 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" /> Export selected</button>
            <button disabled={!runs.length} onClick={() => { if (window.confirm('Clear all run history?')) onClear(); }} className="flex items-center gap-1 rounded-lg border border-rose-800 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
          </div>
        </div>
        {!runs.length && <p className="text-sm text-slate-500">Completed provider runs will appear here.</p>}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {runs.map((run) => {
            const id = runKey(run);
            const selected = selectedIds.includes(id);
            return (
              <div key={id} className={`rounded-xl border p-3 ${selected ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800 bg-slate-950/50'}`}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={selected} disabled={!run.bible || (!selected && selectedIds.length >= 4)} onChange={() => toggleRun(id)} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-200">{run.bible?.title ?? 'Failed generation'}</span>
                    <span className="block truncate text-[11px] text-slate-500">{run.providerId} · {run.modelId} · {run.status}</span>
                  </span>
                </label>
                {run.id && <button onClick={() => onPin(run.id!, !run.pinned)} className="mt-2 flex items-center gap-1 text-[11px] text-amber-300">{run.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}{run.pinned ? 'Unpin' : 'Pin'}</button>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-800/60 bg-indigo-950/20 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-300">
          {isAuditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Convergence & divergence audit
        </div>
        {selectedRuns.length < 2 && <p className="text-sm text-slate-400">Select at least two successful runs to audit.</p>}
        {selectedRuns.length >= 2 && !activeAdapter && <p className="text-sm text-amber-300">Configure a provider to generate the comparison audit.</p>}
        {isAuditing && <p className="text-sm text-slate-400">Auditing the selected bibles with {activeAdapter?.label}…</p>}
        {auditError && <p className="text-sm text-rose-300">{auditError}</p>}
        {audit && (
          <div className="space-y-3 text-sm text-slate-300">
            <p>{audit.summary}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div><h3 className="mb-1 font-semibold text-emerald-300">Convergence</h3><ul className="list-disc space-y-1 pl-4">{audit.convergence.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3 className="mb-1 font-semibold text-amber-300">Divergence</h3><ul className="list-disc space-y-1 pl-4">{audit.divergence.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3 className="mb-1 font-semibold text-cyan-300">Recommendations</h3><ul className="list-disc space-y-1 pl-4">{audit.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
          </div>
        )}
      </section>

      {selectedRuns.length > 0 && (
        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="grid min-w-max gap-3" style={{ gridTemplateColumns: `repeat(${selectedRuns.length}, minmax(280px, 1fr))` }}>
            {selectedRuns.map((run, index) => {
              const bible = run.bible!;
              const colors = Object.entries(bible.colorSystem).filter((entry): entry is [string, { name: string; hex: string; usage: string }] => typeof entry[1] === 'object');
              const typeRoles = [
                bible.typographySystem.displayFont,
                bible.typographySystem.headingFont,
                bible.typographySystem.bodyFont,
                bible.typographySystem.monoFont,
              ];
              return (
                <div key={runKey(run)} ref={(node) => { columnRefs.current[index] = node; }} onScroll={(event) => syncScroll(index, event.currentTarget.scrollTop)} className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-800 bg-[#0D0E15]">
                  <div className="sticky top-0 z-10 border-b border-slate-800 bg-[#0D0E15] p-4"><h3 className="font-bold text-slate-100">{bible.title}</h3><p className="text-[11px] text-slate-500">{run.providerId} · {run.modelId}</p></div>
                  <div className="min-h-72 border-b border-slate-800 p-4"><h4 className="mb-2 text-xs font-mono uppercase text-cyan-300">Palette</h4><div className="space-y-2">{colors.map(([name, color]) => <div key={name} className="flex items-center gap-2 text-xs"><span className="h-7 w-7 rounded border border-white/10" style={{ backgroundColor: color.hex }} /><span><b className="block text-slate-200">{color.name}</b><span className="font-mono text-slate-500">{color.hex}</span></span></div>)}</div></div>
                  <div className="min-h-64 border-b border-slate-800 p-4"><h4 className="mb-2 text-xs font-mono uppercase text-cyan-300">Typography</h4>{typeRoles.map((role) => <div key={`${role.name}-${role.usage}`} className="mb-3"><b className="text-xs text-slate-200">{role.name}</b><p className="text-[11px] text-slate-500">{role.category} · {role.usage}</p></div>)}<ul className="mt-2 list-disc pl-4 text-xs text-slate-400">{bible.typographySystem.hierarchyRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></div>
                  <div className="min-h-56 border-b border-slate-800 p-4"><h4 className="mb-2 text-xs font-mono uppercase text-cyan-300">Geometry</h4><p className="text-xs text-slate-300">{bible.shapeAndForm.dominantGeometry}</p><p className="mt-2 text-xs text-slate-400">{bible.shapeAndForm.silhouetteStyle}</p><div className="mt-3 flex flex-wrap gap-1">{bible.shapeAndForm.materialAndTextures.map((item) => <span key={item} className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300">{item}</span>)}</div></div>
                  <div className="min-h-48 p-4"><h4 className="mb-2 text-xs font-mono uppercase text-cyan-300">Music</h4>{bible.musicDirection ? <><p className="text-xs text-slate-300">{bible.musicDirection.coreThemeSpec}</p><p className="mt-2 text-[11px] text-slate-500">{bible.musicDirection.instrumentation.join(' · ')}</p><p className="mt-3 text-xs text-slate-400">{bible.musicDirection.generativePromptSpec}</p></> : <p className="text-xs text-slate-500">No music direction recorded.</p>}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedRuns.length >= 2 && (
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-mono uppercase text-cyan-300">Pairwise diff</span><select value={leftId} onChange={(event) => setLeftId(event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">{selectedRuns.map((run) => <option key={runKey(run)} value={runKey(run)}>{run.bible!.title}</option>)}</select><span>vs</span><select value={rightId} onChange={(event) => setRightId(event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">{selectedRuns.map((run) => <option key={runKey(run)} value={runKey(run)}>{run.bible!.title}</option>)}</select></div>
          {!difference && <p className="text-xs text-slate-500">Choose two different runs.</p>}
          {difference && <><div><h3 className="mb-2 text-sm font-semibold text-slate-200">Manifesto</h3><DiffText segments={difference.manifesto} /></div><div><h3 className="mb-2 text-sm font-semibold text-slate-200">Palette tokens</h3><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{difference.palette.map((item) => <div key={item.token} className={`rounded-lg border p-2 text-xs ${item.changed ? 'border-amber-700' : 'border-slate-800'}`}><b className="block text-slate-300">{item.token}</b><span className="text-rose-300">{item.before}</span> → <span className="text-emerald-300">{item.after}</span></div>)}</div></div><div><h3 className="mb-2 text-sm font-semibold text-slate-200">Prompt specs</h3><DiffText segments={difference.promptSpecs} /></div></>}
        </section>
      )}
    </main>
  );
};
