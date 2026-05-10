# 0006 — CI/CD uplift: split test stages, security scans, immutable releases, CI_CD.md

- **Date (UTC)**: 2026-05-10
- **PR / Commit**: (this change)
- **Type**: infra / docs
- **Affects**: all

## Summary
Replaced the monolithic CI jobs with a properly staged pipeline for both
stacks, added supply-chain scanning workflows (CodeQL + Dependency
Review + Trivy), introduced a tag-driven immutable release workflow,
hardened the deploy workflow with smoke-test + rollback hooks, and
documented the entire design in `CI_CD.md`.

## Why
The previous CI ran every check in one job, so a 5-second lint failure
took 3 minutes to surface; coverage from unit and integration runs was
conflated; and there was no SAST, no PR-time supply-chain check, and no
immutable release path. Production-readiness required all of the above.

## How
- **`backend-ci.yml`**: split into `lint-and-typecheck → unit-tests →
  integration-tests → build → docker-build` plus parallel `security`.
  Integration job uses a fresh Postgres service container and
  `prisma migrate reset --force --skip-seed` for deterministic state.
- **`frontend-ci.yml`**: matching split (no integration job); adds
  Next.js build cache.
- **`codeql.yml`**: SAST on PR + push + weekly cron; `security-extended`
  query pack; SARIF uploaded to Code Scanning.
- **`dependency-review.yml`**: PR-time check, blocks HIGH/CRITICAL CVEs
  and copyleft licenses (GPL/AGPL).
- **`release.yml`**: tag-only trigger (`v*.*.*`) with on-`main`
  ancestry verification, immutable tag rule, image digest in job
  output. Workflow-level `contents: read`; `packages: write` only on
  the publish job.
- **`deploy.yml`**: added smoke-test placeholder + rollback note steps.
- **`CI_CD.md`**: ~2.7k-word design doc covering pipeline philosophy,
  per-stage reference, SDLC mapping, DevOps practices, security
  posture, trade-offs, and an operations runbook.

## Migration / Rollout
None. New workflows fire on the next PR / push / tag. Coverage
artifact names changed (`backend-unit-coverage`, `frontend-unit-coverage`);
update any external dashboards accordingly.

## Follow-ups
- Wire OIDC + cosign signing + SLSA attestations.
- Enable Dependabot for npm + GitHub Actions (with SHA pinning).
- Add Playwright e2e workflow gated by label.
- Add a real backend integration test to make the integration job meaningful.
