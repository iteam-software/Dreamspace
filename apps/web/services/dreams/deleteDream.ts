'use server';

import { revalidatePath } from 'next/cache';
import { withAuth } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Delete a dream
 * Non-form mutation with simple signature
 * 
 * @param dreamId - ID of the dream to delete
 * @returns Success response or throws error
 */
export async function deleteDream(dreamId: string) {
  try {
    const result = await withAuth(async (user) => {
      const userId = user.id;
      const db = getDatabaseClient();
      
      // Get existing dreams
      const dreamsDoc = await db.dreams.getDreamsDocument(userId);
      const existingDreams = dreamsDoc?.dreams || [];
      
      // Filter out the dream
      const updatedDreams = existingDreams.filter((d: any) => d.id !== dreamId);
      
      // Save to database
      const document = {
        id: userId,
        userId: userId,
        dreams: updatedDreams,
        weeklyGoalTemplates: dreamsDoc?.weeklyGoalTemplates || [],
        yearVision: dreamsDoc?.yearVision || '',
        createdAt: dreamsDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.dreams.upsertDreamsDocument(userId, document);
      
      return { success: true, id: dreamId };
    })({});
    
    if (result.failed) {
      throw new Error(result.errors._errors?.join(', ') || 'Failed to delete dream');
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return result;
  } catch (error) {
    console.error('Failed to delete dream:', error);
    throw error;
  }
}
