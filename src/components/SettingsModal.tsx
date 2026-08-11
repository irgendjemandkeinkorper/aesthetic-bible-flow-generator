import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, KeyRound, Save, Trash2, X } from 'lucide-react';
import {
  PROVIDER_SETTINGS,
  persistProviderKey,
  readProviderKeys,
  type ProviderId,
  type ProviderKeys,
} from '../services/providerSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderKeyChange: (providerId: ProviderId, apiKey: string) => Promise<void>;
  onKeysChange: (keys: ProviderKeys) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onProviderKeyChange,
  onKeysChange,
}) => {
  const [keys, setKeys] = useState<ProviderKeys>(() => readProviderKeys(window.localStorage));
  const [message, setMessage] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<ProviderId | null>(null);
  const [copiedSetup, setCopiedSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(readProviderKeys(window.localStorage));
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveKey = async (providerId: ProviderId) => {
    const value = persistProviderKey(window.localStorage, providerId, keys[providerId]);
    const nextKeys = { ...keys, [providerId]: value };
    setKeys(nextKeys);
    onKeysChange(nextKeys);

    setSavingProvider(providerId);
    try {
      await onProviderKeyChange(providerId, value);
      const label = PROVIDER_SETTINGS.find((provider) => provider.id === providerId)?.label;
      const setting = providerId === 'ollama' ? 'server URL' : 'key';
      setMessage(value ? `${label} ${setting} saved and browser provider activated.` : `${label} ${setting} removed.`);
    } catch (error) {
      setMessage(`Setting was saved, but activation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingProvider(null);
    }
  };

  const clearKey = async (providerId: ProviderId) => {
    const nextKeys = { ...keys, [providerId]: '' };
    persistProviderKey(window.localStorage, providerId, '');
    setKeys(nextKeys);
    onKeysChange(nextKeys);
    await onProviderKeyChange(providerId, '');
    const setting = providerId === 'ollama' ? 'server URL' : 'key';
    setMessage(`${PROVIDER_SETTINGS.find((provider) => provider.id === providerId)?.label} ${setting} deleted from this browser.`);
  };

  const setupSnippet = `# macOS\nbrew install ollama\n\n# Linux\ncurl -fsSL https://ollama.com/install.sh | sh\n\n# Set this on the Ollama server before it starts\nOLLAMA_ORIGINS='*' ollama serve\n\n# In another terminal\nollama pull llama3.2\nollama pull llava`;

  const copySetup = async () => {
    try {
      await navigator.clipboard.writeText(setupSnippet);
      setCopiedSetup(true);
      setTimeout(() => setCopiedSetup(false), 2_000);
    } catch {
      setMessage('Clipboard access was denied. Select the setup commands and copy them manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0D0E15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Provider Settings</h2>
              <p className="text-xs text-slate-400">Keys are stored only in this browser's localStorage and never sent to our server.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-xs text-amber-200">
            Direct browser access exposes Gemini, OpenAI, and Anthropic keys to anyone with browser developer-tools access. Treat them like passwords: use restricted keys, avoid shared devices, and revoke any key you suspect was exposed. Keys are sent only to the selected provider.
          </div>

          {PROVIDER_SETTINGS.map((provider) => (
            <div key={provider.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={`provider-key-${provider.id}`} className="text-xs font-semibold text-slate-200">
                  {provider.label} {provider.id === 'ollama' ? 'server URL' : 'API key'}
                </label>
                {keys[provider.id] && (
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Stored
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id={`provider-key-${provider.id}`}
                  type={provider.id === 'ollama' ? 'url' : 'password'}
                  autoComplete="off"
                  value={keys[provider.id]}
                  onChange={(event) => setKeys({ ...keys, [provider.id]: event.target.value })}
                  placeholder={provider.id === 'ollama' ? 'http://localhost:11434' : `Enter ${provider.label} API key`}
                  className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => void saveKey(provider.id)}
                  disabled={savingProvider === provider.id}
                  className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => void clearKey(provider.id)}
                  disabled={!keys[provider.id]}
                  aria-label={`Delete ${provider.label} key`}
                  className="px-3 py-2 rounded-lg border border-rose-800 text-rose-300 hover:bg-rose-950/50 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {provider.id === 'ollama' && <p className="text-[11px] text-slate-500">No API key is required. Only localhost URLs are accepted.</p>}
            </div>
          ))}

          <details className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-3 text-xs text-amber-100">
            <summary className="cursor-pointer font-semibold">Local Setup Guide</summary>
            <div className="mt-3 space-y-3">
              <p>
                Run Ollama on the same computer as this browser. <code>OLLAMA_ORIGINS</code> is an
                environment variable for the Ollama server process—not an app setting—and must be set before Ollama starts.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 pr-12 text-[11px] text-slate-200"><code>{setupSnippet}</code></pre>
                <button
                  type="button"
                  onClick={() => void copySetup()}
                  aria-label="Copy Ollama setup commands"
                  className="absolute right-2 top-2 rounded border border-slate-600 bg-slate-900 p-1.5 text-slate-300 hover:text-white"
                >
                  {copiedSetup ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div>
                <p className="font-semibold">Troubleshooting</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-amber-200/90">
                  <li>Confirm <code>ollama serve</code> is still running and the URL is <code>http://localhost:11434</code>.</li>
                  <li>If the browser reports CORS, stop Ollama and restart its server with <code>OLLAMA_ORIGINS='*'</code>.</li>
                  <li>Open <code>http://localhost:11434/api/tags</code> in the same browser to check reachability.</li>
                  <li>Run <code>ollama list</code> and pull any model shown as missing.</li>
                </ul>
              </div>
            </div>
          </details>

          {message && <div role="status" className="rounded-lg bg-slate-900 border border-slate-700 p-3 text-xs text-slate-300">{message}</div>}
        </div>
      </div>
    </div>
  );
};
