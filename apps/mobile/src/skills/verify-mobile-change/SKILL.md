---
name: verify-mobile-change
description: Validate a Trending Map mobile or shared-code change before commit, including formatting, TypeScript, tests, Expo dependency compatibility, production Metro export, and privacy checks.
---

# Verify Mobile Change

Run from the repository root and stop at the first failure:

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm peers check
pnpm build:admin
EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 pnpm --filter @trending-map/mobile exec expo export --platform android --output-dir /tmp/trending-map-export
git diff --check
```

Then inspect the diff:

- Ensure no `.env`, token, key, or service-role value is staged.
- Ensure public response types omit reporter identity and internal trust fields.
- Ensure new native packages match the Expo SDK compatibility matrix.
- Ensure route changes retain `/`, dynamic report detail, and auth return paths.
- Ensure contribution mutations remain authenticated and idempotent.
- Ensure map queries stay bounded and cache invalidation covers map and detail data.

Summarize commands run, outcomes, and any unverified device-only behavior.
