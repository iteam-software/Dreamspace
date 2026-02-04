'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface SaveDreamsInput {
  userId: string;
  dreams: any[];
  weeklyGoalTemplates?: any[];
}

/**
 * Saves dreams and weekly goal templates for a user.
 * 
 * @param input - Contains userId, dreams array, and optional weeklyGoalTemplates
 * @returns Success response with saved dreams details
 */
export const saveDreams = withAuth(async (user, input: SaveDreamsInput) => {
  try {
    const { userId, dreams, weeklyGoalTemplates } = input;
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Only allow users to save their own dreams
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    
    // Try to read existing document
    const existingDoc = await db.dreams.getDreamsDocument(userId);
    
    // Prepare the document - preserve yearVision from existing document
    const document = {
      id: userId,
      userId: userId,
      dreams: dreams.map(dream => ({
        id: dream.id,
        title: dream.title,
        description: dream.description || '',
        motivation: dream.motivation || '',
        approach: dream.approach || '',
        category: dream.category,
        goals: (dream.goals || []).map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          description: goal.description || '',
          type: goal.type || 'general',
          recurrence: goal.recurrence,
          targetWeeks: goal.targetWeeks,
          targetMonths: goal.targetMonths,
          frequency: goal.frequency,
          startDate: goal.startDate,
          targetDate: goal.targetDate,
          weeksRemaining: goal.weeksRemaining,
          monthsRemaining: goal.monthsRemaining,
          active: goal.active !== false,
          completed: goal.completed || false,
          completedAt: goal.completedAt,
          createdAt: goal.createdAt || new Date().toISOString()
        })),
        progress: dream.progress || 0,
        targetDate: dream.targetDate,
        image: dream.image || dream.picture, // Support both 'image' (new) and 'picture' (legacy)
        notes: dream.notes || [],
        coachNotes: dream.coachNotes || [],
        history: dream.history || [],
        completed: dream.completed || false,
        isPublic: dream.isPublic || false,
        createdAt: dream.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      weeklyGoalTemplates: (weeklyGoalTemplates || []).map(template => ({
        id: template.id,
        type: 'weekly_goal_template',
        title: template.title,
        description: template.description,
        category: template.category || template.dreamCategory || 'general',
        goalType: template.goalType,
        dreamId: template.dreamId,
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        goalId: template.goalId || template.milestoneId,
        recurrence: template.recurrence || 'weekly',
        active: template.active !== false,
        durationType: template.durationType || (template.durationWeeks || template.targetWeeks ? 'weeks' : 'unlimited'),
        durationWeeks: template.durationWeeks || template.targetWeeks,
        targetWeeks: template.targetWeeks || template.durationWeeks,
        targetMonths: template.targetMonths,
        weeksRemaining: template.weeksRemaining,
        monthsRemaining: template.monthsRemaining,
        startDate: template.startDate,
        createdAt: template.createdAt || new Date().toISOString()
      })),
      yearVision: existingDoc?.yearVision || '',
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.dreams.upsertDreamsDocument(userId, document);
    
    return createActionSuccess({
      id: userId,
      dreamsCount: dreams.length,
      templatesCount: weeklyGoalTemplates?.length || 0
    });
  } catch (error) {
    console.error('Failed to save dreams:', error);
    return handleActionError(error, 'Failed to save dreams');
  }
});
