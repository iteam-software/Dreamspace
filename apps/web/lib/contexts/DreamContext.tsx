'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Dream data type
 */
export type Dream = {
  id: string;
  title: string;
  category: string;
  description?: string;
  progress: number;
  image?: string;
  goals?: Goal[];
  notes?: Note[];
  coachNotes?: CoachNote[];
  history?: HistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
};

export type Goal = {
  id: string;
  dreamId: string;
  title: string;
  description?: string;
  type: 'consistency' | 'deadline';
  recurrence?: 'weekly' | 'once';
  targetWeeks?: number;
  targetDate?: string;
  startDate?: string;
  weekId?: string;
  active: boolean;
  completed: boolean;
  completedAt?: string;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

export type CoachNote = {
  id: string;
  text: string;
  sender: string;
  createdAt: string;
};

export type HistoryEntry = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
};

/**
 * Dream context state
 */
type DreamContextState = {
  dreams: Dream[];
  yearVision: string;
  isLoading: boolean;
  setDreams: (dreams: Dream[]) => void;
  setYearVision: (vision: string) => void;
  addDream: (dream: Dream) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  reorderDreams: (dreams: Dream[]) => void;
  setLoading: (loading: boolean) => void;
};

const DreamContext = createContext<DreamContextState | undefined>(undefined);

/**
 * Dream context provider
 * Manages dream book state (dreams, year vision)
 */
export function DreamProvider({ children }: { children: ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [yearVision, setYearVision] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const addDream = (dream: Dream) => {
    setDreams((prev) => [...prev, dream]);
  };

  const updateDream = (id: string, updates: Partial<Dream>) => {
    setDreams((prev) =>
      prev.map((dream) => (dream.id === id ? { ...dream, ...updates } : dream))
    );
  };

  const deleteDream = (id: string) => {
    setDreams((prev) => prev.filter((dream) => dream.id !== id));
  };

  const reorderDreams = (newDreams: Dream[]) => {
    setDreams(newDreams);
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <DreamContext.Provider
      value={{
        dreams,
        yearVision,
        isLoading,
        setDreams,
        setYearVision,
        addDream,
        updateDream,
        deleteDream,
        reorderDreams,
        setLoading,
      }}
    >
      {children}
    </DreamContext.Provider>
  );
}

/**
 * Hook to use dream context
 */
export function useDreams() {
  const context = useContext(DreamContext);
  if (context === undefined) {
    throw new Error('useDreams must be used within a DreamProvider');
  }
  return context;
}
