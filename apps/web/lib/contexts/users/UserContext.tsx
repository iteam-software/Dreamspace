"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { User } from "./types";

/**
 * User context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type UserContextState = {
  user: User | null;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  data: User | null;
}

/**
 * User context provider - READ ONLY
 * Provides current user profile data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function UserProvider({ children, data }: UserProviderProps) {
  return (
    <UserContext.Provider
      value={{
        user: data,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use user context - READ ONLY
 * For mutations, use server actions from @/services/users
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
