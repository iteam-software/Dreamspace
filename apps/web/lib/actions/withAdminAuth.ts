import { User } from 'next-auth';
import { auth } from '@/lib/auth';

/**
 * Wraps a server action to require admin authentication.
 * 
 * @param action - The server action to wrap
 * @returns The wrapped action that checks admin authentication before executing
 * 
 * @throws Error with message 'Unauthorized' if user is not authenticated.
 * @throws Error with message 'Forbidden - Admin access required' if user is not an admin.
 * 
 * @example
 * ```typescript
 * export const myAdminAction = withAdminAuth(async (user, ...args) => {
 *   // user object is guaranteed to be an admin here
 *   // ... your action logic
 * });
 * ```
 */
export function withAdminAuth<TArgs extends unknown[], TReturn>(
  action: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await auth();

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const user = session.user as User & { roles?: { admin?: boolean } };
    if (!user.roles?.admin) {
      throw new Error('Forbidden - Admin access required');
    }

    return action(session.user, ...args);
  };
}
