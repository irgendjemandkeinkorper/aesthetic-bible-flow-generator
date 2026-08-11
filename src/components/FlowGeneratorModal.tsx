import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Sliders, 
  Brain, 
  Palette, 
  Check, 
  Loader2, 
  Wand2, 
  Compass,
  Plus,
  Eye
} from 'lucide-react';
import { GenreCategory, FineTuningState, GenerationPromptInput, AestheticBible, DecodedImageAesthetic } from '../types';
import { providerRegistry, runBibleGeneration } from '../services/providers';

interface FlowGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBibleGenerated: (bible: AestheticBible) => void;
  initialDecodedSeed?: DecodedImageAesthetic | null;
  seedImageUrl?: string | null;
}

const GENRE_OPTIONS: { category: GenreCategory; label: string; desc: string }[] = [
  { category: 'Clockwork / Dieselpunk Alchemy', label: 'Clockwork Alchemy', desc: 'Gothic industrialism, brass gears, and luminous alchemy' },
  { category: 'Brutalist Space Opera', label: 'Brutalist Space Opera', desc: 'Monolithic concrete orbital habitats & analog CRT screens' },
  { category: 'Cyber-Zen Shinto', label: 'Cyber-Zen Shinto', desc: 'Neon torii gates, rain-soaked obsidian stone, spirit-AI animism' },
  { category: 'Grimdark Fantasy', label: 'Grimdark Fantasy', desc: 'Weathered iron, blood-soaked parchment, eldritch runes' },
  { category: 'Cyberpunk / Synth-Noir', label: 'Cyberpunk / Synth-Noir', desc: 'High-tech low-life, rain reflections, chrome & holographic decay' },
  { category: 'Solarpunk Biophilia', label: 'Solarpunk Biophilia', desc: 'Lush bioluminescence, organic curves, clean energy architecture' },
  { category: 'Eldritch Cosmic Horror', label: 'Eldritch Cosmic Horror', desc: 'Non-Euclidean geometry, bioluminescent abyss, madness codices' },
  { category: 'Cassette Futurism', label: 'Cassette Futurism', desc: '1980s NASA aesthetics, tactile buttons, phosphor vector grids' },
  { category: 'Post-Apocalyptic Scavenger', label: 'Post-Apocalyptic Scavenger', desc: 'Rust, salvaged scrap, solar-powered scrap armor, wasteland' },
  { category: 'Custom / Hybrid Speculative', label: 'Custom / Hybrid', desc: 'Define your own unique speculative aesthetic fusion' }
];

const PRESET_PHILOSOPHIES = [
  'Transhumanist Metamorphosis',
  'Sacred Geometry vs Entropy',
  'Digital Animism (AI Spirits)',
  'Monolithic Indifference of the Cosmos',
  'Ecological Entropy & Rebirth',
  'The Burdens of Forbidden Alchemy',
  'Technocratic Decay & Rebellion',
  'Impermanence in Fiber-Optic Rain',
  'Analogue Telemetry in Silence',
  'Arcane Industrialization'
];

export const FlowGeneratorModal: React.FC<FlowGeneratorModalProps> = ({
  isOpen,
  onClose,
  onBibleGenerated,
  initialDecodedSeed,
  seedImageUrl,
}) => {
  const [genre, setGenre] = useState<GenreCategory>('Clockwork / Dieselpunk Alchemy');
  const [title, setTitle] = useState('');
  const [subgenre, setSubgenre] = useState('');
  const [selectedPhilosophies, setSelectedPhilosophies] = useState<string[]>([
    'Transhumanist Metamorphosis',
    'Sacred Geometry vs Entropy'
  ]);
  const [customPhilosophy, setCustomPhilosophy] = useState('');
  const [visualMood, setVisualMood] = useState('High-contrast brass framing, glowing blue ether conduits, dark gothic stone workshops, and heavy mechanical gear assemblies.');
  
  const [fineTuning, setFineTuning] = useState<FineTuningState>({
    density: 7,
    contrast: 8,
    eraBlend: 'Victorian Industrial + Byzantine Mysticism',
    saturation: 6,
    philosophicalDepth: 8
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialDecodedSeed) {
      if (initialDecodedSeed.title) setTitle(initialDecodedSeed.title);
      if (initialDecodedSeed.subgenreMatch) setSubgenre(initialDecodedSeed.subgenreMatch);
      if (initialDecodedSeed.philosophyTag) {
        setSelectedPhilosophies(prev => Array.from(new Set([initialDecodedSeed.philosophyTag, ...prev])));
      }
      if (initialDecodedSeed.summaryDescription) {
        setVisualMood(`${initialDecodedSeed.summaryDescription} Lighting: ${initialDecodedSeed.lightingProfile || ''}`);
      }
      
      // Match genre if possible
      const matchedGenreOption = GENRE_OPTIONS.find(g => 
        g.category.toLowerCase().includes(initialDecodedSeed.genreMatch?.toLowerCase() || '') ||
        initialDecodedSeed.genreMatch?.toLowerCase().includes(g.label.toLowerCase())
      );
      if (matchedGenreOption) {
        setGenre(matchedGenreOption.category);
      }
    }
  }, [initialDecodedSeed]);

  if (!isOpen) return null;


  const togglePhilosophy = (item: string) => {
    if (selectedPhilosophies.includes(item)) {
      setSelectedPhilosophies(selectedPhilosophies.filter(p => p !== item));
    } else {
      setSelectedPhilosophies([...selectedPhilosophies, item]);
    }
  };

  const addCustomPhilosophy = () => {
    if (customPhilosophy.trim() && !selectedPhilosophies.includes(customPhilosophy.trim())) {
      setSelectedPhilosophies([...selectedPhilosophies, customPhilosophy.trim()]);
      setCustomPhilosophy('');
    }
  };

  const handleGenerate = async () => {
    if (selectedPhilosophies.length === 0) {
      setErrorMsg('Please select or input at least one Philosophy Anchor.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep('Synthesizing Core Art Direction & Manifesto...');

    try {
      const payload: GenerationPromptInput = {
        title: title.trim() || undefined,
        genre,
        subgenre: subgenre.trim() || undefined,
        philosophyAnchors: selectedPhilosophies,
        visualMood: visualMood.trim() || 'Cohesive speculative design system',
        fineTuning
      };

      setTimeout(() => setGenerationStep('Calculating Color Palette Mathematics & Contrast Ratios...'), 1200);
      setTimeout(() => setGenerationStep('Formulating Typography Pairings & Shape Language Rules...'), 2600);
      setTimeout(() => setGenerationStep('Curating Automated Mood Board Tiles & Visual Prompts...'), 4200);

      const adapter = providerRegistry.getActive();
      let generatedBible: AestheticBible;
      if (adapter) {
        const model = adapter.models[0];
        if (!model) throw new Error('The active AI provider has no available models.');
        generatedBible = (await runBibleGeneration(adapter, payload, model.id)).bible!;
      } else {
        const res = await fetch('/api/generate-bible', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error || 'Failed to generate Aesthetic Bible.');
        }
        generatedBible = await res.json();
      }
      onBibleGenerated(generatedBible);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error communicating with AI server. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0D0E15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400">
              <Wand2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Aesthetic-Bible Flow Generator
              </h2>
              <p className="text-xs text-slate-400">
                AI-driven art direction, design system synthesis & automated mood board curation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-slate-300 text-sm">
          
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-300 rounded-xl text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200">Dismiss</button>
            </div>
          )}

          {/* Section 1: Project Identity & Genre */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> 1. Select Archetype & Genre Foundation
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {GENRE_OPTIONS.map((item) => {
                const isSelected = genre === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => setGenre(item.category)}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-semibold text-slate-100">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Project Title / Code Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Aetherion, Iron Covenant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Subgenre / Fusion Niche (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Celestial Gothic Steampunk, Cold War Space Opera"
                  value={subgenre}
                  onChange={(e) => setSubgenre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Philosophical Anchors */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> 2. Philosophical Anchors (The Core Meaning)
            </label>
            <p className="text-xs text-slate-400">
              Select philosophical tenets that inform the aesthetic reasoning and shape language:
            </p>

            <div className="flex flex-wrap gap-2">
              {PRESET_PHILOSOPHIES.map((item) => {
                const active = selectedPhilosophies.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => togglePhilosophy(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-amber-950/60 border border-amber-500/80 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom philosophical anchor..."
                value={customPhilosophy}
                onChange={(e) => setCustomPhilosophy(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomPhilosophy(); } }}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={addCustomPhilosophy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Section 3: Visual Mood Prompt */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> 3. Visual Mood & Tactile Direction
            </label>
            <textarea
              rows={3}
              value={visualMood}
              onChange={(e) => setVisualMood(e.target.value)}
              placeholder="Describe materials, lighting contrast, textures, architectural scales, and tactile feelings..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Section 4: Fine-Tuning Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> 4. Style Guideline Fine-Tuning
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Visual Density:</span>
                  <span className="font-mono text-emerald-400">{fineTuning.density}/10 ({fineTuning.density > 7 ? 'Ornate & Layered' : fineTuning.density < 4 ? 'Minimalist' : 'Balanced'})</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={fineTuning.density}
                  onChange={(e) => setFineTuning({ ...fineTuning, density: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Lighting Contrast:</span>
                  <span className="font-mono text-emerald-400">{fineTuning.contrast}/10 ({fineTuning.contrast > 7 ? 'Chiaroscuro / Dramatic' : 'Soft Ambient'})</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={fineTuning.contrast}
                  onChange={(e) => setFineTuning({ ...fineTuning, contrast: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Color Saturation:</span>
                  <span className="font-mono text-emerald-400">{fineTuning.saturation}/10 ({fineTuning.saturation > 7 ? 'Vibrant' : 'Desaturated Muted'})</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={fineTuning.saturation}
                  onChange={(e) => setFineTuning({ ...fineTuning, saturation: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Philosophical Depth:</span>
                  <span className="font-mono text-emerald-400">{fineTuning.philosophicalDepth}/10</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={fineTuning.philosophicalDepth}
                  onChange={(e) => setFineTuning({ ...fineTuning, philosophicalDepth: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Historical Era Blend / Architectural Synthesis
                </label>
                <input
                  type="text"
                  value={fineTuning.eraBlend}
                  onChange={(e) => setFineTuning({ ...fineTuning, eraBlend: e.target.value })}
                  placeholder="e.g. 1970s Soviet Space Program + Monolithic Brutalism"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {isGenerating && (
              <div className="flex items-center gap-2 text-cyan-400 font-mono animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStep}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Bible...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Aesthetic Bible</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
