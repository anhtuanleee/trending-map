# Mobile architecture reference

## Folder contract

| Layer          | Owns                                               | Must not own                             |
| -------------- | -------------------------------------------------- | ---------------------------------------- |
| `app`          | Route params, presentation mode, route composition | Data fetching, reusable UI, domain rules |
| `components`   | Shared presentational UI                           | Supabase calls, routing decisions        |
| `features`     | Feature-local UI and adapters                      | Cross-feature infrastructure             |
| `hooks/domain` | Query keys, queries, mutations, invalidation       | Raw rendering and MapLibre layers        |
| `services`     | Configured clients and external I/O                | React state or visual feedback           |
| `providers`    | Context composition and session state              | Server-state caching                     |
| `theme`        | Mobile semantic access to shared tokens            | Screen-specific layout                   |

## State selection

- Use TanStack Query for server state.
- Use Context for authentication/session state shared through the tree.
- Use component state for transient UI.
- Add Zustand only for complex cross-route client state with demonstrated need.
- Do not add Redux or MobX solely to resemble another boilerplate.

## Navigation

Keep Expo Router. Route modules must remain discoverable and deep-linkable. Prefer typed route objects for dynamic paths and keep reusable screen bodies outside `app` when they become complex.

## Source basis

- [TheCodingMachine project structure](https://thecodingmachine.github.io/react-native-boilerplate/docs/project-structure): separation of concerns, domain hooks/services, atomic shared UI, theme boundary.
- [Ignite boilerplate](https://docs.infinite.red/ignite-cli/boilerplate/): services, screens, theme, test and E2E organization.
- [Expo Router](https://docs.expo.dev/router/introduction/): file-based routes, typed routes, universal deep links, and production lazy evaluation.
- [Official Expo skills](https://docs.expo.dev/skills/): portable AI instructions for Expo and React Native workflows.
