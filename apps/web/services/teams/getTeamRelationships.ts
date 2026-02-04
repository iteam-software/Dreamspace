'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets all team relationships from the database.
 * 
 * @returns Array of team relationships
 */
export const getTeamRelationships = withAuth(async (user) => {
  try {
    const db = getDatabaseClient();
    const container = db.getContainer('teams');
    
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type',
      parameters: [{ name: '@type', value: 'team_relationship' }]
    };
    
    const { resources: teams } = await container.items.query(query).fetchAll();
    
    const formattedTeams = teams.map((team: any) => ({
      id: team.id,
      teamId: team.teamId || team.id,
      managerId: team.managerId,
      teamMembers: team.teamMembers || [],
      teamName: team.teamName,
      managerRole: team.managerRole || 'Dream Coach',
      createdAt: team.createdAt || team._ts ? new Date(team._ts * 1000).toISOString() : new Date().toISOString(),
      lastModified: team.lastModified || new Date().toISOString(),
      isActive: team.isActive !== false
    }));
    
    return createActionSuccess({
      teams: formattedTeams,
      count: formattedTeams.length
    });
  } catch (error) {
    console.error('Failed to get team relationships:', error);
    return handleActionError(error, 'Failed to get team relationships');
  }
});
