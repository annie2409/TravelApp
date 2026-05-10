# Change Log

This folder is the project's running journal of **major features** and
**breaking changes**. Every PR that ships a notable change must add a new
entry here. See [`../AGENTS.md` §6](../AGENTS.md#6-change-log-workflow-mandatory).

## Index

| ID | Date (UTC) | Title | Type |
|---|---|---|---|
| [0001](./0001-initial-architecture-docs.md) | 2026-05-10 | Initial architecture docs, Agent guide, change-log scaffold, testing & CI/CD | docs / infra |
| [0002](./0002-product-spec.md) | 2026-05-10 | Add PRODUCT_SPEC.md (intelligent travel planning) | docs |
| [0003](./0003-place-library-mvp.md) | 2026-05-10 | Place Library MVP (Slice 1: F1.3, F2, F6.1-2, F7) | feat |
| [0004](./0004-agents-md-and-gitignore.md) | 2026-05-10 | AGENTS.md + comprehensive root .gitignore | docs / infra |
| [0005](./0005-rename-agent-md-to-agents-md.md) | 2026-05-10 | Rename Agent.md → AGENTS.md (single source of truth) | docs / refactor |
| [0006](./0006-cicd-uplift.md) | 2026-05-10 | CI/CD uplift: split test stages, security scans, immutable releases, CI_CD.md | infra / docs |

---

## Rules

1. **Filename**: `NNNN-<kebab-slug>.md`, where `NNNN` is the next zero-padded
   integer (`0001`, `0002`, …). Never reuse an ID.
2. **Body length**: **strictly under 300 words.** Be terse — link to the PR
   and to architecture docs for depth.
3. **Index update**: append a row to the table above in the same PR.
4. **Architectural impact**: if the change adds a new layer/system/dependency,
   also update `../Architecture.md`.
5. **One feature per entry.** If a PR ships two unrelated features, write two
   entries.

## Entry Template

```markdown
# NNNN — <Short title>

- **Date (UTC)**: YYYY-MM-DD
- **PR / Commit**: <link>
- **Type**: feat | fix | refactor | docs | infra | breaking
- **Affects**: backend | frontend | mobile | infra | all

## Summary
What changed, in 2-3 sentences.

## Why
Business or technical motivation.

## How
Key implementation points (bullets). Mention new files, models,
endpoints, or socket events.

## Migration / Rollout
Any DB migrations, env vars, or runbook steps. "None" if N/A.

## Follow-ups
Optional list of next steps.
```

(Whole entry must remain **< 300 words**.)
