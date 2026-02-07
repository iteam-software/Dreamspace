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
import { useErrors } from "../ErrorsContext";

/**
 * Dream context state
 */
type DreamContextState = {
  dreams: List<Dream>;
  yearVision: string;
  pending: boolean;
  setYearVision: (vision: string) => void;
  add: (dream: Dream) => void;
  update: (id: string, updates: Partial<Dream>) => void;
  $delete: (id: string) => void;
  reorder: (dreams: Dream[]) => void;
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
  const errors = useErrors();
  const [state, setState] = useState(List(data));
  const [dreams, setDreams] = useOptimistic(state);
  const [visionState, setVisionState] = useState("");
  const [vision, setVision] = useOptimistic(visionState);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Update year vision with optimistic update and server persistence
   */
  const setYearVision = (vision: string) => {
    // Optimistic update
    setVision(vision);

    startTransition(async () => {
      const result = await DreamsService.saveYearVision({
        userId,
        yearVision: vision,
      });
      if (result.failed) {
        errors.dispatch(result.errors._errors.join(","));
      } else {
        setVisionState(vision);
      }
    });
  };

  /**
   * Add a dream with optimistic update and server persistence
   */
  const addDream = useCallback(
    (dream: Dream) => {
      // Optimistic update
      const next = dreams.push(dream);
      setDreams(next);

      startTransition(async () => {
        const result = await DreamsService.saveDreams({
          userId,
          dreams: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setDreams, dreams],
  );

  /**
   * Update a dream with optimistic update and server persistence
   */
  const updateDream = useCallback(
    (id: string, updates: Partial<Dream>) => {
      const index = dreams.findIndex((d) => d.id === id);
      if (index === -1) return;

      const next = dreams.update(index, (d) => ({ ...d!, ...updates }));
      setDreams(next);

      startTransition(async () => {
        const result = await DreamsService.saveDreams({
          userId,
          dreams: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setDreams, dreams],
  );

  /**
   * Delete a dream with optimistic update and server persistence
   */
  const deleteDream = useCallback(
    (id: string) => {
      const index = dreams.findIndex((d) => d.id === id);
      if (index === -1) return;

      const next = dreams.delete(index);
      setDreams(next);

      startTransition(async () => {
        const result = await DreamsService.saveDreams({
          userId,
          dreams: next.toArray(),
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setDreams, dreams],
  );

  /**
   * Reorder dreams with optimistic update and server persistence
   */
  const reorderDreams = useCallback(
    (newDreams: Dream[]) => {
      const next = List(newDreams);
      setDreams(next);

      startTransition(async () => {
        const result = await DreamsService.saveDreams({
          userId,
          dreams: newDreams,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setDreams],
  );

  return (
    <DreamContext.Provider
      value={{
        dreams,
        yearVision: vision,
        pending,
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
