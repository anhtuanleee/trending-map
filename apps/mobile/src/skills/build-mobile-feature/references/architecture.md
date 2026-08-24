# Mobile architecture reference

## Folder contract

| Layer           | Owns                                                  | Must not own                             |
| --------------- | ----------------------------------------------------- | ---------------------------------------- |
| `app`           | Route params, presentation mode, route composition    | Data fetching, reusable UI, domain rules |
| `components/ui` | Shared presentational UI                              | Supabase calls, routing decisions        |
| `config`        | Branding, build environment, app-wide static settings | React state or feature workflows         |
| `features`      | Vertical slices and their API/hooks/model/screens     | Cross-feature infrastructure             |
| `lib`           | Configured clients and named shared capabilities      | Generic catch-all utility files          |
| `mocks`         | Shared demo fixtures                                  | Production state or secrets              |
| `providers`     | App-wide provider composition                         | Feature-specific session logic           |
| `theme`         | Mobile semantic access to shared tokens               | Screen-specific layout                   |

Within a feature, create `api`, `components`, `domain`, `hooks`, `model`, `screens`, or `lib` only
when files exist for that responsibility. Internal imports are relative. Other features and route
adapters use the feature's public `index.ts`.

Do not create root `utils`, `helpers`, `constants`, or `services` buckets. Configured clients and
shared pure code belong in a named `lib` capability; feature I/O belongs in `features/<name>/api`;
feature constants belong in `features/<name>/model`; environment and branding belong in `config`;
design values belong in `theme`; network shapes belong in shared contracts.

## State selection

- Use TanStack Query for server state.
- Use Context for authentication/session state shared through the tree.
- Use component state for transient UI.
- Add Zustand only for complex cross-route client state with demonstrated need; it is not installed by default.
- Do not add Redux or MobX solely to resemble another boilerplate.

## Navigation

Keep Expo Router. Route modules must remain discoverable and deep-linkable. Prefer typed route objects for dynamic paths and keep reusable screen bodies outside `app` when they become complex.

## Source basis

- [Obytes project structure](https://starter.obytes.com/getting-started/project-structure/): feature-oriented modules, thin Expo Router routes, feature-owned API and UI.
- [Bulletproof React project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md): unidirectional shared → feature → app dependencies and explicit feature boundaries.
- [TheCodingMachine project structure](https://thecodingmachine.github.io/react-native-boilerplate/docs/project-structure): separation of concerns, domain hooks/services, atomic shared UI, theme boundary.
- [Ignite boilerplate](https://docs.infinite.red/ignite-cli/boilerplate/): services, screens, theme, test and E2E organization.
- [Expo Router](https://docs.expo.dev/router/introduction/): file-based routes, typed routes, universal deep links, and production lazy evaluation.
- [Official Expo skills](https://docs.expo.dev/skills/): portable AI instructions for Expo and React Native workflows.
- [RN Rapid Boilerplate](https://github.com/monokaijs/rn-rapid-boilerplate): reference for shared UI, config, i18n, and generic hooks; Redux, manual navigation, custom form state, and generic helper buckets are intentionally not adopted.
