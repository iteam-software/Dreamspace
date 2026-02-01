# Dreamspace Monorepo

Modern full-stack application for dream tracking, goal management, and team coaching built with NextJS, TypeScript, and Azure Cosmos DB.

## Architecture

This is a monorepo containing:

- **apps/web** - NextJS 15 App Router application (TypeScript)
- **packages/database** - Cosmos DB repositories and data layer
- **packages/shared** - Shared types, utilities, and schemas

### Tech Stack

- **Frontend**: NextJS 15 (App Router), React 18, TailwindCSS
- **Backend**: NextJS Server Actions, Azure Functions (legacy)
- **Database**: Azure Cosmos DB
- **Auth**: NextAuth v5 with Azure AD
- **Build**: Turborepo, pnpm workspaces
- **Language**: TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Azure account with Cosmos DB

### Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Environment Setup

1. Copy the example environment file:
```bash
cp apps/web/.env.example apps/web/.env.local
```

2. Fill in your Azure credentials:
   - `AZURE_AD_CLIENT_ID`
   - `AZURE_AD_CLIENT_SECRET`
   - `AZURE_AD_TENANT_ID`
   - `COSMOS_ENDPOINT`
   - `COSMOS_KEY`
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)

### Development

```bash
# Run the web app in development mode
pnpm -F @dreamspace/web dev

# Or run all apps simultaneously
pnpm dev

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Build all packages
pnpm build
```

The web app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── apps/
│   └── web/                 # NextJS application
│       ├── app/             # App Router pages & layouts
│       ├── services/        # Server actions
│       ├── lib/             # Utilities & configurations
│       └── public/          # Static assets
├── packages/
│   ├── database/            # Cosmos DB repositories
│   │   └── src/
│   │       ├── repositories/  # Data access layer
│   │       └── client.ts      # Database client singleton
│   └── shared/              # Shared code
│       └── src/
│           ├── types/         # TypeScript type definitions
│           └── utils/         # Utility functions
├── turbo.json               # Turborepo configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
└── package.json             # Root package.json
```

## Code Style Guidelines

This project follows the [Netsurit Architect](/.claude/skills/software-architecture/) standards:

- **One export per file**: Filename matches the export name
- **JSDoc required**: All exports must be documented
- **Functional over OOP**: Prefer pure functions
- **Early returns**: Avoid deep nesting
- **Type-based folders**: Organize by type, not feature
- **Google TypeScript Style**: Industry-standard formatting

## Database Architecture

### Cosmos DB Containers

- **users** - User profiles (partition: userId)
- **dreams** - Dream books & goal templates (partition: userId)
- **currentWeek** - Active week goals (partition: userId)
- **pastWeeks** - Historical week summaries (partition: userId)
- **connects** - Connect records (partition: userId)
- **scoring** - Yearly scoring rollups (partition: userId)
- **teams** - Team relationships (partition: managerId)
- **coaching_alerts** - Coaching alerts (partition: managerId)
- **meeting_attendance** - Meeting records (partition: teamId)
- **prompts** - AI prompt configurations (partition: partitionKey)

## Scripts

```bash
# Development
pnpm dev                     # Run all apps in dev mode
pnpm -F @dreamspace/web dev  # Run only web app

# Building
pnpm build                   # Build all packages
pnpm -F @dreamspace/shared build    # Build specific package

# Testing
pnpm test                    # Run all tests
pnpm type-check              # Type check all packages

# Linting
pnpm lint                    # Lint all packages

# Cleaning
pnpm clean                   # Remove all build artifacts
```

## Deployment

### Vercel (Recommended for NextJS)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Azure (Legacy)

The existing Azure Functions deployment is maintained during migration. See [REFACTORING_STATUS.md](./REFACTORING_STATUS.md) for migration progress.

## Contributing

See [REFACTORING_STATUS.md](./REFACTORING_STATUS.md) for current migration status and roadmap.

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes following code style guidelines
3. Ensure `pnpm type-check` and `pnpm lint` pass
4. Create a pull request targeting `main`
5. CI/CD will run: type-check → lint → build
6. Merge after approval

## Documentation

- [Refactoring Status](./REFACTORING_STATUS.md) - Current migration progress
- [Architecture Guidelines](/.claude/skills/software-architecture/) - Code standards
- [Original README](./README.old.md) - Legacy documentation (if exists)

## License

Private - Internal use only

## Support

For questions or issues, contact the development team.
