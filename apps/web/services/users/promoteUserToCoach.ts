'use server';

import { withAdminAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';
import { generateTeamId } from '@/lib/utils/idGenerator';
import { generateRandomTeamName } from '@/lib/utils/teamNameGenerator';

interface PromoteUserToCoachInput {
  userId: string;
  teamName?: string;
}

/**
 * Promotes a user to coach and creates their team.
 * 
 * @param input - userId and optional teamName
 * @returns Success response with promotion details
 */
export const promoteUserToCoach = withAdminAuth(async (user, input: PromoteUserToCoachInput) => {
  try {
    const { userId, teamName: providedTeamName } = input;
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Generate team name if not provided
    const teamName = providedTeamName || generateRandomTeamName();
    
    const db = getDatabaseClient();
    
    // Check if user exists
    const userDoc = await db.users.getUserProfile(userId);
    
    if (!userDoc) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Update user role to coach
    const updatedUser = {
      ...userDoc,
      role: 'coach',
      isCoach: true,
      lastModified: new Date().toISOString(),
      promotedAt: new Date().toISOString()
    };
    
    await db.users.updateUserProfile(userId, updatedUser);
    
    // Create new team relationship with stable teamId
    const teamId = generateTeamId();
    const teamRelationship = {
      id: teamId,
      teamId: teamId,
      type: 'team_relationship',
      managerId: userId,
      teamMembers: [],
      teamName: teamName,
      managerRole: 'Dream Coach',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      createdBy: 'system',
    };
    
    const createdTeam = await db.teams.createTeam(teamRelationship);
    
    return createActionSuccess({
      message: 'User successfully promoted to coach',
      userId,
      teamName,
      teamId,
      promotedAt: teamRelationship.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to promote user to coach:', error);
    return handleActionError(error, 'Failed to promote user to coach');
  }
});
