'use client';

import React, { ReactNode } from 'react';
import {
  DreamProvider,
  GoalProvider,
  UserProvider,
  ConnectProvider,
  TeamProvider,
  ScoringProvider,
} from './';

/**
 * Root app providers
 * Wraps all context providers for the application
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DreamProvider>
        <GoalProvider>
          <ConnectProvider>
            <TeamProvider>
              <ScoringProvider>
                {children}
              </ScoringProvider>
            </TeamProvider>
          </ConnectProvider>
        </GoalProvider>
      </DreamProvider>
    </UserProvider>
  );
}
