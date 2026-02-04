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
    
    // Verify user exists
    const userDoc = await db.users.getUserProfile(userId);
    
    if (!userDoc) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Find the coach's team
    const team = await db.teams.getTeamByManagerId(coachId);
    
    if (!team) {
      throw new Error(`Coach team not found: ${coachId}`);
    }
    
    // Check if user is already in the team
    if ((team as any).teamMembers?.includes(userId)) {
      throw new Error(`User is already assigned to this coach. userId: ${userId}, coachId: ${coachId}, teamName: ${(team as any).teamName}`);
    }
    
    // Add user to team
    const updatedTeam = {
      ...team,
      teamMembers: [...((team as any).teamMembers || []), userId],
      lastModified: new Date().toISOString()
    };
    
    await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
    
    // Update user's assignment info
    const updatedUser = {
      ...userDoc,
      assignedCoachId: coachId,
      assignedTeamName: team.teamName,
      assignedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    await db.users.updateUserProfile(userId, updatedUser);
    
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
