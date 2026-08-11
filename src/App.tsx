import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { 
  Compass, 
  Sparkles, 
  BookOpen, 
  Palette, 
  Type as TypeIcon, 
  Shapes, 
  Monitor, 
  Grid, 
  ShieldCheck, 
  Code2, 
  Download, 
  RotateCcw,
  Sliders,
  ChevronRight,
  Layers
} from 'lucide-react';

import { AestheticBible, MoodBoardTile, DecodedImageAesthetic, Run } from './types';
import { INITIAL_PRESETS } from './data/presets';
import { Header } from './components/Header';
import { BibleManifestoSection } from './components/BibleManifestoSection';
import { ColorSystemSection } from './components/ColorSystemSection';
import { TypographySection } from './components/TypographySection';
import { ShapeAndFormSection } from './components/ShapeAndFormSection';
import { InterfaceHudSection } from './components/InterfaceHudSection';
import { MoodBoardSection } from './components/MoodBoardSection';
import { FlowGeneratorModal } from './components/FlowGeneratorModal';
import { CohesionAuditModal } from './components/CohesionAuditModal';
import { TokenExportModal } from './components/TokenExportModal';
import { ImageDecoderModal } from './components/ImageDecoderModal';
import { ClaudeDesignPlaygroundSection } from './components/ClaudeDesignPlaygroundSection';
import { SettingsModal } from './components/SettingsModal';
import { ComparisonWorkspace } from './components/ComparisonWorkspace';
import { configureAnthropicProvider, configureGeminiProvider, configureOllamaProvider, configureOpenAIProvider, providerRegistry, setRunObserver } from './services/providers';
import { GenerationGuard } from './services/providers/generationGuard';
import { detectLocalServer } from './services/localServer';
import { readProviderKeys, type ProviderKeys } from './services/providerSettings';
import { addRunToHistory, clearRunHistory, exportRunOutputs, readRunHistory, setRunPinned } from './services/historyStore';

export default function App() {
  const [bibles, setBibles] = useState<AestheticBible[]>(INITIAL_PRESETS);
  const [activeBibleId, setActiveBibleId] = useState<string>(INITIAL_PRESETS[0].id);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isDecoderOpen, setIsDecoderOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [runHistory, setRunHistory] = useState<Run[]>(() => readRunHistory(window.localStorage));
  const [providerKeys, setProviderKeys] = useState<ProviderKeys>(() => readProviderKeys(window.localStorage));
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [localServerAvailable, setLocalServerAvailable] = useState(false);
  const activeProvider = useSyncExternalStore(
    (listener) => providerRegistry.subscribe(listener),
    () => providerRegistry.getActive(),
  );
  const [localServerMode, setLocalServerMode] = useState(false);

  // Pre-seed state for generator from image decoder
  const [decodedSeed, setDecodedSeed] = useState<DecodedImageAesthetic | null>(null);
  const [seedImageUrl, setSeedImageUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'manifesto' | 'colors' | 'typography' | 'shape' | 'interface' | 'moodboard' | 'playground'>('manifesto');

  // Per-provider generation counter. Any call that configures a provider (the mount
  // effect below, or an interactive Settings change) captures the current generation
  // before its async work starts; if the counter has moved on by the time it resolves,
  // a newer call has superseded it and its result must be discarded rather than committed.
  // This also covers two overlapping interactive Settings edits for the same provider,
  // not just mount-effect-vs-Settings — whichever call started last "wins" deterministically.
  const providerGenerations = useRef(new GenerationGuard());

  useEffect(() => {
    const controller = new AbortController();
    const initialKeys = readProviderKeys(window.localStorage);
    const configured = [
      ['gemini', initialKeys.gemini, configureGeminiProvider],
      ['openai', initialKeys.openai, configureOpenAIProvider],
      ['anthropic', initialKeys.anthropic, configureAnthropicProvider],
      ['ollama', initialKeys.ollama, configureOllamaProvider],
    ] as const;
    void Promise.all(configured.filter(([, key]) => key).map(async ([id, key, configure]) => {
      const generation = providerGenerations.current.current(id);
      try {
        await configure(key, controller.signal);
        if (!providerGenerations.current.isCurrent(id, generation)) {
          // An interactive Settings change for this provider started (and possibly
          // finished) while this mount-time configure was in flight; discard this
          // now-stale registration rather than overwriting the newer decision.
          providerRegistry.unregister(id);
          return;
        }
        setConfiguredProviders((current) => current.includes(id) ? current : [...current, id]);
      } catch (error) {
        if (!controller.signal.aborted) console.warn(`Unable to configure browser provider ${id}.`, error);
      }
    }));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setRunObserver((run) => {
      try {
        setRunHistory(addRunToHistory(window.localStorage, run));
      } catch (error) {
        console.warn('Unable to persist completed run history.', error);
      }
    });
    return () => setRunObserver();
  }, []);

  useEffect(() => {
    let mounted = true;
    void detectLocalServer().then(({ available }) => {
      if (!mounted) return;
      setLocalServerAvailable(available);
      setLocalServerMode(available);
    });
    return () => { mounted = false; };
  }, []);

  const activeBible = bibles.find((b) => b.id === activeBibleId) || bibles[0];

  const handleSelectBible = (bible: AestheticBible) => {
    setActiveBibleId(bible.id);
  };

  const handleBibleGenerated = (newBible: AestheticBible) => {
    setBibles((current) => [newBible, ...current.filter((bible) => bible.id !== newBible.id)]);
    setActiveBibleId(newBible.id);
  };

  const handleProviderKeyChange = async (providerId: 'gemini' | 'openai' | 'anthropic' | 'ollama', apiKey: string) => {
    // Bump synchronously, before any await, so any other in-flight call for this same
    // provider (the mount effect, or an earlier overlapping Settings edit) is immediately
    // marked stale and will discard its result instead of racing this one.
    const generation = providerGenerations.current.bump(providerId);
    providerRegistry.unregister(providerId);
    setConfiguredProviders((current) => current.filter((id) => id !== providerId));
    if (!apiKey) return;
    const configure = providerId === 'gemini'
      ? configureGeminiProvider
      : providerId === 'openai'
        ? configureOpenAIProvider
        : providerId === 'anthropic'
          ? configureAnthropicProvider
          : configureOllamaProvider;
    await configure(apiKey);
    if (!providerGenerations.current.isCurrent(providerId, generation)) {
      // A newer Settings edit for this provider started after this one; discard this
      // now-stale registration rather than overwriting the newer decision.
      providerRegistry.unregister(providerId);
      return;
    }
    setConfiguredProviders((current) => [...current.filter((id) => id !== providerId), providerId]);
  };

  const handleGenerateBibleFromDecoded = (decoded: DecodedImageAesthetic, imageUrl: string) => {
    setDecodedSeed(decoded);
    setSeedImageUrl(imageUrl);
    setIsDecoderOpen(false);
    setIsGeneratorOpen(true);
  };

  const handleUpdateTile = (tileId: string, updatedTile: Partial<MoodBoardTile>) => {
    setBibles(bibles.map((b) => {
      if (b.id !== activeBible.id) return b;
      return {
        ...b,
        moodBoard: b.moodBoard.map((t) => (t.id === tileId ? { ...t, ...updatedTile } : t))
      };
    }));
  };

  const handleAddTile = (newTile: MoodBoardTile) => {
    setBibles(bibles.map((b) => {
      if (b.id !== activeBible.id) return b;
      return {
        ...b,
        moodBoard: [newTile, ...b.moodBoard]
      };
    }));
  };

  const handlePinRun = (runId: string, pinned: boolean) => {
    try {
      setRunHistory(setRunPinned(window.localStorage, runId, pinned));
    } catch (error) {
      console.warn('Unable to update pinned run history.', error);
    }
  };

  const handleClearRunHistory = () => {
    try {
      setRunHistory(clearRunHistory(window.localStorage));
    } catch (error) {
      console.warn('Unable to clear run history.', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950 flex flex-col">
      
      {/* App Header */}
      <Header
        bibles={bibles}
        activeBible={activeBible}
        onSelectBible={handleSelectBible}
        onOpenGenerator={() => { setDecodedSeed(null); setIsGeneratorOpen(true); }}
        onOpenImageDecoder={() => setIsDecoderOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeProviders={[
          ...(localServerMode && localServerAvailable ? ['Local server'] : []),
          ...(!localServerMode ? configuredProviders.map((id) => id === 'gemini' ? 'Gemini' : id === 'openai' ? 'OpenAI' : id === 'anthropic' ? 'Anthropic' : 'Ollama') : []),
        ]}
        localServerAvailable={localServerAvailable}
        localServerMode={localServerMode}
        onLocalServerModeChange={setLocalServerMode}
      />

      {/* Main Container */}
      {isComparisonOpen ? (
        <ComparisonWorkspace
          runs={runHistory}
          activeAdapter={activeProvider}
          onClose={() => setIsComparisonOpen(false)}
          onPin={handlePinRun}
          onClear={handleClearRunHistory}
          onExport={exportRunOutputs}
        />
      ) : (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8">
        {!localServerMode && configuredProviders.length === 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
            <span>No local server or browser provider key is active. Add a key in Settings to enable AI generation on this static deployment.</span>
            <button onClick={() => setIsSettingsOpen(true)} className="rounded-lg bg-amber-700 px-3 py-1.5 font-semibold text-white hover:bg-amber-600">Open Settings</button>
          </div>
        )}
        
        {/* Active Bible Hero Banner */}
        <div className="relative bg-gradient-to-r from-slate-900/90 via-[#0D0F18] to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
          
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                  {activeBible.genre}
                </span>
                {activeBible.subgenre && (
                  <span className="px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-full text-xs font-mono">
                    {activeBible.subgenre}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  Synthesized ID: #{activeBible.id.slice(0, 8)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-100">
                {activeBible.title}
              </h2>

              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed font-sans">
                {activeBible.tagline}
              </p>
            </div>

            {/* Quick Action Badge & Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsComparisonOpen(true)}
                className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>History & Compare ({runHistory.length})</span>
              </button>
              <button
                onClick={() => setIsAuditOpen(true)}
                className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Audit Asset</span>
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <Code2 className="w-4 h-4" />
                <span>Get Code Tokens</span>
              </button>
            </div>

          </div>

          {/* Quick Metrics & Parameters Bar */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Visual Density</span>
              <span className="text-cyan-400 font-bold">{activeBible.fineTuning?.density || 7}/10</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Contrast Ratio</span>
              <span className="text-amber-400 font-bold">{activeBible.fineTuning?.contrast || 8}/10</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Diegetic HUD</span>
              <span className="text-emerald-400 font-bold truncate block">{activeBible.interfaceAndHUD?.diegeticType || 'Diegetic'}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase block text-[10px]">Curated Mood Tiles</span>
              <span className="text-indigo-400 font-bold">{activeBible.moodBoard?.length || 0} Tiles</span>
            </div>
          </div>

        </div>

        {/* Navigation Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('manifesto')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'manifesto'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Art Manifesto & Rules
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'colors'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Palette className="w-4 h-4" /> Color System
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'typography'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <TypeIcon className="w-4 h-4" /> Typography
          </button>

          <button
            onClick={() => setActiveTab('shape')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'shape'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Shapes className="w-4 h-4" /> Shape & Materiality
          </button>

          <button
            onClick={() => setActiveTab('interface')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'interface'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" /> Interface & HUD
          </button>

          <button
            onClick={() => setActiveTab('moodboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'moodboard'
                ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Grid className="w-4 h-4" /> Mood Board ({activeBible.moodBoard?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'playground'
                ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-slate-900/60 border border-slate-800/80 text-cyan-400 hover:text-cyan-200 hover:border-cyan-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> UI Lab & Tokens
          </button>

        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'manifesto' && (
            <BibleManifestoSection
              manifesto={activeBible.manifesto}
              philosophyAnchors={activeBible.philosophyAnchors}
            />
          )}

          {activeTab === 'colors' && (
            <ColorSystemSection colorSystem={activeBible.colorSystem} />
          )}

          {activeTab === 'typography' && (
            <TypographySection typographySystem={activeBible.typographySystem} />
          )}

          {activeTab === 'shape' && (
            <ShapeAndFormSection shapeAndForm={activeBible.shapeAndForm} />
          )}

          {activeTab === 'interface' && (
            <InterfaceHudSection
              interfaceAndHUD={activeBible.interfaceAndHUD}
              musicDirection={activeBible.musicDirection}
            />
          )}

          {activeTab === 'moodboard' && (
            <MoodBoardSection
              tiles={activeBible.moodBoard || []}
              philosophyAnchors={activeBible.philosophyAnchors}
              onUpdateTile={handleUpdateTile}
              onAddTile={handleAddTile}
              onOpenDecoder={() => setIsDecoderOpen(true)}
              // No adapter implements client-side image generation yet, so this is effectively
              // localServerMode-only today; reads adapter-level capabilities (not a specific
              // model) so it stays correct once a browser image-generation adapter exists.
              canGenerateImages={localServerMode || Boolean(activeProvider?.capabilities.imageGeneration)}
            />
          )}

          {activeTab === 'playground' && (
            <ClaudeDesignPlaygroundSection bible={activeBible} />
          )}
        </div>

      </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#0A0B10] py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Aesthetic Bible Flow Generator &copy; 2026 &mdash; Game Design & Worldbuilding System</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Express fallback &bull; Gemini &bull; OpenAI &bull; Anthropic</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FlowGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onBibleGenerated={handleBibleGenerated}
        initialDecodedSeed={decodedSeed}
        seedImageUrl={seedImageUrl}
        preferLocalServer={localServerMode}
        providerKeys={providerKeys}
      />

      <ImageDecoderModal
        isOpen={isDecoderOpen}
        onClose={() => setIsDecoderOpen(false)}
        onAddTileToActiveBible={handleAddTile}
        onGenerateBibleFromDecoded={handleGenerateBibleFromDecoded}
        preferLocalServer={localServerMode}
        providerKeys={providerKeys}
      />

      <CohesionAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        activeBible={activeBible}
        preferLocalServer={localServerMode}
        providerKeys={providerKeys}
      />

      <TokenExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        bible={activeBible}
        onImportBible={handleBibleGenerated}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onProviderKeyChange={handleProviderKeyChange}
        onKeysChange={setProviderKeys}
      />

    </div>
  );
}
