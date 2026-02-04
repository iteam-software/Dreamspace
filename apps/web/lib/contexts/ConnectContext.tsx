'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { List, Record } from 'immutable';
import { saveConnect, deleteConnect } from '@/services/connects';

/**
 * Connect data type
 */
export type Connect = {
  id: string;
  userId: string;
  dreamId?: string;
  withWhom: string;
  withWhomId: string;
  when?: string;
  notes?: string;
  status?: 'pending' | 'completed';
  agenda?: string;
  proposedWeeks?: string[];
  schedulingMethod?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Immutable Connect record
 */
const ConnectRecord = Record<Connect>({
  id: '',
  userId: '',
  dreamId: '',
  withWhom: '',
  withWhomId: '',
  when: '',
  notes: '',
  status: 'pending',
  agenda: '',
  proposedWeeks: [],
  schedulingMethod: '',
  createdAt: '',
  updatedAt: '',
});

/**
 * Connect context state
 */
type ConnectContextState = {
  connects: List<Record<Connect>>;
  isLoading: boolean;
  userId: string | null;
  loadConnects: (userId: string, initialConnects?: Connect[]) => void;
  addConnect: (connect: Connect) => Promise<void>;
  updateConnect: (id: string, updates: Partial<Connect>) => Promise<void>;
  deleteConnect: (id: string) => Promise<void>;
};

const ConnectContext = createContext<ConnectContextState | undefined>(undefined);

/**
 * Connect context provider
 * Manages dream connect/networking state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function ConnectProvider({ children }: { children: ReactNode }) {
  const [connects, setConnects] = useState<List<Record<Connect>>>(List());
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Load connects for a user
   */
  const loadConnects = (userId: string, initialConnects?: Connect[]) => {
    setUserId(userId);
    if (initialConnects) {
      const connectRecords = List(initialConnects.map(c => ConnectRecord(c)));
      setConnects(connectRecords);
    }
  };

  /**
   * Add a connect with optimistic update and server persistence
   */
  const addConnect = async (connect: Connect) => {
    if (!userId) return;
    
    // Optimistic update
    const connectRecord = ConnectRecord(connect);
    const previousConnects = connects;
    setConnects(connects.push(connectRecord));
    
    try {
      const result = await saveConnect({ userId, connectData: connect });
      if (result.failed) {
        // Rollback on failure
        setConnects(previousConnects);
        console.error('Failed to save connect:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setConnects(previousConnects);
      console.error('Error saving connect:', error);
    }
  };

  /**
   * Update a connect with optimistic update and server persistence
   */
  const updateConnect = async (id: string, updates: Partial<Connect>) => {
    if (!userId) return;
    
    // Optimistic update
    const previousConnects = connects;
    const index = connects.findIndex(c => c.get('id') === id);
    if (index === -1) return;
    
    const updatedConnect = connects.get(index)!.merge(updates);
    setConnects(connects.set(index, updatedConnect));
    
    try {
      const connectData = updatedConnect.toObject();
      const result = await saveConnect({ userId, connectData });
      if (result.failed) {
        // Rollback on failure
        setConnects(previousConnects);
        console.error('Failed to update connect:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setConnects(previousConnects);
      console.error('Error updating connect:', error);
    }
  };

  /**
   * Delete a connect with optimistic update and server persistence
   */
  const deleteConnectAction = async (id: string) => {
    if (!userId) return;
    
    // Optimistic update
    const previousConnects = connects;
    const index = connects.findIndex(c => c.get('id') === id);
    if (index === -1) return;
    
    setConnects(connects.delete(index));
    
    try {
      const result = await deleteConnect({ userId, connectId: id });
      if (result.failed) {
        // Rollback on failure
        setConnects(previousConnects);
        console.error('Failed to delete connect:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setConnects(previousConnects);
      console.error('Error deleting connect:', error);
    }
  };

  return (
    <ConnectContext.Provider
      value={{
        connects,
        isLoading,
        userId,
        loadConnects,
        addConnect,
        updateConnect,
        deleteConnect: deleteConnectAction,
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
}

/**
 * Hook to use connect context
 * Returns connects as plain JavaScript array for easier consumption
 */
export function useConnects() {
  const context = useContext(ConnectContext);
  if (context === undefined) {
    throw new Error('useConnects must be used within a ConnectProvider');
  }
  
  // Convert immutable List to plain array for component consumption
  return {
    ...context,
    connects: context.connects.toArray().map(c => c.toObject()),
  };
}
