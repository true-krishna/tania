# Tania Dashboard — Frontend

Frontend for **Tania**, the employee / digital-talent management platform. It
implements the per-role dashboards and data-entry UI (Admin, Operation,
Chapter, Talent) and reads and writes talent data through the **Tania backend**
(`codex/backend/tania-backend`) via a GraphQL API.

This repo contains **frontend only**. It does not ship a database or API
implementation — it consumes the backend's GraphQL API, whose base URL is
configured via environment variables (see [Environment variables](#environment-variables)).
Data is read and written through the backend's GraphQL API via Apollo Client
(typed documents in `src/generated/graphql/`, feature hooks in `src/features/`).
The spec and contract (`contracts/schema.graphql`) are authored here and
mirrored into `codex/backend/tania-backend`, which hosts `plan.md`,
`roadmap.md`, and `tasks.md` for the shared implementation sequencing.

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

What exists today (verified during convergence):

```text
src/
├── app/
│   ├── layout.tsx              # root layout
│   ├── page.tsx                # redirects to /dashboard
│   ├── (auth)/login/           # local login (SSO in W8)
│   └── (app)/                  # authenticated shell (AuthGuard, role-gated nav)
│       ├── dashboard/          # per-role dashboard
│       ├── employees/          # employee records + assignments
│       ├── idp/                # Individual Development Plans (+ /idp/my for Talent)
│       ├── cv/                 # CV profiles (Talent edit, Chapter read-only)
│       ├── evaluations/        # performance evaluation
│       ├── master-data/        # chapters, job roles, units, projects
│       └── audit/              # admin audit-log viewer
├── components/                 # UI primitives (DataState, Toast, Card, Select, …)
├── features/                   # per-module hooks + .graphql documents
├── generated/graphql/          # GraphQL codegen output (committed)
├── lib/                        # apollo, auth, errors, cn, …
└── test/                       # Vitest setup
specs/001-employee-digital-talent-management/
├── spec.md                     # authored here; mirrored to the backend repo
└── contracts/                  # mirrored: schema.graphql + api-conventions.md
```

Target layout per `tania-backend/specs/001-employee-digital-talent-management/plan.md` §6.2
(one feature module per `src/app/(app)/<rute>/` + `src/features/<modul>/`):

## Getting started

Requirements: Node.js >= 20 (tested with 24).

```bash
npm install
cp .env.example .env.local   # then point the URLs at your API
npm run dev
```

Open http://localhost:3000 — `/` redirects to `/dashboard` (authenticated shell);
unauthenticated visitors are sent to `/login`. In dev with
`NEXT_PUBLIC_AUTH_LOCAL_ONLY=1` the guard treats the user as logged in with
`NEXT_PUBLIC_DEFAULT_ACCESS_ROLE` (plan.md R3).

### Environment variables

| Variable                    | Used by                                  | Description                                       |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_GRAPHQL_URL`   | Apollo Client (browser)                  | GraphQL endpoint of the Tania backend              |
| `NEXT_PUBLIC_AUTH_LOCAL_ONLY` | Auth guard (dev mode)                 | `1` = skip login; unset/`0` = normal mode          |
| `NEXT_PUBLIC_DEFAULT_ACCESS_ROLE` | Auth guard (dev mode)            | Default role when `AUTH_LOCAL_ONLY=1`              |

Example:

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/query
NEXT_PUBLIC_AUTH_LOCAL_ONLY=0
NEXT_PUBLIC_DEFAULT_ACCESS_ROLE=TALENT
```

## API contract

The frontend consumes the backend's **GraphQL** API only; the Contract-First fork
is `specs/001-employee-digital-talent-management/contracts/schema.graphql`
(mirrored into `codex/backend/tania-backend`). See [GraphQL codegen](#graphql-codegen)
for how documents map to code.

## Data layer (Apollo Client)

The primary data path is **GraphQL via Apollo Client** (plan.md §3.2). The
legacy Talent Profile REST client was retired in the convergence slice; all
modules use Apollo.

### GraphQL codegen

The schema source of truth is
`specs/001-employee-digital-talent-management/contracts/schema.graphql`.
Generated output lives in `src/generated/graphql/` and is **committed** — never
edit it by hand, regenerate after contract changes:

```bash
npm run codegen        # regenerate src/generated/graphql/
npm run generate:check # fail CI if the generated code is stale
```

Operations are written next to their feature as `.graphql` files under
`src/features/**`; codegen turns them into typed documents (`gql()`) and hooks.

### Auth guard

`src/lib/auth/` holds token storage (access token in a client-readable
`tania_session` cookie so reloads keep you signed in), role helpers and
the route guard. Routes under `src/app/(app)/*` are wrapped in `AuthGuard`
(redirects unauthenticated users to `/login`; hides actions by role). Final
authorization is enforced server-side (FR-16) — this layer only de-clutters the
UI. SSO (Entra/SAML) lands in W8; local login is wired in W0 (plan.md R3).

### Folder structure (plan.md §6.2)

```
src/
├── app/(auth)/login/      # login lokal (W0); SSO menyusul (W8)
├── app/(app)/dashboard/   # shell terautentikasi; modul fitur W1+ menambah rute
├── components/            # UI reusable (selaras Tailwind)
├── features/              # modul fitur (§5.2): hooks + komponen + query/mutation
├── generated/graphql/     # hasil GraphQL codegen (committed)
├── lib/apollo/            # Apollo Client, link auth, cache policy
├── lib/auth/              # token storage, guard peran, AUTH_LOCAL_ONLY
└── test/                  # setup Vitest (setup.ts)
```

### Testing

Unit/component tests use **Vitest + React Testing Library**. Component tests
run in jsdom via the `// @vitest-environment jsdom` pragma; Apollo queries are
tested with `MockedProvider` (plan.md §10.2).
### End-to-end (Playwright)

Critical-path E2E lives in `e2e/` (`npm run test:e2e`) — see
`e2e/critical-path.spec.ts`. The web server boots via `playwright.config.ts`
under `AUTH_LOCAL_ONLY=1` (dev mode); the database-backed multi-role login flow
requires the backend `docker-compose` stack (T129).

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

> **Pembagian artefak (diputuskan 2026-10-01, "jalur dua-run")**: `specs/001-employee-digital-talent-management/`
> di repo ini memuat `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`,
> `contracts/`, dan **`tasks.md` (22 task UI)** — dijalankan dengan `/speckit.implement` dari root
> repo ini. Repo backend mengelola daftar terpisah (108 task). **ID task dipertahankan sama di dua
> daftar** (T008, T052, …), jadi nomor di tiap daftar tidak berurutan penuh; pemetaan per fase ada
> di `tasks.md` §Pemetaan ID.

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
npm run dev          # development server
npm run build        # production build
npm start            # serve production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:e2e    # Playwright critical-path E2E
npm run codegen      # regenerate GraphQL types from the schema contract
npm run generate:check # verify generated code is up to date (CI gate)
```