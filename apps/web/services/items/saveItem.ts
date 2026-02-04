'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';

/**
 * Saves an item to the database.
 * NOTE: This endpoint is deprecated for 6-container architecture.
 * Use dedicated endpoints instead:
 * - Dreams/templates: saveDreams
 * - Connects: saveConnect
 * - Scoring: saveScoring
 * - Weekly goals: saveCurrentWeek
 * 
 * @deprecated Use dedicated endpoints for each item type
 */
export const saveItem = withAuth(async (user, input: any) => {
  try {
    throw new Error(
      'This endpoint is deprecated. Use dedicated endpoints: ' +
      'saveDreams for dreams/templates, saveConnect for connects, ' +
      'saveScoring for scoring, saveCurrentWeek for weekly goals.'
    );
  } catch (error) {
    console.error('Failed to save item:', error);
    return handleActionError(error, 'Failed to save item');
  }
});
