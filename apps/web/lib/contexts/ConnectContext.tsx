'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Connect data type
 */
export type Connect = {
  id: string;
  userId: string;
  dreamId?: string;
  withWhom: string;
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
 * Connect context state
 */
type ConnectContextState = {
  connects: Connect[];
  isLoading: boolean;
  setConnects: (connects: Connect[]) => void;
  addConnect: (connect: Connect) => void;
  updateConnect: (id: string, updates: Partial<Connect>) => void;
  deleteConnect: (id: string) => void;
  setLoading: (loading: boolean) => void;
};

const ConnectContext = createContext<ConnectContextState | undefined>(undefined);

/**
 * Connect context provider
 * Manages dream connect/networking state
 */
export function ConnectProvider({ children }: { children: ReactNode }) {
  const [connects, setConnects] = useState<Connect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addConnect = (connect: Connect) => {
    setConnects((prev) => [...prev, connect]);
  };

  const updateConnect = (id: string, updates: Partial<Connect>) => {
    setConnects((prev) =>
      prev.map((connect) =>
        connect.id === id ? { ...connect, ...updates } : connect
      )
    );
  };

  const deleteConnect = (id: string) => {
    setConnects((prev) => prev.filter((connect) => connect.id !== id));
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <ConnectContext.Provider
      value={{
        connects,
        isLoading,
        setConnects,
        addConnect,
        updateConnect,
        deleteConnect,
        setLoading,
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
    throw new Error('useConnects must be used within a ConnectProvider');
  }
  return context;
}
