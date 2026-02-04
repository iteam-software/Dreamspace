'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface ProfileData {
  displayName?: string;
  name?: string;
  mail?: string;
  userPrincipalName?: string;
  email?: string;
  region?: string;
  officeLocation?: string;
  city?: string;
  office?: string;
  picture?: string;
  cardBackgroundImage?: string | null;
  title?: string;
  department?: string;
  manager?: string;
  [key: string]: any;
}

/**
 * Updates user profile with new data.
 * Only updates profile fields (6-container architecture).
 * Arrays (dreams, connects, etc.) are stored in separate containers.
 * 
 * @param userId - User ID to update
 * @param profileData - Profile data to update
 * @returns Updated profile or error
 */
export const updateUserProfile = withAuth(async (user, userId: string, profileData: ProfileData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!profileData) {
      throw new Error('Profile data is required');
    }

    // Only allow users to update their own profile (admins can be handled separately)
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }

    const db = getDatabaseClient();
    
    // Get existing user document
    const existingDocument = await db.users.getUserProfile(userId);
    
    // Create updated document with ONLY profile data (6-container architecture)
    const updatedDocument = {
      id: userId,
      userId: userId,
      // Basic profile fields
      name: profileData.displayName || profileData.name || existingDocument?.name || 'Unknown User',
      email: profileData.mail || profileData.userPrincipalName || profileData.email || existingDocument?.email || '',
      office: profileData.region || profileData.officeLocation || profileData.city || profileData.office || existingDocument?.office || 'Remote',
      avatar: profileData.picture || existingDocument?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName || profileData.name || 'User')}&background=6366f1&color=fff&size=100`,
      cardBackgroundImage: profileData.cardBackgroundImage !== undefined && profileData.cardBackgroundImage !== null && profileData.cardBackgroundImage !== '' 
        ? profileData.cardBackgroundImage 
        : (existingDocument?.cardBackgroundImage || undefined),
      // Additional profile fields
      title: profileData.title || existingDocument?.title || '',
      department: profileData.department || existingDocument?.department || '',
      manager: profileData.manager || existingDocument?.manager || '',
      // SECURITY: Never trust client-supplied roles
      roles: existingDocument?.roles || {
        admin: false,
        coach: false,
        employee: true
      },
      // Aggregates
      score: existingDocument?.score || 0,
      dreamsCount: existingDocument?.dreamsCount || 0,
      connectsCount: existingDocument?.connectsCount || 0,
      weeksActiveCount: existingDocument?.weeksActiveCount || 0,
      currentYear: new Date().getFullYear(),
      dataStructureVersion: 3,
      // Derive role from roles object (admin > coach > user)
      role: existingDocument?.roles?.admin ? 'admin' 
          : existingDocument?.roles?.coach ? 'coach' 
          : 'user',
      isCoach: existingDocument?.roles?.coach ?? false,
      isActive: existingDocument?.isActive !== false,
      createdAt: existingDocument?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      profileUpdated: new Date().toISOString()
    };
    
    const resource = await db.users.upsertUserProfile(userId, updatedDocument);
    
    return createActionSuccess({ 
      id: resource.id,
      name: resource.name,
      email: resource.email,
      office: resource.office,
      title: resource.title,
      department: resource.department,
      manager: resource.manager,
      roles: resource.roles
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return handleActionError(error, 'Failed to update user profile');
  }
});
