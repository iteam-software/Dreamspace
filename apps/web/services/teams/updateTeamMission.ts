'use server';

import { withCoachAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface UpdateTeamMissionInput {
  managerId: string;
  mission: string;
}

/**
 * Updates a team's mission statement.
 * Only coaches can update their own team mission.
 * 
 * @param input - Contains managerId and mission
 * @returns Updated team data
 */
export const updateTeamMission = withCoachAuth(async (user, input: UpdateTeamMissionInput) => {
  try {
    const { managerId, mission } = input;
    
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
    
    const updatedTeam = {
      ...team,
      mission,
      lastModified: new Date().toISOString()
    };
    
    await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
    
    return createActionSuccess({
      managerId,
      mission,
      teamName: team.teamName,
      lastModified: updatedTeam.lastModified
    });
  } catch (error) {
    console.error('Failed to update team mission:', error);
    return handleActionError(error, 'Failed to update team mission');
  }
});
