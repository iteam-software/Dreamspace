'use client';

import { useGoals } from '@/lib/contexts';

/**
 * Week Goals Widget
 * Displays and manages goals for the current week
 */
export function WeekGoalsWidget() {
  const { weeklyGoals, toggleWeeklyGoal } = useGoals();

  return (
    <div>
      <h2>This Week's Goals</h2>
      <div>
        {weeklyGoals.length === 0 ? (
          <p>No goals for this week. Add a goal to get started!</p>
        ) : (
          <ul>
            {weeklyGoals.map((goal) => (
              <li key={goal.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => toggleWeeklyGoal(goal.id)}
                  />
                  <span>{goal.title}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button>+ Add Goal</button>
    </div>
  );
}
