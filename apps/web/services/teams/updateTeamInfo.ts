'use server';

import { withCoachAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface UpdateTeamInfoInput {
  managerId: string;
  teamInterests?: any;
  teamRegions?: any;
  meetingDraft?: any;
}

/**
 * Updates team information (interests, regions, meeting draft).
 * Only coaches can update their own team info.
 * 
 * @param input - Contains managerId and optional update fields
 * @returns Updated team data
 */
export const updateTeamInfo = withCoachAuth(async (user, input: UpdateTeamInfoInput) => {
  try {
    const { managerId, teamInterests, teamRegions, meetingDraft } = input;
    
    if (!managerId) {
      throw new Error('Manager ID is required');
    }
    
    // Verify the authenticated coach is modifying their own team
    if (user.id !== managerId) {
      throw new Error('You can only modify your own team');
    }
    
    const db = getDatabaseClient();
    
    const team = await db.teams.getTeamByManagerId(managerId);
    
    if (!team) {
      throw new Error(`No team found for manager: ${managerId}`);
    }
    
    // Update team with interests, regions, and meeting draft
    const updatedTeam = {
      ...team,
      teamInterests: teamInterests !== undefined ? teamInterests : team.teamInterests,
      teamRegions: teamRegions !== undefined ? teamRegions : team.teamRegions,
      meetingDraft: meetingDraft !== undefined ? meetingDraft : team.meetingDraft,
      lastModified: new Date().toISOString()
    };
    
    await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
    
    return createActionSuccess({
      managerId,
      teamInterests: updatedTeam.teamInterests,
      teamRegions: updatedTeam.teamRegions,
      meetingDraft: updatedTeam.meetingDraft,
      teamName: updatedTeam.teamName,
      lastModified: updatedTeam.lastModified
    });
  } catch (error) {
    console.error('Failed to update team info:', error);
    return handleActionError(error, 'Failed to update team info');
  }
});
