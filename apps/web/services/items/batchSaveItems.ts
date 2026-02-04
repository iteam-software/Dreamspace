'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';

/**
 * Batch saves multiple items to the database.
 * NOTE: This endpoint is deprecated for 6-container architecture.
 * Use dedicated batch endpoints instead.
 * 
 * @deprecated Use dedicated batch endpoints for each item type
 */
export const batchSaveItems = withAuth(async (user, input: any) => {
  try {
    throw new Error(
      'This endpoint is deprecated. Use dedicated batch endpoints for each item type.'
    );
  } catch (error) {
    console.error('Failed to batch save items:', error);
    return handleActionError(error, 'Failed to batch save items');
  }
});
