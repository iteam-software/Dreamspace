/**
 * Scoring service exports
 * Barrel export for all scoring-related server actions
 */

// Get operations
export * from './getScoring';
export * from './getAllYearsScoring';

// Form actions (useActionState compatible)
export * from './saveScore';

// Legacy operations
export * from './saveScoring';
