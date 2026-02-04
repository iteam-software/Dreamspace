import { z } from 'zod';

/**
 * Standard action result with error handling.
 * Uses the pattern from Netsurit Architect standards.
 */
export type ActionResult<T = void> = 
  | { failed: false; data: T }
  | { failed: true; errors: { _errors: string[] } | z.ZodFormattedError<unknown> };
