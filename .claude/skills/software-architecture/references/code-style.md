# Code Style Standards

## Base Style Guide

Follow **Google TypeScript Style Guide**: https://google.github.io/styleguide/tsguide.html

This document highlights team-specific conventions and clarifications.

## File Naming

### General Rule: camelCase

```
utils/
├── formatters.ts
├── validators.ts
└── dateHelpers.ts
```

### Exception 1: App Router (kebab-case)

Match URL paths:

```
app/
├── about-us/
│   └── page.tsx          # /about-us
├── user-settings/
│   └── page.tsx          # /user-settings
└── api/
    └── create-user/
        └── route.ts      # /api/create-user
```

### Exception 2: React Components (PascalCase)

```
components/
├── UserCard.tsx
├── NavigationMenu.tsx
└── DashboardWidget.tsx
```

## Export Rules

### One Export Per File

```typescript
// ✅ Good
// users/createUser.ts
export async function createUser() { }

// users/getUser.ts
export async function getUser() { }

// ❌ Bad
// users.ts
export async function createUser() { }
export async function getUser() { }
export async function updateUser() { }
```

### Export Name Matches Filename

```typescript
// formatters.ts
export function formatCurrency() { } // ✅
export function format() { }         // ❌ - doesn't match filename

// UserCard.tsx
export function UserCard() { }       // ✅
export function Card() { }           // ❌ - doesn't match filename
```

## Barrel Pattern (Re-exports)

Use `index.ts` to group and re-export:

```typescript
// services/users/index.ts
export * from './createUser'
export * from './getUser'
export * from './updateUser'
export * from './deleteUser'

// Usage
import { createUser, getUser } from '@/services/users'
```

**Benefits**:
- Clean imports
- Namespace organization
- Easy to refactor internal structure

## Folder Structure

### Type-Based (Not Feature-Based)

```
✅ Good - Type-based
src/
├── components/
│   ├── UserCard.tsx
│   ├── PostCard.tsx
│   └── CommentCard.tsx
├── services/
│   ├── users/
│   ├── posts/
│   └── comments/
├── utils/
│   ├── formatters.ts
│   └── validators.ts
└── types/
    ├── user.ts
    ├── post.ts
    └── comment.ts

❌ Bad - Feature-based
src/
├── users/
│   ├── UserCard.tsx
│   ├── userService.ts
│   ├── userTypes.ts
│   └── userUtils.ts
├── posts/
│   ├── PostCard.tsx
│   ├── postService.ts
│   └── postTypes.ts
```

**Rationale**: Type-based structure reduces cognitive load - developers know exactly where to find components, services, utilities, etc.

## Programming Paradigm

### Functional Over OOP

```typescript
// ✅ Preferred - Functional
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ Avoid - Object-Oriented
class Calculator {
  private items: Item[]
  
  constructor(items: Item[]) {
    this.items = items
  }
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }
}
```

**Exceptions**:
- External library requirements
- Complex stateful logic that benefits from encapsulation
- Framework patterns (React class components - but use functions instead)

## Documentation

### JSDoc Required

```typescript
/**
 * Formats a number as currency in the specified locale
 * 
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @param locale - BCP 47 language tag (defaults to 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'USD') // '$1,234.56'
 * formatCurrency(1234.56, 'EUR', 'de-DE') // '1.234,56 €'
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}
```

**JSDoc must**:
- Describe purpose clearly
- Document all parameters
- Document return value
- Include examples for non-obvious behavior
- **Stay up to date** with code changes

### @deprecated Annotation

**Only use for production APIs**:

```typescript
/**
 * @deprecated Use formatCurrency instead. Will be removed in v2.0
 */
export function oldFormatCurrency() { }
```

**Never deprecate** code in current feature branch:
```typescript
// ❌ Bad - in same feature branch
function tempHelper() { }

/**
 * @deprecated Use tempHelper instead
 */
function helper() { }
```

This is meaningless - just delete the old function.

### Inline Comments

**Only when code doesn't self-describe**:

```typescript
// ✅ Good - explains non-obvious logic
export function calculateTax(amount: number, region: string): number {
  // California has special tax rules for amounts over $1000
  if (region === 'CA' && amount > 1000) {
    return amount * 0.0725 + (amount - 1000) * 0.01
  }
  
  return amount * TAX_RATES[region]
}

// ❌ Bad - frivolous comment
export function add(a: number, b: number): number {
  // Add two numbers together
  return a + b
}
```

**Avoid**:
- Stating the obvious
- Repeating code in English
- Outdated comments (worse than no comments)

### Separate Documentation

Create README.md in folders when:
- Deep folder tree (many nested levels)
- Complex structure that needs explanation
- Backend tooling or packages
- Multiple entry points

```
services/
├── README.md           # Explains service organization
├── users/
│   ├── README.md       # Explains user service specifics
│   ├── index.ts
│   └── ...
```

**README should explain**:
- Purpose of the folder
- How to use code within it
- Where to find specific functionality

### API Documentation

Structure for Swagger/OpenAPI generation:

```typescript
/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 */
export async function POST(request: Request) {
  // Implementation
}
```

Generate docs via command:
```bash
pnpm generate-api-docs
```

### No ADRs

**Architecture Decision Records not required** - document decisions in:
- Code comments (why, not what)
- PR descriptions
- README files
- Design docs (when necessary)

## Import Organization

### Order

1. External libraries
2. Internal packages (workspace)
3. Relative imports (same package)
4. Types (if separate import needed)

```typescript
// External
import { useState } from 'react'
import { z } from 'zod'

// Internal packages
import { db } from '@myorg/database'
import { logger } from '@myorg/shared'

// Relative
import { formatCurrency } from './formatters'
import { validateEmail } from './validators'

// Types
import type { User } from './types'
```

### Path Aliases

Configure TypeScript path aliases:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@myorg/*": ["../packages/*/src"]
    }
  }
}
```

Usage:
```typescript
import { Button } from '@/components/Button'
import { db } from '@myorg/database'
```

## TypeScript Conventions

### Avoid `any`

```typescript
// ❌ Bad
function process(data: any) {
  return data.value
}

// ✅ Good - use unknown and validate
function process(data: unknown) {
  if (isValidData(data)) {
    return data.value
  }
  throw new Error('Invalid data')
}

// ✅ Acceptable with explanation
function legacyAPI(data: any /* TODO: Type after API migration */) {
  return data
}
```

**Exception**: Must have comment explaining why.

### Type Coercion

Use `as unknown as T` pattern when confident:

```typescript
// Type assertion when you know better than compiler
const data = JSON.parse(response) as unknown as User

// Only use when:
// 1. External data source (API, file)
// 2. Runtime validation exists
// 3. Type is correct but compiler can't infer
```

**Be damn confident** about what you're coercing.

### Zod for External Data

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})

type User = z.infer<typeof UserSchema>

// Validate at boundary
const user = UserSchema.parse(externalData)
```

**Always validate** data from:
- APIs
- User input
- Files
- Databases (when schema might be stale)

## Naming Conventions

### Variables & Functions

```typescript
// camelCase
const userName = 'John'
const totalAmount = 100

function calculateTotal() { }
function getUserById() { }
```

### Constants

```typescript
// UPPER_SNAKE_CASE for true constants
const MAX_RETRIES = 3
const API_BASE_URL = 'https://api.example.com'

// camelCase for complex objects/configs
const defaultConfig = {
  retries: 3,
  timeout: 5000
}
```

### Types & Interfaces

```typescript
// PascalCase
type User = {
  id: string
  name: string
}

interface UserRepository {
  findById(id: string): Promise<User>
  create(data: CreateUserData): Promise<User>
}
```

### Enums

```typescript
// PascalCase for enum, UPPER_CASE for values
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}
```

**Prefer union types** over enums:
```typescript
// ✅ Preferred
type UserRole = 'ADMIN' | 'USER' | 'GUEST'

// ❌ Less preferred
enum UserRole { ... }
```

## Formatting

### Line Length

Max 100 characters (enforced by linter).

### Indentation

2 spaces (Google style guide standard).

```typescript
function example() {
  if (condition) {
    doSomething()
  }
}
```

### Trailing Commas

Always use:

```typescript
const obj = {
  a: 1,
  b: 2, // Trailing comma
}

const arr = [
  'one',
  'two', // Trailing comma
]
```

### Semicolons

Required (Google style, Prettier default):

```typescript
const x = 1;
doSomething();
```

### Quotes

Single quotes for strings:

```typescript
const name = 'John'
const greeting = `Hello, ${name}` // Template literals use backticks
```

## Linting & Formatting

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_' 
    }],
    'react/react-in-jsx-scope': 'off', // Next.js handles this
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

### Prettier Configuration

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false
}
```

## Performance Optimizations

### React Hooks

Use `useMemo` and `useCallback` appropriately:

```typescript
'use client'
import { useMemo, useCallback } from 'react'

export function ExpensiveComponent({ items }: Props) {
  // Memoize expensive calculations
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  )
  
  // Memoize callbacks passed to children
  const handleClick = useCallback(
    (id: string) => {
      console.log('Clicked:', id)
    },
    []
  )
  
  return <div>{/* ... */}</div>
}
```

**Next.js doesn't use React Compiler** yet - manual optimization required.

## Code Review Checklist

Before submitting PR:

- [ ] JSDoc on all exported functions
- [ ] One export per file, name matches filename
- [ ] Type-based folder structure
- [ ] No `any` without comment
- [ ] Inline comments only when necessary
- [ ] Functional approach preferred
- [ ] Imports organized correctly
- [ ] Tests for critical paths
- [ ] Snapshot updates documented
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Build succeeds
