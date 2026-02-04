'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Scoring entry data type
 */
export type ScoringEntry = {
  id: string;
  date: string;
  score: number;
  activity: string;
  points: number;
  category?: string;
};

/**
 * Scoring context state
 */
type ScoringContextState = {
  scoringHistory: ScoringEntry[];
  allYearsScoring: ScoringEntry[];
  allTimeScore: number;
  isLoading: boolean;
  setScoringHistory: (history: ScoringEntry[]) => void;
  setAllYearsScoring: (scoring: ScoringEntry[]) => void;
  setAllTimeScore: (score: number) => void;
  addScoringEntry: (entry: ScoringEntry) => void;
  setLoading: (loading: boolean) => void;
};

const ScoringContext = createContext<ScoringContextState | undefined>(undefined);

/**
 * Scoring context provider
 * Manages scorecard and activity scoring state
 */
export function ScoringProvider({ children }: { children: ReactNode }) {
  const [scoringHistory, setScoringHistory] = useState<ScoringEntry[]>([]);
  const [allYearsScoring, setAllYearsScoring] = useState<ScoringEntry[]>([]);
  const [allTimeScore, setAllTimeScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addScoringEntry = (entry: ScoringEntry) => {
    setScoringHistory((prev) => [entry, ...prev]);
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <ScoringContext.Provider
      value={{
        scoringHistory,
        allYearsScoring,
        allTimeScore,
        isLoading,
        setScoringHistory,
        setAllYearsScoring,
        setAllTimeScore,
        addScoringEntry,
        setLoading,
      }}
    >
      {children}
    </ScoringContext.Provider>
  );
}

/**
 * Hook to use scoring context
 */
export function useScoring() {
  const context = useContext(ScoringContext);
  if (context === undefined) {
    throw new Error('useScoring must be used within a ScoringProvider');
  }
  return context;
}
