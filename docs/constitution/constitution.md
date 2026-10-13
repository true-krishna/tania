# Tania Constitution

**Version**: 1.2.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-10

## Preamble

This constitution establishes the governance framework for all Tania engineering work (specification, planning, implementation, review). It consists of three pillars, each detailed in its own document under `.specify/memory/` (mirrored to `docs/constitution/`):

| Pillar | Document | Grounded in |
|---|---|---|
| Security | `constitution-security.md` | UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Indonesia) |
| Design | `constitution-design.md` | `DESIGN-legion.md` (Legion ramps — values) + the `tania-design-system` package "TANIA Pulse, Legion-aligned" (executable adaptation, shipped as `design/`) |
| Technical | `constitution-technical.md` | Code quality, testing, and maintainability engineering standards |

The principles below are the binding summary for planning and review. Where this summary and a pillar document disagree on detail, the pillar document wins.

The master copy read by the Spec Kit tools (`/speckit.*`) lives at
`.specify/memory/constitution.md`. This file mirrors it; when they differ, the master wins.

## Core Principles

### I. Lawful basis and purpose limitation (Security, Pasal 20–21)

Every processing of personal data has a documented lawful basis recorded before implementation. Consent is explicit, granular, recorded, and withdrawable as easily as given. Purposes are specific and legitimate; repurposing data requires a new basis — never silent reuse.

### II. Data minimization and classification (Security, Pasal 4)

Collect only what the declared purpose requires. Every field is classified at design time as general or specific/sensitive personal data; classification lives in the data model documentation. Unclassified fields are a review-blocking defect. No personal data in logs, traces, analytics events, or URLs.

### III. Security and confidentiality by design (Security, Pasal 35)

TLS in transit; encryption at rest for stores of personal data. Role-based access control with least privilege, enforced server-side. Secrets come from the platform secret store — never committed, never logged. Dependency vulnerability scanning runs in CI; critical findings block release. Audit trails cover every core-data change and are readable only by Admin.
The Admin-only surface is the audit trail store (`audit_logs`) and its full query surface — unfiltered search, export, cross-entity inspection. A record-scoped change history (before/after values for a single entity, specific data masked, limited to records within the viewer's authorized scope) is a derived projection of those events, not the audit trail surface; it MAY be readable by other roles where a ratified user story requires it.

### IV. Data subject rights, retention, breach readiness (Security, Pasal 5–13, 36–37, 46)

Data subject rights (information, access, rectification, erasure, consent withdrawal, objection, portability) are working API workflows with defined SLAs, not manual database surgery. Every dataset declares a retention period and is really destroyed or anonymized on schedule. A breach-notification runbook exists and is tested (3×24 hours). High-risk processing produces a DAMP before shipping.

### V. Smallest change that solves the problem (Technical I)

Every change solves the stated task and nothing else — no speculative features, no unrequested configurability, no abstraction for single-use code. Dead code created by a change is removed by the same change.

### VI. Quality enforced by machines (Technical II, VIII)

Lint, format, and static analysis run in CI at zero warnings. No direct pushes to the default branch; merge requests require green CI. Commits follow Conventional Commits and say why.

### VII. Testing is non-negotiable (Technical III)

Behavior changes ship with tests: unit tests for business logic, contract tests for API boundaries, end-to-end tests for critical paths. Bug fixes add the regression test first. Suites are deterministic. Coverage thresholds are set at scaffolding and raised, never quietly lowered.

### VIII. Maintainability, boundaries, and dependency hygiene (Technical IV, V, VII)

Small modules with one reason to change; typed contracts defined once at the boundary; comments explain why. Layering is respected: UI → API/service → data. Environment configuration enters only through environment variables. Dependency count stays minimal; every new dependency states why in the MR.

### IX. Fail visibly, log safely (Technical VI)

Errors are handled explicitly — no swallowed errors. Logs are structured, correlated by request ID, and contain no personal data. Timeouts and retry policies are explicit. Failures at startup (missing configuration, unreachable dependencies) stop the process rather than degrade silently.

## Additional Constraints

- **Frontend stack (pinned 2026-10-01, amendment 1.1.0)**: React (via Next.js App Router, `tania-dashboard` repository), TypeScript, TailwindCSS, Apollo Client for GraphQL (layered beside the legacy REST client during migration), Vitest + React Testing Library for tests, eslint + `tsc --noEmit` for static checks. GraphQL codegen output lives in `src/generated/graphql/`; generated code is never hand-edited.
  - **Status (2026-10-01)**: the repo currently ships Next.js (App Router), React, TypeScript, TailwindCSS, and Vitest only — Apollo Client, React Testing Library, and the `src/generated/graphql/` codegen directory are **not installed yet**; adding them is part of the migration slice, not a re-decision of the pinned stack.
- **Backend stack (declared)**: Go clean architecture + PostgreSQL 16 + GraphQL (gqlgen) + Redis + JWT + Docker Compose, tracked in the `tania-backend` repository, not this one. (Corrected in amendment 1.1.1: the backend stack pinned at amendment 1.1.0 of that repository does **not** include Kafka; keep this line in sync with `.specify/memory/constitution.md` there.)
- **API contract**: the GraphQL schema is the single source of truth for the API; generated clients (`src/generated/graphql/`) are never hand-edited. **Source-of-truth split (clarified in 1.1.1)**: the served schema is `graph/schema.graphqls` in `tania-backend` — frontend codegen targets that schema, because it is what the running API actually exposes; `specs/001-employee-digital-talent-management/contracts/schema.graphql` is the design contract, mirrored byte-for-byte into both repositories, which the served schema converges to. When the contract changes, re-copy the mirror into both repos and regenerate; never let the two drift.
- **Reproducibility**: a fresh clone builds and tests with documented commands only (`npm install && npm run typecheck && npm test`); local-only steps are defects.

## Governance

- All specifications, plans, and implementations MUST be checked against the three pillars; review comments cite the principle.
- Amendments require a version bump (MAJOR for principle changes, MINOR for new sections or pinning, PATCH for clarifications) and a dated entry in the amendment log below.
- Conflicts escalate: Security → Design → Technical.

## Amendment Log

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-09-25 | Initial ratification: design, security, and technical pillars. |
| 1.1.0 | 2026-10-01 | Pinned the frontend stack during project initiation (Technical, Additional Constraints): Next.js App Router + React + TypeScript + TailwindCSS + Apollo Client, Vitest/RTL, eslint + `tsc --noEmit`; GraphQL schema as the single source of truth. |
| 1.1.1 | 2026-10-01 | Clarification (Technical, Additional Constraints): corrected the declared backend stack (Kafka is not part of the pinned backend stack — that repository's amendment 1.1.0 has no message broker), recorded which parts of the pinned frontend stack are actually installed, and split the API schema source of truth (served schema `graph/schema.graphqls` in `tania-backend` is what codegen targets; the mirrored design contract converges to it). |
| 1.2.0 | 2026-10-10 | Pinned principle III: the `audit_logs` store and full audit surface remain Admin-only; a record-scoped change history (masked, scope-limited) is a derived projection other roles MAY read where a ratified user story requires it (Operation on employee/contract detail — FR-41). |

**Version**: 1.2.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-10
