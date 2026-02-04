'use server';

import { withAdminAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface UnassignUserFromTeamInput {
  userId: string;
  coachId: string;
}

/**
 * Unassigns a user from a coach's team.
 * 
 * @param input - userId and coachId
 * @returns Success response with unassignment details
 */
export const unassignUserFromTeam = withAdminAuth(async (user, input: UnassignUserFromTeamInput) => {
  try {
    const { userId, coachId } = input;
    
    if (!userId || !coachId) {
      throw new Error('User ID and coach ID are required');
    }
    
    const db = getDatabaseClient();
    const usersContainer = db.getContainer('users');
    const teamsContainer = db.getContainer('teams');
    
    // Find the coach's team
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: coachId }
      ]
    };
    
    const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
    
    if (teams.length === 0) {
      throw new Error(`Coach team not found: ${coachId}`);
    }
    
    const team = teams[0];
    
    // Check if user is in the team
    if (!team.teamMembers?.includes(userId)) {
      throw new Error(`User is not assigned to this coach. userId: ${userId}, coachId: ${coachId}, teamName: ${team.teamName}`);
    }
    
    // Remove user from team
    const updatedTeam = {
      ...team,
      teamMembers: team.teamMembers.filter((memberId: string) => memberId !== userId),
      lastModified: new Date().toISOString()
    };
    
    await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);
    
    // Update user's assignment info (remove assignment)
    const userQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }]
    };
    
    const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
    
    if (users.length > 0) {
      const userDoc = users[0];
      const updatedUser = {
        ...userDoc,
        assignedCoachId: null,
        assignedTeamName: null,
        unassignedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      await usersContainer.item(userDoc.id, userDoc.userId).replace(updatedUser);
    }
    
    return createActionSuccess({
      message: 'User successfully unassigned from coach',
      userId,
      coachId,
      teamName: team.teamName,
      unassignedAt: new Date().toISOString(),
      newTeamSize: updatedTeam.teamMembers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to unassign user from team:', error);
    return handleActionError(error, 'Failed to unassign user from team');
  }
});
