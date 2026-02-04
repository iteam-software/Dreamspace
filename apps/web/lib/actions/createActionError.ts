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
