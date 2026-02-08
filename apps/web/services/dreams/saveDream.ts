'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';
import type { DreamBookEntry } from '@dreamspace/shared';

/**
 * Form action state for dream save
 */
export type SaveDreamState = {
  success: boolean;
  errors?: {
    title?: string[];
    category?: string[];
    description?: string[];
    _form?: string[];
  };
  data?: {
    id: string;
  };
};

/**
 * Schema for dream form data
 */
const dreamFormSchema = zfd.formData({
  id: zfd.text(z.string().optional()),
  title: zfd.text(z.string().min(1, 'Title is required')),
  category: zfd.text(z.string().optional()),
  description: zfd.text(z.string().optional()),
  imageUrl: zfd.text(z.string().optional()),
  imagePrompt: zfd.text(z.string().optional()),
  targetDate: zfd.text(z.string().optional()),
});

/**
 * Create or update a dream via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export const saveDream = withAuth(async (user, prevState: SaveDreamState | null, formData: FormData): Promise<SaveDreamState> => {
  try {
    // Validate form data
    const validatedData = dreamFormSchema.parse(formData);
    
    const userId = user.id;
    const db = getDatabaseClient();
    
    // Get existing dreams document
    const dreamsDoc = await db.dreams.getDreamsDocument(userId);
    const existingDreams = dreamsDoc?.dreamBook || [];
    
    // Create or update dream
    const dreamId = validatedData.id || `dream_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const dreamIndex = existingDreams.findIndex((d: DreamBookEntry) => d.id === dreamId);
    
    const dreamData: DreamBookEntry = {
      id: dreamId,
      title: validatedData.title,
      category: validatedData.category,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      imagePrompt: validatedData.imagePrompt,
      targetDate: validatedData.targetDate,
      isCompleted: dreamIndex >= 0 ? existingDreams[dreamIndex].isCompleted : false,
      createdAt: dreamIndex >= 0 ? existingDreams[dreamIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Update dreams array
    let updatedDreams: DreamBookEntry[];
    if (dreamIndex >= 0) {
      updatedDreams = [...existingDreams];
      updatedDreams[dreamIndex] = dreamData;
    } else {
      updatedDreams = [...existingDreams, dreamData];
    }
    
    // Save to database - match DreamsDocument structure
    const document = {
      id: userId,
      userId: userId,
      dreamBook: updatedDreams,
      weeklyGoalTemplates: dreamsDoc?.weeklyGoalTemplates || [],
      createdAt: dreamsDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.dreams.upsertDreamsDocument(userId, document);
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: dreamId },
    };
  } catch (error) {
    console.error('Failed to save dream:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          title: error.formErrors.fieldErrors.title as string[],
          category: error.formErrors.fieldErrors.category as string[],
          description: error.formErrors.fieldErrors.description as string[],
          _form: error.formErrors.formErrors,
        },
      };
    }
    
    return {
      success: false,
      errors: {
        _form: ['An unexpected error occurred'],
      },
    };
  }
});
