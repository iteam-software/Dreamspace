import { z } from 'zod';

/**
 * Formats a Zod error into the standard action error format.
 * 
 * @param error - The Zod validation error
 * @returns Formatted error object
 */
export function formatZodError(error: z.ZodError): { _errors: string[] } | z.ZodFormattedError<unknown> {
  return error.format();
}
