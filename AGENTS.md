# AGENTS.md — Developer & Agent Guide

> **Read this file before doing any work in this repo.**
> It is the contract between human contributors, AI coding agents, and the codebase.
> Companion docs: [`Architecture.md`](./Architecture.md), [`change_log/`](./change_log/).

---

## 1. What is this project?

**WanderSync** — a real-time collaborative travel-planning app. Stack:
- Backend: **Node.js + Express + Prisma + PostgreSQL + Socket.io** (TypeScript).
- Frontend: **Next.js 14 (App Router) + React 18 + Zustand + Tailwind** (TypeScript).
- Optional mobile: **React Native** (see `Architecture.md §4` for the reference layout).

---

## 2. Directory Map (where to put things)

```
backend/
├── prisma/schema.prisma       # ⬅ Add/modify DB models here, then `npm run db:migrate`
├── src/
│   ├── routes/<feature>.ts    # ⬅ HTTP endpoints — keep thin, validate with Zod
│   ├── services/<feature>.ts  # ⬅ Business logic; reusable, no req/res
│   ├── middleware/            # ⬅ Cross-cutting (auth, error, logging, rate-limit)
│   ├── socket/index.ts        # ⬅ Real-time event handlers (room-scoped)
│   ├── lib/prisma.ts          # ⬅ Singleton PrismaClient — never instantiate elsewhere
│   └── index.ts               # ⬅ App composition only; no business logic

frontend/
├── src/
│   ├── app/<route>/page.tsx   # ⬅ Pages (App Router). Mark client pages with 'use client'.
│   ├── components/<area>/     # ⬅ UI components grouped by feature area
│   ├── hooks/                 # ⬅ Cross-cutting hooks (e.g. useTripSocket)
│   ├── lib/api.ts             # ⬅ Add new typed REST groups here
│   ├── lib/socket.ts          # ⬅ Singleton socket client
│   ├── lib/stores/            # ⬅ Zustand stores; one per concern
│   └── types/index.ts         # ⬅ Shared TS interfaces (mirror Prisma models)

change_log/                    # ⬅ Append a new entry after EVERY major feature (see §6)
.github/workflows/             # ⬅ CI/CD: backend-ci.yml, frontend-ci.yml, deploy.yml
Architecture.md                # ⬅ Update when adding a new layer or external system
PRODUCT_SPEC.md                # ⬅ What we're building and why (F1–F10)
AGENTS.md                      # ⬅ This file (the dev/agent contract)
```

---

## 3. Local Development

**Prerequisites**
- **Node.js 20.x** (LTS) and **npm 10+** (matches CI)
- **Docker** + **Docker Compose** (for Postgres and the all-in-one path)
- A Google Maps **JS API key** (for `frontend/.env`)

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env            # set JWT_SECRET, DATABASE_URL
npm install
npm run db:generate
npm run db:migrate
npm run db:seed                 # optional sample data
npm run dev                     # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env            # set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
npm install
npm run dev                     # http://localhost:3000
```

Or `docker compose up` for everything in one shot.

---

## 4. Coding Conventions

- **TypeScript strict mode**. Never widen types with `any` to silence errors — fix the type.
- **Zod at the boundary**: every inbound request body has a `Zod` schema in the route file. The inferred type flows into Prisma calls.
- **Routes stay thin**: parse → call service / Prisma → return. Move conditionals/loops into `services/`.
- **One PrismaClient.** Always import from `src/lib/prisma.ts`.
- **Socket events must be authorized** in the handler (verify membership before emitting to a room).
- **Frontend stores are flat** — no nested setters. Components subscribe with selectors to avoid re-render storms.
- **Tailwind first**, custom CSS only in `globals.css`.
- **No business logic in `app/page.tsx`** — push it into hooks/components/stores.
- **Error messages are user-safe** — never leak stack traces to the client.

---

## 5. Testing Rules

| Layer | Command | What to write |
|---|---|---|
| Backend | `npm test` (in `backend/`) | Jest + Supertest. New routes need a happy-path test and a 401/validation test. Services need unit tests with mocked Prisma. |
| Frontend | `npm test` (in `frontend/`) | Jest + RTL. Render component, assert behavior — never assert on internal state or class names. |
| Mobile (if added) | `npm test` (in `mobile/`) | Jest + RN Testing Library; e2e via Maestro. |

**Coverage targets** (recommended): 70% backend, 60% frontend.

See `Architecture.md §5.5` for full framework rationale and trade-offs.

---

## 6. Change Log Workflow (mandatory)

The `change_log/` folder is the project's running journal of **major features**.
After every meaningful change (new feature, breaking change, large refactor),
the agent **must**:

1. Create a new file in `change_log/` named `NNNN-<kebab-slug>.md` where `NNNN`
   is the next zero-padded integer (`0001`, `0002`, …).
2. Keep the body **under 300 words**. Use the template in
   `change_log/README.md`.
3. Update `change_log/README.md` to add the new entry to the index table at the top.
4. Cross-link from the PR description.

If the change touches architecture (new external system, new layer, new
deployment target), also update the relevant section in `Architecture.md`
in the same PR.

> **Agents: this is non-optional. A PR that adds a feature without a
> `change_log/` entry should be treated as incomplete.**

---

## 7. CI/CD

Workflows live in `.github/workflows/`:

| File | Trigger | What it does |
|---|---|---|
| `backend-ci.yml` | push/PR touching `backend/**` | install → `prisma generate` → typecheck → test (with Postgres service) → build → docker build |
| `frontend-ci.yml` | push/PR touching `frontend/**` | install → typecheck → test → `next build` → docker build |
| `deploy.yml` | manual (`workflow_dispatch`) | Build & push images, then deploy to the chosen environment (stub — wire to your platform) |

PRs must be **green** before merge. The deploy workflow requires an explicit
environment input (`staging` or `production`).

---

## 8. Definition of Done (per feature)

- [ ] Code passes lint, typecheck, and tests locally.
- [ ] Tests added/updated (backend + frontend as relevant).
- [ ] Architectural impact reflected in `Architecture.md`.
- [ ] **`change_log/NNNN-*.md` created (≤300 words) and `change_log/README.md` updated.**
- [ ] CI is green on the PR.
- [ ] PR description links to change-log entry.

---

## 9. Quick References

- Real-time event matrix: `Architecture.md §6`
- Prisma models: `backend/prisma/schema.prisma`
- Shared TS types: `frontend/src/types/index.ts`
- Socket client: `frontend/src/lib/socket.ts`
- Socket server: `backend/src/socket/index.ts`
