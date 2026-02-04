import { z } from 'zod';
import { formatZodError } from './formatZodError';
import { createActionError } from './createActionError';

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
