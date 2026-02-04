'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface GetScoringInput {
  userId: string;
  year?: number;
}

/**
 * Gets the scoring document for a user for a specific year.
 * 
 * @param input - Contains userId and optional year (defaults to current year)
 * @returns Scoring document with entries and total score
 */
export const getScoring = withAuth(async (user, input: GetScoringInput) => {
  try {
    const { userId, year = new Date().getFullYear() } = input;
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own scoring
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const documentId = `${userId}_${year}_scoring`;
    
    try {
      const scoring = await db.scoring.getScoringDocument(userId, year);
      
      if (!scoring) {
        // Return empty structure if not found
        return createActionSuccess({
          id: documentId,
          userId,
          year,
          totalScore: 0,
          entries: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return createActionSuccess(scoring);
    } catch (error: any) {
      if (error.code === 404) {
        // Return empty structure if not found
        return createActionSuccess({
          id: documentId,
          userId,
          year,
          totalScore: 0,
          entries: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to get scoring:', error);
    return handleActionError(error, 'Failed to get scoring');
  }
});
