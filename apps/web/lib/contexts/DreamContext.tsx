'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { List, Record } from 'immutable';
import { saveDreams, saveYearVision } from '@/services/dreams';

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
 * Immutable Dream record
 */
const DreamRecord = Record<Dream>({
  id: '',
  title: '',
  category: '',
  description: '',
  progress: 0,
  image: '',
  goals: [],
  notes: [],
  coachNotes: [],
  history: [],
  createdAt: '',
  updatedAt: '',
});

/**
 * Dream context state
 */
type DreamContextState = {
  dreams: List<Record<Dream>>;
  yearVision: string;
  isLoading: boolean;
  userId: string | null;
  loadDreams: (userId: string, initialDreams?: Dream[], initialVision?: string) => void;
  setYearVision: (vision: string) => Promise<void>;
  addDream: (dream: Dream) => Promise<void>;
  updateDream: (id: string, updates: Partial<Dream>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  reorderDreams: (dreams: Dream[]) => Promise<void>;
};

const DreamContext = createContext<DreamContextState | undefined>(undefined);

/**
 * Dream context provider
 * Manages dream book state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function DreamProvider({ children }: { children: ReactNode }) {
  const [dreams, setDreams] = useState<List<Record<Dream>>>(List());
  const [yearVision, setYearVisionState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Load dreams data for a user
   */
  const loadDreams = (userId: string, initialDreams?: Dream[], initialVision?: string) => {
    setUserId(userId);
    if (initialDreams) {
      const dreamRecords = List(initialDreams.map(d => DreamRecord(d)));
      setDreams(dreamRecords);
    }
    if (initialVision !== undefined) {
      setYearVisionState(initialVision);
    }
  };

  /**
   * Update year vision with optimistic update and server persistence
   */
  const setYearVision = async (vision: string) => {
    if (!userId) return;
    
    // Optimistic update
    const previousVision = yearVision;
    setYearVisionState(vision);
    
    try {
      const result = await saveYearVision({ userId, yearVision: vision });
      if (result.failed) {
        // Rollback on failure
        setYearVisionState(previousVision);
        console.error('Failed to save year vision:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setYearVisionState(previousVision);
      console.error('Error saving year vision:', error);
    }
  };

  /**
   * Add a dream with optimistic update and server persistence
   */
  const addDream = async (dream: Dream) => {
    if (!userId) return;
    
    // Optimistic update
    const dreamRecord = DreamRecord(dream);
    const previousDreams = dreams;
    setDreams(dreams.push(dreamRecord));
    
    try {
      const dreamsArray = dreams.push(dreamRecord).toArray().map(d => d.toObject());
      const result = await saveDreams({ userId, dreams: dreamsArray });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error('Failed to save dream:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error('Error saving dream:', error);
    }
  };

  /**
   * Update a dream with optimistic update and server persistence
   */
  const updateDream = async (id: string, updates: Partial<Dream>) => {
    if (!userId) return;
    
    // Optimistic update
    const previousDreams = dreams;
    const index = dreams.findIndex(d => d.get('id') === id);
    if (index === -1) return;
    
    const updatedDream = dreams.get(index)!.merge(updates);
    setDreams(dreams.set(index, updatedDream));
    
    try {
      const dreamsArray = dreams.set(index, updatedDream).toArray().map(d => d.toObject());
      const result = await saveDreams({ userId, dreams: dreamsArray });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error('Failed to update dream:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error('Error updating dream:', error);
    }
  };

  /**
   * Delete a dream with optimistic update and server persistence
   */
  const deleteDream = async (id: string) => {
    if (!userId) return;
    
    // Optimistic update
    const previousDreams = dreams;
    const index = dreams.findIndex(d => d.get('id') === id);
    if (index === -1) return;
    
    setDreams(dreams.delete(index));
    
    try {
      const dreamsArray = dreams.delete(index).toArray().map(d => d.toObject());
      const result = await saveDreams({ userId, dreams: dreamsArray });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error('Failed to delete dream:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error('Error deleting dream:', error);
    }
  };

  /**
   * Reorder dreams with optimistic update and server persistence
   */
  const reorderDreams = async (newDreams: Dream[]) => {
    if (!userId) return;
    
    // Optimistic update
    const previousDreams = dreams;
    const dreamRecords = List(newDreams.map(d => DreamRecord(d)));
    setDreams(dreamRecords);
    
    try {
      const result = await saveDreams({ userId, dreams: newDreams });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error('Failed to reorder dreams:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error('Error reordering dreams:', error);
    }
  };

  return (
    <DreamContext.Provider
      value={{
        dreams,
        yearVision,
        isLoading,
        userId,
        loadDreams,
        setYearVision,
        addDream,
        updateDream,
        deleteDream,
        reorderDreams,
      }}
    >
      {children}
    </DreamContext.Provider>
  );
}

/**
 * Hook to use dream context
 * Returns dreams as plain JavaScript array for easier consumption
 */
export function useDreams() {
  const context = useContext(DreamContext);
  if (context === undefined) {
    throw new Error('useDreams must be used within a DreamProvider');
  }
  
  // Convert immutable List to plain array for component consumption
  return {
    ...context,
    dreams: context.dreams.toArray().map(d => d.toObject()),
  };
}
