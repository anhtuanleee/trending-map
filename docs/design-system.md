# Trending Map mobile design system

## Direction

The mobile UI uses the **City Pulse** direction: bright community signals layered over a map-first
canvas. The map stays legible while category, severity, verification, and the selected report carry
the visual emphasis.

Rules:

- Use dark ink surfaces and signal-lime accents for high-attention product moments.
- Use category color for recognition and semantic severity color for urgency; never conflate them.
- Prefer tinted surfaces and elevation over borders around every element.
- Reserve translucent map surfaces for floating controls. Content-heavy sheets stay opaque.
- Use `800` only for important headings/actions and `400–700` for supporting copy.
- Keep every interactive target at least 44 by 44 points.

## Tokens

The source of truth is `packages/ui-tokens/src/index.ts`; mobile imports it through `@/theme`.

### Core palette

| Role            | Value     |
| --------------- | --------- |
| Primary         | `#0AA77A` |
| Signal accent   | `#C9F45D` |
| Ink             | `#09251E` |
| Canvas          | `#F3F8F6` |
| Surface         | `#FFFFFF` |
| Event           | `#825DF5` |
| Weather/info    | `#3A8DFF` |
| Traffic/warning | `#FF8A3D` |
| Danger          | `#F0445E` |

Radius steps are `10 / 14 / 18 / 24 / 32 / pill`. Spacing keeps the four-point base and adds
`20` and `40` for composed layouts.

## Shared mobile primitives

`apps/mobile/src/components/ui` owns reusable presentation:

- `AppButton`: primary, secondary, accent, ghost, and danger actions.
- `IconButton`: map-safe square control with selected/elevated states.
- `SectionLabel`: consistent uppercase section hierarchy.
- `StatusBadge`: distinct unverified, community, official, and disputed treatments.

Feature-specific map markers, report cards, sheets, and subscription surfaces remain colocated in
their feature until another feature has a real reuse case.

## Screen hierarchy

1. Map is the immersive home surface; controls float and the selected report suppresses competing
   actions.
2. Nearby/recent content uses large-radius bottom sheets with a visible drag handle.
3. Report detail uses a bright live hero and a persistent contribution action bar.
4. Report creation uses progress framing, recognizable category cards, and a high-contrast submit
   action.
5. Auth/account/subscription use the same dark hero plus signal-accent language without gating
   public safety data.

## Accessibility and motion

- Do not encode category, severity, or verification with color alone; retain icon and text labels.
- Maintain readable opaque backgrounds for long copy and error messages.
- Press feedback uses opacity plus a small scale change; future spring motion must respect reduced
  motion settings.
- Validate dynamic text, screen reader labels, contrast, and safe areas on both Android and iOS.
