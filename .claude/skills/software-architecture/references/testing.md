# Testing Standards

## Testing Philosophy

**Pragmatic testing approach**:
- Tests to prove assumptions
- Tests to validate critical business logic
- E2E tests used carefully and sparingly (complex environments)
- **No contrived tests** - don't test for the sake of coverage

## Framework

**Jest** for all testing needs

## What to Test

### Utility Functions (Primary Focus)

```typescript
// utils/formatters.test.ts
import { formatCurrency, formatDate } from './formatters'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })
  
  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
  
  it('handles negative values', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00')
  })
})
```

### Converters & Parsers

```typescript
// utils/parsers.test.ts
import { parseCSV, parseJSON } from './parsers'

describe('parseCSV', () => {
  it('parses valid CSV', () => {
    const csv = 'name,age\nJohn,30\nJane,25'
    expect(parseCSV(csv)).toEqual([
      { name: 'John', age: '30' },
      { name: 'Jane', age: '25' }
    ])
  })
  
  it('handles empty input', () => {
    expect(parseCSV('')).toEqual([])
  })
  
  it('throws on malformed CSV', () => {
    expect(() => parseCSV('invalid')).toThrow()
  })
})
```

### Business Logic

```typescript
// lib/pricing.test.ts
import { calculateDiscount, applyTax } from './pricing'

describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90)
  })
  
  it('handles no discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100)
  })
  
  it('caps at 100% discount', () => {
    expect(calculateDiscount(100, 1.5)).toBe(0)
  })
})
```

### Server Actions (Critical Paths)

```typescript
// services/users/createUser.test.ts
import { createUser } from './createUser'
import { db } from '@myorg/database'

jest.mock('@myorg/database', () => ({
  db: {
    user: {
      create: jest.fn()
    }
  }
}))

describe('createUser', () => {
  it('creates user with valid data', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('name', 'Test User')
    
    ;(db.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
    
    const result = await createUser(null, formData)
    
    expect(result.failed).toBe(false)
    expect(result.data).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
  })
  
  it('returns validation errors for invalid data', async () => {
    const formData = new FormData()
    formData.append('email', 'invalid-email')
    
    const result = await createUser(null, formData)
    
    expect(result.failed).toBe(true)
    expect(result.errors).toBeDefined()
  })
})
```

## Component Testing (Snapshots)

### Snapshot Testing for UX Stability

```typescript
// components/UserCard.test.tsx
import { render } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  it('matches snapshot', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    }
    
    const { container } = render(<UserCard user={user} />)
    expect(container).toMatchSnapshot()
  })
})
```

### Updating Snapshots

**When snapshots change**:

1. Review changes carefully
2. Document in commit message:
   ```
   Update UserCard snapshot
   
   Changes:
   - Added avatar image
   - Changed email display format
   - Updated spacing
   
   Reason: UI redesign per #123
   ```
3. Socialize changes with team (PR description, Slack, etc.)

**Never blindly update snapshots** with `jest -u` without review.

## Mocking Strategy

### Avoid Over-Mocking

**❌ Bad - Testing the compiler**:
```typescript
// Over-mocked - not testing anything real
jest.mock('./database')
jest.mock('./logger')
jest.mock('./validator')
jest.mock('./formatter')

it('creates user', () => {
  // All dependencies mocked - just testing wiring
  expect(mockCreate).toHaveBeenCalled()
})
```

**✅ Good - Testing real code paths**:
```typescript
// Only mock external dependencies
jest.mock('@myorg/database')

it('creates user with valid data', async () => {
  // Real validation, formatting, business logic
  // Only database is mocked
  const result = await createUser(validFormData)
  expect(result.failed).toBe(false)
})
```

### When to Mock

**Mock**:
- External services (databases, APIs, file system)
- Time-dependent code (Date.now(), timers)
- Random generators
- Network requests

**Don't Mock**:
- Pure functions
- Business logic
- Validators
- Formatters
- Your own code (unless integration testing)

## Test Organization

### File Structure

```
src/
├── utils/
│   ├── formatters.ts
│   ├── formatters.test.ts
│   ├── parsers.ts
│   └── parsers.test.ts
├── services/
│   └── users/
│       ├── createUser.ts
│       └── createUser.test.ts
└── components/
    ├── UserCard.tsx
    └── UserCard.test.tsx
```

Test files live alongside source files.

### Test Naming

```typescript
// Describe the unit being tested
describe('formatCurrency', () => {
  // Describe the scenario
  it('formats positive numbers', () => {
    // Assertion
  })
  
  it('handles negative numbers', () => {
    // Assertion
  })
  
  it('throws on invalid input', () => {
    // Assertion
  })
})
```

## Rule of Two Pattern Testing

When generalizing code, write tests to prove original functionality still works:

```typescript
// Step 1: Direct implementation
function calculateShipping(weight: number) {
  return weight * 2.5
}

// Step 2: Second use case appears - generalize
function calculateShipping(weight: number, rate: number = 2.5) {
  return weight * rate
}

// Step 3: Add test for original functionality
describe('calculateShipping', () => {
  it('uses default rate of 2.5', () => {
    // Proves generalization didn't break original
    expect(calculateShipping(10)).toBe(25)
  })
  
  it('accepts custom rate', () => {
    expect(calculateShipping(10, 3)).toBe(30)
  })
})
```

## Jest Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@myorg/(.*)$': '<rootDir>/../$1/src'
  }
}
```

### For React Components

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom'
```

## Running Tests

### Package Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

### CI Pipeline

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: pnpm test:ci
```

## E2E Testing (Playwright)

### When to Use

**Use sparingly** - E2E tests are:
- Slow to run
- Fragile (break on UI changes)
- Require complex test environments
- Expensive to maintain

**Appropriate for**:
- Critical user journeys (signup, checkout)
- Cross-browser compatibility
- Integration of multiple systems

### Example

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign up and log in', async ({ page }) => {
  await page.goto('/signup')
  
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

## Coverage Expectations

**No specific coverage targets** - pragmatic testing means:
- Critical paths tested
- Business logic validated
- Utility functions verified
- Components snapshot-tested for stability

**Don't chase 100% coverage** - it encourages contrived tests.

## Anti-patterns

### ❌ Testing Implementation Details

```typescript
// Bad - testing internal state
it('increments counter', () => {
  const component = new Counter()
  component.increment()
  expect(component._internalCounter).toBe(1) // Brittle
})

// Good - testing behavior
it('displays incremented value', () => {
  render(<Counter />)
  fireEvent.click(screen.getByText('Increment'))
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

### ❌ Mocking Everything

```typescript
// Bad - no real code tested
jest.mock('./everything')
it('does something', () => {
  expect(mockFunction).toHaveBeenCalled()
})
```

### ❌ Snapshot Without Review

```typescript
// Bad - blind update
// Just ran: jest -u
// No review of changes, no documentation
```

### ❌ Testing the Framework

```typescript
// Bad - testing Next.js, not your code
it('redirects to login', () => {
  redirect('/login')
  expect(redirect).toHaveBeenCalledWith('/login')
})
```
