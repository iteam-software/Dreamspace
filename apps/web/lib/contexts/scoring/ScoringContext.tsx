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
import * as ScoringService from "@/services/scoring";
import { ScoringEntry } from "./types";
import { useSession } from "next-auth/react";
import { useErrors } from "../ErrorsContext";

/**
 * Scoring context state
 */
type ScoringContextState = {
  entries: List<ScoringEntry>;
  allTimeScore: number;
  pending: boolean;
  add: (entry: ScoringEntry) => void;
};

const ScoringContext = createContext<ScoringContextState | undefined>(
  undefined,
);

interface ScoringProviderProps {
  children: ReactNode;
  data: ScoringEntry[];
  allTimeScore: number;
}

/**
 * Scoring context provider
 * Manages scorecard and activity scoring state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function ScoringProvider({
  children,
  data,
  allTimeScore: initialScore,
}: ScoringProviderProps) {
  const session = useSession();
  const errors = useErrors();
  const [state, setState] = useState(List(data));
  const [entries, setEntries] = useOptimistic(state);
  const [scoreState, setScoreState] = useState(initialScore);
  const [allTimeScore, setAllTimeScore] = useOptimistic(scoreState);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Add a scoring entry with optimistic update and server persistence
   */
  const addEntry = useCallback(
    (entry: ScoringEntry) => {
      const next = entries.unshift(entry);
      const nextScore = allTimeScore + entry.points;
      setEntries(next);
      setAllTimeScore(nextScore);

      startTransition(async () => {
        const year = new Date(entry.date).getFullYear();
        const result = await ScoringService.saveScoring({
          userId,
          year,
          entry: {
            id: entry.id,
            date: entry.date,
            source: entry.source || "manual",
            dreamId: entry.dreamId,
            weekId: entry.weekId,
            connectId: entry.connectId,
            points: entry.points,
            activity: entry.activity,
            createdAt: entry.createdAt,
          },
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
          setScoreState(nextScore);
        }
      });
    },
    [setState, setEntries, entries, allTimeScore, setAllTimeScore, userId],
  );

  return (
    <ScoringContext.Provider
      value={{
        entries,
        allTimeScore,
        pending,
        add: addEntry,
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
    throw new Error("useScoring must be used within a ScoringProvider");
  }

  return context;
}
