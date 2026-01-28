# NextJS Patterns (App Router)

## Architecture Overview

- **App Router** (Next.js 13+)
- **Server Components** by default
- **Server Actions** for mutations and data fetching
- **Client Components** only when needed (interactivity, browser APIs)

## Server Components

### Default Pattern

All components are Server Components unless marked with `'use client'`.

```typescript
// app/users/page.tsx
import { db } from '@myorg/database'

export default async function UsersPage() {
  const users = await db.user.findMany()
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### Data Fetching

**Fetch all data as early as possible** using `Promise.all`:

```typescript
// ✅ Good - parallel fetching
export default async function DashboardPage() {
  const [user, posts, comments] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.post.findMany({ where: { userId } }),
    db.comment.findMany({ where: { userId } })
  ])
  
  return <Dashboard user={user} posts={posts} comments={comments} />
}

// ❌ Bad - sequential waterfall
export default async function DashboardPage() {
  const user = await db.user.findUnique({ where: { id: userId } })
  const posts = await db.post.findMany({ where: { userId } })
  const comments = await db.comment.findMany({ where: { userId } })
  
  return <Dashboard user={user} posts={posts} comments={comments} />
}
```

**Never fetch in loops** - causes request waterfalls:

```typescript
// ❌ Bad - N+1 problem
export default async function PostsPage() {
  const posts = await db.post.findMany()
  
  return (
    <div>
      {posts.map(async (post) => {
        const author = await db.user.findUnique({ where: { id: post.authorId } })
        return <PostCard post={post} author={author} />
      })}
    </div>
  )
}

// ✅ Good - include relation
export default async function PostsPage() {
  const posts = await db.post.findMany({
    include: { author: true }
  })
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} author={post.author} />
      ))}
    </div>
  )
}
```

### Prisma N+1 Prevention

Use `include` or `select` to prevent N+1 queries:

```typescript
// Fetch with relations
const posts = await db.post.findMany({
  include: {
    author: true,
    comments: {
      include: { author: true }
    }
  }
})
```

If Prisma can't prevent waterfall, create SQL view:

```sql
CREATE VIEW post_with_author AS
SELECT 
  p.*,
  u.name as author_name,
  u.email as author_email
FROM posts p
JOIN users u ON p.author_id = u.id;
```

## Client Components

### When to Use

Use `'use client'` only when you need:
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, etc.)
- Third-party libraries requiring client-side

### Placement Strategy

**Place "use client" as low in the tree as possible**:

```typescript
// ❌ Bad - entire page is client-side
'use client'

export default function Page() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <Header />
      <Counter count={count} setCount={setCount} />
      <Footer />
    </div>
  )
}

// ✅ Good - only interactive component is client-side
export default function Page() {
  return (
    <div>
      <Header />
      <Counter />
      <Footer />
    </div>
  )
}

// components/Counter.tsx
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Before Adding "use client"

**Analyze the impact** by finding all usages of the file:

```bash
# Search for imports of the file
grep -r "from '@/components/MyComponent'" .
```

If many server components import it, consider:
1. Splitting into server + client components
2. Passing client-only logic as props
3. Creating wrapper component

### UI Library Pattern (Primer, etc.)

Wrap UI library components in Client Components:

```typescript
// components/ui/Button.tsx
'use client'
import { Button as PrimerButton } from '@primer/react'

export function Button(props: React.ComponentProps<typeof PrimerButton>) {
  return <PrimerButton {...props} />
}
```

Usage in Server Component:
```typescript
import { Button } from '@/components/ui/Button'

export default function Page() {
  return (
    <form action={createUser}>
      <Button type="submit">Create User</Button>
    </form>
  )
}
```

## Server Actions

### Service Organization Pattern

One export per file, organized into services:

```
services/
├── users/
│   ├── index.ts
│   ├── createUser.ts
│   ├── updateUser.ts
│   ├── deleteUser.ts
│   └── getUser.ts
└── posts/
    ├── index.ts
    ├── createPost.ts
    └── listPosts.ts
```

```typescript
// services/users/createUser.ts
'use server'

export async function createUser(prevState: any, formData: FormData) {
  // Implementation
}

// services/users/index.ts
export * from './createUser'
export * from './updateUser'
export * from './deleteUser'
export * from './getUser'
```

### Standard Response Shape

All server actions return consistent structure:

```typescript
type ActionResponse<T = void> = {
  failed: boolean
  errors?: ZodFormattedErrors
  data?: T
}
```

**Use `failed` flag** (not `success`):
```typescript
// ✅ Preferred
if (result.failed) {
  // Handle error
}

// ❌ Avoid
if (!result.success) {
  // Double negative harder to read
}
```

### Complete Server Action Pattern

```typescript
'use server'

import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { revalidatePath } from 'next/cache'
import { db } from '@myorg/database'
import { logger } from '@myorg/shared'

const schema = zfd.formData({
  email: zfd.text(z.string().email()),
  name: zfd.text(z.string().min(1)),
  age: zfd.numeric(z.number().min(18).optional())
})

export async function createUser(prevState: any, formData: FormData) {
  try {
    const data = schema.parse(formData)
    
    const user = await db.user.create({ data })
    
    revalidatePath('/users')
    revalidatePath(`/users/${user.id}`)
    
    return { failed: false, data: user }
  } catch (error) {
    logger.error('Failed to create user', { error })
    
    if (error instanceof z.ZodError) {
      return { 
        failed: true, 
        errors: error.format() 
      }
    }
    
    return { 
      failed: true, 
      errors: { _errors: ['An unexpected error occurred'] } 
    }
  }
}
```

### Response Time Requirements

**Server actions must respond within a few seconds** when invoked from client.

For long-running tasks:
```typescript
'use server'

import { queue } from '@/lib/queue'

export async function processLargeDataset(formData: FormData) {
  const data = schema.parse(formData)
  
  // Queue for background processing
  await queue.add('process-dataset', data)
  
  return { 
    failed: false, 
    message: 'Processing started. You will be notified when complete.' 
  }
}
```

Use Vercel Cron for scheduled/background tasks.

### Serialization Rules

**Only return serializable data**:

```typescript
// ❌ Bad - non-serializable
export async function getUser() {
  const user = await db.user.findUnique({ ... })
  return user // May contain Date objects
}

// ✅ Good - serialize dates
export async function getUser() {
  const user = await db.user.findUnique({ ... })
  return {
    ...user,
    createdAt: user.createdAt.toISOString()
  }
}
```

Never return:
- Functions
- Class instances (unless toJSON() implemented)
- Date objects (convert to string)
- undefined (use null)
- Symbols
- BigInt (convert to string)

### Revalidation Strategy

Always revalidate affected paths:

```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// Revalidate specific path
revalidatePath('/users')

// Revalidate dynamic path
revalidatePath(`/users/${userId}`)

// Revalidate layout (affects all child paths)
revalidatePath('/dashboard', 'layout')

// Revalidate by cache tag
revalidateTag('users')
```

## Forms & Validation

### Uncontrolled Form Pattern

Use native HTML forms with FormData:

```typescript
// app/users/new/page.tsx
import { createUser } from '@/services/users'
import { CreateUserForm } from './CreateUserForm'

export default function NewUserPage() {
  return <CreateUserForm />
}

// app/users/new/CreateUserForm.tsx
'use client'
import { useFormState, useFormStatus } from 'react-dom'
import { createUser } from '@/services/users'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  )
}

export function CreateUserForm() {
  const [state, formAction] = useFormState(createUser, { failed: false })
  
  return (
    <form action={formAction}>
      <input 
        type="email" 
        name="email" 
        required 
        pattern="[^@]+@[^@]+\.[^@]+"
      />
      {state.errors?.email && (
        <span>{state.errors.email._errors[0]}</span>
      )}
      
      <input 
        type="text" 
        name="name" 
        required 
        minLength={1}
      />
      {state.errors?.name && (
        <span>{state.errors.name._errors[0]}</span>
      )}
      
      <SubmitButton />
    </form>
  )
}
```

### Zod Schema to HTML Attributes

Generate HTML validation attributes from Zod schema:

```typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)
})

// Maps to:
<input type="email" name="email" required />
<input type="number" name="age" min={18} max={120} required />
<input 
  type="text" 
  name="username" 
  minLength={3} 
  maxLength={20} 
  pattern="^[a-zA-Z0-9_]+$"
  required 
/>
```

### Client vs Server Validation

**Server validation**: Always required (Zod schema validates FormData)

**Client validation**: 
- Native HTML attributes (required, min, max, pattern)
- Native browser validation feedback
- **Exception**: Context-sensitive help or progressive server error rendering

**No complex client validation UX** - rely on browser defaults.

## State Management

### Client State

**Prefer React Context** for client state:

```typescript
// contexts/UserContext.tsx
'use client'
import { createContext, useContext, useState } from 'react'

type UserContextType = {
  user: User | null
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
```

**Redux**: Only with DAMN good reason. Heavy state machines rarely necessary with Server Components.

### Server State

Use Server Components + Server Actions (no additional library needed):

```typescript
// Server Component handles data fetching
export default async function UsersPage() {
  const users = await db.user.findMany()
  return <UserList users={users} />
}

// Server Action handles mutations
'use server'
export async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } })
  revalidatePath('/users')
  return { failed: false }
}
```

## Progressive Feedback

### Loading States

Use `useFormStatus` for form submissions:

```typescript
'use client'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}
```

Use `useTransition` for non-form actions:

```typescript
'use client'
import { useTransition } from 'react'
import { deleteUser } from '@/services/users'

export function DeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    startTransition(async () => {
      await deleteUser(userId)
    })
  }
  
  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

### Suspense Boundaries

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <PostList />
      </Suspense>
    </div>
  )
}
```

### Optimistic Updates

Use `useOptimistic` for immediate UI updates:

```typescript
'use client'
import { useOptimistic } from 'react'
import { likePost } from '@/services/posts'

export function LikeButton({ postId, initialLikes }: Props) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (state, amount: number) => state + amount
  )
  
  const handleLike = async () => {
    addOptimisticLike(1)
    await likePost(postId)
  }
  
  return (
    <button onClick={handleLike}>
      Like ({optimisticLikes})
    </button>
  )
}
```

### No Toast Notifications

**Avoid toasts** - they create notification spam.

**Preferred**: Inline progressive feedback via form state.

## Caching

### React Cache (In-Flight Deduplication)

Prevent duplicate fetches during single request:

```typescript
import { cache } from 'react'

export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } })
})

// Called multiple times in same request tree - only fetches once
export default async function Page() {
  const user = await getUser('123')
  
  return (
    <div>
      <UserProfile userId="123" /> {/* Will reuse cached result */}
      <UserPosts userId="123" />    {/* Will reuse cached result */}
    </div>
  )
}
```

### Next.js Data Cache

Eternal cache for static/rarely-changing data:

```typescript
import { unstable_cache } from 'next/cache'

export const getSettings = unstable_cache(
  async () => db.settings.findFirst(),
  ['app-settings'],
  {
    revalidate: false, // Never auto-revalidate
    tags: ['settings']
  }
)

// Manually revalidate when settings change
'use server'
export async function updateSettings(data: Settings) {
  await db.settings.update({ ... })
  revalidateTag('settings')
  return { failed: false }
}
```

### Distributed Caching (Redis)

For multi-instance deployments:

```typescript
import { redis } from '@/lib/redis'

export async function getPopularPosts() {
  const cached = await redis.get('popular-posts')
  if (cached) return JSON.parse(cached)
  
  const posts = await db.post.findMany({
    where: { likes: { gt: 100 } },
    orderBy: { likes: 'desc' }
  })
  
  await redis.set('popular-posts', JSON.stringify(posts), 'EX', 3600)
  return posts
}
```

### Browser Cache Headers

Respect client cache preferences:

```typescript
// app/api/data/route.ts
export async function GET(request: Request) {
  const cacheControl = request.headers.get('cache-control')
  
  if (cacheControl?.includes('no-cache')) {
    // Skip cache, fetch fresh
  }
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
```

## Authentication

### Auth.js Pattern

```typescript
// auth.ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@myorg/database'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [GitHub],
  session: { strategy: 'jwt' },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    }
  }
})

// middleware.ts
export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

### Protected Routes

```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return <Dashboard user={session.user} />
}
```

## File Uploads

### Server Action Pattern (Preferred)

```typescript
'use server'

import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File
  
  if (!file) {
    return { failed: true, errors: { _errors: ['No file provided'] } }
  }
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const path = join(process.cwd(), 'uploads', file.name)
  await writeFile(path, buffer)
  
  return { failed: false, path }
}
```

### API Route Fallback

Use API route only if server action not feasible:

```typescript
// app/api/upload/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Handle upload
  
  return NextResponse.json({ success: true })
}
```
