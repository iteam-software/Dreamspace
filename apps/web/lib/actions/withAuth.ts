import { User } from 'next-auth';
import { auth } from '@/lib/auth';

/**
 * Wraps a server action to require authentication.
 * 
 * @param action - The server action to wrap
 * @returns The wrapped action that checks authentication before executing
 * 
 * @throws Error with message 'Unauthorized' if user is not authenticated.
 *         The error will be caught by the action's error handling and returned as an error state.
 * 
 * @example
 * ```typescript
 * export const myAction = withAuth(async (user, ...args) => {
 *   // user object is guaranteed to be present here
 *   // ... your action logic
 * });
 * ```
 */
export function withAuth<TArgs extends unknown[], TReturn>(
  action: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const session = await auth();

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    return action(session.user, ...args);
  };
}
