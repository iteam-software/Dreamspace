'use client';

import { useUser } from '@/lib/contexts';

/**
 * Dashboard Header
 * Displays user greeting and quick stats
 */
export function DashboardHeader() {
  const { currentUser } = useUser();

  return (
    <header>
      <h1>Welcome back, {currentUser?.displayName || currentUser?.name || 'Dreamer'}!</h1>
      <p>Track your dreams and achieve your goals</p>
      {currentUser && (
        <div>
          <div>
            <span>Score:</span>
            <strong>{currentUser.score || 0}</strong>
          </div>
          <div>
            <span>Dreams:</span>
            <strong>{currentUser.dreamsCount || 0}</strong>
          </div>
          <div>
            <span>Connections:</span>
            <strong>{currentUser.connectsCount || 0}</strong>
          </div>
        </div>
      )}
    </header>
  );
}
