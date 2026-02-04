import { User } from 'next-auth';
import { auth } from '@/lib/auth';

/**
 * Wraps a server action to require coach or admin authentication.
 * 
 * @param action - The server action to wrap
 * @returns The wrapped action that checks coach/admin authentication before executing
 * 
 * @throws Error with message 'Unauthorized' if user is not authenticated.
 * @throws Error with message 'Forbidden - Coach or Admin access required' if user is not a coach or admin.
 * 
 * @example
 * ```typescript
 * export const myCoachAction = withCoachAuth(async (user, ...args) => {
 *   // user object is guaranteed to be a coach or admin here
 *   // ... your action logic
 * });
 * ```
 */
export function withCoachAuth<TArgs extends unknown[], TReturn>(
  action: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await auth();

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check if user has coach or admin role
    const user = session.user as User & { roles?: { coach?: boolean; admin?: boolean } };
    if (!user.roles?.coach && !user.roles?.admin) {
      throw new Error('Forbidden - Coach or Admin access required');
    }

    return action(session.user, ...args);
  };
}
