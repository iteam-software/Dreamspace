# Dreamspace Monorepo Refactoring Status

## ✅ Completed

### Phase 1: Monorepo Infrastructure (DONE)
- [x] Created pnpm workspace configuration
- [x] Created Turborepo configuration
- [x] Set up root package.json with monorepo scripts
- [x] Created directory structure:
  - `apps/web` - NextJS application
  - `packages/shared` - Shared types and utilities
  - `packages/database` - Cosmos DB repositories

### Phase 2: Shared Package (DONE)
- [x] Created TypeScript types for all database documents:
  - UserProfile
  - DreamsDocument (dreamBook + templates)
  - CurrentWeekDocument, PastWeeksDocument
  - ConnectDocument
  - ScoringDocument
  - TeamDocument, CoachingAlertDocument, MeetingAttendanceDocument
  - PromptDocument
- [x] Set up TypeScript configuration
- [x] Built and tested package

### Phase 3: Database Package (DONE)
- [x] Migrated BaseRepository to TypeScript
- [x] Created typed repositories:
  - UserRepository
  - DreamsRepository
  - WeeksRepository
  - ConnectsRepository
  - ScoringRepository
  - TeamsRepository
  - PromptsRepository
- [x] Created DatabaseClient singleton
- [x] Added proper TypeScript type handling
- [x] Built and tested package

### Phase 4: NextJS App Setup (DONE)
- [x] Created NextJS 15 app with App Router
- [x] Configured TypeScript
- [x] Set up Tailwind CSS
- [x] Configured NextAuth with Azure AD
- [x] Created auth middleware
- [x] Set up environment variables template

### Phase 5: Server Actions Foundation (IN PROGRESS)
- [x] Created services directory structure
- [x] Created first server action (getUserProfile)
- [ ] Migrate remaining ~45 Azure Functions to server actions

## 🚧 In Progress

### Azure Functions → Server Actions Migration (0 of 45)

#### High Priority (Core User Flow)
- [ ] `getUserData` - Load complete user dashboard data
- [ ] `saveUserData` - Update user profile
- [ ] `getCurrentWeek` - Get current week goals
- [ ] `saveCurrentWeek` - Update current week goals
- [ ] `getDreams` → `services/dreams/getDreams.ts`
- [ ] `saveDreams` → `services/dreams/saveDreams.ts`

#### Week Management
- [ ] `weeklyRollover` → `services/weeks/weeklyRollover.ts`
- [ ] `archiveWeek` → `services/weeks/archiveWeek.ts`
- [ ] `getPastWeeks` → `services/weeks/getPastWeeks.ts`
- [ ] `syncCurrentWeek` → `services/weeks/syncCurrentWeek.ts`

#### Dreams & Goals
- [ ] `saveItem` → `services/dreams/saveItem.ts`
- [ ] `deleteItem` → `services/dreams/deleteItem.ts`
- [ ] `getItems` → `services/dreams/getItems.ts`
- [ ] `batchSaveItems` → `services/dreams/batchSaveItems.ts`
- [ ] `uploadDreamPicture` → `services/dreams/uploadDreamPicture.ts`

#### Connects
- [ ] `getConnects` → `services/connects/getConnects.ts`
- [ ] `saveConnect` → `services/connects/saveConnect.ts`
- [ ] `deleteConnect` → `services/connects/deleteConnect.ts`

#### Scoring
- [ ] `getScoring` → `services/scoring/getScoring.ts`
- [ ] `saveScoring` → `services/scoring/saveScoring.ts`
- [ ] `getAllYearsScoring` → `services/scoring/getAllYearsScoring.ts`

#### Team Management
- [ ] `getTeamRelationships` → `services/teams/getTeamRelationships.ts`
- [ ] `getTeamMetrics` → `services/teams/getTeamMetrics.ts`
- [ ] `updateTeamInfo` → `services/teams/updateTeamInfo.ts`
- [ ] `updateTeamName` → `services/teams/updateTeamName.ts`
- [ ] `updateTeamMission` → `services/teams/updateTeamMission.ts`
- [ ] `assignUserToCoach` → `services/teams/assignUserToCoach.ts`
- [ ] `unassignUserFromTeam` → `services/teams/unassignUserFromTeam.ts`
- [ ] `promoteUserToCoach` → `services/teams/promoteUserToCoach.ts`
- [ ] `replaceTeamCoach` → `services/teams/replaceTeamCoach.ts`
- [ ] `getCoachingAlerts` → `services/teams/getCoachingAlerts.ts`
- [ ] `saveCoachMessage` → `services/teams/saveCoachMessage.ts`

#### Meetings
- [ ] `getMeetingAttendance` → `services/teams/getMeetingAttendance.ts`
- [ ] `saveMeetingAttendance` → `services/teams/saveMeetingAttendance.ts`
- [ ] `scheduleMeetingWithCalendar` → `services/teams/scheduleMeetingWithCalendar.ts`
- [ ] `updateTeamMeeting` → `services/teams/updateTeamMeeting.ts`

#### Prompts & AI
- [ ] `getPrompts` → `services/prompts/getPrompts.ts`
- [ ] `savePrompts` → `services/prompts/savePrompts.ts`
- [ ] `restorePrompt` → `services/prompts/restorePrompt.ts`
- [ ] `getPromptHistory` → `services/prompts/getPromptHistory.ts`
- [ ] `generateImage` → `services/ai/generateImage.ts`
- [ ] `generateVision` → `services/ai/generateVision.ts`

#### Admin & Utility
- [ ] `getAllUsers` → `services/admin/getAllUsers.ts`
- [ ] `health` → `app/api/health/route.ts`

## 📋 TODO

### Phase 6: Frontend Migration to App Router
- [ ] Create app/layout.tsx (root layout)
- [ ] Migrate Dashboard → app/page.tsx
- [ ] Migrate DreamBook → app/dream-book/page.tsx
- [ ] Migrate DreamConnect → app/dream-connect/page.tsx
- [ ] Migrate Scorecard → app/scorecard/page.tsx
- [ ] Migrate DreamTeam → app/dream-team/page.tsx
- [ ] Migrate PeopleDashboard → app/people/page.tsx
- [ ] Migrate HealthCheck → app/health/page.tsx
- [ ] Create shared components in app/components/

### Phase 7: Shared Utilities Migration
- [ ] Migrate utils to packages/shared/src/utils:
  - dateUtils
  - monthUtils
  - regionUtils
  - goalInstanceBuilder
  - templateValidation
  - categoryMapping
- [ ] Create Zod schemas for validation
- [ ] Migrate error handling utilities

### Phase 8: Build & Deployment
- [ ] Create GitHub Actions workflow for monorepo
- [ ] Configure Vercel deployment for apps/web
- [ ] Test build pipeline
- [ ] Update documentation

### Phase 9: Testing
- [ ] Migrate Vitest tests to Jest (NextJS compatible)
- [ ] Add tests for server actions
- [ ] Add integration tests for key flows
- [ ] Test critical user journeys

### Phase 10: Cleanup
- [ ] Remove old api/ directory (after full migration)
- [ ] Remove old src/ directory (after full migration)
- [ ] Remove old Vite configuration
- [ ] Update README.md
- [ ] Create migration guide

## Architecture Decisions Made

### 1. Monorepo Structure
- **Choice**: Turborepo + pnpm workspaces
- **Rationale**: Industry standard, excellent caching, simple dependency management

### 2. Database Layer
- **Choice**: Shared `@dreamspace/database` package with repository pattern
- **Rationale**: Reusable across apps, type-safe, maintains existing patterns

### 3. Authentication
- **Choice**: NextAuth v5 with Azure AD provider
- **Rationale**: Native NextJS integration, maintains Azure AD, simpler than MSAL

### 4. Server Actions vs API Routes
- **Choice**: Server Actions for mutations, API routes only for webhooks/external
- **Rationale**: Lower cognitive load, collocated with UI, automatic serialization

### 5. TypeScript Strict Mode
- **Choice**: Enabled with strict type checking
- **Rationale**: Catch errors early, better DX, self-documenting code

## Migration Strategy

### Incremental Migration Approach
1. Build new infrastructure alongside existing code
2. Migrate function-by-function, testing each
3. Keep old Azure Functions running until full migration
4. Switch over when all functions migrated and tested
5. Clean up old code

### Risk Mitigation
- All business logic preserved (minimal changes)
- Database schema unchanged
- Backward compatibility maintained during transition
- Gradual rollout possible

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run NextJS dev server
pnpm -F @dreamspace/web dev

# Build specific package
pnpm -F @dreamspace/shared build
pnpm -F @dreamspace/database build

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint
```

## Environment Variables

See `apps/web/.env.example` for required environment variables.

## Next Steps

1. Complete server actions migration (45 functions remaining)
2. Migrate frontend pages to App Router
3. Set up CI/CD pipeline
4. Test critical user flows
5. Deploy to staging environment

---

**Last Updated**: Initial setup complete
**Progress**: ~15% complete (infrastructure done, migration pending)
