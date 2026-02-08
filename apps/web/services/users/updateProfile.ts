'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for profile update
 */
export type UpdateProfileState = {
  success: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    _form?: string[];
  };
  data?: {
    id: string;
  };
};

/**
 * Schema for profile form data
 */
const profileFormSchema = zfd.formData({
  displayName: zfd.text(z.string().optional()),
  name: zfd.text(z.string().optional()),
  email: zfd.text(z.string().email().optional()),
  region: zfd.text(z.string().optional()),
  office: zfd.text(z.string().optional()),
  title: zfd.text(z.string().optional()),
  department: zfd.text(z.string().optional()),
  cardBackgroundImage: zfd.text(z.string().optional()),
});

/**
 * Update user profile via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export const updateProfile = withAuth(async (user, prevState: UpdateProfileState | null, formData: FormData): Promise<UpdateProfileState> => {
  try {
    // Validate form data
    const validatedData = profileFormSchema.parse(formData);
    
    const userId = user.id;
    const db = getDatabaseClient();
    
    // Get existing user document
    const existingDocument = await db.users.getUserProfile(userId);
    
    // Create updated document with ONLY profile data (6-container architecture)
    const updatedDocument = {
      id: userId,
      userId: userId,
      // Basic profile fields
      name: validatedData.displayName || validatedData.name || existingDocument?.name || 'Unknown User',
      displayName: validatedData.displayName || validatedData.name || existingDocument?.displayName,
      firstName: validatedData.displayName?.split(' ')[0] || existingDocument?.firstName,
      lastName: validatedData.displayName?.split(' ').slice(1).join(' ') || existingDocument?.lastName,
      email: validatedData.email || existingDocument?.email || '',
      region: validatedData.region || existingDocument?.region,
      photoUrl: existingDocument?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(validatedData.displayName || validatedData.name || 'User')}&background=6366f1&color=fff&size=100`,
      // Additional profile fields
      title: validatedData.title || existingDocument?.title || '',
      department: validatedData.department || existingDocument?.department || '',
      officeLocation: validatedData.office || existingDocument?.officeLocation,
      // SECURITY: Never trust client-supplied roles
      isCoach: existingDocument?.isCoach ?? false,
      isActive: existingDocument?.isActive !== false,
      teamId: existingDocument?.teamId,
      onboardingComplete: existingDocument?.onboardingComplete ?? false,
      lastLogin: existingDocument?.lastLogin,
      createdAt: existingDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.users.upsertUserProfile(userId, updatedDocument);
    
    // Revalidate to refresh context data
    revalidatePath('/people');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: userId },
    };
  } catch (error) {
    console.error('Failed to update profile:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          name: error.formErrors.fieldErrors.name as string[],
          email: error.formErrors.fieldErrors.email as string[],
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
