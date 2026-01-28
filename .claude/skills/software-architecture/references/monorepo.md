# Monorepo Structure

## Repository Strategy

### Per-Project Monorepo
Each project has its own monorepo containing:
- User-facing applications
- CLI tools for backend maintenance
- Project-specific packages and utilities

**Rationale**: CLI tools frequently share business logic, database models, and utilities with the main application. Keeping them in the same repo ensures code reuse and consistency.

### Shared Packages Monorepo
Separate monorepo for packages consumed across multiple projects:
- Common utilities
- Shared UI components
- Reusable business logic
- Standard configurations

**Publishing**: GitHub private npm registry

## Standard Structure

```
my-project/
├── apps/
│   ├── web/              # NextJS application
│   │   ├── app/          # App Router
│   │   ├── components/   # React components
│   │   ├── services/     # Server actions
│   │   └── package.json
│   └── cli/              # Command-line tool
│       ├── src/
│       ├── commands/
│       └── package.json
├── packages/
│   ├── shared/           # Shared utilities
│   │   ├── src/
│   │   └── package.json
│   ├── database/         # Prisma schema, migrations
│   │   ├── prisma/
│   │   ├── src/
│   │   └── package.json
│   └── types/            # Shared TypeScript types
│       ├── src/
│       └── package.json
├── package.json          # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json         # Base TypeScript config
```

## Configuration Files

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json
```json
{
  "name": "my-project",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^latest",
    "@typescript-eslint/eslint-plugin": "^latest",
    "@typescript-eslint/parser": "^latest",
    "eslint": "^latest",
    "typescript": "^latest"
  }
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

## Workspace Protocol

**Always use workspace protocol** for local package dependencies:

```json
{
  "dependencies": {
    "@myorg/shared": "workspace:*",
    "@myorg/database": "workspace:*"
  }
}
```

**Benefits**:
- Ensures local workspace version is used (no accidental npm registry fetch)
- Turborepo properly tracks dependencies
- Publishing automatically replaces with actual version number
- Prevents version mismatch issues

## Package Naming

Follow scoped package convention:
```
@myorg/shared
@myorg/database
@myorg/ui-components
```

## TypeScript Configuration

### Root tsconfig.json (base)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  }
}
```

### Package-specific tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Common Package Patterns

### Shared Utilities Package

```
packages/shared/
├── src/
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   ├── constants/
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

```json
// package.json
{
  "name": "@myorg/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### Database Package (Prisma)

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── client.ts        # Prisma client instance
│   └── index.ts
├── package.json
└── tsconfig.json
```

```typescript
// src/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

## Dependency Management

### Installation Commands
```bash
# Install dependency in specific package
pnpm add <package> --filter @myorg/web

# Install dev dependency in root
pnpm add -D <package> -w

# Install workspace dependency
pnpm add @myorg/shared --filter @myorg/cli --workspace
```

### Updating Dependencies
```bash
# Update all dependencies
pnpm update -r

# Update specific package
pnpm update <package> -r
```

## Build Order

Turborepo automatically handles build order based on `dependsOn` in turbo.json. Packages are built before apps that depend on them.

```bash
# Builds in correct order: packages first, then apps
pnpm build
```

## Anti-patterns

### ❌ Circular Dependencies
```
packages/shared depends on packages/database
packages/database depends on packages/shared
```

**Solution**: Extract shared types to separate package or restructure dependencies.

### ❌ Hardcoded Versions
```json
{
  "dependencies": {
    "@myorg/shared": "1.2.3"  // Wrong
  }
}
```

**Solution**: Use `workspace:*` protocol.

### ❌ Publishing Before Dependents Ready
Publishing a package before apps/packages that depend on it are updated can break builds.

**Solution**: Update dependents in same PR as package changes.
