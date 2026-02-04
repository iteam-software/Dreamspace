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
    
    // Find the coach's team
    const team = await db.teams.getTeamByManagerId(coachId);
    
    if (!team) {
      throw new Error(`Coach team not found: ${coachId}`);
    }
    
    // Check if user is in the team
    if (!(team as any).teamMembers?.includes(userId)) {
      throw new Error(`User is not assigned to this coach. userId: ${userId}, coachId: ${coachId}, teamName: ${(team as any).teamName}`);
    }
    
    // Remove user from team
    const updatedTeam = {
      ...team,
      teamMembers: ((team as any).teamMembers || []).filter((memberId: string) => memberId !== userId),
      lastModified: new Date().toISOString()
    };
    
    await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
    
    // Update user's assignment info (remove assignment)
    const userDoc = await db.users.getUserProfile(userId);
    
    if (userDoc) {
      const updatedUser = {
        ...userDoc,
        assignedCoachId: null,
        assignedTeamName: null,
        unassignedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      await db.users.updateUserProfile(userId, updatedUser);
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
