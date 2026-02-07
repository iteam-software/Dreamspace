/**
 * Dreams service exports
 * Barrel export for all dreams-related server actions
 */

// Legacy bulk operations
export * from './saveDreams';
export * from './uploadDreamPicture';

// Form actions (useActionState compatible)
export * from './saveDream';
export * from './saveYearVision';

// Non-form mutations (deletes, reorders)
export * from './deleteDream';
export * from './mutations';
