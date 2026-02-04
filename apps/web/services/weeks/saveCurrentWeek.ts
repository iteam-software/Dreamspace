'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface SaveCurrentWeekInput {
  userId: string;
  weekId: string;
  goals: any[];
  stats?: any;
}

/**
 * Saves/updates the current week document with active goals.
 * 
 * @param input - Contains userId, weekId, goals, and optional stats
 * @returns Saved current week document
 */
export const saveCurrentWeek = withAuth(async (user, input: SaveCurrentWeekInput) => {
  try {
    const { userId, weekId, goals, stats } = input;
    
    if (!userId || !weekId) {
      throw new Error('userId and weekId are required');
    }
    
    if (!goals || !Array.isArray(goals)) {
      throw new Error('goals array is required');
    }
    
    // Only allow users to save their own current week
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    
    const weekData = {
      weekId,
      goals,
      stats: stats || {},
      updatedAt: new Date().toISOString()
    };
    
    const savedDoc = await db.weeks.upsertCurrentWeek(userId, weekData);
    
    return createActionSuccess({
      data: savedDoc
    });
  } catch (error) {
    console.error('Failed to save current week:', error);
    return handleActionError(error, 'Failed to save current week');
  }
});
