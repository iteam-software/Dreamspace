# Anti-patterns to Avoid

## Performance Anti-patterns

### Missing React Optimizations

**Next.js doesn't use React Compiler** - manual optimization required.

```typescript
// ❌ Bad - re-creates function on every render
export function Component({ onSave }: Props) {
  const handleSave = () => {
    onSave(data)
  }
  
  return <ChildComponent onSave={handleSave} />
}

// ✅ Good - memoized callback
export function Component({ onSave }: Props) {
  const handleSave = useCallback(() => {
    onSave(data)
  }, [data, onSave])
  
  return <ChildComponent onSave={handleSave} />
}
```

```typescript
// ❌ Bad - expensive calculation every render
export function Component({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  return <div>Total: {total}</div>
}

// ✅ Good - memoized calculation
export function Component({ items }: Props) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )
  return <div>Total: {total}</div>
}
```

### N+1 Query Problems

```typescript
// ❌ Bad - N+1 queries
export default async function PostsPage() {
  const posts = await db.post.findMany()
  
  return (
    <div>
      {posts.map(async (post) => {
        const author = await db.user.findUnique({ 
          where: { id: post.authorId } 
        })
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

**If Prisma can't prevent waterfall**, create SQL view:

```sql
CREATE VIEW posts_with_authors AS
SELECT 
  p.*,
  u.name as author_name,
  u.email as author_email
FROM posts p
JOIN users u ON p.author_id = u.id;
```

### Sequential Fetching

```typescript
// ❌ Bad - sequential waterfall
export default async function DashboardPage() {
  const user = await db.user.findUnique({ where: { id: userId } })
  const posts = await db.post.findMany({ where: { userId } })
  const comments = await db.comment.findMany({ where: { userId } })
  
  return <Dashboard user={user} posts={posts} comments={comments} />
}

// ✅ Good - parallel fetching
export default async function DashboardPage() {
  const [user, posts, comments] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.post.findMany({ where: { userId } }),
    db.comment.findMany({ where: { userId } })
  ])
  
  return <Dashboard user={user} posts={posts} comments={comments} />
}
```

### Fetching in Loops

```typescript
// ❌ Bad - fetches in loop
for (const userId of userIds) {
  const user = await db.user.findUnique({ where: { id: userId } })
  users.push(user)
}

// ✅ Good - single query
const users = await db.user.findMany({
  where: { id: { in: userIds } }
})
```

## Server Component Anti-patterns

### Passing Server-Only Data to Client Components

```typescript
// ❌ Bad - Date object can't serialize
export default async function Page() {
  const post = await db.post.findUnique({ where: { id } })
  return <ClientComponent post={post} /> // post.createdAt is Date
}

// ✅ Good - serialize dates
export default async function Page() {
  const post = await db.post.findUnique({ where: { id } })
  return <ClientComponent post={{
    ...post,
    createdAt: post.createdAt.toISOString()
  }} />
}
```

### "use client" at Top of Tree

```typescript
// ❌ Bad - entire page client-side
'use client'

export default function Page() {
  return (
    <div>
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

// ✅ Good - only interactive parts client-side
export default function Page() {
  return (
    <div>
      <Header />
      <InteractiveContent /> {/* Only this is client */}
      <Footer />
    </div>
  )
}
```

### Not Analyzing "use client" Impact

**Before adding "use client"**, find all usages:

```bash
grep -r "from '@/components/MyComponent'" .
```

If many server components import it, consider:
1. Splitting into server + client parts
2. Moving client logic to separate component
3. Passing handlers as props

## Server Action Anti-patterns

### Non-Serializable Returns

```typescript
// ❌ Bad - returns Date, function, class instance
export async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } })
  return {
    ...user,
    createdAt: user.createdAt, // Date object
    greet: () => `Hello ${user.name}`, // Function
    formatter: new DateFormatter() // Class instance
  }
}

// ✅ Good - only serializable primitives
export async function getUser(id: string) {
  const user = await db.user.findUnique({ where: { id } })
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString() // String
  }
}
```

**Serializable types**:
- string, number, boolean, null
- Arrays and objects of serializable types
- Plain objects (JSON-compatible)

**Non-serializable**:
- Date, RegExp, Map, Set
- Functions, class instances
- undefined (use null)
- Symbols, BigInt (convert to string)

### Long-Running Server Actions

```typescript
// ❌ Bad - blocks for minutes
export async function processLargeFile(formData: FormData) {
  const file = formData.get('file')
  const result = await processForHours(file) // Takes 30 minutes
  return { failed: false, result }
}

// ✅ Good - queue for background processing
export async function processLargeFile(formData: FormData) {
  const file = formData.get('file')
  
  await queue.add('process-file', {
    filename: file.name,
    data: await file.arrayBuffer()
  })
  
  return { 
    failed: false, 
    message: 'File queued for processing. Check back later.' 
  }
}
```

**Client-invoked actions must respond in seconds**. Use Vercel Cron for long tasks.

### Skipping Revalidation

```typescript
// ❌ Bad - mutation without revalidation
export async function updateUser(userId: string, data: UserData) {
  await db.user.update({ where: { id: userId }, data })
  return { failed: false }
  // UI won't update automatically!
}

// ✅ Good - revalidate affected paths
export async function updateUser(userId: string, data: UserData) {
  await db.user.update({ where: { id: userId }, data })
  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { failed: false }
}
```

## Abstraction Anti-patterns

### Premature Abstraction

```typescript
// ❌ Bad - abstract before second use case
function createUserFormatter() {
  return {
    format: (user: User) => `${user.name} (${user.email})`,
    formatShort: (user: User) => user.name,
    formatLong: (user: User) => `${user.name} <${user.email}>`
  }
}

// Only used once - unnecessary abstraction

// ✅ Good - direct implementation first
function formatUser(user: User) {
  return `${user.name} (${user.email})`
}

// When second use case appears, then generalize
```

**Rule of Two**: Only abstract when you have two real use cases.

### Over-Engineering

```typescript
// ❌ Bad - complex abstraction for simple task
class UserNameFormatterFactory {
  constructor(private config: FormatterConfig) {}
  
  createFormatter(type: 'short' | 'long'): UserFormatter {
    return new ConcreteFormatter(this.config, type)
  }
}

// ✅ Good - simple function
function formatUserName(user: User, long: boolean = false) {
  return long ? `${user.name} (${user.email})` : user.name
}
```

## Testing Anti-patterns

### Over-Mocking

```typescript
// ❌ Bad - mocking everything, testing nothing
jest.mock('./database')
jest.mock('./logger')
jest.mock('./validator')
jest.mock('./formatter')
jest.mock('./calculator')

it('creates user', () => {
  createUser(data)
  expect(mockCreate).toHaveBeenCalled()
  // Testing the wiring, not the logic
})

// ✅ Good - test real code paths
jest.mock('./database') // Only mock external dependency

it('creates user with valid data', async () => {
  // Real validation, formatting, calculation
  const result = await createUser(validData)
  expect(result.failed).toBe(false)
  expect(mockCreate).toHaveBeenCalledWith(expectedData)
})
```

### Snapshot Updates Without Review

```typescript
// ❌ Bad
// Developer runs: jest -u
// Commits without reviewing changes
// No documentation of what changed or why

// ✅ Good
// 1. Review snapshot diff carefully
// 2. Document changes in commit:
//    "Update UserCard snapshot
//    
//    Changes:
//    - Added avatar image
//    - Updated spacing
//    
//    Reason: UI redesign per #123"
// 3. Socialize with team
```

### Testing Implementation Details

```typescript
// ❌ Bad - testing internal state
it('increments counter', () => {
  const counter = new Counter()
  counter.increment()
  expect(counter._internalState).toBe(1)
})

// ✅ Good - testing behavior
it('displays incremented count', () => {
  render(<Counter />)
  fireEvent.click(screen.getByText('Increment'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

## Monorepo Anti-patterns

### Circular Dependencies

```typescript
// ❌ Bad
// packages/shared/index.ts
import { formatUser } from '@myorg/users'

// packages/users/index.ts
import { logger } from '@myorg/shared'

// Circular dependency!
```

**Solution**: Extract shared code to third package or restructure.

### Hardcoded Versions

```json
// ❌ Bad
{
  "dependencies": {
    "@myorg/shared": "1.2.3"
  }
}

// ✅ Good
{
  "dependencies": {
    "@myorg/shared": "workspace:*"
  }
}
```

### Publishing Before Dependents Ready

```typescript
// ❌ Bad workflow
1. Update @myorg/shared, publish v2.0
2. @myorg/web still depends on v1.0 APIs
3. CI breaks, production fails

// ✅ Good workflow
1. Update @myorg/shared
2. Update @myorg/web in same PR
3. Test together
4. Publish as unit
```

## Type Safety Anti-patterns

### Overuse of `any`

```typescript
// ❌ Bad - bypassing type system
function process(data: any) {
  return data.value.toString()
}

// ✅ Good - proper typing
function process(data: { value: number }): string {
  return data.value.toString()
}

// ✅ Acceptable with justification
function legacyAPI(data: any /* Legacy API, migrating to Zod validation */) {
  return data
}
```

### Type Assertions Without Validation

```typescript
// ❌ Bad - asserting without validation
const user = JSON.parse(response) as User
// What if response isn't a valid User?

// ✅ Good - validate first
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})

const user = UserSchema.parse(JSON.parse(response))
```

### Missing Zod Schemas at Boundaries

```typescript
// ❌ Bad - trusting external data
export async function createUser(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  // No validation!
  await db.user.create({ data: { email, name } })
}

// ✅ Good - validate at boundary
const schema = zfd.formData({
  email: zfd.text(z.string().email()),
  name: zfd.text(z.string().min(1))
})

export async function createUser(formData: FormData) {
  const data = schema.parse(formData) // Throws if invalid
  await db.user.create({ data })
}
```

## State Management Anti-patterns

### Unnecessary Redux

```typescript
// ❌ Bad - Redux for simple client state
const store = configureStore({
  reducer: {
    counter: counterReducer,
    theme: themeReducer
  }
})

// ✅ Good - React Context for simple state
const ThemeContext = createContext<ThemeContextType>(null)

export function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**Redux**: Only with DAMN good reason (complex state, time-travel debugging, etc.)

### Prop Drilling

```typescript
// ❌ Bad - prop drilling through many levels
<App>
  <Layout user={user}>
    <Sidebar user={user}>
      <Menu user={user}>
        <UserAvatar user={user} />
      </Menu>
    </Sidebar>
  </Layout>
</App>

// ✅ Good - context for shared state
export function UserProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

// Components access via hook
function UserAvatar() {
  const { user } = useUser()
  return <img src={user.avatar} />
}
```

## Form Anti-patterns

### Controlled Inputs Everywhere

```typescript
// ❌ Bad - controlled inputs with unnecessary state
export function Form() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  
  return (
    <form>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={age} onChange={e => setAge(e.target.value)} />
    </form>
  )
}

// ✅ Good - uncontrolled with FormData
export function Form() {
  const handleSubmit = async (formData: FormData) => {
    await createUser(formData)
  }
  
  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <input name="name" type="text" required />
      <input name="age" type="number" min={18} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Complex Client Validation

```typescript
// ❌ Bad - complex custom validation UI
export function Form() {
  const [errors, setErrors] = useState({})
  
  const validate = () => {
    const newErrors = {}
    if (!email.includes('@')) newErrors.email = 'Invalid email'
    if (name.length < 2) newErrors.name = 'Name too short'
    setErrors(newErrors)
  }
  
  return (
    <form>
      <input onChange={validate} />
      {errors.email && <CustomErrorUI>{errors.email}</CustomErrorUI>}
    </form>
  )
}

// ✅ Good - native HTML validation
export function Form() {
  return (
    <form>
      <input 
        name="email" 
        type="email" 
        required 
        pattern="[^@]+@[^@]+" 
      />
      <input 
        name="name" 
        type="text" 
        required 
        minLength={2} 
      />
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Documentation Anti-patterns

### Frivolous Comments

```typescript
// ❌ Bad - stating the obvious
// Get the user's name
const name = user.name

// Increment the counter
counter++

// ✅ Good - explaining non-obvious logic
// Use floor division to bucket users by score tier
const tier = Math.floor(score / 100)
```

### Outdated JSDoc

```typescript
// ❌ Bad - JSDoc doesn't match implementation
/**
 * Calculates total with tax
 * @param amount - The amount
 * @returns Total with tax
 */
export function calculateTotal(amount: number, discount: number) {
  // Added discount parameter but didn't update JSDoc!
  return (amount - discount) * 1.1
}

// ✅ Good - keep JSDoc current
/**
 * Calculates total with discount and tax
 * @param amount - The base amount
 * @param discount - The discount to apply
 * @returns Total after discount with 10% tax
 */
export function calculateTotal(amount: number, discount: number) {
  return (amount - discount) * 1.1
}
```

### Meaningless @deprecated in Feature Branch

```typescript
// ❌ Bad - deprecating code never released
// feature-branch
function newHelper() { }

/**
 * @deprecated Use newHelper instead
 */
function oldHelper() { }

// This is meaningless - just delete oldHelper!

// ✅ Good - only deprecate released code
// main branch (production)
/**
 * @deprecated Use formatCurrency from @myorg/shared instead
 * Will be removed in v2.0
 */
export function formatMoney() { }
```

## Caching Anti-patterns

### Not Respecting Browser Cache Headers

```typescript
// ❌ Bad - ignoring no-cache
export async function getData() {
  const cached = await cache.get('data')
  if (cached) return cached
  
  const data = await fetch('/api/data')
  await cache.set('data', data)
  return data
}

// ✅ Good - respect cache-control
export async function getData(request: Request) {
  const cacheControl = request.headers.get('cache-control')
  
  if (!cacheControl?.includes('no-cache')) {
    const cached = await cache.get('data')
    if (cached) return cached
  }
  
  const data = await fetch('/api/data')
  await cache.set('data', data)
  return data
}
```

### Over-Caching Without Invalidation

```typescript
// ❌ Bad - eternal cache without invalidation strategy
export const getUsers = unstable_cache(
  async () => db.user.findMany(),
  ['all-users'],
  { revalidate: false }
)

// What happens when users change?

// ✅ Good - cache with invalidation
export const getUsers = unstable_cache(
  async () => db.user.findMany(),
  ['all-users'],
  { 
    revalidate: false,
    tags: ['users'] 
  }
)

// Invalidate when data changes
export async function createUser(data: UserData) {
  await db.user.create({ data })
  revalidateTag('users')
}
```

## Common Mistakes

### Missing Error Boundaries

```typescript
// ❌ Bad - no error handling
export default function Page() {
  return <DataFetchingComponent />
}

// ✅ Good - error boundary
export default function Page() {
  return (
    <ErrorBoundary fallback={<ErrorUI />}>
      <DataFetchingComponent />
    </ErrorBoundary>
  )
}

// Or use error.tsx in App Router
```

### Not Using TypeScript Strict Mode

```json
// ❌ Bad
{
  "compilerOptions": {
    "strict": false
  }
}

// ✅ Good
{
  "compilerOptions": {
    "strict": true
  }
}
```
