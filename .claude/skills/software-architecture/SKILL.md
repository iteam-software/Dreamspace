---
name: software-architecture
description: Enterprise-grade software architecture patterns and standards for TypeScript/NextJS projects. Use when architecting new projects, refactoring existing codebases, designing APIs, setting up monorepos, implementing authentication, data fetching patterns, or establishing team coding standards. Ensures maintainability, deployment readiness, and reduced cognitive load for both AI and human developers.
---

# Software Architecture

## Overview

Engineer maintainable, production-ready TypeScript/NextJS applications following enterprise standards. This skill provides comprehensive architectural guidance for monorepo structure, NextJS App Router patterns, testing strategies, deployment practices, and team collaboration standards.

## Quick Reference

For detailed information on specific topics:
- **Monorepo Structure**: See [references/monorepo.md](references/monorepo.md)
- **NextJS Patterns**: See [references/nextjs-patterns.md](references/nextjs-patterns.md)
- **Testing Standards**: See [references/testing.md](references/testing.md)
- **Code Style**: See [references/code-style.md](references/code-style.md)
- **Anti-patterns**: See [references/anti-patterns.md](references/anti-patterns.md)

## Core Principles

### Maintainability
- Follow Google TypeScript style guide
- One export per file, name matches filename
- Type-based folder structure (not feature-based)
- JSDoc required and kept current
- Documentation where code doesn't self-describe

### Deployment Readiness
- GitHub Actions CI/CD pipeline
- Docker/Docker Compose for containerization
- Azure (preferred T1 cloud provider)
- Vercel for NextJS deployments
- Environment variables via host or GitHub secrets

### Cognitive Load Reduction
- Server Components by default (App Router)
- Functional programming over OOP
- Uncontrolled forms with native validation
- Service pattern for server actions
- Barrel exports for clean imports

## Architecture Decision Framework

When making architectural decisions, evaluate against these criteria:

1. **Does it reduce cognitive load?** (simpler mental model, less context switching)
2. **Is it maintainable?** (team can understand and modify)
3. **Is it deployment-ready?** (works across environments)
4. **Does it follow established patterns?** (consistency across codebase)
5. **Is abstraction justified?** (Rule of Two: only generalize on second use)


## Project Initialization

When starting a new project:

1. **Choose repository strategy**:
   - One monorepo per project (app + CLI + project packages)
   - Separate monorepo for shared packages across projects

2. **Initialize monorepo**:
   ```bash
   pnpm init
   # Create workspace structure
   mkdir -p apps/web apps/cli packages/shared packages/database
   ```

3. **Configure Turborepo**:
   ```json
   // turbo.json
   {
     "pipeline": {
       "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
       "dev": { "cache": false },
       "lint": {},
       "type-check": {}
     }
   }
   ```

4. **Set up workspace protocol** in package.json:
   ```json
   "dependencies": {
     "@myorg/shared": "workspace:*"
   }
   ```

## SDLC Process

### Issue Management
- Maintain org-level GitHub project backlog
- Issues tracked across all repos
- Group into milestones for velocity tracking

### Development Workflow
1. Create feature branch from main
2. Branch resolves one or more issues
3. Open PR: `feature_branch` → `main`
4. CI/CD runs: type-check → lint → build
5. Merge to main triggers deployment

### CI/CD Pipeline

GitHub Actions workflow:
```yaml
name: CI/CD
on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Type Check
        run: pnpm type-check
      - name: Lint
        run: pnpm lint
      - name: Build
        run: pnpm build
```

### Deployment Targets
- **Vercel**: NextJS apps (automatic via platform integration)
- **Azure App Services**: Manual configuration preferred
- **VPS Containers**: Self-hosted GitHub Actions runner → Docker deploy
- **Versioning**: Tag milestones on main branch

## Common Tasks

### Creating a Server Action

```typescript
// services/users/createUser.ts
'use server'

import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { revalidatePath } from 'next/cache'

const schema = zfd.formData({
  email: zfd.text(z.string().email()),
  name: zfd.text(z.string().min(1))
})

export async function createUser(prevState: any, formData: FormData) {
  try {
    const data = schema.parse(formData)
    
    // Business logic
    const user = await db.user.create({ data })
    
    revalidatePath('/users')
    
    return { failed: false, user }
  } catch (error) {
    logger.error('Failed to create user', error)
    
    if (error instanceof z.ZodError) {
      return { failed: true, errors: error.format() }
    }
    
    return { failed: true, errors: { _errors: ['Failed to create user'] } }
  }
}
```

### Setting Up Authentication

Use Auth.js (NextAuth):

```typescript
// auth.ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' }
})
```

### Organizing Services

```
services/
├── users/
│   ├── index.ts          # Re-exports as namespace
│   ├── createUser.ts     # One action per file
│   ├── getUser.ts
│   └── updateUser.ts
└── posts/
    ├── index.ts
    ├── createPost.ts
    └── listPosts.ts
```

```typescript
// services/users/index.ts
export * from './createUser'
export * from './getUser'
export * from './updateUser'
```

Usage:
```typescript
import { createUser, getUser } from '@/services/users'
```

## Resources

This skill includes reference documentation for detailed guidance:

### references/
Comprehensive guides for specific architectural domains:
- `monorepo.md` - Turborepo + pnpm workspace structure
- `nextjs-patterns.md` - App Router, Server Components, data fetching
- `testing.md` - Jest configuration, testing strategies
- `code-style.md` - TypeScript conventions, naming, documentation
- `anti-patterns.md` - Common mistakes to avoid
