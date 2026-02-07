"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { List } from "immutable";
import { Connect } from "./types";

/**
 * Connect context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type ConnectContextState = {
  connects: List<Connect>;
};

const ConnectContext = createContext<ConnectContextState | undefined>(
  undefined,
);

interface ConnectProviderProps {
  children: ReactNode;
  data: Connect[];
}

/**
 * Connect context provider - READ ONLY
 * Provides dream connect/networking data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function ConnectProvider({ children, data }: ConnectProviderProps) {
  return (
    <ConnectContext.Provider
      value={{
        connects: List(data),
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
}

/**
 * Hook to use connect context - READ ONLY
 * For mutations, use server actions from @/services/connects
 */
export function useConnects() {
  const context = useContext(ConnectContext);
  if (context === undefined) {
    throw new Error("useConnects must be used within a ConnectProvider");
  }

  return context;
}
