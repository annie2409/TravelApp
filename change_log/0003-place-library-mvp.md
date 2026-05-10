# 0003 — Place Library MVP (Slice 1 of PRODUCT_SPEC.md)

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: feat
- **Affects**: backend, frontend

## Summary
Shipped the foundational Place Library so users can capture places once
and re-use them across trips. Adds Prisma models (`Place`, `PlaceNote`,
`Tag`, `PlaceTag`), REST routes under `/api/places`, a Next.js `/places`
page with list / search / add / detail / per-place markdown notes, and
manual single-URL import (F1.3). Strictly additive: no existing route,
page, or component was modified.

## Why
PRODUCT_SPEC.md F2 + F7 are prerequisites for every later planning
feature: routing (F4), trip wiring (F2.5), and the optimiser all need a
durable, annotated `Place` entity. This slice unblocks them.

## How
- **Schema**: 4 new models + 3 back-relation fields on `User`. Idempotent
  per-user `dedupeKey` (server-computed: `gpid:<id>` or `n:<name>|<lat,lng>`)
  with `@@unique([userId, dedupeKey])` so re-imports collide cleanly.
- **Routes**: `GET/POST/PUT/DELETE /api/places`, `POST /api/places/import-url`,
  nested notes endpoints. Every handler scopes by `req.userId` and returns
  404 (not 403) on cross-user access. Place search covers name, address,
  AND note bodies.
- **URL parser** (`lib/placeParser.ts`): pure function handling bare
  Place IDs, `place_id=` query, `!1s<id>` pattern, full `/maps/place/...`
  URLs, and short links (returns 422 for unresolvable inputs).
- **Frontend**: `/places` page + `PlaceList`, `PlaceCard`, `AddPlaceModal`
  (URL + Manual tabs), `PlaceDetailDrawer` (with hours override), `NoteList`.
- **Tests**: backend 26/26 green (Jest + Supertest with mocked Prisma);
  frontend 7/7 green (RTL).

## Migration / Rollout
Run `npx prisma migrate deploy` to apply
`20260510190000_add_place_library`. No env vars added. No breaking changes.

## Follow-ups
- F7.1 markdown rendering (currently `whitespace-pre-wrap` with TODO).
- Slice 2: F2.5 add-to-trip + F1.1 Takeout JSON import.
- Wire navigation link from dashboard to `/places`.
