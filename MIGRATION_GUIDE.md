# Migration Guide: Azure Functions → NextJS Server Actions

This guide explains how to migrate Azure Functions to NextJS server actions following the Netsurit Architect standards.

## Overview

Each Azure Function should become a server action in the `apps/web/services/` directory, organized by domain (users, dreams, weeks, etc.).

## Migration Pattern

### Before (Azure Function)

```javascript
// api/getUserData/index.js
const { createApiHandler } = require('../utils/apiWrapper');

module.exports = createApiHandler({
  auth: 'user-access',
  targetUserIdParam: 'bindingData.userId'
}, async (context, req, { provider }) => {
  const userId = context.bindingData.userId;
  
  const profile = await provider.users.getUserProfile(userId);
  
  if (!profile) {
    throw { status: 404, message: 'User not found' };
  }
  
  return profile;
});
```

### After (Server Action)

```typescript
// apps/web/services/users/getUserProfile.ts
'use server';

import { auth } from '@/lib/auth';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * Gets user profile by user ID.
 * Server action for retrieving user profile data.
 * 
 * @param userId - User ID to fetch
 * @returns User profile or error
 */
export async function getUserProfile(userId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { failed: true, errors: { _errors: ['Unauthorized'] } };
    }

    // Authorization check
    if (session.user.id !== userId) {
      return { failed: true, errors: { _errors: ['Forbidden'] } };
    }

    const db = getDatabaseClient();
    const profile = await db.users.getUserProfile(userId);

    if (!profile) {
      return { failed: true, errors: { _errors: ['User not found'] } };
    }

    return { failed: false, profile };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return { failed: true, errors: { _errors: ['Failed to fetch user profile'] } };
  }
}
```

### Barrel Export

```typescript
// apps/web/services/users/index.ts
/**
 * User service exports
 * Barrel export for all user-related server actions
 */
export * from './getUserProfile';
export * from './updateUserProfile';
// ... more exports
```

## Step-by-Step Migration Process

### 1. Identify the Function

Look in `api/` directory. Each subdirectory is typically one function.

### 2. Determine the Service Domain

Categorize the function into one of:
- `users` - User profile operations
- `dreams` - Dream book and goals
- `weeks` - Week management (current, past, rollover)
- `connects` - Connect records
- `scoring` - Scoring operations
- `teams` - Team management
- `prompts` - AI prompts
- `ai` - AI generation (images, vision)
- `admin` - Admin operations

### 3. Create the Server Action File

File naming convention: `{actionName}.ts`

```bash
# Example
apps/web/services/users/updateUserProfile.ts
apps/web/services/dreams/saveDream.ts
apps/web/services/weeks/archiveWeek.ts
```

### 4. Implement the Server Action

#### Required Elements

1. **'use server' directive** at the top
2. **JSDoc comment** describing the function
3. **Authentication check** using `await auth()`
4. **Authorization check** if needed
5. **Database access** via `getDatabaseClient()`
6. **Return pattern**: `{ failed: boolean, ...data }` or `{ failed: boolean, errors: {...} }`
7. **Error handling** with try/catch

#### Template

```typescript
'use server';

import { auth } from '@/lib/auth';
import { getDatabaseClient } from '@dreamspace/database';

/**
 * [Description of what this action does]
 * 
 * @param [parameters] - [description]
 * @returns [description]
 */
export async function actionName(/* parameters */) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { failed: true, errors: { _errors: ['Unauthorized'] } };
    }

    // 2. Authorization (if needed)
    if (/* authorization check */) {
      return { failed: true, errors: { _errors: ['Forbidden'] } };
    }

    // 3. Business logic
    const db = getDatabaseClient();
    const result = await db./* repository */./* method */();

    // 4. Return success
    return { failed: false, data: result };
  } catch (error) {
    console.error('[Action name] failed:', error);
    return { failed: true, errors: { _errors: ['Error message'] } };
  }
}
```

### 5. Add Form Validation (if needed)

For actions that accept form data:

```typescript
'use server';

import { z } from 'zod';
import { zfd } from 'zod-form-data';
import { auth } from '@/lib/auth';
import { getDatabaseClient } from '@dreamspace/database';

const schema = zfd.formData({
  name: zfd.text(z.string().min(1)),
  email: zfd.text(z.string().email()),
});

/**
 * Updates user profile
 */
export async function updateUserProfile(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { failed: true, errors: { _errors: ['Unauthorized'] } };
    }

    // Validate form data
    const data = schema.parse(formData);

    const db = getDatabaseClient();
    const profile = await db.users.upsertUserProfile(session.user.id, data);

    return { failed: false, profile };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { failed: true, errors: error.format() };
    }
    console.error('Failed to update profile:', error);
    return { failed: true, errors: { _errors: ['Failed to update profile'] } };
  }
}
```

### 6. Add Barrel Export

Update `apps/web/services/[domain]/index.ts`:

```typescript
export * from './newAction';
```

### 7. Test the Migration

Create a simple test or use the function in a page:

```typescript
// In a page component
import { actionName } from '@/services/domain';

export default async function Page() {
  const result = await actionName(/* params */);
  
  if (result.failed) {
    return <div>Error: {result.errors._errors.join(', ')}</div>;
  }
  
  return <div>Success!</div>;
}
```

## Common Patterns

### Pattern 1: Simple Data Fetch

```typescript
export async function getData(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { failed: true, errors: { _errors: ['Unauthorized'] } };
  }

  const db = getDatabaseClient();
  const data = await db.repository.get(id);
  
  return { failed: false, data };
}
```

### Pattern 2: Data Mutation

```typescript
export async function updateData(id: string, updates: Partial<Type>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { failed: true, errors: { _errors: ['Unauthorized'] } };
  }

  const db = getDatabaseClient();
  const updated = await db.repository.upsert(id, updates);
  
  // Revalidate cache if needed
  revalidatePath('/path');
  
  return { failed: false, data: updated };
}
```

### Pattern 3: Complex Operation

```typescript
export async function complexOperation(params: ComplexParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return { failed: true, errors: { _errors: ['Unauthorized'] } };
  }

  const db = getDatabaseClient();
  
  // Step 1
  const step1Result = await db.repository1.method();
  
  // Early return if step 1 fails
  if (!step1Result) {
    return { failed: true, errors: { _errors: ['Step 1 failed'] } };
  }
  
  // Step 2
  const step2Result = await db.repository2.method(step1Result);
  
  // Step 3 - parallel operations
  const [data1, data2] = await Promise.all([
    db.repository3.method(),
    db.repository4.method(),
  ]);
  
  return { failed: false, data: { step2Result, data1, data2 } };
}
```

## Migration Checklist

For each Azure Function:

- [ ] Identify the domain (users, dreams, weeks, etc.)
- [ ] Create the server action file with proper naming
- [ ] Add 'use server' directive
- [ ] Add JSDoc documentation
- [ ] Implement authentication check
- [ ] Implement authorization if needed
- [ ] Port business logic (minimize changes)
- [ ] Add proper error handling
- [ ] Use typed database client
- [ ] Return consistent format `{ failed, data/errors }`
- [ ] Add form validation if needed (zod + zod-form-data)
- [ ] Add to barrel export
- [ ] Test the migration
- [ ] Update REFACTORING_STATUS.md

## Tips

1. **Keep business logic identical**: Only change the wrapper, not the core logic
2. **Use early returns**: Reduce nesting with guard clauses
3. **Leverage TypeScript**: The database client is fully typed
4. **Log errors properly**: Use `console.error` for debugging
5. **Test incrementally**: Migrate and test one function at a time
6. **Revalidate when needed**: Use `revalidatePath()` or `revalidateTag()` for cache invalidation

## Example: Complete Migration

See `apps/web/services/users/getUserProfile.ts` for a complete example.

## Questions?

Refer to:
- [Netsurit Architect Guidelines](/.claude/skills/software-architecture/)
- [NextJS Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Refactoring Status](./REFACTORING_STATUS.md)
