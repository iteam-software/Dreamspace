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
    const container = db.getContainer('items');
    
    // Build query based on filters
    let query: string;
    let parameters: any[];
    
    if (type && weekId) {
      query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type AND c.weekId = @weekId';
      parameters = [
        { name: '@userId', value: userId },
        { name: '@type', value: type },
        { name: '@weekId', value: weekId }
      ];
    } else if (type) {
      query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type';
      parameters = [
        { name: '@userId', value: userId },
        { name: '@type', value: type }
      ];
    } else if (weekId) {
      query = 'SELECT * FROM c WHERE c.userId = @userId AND c.weekId = @weekId';
      parameters = [
        { name: '@userId', value: userId },
        { name: '@weekId', value: weekId }
      ];
    } else {
      query = 'SELECT * FROM c WHERE c.userId = @userId';
      parameters = [{ name: '@userId', value: userId }];
    }
    
    const { resources } = await container.items.query({ query, parameters }).fetchAll();
    
    return createActionSuccess(resources);
  } catch (error) {
    console.error('Failed to get items:', error);
    return handleActionError(error, 'Failed to get items');
  }
});
