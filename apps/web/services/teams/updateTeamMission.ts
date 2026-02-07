'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withCoachAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Form action state for team mission update
 */
export type UpdateTeamMissionState = {
  success: boolean;
  errors?: {
    mission?: string[];
    _form?: string[];
  };
  data?: {
    managerId: string;
    mission: string;
  };
};

/**
 * Schema for team mission form data
 */
const teamMissionFormSchema = zfd.formData({
  managerId: zfd.text(z.string()),
  mission: zfd.text(z.string().min(1, 'Team mission is required')),
});

/**
 * Update a team's mission statement via form submission
 * Compatible with useActionState/useFormState
 * Only coaches can update their own team mission.
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export async function updateTeamMission(
  prevState: UpdateTeamMissionState | null,
  formData: FormData
): Promise<UpdateTeamMissionState> {
  try {
    // Validate form data
    const validatedData = teamMissionFormSchema.parse(formData);
    
    // Get authenticated coach
    const result = await withCoachAuth(async (user) => {
      const { managerId, mission } = validatedData;
      
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
        teamMission: mission,
        updatedAt: new Date().toISOString(),
      };
      
      await db.teams.updateTeam(team.id, team.managerId, updatedTeam);
      
      return createActionSuccess({
        managerId,
        mission,
      });
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to update team mission'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/dream-team');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { managerId: result.managerId, mission: result.mission },
    };
  } catch (error) {
    console.error('Failed to update team mission:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          mission: error.formErrors.fieldErrors.mission as string[],
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
