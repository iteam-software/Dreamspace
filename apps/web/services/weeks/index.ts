/**
 * Weeks service exports
 * Barrel export for all week-related server actions
 */

// Get operations
export * from './getCurrentWeek';
export * from './getPastWeeks';

// Form actions (useActionState compatible)
export * from './saveGoal';

// Legacy operations
export * from './saveCurrentWeek';
export * from './syncCurrentWeek';
export * from './archiveWeek';
export * from './weeklyRollover';
