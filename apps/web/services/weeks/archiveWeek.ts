'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface ArchiveWeekInput {
  userId: string;
  weekId: string;
  weekSummary: {
    totalGoals: number;
    completedGoals: number;
    score: number;
    weekStartDate: string;
    weekEndDate: string;
    goals?: any[];
  };
}

/**
 * Archives the current week to past weeks history.
 * 
 * @param input - Contains userId, weekId, and weekSummary
 * @returns Updated past weeks document
 */
export const archiveWeek = withAuth(async (user, input: ArchiveWeekInput) => {
  try {
    const { userId, weekId, weekSummary } = input;
    
    if (!userId || !weekId) {
      throw new Error('userId and weekId are required');
    }
    
    if (!weekSummary || typeof weekSummary !== 'object') {
      throw new Error('weekSummary object is required with: totalGoals, completedGoals, score, weekStartDate, weekEndDate');
    }
    
    // Only allow users to archive their own weeks
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    
    // Get existing past weeks or create new
    const existingPastWeeks = await db.weeks.getPastWeeks(userId);
    
    const weeks = existingPastWeeks?.weeks || [];
    
    // Add new week to the beginning (most recent first)
    weeks.unshift({
      weekId,
      ...weekSummary,
      archivedAt: new Date().toISOString()
    });
    
    const pastWeeksData = {
      weeks,
      updatedAt: new Date().toISOString()
    };
    
    const pastWeeksDoc = await db.weeks.upsertPastWeeks(userId, pastWeeksData);
    
    return createActionSuccess({
      data: pastWeeksDoc,
      message: `Week ${weekId} archived successfully`
    });
  } catch (error) {
    console.error('Failed to archive week:', error);
    return handleActionError(error, 'Failed to archive week');
  }
});
