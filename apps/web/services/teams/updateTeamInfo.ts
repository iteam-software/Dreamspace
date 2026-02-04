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
    const container = db.getContainer('teams');
    
    // Find the team
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
    
    // Update team with interests, regions, and meeting draft
    const updatedTeam = {
      ...team,
      teamInterests: teamInterests !== undefined ? teamInterests : team.teamInterests,
      teamRegions: teamRegions !== undefined ? teamRegions : team.teamRegions,
      meetingDraft: meetingDraft !== undefined ? meetingDraft : team.meetingDraft,
      lastModified: new Date().toISOString()
    };
    
    await container.item(team.id, team.managerId).replace(updatedTeam);
    
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
