"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { List } from "immutable";
import { TeamInfo, Meeting } from "./types";

/**
 * Team context state - READ ONLY
 * Mutations should be handled by server actions that trigger revalidation
 */
type TeamContextState = {
  teamInfo: TeamInfo | null;
  meetings: List<Meeting>;
};

const TeamContext = createContext<TeamContextState | undefined>(undefined);

interface TeamProviderProps {
  children: ReactNode;
  teamData: TeamInfo | null;
  meetingsData: Meeting[];
}

/**
 * Team context provider - READ ONLY
 * Provides team collaboration data to components.
 * Mutations are handled via server actions (not context methods).
 * Server actions should use revalidatePath/revalidateTag to refresh this data.
 */
export function TeamProvider({
  children,
  teamData,
  meetingsData,
}: TeamProviderProps) {
  return (
    <TeamContext.Provider
      value={{
        teamInfo: teamData,
        meetings: List(meetingsData),
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook to use team context - READ ONLY
 * For mutations, use server actions from @/services/teams
 */
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }

  return context;
}
