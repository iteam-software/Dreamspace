'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets the current week document for a user.
 * 
 * @param userId - User ID
 * @returns Current week document or null if not found
 */
export const getCurrentWeek = withAuth(async (user, userId: string) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own current week
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const currentWeekDoc = await db.weeks.getCurrentWeek(userId);
    
    if (!currentWeekDoc) {
      return createActionSuccess({
        data: null,
        message: 'No current week document found. Create one with saveCurrentWeek.'
      });
    }
    
    return createActionSuccess({
      data: currentWeekDoc
    });
  } catch (error) {
    console.error('Failed to get current week:', error);
    return handleActionError(error, 'Failed to get current week');
  }
});
