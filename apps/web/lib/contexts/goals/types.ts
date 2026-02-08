/**
 * Weekly goal data type
 */
export type WeeklyGoal = {
  id: string;
  title: string;
  dreamId?: string;
  goalId?: string;
  completed: boolean;
  completedAt?: string;
  weekId: string;
  recurrence: "weekly" | "once";
  active: boolean;
  weekLog?: Record<string, boolean>;
};
