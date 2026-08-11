import React, { useState } from 'react';
import { 
  Grid, 
  Filter, 
  Search, 
  Pin, 
  Sparkles, 
  Copy, 
  Check, 
  Maximize2, 
  Plus, 
  Loader2, 
  Wand2, 
  X,
  Compass,
  Eye
} from 'lucide-react';
import { MoodBoardTile, MoodTileCategory } from '../types';

interface MoodBoardSectionProps {
  tiles: MoodBoardTile[];
  philosophyAnchors: string[];
  onUpdateTile: (tileId: string, updatedTile: Partial<MoodBoardTile>) => void;
  onAddTile: (newTile: MoodBoardTile) => void;
  onOpenDecoder?: () => void;
  canGenerateImages?: boolean;
}

const CATEGORIES: ('All' | MoodTileCategory)[] = [
  'All',
  'Environment',
  'Character',
  'Architecture',
  'Item/Prop',
  'UI/HUD',
  'Lighting & FX'
];

export const MoodBoardSection: React.FC<MoodBoardSectionProps> = ({
  tiles,
  philosophyAnchors,
  onUpdateTile,
  onAddTile,
  onOpenDecoder,
  canGenerateImages = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | MoodTileCategory>('All');
  const [selectedPhilosophy, setSelectedPhilosophy] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalTile, setActiveModalTile] = useState<MoodBoardTile | null>(null);
  
  // State for regenerating image
  const [loadingTileId, setLoadingTileId] = useState<string | null>(null);

  // State for Add Custom Tile Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<MoodTileCategory>('Environment');
  const [newDesc, setNewDesc] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newPhilo, setNewPhilo] = useState(philosophyAnchors[0] || 'Core Thesis');

  const copyPrompt = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleRegenerateImage = async (tile: MoodBoardTile) => {
    setLoadingTileId(tile.id);
    try {
      const res = await fetch('/api/generate-mood-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptSpec: tile.promptSpec,
          aspectRatio: '1:1'
        })
      });

      const data = await res.json();
      if (data.imageUrl) {
        onUpdateTile(tile.id, { imageUrl: data.imageUrl });
        if (activeModalTile && activeModalTile.id === tile.id) {
          setActiveModalTile({ ...activeModalTile, imageUrl: data.imageUrl });
        }
      }
    } catch (err) {
      console.error('Failed to regenerate image:', err);
    } finally {
      setLoadingTileId(null);
    }
  };

  const handleCreateCustomTile = () => {
    if (!newTitle.trim()) return;

    const created: MoodBoardTile = {
      id: `tile-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCat,
      description: newDesc.trim() || 'Custom curated visual mood concept',
      promptSpec: newPrompt.trim() || `${newTitle.trim()} concept art, game visual, 8k octane render`,
      imageUrl: newImgUrl.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      philosophyTag: newPhilo,
      materialTags: ['Curated Asset'],
      lightingProfile: 'Custom Mood Profile',
      focalPoint: newTitle.trim(),
      pinned: true
    };

    onAddTile(created);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewPrompt('');
    setNewImgUrl('');
  };

  // Filter Logic
  const filteredTiles = tiles.filter((tile) => {
    const matchesCategory = selectedCategory === 'All' || tile.category === selectedCategory;
    const matchesPhilosophy = selectedPhilosophy === 'All' || tile.philosophyTag === selectedPhilosophy;
    const matchesSearch = 
      tile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tile.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tile.promptSpec.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesPhilosophy && matchesSearch;
  });

  // Sort pinned first
  const sortedTiles = [...filteredTiles].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div id="section-moodboard" className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" /> Automated Mood Board Curation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-curated visual prompt specifications, philosophy tagging, and live image generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDecoder && (
            <button
              onClick={onOpenDecoder}
              className="px-3.5 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Upload reference image to extract aesthetics and match to mood board"
            >
              <Eye className="w-4 h-4 text-cyan-400" /> Decode Image & Match
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-cyan-400" /> Add Custom Mood Tile
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Philosophy Filter Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedPhilosophy}
            onChange={(e) => setSelectedPhilosophy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All">All Philosophy Anchors</option>
            {philosophyAnchors.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-40 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {sortedTiles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <p className="text-slate-400 text-xs">No mood board tiles match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedTiles.map((tile) => {
            const isGeneratingThis = loadingTileId === tile.id;
            const isCopied = copiedId === tile.id;

            return (
              <div
                key={tile.id}
                className="group bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-2xl flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={tile.imageUrl}
                    alt={tile.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-mono font-bold text-cyan-300 uppercase">
                      {tile.category}
                    </span>

                    <button
                      onClick={() => onUpdateTile(tile.id, { pinned: !tile.pinned })}
                      className={`p-1.5 rounded-md backdrop-blur-md transition-colors ${
                        tile.pinned
                          ? 'bg-amber-500/80 text-slate-950'
                          : 'bg-black/60 text-slate-400 hover:text-slate-100'
                      }`}
                      title={tile.pinned ? 'Unpin tile' : 'Pin tile to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setActiveModalTile(tile)}
                      className="px-2.5 py-1.5 bg-black/80 hover:bg-black text-white rounded-lg text-[11px] font-medium backdrop-blur-md flex items-center gap-1 transition-all"
                    >
                      <Maximize2 className="w-3 h-3 text-cyan-400" /> Inspect Specs
                    </button>

                    <button
                      onClick={() => canGenerateImages ? handleRegenerateImage(tile) : copyPrompt(tile.id, tile.promptSpec)}
                      disabled={isGeneratingThis}
                      className="px-2.5 py-1.5 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 rounded-lg text-[11px] font-medium backdrop-blur-md flex items-center gap-1 transition-all"
                      title={canGenerateImages ? 'Generate a new AI visual' : 'Selected model cannot generate images; copy its PromptSpec'}
                    >
                      {isGeneratingThis ? (
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      ) : (
                        <Wand2 className="w-3 h-3 text-cyan-400" />
                      )}
                      <span>{canGenerateImages ? 'Generate Visual' : 'Copy PromptSpec'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{tile.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                      {tile.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                      <Compass className="w-3 h-3 shrink-0" />
                      <span className="truncate">{tile.philosophyTag}</span>
                    </div>

                    {/* Copy Prompt Spec Button */}
                    <button
                      onClick={() => copyPrompt(tile.id, tile.promptSpec)}
                      className="w-full py-1.5 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 flex items-center justify-between gap-1.5 transition-colors group/btn"
                    >
                      <span className="truncate text-slate-400 group-hover/btn:text-slate-200">
                        "{tile.promptSpec}"
                      </span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Tile Modal */}
      {activeModalTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0D0E15] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative aspect-video w-full bg-black">
              <img
                src={activeModalTile.imageUrl}
                alt={activeModalTile.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveModalTile(null)}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-slate-300 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    {activeModalTile.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{activeModalTile.title}</h3>
                </div>
                <button
                  onClick={() => canGenerateImages ? handleRegenerateImage(activeModalTile) : copyPrompt(activeModalTile.id, activeModalTile.promptSpec)}
                  disabled={loadingTileId === activeModalTile.id}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-xl font-medium text-xs flex items-center gap-1.5"
                >
                  {loadingTileId === activeModalTile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  <span>{canGenerateImages ? 'Regenerate Visual' : 'Copy PromptSpec'}</span>
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed">{activeModalTile.description}</p>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-mono uppercase text-[10px] block">Philosophy Tag</span>
                  <span className="text-amber-300 font-medium">{activeModalTile.philosophyTag}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-mono uppercase text-[10px] block">Lighting Profile</span>
                  <span className="text-slate-200">{activeModalTile.lightingProfile}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-mono uppercase text-[10px] block mb-1">Prompt Spec (Midjourney / Gemini)</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 flex items-center justify-between gap-2">
                  <span className="select-all">{activeModalTile.promptSpec}</span>
                  <button
                    onClick={() => copyPrompt(activeModalTile.id, activeModalTile.promptSpec)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0"
                  >
                    {copiedId === activeModalTile.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Tile Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0D0E15] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-display">Add Custom Mood Board Tile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tile Title</label>
                <input
                  type="text"
                  placeholder="e.g. Celestial Ether Generator Core"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as MoodTileCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Environment">Environment</option>
                    <option value="Character">Character</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Item/Prop">Item/Prop</option>
                    <option value="UI/HUD">UI/HUD</option>
                    <option value="Lighting & FX">Lighting & FX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Philosophy Tag</label>
                  <select
                    value={newPhilo}
                    onChange={(e) => setNewPhilo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {philosophyAnchors.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Prompt Spec</label>
                <input
                  type="text"
                  placeholder="Detailed AI image generation prompt..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomTile}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
              >
                Add Tile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
