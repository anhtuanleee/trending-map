---
name: evolve-community-map
description: Implement or review Trending Map reports, incidents, events, alerts, confirmations, trust status, authentication gates, MapLibre rendering, or Supabase/PostGIS integration.
---

# Evolve Community Map

1. Read `references/domain-invariants.md` before changing behavior.
2. Trace the full slice: shared contract, SQL/RPC or Edge Function, service, domain hook, UI.
3. Keep public map reads anonymous and contribution commands authenticated.
4. Enforce identity/privacy rules at the database boundary, not only in UI.
5. Use bounding-box queries and server-side filters for map data.
6. Use stable query keys and invalidate affected detail and viewport caches.
7. Preserve idempotency for every user command that may be retried.
8. Model status transitions explicitly; do not infer official verification in the client.
9. Verify demo and configured-Supabase modes.
