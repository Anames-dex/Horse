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
  Sparkles,
  List,
  Download,
  Upload,
  Trash2,
  X,
} from 'lucide-react';

const VALID_COAT_COLORS = new Set([
  'White',
  'Creamy',
  'Chestnut',
  'Brown',
  'Black',
  'Gray',
  'Dark Brown',
]);

const VALID_COAT_PATTERNS = new Set([
  'None',
  'White Stockings',
  'Whitefield',
  'White Dots',
  'Black Dots',
]);

function validateAndSanitizeHorses(raw: unknown): Horse[] {
  if (!Array.isArray(raw)) {
    throw new Error('Imported data must be an array of horses.');
  }

  const validHorses: Horse[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      continue;
    }

    const candidate = item as Record<string, unknown>;

    let id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : '';
    if (!id || seenIds.has(id)) {
      id = 'h-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6);
    }
    seenIds.add(id);

    const rawName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
    const name = rawName.slice(0, 64) || `Imported Horse ${i + 1}`;

    const rawHearts = typeof candidate.hearts === 'number' ? candidate.hearts : parseFloat(String(candidate.hearts));
    const hearts = Number.isFinite(rawHearts) ? Math.max(7.5, Math.min(15.0, Number(rawHearts.toFixed(1)))) : 10.0;

    const rawTime = typeof candidate.time100m === 'number' ? candidate.time100m : parseFloat(String(candidate.time100m));
    const time100m = Number.isFinite(rawTime) && rawTime > 0 ? Math.max(5.0, Math.min(30.0, Number(rawTime.toFixed(2)))) : 9.5;

    const rawJump = typeof candidate.jumpHeight === 'number' ? candidate.jumpHeight : parseFloat(String(candidate.jumpHeight));
    const jumpHeight = Number.isFinite(rawJump) ? Math.max(1.0, Math.min(6.0, Number(rawJump.toFixed(2)))) : 3.0;

    const coatColor = VALID_COAT_COLORS.has(String(candidate.coatColor))
      ? (candidate.coatColor as Horse['coatColor'])
      : 'White';
    const coatPattern = VALID_COAT_PATTERNS.has(String(candidate.coatPattern))
      ? (candidate.coatPattern as Horse['coatPattern'])
      : 'None';

    const sireId = typeof candidate.sireId === 'string' && candidate.sireId.trim() ? candidate.sireId.trim() : null;
    const damId = typeof candidate.damId === 'string' && candidate.damId.trim() ? candidate.damId.trim() : null;

    const rawGen = typeof candidate.generation === 'number' ? candidate.generation : parseInt(String(candidate.generation), 10);
    const generation = Number.isInteger(rawGen) && rawGen >= 0 ? rawGen : 0;

    const notes = typeof candidate.notes === 'string' ? candidate.notes.trim().slice(0, 500) : undefined;
    const createdAt = typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt) ? candidate.createdAt : Date.now();

    validHorses.push({
      id,
      name,
      hearts,
      time100m,
      jumpHeight,
      coatColor,
      coatPattern,
      sireId: sireId === id ? null : sireId,
      damId: damId === id ? null : damId,
      generation,
      notes,
      createdAt,
    });
  }

  return validHorses;
}

export const App: React.FC = () => {
  const {
    horses,
    addHorse,
    updateHorse,
    deleteHorse,
    clearAllHorses,
    importHorses,
  } = useHorseStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [showPairSpotlight, setShowPairSpotlight] = useState(true);
  const [showRosterDrawer, setShowRosterDrawer] = useState(false);

  // Calculate the single optimal breeding pair across all generations
  const optimalRecommendation = useMemo(() => {
    return findSingleOptimalPair(horses);
  }, [horses]);

  const optimalSireId = optimalRecommendation?.parentA.id;
  const optimalDamId = optimalRecommendation?.parentB.id;

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
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `horse_data_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const sanitized = validateAndSanitizeHorses(parsed);
        if (sanitized.length > 0) {
          importHorses(sanitized);
        } else {
          alert('No valid horse records found in file.');
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Minimal Top Header */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            Horse
          </span>
          <span className="text-zinc-500 text-xs font-mono">
            {horses.length} {horses.length === 1 ? 'horse' : 'horses'}
          </span>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-1.5 text-xs">
          {horses.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowPairSpotlight(!showPairSpotlight)}
              className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 border ${
                showPairSpotlight
                  ? 'bg-zinc-800 border-zinc-700 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimal Pair</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRosterDrawer(!showRosterDrawer)}
            className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 border ${
              showRosterDrawer
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={horses.length === 0}
            className="p-1 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label
            className="p-1 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Import JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          {horses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all horses from stable?')) clearAllHorses();
              }}
              className="p-1 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 transition"
              title="Clear All Horses"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="ml-2 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Horse</span>
          </button>
        </div>
      </header>

      {/* Main View: Full-Screen Pedigree Tree */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {/* Floating Optimal Pair Spotlight */}
        {showPairSpotlight && optimalRecommendation && horses.length >= 2 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 pointer-events-auto animate-fade-in">
            <BestPairSpotlight
              recommendation={optimalRecommendation}
              totalHorsesCount={horses.length}
              onSimulateAndAddFoal={addHorse}
            />
          </div>
        )}

        {/* Tree Canvas */}
        <PedigreeTree
          horses={horses}
          optimalSireId={optimalSireId}
          optimalDamId={optimalDamId}
          onEditHorse={handleEditHorse}
          onDeleteHorse={deleteHorse}
          onAddHorse={handleOpenAddModal}
        />

        {/* Slide-out Roster Cards Drawer */}
        {showRosterDrawer && (
          <aside className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-950/95 border-l border-zinc-800 z-30 flex flex-col backdrop-blur-md shadow-2xl">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-semibold text-xs text-zinc-200">
                Stable Roster ({horses.length})
              </span>
              <button
                type="button"
                onClick={() => setShowRosterDrawer(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {horses.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  No horses added yet.
                </div>
              ) : (
                horses.map((horse) => (
                  <HorseCard
                    key={horse.id}
                    horse={horse}
                    sire={horse.sireId ? horseMap.get(horse.sireId) : null}
                    dam={horse.damId ? horseMap.get(horse.damId) : null}
                    onEdit={() => handleEditHorse(horse)}
                    onDelete={() => deleteHorse(horse.id)}
                  />
                ))
              )}
            </div>
          </aside>
        )}
      </main>

      {/* Add / Edit Modal */}
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
