/**
 * ID Generator Utilities for DreamSpace
 * Generates short, unique IDs for teams and other entities
 */

/**
 * Generate a short, unique team ID
 * Format: team_XXXXXX (6 alphanumeric chars)
 */
export function generateTeamId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `team_${id}`;
}

/**
 * Generate a short, unique meeting ID
 * Format: mtg_XXXXXXXX (8 alphanumeric chars)
 */
export function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `mtg_${id}`;
}
