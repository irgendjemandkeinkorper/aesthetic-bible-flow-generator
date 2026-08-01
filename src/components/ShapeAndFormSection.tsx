import React from 'react';
import { Shapes, Box, Layers, Droplet } from 'lucide-react';
import { ShapeAndForm } from '../types';

interface ShapeAndFormSectionProps {
  shapeAndForm: ShapeAndForm;
}

export const ShapeAndFormSection: React.FC<ShapeAndFormSectionProps> = ({
  shapeAndForm,
}) => {
  return (
    <div id="section-shape-form" className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
          <Shapes className="w-5 h-5 text-emerald-400" /> Shape Language, Geometry & Materials
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Form principles, silhouette rules, surface materiality, and weathering specs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Dominant Geometry */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5" /> Dominant Geometry & Form
          </span>
          <h4 className="text-sm font-bold text-slate-100">{shapeAndForm.dominantGeometry}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All structural silhouettes and UI container bounds must be governed by this primary geometric rhythm.
          </p>
        </div>

        {/* Silhouette Style */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Silhouette & Outline Character
          </span>
          <h4 className="text-sm font-bold text-slate-100">{shapeAndForm.silhouetteStyle}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Readability at a distance relies on clear silhouette profiles before high-frequency detail is parsed.
          </p>
        </div>

      </div>

      {/* Surface Materials & Textures */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
          <Droplet className="w-3.5 h-3.5" /> Approved Material Palette & Textures
        </span>

        <div className="flex flex-wrap gap-2.5">
          {shapeAndForm.materialAndTextures.map((mat, idx) => (
            <div
              key={idx}
              className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{mat}</span>
            </div>
          ))}
        </div>

        {shapeAndForm.gritAndWeathering && (
          <div className="pt-3 border-t border-slate-800/80">
            <h5 className="text-xs font-mono text-slate-400 uppercase font-semibold mb-1">
              Grit, Wear & Environmental Weathering Guidelines
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              {shapeAndForm.gritAndWeathering}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
