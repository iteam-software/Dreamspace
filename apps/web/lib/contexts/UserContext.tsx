'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * User data type
 */
export type User = {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  office?: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  role?: 'user' | 'coach' | 'admin';
  isCoach?: boolean;
  score?: number;
  dreamsCount?: number;
  connectsCount?: number;
  dreamCategories?: string[];
};

/**
 * User context state
 */
type UserContextState = {
  currentUser: User | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  updateScore: (score: number) => void;
  setLoading: (loading: boolean) => void;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

/**
 * User context provider
 * Manages current user profile state
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateUserProfile = (updates: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const updateScore = (score: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, score });
    }
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        setCurrentUser,
        updateUserProfile,
        updateScore,
        setLoading,
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
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
