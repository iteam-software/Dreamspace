'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets team metrics for a coach's team.
 * Includes team members, dreams, connects, and engagement stats.
 * 
 * @param managerId - Coach's user ID
 * @returns Team metrics including members and statistics
 */
export const getTeamMetrics = withAuth(async (user, managerId: string) => {
  try {
    if (!managerId) {
      throw new Error('Manager ID is required');
    }
    
    const db = getDatabaseClient();
    const teamsContainer = db.getContainer('teams');
    const usersContainer = db.getContainer('users');
    
    // Find team for this manager
    const teamQuery = {
      query: 'SELECT * FROM c WHERE c.type = @type AND c.managerId = @managerId',
      parameters: [
        { name: '@type', value: 'team_relationship' },
        { name: '@managerId', value: managerId }
      ]
    };
    
    const { resources: teams } = await teamsContainer.items.query(teamQuery).fetchAll();
    
    if (teams.length === 0) {
      throw new Error(`No team found for manager: ${managerId}`);
    }
    
    const team = teams[0];
    const memberIds = team.teamMembers || [];
    const allMemberIds = [managerId, ...memberIds.filter((id: string) => id !== managerId)];
    
    // Get team members' data
    const teamMembers: any[] = [];
    if (allMemberIds.length > 0) {
      const usersQuery = {
        query: `SELECT * FROM c WHERE c.userId IN (${allMemberIds.map((_, i) => `@userId${i}`).join(', ')})`,
        parameters: allMemberIds.map((id: string, i: number) => ({ name: `@userId${i}`, value: id.toString() }))
      };
      
      const { resources: users } = await usersContainer.items.query(usersQuery).fetchAll();
      
      users.forEach((userData: any) => {
        const currentUser = userData.currentUser || {};
        const userId = userData.userId || userData.id;
        
        teamMembers.push({
          id: userId,
          userId,
          name: currentUser.name || userData.name || userData.displayName || 'Unknown User',
          email: currentUser.email || userData.email || '',
          office: currentUser.office || userData.office || 'Unknown',
          avatar: currentUser.avatar || userData.avatar || '',
          cardBackgroundImage: currentUser.cardBackgroundImage || userData.cardBackgroundImage,
          score: currentUser.score || userData.score || 0,
          dreamsCount: currentUser.dreamsCount || userData.dreamsCount || 0,
          connectsCount: currentUser.connectsCount || userData.connectsCount || 0,
          isCoach: userId === managerId
        });
      });
    }
    
    // Calculate metrics
    const totalDreams = teamMembers.reduce((sum, member) => sum + (member.dreamsCount || 0), 0);
    const totalConnects = teamMembers.reduce((sum, member) => sum + (member.connectsCount || 0), 0);
    const totalScore = teamMembers.reduce((sum, member) => sum + (member.score || 0), 0);
    const averageScore = teamMembers.length > 0 ? Math.round(totalScore / teamMembers.length) : 0;
    const activeMembersCount = teamMembers.filter(member => member.score > 0).length;
    const engagementRate = teamMembers.length > 0 ? Math.round((activeMembersCount / teamMembers.length) * 100) : 0;
    
    return createActionSuccess({
      metrics: {
        teamSize: teamMembers.length,
        totalDreams,
        totalConnects,
        averageScore,
        engagementRate,
        activeMembersCount,
        teamMembers,
        teamName: team.teamName,
        mission: team.mission || null,
        nextMeeting: team.nextMeeting || null,
        managerId: team.managerId,
        teamId: team.teamId || team.managerId,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to get team metrics:', error);
    return handleActionError(error, 'Failed to get team metrics');
  }
});
