# Tania Dashboard — Frontend

Frontend for **Tania**, the employee / digital-talent management platform. It
implements the per-role dashboards and data-entry UI (Admin, Operation,
Chapter, Talent) and reads and writes talent data through the **Tania backend**
(`codex/backend/tania-backend`) via a GraphQL API.

This repo contains **frontend only**. It does not ship a database or API
implementation — it consumes the backend's GraphQL API, whose base URL is
configured via environment variables (see [Environment variables](#environment-variables)).
The current codebase ships the **Talent Profile** slice (TAN-1) over a REST
client that targets an *external* profile API; the migration to Apollo Client +
GraphQL is tracked in `specs/001-employee-digital-talent-management/` here
(spec + contract mirror) and in `codex/backend/tania-backend`
(`specs/001-employee-digital-talent-management/plan.md`, `roadmap.md`,
`tasks.md` — that repo hosts the plan and the implementation sequencing).

> **Known gap (2026-10-01)**: the legacy REST endpoints listed under
> [API contract](#api-contract) below (`GET /profiles`, `GET /profiles/:id`,
> `POST /users`) are **not served by `codex/backend/tania-backend`** — that
> service exposes only `POST /graphql`, `GET /healthz`, and `GET /readyz`.
> The `/talents` slice therefore cannot run end-to-end against the current
> backend until it is migrated to GraphQL.

## Scope

The product requirements are defined by the feature specification authored in
this repository — it is the **source of truth** for the feature:

- `specs/001-employee-digital-talent-management/spec.md` — the four access roles
  (Admin, Operation, Chapter, Talent), employee records, assignments, Individual
  Development Plans, CV profiles, performance evaluation, master data, and the
  per-role dashboards.

The spec is mirrored verbatim into `codex/backend/tania-backend` so the backend
can run `/speckit.plan` and `/speckit.tasks` against it; when the spec changes
here, re-copy it there instead of editing the mirror.

## Stack

Pinned in `.specify/memory/constitution.md` (amendment 1.1.0, 2026-10-01). What is
**installed today** versus **pinned and pending**:

| Concern | Pinned | In `package.json` today |
| --- | --- | --- |
| Framework | Next.js (App Router, server components) | `next` 16.3.4 |
| UI runtime | React | `react` / `react-dom` 19.2.8 |
| Language | TypeScript | `typescript` ^5 |
| Styling | Tailwind CSS | `tailwindcss` ^4 via `@tailwindcss/postcss` |
| Unit tests | Vitest + React Testing Library | `vitest` ^5 — **RTL not installed** |
| GraphQL data layer | Apollo Client + codegen in `src/generated/graphql/` | **not installed** |
| Static checks | eslint + `tsc --noEmit` | `eslint` ^9 (`eslint-config-next`) |

The migration slice installs Apollo Client, React Testing Library, and the codegen
output directory, and widens `vitest.config.ts` (currently `environment: "node"`
and `include: ["src/**/*.test.ts"]`, so component tests are not picked up).

## Project structure

What exists today (verified 2026-10-01):

```text
src/
├── app/                        # App Router
│   ├── layout.tsx              # root layout
│   ├── page.tsx                # redirects to /talents
│   └── talents/                # legacy Talent Profile slice (REST)
│       ├── page.tsx
│       ├── add-user-form.tsx
│       └── [id]/page.tsx
└── lib/
    ├── api.ts                  # REST client (external profile API)
    ├── api.test.ts             # Vitest unit tests
    └── talents.ts              # ProfileView / CreateUserInput types
specs/001-employee-digital-talent-management/
├── spec.md                     # authored here; mirrored to the backend repo
└── contracts/                  # mirrored: schema.graphql + api-conventions.md
```

Not present yet — these are the target layout from
`tania-backend/specs/001-employee-digital-talent-management/plan.md` §6.2 and are
created by the migration slice, not decided here:

```text
src/app/(auth)/login/           src/features/<modul>/      src/lib/apollo/
src/app/(app)/<rute>/           src/components/            src/lib/auth/
                                                           src/generated/graphql/
```

## Getting started

Requirements: Node.js >= 20 (tested with 24).

```bash
npm install
cp .env.example .env.local   # then point the URLs at your API
npm run dev
```

Open http://localhost:3000 — `/` redirects to `/talents`.

### Environment variables

| Variable                    | Used by                                  | Description                                       |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `TANIA_API_URL`             | Server-rendered pages                    | Base URL of the external Talent Profile API       |
| `NEXT_PUBLIC_TANIA_API_URL` | Client-side "Add User" form              | Same API, accessible from the browser (CORS)      |

Example:

```bash
TANIA_API_URL=http://localhost:8080
NEXT_PUBLIC_TANIA_API_URL=http://localhost:8080
```

## API contract

The frontend expects the backend to expose:

| Method | Path             | Description                                      |
| ------ | ---------------- | ------------------------------------------------ |
| GET    | `/profiles?q=`   | List/search profiles → `{ query, count, profiles }` |
| GET    | `/profiles/:id`  | Profile detail → `{ profile }` or `404`            |
| POST   | `/users`         | Create a user + auto-profile → `{ profile }` (201) |

`ProfileView` shape (camelCase):

```ts
{
  userId: number;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  grade: string;
  squad: string;
  location: string;
  status: string;
  managerId: number | null;
  managerName: string | null;
  createdAt: string;
}
```

## Spec-Driven Development

Work in this repository is spec-driven with
[GitHub Spec Kit](https://github.com/github/spec-kit). The scaffolding is
committed, so a fresh checkout is ready to use:

```
.specify/            Spec Kit infrastructure (scripts, templates, workflows, memory)
  memory/            the ratified constitution — read before specifying or planning
  scripts/bash/      helper scripts invoked by the speckit commands
  templates/         spec / plan / tasks / checklist templates
.omp/commands/       "/speckit.*" commands for the Oh My Pi agent
.opencode/commands/  "/speckit.*" commands for the opencode agent
specs/               one directory per feature (spec.md + the artifacts it generates)
```

> **Current gap (2026-10-01)**: `specs/001-employee-digital-talent-management/` here holds
> `spec.md` and the mirrored `contracts/` only — **no `plan.md`, `roadmap.md`, or `tasks.md`**.
> Those artifacts were produced in `codex/backend/tania-backend` and currently carry the
> frontend work items too. Running `/speckit.plan` + `/speckit.tasks` in this repo (or moving
> the frontend items into a plan here) is an open decision.

The constitution in `.specify/memory/` is the governing document: it has three
pillars — security (UU PDP No. 27/2022), design (Legion), and technical (code
quality, testing, maintainability) — ranked in that order, with the master
`constitution.md` as the index and governance rules. It is mirrored to
`docs/constitution/` for convenient reading.

Workflow, in order:

```
/speckit.constitution   only to amend the constitution itself
/speckit.specify        describe a feature in plain language → specs/<NNN>-<feature>/spec.md
/speckit.clarify        optional: resolve open points in the spec before planning
/speckit.plan           derive the technical plan from the spec + constitution
/speckit.tasks          break the plan into ordered, testable tasks
/speckit.analyze        optional: cross-check spec, plan and tasks for drift
/speckit.implement      execute the tasks
```

Commands run from the repository root. `specify check` reports the CLI and
integration status; `specify integration list` shows the integrations
installed for this project.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```