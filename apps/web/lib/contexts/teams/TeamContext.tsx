"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useOptimistic,
  useCallback,
  useTransition,
} from "react";
import { List } from "immutable";
import * as TeamsService from "@/services/teams";
import { TeamInfo, Meeting } from "./types";
import { useSession } from "next-auth/react";
import { useErrors } from "../ErrorsContext";

/**
 * Team context state
 */
type TeamContextState = {
  teamInfo: TeamInfo | null;
  meetings: List<Meeting>;
  pending: boolean;
  updateTeamInfo: (updates: Partial<TeamInfo>) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
};

const TeamContext = createContext<TeamContextState | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
  teamData: TeamInfo | null;
  meetingsData: Meeting[];
}

/**
 * Team context provider
 * Manages team collaboration state with immutable data structures
 * Loads data on initialization and saves optimistically via services
 */
export function TeamProvider({
  children,
  teamData,
  meetingsData,
}: TeamProviderProps) {
  const session = useSession();
  const errors = useErrors();
  const [teamState, setTeamState] = useState(teamData);
  const [teamInfo, setTeamInfo] = useOptimistic(teamState);
  const [meetingsState, setMeetingsState] = useState(List(meetingsData));
  const [meetings, setMeetings] = useOptimistic(meetingsState);
  const [pending, startTransition] = useTransition();

  if (!session.data?.user?.id) {
    return null;
  }

  const userId = session.data.user.id;

  /**
   * Update team info with optimistic update and server persistence
   */
  const updateTeamInfoAction = useCallback(
    (updates: Partial<TeamInfo>) => {
      if (!teamInfo) return;

      const next = { ...teamInfo, ...updates };
      setTeamInfo(next);

      startTransition(async () => {
        const result = await TeamsService.updateTeamInfo({
          managerId: userId,
          ...updates,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setTeamState(next);
        }
      });
    },
    [setTeamState, setTeamInfo, teamInfo, userId],
  );

  /**
   * Add a meeting with optimistic update and server persistence
   */
  const addMeeting = useCallback(
    (meeting: Meeting) => {
      const next = meetings.push(meeting);
      setMeetings(next);

      startTransition(async () => {
        const result = await TeamsService.saveMeetingAttendance({
          userId,
          date: meeting.date,
          attendees: meeting.attendees,
          notes: meeting.notes,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setMeetingsState(next);
        }
      });
    },
    [setMeetingsState, setMeetings, meetings, userId],
  );

  /**
   * Update a meeting with optimistic update and server persistence
   */
  const updateMeeting = useCallback(
    (id: string, updates: Partial<Meeting>) => {
      const index = meetings.findIndex((m) => m.id === id);
      if (index === -1) return;

      const next = meetings.update(index, (m) => ({ ...m!, ...updates }));
      setMeetings(next);

      startTransition(async () => {
        const meetingData = next.get(index)!;
        const result = await TeamsService.saveMeetingAttendance({
          userId,
          date: meetingData.date,
          attendees: meetingData.attendees,
          notes: meetingData.notes,
        });
        if (result.failed) {
          errors.dispatch(result.errors._errors.join(","));
        } else {
          setMeetingsState(next);
        }
      });
    },
    [setMeetingsState, setMeetings, meetings, userId],
  );

  return (
    <TeamContext.Provider
      value={{
        teamInfo,
        meetings,
        pending,
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
 */
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }

  return context;
}
