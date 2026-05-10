# 0007 — Architecture.md §5.6: envisioned CI/CD pipeline + per-step purpose

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: docs
- **Affects**: all (docs)

## Summary
Replaced the short, stale §5.6 stub in `Architecture.md` (which still
described the pre-uplift, monolithic pipeline) with a system-level
**vision** of the ideal CI/CD pipeline: a 12-step Mermaid diagram and
a per-step purpose table covering trigger, gate, status, and tool.
Cross-links `CI_CD.md` for the deep design instead of duplicating it.

## Why
The old §5.6 listed only three workflow files and seven generic best
practices — it predated the CI/CD uplift (`change_log/0006`) and made
no mention of CodeQL, Dependency Review, Trivy, the integration-test
split, the immutable release path, smoke-test/rollback, or
observability. Contributors (and AI agents) reading
`Architecture.md` had no map of where the pipeline is going vs where
it is today.

## How
- Mermaid `flowchart LR` of the 12 envisioned steps:
  Lint+Typecheck → Unit → (parallel SAST/SCA) → Integration → Build
  → Container Build → Merge → Release → Deploy → Smoke → Rollback?
  → Observe.
- Status legend (✅ implemented · 🟡 partial · ⏳ planned) sourced from
  `CI_CD.md §8` so the two docs cannot drift silently.
- Each step's "Purpose" capped at ≤ 2 sentences (per round-1 review
  guardrail) — depth lives in `CI_CD.md`.
- Refreshed the "CI best practices applied" bullets to match the
  uplifted pipeline (multi-layer cache, OIDC mandate, workflow-level
  least-privilege, deterministic Postgres reset).
- Added a closing pointer back to `CI_CD.md §4 SDLC Mapping` so the
  vision narrative ties into Plan/Code/Build/Test/Release/Deploy/
  Operate/Monitor + DORA.

## Migration / Rollout
None. Documentation only. No workflow files were touched.

## Follow-ups
- Flip the 🟡/⏳ rows to ✅ as roadmap items in `CI_CD.md §8` ship.
