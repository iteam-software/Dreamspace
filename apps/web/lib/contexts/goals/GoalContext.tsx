"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { List } from "immutable";
import { WeeklyGoal } from "./types";

/**
 * Goal context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type GoalContextState = {
  goals: List<WeeklyGoal>;
  weekId: string;
};

const GoalContext = createContext<GoalContextState | undefined>(undefined);

interface GoalProviderProps {
  children: ReactNode;
  data: WeeklyGoal[];
  weekId: string;
}

/**
 * Goal context provider - READ ONLY
 * Provides weekly goals data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function GoalProvider({ children, data, weekId }: GoalProviderProps) {
  return (
    <GoalContext.Provider
      value={{
        goals: List(data),
        weekId,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
}

/**
 * Hook to use goal context - READ ONLY
 * For mutations, use server actions from @/services/weeks
 */
export function useGoals() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalProvider");
  }

  return context;
}
