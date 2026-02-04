'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface GetItemsInput {
  userId: string;
  type?: string;
  weekId?: string;
}

/**
 * Gets items for a user with optional filtering.
 * NOTE: This endpoint is largely deprecated in favor of dedicated endpoints
 * for dreams, connects, etc. in the 6-container architecture.
 * 
 * @param input - Contains userId and optional filters (type, weekId)
 * @returns Array of items matching criteria
 */
export const getItems = withAuth(async (user, input: GetItemsInput) => {
  try {
    const { userId, type, weekId } = input;
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to get their own items
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const resources = await db.items.getItems(userId, type, weekId);
    
    return createActionSuccess(resources);
  } catch (error) {
    console.error('Failed to get items:', error);
    return handleActionError(error, 'Failed to get items');
  }
});
