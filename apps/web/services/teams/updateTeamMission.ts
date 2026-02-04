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
    const container = db.getContainer('teams');
    
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId }
      ]
    };
    
    const { resources: teams } = await container.items.query(teamQuery).fetchAll();
    
    if (teams.length === 0) {
      throw new Error(`No team found for manager: ${managerId}`);
    }
    
    const team = teams[0];
    const updatedTeam = {
      ...team,
      mission,
      lastModified: new Date().toISOString()
    };
    
    await container.item(team.id, team.managerId).replace(updatedTeam);
    
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
