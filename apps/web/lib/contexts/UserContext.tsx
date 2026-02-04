'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Record } from 'immutable';
import { saveUserData } from '@/services/users';

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
 * Immutable User record
 */
const UserRecord = Record<User>({
  id: '',
  email: '',
  name: '',
  displayName: '',
  office: '',
  avatar: '',
  jobTitle: '',
  department: '',
  role: 'user',
  isCoach: false,
  score: 0,
  dreamsCount: 0,
  connectsCount: 0,
  dreamCategories: [],
});

/**
 * User context state
 */
type UserContextState = {
  currentUser: Record<User> | null;
  isLoading: boolean;
  loadUser: (user: User) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateScore: (score: number) => Promise<void>;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

/**
 * User context provider
 * Manages current user profile state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Record<User> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load user data
   */
  const loadUser = (user: User) => {
    const userRecord = UserRecord(user);
    setCurrentUser(userRecord);
  };

  /**
   * Update user profile with optimistic update and server persistence
   */
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    // Optimistic update
    const previousUser = currentUser;
    const updatedUser = currentUser.merge(updates);
    setCurrentUser(updatedUser);
    
    try {
      const userId = currentUser.get('id');
      const result = await saveUserData({ userId, ...updatedUser.toObject() });
      if (result.failed) {
        // Rollback on failure
        setCurrentUser(previousUser);
        console.error('Failed to update user profile:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setCurrentUser(previousUser);
      console.error('Error updating user profile:', error);
    }
  };

  /**
   * Update score with optimistic update and server persistence
   */
  const updateScore = async (score: number) => {
    if (!currentUser) return;
    
    // Optimistic update
    const previousUser = currentUser;
    const updatedUser = currentUser.set('score', score);
    setCurrentUser(updatedUser);
    
    try {
      const userId = currentUser.get('id');
      const result = await saveUserData({ userId, score });
      if (result.failed) {
        // Rollback on failure
        setCurrentUser(previousUser);
        console.error('Failed to update score:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setCurrentUser(previousUser);
      console.error('Error updating score:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        loadUser,
        updateUserProfile,
        updateScore,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use user context
 * Returns user as plain JavaScript object for easier consumption
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  // Convert immutable Record to plain object for component consumption
  return {
    ...context,
    currentUser: context.currentUser ? context.currentUser.toObject() : null,
  };
}
