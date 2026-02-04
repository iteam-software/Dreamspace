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
