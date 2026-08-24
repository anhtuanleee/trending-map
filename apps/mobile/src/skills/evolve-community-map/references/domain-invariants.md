# Community map domain invariants

## Access matrix

| Capability                             | Guest | Authenticated member | Moderator |
| -------------------------------------- | ----- | -------------------- | --------- |
| Browse public map/details              | Yes   | Yes                  | Yes       |
| Create/confirm/comment                 | No    | Yes                  | Yes       |
| Follow area/register push              | No    | Yes                  | Yes       |
| Read reporter identity/trust internals | No    | Own data only        | Yes       |
| Moderate reports/audit data            | No    | No                   | Yes       |

## Data rules

- Reporter identity and `trust_score_internal` never enter public views or RPC results.
- `anonymous_publicly` hides attribution from users but keeps `created_by` for abuse controls.
- Confirmation commands are unique per user/report and retry-safe.
- Coordinates stay in WGS84 (`SRID 4326`) and must be range validated.
- Only active or monitoring, non-expired reports appear in viewport results.
- Official verification is moderator/source controlled; community counts cannot overwrite it.

## Map rules

- Cluster point data in the map engine; do not mount hundreds of React marker views.
- Fetch by viewport and filter by category/time/status on the server.
- Keep full report descriptions and media out of the initial viewport payload.
