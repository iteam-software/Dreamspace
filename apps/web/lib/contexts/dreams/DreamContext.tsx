"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { List } from "immutable";
import { Dream } from "./types";

/**
 * Dream context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type DreamContextState = {
  dreams: List<Dream>;
  yearVision: string;
};

const DreamContext = createContext<DreamContextState | undefined>(undefined);

interface DreamsProviderProps {
  children: ReactNode;
  data: Dream[];
  yearVision?: string;
}

/**
 * Dream context provider - READ ONLY
 * Provides dream book data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function DreamProvider({
  children,
  data,
  yearVision = "",
}: DreamsProviderProps) {
  return (
    <DreamContext.Provider
      value={{
        dreams: List(data),
        yearVision,
      }}
    >
      {children}
    </DreamContext.Provider>
  );
}

/**
 * Hook to use dream context - READ ONLY
 * For mutations, use server actions from @/services/dreams
 */
export function useDreams() {
  const context = useContext(DreamContext);
  if (context === undefined) {
    throw new Error("useDreams must be used within a DreamProvider");
  }

  return context;
}
