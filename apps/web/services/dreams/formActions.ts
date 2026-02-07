'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for dream mutations
 */
export type DreamFormState = {
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
  category: zfd.text(z.string().min(1, 'Category is required')),
  description: zfd.text(z.string().optional()),
  motivation: zfd.text(z.string().optional()),
  approach: zfd.text(z.string().optional()),
  progress: zfd.numeric(z.number().min(0).max(100).optional()),
  image: zfd.text(z.string().optional()),
});

/**
 * Create or update a dream via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export async function saveDreamFormAction(
  prevState: DreamFormState | null,
  formData: FormData
): Promise<DreamFormState> {
  try {
    // Validate form data
    const validatedData = dreamFormSchema.parse(formData);
    
    // Get authenticated user
    const result = await withAuth(async (user) => {
      const userId = user.id;
      const db = getDatabaseClient();
      
      // Get existing dreams
      const dreamsDoc = await db.dreams.getDreamsDocument(userId);
      const existingDreams = dreamsDoc?.dreams || [];
      
      // Create or update dream
      const dreamId = validatedData.id || `dream_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const dreamIndex = existingDreams.findIndex((d: any) => d.id === dreamId);
      
      const dreamData = {
        id: dreamId,
        title: validatedData.title,
        category: validatedData.category,
        description: validatedData.description || '',
        motivation: validatedData.motivation || '',
        approach: validatedData.approach || '',
        progress: validatedData.progress || 0,
        image: validatedData.image || '',
        notes: dreamIndex >= 0 ? existingDreams[dreamIndex].notes : [],
        coachNotes: dreamIndex >= 0 ? existingDreams[dreamIndex].coachNotes : [],
        history: dreamIndex >= 0 ? existingDreams[dreamIndex].history : [],
        goals: dreamIndex >= 0 ? existingDreams[dreamIndex].goals : [],
        completed: dreamIndex >= 0 ? existingDreams[dreamIndex].completed : false,
        isPublic: dreamIndex >= 0 ? existingDreams[dreamIndex].isPublic : false,
        createdAt: dreamIndex >= 0 ? existingDreams[dreamIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update dreams array
      let updatedDreams;
      if (dreamIndex >= 0) {
        updatedDreams = [...existingDreams];
        updatedDreams[dreamIndex] = dreamData;
      } else {
        updatedDreams = [...existingDreams, dreamData];
      }
      
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
      
      return createActionSuccess({ id: dreamId });
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to save dream'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: result.id },
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
}

/**
 * Delete a dream via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data with dream ID
 * @returns Form state with success/error information
 */
export async function deleteDreamFormAction(
  prevState: DreamFormState | null,
  formData: FormData
): Promise<DreamFormState> {
  try {
    const dreamId = formData.get('id')?.toString();
    
    if (!dreamId) {
      return {
        success: false,
        errors: {
          _form: ['Dream ID is required'],
        },
      };
    }
    
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
      
      return createActionSuccess({ id: dreamId });
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to delete dream'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: dreamId },
    };
  } catch (error) {
    console.error('Failed to delete dream:', error);
    
    return {
      success: false,
      errors: {
        _form: ['An unexpected error occurred'],
      },
    };
  }
}
