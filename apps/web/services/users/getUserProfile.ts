'use server';

import { withAuth, createActionSuccess, createActionError, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets user profile by user ID.
 * Server action for retrieving user profile data.
 * 
 * @param userId - User ID to fetch
 * @returns User profile or error
 */
export const getUserProfile = withAuth(async (user, userId: string) => {
  try {
    // Only allow users to fetch their own profile (or admins in future)
    if (user.id !== userId) {
      return createActionError('Forbidden');
    }

    const db = getDatabaseClient();
    const profile = await db.users.getUserProfile(userId);

    if (!profile) {
      return createActionError('User not found');
    }

    return createActionSuccess(profile);
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return handleActionError(error, 'Failed to fetch user profile');
  }
});
