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
  role?: "user" | "coach" | "admin";
  isCoach?: boolean;
  score?: number;
  dreamsCount?: number;
  connectsCount?: number;
  dreamCategories?: string[];
};
