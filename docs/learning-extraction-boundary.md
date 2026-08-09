# Learning Extraction Boundary

The learning feature is merged into WiPPY now, but its code is shaped so it can later move out without a rewrite.

## Movable units

```text
backend/src/learning/domain/**       -> standalone domain package
backend/src/learning/application/**  -> application package
backend/src/learning/adapters/**     -> WiPPY/Firebase adapters
backend/src/learning/http/**         -> replaceable transport
frontend/src/learning/**             -> feature package
/api/learning/*                      -> stable external contract
learning* collections                -> migration namespace
Firebase UID                         -> identity bridge
```

## Stable seams

- Domain code owns selection, memory, evidence, and validation rules.
- Application code owns use cases and ports.
- Adapters own Firebase, Cloud Tasks, deterministic extraction, and challenge templates.
- HTTP code owns authentication, schemas, cache headers, and response mapping.
- Frontend learning code calls only `/api/learning/*` through the learning API client.

## Forbidden coupling

Learning code must not depend on:

- Activity or `activityKnowledge`
- Water tracker models, streaks, or leaderboard logic
- LIFF identity as the durable learning owner
- Scheduler or harness product state
- Review/status/backlog/due-count vocabulary
- Global WiPPY completion state

Architecture tests enforce these boundaries. If a future integration needs one of these dependencies, update the design review first rather than weakening the gate ad hoc.

## Data boundary

Learning data uses `learning*` collections. Permanent ownership is by Firebase UID. Source text is stored only as owner-scoped learning source/segment data, not in operational traces.

## Future extraction path

1. Move `backend/src/learning/domain/**` into a package with no Firebase/Express imports.
2. Move `backend/src/learning/application/**` with explicit ports.
3. Replace adapter implementations for the target runtime.
4. Preserve `/api/learning/*` response contracts or ship a migration adapter.
5. Migrate `learning*` collections with Firebase UID as the identity bridge.
