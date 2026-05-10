# PRODUCT_SPEC — WanderSync (Travel Planning)

> Product specification for WanderSync's intelligent travel-planning experience.
> This document defines **what we are building and why**.
> For *how* it is built, see [`Architecture.md`](./Architecture.md).
> For change history, see [`change_log/`](./change_log/).

---

## Document Control

| | |
|---|---|
| **Status** | Draft v1 |
| **Owner** | Product (TBD) |
| **Stakeholders** | Eng (backend, frontend, mobile), Design, Data, GTM |
| **Last updated** | 2026-05-10 |
| **Related docs** | `Architecture.md`, `Agent.md`, `fl_product_spec/topics/competitive-analysis.md` |

---

## Table of Contents

1. [Motivation & Problem Statement](#1-motivation--problem-statement)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Personas & Jobs-To-Be-Done](#3-personas--jobs-to-be-done)
4. [Competitive Landscape (summary)](#4-competitive-landscape-summary)
5. [Information Architecture](#5-information-architecture)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Telemetry & Success Metrics](#8-telemetry--success-metrics)
9. [Release Plan: MVP, V2, Future](#9-release-plan-mvp-v2-future)
10. [Risks, Dependencies, Open Questions](#10-risks-dependencies-open-questions)
11. [Glossary](#11-glossary)

---

## 1. Motivation & Problem Statement

### 1.1 The user's lived problem (verbatim distillation)

> *"I save places in Google Maps all the time, but when it's time to plan a
> trip I can't get them out cleanly. Once I have them, the 'shortest loop'
> route is rarely the right one — opening hours, transport mode, and season
> all matter. And by the time I plan, I've forgotten **why** I saved most of
> the places, so I can't prioritise."*

### 1.2 Distilled pain points

| # | Pain | Why it matters | Today's workaround |
|---|---|---|---|
| P1 | **Capture-to-plan gap** — Saved Places live in Google Maps with no clean export to a planner | Hours of manual re-entry; people give up | Copy/paste names into Notion/Sheets |
| P2 | **Naive routing** — Shortest TSP loop ignores hours/season/mode/dwell | Wasted travel days; arriving when closed | Manual Google Maps tab juggling |
| P3 | **Lost intent** — Forget *why* a place was saved | Can't prioritise; FOMO + decision fatigue | Try to retrace browser history |
| P4 | **Mode-mixed logistics** — Walk + transit + drive in one day | Bad sequences cause backtracking | Separate apps per mode |
| P5 | **Seasonality** — Cherry blossoms, ski, fireworks, monsoon-closed | Dream trips ruined by timing | Random blog posts |
| P6 | **Group context loss** (already partially solved by WanderSync) | "Why is this on the list again?" | Group chat scrollback |

### 1.3 North-star user story

> *"I paste my Google Maps Saved list, sketch a few notes per place ('try the
> okonomiyaki — saw it on @kenjilopezalt'), pick my dates and that I'll
> mostly walk + train, and within seconds I get a day-by-day plan that
> respects opening hours, seasonal availability, and realistic walking
> distances — and I can drag-edit it in seconds."*

---

## 2. Goals & Non-Goals

### 2.1 Goals (v1)
- **G1.** Lossless **import** of a user's Google Maps Saved Places.
- **G2.** **Multi-constraint** itinerary generation that beats "shortest loop"
  on a measurable scoring rubric (see §6.4 acceptance criteria).
- **G3.** **Per-place notes** that capture intent (URL, source, free text,
  voice memo) at save-time and at plan-time.
- **G4.** **Day-by-day workspace** that is faster to edit than a spreadsheet
  for a 7-day trip with 25+ saved places.
- **G5.** **Collaboration** via the existing WanderSync trip primitives
  (members, real-time itinerary, chat, voting).

### 2.2 Non-Goals (v1)
- **NG1.** Booking (flights, hotels, activities) — link out only.
- **NG2.** Live turn-by-turn navigation — hand off to Google/Apple Maps.
- **NG3.** AI travel agent that generates trips from scratch with zero user
  input. (Still consider as a v2.)
- **NG4.** Offline editing of itineraries (read-only offline is in scope; see §7).
- **NG5.** Native ride-hailing/transit ticketing.

---

## 3. Personas & Jobs-To-Be-Done

### 3.1 Primary persona — *"Saved-Places Sara"*
- Mid-20s–30s, urban, mobile-first, plans 2–4 leisure trips/year.
- Saves dozens of places across Google Maps, Instagram, TikTok.
- Pain: weeks/months between "save" and "plan" → context loss.

### 3.2 Secondary persona — *"Group-Trip Greg"*
- Plans trips for 3–6 friends/family.
- Needs consensus (already supported by WanderSync voting).
- Pain: aligning preferences and explaining "why this place".

### 3.3 Top JTBD (Jobs-To-Be-Done)
| ID | When… | I want to… | So I can… |
|---|---|---|---|
| J1 | I'm browsing on phone | quickly save a place with a note about *why* | not lose context later |
| J2 | I start planning a trip | pull all relevant saved places into one workspace | stop re-finding everything |
| J3 | I have a list of candidates | get an opening-hours-aware route | not arrive when it's closed |
| J4 | I'm constrained on transport | get a plan that respects walk vs transit vs drive | avoid 90-min Uber gaps |
| J5 | I'm planning months ahead | be warned that things only happen seasonally | not miss the festival |
| J6 | I'm planning with friends | propose, vote, and merge | get group buy-in |
| J7 | I'm on the trip | pull up the plan even with bad signal | not stand on a street corner reloading |

---

## 4. Competitive Landscape (summary)

> Full deep-dive: [`fl_product_spec/topics/competitive-analysis.md`](./fl_product_spec/topics/competitive-analysis.md).

| Product | Strength | Critical gap vs our differentiators |
|---|---|---|
| **Google Maps Lists** | Universal capture, ubiquitous | No itinerary, no route optimisation, painful export |
| **Google Travel** | Flight/hotel aggregation | No saved-places import, no per-day planning of attractions |
| **Wanderlog** | Beautiful day-by-day UI, road-trip focus | Hours displayed but not *enforced* in optimisation; no native Google Maps Saved import |
| **TripIt** | Reservation parsing & alerts | Logistics-only; not built for attraction planning |
| **Roadtrippers** | 300K+ curated POIs | Free tier capped at 3 stops; no opening-hours optimisation |
| **Polarsteps** | Beautiful post-trip journal | Not a planner — captures memories *after*, not intent *before* |
| **ChicTrip** | AI route optimisation | Chinese-only / Taiwan-regional; no Google Maps Saved import |
| **Notion templates** | Flexible, social | Manual everything; no maps, no optimisation |

**Where we win**:
1. **One-click Google Maps Saved import** (URL + Takeout JSON + KML).
2. **Constraint-aware optimiser** — opening hours and season are *hard*
   constraints, not display labels.
3. **Per-place notes at save-time** — capture intent before it evaporates.
4. **Real-time multi-user editing** (already shipped via WanderSync sockets).

---

## 5. Information Architecture

```
User
 └─ TripMember ─┐
                ▼
              Trip ──── Day(s) ──── ItineraryItem(s)
                │                         │
                ├─ PlaceLibrary ─ Place ──┘   (a Place can be planned 0..N times)
                │                  │
                │                  ├─ Note(s)         (text, voice, link, image)
                │                  ├─ Tag(s)          (food, museum, must-see…)
                │                  ├─ Source          (URL, social, friend, blog)
                │                  ├─ OpeningHours    (per weekday + exceptions)
                │                  ├─ SeasonWindow    (e.g. cherry blossom)
                │                  └─ DwellEstimate   (minutes, default by type)
                │
                ├─ Constraint(s)           (hard/soft, see §6.4)
                ├─ TransportPreference     (walk, transit, drive, bike, …)
                └─ Suggestion / Vote / Message  (collab — existing WanderSync)
```

Naming aligns with `frontend/src/types/index.ts` and
`backend/prisma/schema.prisma`. New models in this spec: `Place`,
`PlaceLibrary`, `Note`, `Tag`, `Source`, `OpeningHours`, `SeasonWindow`,
`Constraint`, `TransportPreference`, `Day`.

---

## 6. Functional Requirements

> **Notation.** Each requirement has an ID (`F<group>.<n>`), priority
> (**MUST** / **SHOULD** / **MAY**), and acceptance criteria.

### 6.1 F1 — Import from Google Maps

| ID | Req | Priority |
|---|---|---|
| F1.1 | Import places from a Google Takeout `Saved/Saved Places.json` upload | MUST |
| F1.2 | Import places from a public Google Maps List share URL | MUST |
| F1.3 | Import a single Google Maps place URL via paste | MUST |
| F1.4 | Import KML / GPX files (Google Earth, Pocket Earth, etc.) | SHOULD |
| F1.5 | Bulk paste plain-text list (one place per line) → fuzzy resolve via Places API | SHOULD |
| F1.6 | Browser extension to one-click save from Google Maps | MAY (v2) |
| F1.7 | iOS/Android Share Sheet integration | SHOULD (v2 mobile) |

**Acceptance criteria (F1)**
- A user can upload Takeout JSON of 500 places and see ≥ 95 % resolve to a
  Place with name, address, lat/lng, place_id, and category. Unresolved rows
  are surfaced for manual fix-up.
- All imports are **idempotent** — re-importing the same source does not
  create duplicates (matched on `place_id`, then on `(name + lat,lng)` within
  150 m).
- Imports are **partial-failure tolerant**: a single bad row never aborts the
  whole batch; the user sees a per-row outcome report.
- Imported data flows into the user's **PlaceLibrary** (not a single trip),
  so it can be re-used across trips.
- **Privacy**: imported data is stored only on the user's account; never
  shared without explicit action; user can purge their PlaceLibrary in one
  click; we do **not** send saved places to third parties for ads.

### 6.2 F2 — Place Library

| ID | Req | Priority |
|---|---|---|
| F2.1 | List/grid view with filter by tag, source, country, "unused in any trip" | MUST |
| F2.2 | Map view of all saved places with cluster pins | MUST |
| F2.3 | Bulk select → add to trip / tag / delete | MUST |
| F2.4 | Search by name, note text, tag | MUST |
| F2.5 | Per-place "Add to trip…" picker | MUST |

### 6.3 F3 — Trip & Day Planning Workspace

| ID | Req | Priority |
|---|---|---|
| F3.1 | Drag places from PlaceLibrary onto a Day | MUST |
| F3.2 | Drag-reorder ItineraryItems within a Day and across Days | MUST |
| F3.3 | Show a per-day map with the current sequence and segment travel times | MUST |
| F3.4 | Inline edit dwell time, start time, notes per item | MUST |
| F3.5 | "Auto-arrange Day" button that runs the optimiser (§6.4) on that day only | MUST |
| F3.6 | "Auto-plan Trip" button that runs the optimiser across all days | MUST |
| F3.7 | Undo/redo for any structural change | SHOULD |

### 6.4 F4 — Multi-Constraint Routing Engine

This is the **core differentiator**. The planner is a Vehicle Routing Problem
with Time Windows (**VRP-TW**) variant; suggested implementation is
**Google OR-Tools** with a custom objective. See `Architecture.md` for
engineering choices.

**Inputs**
- Set of `Place`s with: lat/lng, dwell estimate, opening hours, season window,
  category, importance score (user-set 0..3 stars).
- Trip dates and per-day start/end time windows (default 09:00–21:00, editable).
- Transport preferences (mode mix + per-segment caps; e.g. "max 30-min walks").
- Optional fixed anchors (e.g. "lunch at 12:30 here").
- Distance/time matrix from Google Distance Matrix API for the selected modes.

**Constraints**
| ID | Constraint | Type | Notes |
|---|---|---|---|
| C1 | Place must be open during the visit window | **Hard** | Use `OpeningHours` + holiday overrides |
| C2 | Place must be in season on the trip date | **Hard** | `SeasonWindow` with confidence; warn if low confidence |
| C3 | Travel segment ≤ user-set max for chosen mode | **Hard** | e.g. no 90-min walks |
| C4 | Daily start/end window respected | **Hard** | |
| C5 | At least one meal block (60–90 min) per 6 hours | **Soft** | Weight tunable |
| C6 | Minimise total travel time | **Soft** | |
| C7 | Maximise total importance score visited | **Soft** | Weighted by user's star rating |
| C8 | Avoid backtracking (geographic clustering) | **Soft** | |
| C9 | Respect *required* / *forbidden* day pairings | **Hard** | e.g. "museum on rainy day only" |

**Acceptance criteria (F4)**
- Given a benchmark set of 6 sample trips (synthetic + 2 user-recorded),
  the optimiser produces an itinerary that scores **≥ 20 % better** on the
  combined objective than a naive nearest-neighbour TSP loop on the same
  inputs.
- **No hard constraint** is ever silently violated — if no feasible plan
  exists, the user sees an explainer ("Place X cannot fit because Y") and
  suggested relaxations.
- Optimiser runs **< 5 s** for trips up to 7 days × 8 places/day on a
  cold backend; **< 1.5 s** when warm.
- Optimiser is **deterministic** for the same inputs (seed fixed), so users
  can re-run without surprise.

### 6.5 F5 — Transport-Mode Awareness

| ID | Req | Priority |
|---|---|---|
| F5.1 | User selects allowed modes per trip (walk/transit/drive/bike/rideshare/ferry) | MUST |
| F5.2 | Per-segment max time/distance caps | MUST |
| F5.3 | Show segment mode + duration on the map and in the list | MUST |
| F5.4 | Auto-fallback to next mode when primary not feasible (e.g., no transit at 23:00) | SHOULD |
| F5.5 | Honour real transit schedules where available | SHOULD (v2) |

### 6.6 F6 — Seasonality & Opening Hours Intelligence

| ID | Req | Priority |
|---|---|---|
| F6.1 | Pull opening hours from Google Places API at import + on a refresh cadence | MUST |
| F6.2 | Allow user override of hours (a place's posted hours are wrong) | MUST |
| F6.3 | Curated `SeasonWindow` for known seasonal phenomena (cherry blossom, leaf-peeping, ski, monsoon, fireworks) | MUST |
| F6.4 | Warn at import-time if a saved place is **out of season** for the planned trip | MUST |
| F6.5 | Crowd-sourced confirmation of seasonality | MAY (v3) |

### 6.7 F7 — Notes & "Why I Saved This"

| ID | Req | Priority |
|---|---|---|
| F7.1 | Free-text note per place (markdown supported) | MUST |
| F7.2 | Source link with auto-fetched preview (oEmbed for TikTok/IG/YouTube/Twitter) | MUST |
| F7.3 | Voice memo attachment (≤ 60 s) | SHOULD |
| F7.4 | Photo attachment (drag-drop, paste, mobile camera) | SHOULD |
| F7.5 | Note **at save-time** (zero-friction quick-add) and at **plan-time** | MUST |
| F7.6 | Notes are first-class search targets (F2.4) | MUST |

### 6.8 F8 — Collaboration

Reuses existing WanderSync primitives (`Architecture.md §6`):
- F8.1 Real-time itinerary editing across members. **MUST**
- F8.2 Trip chat. **MUST**
- F8.3 Suggestion + vote on candidate places. **MUST**
- F8.4 Presence indicators. **MUST**
- F8.5 Per-member notes vs shared notes (visibility flag). **SHOULD**

### 6.9 F9 — Offline & On-Trip Mode

| ID | Req | Priority |
|---|---|---|
| F9.1 | Read-only offline view of the active trip (last 30 days) | MUST |
| F9.2 | Cached map tiles for the trip's bounding region | SHOULD |
| F9.3 | Offline edits queued and replayed on reconnect | MAY (v2) |
| F9.4 | "Now/Next" widget — what's the current/next item, with travel ETA | MUST |

### 6.10 F10 — Export & Share

| ID | Req | Priority |
|---|---|---|
| F10.1 | Export day plan to ICS (calendar) | MUST |
| F10.2 | Export trip as PDF (printable + shareable) | MUST |
| F10.3 | Public read-only share link (with privacy toggle) | MUST |
| F10.4 | Export as KML/GeoJSON | SHOULD |
| F10.5 | "Open in Google/Apple Maps" deep links per item | MUST |

---

## 7. Non-Functional Requirements

| Area | Target |
|---|---|
| **Performance — read** | p95 trip page interactive < 2.5 s on 4G mid-range Android |
| **Performance — optimise** | p95 optimiser < 5 s cold / < 1.5 s warm (see F4) |
| **Performance — real-time** | Socket event end-to-end < 250 ms p95 |
| **Availability** | 99.5 % monthly for v1 (single region); 99.9 % v2 (multi-region) |
| **Privacy** | Saved Places never sold/shared; per-user purge endpoint; SOC 2-style controls roadmap |
| **Security** | OWASP ASVS L2; JWT 7-day; bcrypt ≥ 12; rate-limit auth & import; CSP headers |
| **Offline** | Active trip read-only available without network for 14 days post-last-sync |
| **Accessibility** | WCAG 2.1 AA on web; VoiceOver/TalkBack labels on all interactive elements |
| **i18n** | English + Traditional Chinese + Japanese at launch; RTL-ready layout |
| **Timezones** | All times stored UTC; rendered in trip's local TZ |
| **Data residency** | EU users' data in EU region (when v2 multi-region ships) |
| **Browser support** | Latest 2 versions of Chrome, Safari, Edge, Firefox |
| **Mobile** | iOS 16+, Android 11+ for the React Native app (see `Architecture.md §4`) |

---

## 8. Telemetry & Success Metrics

### 8.1 North-star metric
**WAU who publish a trip with ≥ 5 imported places and ≥ 1 note per place.**

### 8.2 Activation funnel
1. Account created
2. First import attempted
3. First import succeeded (≥ 5 places)
4. First note written
5. First trip with ≥ 1 day planned
6. First "Auto-plan" used
7. First share/export

Targets at 30 days post-launch:
- Step 3 ≥ 60 % of step 1
- Step 5 ≥ 40 % of step 1
- Step 6 ≥ 25 % of step 1

### 8.3 Quality metrics
- Import success rate (places resolved / submitted) ≥ 95 %
- Optimiser feasibility rate (a feasible plan returned) ≥ 90 %
- Hard-constraint violations in published trips: **0** (alarm at any > 0)
- Notes per place (median) ≥ 1.5 within 7 days of import

### 8.4 Engagement
- D7/D30 retention of trip-creators
- Median places per trip
- Median time from import → published trip

### 8.5 Telemetry taxonomy (event examples)
- `import.started`, `import.row_resolved`, `import.row_failed`, `import.completed`
- `place.note_added`, `place.source_attached`
- `trip.day_added`, `itinerary.item_added`, `itinerary.item_reordered`
- `optimizer.requested`, `optimizer.completed{score, runtime_ms, infeasible_reason?}`
- `share.created`, `export.pdf`, `export.ics`

All events carry `user_id` (hashed), `trip_id` (where applicable), `client`,
`app_version`. **No raw place data** is included in analytics events.

---

## 9. Release Plan: MVP, V2, Future

### 9.1 MVP (v1)
- F1.1, F1.2, F1.3 (import: Takeout JSON, list URL, single URL)
- F2.1–F2.5 (Place Library)
- F3.1–F3.6 (planning workspace + auto-arrange)
- F4 with constraints C1–C4, C6, C7 (full multi-constraint, simpler scoring)
- F5.1–F5.3 (modes)
- F6.1–F6.4 (hours + curated season windows for top 20 phenomena)
- F7.1, F7.2, F7.5, F7.6 (notes + source previews + search)
- F8.1–F8.4 (collab — already shipped)
- F9.1, F9.4 (read-only offline + Now/Next)
- F10.1, F10.2, F10.3, F10.5 (ICS, PDF, share link, deep links)

### 9.2 V2
- F1.4–F1.7 (KML/GPX, plain-text, browser extension, share-sheet)
- F4 constraints C5, C8, C9
- F5.4, F5.5 (smart fallback, transit schedules)
- F7.3, F7.4 (voice + photo)
- F9.2, F9.3 (cached tiles + offline edits)
- F10.4 (KML/GeoJSON export)
- React Native app (see `Architecture.md §4`)

### 9.3 Future
- AI-generated trip from a one-line prompt ("3 days Kyoto, foodie, autumn")
- Crowdsourced seasonality (F6.5)
- Activity booking partnerships
- Expense tracking & split

---

## 10. Risks, Dependencies, Open Questions

### 10.1 Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google Places API quota / cost | High | High | Cache aggressively; per-place TTL refresh; fall back to OSM Overpass |
| Google ToS limits on Saved Places import | Medium | High | Prefer user-initiated Takeout JSON over scraping; document compliance |
| Optimiser runtime on large trips | Medium | Medium | Solve per-day first; warm-start; cap problem size |
| Seasonality data is sparse / wrong | High | Medium | Curate top 20 in v1; allow user override; show confidence |
| Offline scope creep | Medium | Medium | v1 read-only only; defer queued edits to v2 |

### 10.2 Dependencies
- Google Maps JavaScript API + Places API + Distance Matrix API
- Google Takeout (user-export workflow)
- OR-Tools (or alternative VRP-TW solver) for the optimiser
- Existing WanderSync stack (Next.js, Express, Prisma, Socket.io, Postgres)

### 10.3 Open Questions
1. Do we need a Google OAuth flow now, or is Takeout JSON upload enough for MVP? *(Proposal: Takeout for MVP, OAuth in v2.)*
2. How do we price Distance Matrix calls without surprising users with billing?
3. Do we maintain our own opening-hours cache or always live-query Google?
4. What's the legal posture on storing third-party place metadata?

---

## 11. Glossary

- **Saved Places** — A user's collection of places saved in Google Maps Lists.
- **Place** — A first-class entity in our PlaceLibrary (lat/lng, hours,
  category, notes, tags, source).
- **Trip** — A bounded plan with dates and members.
- **Day** — A trip's atomic planning unit; contains ordered ItineraryItems.
- **ItineraryItem** — A specific scheduled visit to a Place on a Day.
- **VRP-TW** — Vehicle Routing Problem with Time Windows; the algorithm
  family our optimiser belongs to.
- **Hard constraint** — Must hold; violation makes the plan infeasible.
- **Soft constraint** — Weighted in the objective function; can be traded off.
- **Dwell time** — Estimated minutes a user spends at a Place (default by
  category, user-overridable).
- **Source** — The thing that made the user save a Place (URL, social,
  friend, blog).
