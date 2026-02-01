import { User } from 'next-auth';
import { z } from 'zod';
import { auth } from '@/lib/auth';

/**
 * Standard action result with error handling.
 * Uses the pattern from Netsurit Architect standards.
 */
export type ActionResult<T = void> = 
  | { failed: false; data: T }
  | { failed: true; errors: { _errors: string[] } | z.ZodFormattedError<unknown> };

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

/**
 * Formats a Zod error into the standard action error format.
 * 
 * @param error - The Zod validation error
 * @returns Formatted error object
 */
export function formatZodError(error: z.ZodError): { _errors: string[] } | z.ZodFormattedError<unknown> {
  return error.format();
}

/**
 * Creates a standard error response for actions.
 * 
 * @param message - Error message or array of messages
 * @returns Standard error object
 */
export function createActionError(message: string | string[]): { failed: true; errors: { _errors: string[] } } {
  return {
    failed: true,
    errors: {
      _errors: Array.isArray(message) ? message : [message],
    },
  };
}

/**
 * Creates a standard success response for actions.
 * 
 * @param data - Data to return
 * @returns Standard success object
 */
export function createActionSuccess<T>(data: T): { failed: false; data: T } {
  return {
    failed: false,
    data,
  };
}

/**
 * Handles errors from server actions with consistent formatting.
 * Differentiates between Zod validation errors and other errors.
 * 
 * @param error - The error to handle
 * @param defaultMessage - Default error message if not a known error type
 * @returns Formatted error response
 * 
 * @example
 * ```typescript
 * try {
 *   const data = schema.parse(formData);
 *   // ... business logic
 *   return createActionSuccess(result);
 * } catch (error) {
 *   return handleActionError(error, 'Failed to create user');
 * }
 * ```
 */
export function handleActionError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): { failed: true; errors: { _errors: string[] } | z.ZodFormattedError<unknown> } {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return {
      failed: true,
      errors: formatZodError(error),
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return createActionError(error.message);
  }

  // Handle unknown errors
  return createActionError(defaultMessage);
}
