/**
 * Team member data type
 */
export type TeamMember = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  dreamsCompleted?: number;
  meetingAttendance?: number;
};

/**
 * Meeting data type
 */
export type Meeting = {
  id: string;
  date: string;
  attendees: string[];
  notes?: string;
  teamId?: string;
};

/**
 * Team info data type
 */
export type TeamInfo = {
  id: string;
  name: string;
  mission?: string;
  coachId?: string;
  members?: TeamMember[];
};
