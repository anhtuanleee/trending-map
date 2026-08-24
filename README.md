# Trending Map

Community-powered live map for local events, incidents, and official alerts.

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
