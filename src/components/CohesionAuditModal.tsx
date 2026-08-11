import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Sparkles,
  Upload,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { AestheticBible, CohesionAuditResult } from '../types';
import { getProviderModelOptions, providerRegistry, resolveProviderModel } from '../services/providers';
import type { ProviderKeys } from '../services/providerSettings';

interface CohesionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBible: AestheticBible;
  preferLocalServer?: boolean;
  providerKeys: ProviderKeys;
}

export const CohesionAuditModal: React.FC<CohesionAuditModalProps> = ({
  isOpen,
  onClose,
  activeBible,
  preferLocalServer = false,
  providerKeys,
}) => {
  const [auditMode, setAuditMode] = useState<'text' | 'image'>('text');
  const [candidateType, setCandidateType] = useState<'Character' | 'Environment' | 'Item/Weapon' | 'UI Component' | 'Lore / Story Quest' | 'Audio / OST Note'>('Character');
  const [candidateConcept, setCandidateConcept] = useState('');
  
  // Image audit states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<CohesionAuditResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const modelOptions = getProviderModelOptions(providerKeys, providerRegistry.list());
  const selected = preferLocalServer ? undefined : resolveProviderModel(selectedModel, providerRegistry.list());
  const enabledModelKeys = modelOptions.filter((option) => option.enabled).map((option) => option.key).join('\0');
  const visionEnabled = preferLocalServer || !selectedModel || Boolean(selected?.model.capabilities.vision);

  React.useEffect(() => {
    if (!isOpen) return;
    if (preferLocalServer) {
      setSelectedModel('');
      return;
    }

    const enabled = new Set(enabledModelKeys.split('\0').filter(Boolean));
    setSelectedModel((current) => current && enabled.has(current) ? current : [...enabled][0] ?? '');
  }, [isOpen, preferLocalServer, enabledModelKeys]);

  React.useEffect(() => {
    if (!visionEnabled && auditMode === 'image') {
      setAuditMode('text');
      setSelectedImage(null);
    }
  }, [visionEnabled, auditMode]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRunAudit = async () => {
    if (auditMode === 'text' && !candidateConcept.trim()) {
      setErrorMsg('Please describe the candidate concept under evaluation.');
      return;
    }

    if (auditMode === 'image' && !selectedImage) {
      setErrorMsg('Please upload or select a visual artwork image to audit.');
      return;
    }

    setIsAuditing(true);
    setErrorMsg(null);
    setAuditResult(null);

    try {
      const selection = preferLocalServer ? undefined : resolveProviderModel(selectedModel, providerRegistry.list());
      if (!preferLocalServer && selectedModel && !selection) {
        throw new Error('The selected provider is no longer available. Choose an active model and try again.');
      }
      if (selection) {
        const candidate = auditMode === 'image'
          ? JSON.stringify(await selection.adapter.decodeImage(selectedImage!, mimeType, selection.model.id))
          : candidateConcept.trim();
        const result = await selection.adapter.auditCohesion(
          activeBible,
          candidate,
          candidateType,
          selection.model.id,
        );
        providerRegistry.setActive(selection.adapter.id);
        setAuditResult(result);
        return;
      }

      const endpoint = auditMode === 'image' ? '/api/audit-image-cohesion' : '/api/audit-cohesion';
      const payload = auditMode === 'image'
        ? {
            bible: activeBible,
            imageBase64: selectedImage,
            mimeType,
            candidateType,
          }
        : {
            bible: activeBible,
            candidateConcept: candidateConcept.trim(),
            candidateType,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Failed to complete cohesion audit.');
      }

      const result: CohesionAuditResult = await res.json();
      setAuditResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error running audit. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/80 bg-emerald-950/40';
    if (score >= 65) return 'text-amber-400 border-amber-500/80 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/80 bg-rose-950/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0D0E15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Thematic Cohesion Audit Engine
              </h2>
              <p className="text-xs text-slate-400">
                Auditing against: <span className="text-slate-200 font-medium">{activeBible.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Mode Switcher Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => { setAuditMode('text'); setAuditResult(null); }}
            className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 flex items-center gap-1.5 transition-all ${
              auditMode === 'text'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Text Concept Spec Audit
          </button>

          <button
            onClick={() => { setAuditMode('image'); setAuditResult(null); }}
            disabled={!visionEnabled}
            className={`px-3.5 py-2 text-xs font-mono font-medium border-b-2 flex items-center gap-1.5 transition-all ${
              auditMode === 'image'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200 disabled:text-slate-700 disabled:cursor-not-allowed'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Upload Image Artwork Audit
          </button>
          {!visionEnabled && <span className="ml-auto pb-2 text-[10px] text-amber-300">Selected model has no vision; text-only audit enforced.</span>}
        </div>

        {/* Modal Form */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-slate-300 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold">Dismiss</button>
            </div>
          )}

          {/* Input Form */}
          <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Provider / model</label>
              <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200">
                <option value="">Express fallback</option>
                {modelOptions.map((option) => <option key={option.key} value={option.key} disabled={!option.enabled}>{option.providerLabel} · {option.model.label}{option.enabled ? '' : ' — configure key in Settings'}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Candidate Asset Category
                </label>
                <select
                  value={candidateType}
                  onChange={(e) => setCandidateType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Character">Character / Boss NPC</option>
                  <option value="Environment">Environment / Room Level</option>
                  <option value="Item/Weapon">Item / Weapon / Relic</option>
                  <option value="UI Component">UI Widget / HUD</option>
                  <option value="Lore / Story Quest">Lore Note / Story Quest</option>
                  <option value="Audio / OST Note">Audio / OST Soundscape</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Auditing Style...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Run AI Cohesion Audit</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {auditMode === 'text' ? (
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Describe Candidate Asset Specs / Visuals / Story
                </label>
                <textarea
                  rows={3}
                  value={candidateConcept}
                  onChange={(e) => setCandidateConcept(e.target.value)}
                  placeholder="e.g. A cybernetic plague doctor boss wielding a neon pink particle whip with chrome armor..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500 text-xs leading-relaxed resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">
                  Upload Candidate Image File to Audit
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-xl p-4 text-center cursor-pointer bg-slate-950/60 transition-all flex items-center justify-center gap-4 min-h-[100px]"
                >
                  {selectedImage ? (
                    <div className="flex items-center gap-3">
                      <img src={selectedImage} alt="Candidate" className="w-16 h-16 object-cover rounded-lg border border-amber-500/40" />
                      <span className="text-xs text-amber-300 font-mono">Image attached. Click to change.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Upload className="w-5 h-5 text-amber-400" />
                      <span className="text-xs">Click or drop image file here to perform multimodal visual audit</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Audit Results View */}
          {auditResult && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Score Gauge Banner */}
              <div className={`p-5 rounded-2xl border ${getScoreColor(auditResult.score)} flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/50 border border-current flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-mono font-bold">{auditResult.score}%</span>
                    <span className="text-[9px] font-mono uppercase opacity-80">Cohesion</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight font-display text-slate-100">
                      {auditResult.verdict}
                    </h3>
                    <p className="text-xs opacity-90 leading-relaxed mt-0.5">
                      {auditResult.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Alignment Points */}
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Verified Alignments
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {auditResult.alignmentPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Drift Warnings */}
                <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Style Drift Violations
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {auditResult.driftWarnings.map((warn, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Actionable Fixes */}
              <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" /> Actionable Alignment Fixes
                </h4>
                <ul className="space-y-2 text-slate-300">
                  {auditResult.suggestedFixes.map((fix, i) => (
                    <li key={i} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg flex items-start gap-2 text-slate-200">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
          >
            Close Audit Engine
          </button>
        </div>

      </div>
    </div>
  );
};
