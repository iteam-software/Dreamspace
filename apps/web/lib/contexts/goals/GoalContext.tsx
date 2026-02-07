"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useOptimistic,
  useCallback,
  useTransition,
} from "react";
import { List } from "immutable";
import * as WeeksService from "@/services/weeks";
import { WeeklyGoal } from "./types";
import { useSession } from "next-auth/react";
import { useErrors } from "../ErrorsContext";

/**
 * Goal context state
 */
type GoalContextState = {
  goals: List<WeeklyGoal>;
  pending: boolean;
  add: (goal: WeeklyGoal) => void;
  update: (id: string, updates: Partial<WeeklyGoal>) => void;
  $delete: (id: string) => void;
  toggle: (id: string) => void;
};

const GoalContext = createContext<GoalContextState | undefined>(undefined);

interface GoalProviderProps {
  children: ReactNode;
  data: WeeklyGoal[];
  weekId: string;
}

/**
 * Goal context provider
 * Manages weekly goals state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function GoalProvider({ children, data, weekId }: GoalProviderProps) {
  const session = useSession();
  const errors = useErrors();
  const [state, setState] = useState(List(data));
  const [goals, setGoals] = useOptimistic(state);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Add a weekly goal with optimistic update and server persistence
   */
  const addGoal = useCallback(
    (goal: WeeklyGoal) => {
      const next = goals.push(goal);
      setGoals(next);

      startTransition(async () => {
        const result = await WeeksService.saveCurrentWeek({
          userId,
          weekId,
          goals: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setGoals, goals, weekId, userId],
  );

  /**
   * Update a weekly goal with optimistic update and server persistence
   */
  const updateGoal = useCallback(
    (id: string, updates: Partial<WeeklyGoal>) => {
      const index = goals.findIndex((g) => g.id === id);
      if (index === -1) return;

      const next = goals.update(index, (g) => ({ ...g!, ...updates }));
      setGoals(next);

      startTransition(async () => {
        const result = await WeeksService.saveCurrentWeek({
          userId,
          weekId,
          goals: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setGoals, goals, weekId, userId],
  );

  /**
   * Delete a weekly goal with optimistic update and server persistence
   */
  const deleteGoal = useCallback(
    (id: string) => {
      const index = goals.findIndex((g) => g.id === id);
      if (index === -1) return;

      const next = goals.delete(index);
      setGoals(next);

      startTransition(async () => {
        const result = await WeeksService.saveCurrentWeek({
          userId,
          weekId,
          goals: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setGoals, goals, weekId, userId],
  );

  /**
   * Toggle a weekly goal completion with optimistic update and server persistence
   */
  const toggleGoal = useCallback(
    (id: string) => {
      const index = goals.findIndex((g) => g.id === id);
      if (index === -1) return;

      const next = goals.update(index, (g) => ({
        ...g!,
        completed: !g!.completed,
        completedAt: !g!.completed ? new Date().toISOString() : undefined,
      }));
      setGoals(next);

      startTransition(async () => {
        const result = await WeeksService.saveCurrentWeek({
          userId,
          weekId,
          goals: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setGoals, goals, weekId, userId],
  );

  return (
    <GoalContext.Provider
      value={{
        goals,
        pending,
        add: addGoal,
        update: updateGoal,
        $delete: deleteGoal,
        toggle: toggleGoal,
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
    throw new Error("useGoals must be used within a GoalProvider");
  }

  return context;
}
