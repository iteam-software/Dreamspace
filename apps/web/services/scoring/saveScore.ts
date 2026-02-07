'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { withAuth, createActionSuccess } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';
import type { QuarterScore } from '@dreamspace/shared';

/**
 * Form action state for quarter score save
 */
export type SaveScoreState = {
  success: boolean;
  errors?: {
    quarter?: string[];
    score?: string[];
    _form?: string[];
  };
  data?: {
    id: string;
    quarter: number;
  };
};

/**
 * Schema for quarter score form data
 */
const scoreFormSchema = zfd.formData({
  year: zfd.numeric(z.number().int().min(2020)),
  quarter: zfd.numeric(z.number().int().min(1).max(4)),
  score: zfd.numeric(z.number().optional()),
  notes: zfd.text(z.string().optional()),
});

/**
 * Save or update a quarter score via form submission
 * Compatible with useActionState/useFormState
 * 
 * @param prevState - Previous form state
 * @param formData - Form data from submission
 * @returns Form state with success/error information
 */
export async function saveScore(
  prevState: SaveScoreState | null,
  formData: FormData
): Promise<SaveScoreState> {
  try {
    // Validate form data
    const validatedData = scoreFormSchema.parse(formData);
    
    // Get authenticated user
    const result = await withAuth(async (user) => {
      const userId = user.id;
      const db = getDatabaseClient();
      
      // Get existing scoring document for the year
      const documentId = `${userId}_${validatedData.year}_scoring`;
      let scoringDoc;
      try {
        scoringDoc = await db.scoring.getScoringDocument(userId, validatedData.year);
      } catch (error: any) {
        if (error.code !== 404) {
          throw error;
        }
        // Document doesn't exist yet, will create new one
      }
      
      const existingQuarters = scoringDoc?.quarters || [];
      const quarterIndex = existingQuarters.findIndex((q: QuarterScore) => q.quarter === validatedData.quarter);
      
      const quarterData: QuarterScore = {
        quarter: validatedData.quarter,
        score: validatedData.score,
        notes: validatedData.notes,
        scoredAt: new Date().toISOString(),
      };
      
      // Update quarters array
      let updatedQuarters: QuarterScore[];
      if (quarterIndex >= 0) {
        updatedQuarters = [...existingQuarters];
        updatedQuarters[quarterIndex] = quarterData;
      } else {
        updatedQuarters = [...existingQuarters, quarterData];
      }
      
      // Calculate annual score (average of quarters)
      const scores = updatedQuarters.filter(q => q.score !== undefined).map(q => q.score!);
      const annualScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length
        : undefined;
      
      // Save to database - match ScoringDocument structure
      const document = {
        id: documentId,
        userId: userId,
        year: validatedData.year,
        quarters: updatedQuarters,
        annualScore,
        createdAt: scoringDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.scoring.upsertScoring(userId, validatedData.year, document);
      
      return createActionSuccess({ id: documentId, quarter: validatedData.quarter });
    })({});
    
    if (result.failed) {
      return {
        success: false,
        errors: {
          _form: result.errors._errors || ['Failed to save score'],
        },
      };
    }
    
    // Revalidate to refresh context data
    revalidatePath('/scorecard');
    revalidatePath('/dashboard');
    
    return {
      success: true,
      data: { id: result.id, quarter: result.quarter },
    };
  } catch (error) {
    console.error('Failed to save score:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: {
          quarter: error.formErrors.fieldErrors.quarter as string[],
          score: error.formErrors.fieldErrors.score as string[],
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
