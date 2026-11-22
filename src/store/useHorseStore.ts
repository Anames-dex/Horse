import { useState, useEffect, useCallback } from 'react';
import { Horse } from '../engine/types';

const STORAGE_KEY = 'horse_data_v1';

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
    return [];
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
      id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
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

  const clearAllHorses = useCallback(() => {
    setHorses([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const importHorses = useCallback((imported: Horse[]) => {
    setHorses(imported);
  }, []);

  return {
    horses,
    selectedHorseId,
    setSelectedHorseId,
    addHorse,
    updateHorse,
    deleteHorse,
    clearAllHorses,
    importHorses,
  };
}
