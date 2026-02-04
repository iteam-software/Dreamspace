'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface DeleteConnectInput {
  userId: string;
  connectId: string;
}

/**
 * Deletes a connect for a user.
 * 
 * @param input - Contains userId (partition key) and connectId
 * @returns Success response with deleted ID
 */
export const deleteConnect = withAuth(async (user, input: DeleteConnectInput) => {
  try {
    const { userId, connectId } = input;
    
    if (!userId || !connectId) {
      throw new Error('userId and connectId are required');
    }
    
    // Only allow users to delete their own connects
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    await db.connects.deleteConnect(userId, connectId);
    
    return createActionSuccess({
      id: connectId
    });
  } catch (error) {
    console.error('Failed to delete connect:', error);
    return handleActionError(error, 'Failed to delete connect');
  }
});
