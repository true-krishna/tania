# Tania Dashboard — Frontend

Frontend for **Tania**, the employee / digital-talent management platform. It
implements the per-role dashboards and data-entry UI (Admin, Operation,
Chapter, Talent) and reads and writes talent data through the **Tania backend**
(`codex/backend/tania-backend`) via a GraphQL API.

This repo contains **frontend only**. It does not ship a database or API
implementation — it consumes the backend's GraphQL API, whose base URL is
configured via environment variables (see [Environment variables](#environment-variables)).
The current codebase ships the **Talent Profile** slice (TAN-1) over a REST
client; the migration to Apollo Client + GraphQL is tracked in the spec and
plan below.

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

- [Next.js](https://nextjs.org) (App Router, server components)
- TypeScript
- Tailwind CSS
- Vitest (unit tests)

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