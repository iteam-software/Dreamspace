'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';
import type { WeekGoal } from '@dreamspace/shared';

/**
 * Form action state for goal save
 */
export type SaveGoalState = {
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
 * Schema for goal form data
 */
const goalFormSchema = zfd.formData({
  id: zfd.text(z.string().optional()),
  weekStartDate: zfd.text(z.string()),
  title: zfd.text(z.string().min(1, 'Title is required')),
  category: zfd.text(z.string().min(1, 'Category is required')),
  description: zfd.text(z.string().optional()),
  templateId: zfd.text(z.string().optional()),
  goalType: zfd.text(z.string().optional()),
  targetValue: zfd.numeric(z.number().optional()),
  currentValue: zfd.numeric(z.number().optional()),
  unit: zfd.text(z.string().optional()),
});

/**
 * Create or update a weekly goal via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export const saveGoal = withAuth(async (user, prevState: SaveGoalState | null, formData: FormData): Promise<SaveGoalState> => {
  try {
    // Validate form data
    const validatedData = goalFormSchema.parse(formData);
    
    const userId = user.id;
    const db = getDatabaseClient();
    
    // Get current week document
    const weekDoc = await db.weeks.getCurrentWeek(userId);
    const existingGoals = weekDoc?.goals || [];
    
    // Create or update goal
    const goalId = validatedData.id || `goal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const goalIndex = existingGoals.findIndex((g: WeekGoal) => g.id === goalId);
    
    const goalData: WeekGoal = {
      id: goalId,
      title: validatedData.title,
      category: validatedData.category,
      description: validatedData.description,
      templateId: validatedData.templateId,
      goalType: validatedData.goalType,
      targetValue: validatedData.targetValue,
      currentValue: validatedData.currentValue ?? 0,
      unit: validatedData.unit,
      isCompleted: goalIndex >= 0 ? existingGoals[goalIndex].isCompleted : false,
      completedAt: goalIndex >= 0 ? existingGoals[goalIndex].completedAt : undefined,
      notes: goalIndex >= 0 ? existingGoals[goalIndex].notes : undefined,
      dailyProgress: goalIndex >= 0 ? existingGoals[goalIndex].dailyProgress : [],
    };
    
    // Update goals array
    let updatedGoals: WeekGoal[];
    if (goalIndex >= 0) {
      updatedGoals = [...existingGoals];
      updatedGoals[goalIndex] = goalData;
    } else {
      updatedGoals = [...existingGoals, goalData];
    }
    
    // Calculate week number and year from weekStartDate
    const weekStart = new Date(validatedData.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Save to database - match CurrentWeekDocument structure
    const document = {
      id: userId,
      userId: userId,
      weekStartDate: validatedData.weekStartDate,
      weekEndDate: weekEnd.toISOString().split('T')[0],
      goals: updatedGoals,
      weekNumber: getWeekNumber(weekStart),
      year: weekStart.getFullYear(),
      createdAt: weekDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.weeks.upsertCurrentWeek(userId, document);
    
    // Revalidate to refresh context data
    revalidatePath('/dashboard');
    revalidatePath('/scorecard');
    
    return {
      success: true,
      data: { id: goalId },
    };
  } catch (error) {
    console.error('Failed to save goal:', error);
    
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

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
