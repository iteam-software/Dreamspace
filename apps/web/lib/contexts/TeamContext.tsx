'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
 * Team context state
 */
type TeamContextState = {
  teamInfo: TeamInfo | null;
  meetings: Meeting[];
  isLoading: boolean;
  setTeamInfo: (info: TeamInfo | null) => void;
  updateTeamInfo: (updates: Partial<TeamInfo>) => void;
  setMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  setLoading: (loading: boolean) => void;
};

const TeamContext = createContext<TeamContextState | undefined>(undefined);

/**
 * Team context provider
 * Manages team collaboration state
 */
export function TeamProvider({ children }: { children: ReactNode }) {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateTeamInfo = (updates: Partial<TeamInfo>) => {
    if (teamInfo) {
      setTeamInfo({ ...teamInfo, ...updates });
    }
  };

  const addMeeting = (meeting: Meeting) => {
    setMeetings((prev) => [...prev, meeting]);
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) =>
      prev.map((meeting) =>
        meeting.id === id ? { ...meeting, ...updates } : meeting
      )
    );
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <TeamContext.Provider
      value={{
        teamInfo,
        meetings,
        isLoading,
        setTeamInfo,
        updateTeamInfo,
        setMeetings,
        addMeeting,
        updateMeeting,
        setLoading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook to use team context
 */
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
