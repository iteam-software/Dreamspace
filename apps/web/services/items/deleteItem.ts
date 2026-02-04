'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface DeleteItemInput {
  userId: string;
  itemId: string;
}

/**
 * Deletes an item from the database.
 * 
 * @param input - Contains userId (partition key) and itemId
 * @returns Success response with deleted ID
 */
export const deleteItem = withAuth(async (user, input: DeleteItemInput) => {
  try {
    const { userId, itemId } = input;
    
    if (!userId || !itemId) {
      throw new Error('userId and itemId are required');
    }
    
    // Only allow users to delete their own items
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const container = db.getContainer('items');
    
    await container.item(itemId, userId).delete();
    
    return createActionSuccess({
      deletedId: itemId
    });
  } catch (error) {
    console.error('Failed to delete item:', error);
    return handleActionError(error, 'Failed to delete item');
  }
});
