import { useState, useEffect, useCallback } from 'react';
import { Horse } from '../engine/types';

const STORAGE_KEY = 'equine_pedigree_horses_v1';

const INITIAL_HORSES: Horse[] = [
  {
    id: 'f-sire-1',
    name: 'Boreas',
    hearts: 14.0,
    time100m: 7.45, // 13.42 b/s
    jumpHeight: 2.75,
    coatColor: 'White',
    coatPattern: 'None',
    generation: 0,
    notes: 'Wild capture in mountain plains. Exceptional sprint velocity.',
    createdAt: 1700000001000,
  },
  {
    id: 'f-dam-1',
    name: 'Aethelgard',
    hearts: 12.0,
    time100m: 10.5, // 9.52 b/s
    jumpHeight: 4.85, // Exceptional jumper
    coatColor: 'Chestnut',
    coatPattern: 'White Stockings',
    generation: 0,
    notes: 'Wild capture in savanna plateau. Maximum hurdle clearance.',
    createdAt: 1700000002000,
  },
  {
    id: 'f-sire-2',
    name: 'Titan',
    hearts: 15.0, // 30 HP Maximum
    time100m: 11.2, // 8.93 b/s
    jumpHeight: 2.2,
    coatColor: 'Dark Brown',
    coatPattern: 'Black Dots',
    generation: 0,
    notes: 'Wild capture. Maximum heart capacity foundation stock.',
    createdAt: 1700000003000,
  },
  {
    id: 'gen1-valkyrie',
    name: 'Valkyrie',
    hearts: 13.5,
    time100m: 8.1, // 12.35 b/s
    jumpHeight: 4.25,
    coatColor: 'White',
    coatPattern: 'White Stockings',
    sireId: 'f-sire-1',
    damId: 'f-dam-1',
    generation: 1,
    notes: 'First generation hybrid combining Boreas speed and Aethelgard jump.',
    createdAt: 1700000004000,
  },
  {
    id: 'gen2-sleipnir',
    name: 'Sleipnir',
    hearts: 14.0,
    time100m: 7.2, // 13.89 b/s
    jumpHeight: 4.6,
    coatColor: 'Gray',
    coatPattern: 'Whitefield',
    sireId: 'f-sire-1', // Backcrossed with Boreas
    damId: 'gen1-valkyrie',
    generation: 2,
    notes: 'Generation 2 backcross (Valkyrie × Boreas). Elite mobility candidate.',
    createdAt: 1700000005000,
  },
];

export function useHorseStore() {
  const [horses, setHorses] = useState<Horse[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_HORSES;
  });

  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(horses));
    } catch {
      // Storage unavailable
    }
  }, [horses]);

  const addHorse = useCallback((data: Omit<Horse, 'id' | 'createdAt'>) => {
    const newHorse: Horse = {
      ...data,
      id: 'horse-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };
    setHorses((prev) => [newHorse, ...prev]);
    return newHorse;
  }, []);

  const updateHorse = useCallback((id: string, updates: Partial<Horse>) => {
    setHorses((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  }, []);

  const deleteHorse = useCallback((id: string) => {
    setHorses((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    setHorses(INITIAL_HORSES);
  }, []);

  const importHorses = useCallback((imported: Horse[], merge = false) => {
    if (merge) {
      setHorses((prev) => {
        const existingIds = new Set(prev.map((h) => h.id));
        const filtered = imported.filter((h) => !existingIds.has(h.id));
        return [...prev, ...filtered];
      });
    } else {
      setHorses(imported);
    }
  }, []);

  return {
    horses,
    selectedHorseId,
    setSelectedHorseId,
    addHorse,
    updateHorse,
    deleteHorse,
    resetToDefaults,
    importHorses,
  };
}
