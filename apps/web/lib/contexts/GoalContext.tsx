'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { List, Record } from 'immutable';
import { saveCurrentWeek } from '@/services/weeks';

/**
 * Weekly goal data type
 */
export type WeeklyGoal = {
  id: string;
  title: string;
  dreamId?: string;
  goalId?: string;
  completed: boolean;
  completedAt?: string;
  weekId: string;
  recurrence: 'weekly' | 'once';
  active: boolean;
  weekLog?: Record<string, boolean>;
};

/**
 * Immutable WeeklyGoal record
 */
const WeeklyGoalRecord = Record<WeeklyGoal>({
  id: '',
  title: '',
  dreamId: '',
  goalId: '',
  completed: false,
  completedAt: '',
  weekId: '',
  recurrence: 'weekly',
  active: true,
  weekLog: {},
});

/**
 * Goal context state
 */
type GoalContextState = {
  weeklyGoals: List<Record<WeeklyGoal>>;
  isLoading: boolean;
  userId: string | null;
  currentWeekId: string | null;
  loadWeeklyGoals: (userId: string, weekId: string, initialGoals?: WeeklyGoal[]) => void;
  addWeeklyGoal: (goal: WeeklyGoal) => Promise<void>;
  updateWeeklyGoal: (id: string, updates: Partial<WeeklyGoal>) => Promise<void>;
  deleteWeeklyGoal: (id: string) => Promise<void>;
  toggleWeeklyGoal: (id: string) => Promise<void>;
};

const GoalContext = createContext<GoalContextState | undefined>(undefined);

/**
 * Goal context provider
 * Manages weekly goals state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function GoalProvider({ children }: { children: ReactNode }) {
  const [weeklyGoals, setWeeklyGoals] = useState<List<Record<WeeklyGoal>>>(List());
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

  /**
   * Load weekly goals for a user and week
   */
  const loadWeeklyGoals = (userId: string, weekId: string, initialGoals?: WeeklyGoal[]) => {
    setUserId(userId);
    setCurrentWeekId(weekId);
    if (initialGoals) {
      const goalRecords = List(initialGoals.map(g => WeeklyGoalRecord(g)));
      setWeeklyGoals(goalRecords);
    }
  };

  /**
   * Save goals to server
   */
  const saveGoals = async (goals: List<Record<WeeklyGoal>>) => {
    if (!userId || !currentWeekId) return;
    
    const goalsArray = goals.toArray().map(g => g.toObject());
    const result = await saveCurrentWeek({ userId, weekId: currentWeekId, goals: goalsArray });
    
    if (result.failed) {
      console.error('Failed to save weekly goals:', result.errors);
      return false;
    }
    return true;
  };

  /**
   * Add a weekly goal with optimistic update and server persistence
   */
  const addWeeklyGoal = async (goal: WeeklyGoal) => {
    if (!userId || !currentWeekId) return;
    
    // Optimistic update
    const goalRecord = WeeklyGoalRecord(goal);
    const previousGoals = weeklyGoals;
    setWeeklyGoals(weeklyGoals.push(goalRecord));
    
    try {
      const success = await saveGoals(weeklyGoals.push(goalRecord));
      if (!success) {
        // Rollback on failure
        setWeeklyGoals(previousGoals);
      }
    } catch (error) {
      // Rollback on error
      setWeeklyGoals(previousGoals);
      console.error('Error saving weekly goal:', error);
    }
  };

  /**
   * Update a weekly goal with optimistic update and server persistence
   */
  const updateWeeklyGoal = async (id: string, updates: Partial<WeeklyGoal>) => {
    if (!userId || !currentWeekId) return;
    
    // Optimistic update
    const previousGoals = weeklyGoals;
    const index = weeklyGoals.findIndex(g => g.get('id') === id);
    if (index === -1) return;
    
    const updatedGoal = weeklyGoals.get(index)!.merge(updates);
    setWeeklyGoals(weeklyGoals.set(index, updatedGoal));
    
    try {
      const success = await saveGoals(weeklyGoals.set(index, updatedGoal));
      if (!success) {
        // Rollback on failure
        setWeeklyGoals(previousGoals);
      }
    } catch (error) {
      // Rollback on error
      setWeeklyGoals(previousGoals);
      console.error('Error updating weekly goal:', error);
    }
  };

  /**
   * Delete a weekly goal with optimistic update and server persistence
   */
  const deleteWeeklyGoal = async (id: string) => {
    if (!userId || !currentWeekId) return;
    
    // Optimistic update
    const previousGoals = weeklyGoals;
    const index = weeklyGoals.findIndex(g => g.get('id') === id);
    if (index === -1) return;
    
    setWeeklyGoals(weeklyGoals.delete(index));
    
    try {
      const success = await saveGoals(weeklyGoals.delete(index));
      if (!success) {
        // Rollback on failure
        setWeeklyGoals(previousGoals);
      }
    } catch (error) {
      // Rollback on error
      setWeeklyGoals(previousGoals);
      console.error('Error deleting weekly goal:', error);
    }
  };

  /**
   * Toggle a weekly goal completion with optimistic update and server persistence
   */
  const toggleWeeklyGoal = async (id: string) => {
    if (!userId || !currentWeekId) return;
    
    // Optimistic update
    const previousGoals = weeklyGoals;
    const index = weeklyGoals.findIndex(g => g.get('id') === id);
    if (index === -1) return;
    
    const currentGoal = weeklyGoals.get(index)!;
    const updatedGoal = currentGoal.merge({
      completed: !currentGoal.get('completed'),
      completedAt: !currentGoal.get('completed') ? new Date().toISOString() : undefined,
    });
    setWeeklyGoals(weeklyGoals.set(index, updatedGoal));
    
    try {
      const success = await saveGoals(weeklyGoals.set(index, updatedGoal));
      if (!success) {
        // Rollback on failure
        setWeeklyGoals(previousGoals);
      }
    } catch (error) {
      // Rollback on error
      setWeeklyGoals(previousGoals);
      console.error('Error toggling weekly goal:', error);
    }
  };

  return (
    <GoalContext.Provider
      value={{
        weeklyGoals,
        isLoading,
        userId,
        currentWeekId,
        loadWeeklyGoals,
        addWeeklyGoal,
        updateWeeklyGoal,
        deleteWeeklyGoal,
        toggleWeeklyGoal,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

/**
 * Hook to use goal context
 * Returns goals as plain JavaScript array for easier consumption
 */
export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  
  // Convert immutable List to plain array for component consumption
  return {
    ...context,
    weeklyGoals: context.weeklyGoals.toArray().map(g => g.toObject()),
  };
}
