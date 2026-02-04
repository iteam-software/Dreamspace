'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets all connects for a user.
 * 
 * @param userId - User ID
 * @returns Array of connects for the user
 */
export const getConnects = withAuth(async (user, userId: string) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own connects
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const connects = await db.connects.getConnectsByUser(userId);
    
    return createActionSuccess(connects || []);
  } catch (error) {
    console.error('Failed to get connects:', error);
    return handleActionError(error, 'Failed to get connects');
  }
});
