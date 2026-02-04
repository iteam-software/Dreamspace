'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface SaveUserDataInput {
  userId?: string;
  id?: string;
  currentUser?: any;
  [key: string]: any;
}

/**
 * Saves user data (profile only for v2+ architecture).
 * For v3 6-container architecture, arrays (dreams, connects, etc.) are managed separately.
 * 
 * @param userData - User data to save
 * @returns Success response or error
 */
export const saveUserData = withAuth(async (user, userData: SaveUserDataInput) => {
  try {
    const userId = userData.userId || userData.id || userData.currentUser?.userId || userData.currentUser?.id;
    
    if (!userId) {
      throw new Error('userId or id is required');
    }
    
    // Only allow users to save their own data
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }

    const db = getDatabaseClient();
    
    // Check if user already exists
    const existingProfile = await db.users.getUserProfile(userId);
    
    // Extract profile data without arrays (6-container architecture - no career fields)
    // Destructure to exclude fields that don't belong in user profile:
    // - yearVision: belongs in dreams container, not user profile  
    // - Arrays: managed in separate containers
    // - Cosmos metadata: internal fields not needed
    const userProfile = userData.currentUser || userData;
    const {
      dreamBook, weeklyGoals, scoringHistory, connects,
      yearVision, // Excluded - belongs in dreams container
      isAuthenticated, // Excluded - not persisted
      _rid, _self, _etag, _attachments, _ts, // Excluded - Cosmos metadata
      ...profileData
    } = userProfile;
    
    // Remove yearVision from existing profile if it exists
    const { yearVision: _yv, ...existingProfileClean } = (existingProfile as any) || {};
    
    const updatedProfile = {
      ...existingProfileClean, // Keep existing data (without yearVision)
      ...profileData, // Merge updates
      // Explicitly preserve cardBackgroundImage from existing profile if not in profileData
      cardBackgroundImage: profileData.cardBackgroundImage !== undefined 
        ? profileData.cardBackgroundImage 
        : ((existingProfileClean as any)?.cardBackgroundImage || undefined),
      id: userId,
      userId: userId,
      dataStructureVersion: 3, // Use version 3 for 6-container architecture
      currentYear: new Date().getFullYear(),
      lastUpdated: new Date().toISOString()
    };
    
    await db.users.upsertUserProfile(userId, updatedProfile);
    
    return createActionSuccess({ 
      id: userId,
      format: 'v3-profile-only'
    });
  } catch (error) {
    console.error('Failed to save user data:', error);
    return handleActionError(error, 'Failed to save user data');
  }
});
