'use server';

import { withAdminAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface AssignUserToCoachInput {
  userId: string;
  coachId: string;
}

/**
 * Assigns a user to a coach's team.
 * 
 * @param input - userId and coachId
 * @returns Success response with assignment details
 */
export const assignUserToCoach = withAdminAuth(async (user, input: AssignUserToCoachInput) => {
  try {
    const { userId, coachId } = input;
    
    if (!userId || !coachId) {
      throw new Error('User ID and coach ID are required');
    }
    
    const db = getDatabaseClient();
    const usersContainer = db.getContainer('users');
    const teamsContainer = db.getContainer('teams');
    
    // Verify user exists
    const userQuery = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId.toString() }]
    };
    
    const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
    
    if (users.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }
    
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
    
    // Check if user is already in the team
    if (team.teamMembers?.includes(userId)) {
      throw new Error(`User is already assigned to this coach. userId: ${userId}, coachId: ${coachId}, teamName: ${team.teamName}`);
    }
    
    // Add user to team
    const updatedTeam = {
      ...team,
      teamMembers: [...(team.teamMembers || []), userId],
      lastModified: new Date().toISOString()
    };
    
    await teamsContainer.item(team.id, team.managerId).replace(updatedTeam);
    
    // Update user's assignment info
    const userDoc = users[0];
    const updatedUser = {
      ...userDoc,
      assignedCoachId: coachId,
      assignedTeamName: team.teamName,
      assignedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    await usersContainer.item(userDoc.id, userDoc.userId).replace(updatedUser);
    
    return createActionSuccess({
      message: 'User successfully assigned to coach',
      userId,
      coachId,
      teamName: team.teamName,
      assignedAt: updatedUser.assignedAt,
      newTeamSize: updatedTeam.teamMembers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to assign user to coach:', error);
    return handleActionError(error, 'Failed to assign user to coach');
  }
});
