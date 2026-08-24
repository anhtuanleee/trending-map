# Trending Map agent guidance

This monorepo contains a mobile client, moderation console, shared contracts, and Supabase backend.

- For mobile work, read `apps/mobile/src/AGENTS.md` before editing.
- Treat `packages/contracts` as the client/backend boundary. Change schemas before consumers.
- Preserve guest read access and require authentication only for contributions.
- Run `pnpm format:check`, `pnpm typecheck`, `pnpm test`, and the relevant production build.
- Use feature branches named `feat/(...)`.
