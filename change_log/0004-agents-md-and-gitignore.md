# 0004 — AGENTS.md + comprehensive root .gitignore

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: docs / infra
- **Affects**: all

## Summary
Added `AGENTS.md` at the repo root as a short, links-only entry point for
AI coding tools (Cursor, Claude Code, Aider, Rovo Dev, etc.) and created
the repo's first root `.gitignore`. The gitignore is monorepo-aware and
covers Node.js, Next.js, React Native (CLI + Expo), Prisma, Docker,
common IDE/OS artefacts, secrets, and the auto-iterate planning
directories.

## Why
Until now the repo had no `.gitignore`, so `node_modules/`, build
artefacts, `.next/`, coverage reports, planning folders, and OS junk
were all committable. AI tooling also had no canonical entry point —
`AGENTS.md` is becoming the de-facto convention so dropping a
breadcrumb file there avoids each tool re-deriving the project shape
from source.

## How
- **`AGENTS.md`** — strictly links-only; defers all norms/workflows to
  `Agent.md`. Lists the read order: README → Agent.md → Architecture.md
  → PRODUCT_SPEC.md → change_log/. Cross-links the directory map and
  flags the four non-negotiables (change-log, append-only history,
  `fl_*/` excluded, source of truth in Agent.md).
- **`.gitignore`** — patterns are root-anchored or `**/`-prefixed for
  monorepo correctness. Highlights:
  - `**/node_modules/`, `**/.next/`, `**/dist/`, `**/coverage/`
  - `**/.env` and `**/.env.*` ignored, **with negations** for
    `**/.env.example` / `**/.env.sample` so templates stay tracked
  - React Native: `ios/Pods/`, `android/.gradle/`, `*.apk`, `*.aab`,
    `.expo/`, Hermes bundles, Fastlane outputs, EAS local artefacts
  - `/fl_*/` (root-anchored) excludes auto-iterate planning dirs
  - `tmp_rovodev_*` excludes throwaway agent files

## Migration / Rollout
None. New files only. Verified via `git status`: no previously-untracked
build/cache files appear; all expected source/docs are correctly listed.

## Follow-ups
- If a `mobile/` workspace is added, the RN patterns are already in place.
