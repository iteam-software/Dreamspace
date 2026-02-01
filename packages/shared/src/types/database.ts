/**
 * Base document interface for all Cosmos DB documents
 */
export interface BaseDocument {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * User profile document
 */
export interface UserProfile extends BaseDocument {
  userId: string;
  email?: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  region?: string;
  teamId?: string;
  isCoach?: boolean;
  isActive?: boolean;
  onboardingComplete?: boolean;
  lastLogin?: string;
}

/**
 * Dreams document structure
 */
export interface DreamsDocument extends BaseDocument {
  userId: string;
  dreamBook?: DreamBookEntry[];
  weeklyGoalTemplates?: WeeklyGoalTemplate[];
}

/**
 * Dream book entry
 */
export interface DreamBookEntry {
  id: string;
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  imagePrompt?: string;
  targetDate?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Weekly goal template
 */
export interface WeeklyGoalTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  goalType?: string;
  targetValue?: number;
  unit?: string;
  frequency?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Current week document
 */
export interface CurrentWeekDocument extends BaseDocument {
  userId: string;
  weekStartDate: string;
  weekEndDate?: string;
  goals?: WeekGoal[];
  weekNumber?: number;
  year?: number;
}

/**
 * Week goal instance
 */
export interface WeekGoal {
  id: string;
  templateId?: string;
  title: string;
  description?: string;
  category: string;
  goalType?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  isCompleted?: boolean;
  completedAt?: string;
  notes?: string;
  dailyProgress?: DailyProgress[];
}

/**
 * Daily progress entry
 */
export interface DailyProgress {
  date: string;
  value: number;
  notes?: string;
}

/**
 * Past weeks document
 */
export interface PastWeeksDocument extends BaseDocument {
  userId: string;
  weeks?: PastWeekSummary[];
}

/**
 * Past week summary
 */
export interface PastWeekSummary {
  weekStartDate: string;
  weekEndDate: string;
  weekNumber: number;
  year: number;
  goalsCompleted?: number;
  goalsTotal?: number;
  completionRate?: number;
  archivedAt?: string;
}

/**
 * Connect document
 */
export interface ConnectDocument extends BaseDocument {
  userId: string;
  connectType: string;
  connectDate: string;
  notes?: string;
  recipientUserId?: string;
  recipientName?: string;
  teamId?: string;
}

/**
 * Scoring document
 */
export interface ScoringDocument extends BaseDocument {
  userId: string;
  year: number;
  quarters?: QuarterScore[];
  annualScore?: number;
}

/**
 * Quarter score
 */
export interface QuarterScore {
  quarter: number;
  score?: number;
  notes?: string;
  scoredAt?: string;
}

/**
 * Team document
 */
export interface TeamDocument extends BaseDocument {
  managerId: string;
  teamName?: string;
  teamMission?: string;
  members?: TeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Team member
 */
export interface TeamMember {
  userId: string;
  name?: string;
  email?: string;
  joinedAt?: string;
  role?: string;
}

/**
 * Coaching alert document
 */
export interface CoachingAlertDocument extends BaseDocument {
  managerId: string;
  userId: string;
  userName?: string;
  alertType: string;
  alertMessage: string;
  priority?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  createdAt?: string;
}

/**
 * Meeting attendance document
 */
export interface MeetingAttendanceDocument extends BaseDocument {
  teamId: string;
  meetingDate: string;
  attendees?: string[];
  notes?: string;
  createdAt?: string;
}

/**
 * Prompt document
 */
export interface PromptDocument extends BaseDocument {
  partitionKey: string;
  promptType: string;
  promptText: string;
  version?: number;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
