/**
 * Dream data type
 */
export type Dream = {
  id: string;
  title: string;
  category: string;
  description?: string;
  progress: number;
  image?: string;
  goals?: Goal[];
  notes?: Note[];
  coachNotes?: CoachNote[];
  history?: HistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
};

export type Goal = {
  id: string;
  dreamId: string;
  title: string;
  description?: string;
  type: "consistency" | "deadline";
  recurrence?: "weekly" | "once";
  targetWeeks?: number;
  targetDate?: string;
  startDate?: string;
  weekId?: string;
  active: boolean;
  completed: boolean;
  completedAt?: string;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

export type CoachNote = {
  id: string;
  text: string;
  sender: string;
  createdAt: string;
};

export type HistoryEntry = {
  id: string;
  action: string;
  details: string;
  timestamp: string;
};
