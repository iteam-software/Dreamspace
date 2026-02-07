'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withCoachAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for team name update
 */
export type UpdateTeamNameState = {
  success: boolean;
  errors?: {
    teamName?: string[];
    _form?: string[];
  };
  data?: {
    managerId: string;
    teamName: string;
  };
};

/**
 * Schema for team name form data
 */
const teamNameFormSchema = zfd.formData({
  managerId: zfd.text(z.string()),
  teamName: zfd.text(z.string().min(1, 'Team name is required')),
});

/**
 * Update a team's name via form submission
 * Compatible with useActionState/useFormState
 * Only coaches can update their own team name.
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export async function updateTeamName(
  prevState: UpdateTeamNameState | null,
  formData: FormData
): Promise<UpdateTeamNameState> {
  try {
    // Validate form data
    const validatedData = teamNameFormSchema.parse(formData);
    
    // Get authenticated coach
    const result = await withCoachAuth(async (user) => {
      const { managerId, teamName } = validatedData;
      
      // Verify the authenticated coach is modifying their own team
      if (user.id !== managerId) {
        throw new Error('You can only modify your own team');
      }
      
      const db = getDatabaseClient();
      
      const team = await db.teams.getTeamByManagerId(managerId);
      
      if (!team) {
        throw new Error(`No team found for manager: ${managerId}`);
      }
      
      const updatedTeam = {
        ...team,
        teamName,
        updatedAt: new Date().toISOString(),
      };
      
      await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
      
      return createActionSuccess({
        managerId,
        teamName,
      });
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to update team name'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-team');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { managerId: result.managerId, teamName: result.teamName },
    };
  } catch (error) {
    console.error('Failed to update team name:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          teamName: error.formErrors.fieldErrors.teamName as string[],
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
