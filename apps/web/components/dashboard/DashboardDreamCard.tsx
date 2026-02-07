'use client';

import { useDreams } from '@/lib/contexts';

/**
 * Dashboard Dream Card
 * Displays dream overview on dashboard
 */
export function DashboardDreamCard() {
  const { dreams } = useDreams();

  return (
    <div>
      <h2>My Dreams</h2>
      <div>
        {dreams.length === 0 ? (
          <p>No dreams yet. Start building your dream book!</p>
        ) : (
          <ul>
            {dreams.map((dream) => (
              <li key={dream.id}>
                <h3>{dream.title}</h3>
                <p>{dream.category}</p>
                <div>
                  <span>Progress: {dream.progress}%</span>
                  <progress value={dream.progress} max={100}></progress>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <a href="/dream-book">View All Dreams →</a>
    </div>
  );
}
