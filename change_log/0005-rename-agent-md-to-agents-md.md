# 0005 — Rename Agent.md → AGENTS.md (single source of truth)

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: docs / refactor
- **Affects**: all

## Summary
Collapsed the previous two-file split (`AGENTS.md` short directory +
`Agent.md` long dev guide) into a single canonical **`AGENTS.md`** at
the repo root. Deleted `Agent.md`. The new `AGENTS.md` contains the
full developer/agent contract (project overview, directory map,
prerequisites, coding conventions, testing rules, mandatory change-log
workflow, CI/CD, Definition of Done, quick references).

## Why
Two files with overlapping intent caused confusion: contributors and
agents had to read both to know which was authoritative. The de-facto
convention for AI coding tools (Cursor, Claude Code, Aider, Rovo Dev)
is `AGENTS.md`. Consolidating to that single name eliminates ambiguity
and matches the convention.

## How
- Replaced `AGENTS.md` (formerly a short links-only file) with the full
  content of the old `Agent.md`, retitled "AGENTS.md — Developer &
  Agent Guide". Updated the self-reference in the directory map.
  Added a `PRODUCT_SPEC.md` line that the old `Agent.md` had omitted.
- Deleted `Agent.md`.
- Updated cross-references across the repo:
  - `Architecture.md` (2 refs in the directory tree).
  - `change_log/README.md` (the `../Agent.md §6` link).
- Existing references in earlier change-log entries
  (`0001`/`0004`) are intentionally left untouched per the
  append-only history rule (see `AGENTS.md §6`).

## Migration / Rollout
None. Documentation only. Anchor URL changes from `Agent.md#…` →
`AGENTS.md#…`; bookmarks should be updated.

## Follow-ups
None.
