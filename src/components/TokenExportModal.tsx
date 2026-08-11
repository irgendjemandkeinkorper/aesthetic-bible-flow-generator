import React, { useMemo, useState } from 'react';
import { X, Code2, Copy, Check, Download, Upload } from 'lucide-react';
import { AestheticBible } from '../types';
import { stringifyFigmaInterchange } from '../services/figmaExport';
import { parseAestheticBibleJson } from '../services/bibleImport';

interface TokenExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bible: AestheticBible;
  onImportBible: (bible: AestheticBible) => void;
}

export const TokenExportModal: React.FC<TokenExportModalProps> = ({
  isOpen,
  onClose,
  bible,
  onImportBible,
}) => {
  const [activeTab, setActiveTab] = useState<'css' | 'markdown' | 'json' | 'bible' | 'engine'>('css');
  const [isCopied, setIsCopied] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const figmaInterchangeJson = useMemo(() => {
    if (!isOpen || activeTab !== 'json') return '';
    try {
      return stringifyFigmaInterchange(bible);
    } catch (error) {
      return `// Unable to generate Figma interchange JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
  }, [bible, isOpen, activeTab]);

  if (!isOpen) return null;

  // 1. CSS / Tailwind Export
  const generateCSS = () => {
    return `/* ==========================================================================
   Aesthetic Bible: ${bible.title}
   Genre: ${bible.genre} (${bible.subgenre})
   ========================================================================== */

:root {
  /* Color System */
  --color-primary: ${bible.colorSystem.primary.hex}; /* ${bible.colorSystem.primary.name} */
  --color-secondary: ${bible.colorSystem.secondary.hex}; /* ${bible.colorSystem.secondary.name} */
  --color-accent: ${bible.colorSystem.accent.hex}; /* ${bible.colorSystem.accent.name} */
  --color-neutral-dark: ${bible.colorSystem.neutralDark.hex}; /* ${bible.colorSystem.neutralDark.name} */
  --color-neutral-light: ${bible.colorSystem.neutralLight.hex}; /* ${bible.colorSystem.neutralLight.name} */
  --color-specular-glow: ${bible.colorSystem.specularGlow.hex}; /* ${bible.colorSystem.specularGlow.name} */

  /* Typography Roles */
  --font-display: "${bible.typographySystem.displayFont.name}", serif;
  --font-heading: "${bible.typographySystem.headingFont.name}", sans-serif;
  --font-body: "${bible.typographySystem.bodyFont.name}", serif;
  --font-mono: "${bible.typographySystem.monoFont.name}", monospace;

  /* Interface Guidelines */
  --diegetic-type: "${bible.interfaceAndHUD.diegeticType}";
  --layout-density: "${bible.interfaceAndHUD.layoutDensity}";
}

/* Tailwind Theme Extension snippet */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "${bible.colorSystem.primary.hex}",
        secondary: "${bible.colorSystem.secondary.hex}",
        accent: "${bible.colorSystem.accent.hex}",
        dark: "${bible.colorSystem.neutralDark.hex}",
        light: "${bible.colorSystem.neutralLight.hex}",
        glow: "${bible.colorSystem.specularGlow.hex}",
      }
    }
  }
};`;
  };

  // 2. Markdown Art Direction Bible
  const generateMarkdown = () => {
    return `# Aesthetic Bible: ${bible.title}
> **Genre:** ${bible.genre} (${bible.subgenre})
> **Core Thesis:** "${bible.manifesto.coreThesis}"

---

## 1. Philosophy Anchors
${bible.philosophyAnchors.map(p => `- **${p}**`).join('\n')}

---

## 2. Art Direction & Style Guidelines
- **Visual Philosophy:** ${bible.manifesto.visualPhilosophy}
- **Emotional Cadence:** ${bible.manifesto.emotionalCadence}

### Enforced DO List
${bible.manifesto.doList.map(item => `- [x] ${item}`).join('\n')}

### Banned Anti-Patterns (DON'T)
${bible.manifesto.dontList.map(item => `- [ ] ${item}`).join('\n')}

---

## 3. Color System & Swatches
| Role | Name | Hex | Usage |
| --- | --- | --- | --- |
| Primary | ${bible.colorSystem.primary.name} | \`${bible.colorSystem.primary.hex}\` | ${bible.colorSystem.primary.usage} |
| Secondary | ${bible.colorSystem.secondary.name} | \`${bible.colorSystem.secondary.hex}\` | ${bible.colorSystem.secondary.usage} |
| Accent | ${bible.colorSystem.accent.name} | \`${bible.colorSystem.accent.hex}\` | ${bible.colorSystem.accent.usage} |
| Dark Neutral | ${bible.colorSystem.neutralDark.name} | \`${bible.colorSystem.neutralDark.hex}\` | ${bible.colorSystem.neutralDark.usage} |
| Light Neutral | ${bible.colorSystem.neutralLight.name} | \`${bible.colorSystem.neutralLight.hex}\` | ${bible.colorSystem.neutralLight.usage} |
| Specular Glow | ${bible.colorSystem.specularGlow.name} | \`${bible.colorSystem.specularGlow.hex}\` | ${bible.colorSystem.specularGlow.usage} |

---

## 4. Typography System
- **Display:** ${bible.typographySystem.displayFont.name} (${bible.typographySystem.displayFont.usage})
- **Heading:** ${bible.typographySystem.headingFont.name} (${bible.typographySystem.headingFont.usage})
- **Body:** ${bible.typographySystem.bodyFont.name} (${bible.typographySystem.bodyFont.usage})
- **Monospace:** ${bible.typographySystem.monoFont.name} (${bible.typographySystem.monoFont.usage})

---

## 5. Shape Language & Materials
- **Dominant Geometry:** ${bible.shapeAndForm.dominantGeometry}
- **Silhouette Style:** ${bible.shapeAndForm.silhouetteStyle}
- **Materials:** ${bible.shapeAndForm.materialAndTextures.join(', ')}
- **Weathering:** ${bible.shapeAndForm.gritAndWeathering}
`;
  };

  // 3. JSON Tokens
  const generateJSON = () => {
    return figmaInterchangeJson;
  };

  const generateBibleJSON = () => JSON.stringify(bible, null, 2);

  // 4. Unreal Engine / Unity C# Header
  const generateEngineCode = () => {
    return `// ==========================================================================
// Unreal Engine / Unity Game UI Palette Tokens
// Generated for: ${bible.title}
// ==========================================================================

using UnityEngine;

public static class ${bible.title.replace(/[^a-zA-Z0-9]/g, '')}Tokens
{
    public static readonly Color Primary = HexToColor("${bible.colorSystem.primary.hex}");
    public static readonly Color Secondary = HexToColor("${bible.colorSystem.secondary.hex}");
    public static readonly Color Accent = HexToColor("${bible.colorSystem.accent.hex}");
    public static readonly Color NeutralDark = HexToColor("${bible.colorSystem.neutralDark.hex}");
    public static readonly Color NeutralLight = HexToColor("${bible.colorSystem.neutralLight.hex}");
    public static readonly Color SpecularGlow = HexToColor("${bible.colorSystem.specularGlow.hex}");

    private static Color HexToColor(string hex)
    {
        ColorUtility.TryParseHtmlString(hex, out Color col);
        return col;
    }
}`;
  };

  const getContent = () => {
    switch (activeTab) {
      case 'css': return generateCSS();
      case 'markdown': return generateMarkdown();
      case 'json': return generateJSON();
      case 'bible': return generateBibleJSON();
      case 'engine': return generateEngineCode();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getContent());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadFile = () => {
    const text = getContent();
    const ext = activeTab === 'css' ? 'css' : activeTab === 'markdown' ? 'md' : activeTab === 'json' ? 'figma.json' : activeTab === 'bible' ? 'bible.json' : 'cs';
    const blob = new Blob([text], { type: activeTab === 'json' || activeTab === 'bible' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bible.id}-tokens.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBibleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) {
        setImportMessage('Import failed: the JSON file must be 5 MB or smaller.');
        return;
      }
      const result = parseAestheticBibleJson(await file.text());
      if (result.success === false) {
        setImportMessage(`Import failed: ${result.error}`);
        return;
      }
      onImportBible(result.bible);
      setImportMessage(`Imported “${result.bible.title}” successfully.`);
    } catch (error) {
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unable to read the selected file.'}`);
    } finally {
      input.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0D0E15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Export Design Tokens & Art Bible
              </h2>
              <p className="text-xs text-slate-400">
                Ready-to-use code exports and versioned Figma interchange JSON
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

        {/* Export Format Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('css')}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all ${
              activeTab === 'css'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CSS Variables & Tailwind
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all ${
              activeTab === 'markdown'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Markdown Art Bible
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Figma Interchange JSON
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all ${
              activeTab === 'engine'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Unity / Unreal C# Header
          </button>
          <button
            onClick={() => setActiveTab('bible')}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-all ${
              activeTab === 'bible'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Bible JSON
          </button>
        </div>

        {/* Code Output Viewer */}
        <div className="p-6 relative">
          <pre className="w-full max-h-[50vh] overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed select-all">
            {getContent()}
          </pre>
          {importMessage && (
            <div role="status" className={`mt-3 rounded-lg border p-3 text-xs ${importMessage.startsWith('Import failed') ? 'border-rose-800 bg-rose-950/40 text-rose-300' : 'border-emerald-800 bg-emerald-950/40 text-emerald-300'}`}>
              {importMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Exported from Aesthetic Bible Flow Generator
          </span>

          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import Bible
              <input type="file" accept="application/json,.json" onChange={(event) => void importBibleFile(event)} className="sr-only" />
            </label>
            <button
              onClick={downloadFile}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </button>

            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
