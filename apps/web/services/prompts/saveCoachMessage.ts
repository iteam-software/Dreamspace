'use server';

import { withCoachAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Saves a coach message to a dream.
 * 
 * @param input - Contains userId, dreamId, and message
 * @returns Success response
 */
export const saveCoachMessage = withCoachAuth(async (user, input: any) => {
  try {
    const { userId, dreamId, message } = input;
    
    if (!userId || !dreamId || !message) {
      throw new Error('userId, dreamId, and message are required');
    }
    
    const db = getDatabaseClient();
    // TODO: Implement coach message save to dream document
    return createActionSuccess({ message: 'Coach message save not yet implemented' });
  } catch (error) {
    console.error('Failed to save coach message:', error);
    return handleActionError(error, 'Failed to save coach message');
  }
});
