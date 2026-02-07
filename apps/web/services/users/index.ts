/**
 * User service exports
 * Barrel export for all user-related server actions
 */

// Get operations
export * from './getUserProfile';
export * from './getUserData';
export * from './getAllUsers';

// Form actions (useActionState compatible)
export * from './updateProfile';

// Legacy operations
export * from './saveUserData';
export * from './updateUserProfile';
export * from './assignUserToCoach';
export * from './promoteUserToCoach';
export * from './unassignUserFromTeam';
export * from './uploadProfilePicture';
export * from './uploadUserBackgroundImage';
