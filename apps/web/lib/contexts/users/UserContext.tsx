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
import * as UsersService from "@/services/users";
import { User } from "./types";
import { useSession } from "next-auth/react";
import { useErrors } from "../ErrorsContext";

/**
 * User context state
 */
type UserContextState = {
  user: User | null;
  pending: boolean;
  update: (updates: Partial<User>) => void;
  updateScore: (score: number) => void;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  data: User | null;
}

/**
 * User context provider
 * Manages current user profile state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function UserProvider({ children, data }: UserProviderProps) {
  const session = useSession();
  const errors = useErrors();
  const [state, setState] = useState(data);
  const [user, setUser] = useOptimistic(state);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Update user profile with optimistic update and server persistence
   */
  const updateUser = useCallback(
    (updates: Partial<User>) => {
      if (!user) return;

      const next = { ...user, ...updates };
      setUser(next);

      startTransition(async () => {
        const result = await UsersService.saveUserData({
          userId,
          ...next,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setUser, user, userId],
  );

  /**
   * Update score with optimistic update and server persistence
   */
  const updateScore = useCallback(
    (score: number) => {
      if (!user) return;

      const next = { ...user, score };
      setUser(next);

      startTransition(async () => {
        const result = await UsersService.saveUserData({
          userId,
          score,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setState(next);
        }
      });
    },
    [setState, setUser, user, userId],
  );

  return (
    <UserContext.Provider
      value={{
        user,
        pending,
        update: updateUser,
        updateScore,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use user context
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
