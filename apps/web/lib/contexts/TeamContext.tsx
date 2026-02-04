'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { List, Record } from 'immutable';
import { updateTeamInfo, saveMeetingAttendance } from '@/services/teams';

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

/**
 * Immutable records
 */
const TeamInfoRecord = Record<TeamInfo>({
  id: '',
  name: '',
  mission: '',
  coachId: '',
  members: [],
});

const MeetingRecord = Record<Meeting>({
  id: '',
  date: '',
  attendees: [],
  notes: '',
  teamId: '',
});

/**
 * Team context state
 */
type TeamContextState = {
  teamInfo: Record<TeamInfo> | null;
  meetings: List<Record<Meeting>>;
  isLoading: boolean;
  userId: string | null;
  loadTeamData: (userId: string, teamInfo?: TeamInfo, meetings?: Meeting[]) => void;
  updateTeamInfo: (updates: Partial<TeamInfo>) => Promise<void>;
  addMeeting: (meeting: Meeting) => Promise<void>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
};

const TeamContext = createContext<TeamContextState | undefined>(undefined);

/**
 * Team context provider
 * Manages team collaboration state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function TeamProvider({ children }: { children: ReactNode }) {
  const [teamInfo, setTeamInfo] = useState<Record<TeamInfo> | null>(null);
  const [meetings, setMeetings] = useState<List<Record<Meeting>>>(List());
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Load team data for a user
   */
  const loadTeamData = (userId: string, initialTeamInfo?: TeamInfo, initialMeetings?: Meeting[]) => {
    setUserId(userId);
    if (initialTeamInfo) {
      setTeamInfo(TeamInfoRecord(initialTeamInfo));
    }
    if (initialMeetings) {
      const meetingRecords = List(initialMeetings.map(m => MeetingRecord(m)));
      setMeetings(meetingRecords);
    }
  };

  /**
   * Update team info with optimistic update and server persistence
   */
  const updateTeamInfoAction = async (updates: Partial<TeamInfo>) => {
    if (!teamInfo || !userId) return;
    
    // Optimistic update
    const previousTeamInfo = teamInfo;
    const updatedTeamInfo = teamInfo.merge(updates);
    setTeamInfo(updatedTeamInfo);
    
    try {
      const result = await updateTeamInfo({
        managerId: userId,
        ...updates,
      });
      if (result.failed) {
        // Rollback on failure
        setTeamInfo(previousTeamInfo);
        console.error('Failed to update team info:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setTeamInfo(previousTeamInfo);
      console.error('Error updating team info:', error);
    }
  };

  /**
   * Add a meeting with optimistic update and server persistence
   */
  const addMeeting = async (meeting: Meeting) => {
    if (!userId) return;
    
    // Optimistic update
    const meetingRecord = MeetingRecord(meeting);
    const previousMeetings = meetings;
    setMeetings(meetings.push(meetingRecord));
    
    try {
      const result = await saveMeetingAttendance({
        userId,
        date: meeting.date,
        attendees: meeting.attendees,
        notes: meeting.notes,
      });
      if (result.failed) {
        // Rollback on failure
        setMeetings(previousMeetings);
        console.error('Failed to save meeting:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setMeetings(previousMeetings);
      console.error('Error saving meeting:', error);
    }
  };

  /**
   * Update a meeting with optimistic update and server persistence
   */
  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    if (!userId) return;
    
    // Optimistic update
    const previousMeetings = meetings;
    const index = meetings.findIndex(m => m.get('id') === id);
    if (index === -1) return;
    
    const updatedMeeting = meetings.get(index)!.merge(updates);
    setMeetings(meetings.set(index, updatedMeeting));
    
    try {
      const meetingData = updatedMeeting.toObject();
      const result = await saveMeetingAttendance({
        userId,
        date: meetingData.date,
        attendees: meetingData.attendees,
        notes: meetingData.notes,
      });
      if (result.failed) {
        // Rollback on failure
        setMeetings(previousMeetings);
        console.error('Failed to update meeting:', result.errors);
      }
    } catch (error) {
      // Rollback on error
      setMeetings(previousMeetings);
      console.error('Error updating meeting:', error);
    }
  };

  return (
    <TeamContext.Provider
      value={{
        teamInfo,
        meetings,
        isLoading,
        userId,
        loadTeamData,
        updateTeamInfo: updateTeamInfoAction,
        addMeeting,
        updateMeeting,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook to use team context
 * Returns data as plain JavaScript objects for easier consumption
 */
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  
  // Convert immutable data to plain objects for component consumption
  return {
    ...context,
    teamInfo: context.teamInfo ? context.teamInfo.toObject() : null,
    meetings: context.meetings.toArray().map(m => m.toObject()),
  };
}
