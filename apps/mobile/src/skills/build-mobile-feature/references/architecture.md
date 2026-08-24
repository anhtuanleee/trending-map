# Mobile architecture reference

## Folder contract

| Layer           | Owns                                                  | Must not own                             |
| --------------- | ----------------------------------------------------- | ---------------------------------------- |
| `app`           | Route params, presentation mode, route composition    | Data fetching, reusable UI, domain rules |
| `components/ui` | Shared presentational UI                              | Supabase calls, routing decisions        |
| `config`        | Branding, build environment, app-wide static settings | React state or feature workflows         |
| `features`      | Vertical slices and their API/hooks/model/screens     | Cross-feature infrastructure             |
| `lib`           | Shared pure capabilities grouped by purpose           | Generic catch-all utility files          |
| `mocks`         | Shared demo fixtures                                  | Production state or secrets              |
| `services`      | Configured clients and external instances             | React state or visual feedback           |
| `providers`     | App-wide provider composition                         | Feature-specific session logic           |
| `theme`         | Mobile semantic access to shared tokens               | Screen-specific layout                   |

Within a feature, create `api`, `components`, `hooks`, `model`, `screens`, or `lib` only when files
exist for that responsibility. Internal imports are relative. Other features and route adapters use
the feature's public `index.ts`.

Do not create root `utils`, `helpers`, or `constants` buckets. Shared pure code belongs in a named
`lib` capability; feature constants belong in `features/<name>/model`; environment and branding
belong in `config`; design values belong in `theme`; network shapes belong in shared contracts.

## State selection

- Use TanStack Query for server state.
- Use Context for authentication/session state shared through the tree.
- Use component state for transient UI.
- Add Zustand only for complex cross-route client state with demonstrated need; it is not installed by default.
- Do not add Redux or MobX solely to resemble another boilerplate.

## Navigation

Keep Expo Router. Route modules must remain discoverable and deep-linkable. Prefer typed route objects for dynamic paths and keep reusable screen bodies outside `app` when they become complex.

## Source basis

- [TheCodingMachine project structure](https://thecodingmachine.github.io/react-native-boilerplate/docs/project-structure): separation of concerns, domain hooks/services, atomic shared UI, theme boundary.
- [Ignite boilerplate](https://docs.infinite.red/ignite-cli/boilerplate/): services, screens, theme, test and E2E organization.
- [Expo Router](https://docs.expo.dev/router/introduction/): file-based routes, typed routes, universal deep links, and production lazy evaluation.
- [Official Expo skills](https://docs.expo.dev/skills/): portable AI instructions for Expo and React Native workflows.
- [RN Rapid Boilerplate](https://github.com/monokaijs/rn-rapid-boilerplate): reference for shared UI, config, i18n, and generic hooks; Redux, manual navigation, custom form state, and generic helper buckets are intentionally not adopted.
