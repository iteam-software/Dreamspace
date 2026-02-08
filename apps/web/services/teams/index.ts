/**
 * Teams service exports
 * Barrel export for all team-related server actions
 */

// Get operations
export * from './getTeamMetrics';
export * from './getTeamRelationships';
export * from './getMeetingAttendance';

// Form actions (useActionState compatible)
export * from './updateTeamName';
export * from './updateTeamMission';

// Legacy operations
export * from './updateTeamInfo';
export * from './updateTeamMeeting';
export * from './replaceTeamCoach';
export * from './saveMeetingAttendance';
