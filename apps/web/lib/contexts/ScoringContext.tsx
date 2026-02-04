'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { List, Record } from 'immutable';
import { saveScoring } from '@/services/scoring';

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
  source?: string;
  dreamId?: string;
  weekId?: string;
  connectId?: string;
  createdAt?: string;
};

/**
 * Immutable ScoringEntry record
 */
const ScoringEntryRecord = Record<ScoringEntry>({
  id: '',
  date: '',
  score: 0,
  activity: '',
  points: 0,
  category: '',
  source: '',
  dreamId: '',
  weekId: '',
  connectId: '',
  createdAt: '',
});

/**
 * Scoring context state
 */
type ScoringContextState = {
  scoringHistory: List<Record<ScoringEntry>>;
  allYearsScoring: List<Record<ScoringEntry>>;
  allTimeScore: number;
  isLoading: boolean;
  userId: string | null;
  loadScoringData: (
    userId: string,
    initialHistory?: ScoringEntry[],
    initialAllYears?: ScoringEntry[],
    initialAllTimeScore?: number
  ) => void;
  addScoringEntry: (entry: ScoringEntry) => Promise<void>;
};

const ScoringContext = createContext<ScoringContextState | undefined>(undefined);

/**
 * Scoring context provider
 * Manages scorecard and activity scoring state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function ScoringProvider({ children }: { children: ReactNode }) {
  const [scoringHistory, setScoringHistory] = useState<List<Record<ScoringEntry>>>(List());
  const [allYearsScoring, setAllYearsScoring] = useState<List<Record<ScoringEntry>>>(List());
  const [allTimeScore, setAllTimeScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Load scoring data for a user
   */
  const loadScoringData = (
    userId: string,
    initialHistory?: ScoringEntry[],
    initialAllYears?: ScoringEntry[],
    initialAllTimeScore?: number
  ) => {
    setUserId(userId);
    if (initialHistory) {
      const historyRecords = List(initialHistory.map(e => ScoringEntryRecord(e)));
      setScoringHistory(historyRecords);
    }
    if (initialAllYears) {
      const allYearsRecords = List(initialAllYears.map(e => ScoringEntryRecord(e)));
      setAllYearsScoring(allYearsRecords);
    }
    if (initialAllTimeScore !== undefined) {
      setAllTimeScore(initialAllTimeScore);
    }
  };

  /**
   * Add a scoring entry with optimistic update and server persistence
   */
  const addScoringEntry = async (entry: ScoringEntry) => {
    if (!userId) return;
    
    // Optimistic update
    const entryRecord = ScoringEntryRecord(entry);
    const previousHistory = scoringHistory;
    const previousAllYears = allYearsScoring;
    const previousAllTimeScore = allTimeScore;
    
    setScoringHistory(scoringHistory.unshift(entryRecord));
    setAllYearsScoring(allYearsScoring.unshift(entryRecord));
    setAllTimeScore(allTimeScore + entry.points);
    
    try {
      const year = new Date(entry.date).getFullYear();
      const result = await saveScoring({
        userId,
        year,
        entry: {
          id: entry.id,
          date: entry.date,
          source: entry.source || 'manual',
          dreamId: entry.dreamId,
          weekId: entry.weekId,
          connectId: entry.connectId,
          points: entry.points,
          activity: entry.activity,
          createdAt: entry.createdAt,
        },
      });
      
      if (result.failed) {
        // Rollback on failure
        setScoringHistory(previousHistory);
        setAllYearsScoring(previousAllYears);
        setAllTimeScore(previousAllTimeScore);
        console.error('Failed to save scoring entry:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setScoringHistory(previousHistory);
      setAllYearsScoring(previousAllYears);
      setAllTimeScore(previousAllTimeScore);
      console.error('Error saving scoring entry:', error);
    }
  };

  return (
    <ScoringContext.Provider
      value={{
        scoringHistory,
        allYearsScoring,
        allTimeScore,
        isLoading,
        userId,
        loadScoringData,
        addScoringEntry,
      }}
    >
      {children}
    </ScoringContext.Provider>
  );
}

/**
 * Hook to use scoring context
 * Returns data as plain JavaScript arrays for easier consumption
 */
export function useScoring() {
  const context = useContext(ScoringContext);
  if (context === undefined) {
    throw new Error('useScoring must be used within a ScoringProvider');
  }
  
  // Convert immutable Lists to plain arrays for component consumption
  return {
    ...context,
    scoringHistory: context.scoringHistory.toArray().map(e => e.toObject()),
    allYearsScoring: context.allYearsScoring.toArray().map(e => e.toObject()),
  };
}
