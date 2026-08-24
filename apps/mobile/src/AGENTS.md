# Mobile source guidance

Use this file as the routing layer for AI-assisted work in `apps/mobile/src`.

## Architecture

The app combines TheCodingMachine's separation-of-concerns model, Ignite's service/theme conventions, and Expo Router's file-based routing:

- `app/`: route adapters only. Read params and render a screen or feature entry point.
- `src/components/`: reusable presentation. Use atomic folders only for genuinely shared UI.
- `src/features/`: feature-local UI, adapters, and services.
- `src/hooks/domain/`: TanStack Query orchestration, query keys, mutations, and invalidation.
- `src/services/`: configured external clients and app-wide infrastructure instances.
- `src/providers/`: React provider composition and client-only session state.
- `src/theme/`: the mobile-facing adapter over shared design tokens.
- `src/skills/`: repeatable implementation playbooks.
- `src/agents/`: focused agent role definitions.

Do not replace Expo Router with a manual React Navigation tree. Expo Router already builds on React Navigation and provides typed, deep-linkable routes.

## Skill routing

- Feature or screen work: read `skills/build-mobile-feature/SKILL.md`.
- Map, reports, confirmations, auth gates, or trust work: also read `skills/evolve-community-map/SKILL.md`.
- Before handoff: read `skills/verify-mobile-change/SKILL.md`.

## Agent routing

- Cross-cutting structure and dependencies: `agents/mobile-architect.agent.md`.
- Map and community-report behavior: `agents/community-map.agent.md`.
- Verification and regression prevention: `agents/release-guardian.agent.md`.

## Non-negotiable invariants

1. Guests may browse public map and report details without authentication.
2. Creating, confirming, commenting, following, or subscribing requires authentication at action time.
3. Public payloads never expose reporter identity, internal trust scores, or moderation data.
4. Validate network payloads at the shared contract or service boundary.
5. Keep server state in TanStack Query. Use Context only for small client/session state.
6. Keep MapLibre rendering concerns inside the map feature and geospatial filtering in PostGIS.
7. Preserve demo mode when Supabase environment variables are absent.

## Required checks

Run from the repository root:

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm build:admin
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 pnpm --filter @trending-map/mobile exec expo export --platform android --output-dir /tmp/trending-map-export
```
