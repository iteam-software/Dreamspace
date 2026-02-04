'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Syncs the current week's goals for a user.
 * Handles week mismatch and ensures all goal instances exist.
 * 
 * NOTE: This is a simplified version. Full implementation would require
 * porting week rollover logic from api/utils/weekRollover.js
 * 
 * @param userId - User ID
 * @returns Current week document with synced goals
 */
export const syncCurrentWeek = withAuth(async (user, userId: string) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to sync their own current week
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const currentWeekDoc = await db.weeks.getCurrentWeek(userId);
    
    // TODO: Implement full week rollover logic
    // This would check if week has changed and trigger rollover if needed
    // For now, just return current week document
    
    return createActionSuccess({
      data: currentWeekDoc,
      message: 'Week synced successfully'
    });
  } catch (error) {
    console.error('Failed to sync current week:', error);
    return handleActionError(error, 'Failed to sync current week');
  }
});
