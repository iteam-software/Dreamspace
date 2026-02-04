'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
 * Goal context state
 */
type GoalContextState = {
  weeklyGoals: WeeklyGoal[];
  isLoading: boolean;
  setWeeklyGoals: (goals: WeeklyGoal[]) => void;
  addWeeklyGoal: (goal: WeeklyGoal) => void;
  updateWeeklyGoal: (id: string, updates: Partial<WeeklyGoal>) => void;
  deleteWeeklyGoal: (id: string) => void;
  toggleWeeklyGoal: (id: string) => void;
  setLoading: (loading: boolean) => void;
};

const GoalContext = createContext<GoalContextState | undefined>(undefined);

/**
 * Goal context provider
 * Manages weekly goals state
 */
export function GoalProvider({ children }: { children: ReactNode }) {
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addWeeklyGoal = (goal: WeeklyGoal) => {
    setWeeklyGoals((prev) => [...prev, goal]);
  };

  const updateWeeklyGoal = (id: string, updates: Partial<WeeklyGoal>) => {
    setWeeklyGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    );
  };

  const deleteWeeklyGoal = (id: string) => {
    setWeeklyGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const toggleWeeklyGoal = (id: string) => {
    setWeeklyGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              completed: !goal.completed,
              completedAt: !goal.completed ? new Date().toISOString() : undefined,
            }
          : goal
      )
    );
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <GoalContext.Provider
      value={{
        weeklyGoals,
        isLoading,
        setWeeklyGoals,
        addWeeklyGoal,
        updateWeeklyGoal,
        deleteWeeklyGoal,
        toggleWeeklyGoal,
        setLoading,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

/**
 * Hook to use goal context
 */
export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoals must be used within a GoalProvider');
  }
  return context;
}
