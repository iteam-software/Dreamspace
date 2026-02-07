'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for year vision save
 */
export type SaveYearVisionState = {
  success: boolean;
  errors?: {
    yearVision?: string[];
    _form?: string[];
  };
  data?: {
    yearVision: string;
  };
};

/**
 * Schema for year vision form data
 */
const yearVisionFormSchema = zfd.formData({
  yearVision: zfd.text(z.string()),
});

/**
 * Save year vision via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export async function saveYearVision(
  prevState: SaveYearVisionState | null,
  formData: FormData
): Promise<SaveYearVisionState> {
  try {
    // Validate form data
    const validatedData = yearVisionFormSchema.parse(formData);
    
    // Get authenticated user
    const result = await withAuth(async (user) => {
      const userId = user.id;
      const db = getDatabaseClient();
      
      // Get existing document
      const dreamsDoc = await db.dreams.getDreamsDocument(userId);
      
      // Update document with new vision
      const document = {
        id: userId,
        userId: userId,
        dreams: dreamsDoc?.dreams || [],
        weeklyGoalTemplates: dreamsDoc?.weeklyGoalTemplates || [],
        yearVision: validatedData.yearVision,
        createdAt: dreamsDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.dreams.upsertDreamsDocument(userId, document);
      
      return { success: true, yearVision: validatedData.yearVision };
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to save year vision'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-book');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { yearVision: result.yearVision },
    };
  } catch (error) {
    console.error('Failed to save year vision:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          yearVision: error.formErrors.fieldErrors.yearVision as string[],
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

