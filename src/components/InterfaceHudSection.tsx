import React from 'react';
import { Monitor, Volume2, MoveRight, Sliders } from 'lucide-react';
import { InterfaceAndHUD, MusicDirection } from '../types';

interface InterfaceHudSectionProps {
  interfaceAndHUD: InterfaceAndHUD;
  musicDirection?: MusicDirection;
}

export const InterfaceHudSection: React.FC<InterfaceHudSectionProps> = ({
  interfaceAndHUD,
  musicDirection,
}) => {
  return (
    <div id="section-interface-hud" className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
          <Monitor className="w-5 h-5 text-amber-400" /> Interface, HUD & Tactile Experience
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Diegetic UI framework, layout density, tactile audio cues, and motion guidelines
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Diegetic Type */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" /> Diegetic Paradigm
          </span>
          <h4 className="text-sm font-bold text-slate-100">{interfaceAndHUD.diegeticType}</h4>
          <p className="text-xs text-slate-400 leading-normal">
            Integration level of the UI directly within the game world environment.
          </p>
        </div>

        {/* Layout Density */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Layout Density
          </span>
          <h4 className="text-sm font-bold text-slate-100">{interfaceAndHUD.layoutDensity}</h4>
          <p className="text-xs text-slate-400 leading-normal">
            Information pacing, margins, and negative space allocation across viewports.
          </p>
        </div>

        {/* Audio Tone */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Tactile Audio Tone
          </span>
          <h4 className="text-xs font-bold text-slate-100 leading-snug">{interfaceAndHUD.tactileAudioTone}</h4>
          <p className="text-xs text-slate-400 leading-normal">
            Acoustic feedback for button clicks, switches, error triggers, and gauges.
          </p>
        </div>

        {/* Motion Guidelines */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <MoveRight className="w-3.5 h-3.5" /> Motion & Interpolation
          </span>
          <h4 className="text-xs font-bold text-slate-100 leading-snug">{interfaceAndHUD.motionGuidelines}</h4>
          <p className="text-xs text-slate-400 leading-normal">
            Easing curves, menu opening transitions, and gauge needle physics.
          </p>
        </div>

      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-semibold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" /> Auditory Profile
          </span>
          <h4 className="mt-2 text-sm font-bold text-slate-100">
            {musicDirection?.coreThemeSpec || 'No dedicated music direction yet'}
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Instrumentation</p>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {musicDirection?.instrumentation?.length
                ? musicDirection.instrumentation.join(' · ')
                : 'Instrumentation will be derived from the visual and emotional direction.'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Suno / Udio Prompt</p>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {musicDirection?.generativePromptSpec || 'Generate or import an updated bible to create a production-ready music prompt.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
