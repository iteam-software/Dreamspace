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
import * as ConnectsService from "@/services/connects";
import { Connect } from "./types";
import { useSession } from "next-auth/react";
import { useErrors } from "../ErrorsContext";

/**
 * Connect context state
 */
type ConnectContextState = {
  connects: List<Connect>;
  pending: boolean;
  add: (connect: Connect) => void;
  update: (id: string, updates: Partial<Connect>) => void;
  $delete: (id: string) => void;
};

const ConnectContext = createContext<ConnectContextState | undefined>(
  undefined,
);

interface ConnectProviderProps {
  children: ReactNode;
  data: Connect[];
}

/**
 * Connect context provider
 * Manages dream connect/networking state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function ConnectProvider({ children, data }: ConnectProviderProps) {
  const session = useSession();
  const errors = useErrors();
  const [state, setState] = useState(List(data));
  const [connects, setConnects] = useOptimistic(state);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Add a connect with optimistic update and server persistence
   */
  const addConnect = useCallback(
    (connect: Connect) => {
      const next = connects.push(connect);
      setConnects(next);

      startTransition(async () => {
        const result = await ConnectsService.saveConnect({
          userId,
          connectData: connect,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setConnects, connects, userId],
  );

  /**
   * Update a connect with optimistic update and server persistence
   */
  const updateConnect = useCallback(
    (id: string, updates: Partial<Connect>) => {
      const index = connects.findIndex((c) => c.id === id);
      if (index === -1) return;

      const next = connects.update(index, (c) => ({ ...c!, ...updates }));
      setConnects(next);

      startTransition(async () => {
        const connectData = next.get(index)!;
        const result = await ConnectsService.saveConnect({
          userId,
          connectData,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setConnects, connects, userId],
  );

  /**
   * Delete a connect with optimistic update and server persistence
   */
  const deleteConnect = useCallback(
    (id: string) => {
      const index = connects.findIndex((c) => c.id === id);
      if (index === -1) return;

      const next = connects.delete(index);
      setConnects(next);

      startTransition(async () => {
        const result = await ConnectsService.deleteConnect({
          userId,
          connectId: id,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setConnects, connects, userId],
  );

  return (
    <ConnectContext.Provider
      value={{
        connects,
        pending,
        add: addConnect,
        update: updateConnect,
        $delete: deleteConnect,
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
}

/**
 * Hook to use connect context
 */
export function useConnects() {
  const context = useContext(ConnectContext);
  if (context === undefined) {
    throw new Error("useConnects must be used within a ConnectProvider");
  }

  return context;
}
