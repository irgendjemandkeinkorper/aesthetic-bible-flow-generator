import React, { useState } from 'react';
import { Palette, Copy, Check, Eye } from 'lucide-react';
import { ColorSystem, ColorSwatch } from '../types';

interface ColorSystemSectionProps {
  colorSystem: ColorSystem;
}

export const ColorSystemSection: React.FC<ColorSystemSectionProps> = ({
  colorSystem,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const swatches: { label: string; swatch: ColorSwatch }[] = [
    { label: 'Primary Brand/Structure', swatch: colorSystem.primary },
    { label: 'Secondary Chassis/Surface', swatch: colorSystem.secondary },
    { label: 'Accent / Hazard / Power', swatch: colorSystem.accent },
    { label: 'Neutral Dark (Background)', swatch: colorSystem.neutralDark },
    { label: 'Neutral Light (Text/UI)', swatch: colorSystem.neutralLight },
    { label: 'Specular Glow / Particle', swatch: colorSystem.specularGlow },
  ];

  return (
    <div id="section-colors" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" /> Color System & Palette Science
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Exact hex tokens, specular glow values, and semantic usage guidelines
          </p>
        </div>
      </div>

      {/* Swatch Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {swatches.map((item, idx) => {
          if (!item.swatch) return null;
          const { name, hex, usage } = item.swatch;
          const isCopied = copiedHex === hex;

          return (
            <div
              key={idx}
              className="group relative bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3 transition-all hover:border-slate-700 hover:shadow-lg"
            >
              {/* Color Block Header */}
              <div
                className="w-full h-24 rounded-xl shadow-inner relative flex items-end p-3 transition-transform group-hover:scale-[1.01]"
                style={{ backgroundColor: hex }}
              >
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono font-bold text-white uppercase border border-white/10">
                  {hex}
                </div>

                <button
                  onClick={() => copyToClipboard(hex)}
                  className="p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-md text-xs backdrop-blur-md transition-all flex items-center gap-1 shadow"
                  title="Copy Hex Code"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-300 font-mono">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px] font-mono">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Swatch Info */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
                  {item.label}
                </span>
                <h4 className="text-xs font-bold text-slate-100 mt-0.5">{name}</h4>
                <p className="text-xs text-slate-400 leading-normal mt-1">{usage}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Specular & Contrast Preview Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
          <Eye className="w-4 h-4" /> Live Specular & Interface Palette Composite
        </div>

        <div
          className="w-full rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
          style={{
            backgroundColor: colorSystem.neutralDark?.hex || '#090A0C',
            borderColor: colorSystem.primary?.hex || '#3B3C36',
          }}
        >
          <div className="space-y-1">
            <h5
              className="text-sm font-bold font-display"
              style={{ color: colorSystem.neutralLight?.hex || '#F8F9FA' }}
            >
              Interface Live Contrast Test
            </h5>
            <p
              className="text-xs font-sans"
              style={{ color: colorSystem.secondary?.hex || '#9CA3AF' }}
            >
              Primary structure paired with specular glow accents and readable neutral light body text.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              className="px-4 py-2 rounded-lg text-xs font-bold shadow-md uppercase tracking-wider transition-all"
              style={{
                backgroundColor: colorSystem.accent?.hex || '#F59E0B',
                color: colorSystem.neutralDark?.hex || '#000000',
              }}
            >
              Action Target
            </button>

            <div
              className="w-8 h-8 rounded-full shadow-lg border animate-pulse"
              style={{
                backgroundColor: colorSystem.specularGlow?.hex || '#00F0FF',
                borderColor: colorSystem.neutralLight?.hex || '#FFFFFF',
                boxShadow: `0 0 15px ${colorSystem.specularGlow?.hex || '#00F0FF'}`,
              }}
              title="Specular Particle Corona"
            />
          </div>
        </div>

        {colorSystem.paletteNotes && (
          <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
            <span className="text-amber-400 font-bold">Palette Science Notes:</span> {colorSystem.paletteNotes}
          </p>
        )}
      </div>

    </div>
  );
};
