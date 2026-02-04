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
    const container = db.getContainer('scoring');
    
    // Query all scoring documents for this user across all years
    const query = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.year DESC',
      parameters: [{ name: '@userId', value: userId }]
    };
    
    const { resources } = await container.items.query(query).fetchAll();
    
    // Calculate all-time total
    const allTimeTotal = resources.reduce((sum, doc: any) => sum + (doc.totalScore || 0), 0);
    
    return createActionSuccess({
      documents: resources,
      allTimeTotal,
      yearsCount: resources.length
    });
  } catch (error) {
    console.error('Failed to get all years scoring:', error);
    return handleActionError(error, 'Failed to get all years scoring');
  }
});
