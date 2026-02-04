'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets complete user data including profile, dreams, weekly goals, connects, and scoring.
 * This is the main data loading function for the user dashboard.
 * 
 * @param userId - User ID to fetch data for
 * @returns Complete user data object or error
 */
export const getUserData = withAuth(async (user, userId: string) => {
  try {
    // Only allow users to fetch their own data (or admins in future)
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }

    const db = getDatabaseClient();
    
    // Load user profile
    const profile = await db.users.getUserProfile(userId);
    
    if (!profile) {
      throw new Error('User not found');
    }
    
    const currentYear = new Date().getFullYear();
    
    // Load all data in parallel - dreams, connects, week, and scoring don't depend on each other
    const [dreamsDoc, connects, currentWeekDoc, scoringDoc] = await Promise.all([
      db.dreams.getDreamsDocument(userId),
      db.connects.getConnects(userId),
      db.weeks.getCurrentWeek(userId),
      db.scoring.getScoringDocument(userId, currentYear)
    ]);
    
    // Extract dreams data
    const dreamBook = dreamsDoc?.dreams || [];
    const weeklyGoalTemplates = dreamsDoc?.weeklyGoalTemplates || [];
    const yearVision = dreamsDoc?.yearVision || '';
    
    // Extract weekly goals from current week
    const weeklyGoals = currentWeekDoc?.goals || [];
    
    // Extract scoring
    const scoringHistory = scoringDoc?.entries || [];
    const totalScore = scoringDoc?.totalScore || profile.score || 0;
    
    // Combine into legacy format for backward compatibility
    // Remove Cosmos metadata fields
    const { _rid, _self, _etag, _attachments, _ts, lastUpdated, yearVision: _, ...cleanProfile } = profile as any;
    
    const userData = {
      ...cleanProfile,
      dataStructureVersion: profile.dataStructureVersion || 3,
      score: totalScore, // Override with score from scoring container
      dreamBook,
      yearVision, // From dreams container (source of truth)
      weeklyGoals,
      connects,
      scoringHistory,
      careerGoals: [], // Disabled in Phase 1
      developmentPlan: [] // Disabled in Phase 1
    };
    
    return createActionSuccess(userData);
  } catch (error) {
    console.error('Failed to get user data:', error);
    return handleActionError(error, 'Failed to fetch user data');
  }
});
