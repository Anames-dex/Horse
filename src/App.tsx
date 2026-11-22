import React, { useState, useMemo } from 'react';
import { useHorseStore } from './store/useHorseStore';
import { findSingleOptimalPair } from './engine/optimizer';
import { Horse } from './engine/types';
import { PedigreeTree } from './components/tree/PedigreeTree';
import { HorseCard } from './components/stable/HorseCard';
import { HorseModal } from './components/forms/HorseModal';
import { BestPairSpotlight } from './components/recommendations/BestPairSpotlight';
import {
  Plus,
  GitBranch,
  LayoutGrid,
  Download,
  Upload,
  RotateCcw,
  Search,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    horses,
    selectedHorseId,
    setSelectedHorseId,
    addHorse,
    updateHorse,
    deleteHorse,
    resetToDefaults,
    importHorses,
  } = useHorseStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'tree' | 'cards'>('split');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate the single optimal breeding pair across all generations
  const optimalRecommendation = useMemo(() => {
    return findSingleOptimalPair(horses);
  }, [horses]);

  const optimalSireId = optimalRecommendation?.parentA.id;
  const optimalDamId = optimalRecommendation?.parentB.id;

  // Filtered horses for roster list
  const filteredHorses = useMemo(() => {
    if (!searchQuery.trim()) return horses;
    const q = searchQuery.toLowerCase();
    return horses.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.coatColor?.toLowerCase().includes(q) ||
        h.coatPattern?.toLowerCase().includes(q) ||
        h.notes?.toLowerCase().includes(q)
    );
  }, [horses, searchQuery]);

  const horseMap = useMemo(() => {
    return new Map<string, Horse>(horses.map((h) => [h.id, h]));
  }, [horses]);

  const handleOpenAddModal = () => {
    setEditingHorse(null);
    setIsModalOpen(true);
  };

  const handleEditHorse = (horse: Horse) => {
    setEditingHorse(horse);
    setIsModalOpen(true);
  };

  const handleSaveHorse = (data: Omit<Horse, 'id' | 'createdAt'>) => {
    if (editingHorse) {
      updateHorse(editingHorse.id, data);
    } else {
      addHorse(data);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(horses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `equine_pedigree_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          importHorses(parsed, false);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
            EP
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight">
              Equine Pedigree Engine
            </h1>
            <p className="text-[11px] text-zinc-400 font-mono leading-none">
              Selective Breeding Optimization &amp; Lineage Analytics
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          {/* View Mode Buttons */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 mr-2">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                viewMode === 'split' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                viewMode === 'tree' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export / Import */}
          <button
            type="button"
            onClick={handleExportJson}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Import JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={resetToDefaults}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="Reset to Sample Foundation Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Add Horse Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="ml-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Horse</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Recommendation Spotlight */}
        <section className="p-4 flex-shrink-0 max-w-7xl w-full mx-auto">
          <BestPairSpotlight
            recommendation={optimalRecommendation}
            totalHorsesCount={horses.length}
            onSimulateAndAddFoal={addHorse}
            onSelectHorse={setSelectedHorseId}
          />
        </section>

        {/* Content Views: Split, Tree Only, or Cards Only */}
        <section className="flex-1 min-h-0 px-4 pb-4 max-w-7xl w-full mx-auto flex gap-4">
          {/* Tree View Canvas */}
          {(viewMode === 'split' || viewMode === 'tree') && (
            <div
              className={`h-full rounded-2xl border border-zinc-800 overflow-hidden relative ${
                viewMode === 'split' ? 'w-7/12' : 'w-full'
              }`}
            >
              <div className="absolute top-3 left-3 z-10 font-mono text-[11px] px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-400 backdrop-blur-md">
                Pedigree Tree ({horses.length} nodes)
              </div>
              <PedigreeTree
                horses={horses}
                optimalSireId={optimalSireId}
                optimalDamId={optimalDamId}
                selectedHorseId={selectedHorseId}
                onSelectHorse={setSelectedHorseId}
              />
            </div>
          )}

          {/* Cards / Stable List View */}
          {(viewMode === 'split' || viewMode === 'cards') && (
            <div
              className={`h-full flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden ${
                viewMode === 'split' ? 'w-5/12' : 'w-full'
              }`}
            >
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, coat, notes..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="font-mono text-xs text-zinc-400 px-2">
                  {filteredHorses.length} Horses
                </div>
              </div>

              {/* Scrollable Cards Grid */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filteredHorses.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                    No matching horses found.
                  </div>
                ) : (
                  filteredHorses.map((horse) => (
                    <HorseCard
                      key={horse.id}
                      horse={horse}
                      sire={horse.sireId ? horseMap.get(horse.sireId) : null}
                      dam={horse.damId ? horseMap.get(horse.damId) : null}
                      isSelected={horse.id === selectedHorseId}
                      onSelect={() => setSelectedHorseId(horse.id)}
                      onEdit={() => handleEditHorse(horse)}
                      onDelete={() => deleteHorse(horse.id)}
                      onSelectParent={(parentId) => setSelectedHorseId(parentId)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Horse Modal */}
      <HorseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHorse}
        editingHorse={editingHorse}
        existingHorses={horses}
      />
    </div>
  );
};
