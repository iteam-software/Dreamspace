# Frontend Migration Plan: Legacy React → NextJS App Router

**Status**: In Progress  
**Date**: February 2026  
**Goal**: Migrate legacy `/src` React app to modern NextJS App Router in `apps/web`

## Executive Summary

This migration refactors the Dreamspace application from a client-heavy Redux-based React app to a progressive, isomorphic NextJS application using Server Components and React Contexts. The migration maintains all existing functionality while improving performance, maintainability, and deployment readiness.

## Migration Strategy

### 1. State Management Transformation

**From**: Centralized Redux store with 30+ actions  
**To**: Domain-specific React Contexts (6 contexts)

| Context | Responsibility | State |
|---------|---------------|-------|
| `UserContext` | Current user profile | user data, score, stats |
| `DreamContext` | Dream book management | dreams[], yearVision |
| `GoalContext` | Weekly goal tracking | weeklyGoals[] |
| `ConnectContext` | Network connections | connects[] |
| `TeamContext` | Team collaboration | teamInfo, meetings[] |
| `ScoringContext` | Activity scoring | scoringHistory[], allTimeScore |

**Benefits**:
- Reduced cognitive load (separate concerns)
- Better tree-shaking (only load needed contexts)
- Easier testing (isolated state)
- Clearer data flow

### 2. Page Structure Mapping

All 9 legacy pages mapped to NextJS App Router:

| Legacy Route | NextJS Route | Status |
|-------------|--------------|--------|
| `/` (Dashboard) | `/dashboard/page.tsx` | ✅ Stubbed |
| `/dream-book` | `/dream-book/page.tsx` | ✅ Stubbed |
| `/dream-connect` | `/dream-connect/page.tsx` | ✅ Stubbed |
| `/scorecard` | `/scorecard/page.tsx` | ✅ Stubbed |
| `/dream-team` | `/dream-team/page.tsx` | ✅ Stubbed |
| `/people` | `/people/page.tsx` | ✅ Stubbed |
| `/build-overview` | `/build-overview/page.tsx` | ✅ Stubbed |
| `/health` | `/health/page.tsx` | ✅ Stubbed |
| `/labs/adaptive-cards` | `/labs/adaptive-cards/page.tsx` | ✅ Stubbed |

### 3. Component Architecture

**Legacy Pattern**: Three-layer architecture
1. Layout (orchestrator)
2. Custom Hook (business logic)
3. Presentational Components

**New Pattern**: Server-first architecture
1. Server Component Page (data fetching)
2. Client Components (interactivity)
3. Server Actions (mutations)

## Implementation Details

### Phase 1: Contexts ✅

Created 6 domain-specific contexts in `apps/web/lib/contexts/`:

```typescript
// Example: DreamContext
type Dream = {
  id: string;
  title: string;
  category: string;
  progress: number;
  goals?: Goal[];
  // ... more fields
};

type DreamContextState = {
  dreams: Dream[];
  yearVision: string;
  addDream: (dream: Dream) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;
  // ... more actions
};
```

All contexts follow the same pattern:
- Type-safe state and actions
- useState for local state
- Clear mutation methods
- Loading state management

### Phase 2: Pages ✅

All pages created with:
- Server Component by default
- Auth check using `auth()`
- Functional structure (no styling)
- Native HTML elements

Example structure:
```tsx
export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  return (
    <main>
      <DashboardHeader />
      <WeekGoalsWidget />
      <DashboardDreamCard />
    </main>
  );
}
```

### Phase 3: Components - In Progress

**Completed**:
- Dashboard components (3): Header, WeekGoalsWidget, DreamCard
- Shared components (1): Navigation

**Remaining** (80+ components to stub):

#### Dashboard Components ✅
- [x] DashboardHeader
- [x] WeekGoalsWidget  
- [x] DashboardDreamCard

#### Dream Book Components
- [ ] DreamForm (create/edit)
- [ ] DreamGrid (display all)
- [ ] DreamCard (individual card)
- [ ] YearVisionCard (vision statement)
- [ ] DreamRadarChart (analytics)
- [ ] ImageUploadSection
- [ ] FirstGoalSetup

#### Dream Tracker Components
- [ ] DreamTrackerModal (detail view)
- [ ] DreamHeader
- [ ] DreamTabNavigation
- [ ] OverviewTab
- [ ] GoalsTab
- [ ] NotesTab
- [ ] CoachNotesTab
- [ ] HistoryTab

#### Dream Connect Components
- [ ] ConnectionFilters
- [ ] SuggestedConnections
- [ ] RecentConnects
- [ ] ConnectionCard
- [ ] ConnectDetailModal
- [ ] ConnectRequestModal

#### Scorecard Components
- [ ] SummaryView
- [ ] HistoryView
- [ ] YearBreakdownView
- [ ] ActivityCard
- [ ] ProgressCard

#### Dream Team Components
- [ ] TeamMembersSection
- [ ] TeamMemberCard
- [ ] TeamMemberModal
- [ ] MeetingScheduleCard
- [ ] MeetingAttendanceCard
- [ ] RecentlyCompletedDreamsCard
- [ ] MeetingHistoryModal

#### People Dashboard Components
- [ ] PeopleHeader
- [ ] CoachesPanel
- [ ] UsersPanel
- [ ] CoachList
- [ ] CoachCard
- [ ] TeamMemberRow
- [ ] TeamMetrics
- [ ] CoachDetailModal
- [ ] ReplaceCoachModal

#### Shared Components
- [x] Navigation
- [ ] Modal (base)
- [ ] ConfirmModal
- [ ] LoadingSpinner
- [ ] ErrorBoundary
- [ ] Toast notifications

## Data Flow Pattern

### Legacy (Client-Heavy)
```
User Action → Hook → Dispatch → Reducer → Context → 
Component Rerender → Service → API → Update State → 
useAutosave → localStorage
```

### New (Progressive/Isomorphic)
```
Server Component → Server Action (data fetch) → Render →
Client Component (interactive) → User Action → 
Server Action (mutation) → revalidatePath → Rerender
```

## Key Differences

| Aspect | Legacy | New |
|--------|--------|-----|
| Rendering | Client-side only | Server Components + Client Components |
| State | Redux reducer | React Contexts (client) |
| Data Fetching | useEffect + services | Server Actions + fetch |
| Forms | Controlled + React state | Uncontrolled + FormData |
| Validation | Zod schemas | Zod schemas (same) |
| Routing | React Router | NextJS App Router |
| Code Splitting | Lazy imports | Automatic (Next) |

## Migration Phases

### Phase 1: Foundation ✅ (Complete)
- Create context architecture
- Stub all page routes
- Basic component structure

### Phase 2: Component Migration (Current)
- Stub all components with native HTML
- Ensure functional without styling
- Wire contexts to components

### Phase 3: Integration
- Connect server actions to UI
- Implement data fetching
- Add form handling
- Wire up navigation

### Phase 4: Testing & Validation
- Test all user flows
- Verify data persistence
- Check auth flows
- Performance testing

### Phase 5: Styling (Future)
- Apply Tailwind classes
- Match legacy UI
- Responsive design
- Accessibility

## Technical Considerations

### Context Usage Guidelines

**When to use Context:**
- User profile data (needed across app)
- Dreams/goals (modified from multiple places)
- UI state that needs persistence (modals, filters)

**When NOT to use Context:**
- One-off data fetching → use Server Components
- Local component state → use useState
- Form state → use uncontrolled components

### Server vs Client Components

**Use Server Components for:**
- Data fetching
- Static content
- SEO-critical content
- Markdown rendering

**Use Client Components for:**
- Interactivity (clicks, forms)
- Browser APIs (localStorage)
- React hooks (useState, useEffect)
- Context consumers

### Server Actions Pattern

All mutations follow this pattern:
```typescript
'use server';

export async function saveDream(formData: FormData) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return { failed: true, errors: { _errors: ['Unauthorized'] } };
  }

  // 2. Validation
  const data = schema.parse(formData);

  // 3. Business logic
  const db = getDatabaseClient();
  const dream = await db.dreams.save({ ...data, userId: session.user.id });

  // 4. Revalidate
  revalidatePath('/dream-book');

  // 5. Return result
  return { failed: false, dream };
}
```

## File Structure

```
apps/web/
├── app/                          # NextJS App Router
│   ├── dashboard/
│   │   └── page.tsx             # Server Component
│   ├── dream-book/
│   │   └── page.tsx
│   ├── dream-connect/
│   │   └── page.tsx
│   ├── scorecard/
│   │   └── page.tsx
│   ├── dream-team/
│   │   └── page.tsx
│   ├── people/
│   │   └── page.tsx
│   ├── build-overview/
│   │   └── page.tsx
│   ├── health/
│   │   └── page.tsx
│   ├── labs/
│   │   └── adaptive-cards/
│   │       └── page.tsx
│   └── layout.tsx               # Root layout with providers
│
├── components/                   # Client Components
│   ├── dashboard/
│   │   ├── WeekGoalsWidget.tsx
│   │   ├── DashboardDreamCard.tsx
│   │   ├── DashboardHeader.tsx
│   │   └── index.ts
│   ├── dream-book/              # TBD
│   ├── dream-connect/           # TBD
│   ├── scorecard/               # TBD
│   ├── dream-team/              # TBD
│   ├── people/                  # TBD
│   └── shared/
│       ├── Navigation.tsx
│       └── index.ts
│
├── lib/
│   ├── contexts/                # React Contexts
│   │   ├── DreamContext.tsx
│   │   ├── GoalContext.tsx
│   │   ├── UserContext.tsx
│   │   ├── ConnectContext.tsx
│   │   ├── TeamContext.tsx
│   │   ├── ScoringContext.tsx
│   │   ├── AppProviders.tsx
│   │   └── index.ts
│   ├── actions/                 # Server Action utilities
│   └── auth.ts                  # Auth configuration
│
└── services/                     # Server Actions (already exist)
    ├── dreams/
    ├── users/
    ├── weeks/
    ├── teams/
    ├── scoring/
    └── ...
```

## Dependencies

### Keep Same
- `next-auth` - Authentication
- `zod` - Validation
- `zod-form-data` - Form parsing
- `tailwindcss` - Styling (future)

### Remove (Legacy Only)
- `react-router-dom` - Replaced by NextJS router
- Redux (if any) - Replaced by contexts

### Add (Already Added)
- `lucide-react` - Icons
- `canvas-confetti` - Celebrations

## Testing Strategy

### Unit Tests
- Context actions (add, update, delete)
- Server actions (auth, validation, errors)
- Utility functions

### Integration Tests
- Page rendering
- Form submission
- Navigation
- Data persistence

### E2E Tests
- Complete user flows
- Auth flows
- Error handling

## Performance Considerations

1. **Server Components** - Reduce client JS bundle
2. **Parallel Data Fetching** - Use Promise.all for multiple fetches
3. **Streaming** - Use Suspense for progressive loading
4. **Code Splitting** - Automatic with NextJS
5. **Image Optimization** - Use next/image component

## Security Considerations

1. **Auth Checks** - Every server action checks session
2. **Input Validation** - Zod schemas on all inputs
3. **CSRF Protection** - Built into Next.js
4. **SQL Injection** - Using parameterized queries
5. **XSS Protection** - React escapes by default

## Deployment

### Development
```bash
pnpm dev                    # Start dev server
pnpm type-check            # TypeScript validation
pnpm lint                  # ESLint
```

### Production
```bash
pnpm build                 # Build for production
pnpm start                 # Start production server
```

### Environments
- **Local**: Development server
- **Staging**: Azure App Service (staging slot)
- **Production**: Azure App Service or Vercel

## Rollout Plan

### Option 1: Big Bang
- Complete all migration work
- Switch traffic from legacy to new
- Monitor for issues

### Option 2: Gradual (Recommended)
1. Deploy new routes alongside legacy
2. Redirect one route at a time
3. Monitor metrics and errors
4. Roll back if needed
5. Gradually migrate all routes

## Success Metrics

- [ ] All 9 pages functional
- [ ] All user flows working
- [ ] Performance ≥ legacy app
- [ ] Zero critical bugs
- [ ] Type-safe (no TypeScript errors)
- [ ] Accessible (WCAG AA)
- [ ] Tests passing (>80% coverage)

## Next Steps

1. **Immediate**: Complete component stubbing
   - Dream Book components
   - Dream Connect components
   - Scorecard components
   - Dream Team components
   - People components

2. **Short-term**: Wire up data
   - Connect contexts to server actions
   - Implement form handlers
   - Add loading states
   - Error handling

3. **Medium-term**: Polish
   - Add Tailwind styling
   - Responsive design
   - Accessibility improvements
   - Performance optimization

4. **Long-term**: Enhancements
   - Real-time updates (websockets)
   - Offline support (service workers)
   - PWA features
   - Advanced analytics

## Questions & Decisions

### Q: Should we use React Query for server state?
**A**: No, use Server Components + Server Actions. Simpler mental model, less client JS.

### Q: How to handle real-time updates?
**A**: Phase 1: polling with revalidatePath. Phase 2: websockets/SSE if needed.

### Q: What about the existing Azure Functions?
**A**: They're being migrated to Server Actions (see `MIGRATION_GUIDE.md`).

### Q: Should we keep localStorage sync?
**A**: No, Server Components fetch fresh data on each request. Use database as source of truth.

### Q: How to handle optimistic updates?
**A**: Use `useOptimistic` hook for instant feedback, revalidate after server action completes.

## References

- [NextJS App Router Docs](https://nextjs.org/docs/app)
- [Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Netsurit Architecture Standards](/.claude/skills/software-architecture/references/)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Monorepo README](./README.monorepo.md)

---

**Last Updated**: February 4, 2026  
**Author**: GitHub Copilot Agent  
**Reviewers**: TBD
