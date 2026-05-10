# 0001 — Initial architecture docs, Agent guide, change-log scaffold, testing & CI/CD

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (initial)
- **Type**: docs / infra
- **Affects**: all

## Summary
Established the project's documentation and automation backbone:
`Architecture.md`, `Agent.md`, the `change_log/` folder with its rules and
template, minimal Jest test scaffolding for both backend and frontend, and
GitHub Actions CI/CD workflows for backend, frontend, and a manual deploy.

## Why
The codebase had a strong README but no single source of truth for
architectural decisions, no contributor/agent guide, no place to record
incremental feature history, and no automated checks. Without these, every
new contributor (human or AI) re-derives context from source, drift creeps
in, and broken changes ship to main.

## How
- `Architecture.md` documents the layered backend, the Next.js frontend,
  a deep-research **React Native** reference architecture, real-time event
  map, deployment topology, and testing rationale.
- `Agent.md` is the dev/agent contract: directory map, conventions,
  testing rules, and the **mandatory** change-log workflow (≤ 300-word
  entries, indexed in `change_log/README.md`, written after each major
  feature).
- Added Jest configs and one smoke test each in `backend/` and `frontend/`,
  plus `test`, `lint`, and `typecheck` scripts.
- Added `.github/workflows/{backend-ci,frontend-ci,deploy}.yml` with path
  filters, concurrency cancellation, Node + npm cache, a Postgres service
  for backend integration tests, Docker build, and a manual deploy stub.

## Migration / Rollout
None. New devDependencies will be installed by CI on first run. No DB
changes.

## Follow-ups
- Wire `deploy.yml` to a real registry + target (Fly/ECS/K8s).
- Add Playwright e2e in a follow-up PR.
- Introduce `pino` structured logging.
