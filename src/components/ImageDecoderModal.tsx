import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Eye, 
  Sparkles, 
  Loader2, 
  Palette, 
  Layers, 
  Droplet, 
  Check, 
  Copy, 
  Plus, 
  Wand2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { DecodedImageAesthetic, MoodBoardTile, MoodTileCategory } from '../types';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_DIMENSION = 8_192;
const MAX_UPLOAD_PIXELS = 25_000_000;

const detectBrowserImageMime = async (file: File): Promise<string | null> => {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (
    bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) return 'image/webp';
  return null;
};

interface ImageDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTileToActiveBible: (tile: MoodBoardTile) => void;
  onGenerateBibleFromDecoded: (decoded: DecodedImageAesthetic, imageUrl: string) => void;
}

export const ImageDecoderModal: React.FC<ImageDecoderModalProps> = ({
  isOpen,
  onClose,
  onAddTileToActiveBible,
  onGenerateBibleFromDecoded,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState<DecodedImageAesthetic | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [tileAddedSuccess, setTileAddedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const selectImage = async (file: File) => {
    setErrorMsg(null);
    setDecodedResult(null);
    setSelectedImage(null);

    try {
      if (file.size > MAX_UPLOAD_BYTES) throw new Error('Image must be 8 MB or smaller.');
      const detectedMime = await detectBrowserImageMime(file);
      if (!detectedMime) throw new Error('Image bytes must be a PNG, JPEG, or WebP file.');
      if (file.type && file.type !== detectedMime) throw new Error('Image file type does not match its contents.');

      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (
        width < 1 || height < 1
        || width > MAX_UPLOAD_DIMENSION || height > MAX_UPLOAD_DIMENSION
        || width * height > MAX_UPLOAD_PIXELS
      ) {
        throw new Error('Image exceeds the 8192px edge or 25,000,000 pixel limit.');
      }

      setMimeType(detectedMime);
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.onerror = () => setErrorMsg('The image could not be read.');
      reader.readAsDataURL(file);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Please select a valid image file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void selectImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void selectImage(file);
    else setErrorMsg('Please drop a PNG, JPEG, or WebP image.');
  };

  const handleDecode = async () => {
    if (!selectedImage) return;

    setIsDecoding(true);
    setErrorMsg(null);
    setDecodedResult(null);

    try {
      const res = await fetch('/api/decode-image-aesthetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Failed to decode image aesthetic.');
      }

      const data: DecodedImageAesthetic = await res.json();
      setDecodedResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error decoding image. Please try again.');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleAddTile = () => {
    if (!decodedResult || !selectedImage) return;

    const newTile: MoodBoardTile = {
      id: `tile-decoded-${Date.now()}`,
      title: decodedResult.title || 'Decoded Image Reference',
      category: (decodedResult.category as MoodTileCategory) || 'Environment',
      description: decodedResult.summaryDescription,
      promptSpec: decodedResult.promptSpec,
      imageUrl: selectedImage,
      philosophyTag: decodedResult.philosophyTag || 'Visual Reference',
      materialTags: decodedResult.dominantMaterials || ['Decoded Surface'],
      lightingProfile: decodedResult.lightingProfile || 'Extracted Lighting',
      focalPoint: decodedResult.title,
      pinned: true,
    };

    onAddTileToActiveBible(newTile);
    setTileAddedSuccess(true);
    setTimeout(() => setTileAddedSuccess(false), 2500);
  };

  const copyPrompt = () => {
    if (!decodedResult) return;
    navigator.clipboard.writeText(decodedResult.promptSpec);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0D0E15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Image Aesthetic Decoder & DNA Extractor
              </h2>
              <p className="text-xs text-slate-400">
                Upload image artwork to decode color palettes, prompt specs, materials & style guidelines
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

        {/* Content Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6 text-slate-300 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 font-bold">Dismiss</button>
            </div>
          )}

          {/* Image Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Upload Zone */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                1. Select / Drop Reference Artwork
              </span>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  selectedImage
                    ? 'border-cyan-500/60 bg-cyan-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black group">
                    <img
                      src={selectedImage}
                      alt="Uploaded reference"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-mono text-cyan-300 bg-black/80 px-3 py-1.5 rounded-lg border border-cyan-500/50">
                        Click to change image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Drop reference image here, or click to browse
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PNG, JPG, WebP concept art, screenshots, mood board images
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedImage && (
                <button
                  onClick={handleDecode}
                  disabled={isDecoding}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {isDecoding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Decoding Image DNA with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Decode Aesthetic DNA</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick Preview or Initial Instructions */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-2">
                  What Gemini Vision Extracts
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our multimodal vision pipeline analyzes composition, lighting physics, dominant color swatches, surface material textures, and genre alignment to construct a full aesthetic profile.
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Exact 5-color Hex Palette with usage roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Surface Materiality & Weathering Tags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Midjourney / Gemini Image Generation Prompt Spec</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Genre match & Art Direction Do's & Don'ts</span>
                  </li>
                </ul>
              </div>

              {decodedResult && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <button
                    onClick={handleAddTile}
                    className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {tileAddedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Added to Active Mood Board!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Import as Mood Board Tile</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (decodedResult && selectedImage) {
                        onGenerateBibleFromDecoded(decodedResult, selectedImage);
                        onClose();
                      }
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Wand2 className="w-4 h-4 text-cyan-400" />
                    <span>Seed Full Aesthetic Bible from Image</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Decoded Results Display */}
          {decodedResult && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-fadeIn">
              
              {/* Title & Genre Match Header */}
              <div className="bg-gradient-to-r from-slate-900 via-[#101320] to-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-500/60 text-cyan-300 rounded-md text-[10px] font-mono font-bold uppercase">
                      {decodedResult.genreMatch}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-mono">
                      {decodedResult.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 font-display">
                    {decodedResult.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {decodedResult.summaryDescription}
                  </p>
                </div>

                <div className="shrink-0 bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Philosophy Tag</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{decodedResult.philosophyTag}</span>
                </div>
              </div>

              {/* Extracted Color Palette */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Extracted 5-Color Hex Swatches
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {decodedResult.extractedPalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2 group transition-all hover:border-slate-700"
                    >
                      <div
                        className="w-full h-12 rounded-lg border border-white/10 shadow-inner flex items-end justify-end p-1"
                        style={{ backgroundColor: color.hex }}
                      >
                        <span className="text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">
                          {color.hex}
                        </span>
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-200 truncate">{color.name}</h5>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{color.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials & Lighting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Dominant Materials */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5" /> Dominant Materials & Textures
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {decodedResult.dominantMaterials.map((mat, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 font-mono">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lighting Profile */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Lighting & Specular Profile
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {decodedResult.lightingProfile}
                  </p>
                </div>

              </div>

              {/* Prompt Spec */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Decoded AI Prompt Spec
                  </span>
                  <button
                    onClick={copyPrompt}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-mono flex items-center gap-1"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Copied' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 select-all">
                  "{decodedResult.promptSpec}"
                </div>
              </div>

              {/* Do & Don't Guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Visual Guidelines (DO)
                  </h4>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {decodedResult.doAndDontGuidelines?.doList?.map((doItem, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{doItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4" /> Banned Anti-Patterns (DON'T)
                  </h4>
                  <ul className="space-y-1 text-slate-300 text-xs">
                    {decodedResult.doAndDontGuidelines?.dontList?.map((dontItem, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{dontItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Powered by Gemini Multimodal Vision API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
          >
            Close Decoder
          </button>
        </div>

      </div>
    </div>
  );
};
