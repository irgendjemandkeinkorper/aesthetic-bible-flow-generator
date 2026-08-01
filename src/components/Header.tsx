import React from 'react';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  Eye, 
  Layers,
  Plus
} from 'lucide-react';
import { AestheticBible } from '../types';

interface HeaderProps {
  bibles: AestheticBible[];
  activeBible: AestheticBible;
  onSelectBible: (bible: AestheticBible) => void;
  onOpenGenerator: () => void;
  onOpenImageDecoder: () => void;
  onOpenAudit: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bibles,
  activeBible,
  onSelectBible,
  onOpenGenerator,
  onOpenImageDecoder,
  onOpenAudit,
  onOpenExport,
}) => {
  return (
    <header id="main-app-header" className="sticky top-0 z-40 bg-[#0A0B10]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-amber-500 p-[1px] shadow-lg shadow-cyan-950/30">
              <div className="w-full h-full bg-[#0A0B10] rounded-[11px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100 font-display">
                  Aesthetic Bible
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest font-semibold uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded-full">
                  Flow Generator
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Game Art Direction & Philosophy Design Systems
              </p>
            </div>
          </div>

          {/* Mobile Bible Switcher */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenImageDecoder}
              className="p-2 bg-slate-800 rounded-lg text-cyan-300 font-medium text-xs flex items-center gap-1 border border-cyan-500/40"
              title="Decode Image Aesthetic"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenGenerator}
              className="p-2 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-lg text-white font-medium text-xs flex items-center gap-1 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Center: Preset & Active Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1.5 shrink-0" />
            <select
              value={activeBible.id}
              onChange={(e) => {
                const found = bibles.find((b) => b.id === e.target.value);
                if (found) onSelectBible(found);
              }}
              className="bg-transparent text-slate-200 font-medium py-1 pr-3 focus:outline-none cursor-pointer truncate max-w-[200px]"
            >
              {bibles.map((bible) => (
                <option key={bible.id} value={bible.id} className="bg-slate-900 text-slate-200">
                  {bible.title} ({bible.genre.split('/')[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-open-image-decoder"
            onClick={onOpenImageDecoder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/60 text-cyan-300 rounded-lg font-medium text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title="Upload image artwork to decode colors, style guidelines, and prompt specs"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Decode Image</span>
          </button>

          <button
            id="btn-open-generator"
            onClick={onOpenGenerator}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg font-medium text-xs shadow-md shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Bible</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            id="btn-open-audit"
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-all hover:border-amber-500/50 hover:text-amber-300"
            title="Audit candidate assets for style cohesion"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Cohesion Audit</span>
          </button>

          <button
            id="btn-open-export"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-all hover:border-cyan-500/50 hover:text-cyan-300"
            title="Export tokens, CSS, Tailwind, or Markdown"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Tokens</span>
          </button>
        </div>

      </div>
    </header>
  );
};

