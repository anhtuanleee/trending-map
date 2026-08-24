---
name: build-mobile-feature
description: Build or refactor a Trending Map mobile feature, screen, route, component, domain hook, or service while preserving the Expo Router architecture and separation of concerns.
---

# Build Mobile Feature

## Workflow

1. Read `../../AGENTS.md` and `references/architecture.md`.
2. Locate the existing vertical slice before adding folders or dependencies.
3. Define or update shared Zod contracts when the network shape changes.
4. Keep external I/O in the feature `api` layer and remote-state orchestration in feature `hooks`.
5. Keep route files limited to route params, route options, and rendering a screen/feature.
6. Keep feature-private UI colocated; promote UI to `components` only after real reuse.
7. Import mobile design values from `@/theme`, never directly from the token package.
8. Implement loading, empty, error, success, and retry behavior.
9. Run the verify-mobile-change skill before handoff.

Do not create generic root `utils`, `helpers`, or `constants` files. Feature-specific pure logic stays
in the feature `domain`, `lib`, or `model`; shared capabilities and configured clients live under a
named `src/lib` folder.

## Dependency rule

Prefer the current stack. Add a library only when it removes substantial custom code, supports Expo SDK 57 and the New Architecture, and passes an Android production export.
