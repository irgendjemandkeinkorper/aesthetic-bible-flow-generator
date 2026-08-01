import React from 'react';
import { Type as TypeIcon, FileText, Code2, Sparkles } from 'lucide-react';
import { TypographySystem } from '../types';

interface TypographySectionProps {
  typographySystem: TypographySystem;
}

export const TypographySection: React.FC<TypographySectionProps> = ({
  typographySystem,
}) => {
  const roles = [
    { title: 'Display Title Font', font: typographySystem.displayFont, preview: 'THE AETHERIAL ARCHIVE' },
    { title: 'Section Heading Font', font: typographySystem.headingFont, preview: 'SECTION 04: ALCHEMICAL MECHANICS' },
    { title: 'Body / Lore Font', font: typographySystem.bodyFont, preview: 'In the age before steam was eclipsed by liquid ether, clockwork mechanisms were built to channel sacred cosmic geometry.' },
    { title: 'Monospace / Code Font', font: typographySystem.monoFont, preview: 'GEAR_TEETH_RATIO = 1.618033 // ASTROLOBIC_CODENAME: ETH-90' },
  ];

  return (
    <div id="section-typography" className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
          <TypeIcon className="w-5 h-5 text-indigo-400" /> Typography & Text System
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Font pairings, tracking rules, and visual text hierarchy specs
        </p>
      </div>

      {/* Font Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((item, idx) => {
          if (!item.font) return null;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    {item.title}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{item.font.name}</h4>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-mono">
                  {item.font.category}
                </span>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/60 font-sans">
                <p className="text-sm text-slate-100 tracking-wide line-clamp-3">
                  {item.preview}
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-normal">
                <span className="text-slate-300 font-medium">Usage:</span> {item.font.usage}
              </p>
            </div>
          );
        })}
      </div>

      {/* Hierarchy Rules */}
      {typographySystem.hierarchyRules && typographySystem.hierarchyRules.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Typographic Hierarchy & Formatting Rules
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {typographySystem.hierarchyRules.map((rule, i) => (
              <li key={i} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
