'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets the past weeks document for a user.
 * 
 * @param userId - User ID
 * @returns Past weeks document with history
 */
export const getPastWeeks = withAuth(async (user, userId: string) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own past weeks
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const pastWeeksDoc = await db.weeks.getPastWeeks(userId);
    
    if (!pastWeeksDoc) {
      return createActionSuccess({
        data: null,
        message: 'No past weeks found'
      });
    }
    
    return createActionSuccess({
      data: pastWeeksDoc
    });
  } catch (error) {
    console.error('Failed to get past weeks:', error);
    return handleActionError(error, 'Failed to get past weeks');
  }
});
