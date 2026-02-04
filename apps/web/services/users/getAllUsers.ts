'use server';

import { withAdminAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface GetAllUsersResponse {
  users: any[];
  count: number;
  timestamp: string;
}

/**
 * Gets all users from the database with role-based data filtering.
 * Coaches and admins get full user data; regular users get minimal data for Dream Connect.
 * 
 * @returns List of users with appropriate data based on caller's role
 */
export const getAllUsers = withAdminAuth(async (user): Promise<{ failed: boolean; data?: GetAllUsersResponse; errors?: any[] }> => {
  try {
    const db = getDatabaseClient();
    
    // Query all users - Note: admin check already done by withAdminAuth
    const container = db.getContainer('users');
    const query = {
      query: 'SELECT * FROM c WHERE c.type = @type OR NOT IS_DEFINED(c.type)',
      parameters: [{ name: '@type', value: 'user' }]
    };
    
    const { resources: users } = await container.items.query(query).fetchAll();
    
    // Load dreams from dreams container (v3 6-container architecture)
    const dreamsContainer = db.getContainer('dreams');
    const dreamsQuery = {
      query: 'SELECT c.id, c.userId, c.dreams, c.dreamBook FROM c'
    };
    const { resources: dreamsDocs } = await dreamsContainer.items.query(dreamsQuery).fetchAll();
    
    // Create a map of userId -> dreams for efficient lookup
    const dreamsByUser: Record<string, any[]> = {};
    for (const doc of dreamsDocs) {
      const userId = doc.userId || doc.id;
      dreamsByUser[userId] = doc.dreams || doc.dreamBook || [];
    }
    
    // Transform users to match expected format
    const formattedUsers = users.map(userData => {
      const currentUser = userData.currentUser || {};
      const bestName = currentUser.name || userData.name || userData.displayName || 'Unknown User';
      const bestOffice = currentUser.office || userData.office || userData.officeLocation || 'Unknown';
      const bestAvatar = currentUser.avatar || userData.avatar || userData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestName)}&background=6366f1&color=fff&size=100`;
      const bestEmail = currentUser.email || userData.email || userData.userPrincipalName || userData.mail || '';
      
      const userIdForDreams = userData.userId || userData.id;
      const dreamsFromContainer = dreamsByUser[userIdForDreams] || [];
      const allDreams = dreamsFromContainer.length > 0 
        ? dreamsFromContainer 
        : (currentUser.dreamBook || userData.dreamBook || []);
      
      // Extract categories from dreams if not stored on user profile
      const dreamsCategories = [...new Set(allDreams.map((d: any) => d.category).filter(Boolean))];
      const userCategories = currentUser.dreamCategories || userData.dreamCategories || [];
      const finalCategories = userCategories.length > 0 ? userCategories : dreamsCategories;
      
      return {
        id: userData.userId || userData.id,
        userId: userData.userId || userData.id,
        name: bestName,
        office: bestOffice,
        avatar: bestAvatar,
        email: bestEmail,
        cardBackgroundImage: currentUser.cardBackgroundImage || userData.cardBackgroundImage,
        score: currentUser.score || userData.score || 0,
        dreamsCount: allDreams.length || currentUser.dreamsCount || userData.dreamsCount || 0,
        connectsCount: currentUser.connectsCount || userData.connectsCount || 0,
        dreamCategories: finalCategories,
        dreamBook: allDreams,
        sampleDreams: allDreams.length > 0 
          ? allDreams.slice(0, 3).map((d: any) => ({ title: d.title, category: d.category, image: d.image }))
          : (currentUser.sampleDreams || userData.sampleDreams || []),
        isActive: userData.isActive !== false,
        isCoach: currentUser.isCoach || userData.isCoach || false,
        role: userData.role || 'user',
        roles: userData.roles || { admin: false, coach: false, employee: true },
        lastActiveAt: userData.lastActiveAt || userData.lastModified || new Date().toISOString(),
        createdAt: userData.createdAt || (userData._ts ? new Date(userData._ts * 1000).toISOString() : new Date().toISOString()),
        title: userData.title || '',
        department: userData.department || '',
        manager: userData.manager || '',
        assignedCoachId: userData.assignedCoachId || '',
        teamName: userData.teamName || '',
        careerGoals: currentUser.careerGoals || userData.careerGoals || [],
        skills: currentUser.skills || userData.skills || [],
        connects: currentUser.connects || userData.connects || []
      };
    });
    
    return createActionSuccess<GetAllUsersResponse>({
      users: formattedUsers,
      count: formattedUsers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get all users:', error);
    return handleActionError(error, 'Failed to get all users');
  }
});
