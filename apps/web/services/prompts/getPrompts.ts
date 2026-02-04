'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets AI prompts configuration from database.
 * 
 * @returns Prompts configuration
 */
export const getPrompts = withAuth(async (user) => {
  try {
    const db = getDatabaseClient();
    const prompts = await db.prompts.getPrompts();
    
    return createActionSuccess({ prompts });
  } catch (error) {
    console.error('Failed to get prompts:', error);
    return handleActionError(error, 'Failed to get prompts');
  }
});
