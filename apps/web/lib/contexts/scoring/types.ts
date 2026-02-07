/**
 * Scoring entry data type
 */
export type ScoringEntry = {
  id: string;
  date: string;
  score: number;
  activity: string;
  points: number;
  category?: string;
  source?: string;
  dreamId?: string;
  weekId?: string;
  connectId?: string;
  createdAt?: string;
};
