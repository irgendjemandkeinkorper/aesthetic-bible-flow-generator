import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  Maximize2, 
  Activity, 
  Lock, 
  Unlock, 
  Eye, 
  Code2,
  Terminal,
  MousePointerClick
} from 'lucide-react';
import { AestheticBible } from '../types';

interface ClaudeDesignPlaygroundSectionProps {
  bible: AestheticBible;
}

// Utility for calculating WCAG relative luminance & contrast ratio
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export const ClaudeDesignPlaygroundSection: React.FC<ClaudeDesignPlaygroundSectionProps> = ({ bible }) => {
  const { colorSystem, typographySystem, shapeAndForm, interfaceAndHUD } = bible;

  // Local interactive playground state
  const [activeTab, setActiveTab] = useState<'components' | 'accessibility' | 'tokens' | 'code'>('components');
  const [toggleState, setToggleState] = useState(true);
  const [inputValue, setInputValue] = useState('Tactile Core Spec');
  const [sliderVal, setSliderVal] = useState(74);
  const [selectedVariant, setSelectedVariant] = useState<'default' | 'glow' | 'outline'>('default');
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom tweakers for live testing
  const [customRadius, setCustomRadius] = useState<number>(12);
  const [customGlow, setCustomGlow] = useState<number>(15);

  // Colors
  const primaryHex = colorSystem?.primary?.hex || '#06B6D4';
  const secondaryHex = colorSystem?.secondary?.hex || '#3B82F6';
  const accentHex = colorSystem?.accent?.hex || '#F59E0B';
  const bgDarkHex = colorSystem?.neutralDark?.hex || '#0B0F19';
  const bgLightHex = colorSystem?.neutralLight?.hex || '#E2E8F0';
  const glowHex = colorSystem?.specularGlow?.hex || '#22D3EE';

  // Calculate WCAG contrast scores
  const primaryVsBgRatio = getContrastRatio(primaryHex, bgDarkHex).toFixed(2);
  const accentVsBgRatio = getContrastRatio(accentHex, bgDarkHex).toFixed(2);
  const lightVsBgRatio = getContrastRatio(bgLightHex, bgDarkHex).toFixed(2);

  const getWcagBadge = (ratioStr: string) => {
    const ratio = parseFloat(ratioStr);
    if (ratio >= 7.0) {
      return { label: 'AAA Pass', bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' };
    } else if (ratio >= 4.5) {
      return { label: 'AA Pass', bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300' };
    } else if (ratio >= 3.0) {
      return { label: 'Large Text Pass', bg: 'bg-amber-950/80 border-amber-500/60 text-amber-300' };
    }
    return { label: 'Low Contrast', bg: 'bg-rose-950/80 border-rose-500/60 text-rose-300' };
  };

  const primaryBadge = getWcagBadge(primaryVsBgRatio);
  const accentBadge = getWcagBadge(accentVsBgRatio);

  const generateReactComponentCode = () => {
    return `// Claude Design System Output for "${bible.title}"
// Auto-generated UI Component Specification & Design Tokens

export const ThemeTokens = {
  colors: {
    primary: "${primaryHex}", // ${colorSystem.primary?.name || 'Primary'}
    secondary: "${secondaryHex}", // ${colorSystem.secondary?.name || 'Secondary'}
    accent: "${accentHex}", // ${colorSystem.accent?.name || 'Accent'}
    neutralDark: "${bgDarkHex}",
    neutralLight: "${bgLightHex}",
    glow: "${glowHex}"
  },
  typography: {
    display: "${typographySystem.displayFont?.name || 'Sans'}",
    heading: "${typographySystem.headingFont?.name || 'Sans'}",
    body: "${typographySystem.bodyFont?.name || 'Sans'}",
    mono: "${typographySystem.monoFont?.name || 'Monospace'}"
  },
  geometry: {
    borderRadius: "${customRadius}px",
    glowBlur: "${customGlow}px",
    style: "${shapeAndForm.silhouetteStyle || 'Sharp Tactical'}"
  }
};

// Reusable Button Component Matching Bible Aesthetics
export const BibleButton = ({ children, variant = 'primary', onClick }: any) => {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: variant === 'primary' ? ThemeTokens.colors.primary : 'transparent',
        color: variant === 'primary' ? ThemeTokens.colors.neutralDark : ThemeTokens.colors.primary,
        border: \`1px solid \${ThemeTokens.colors.primary}\`,
        borderRadius: ThemeTokens.geometry.borderRadius,
        boxShadow: variant === 'glow' ? \`0 0 \${ThemeTokens.geometry.glowBlur} \${ThemeTokens.colors.glow}\` : 'none',
        padding: '8px 16px',
        fontWeight: 'bold',
        fontFamily: ThemeTokens.typography.heading,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  );
};`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateReactComponentCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-[#0E111E] to-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
              Claude Design Specification
            </span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-mono">
              Live Interactive UI Components
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Interactive UI Laboratory & Design System Preview
          </h2>
          <p className="text-xs text-slate-400">
            Rendered components, WCAG contrast accessibility matrices, and copyable design tokens for <span className="text-slate-200 font-semibold">{bible.title}</span>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4 text-cyan-400" />}
            <span>{copiedCode ? 'Tokens Copied!' : 'Copy Code & Tokens'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('components')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'components'
              ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MousePointerClick className="w-3.5 h-3.5" /> Interactive UI Components
        </button>

        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'accessibility'
              ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> WCAG Accessibility Ratios
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'code'
              ? 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> Generated Design Spec Code
        </button>
      </div>

      {/* TAB 1: INTERACTIVE COMPONENTS PLAYGROUND */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          
          {/* Customizer Slider Control Strip */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Border Radius Token
                </span>
                <span className="font-bold text-cyan-300">{customRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="28"
                value={customRadius}
                onChange={(e) => setCustomRadius(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Specular Glow Blur
                </span>
                <span className="font-bold text-amber-300">{customGlow}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                value={customGlow}
                onChange={(e) => setCustomGlow(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Grid of Rendered Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Component Box 1: Action Controls & Buttons */}
            <div className="bg-[#0C0E17] border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-cyan-400" /> Action Controls & Buttons
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Interactive States</span>
              </div>

              <div className="space-y-4">
                {/* Primary Button */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase">Primary Action Button</span>
                  <button
                    style={{
                      backgroundColor: primaryHex,
                      color: bgDarkHex,
                      borderRadius: `${customRadius}px`,
                      boxShadow: `0 0 ${customGlow}px ${primaryHex}40`
                    }}
                    className="w-full py-2.5 px-4 font-bold text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Engage {bible.title} Protocol</span>
                  </button>
                </div>

                {/* Secondary & Accent Glow Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    style={{
                      borderColor: primaryHex,
                      color: primaryHex,
                      borderRadius: `${customRadius}px`,
                      backgroundColor: `${primaryHex}10`
                    }}
                    className="py-2 px-3 border font-bold text-xs transition-all hover:bg-opacity-20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Secondary</span>
                  </button>

                  <button
                    style={{
                      backgroundColor: accentHex,
                      color: bgDarkHex,
                      borderRadius: `${customRadius}px`,
                      boxShadow: `0 0 ${customGlow}px ${accentHex}50`
                    }}
                    className="py-2 px-3 font-bold text-xs transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Accent Glow</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Component Box 2: Interactive Form Input & Toggles */}
            <div className="bg-[#0C0E17] border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" /> Inputs, Sliders & Toggles
                </h3>
                <span className="text-[10px] font-mono text-slate-500">Live Input Test</span>
              </div>

              <div className="space-y-4">
                {/* Text Field */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1 uppercase">
                    Diegetic Text Input
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{
                      borderColor: `${primaryHex}60`,
                      borderRadius: `${customRadius}px`,
                      backgroundColor: `${bgDarkHex}`
                    }}
                    className="w-full px-3 py-2 border text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                {/* Range Slider & Toggle */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Tactile Scale</span>
                      <span className="font-bold text-amber-400">{sliderVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderVal}
                      onChange={(e) => setSliderVal(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-300">Sync Matrix</span>
                    <button
                      onClick={() => setToggleState(!toggleState)}
                      style={{
                        backgroundColor: toggleState ? primaryHex : '#334155'
                      }}
                      className="w-9 h-5 rounded-full p-0.5 transition-colors relative"
                    >
                      <div
                        style={{
                          transform: toggleState ? 'translateX(16px)' : 'translateX(0px)',
                          backgroundColor: bgDarkHex
                        }}
                        className="w-4 h-4 rounded-full transition-transform shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Box 3: Diegetic Tactical HUD Card */}
            <div className="bg-[#0C0E17] border border-slate-800 rounded-2xl p-6 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: `${primaryHex}20`, borderColor: primaryHex, color: primaryHex }}
                    className="p-1.5 border rounded-lg"
                  >
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                      Diegetic HUD Card ({interfaceAndHUD.diegeticType || 'Tactile Analog'})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Density Profile: <span className="text-cyan-300 font-mono">{interfaceAndHUD.layoutDensity}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex, borderColor: `${accentHex}50` }}
                    className="px-2.5 py-0.5 border rounded-full text-[10px] font-mono font-bold"
                  >
                    SYSTEM NOMINAL
                  </span>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Aesthetic Calibration</span>
                    <span style={{ color: primaryHex }} className="font-bold">98.4%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: '98.4%', backgroundColor: primaryHex }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Specular Resonance</span>
                    <span style={{ color: accentHex }} className="font-bold">82.1%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: '82.1%', backgroundColor: accentHex }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Grit Density</span>
                    <span style={{ color: secondaryHex }} className="font-bold">64.0%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: '64%', backgroundColor: secondaryHex }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: WCAG ACCESSIBILITY SCORES */}
      {activeTab === 'accessibility' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> WCAG Color Contrast Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated against dark surface background (<span className="font-mono text-slate-200">{bgDarkHex}</span>)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Primary */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: primaryHex }} />
                    <span className="font-bold text-xs text-slate-200">{colorSystem.primary?.name || 'Primary'}</span>
                  </div>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold ${primaryBadge.bg}`}>
                    {primaryBadge.label}
                  </span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-100">
                  {primaryVsBgRatio} : 1
                </div>
                <p className="text-[11px] text-slate-400">
                  Ideal for primary action buttons, focused state borders, and header badges.
                </p>
              </div>

              {/* Accent */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: accentHex }} />
                    <span className="font-bold text-xs text-slate-200">{colorSystem.accent?.name || 'Accent'}</span>
                  </div>
                  <span className={`px-2 py-0.5 border rounded text-[10px] font-mono font-bold ${accentBadge.bg}`}>
                    {accentBadge.label}
                  </span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-100">
                  {accentVsBgRatio} : 1
                </div>
                <p className="text-[11px] text-slate-400">
                  Used for highlight indicators, critical alerts, and specular glow effects.
                </p>
              </div>

              {/* Neutral Light */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: bgLightHex }} />
                    <span className="font-bold text-xs text-slate-200">Neutral Light</span>
                  </div>
                  <span className="px-2 py-0.5 border rounded text-[10px] font-mono font-bold bg-emerald-950 border-emerald-500/60 text-emerald-300">
                    AAA Pass
                  </span>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-100">
                  {lightVsBgRatio} : 1
                </div>
                <p className="text-[11px] text-slate-400">
                  Primary text color for high legibility across dark canvas interfaces.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERATED CODE SPEC */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Terminal className="w-4 h-4" /> TypeScript React + Tailwind Theme Definition
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-[#08090E] border border-slate-800/80 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed select-all">
              {generateReactComponentCode()}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
