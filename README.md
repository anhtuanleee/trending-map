# Trending Map

Community-powered live map for local events, incidents, and official alerts.

The product is currently presented as **Mạch Phố** in the mobile and admin UI.

## Documentation

Start with [`docs/README.md`](docs/README.md) for the current feature matrix, FE–BE architecture,
mobile structure, authentication/authorization, data model, API contracts, development guide, and
roadmap. The docs distinguish working end-to-end features from foundations and planned work.

## What is included

- Expo React Native app with guest-first browsing, map clustering, auth gate, and report composer.
- Next.js moderation dashboard foundation.
- Shared TypeScript/Zod contracts.
- Supabase migrations with PostGIS, RLS, public read functions, trust updates, and seed data.
- Supabase Edge Functions for report submission and community confirmation.

## Repository layout

```text
apps/mobile         Expo application
apps/admin          Moderation dashboard
packages/contracts  Shared schemas and types
packages/ui-tokens  Design tokens shared across clients
supabase             Database migrations, seed and Edge Functions
```

## Getting started

1. Install Node.js 22+ and pnpm 11+.
2. Copy environment examples in each app.
3. Run `pnpm install`.
4. Run `pnpm dev:mobile` or `pnpm dev:admin`.

The mobile app works in demo mode without Supabase credentials. MapLibre requires an Expo development build rather than Expo Go.

## Commands

```bash
pnpm typecheck
pnpm test
pnpm dev:mobile
pnpm dev:admin
pnpm build:admin
```

## Branch convention

Feature work uses `feat/(...)`, for example `feat/(community-map-foundation)`.

## Mobile architecture and AI guidance

The Expo app keeps file-based routes in `apps/mobile/app` and separates reusable UI, domain hooks,
external services, providers, and theme access under `apps/mobile/src`. Project-specific agent
instructions, portable skills, and focused agent roles live in:

```text
AGENTS.md
apps/mobile/src/AGENTS.md
apps/mobile/src/skills/
apps/mobile/src/agents/
```

The structure adapts separation-of-concerns patterns from TheCodingMachine and Ignite while retaining
Expo Router, TanStack Query, Supabase/PostGIS, and MapLibre.
