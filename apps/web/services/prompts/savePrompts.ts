'use server';

import { withAdminAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Saves AI prompts configuration to database.
 * 
 * @param prompts - Prompts configuration object
 * @returns Success response
 */
export const savePrompts = withAdminAuth(async (user, prompts: any) => {
  try {
    if (!prompts || typeof prompts !== 'object') {
      throw new Error('Prompts data is required');
    }
    
    const db = getDatabaseClient();
    
    // Handle both single prompt and array of prompts
    const promptsArray = Array.isArray(prompts) ? prompts : [prompts];
    
    for (const prompt of promptsArray) {
      await db.prompts.upsertPrompt(prompt);
    }
    
    return createActionSuccess({ message: 'Prompts saved successfully' });
  } catch (error) {
    console.error('Failed to save prompts:', error);
    return handleActionError(error, 'Failed to save prompts');
  }
});
