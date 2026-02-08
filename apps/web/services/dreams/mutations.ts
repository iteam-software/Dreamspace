'use server';

import { revalidatePath } from 'next/cache';
import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';
import { Dream } from '@/lib/contexts/dreams/types';

/**
 * Reorder dreams (drag and drop)
 * Non-form mutation with simple signature
 * 
 * @param dreams - Reordered array of dreams
 * @returns Success response
 */
export async function reorderDreams(dreams: Dream[]) {
  try {
    const result = await withAuth(async (user) => {
      const userId = user.id;
      const db = getDatabaseClient();
      
      // Get existing document to preserve other fields
      const dreamsDoc = await db.dreams.getDreamsDocument(userId);
      
      // Update document with reordered dreams
      const document = {
        id: userId,
        userId: userId,
        dreams: dreams,
        weeklyGoalTemplates: dreamsDoc?.weeklyGoalTemplates || [],
        yearVision: dreamsDoc?.yearVision || '',
        createdAt: dreamsDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.dreams.upsertDreamsDocument(userId, document);
      
      return createActionSuccess({ count: dreams.length });
    })({});
    
    if (result.failed) {
      throw new Error(result.errors._errors?.join(', ') || 'Failed to reorder dreams');
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return result;
  } catch (error) {
    console.error('Failed to reorder dreams:', error);
    return handleActionError(error, 'Failed to reorder dreams');
  }
}
