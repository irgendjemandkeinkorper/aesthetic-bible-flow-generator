import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Quote, 
  Sparkles, 
  Compass,
  AlertTriangle
} from 'lucide-react';
import { Manifesto } from '../types';

interface BibleManifestoSectionProps {
  manifesto: Manifesto;
  philosophyAnchors: string[];
}

export const BibleManifestoSection: React.FC<BibleManifestoSectionProps> = ({
  manifesto,
  philosophyAnchors,
}) => {
  return (
    <div id="section-manifesto" className="space-y-6">
      
      {/* Philosophy Anchors Header Banner */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4">
        <span className="text-xs font-mono font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mr-2">
          <Compass className="w-4 h-4" /> Philosophy Anchors:
        </span>
        {philosophyAnchors.map((anchor, idx) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50 shadow-sm"
          >
            {anchor}
          </span>
        ))}
      </div>

      {/* Core Art Thesis */}
      <div className="relative bg-gradient-to-br from-slate-900/90 via-[#0E1018] to-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <Quote className="absolute top-4 right-4 w-24 h-24 text-cyan-500/5 pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
            <BookOpen className="w-4 h-4" /> Art Direction Core Thesis
          </div>
          <p className="text-base sm:text-lg font-serif italic text-slate-100 leading-relaxed font-normal">
            "{manifesto.coreThesis}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Visual Philosophy
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {manifesto.visualPhilosophy}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
              Emotional Cadence & Atmosphere
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {manifesto.emotionalCadence}
            </p>
          </div>
        </div>

        {/* Visual Metaphors */}
        {manifesto.keyVisualMetaphors && manifesto.keyVisualMetaphors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800/60">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Key Visual Metaphors
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {manifesto.keyVisualMetaphors.map((metaphor, i) => (
                <li key={i} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-normal flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{metaphor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Rules Grid: DO vs DONT (Style Anti-Patterns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Enforced DO List */}
        <div className="bg-emerald-950/10 border border-emerald-900/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> Enforced Style Enforcements (DO)
          </div>
          <ul className="space-y-2.5">
            {manifesto.doList.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Banned DONT List (Style Anti-Patterns) */}
        <div className="bg-rose-950/10 border border-rose-900/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Banned Tropes & Anti-Patterns (DON'T)
          </div>
          <ul className="space-y-2.5">
            {manifesto.dontList.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
