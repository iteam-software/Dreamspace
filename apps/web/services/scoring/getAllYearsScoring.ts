'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets all scoring documents for a user across all years.
 * 
 * @param userId - User ID
 * @returns Array of scoring documents sorted by year descending
 */
export const getAllYearsScoring = withAuth(async (user, userId: string) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own scoring
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const documents = await db.scoring.getAllYearsScoring(userId);
    
    // Calculate all-time total
    const allTimeTotal = documents.reduce((sum: number, doc: any) => sum + (doc.totalScore || 0), 0);
    
    return createActionSuccess({
      documents,
      allTimeTotal,
      yearsCount: documents.length
    });
  } catch (error) {
    console.error('Failed to get all years scoring:', error);
    return handleActionError(error, 'Failed to get all years scoring');
  }
});
