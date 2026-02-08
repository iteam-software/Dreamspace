"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { List } from "immutable";
import { ScoringEntry } from "./types";

/**
 * Scoring context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type ScoringContextState = {
  entries: List<ScoringEntry>;
  allTimeScore: number;
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
 * Scoring context provider - READ ONLY
 * Provides scorecard and activity scoring data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function ScoringProvider({
  children,
  data,
  allTimeScore,
}: ScoringProviderProps) {
  return (
    <ScoringContext.Provider
      value={{
        entries: List(data),
        allTimeScore,
      }}
    >
      {children}
    </ScoringContext.Provider>
  );
}

/**
 * Hook to use scoring context - READ ONLY
 * For mutations, use server actions from @/services/scoring
 */
export function useScoring() {
  const context = useContext(ScoringContext);
  if (context === undefined) {
    throw new Error("useScoring must be used within a ScoringProvider");
  }

  return context;
}
