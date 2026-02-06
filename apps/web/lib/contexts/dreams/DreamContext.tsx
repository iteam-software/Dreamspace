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
import * as DreamsService from "@/services/dreams";
import { Dream } from "./types";
import { useSession } from "next-auth/react";

/**
 * Dream context state
 */
type DreamContextState = {
  dreams: List<Dream>;
  yearVision: string;
  pending: boolean;
  setYearVision: (vision: string) => Promise<void>;
  add: (dream: Dream) => Promise<void>;
  update: (id: string, updates: Partial<Dream>) => Promise<void>;
  $delete: (id: string) => Promise<void>;
  reorder: (dreams: Dream[]) => Promise<void>;
};

const DreamContext = createContext<DreamContextState | undefined>(undefined);

interface DreamsProviderProps {
  children: ReactNode;
  data: Dream[];
}

/**
 * Dream context provider
 * Manages dream book state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function DreamProvider({ children, data }: DreamsProviderProps) {
  const session = useSession();
  const [state, setState] = useState(List(data));
  const [dreams, setDreams] = useOptimistic(state);
  const [yearVision, setYearVisionState] = useState("");
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Update year vision with optimistic update and server persistence
   */
  const setYearVision = async (vision: string) => {
    // Optimistic update
    const previousVision = yearVision;
    setYearVisionState(vision);

    try {
      const result = await DreamsService.saveYearVision({
        userId,
        yearVision: vision,
      });
      if (result.failed) {
        // Rollback on failure
        setYearVisionState(previousVision);
        console.error("Failed to save year vision:", result.errors);
      }
    } catch (error) {
      // Rollback on error
      setYearVisionState(previousVision);
      console.error("Error saving year vision:", error);
    }
  };

  /**
   * Add a dream with optimistic update and server persistence
   */
  const add = useCallback(
    async (dream: Dream) => {
      // Optimistic update
      const next = dreams.push(dream);
      setDreams(next);

      try {
        startTransition(async () => {
          const result = await DreamsService.saveDreams({
            userId,
            dreams: next.toArray().map((d) => d),
          });
          if (result.failed) {
            console.error("Failed to save dream:", result.errors);
          } else {
            setState(next);
          }
        });
      } catch (error) {
        console.error("Unexpected error saving dream:", error);
      }
    },
    [setState, setDreams, dreams],
  );

  /**
   * Update a dream with optimistic update and server persistence
   */
  const updateDream = async (id: string, updates: Partial<Dream>) => {
    // Optimistic update
    const index = dreams.findIndex((d) => d.id === id);
    if (index === -1) return;

    // const updatedDream = dreams.get(index)!.merge(updates);
    const next = dreams.update(index, (d) => ({ ...d!, ...updates }));

    setDreams(next);

    try {
      const result = await DreamsService.saveDreams({
        userId,
        dreams: next.toArray(),
      });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error("Failed to update dream:", result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error("Error updating dream:", error);
    }
  };

  /**
   * Delete a dream with optimistic update and server persistence
   */
  const deleteDream = async (id: string) => {
    if (!userId) return;

    // Optimistic update
    const previousDreams = dreams;
    const index = dreams.findIndex((d) => d.get("id") === id);
    if (index === -1) return;

    setDreams(dreams.delete(index));

    try {
      const dreamsArray = dreams
        .delete(index)
        .toArray()
        .map((d) => d.toObject());
      const result = await DreamsService.saveDreams({
        userId,
        dreams: dreamsArray,
      });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error("Failed to delete dream:", result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error("Error deleting dream:", error);
    }
  };

  /**
   * Reorder dreams with optimistic update and server persistence
   */
  const reorderDreams = async (newDreams: Dream[]) => {
    if (!userId) return;

    // Optimistic update
    const previousDreams = dreams;
    const dreamRecords = List(newDreams.map((d) => DreamRecord(d)));
    setDreams(dreamRecords);

    try {
      const result = await DreamsService.saveDreams({
        userId,
        dreams: newDreams,
      });
      if (result.failed) {
        // Rollback on failure
        setDreams(previousDreams);
        console.error("Failed to reorder dreams:", result.errors);
      }
    } catch (error) {
      // Rollback on error
      setDreams(previousDreams);
      console.error("Error reordering dreams:", error);
    }
  };

  return (
    <DreamContext.Provider
      value={{
        dreams,
        yearVision,
        pending,
        userId,
        loadDreams,
        setYearVision,
        add: addDream,
        update: updateDream,
        $delete: deleteDream,
        reorder: reorderDreams,
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
    throw new Error("useDreams must be used within a DreamProvider");
  }

  return context;
}
