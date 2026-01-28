'use server';

import { auth } from '@/lib/auth';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets user profile by user ID.
 * Server action for retrieving user profile data.
 * 
 * @param userId - User ID to fetch
 * @returns User profile or error
 */
export async function getUserProfile(userId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { failed: true, errors: { _errors: ['Unauthorized'] } };
    }

    // Only allow users to fetch their own profile (or admins in future)
    if (session.user.id !== userId) {
      return { failed: true, errors: { _errors: ['Forbidden'] } };
    }

    const db = getDatabaseClient();
    const profile = await db.users.getUserProfile(userId);

    if (!profile) {
      return { failed: true, errors: { _errors: ['User not found'] } };
    }

    return { failed: false, profile };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return { failed: true, errors: { _errors: ['Failed to fetch user profile'] } };
  }
}
