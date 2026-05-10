# 0002 — Add PRODUCT_SPEC.md (intelligent travel planning)

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: docs
- **Affects**: all

## Summary
Added a comprehensive `PRODUCT_SPEC.md` at the repo root that defines
WanderSync's intelligent travel-planning experience: motivation,
personas, competitive landscape, functional + non-functional
requirements, telemetry, success metrics, and a phased release plan.

## Why
The existing repo had architecture docs but no product-level source of
truth describing **what** we are building or **why**. Without a PRD,
features drift, scope creeps, and engineers re-derive intent from
sources that no longer exist. This spec also captures three core user
pain points — saved-places import, multi-constraint routing, and lost
intent — that meaningfully differentiate WanderSync from Google Maps,
Wanderlog, TripIt, Roadtrippers, ChicTrip, and Polarsteps.

## How
- New `PRODUCT_SPEC.md` (≈ 3.5k words) with 11 numbered sections, a
  validated TOC, and links to `Architecture.md` and the competitive
  analysis topic file.
- Competitive deep-dive saved at
  `fl_product_spec/topics/competitive-analysis.md`.
- Plan, overview, implementation plan, evidence, and round-1 review
  files preserved under `fl_product_spec/`.
- New domain concepts introduced: `Place`, `PlaceLibrary`, `Note`,
  `Tag`, `Source`, `OpeningHours`, `SeasonWindow`, `Constraint`,
  `TransportPreference`, `Day`. These are not yet in
  `prisma/schema.prisma` — modelling lands with the implementation
  PR(s).

## Migration / Rollout
None. Documentation only.

## Follow-ups
- Wire data-model changes into Prisma in a follow-up PR.
- Spike the OR-Tools VRP-TW optimiser (F4) and validate the < 5 s
  cold-start target.
- Open questions in §10.3 need PM decisions before implementation.
