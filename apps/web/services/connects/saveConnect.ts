'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for connect save
 */
export type SaveConnectState = {
  success: boolean;
  errors?: {
    connectType?: string[];
    connectDate?: string[];
    recipientName?: string[];
    _form?: string[];
  };
  data?: {
    id: string;
  };
};

/**
 * Schema for connect form data
 */
const connectFormSchema = zfd.formData({
  id: zfd.text(z.string().optional()),
  connectType: zfd.text(z.string().min(1, 'Connect type is required')),
  connectDate: zfd.text(z.string().min(1, 'Date is required')),
  notes: zfd.text(z.string().optional()),
  recipientUserId: zfd.text(z.string().optional()),
  recipientName: zfd.text(z.string().optional()),
  teamId: zfd.text(z.string().optional()),
});

/**
 * Create or update a connect via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export const saveConnect = withAuth(async (user, prevState: SaveConnectState | null, formData: FormData): Promise<SaveConnectState> => {
  try {
    // Validate form data
    const validatedData = connectFormSchema.parse(formData);
    
    const userId = user.id;
    const db = getDatabaseClient();
    
    // Create connect ID
    const connectId = validatedData.id || `connect_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Save to database - match ConnectDocument structure
    const document = {
      id: connectId,
      userId: userId,
      connectType: validatedData.connectType,
      connectDate: validatedData.connectDate,
      notes: validatedData.notes,
      recipientUserId: validatedData.recipientUserId,
      recipientName: validatedData.recipientName,
      teamId: validatedData.teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.connects.upsertConnect(userId, document);
    
    // Revalidate to refresh context data
    revalidatePath('/dream-connect');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: connectId },
    };
  } catch (error) {
    console.error('Failed to save connect:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          connectType: error.formErrors.fieldErrors.connectType as string[],
          connectDate: error.formErrors.fieldErrors.connectDate as string[],
          recipientName: error.formErrors.fieldErrors.recipientName as string[],
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
