# Tania Technical Constitution

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
**Scope**: all Tania repositories (frontend, backend, tooling) — code quality, testing, and maintainability.

## Preamble

The Tania Technical Constitution governs how code is written, tested, and kept maintainable. Its aim: any competent engineer — human or agent — can pick up any part of Tania, understand it quickly, change it safely, and verify the change automatically. Rules marked MUST are enforced in CI or review; the constitution outranks personal preference but never the Security Constitution.

## Core Principles

### I. Smallest change that solves the problem

Every change solves the stated task and nothing else. No speculative features, no unrequested configurability, no abstractions for single-use code (YAGNI). Diffs stay surgical: every changed line traces to a requirement; adjacent cleanup is proposed, not smuggled in. Dead code created by a change is removed by the same change.

### II. Quality is enforced by machines, not opinions

Linting, formatting, and static type-checking run in CI on every merge request. New code enters at **zero warnings**. Style debates resolve by updating the tooling configuration once, not by re-litigating in review. Conventions (naming, file organization, import order) follow each repo's documented style; the repo README/AGENTS file is the local reference.

### III. Testing is non-negotiable

Behavior changes ship with tests:

- **Unit tests** for business logic and pure functions.
- **Integration/contract tests** for API boundaries — the API schema is the contract, and contract tests keep frontend and backend honest.
- **End-to-end tests** for critical user paths (login, core dashboard flows, data entry).

A failing test blocks merge. Bug fixes add the regression test **first**, then the fix. Suites are deterministic: flaky tests are quarantined immediately and fixed or deleted, never tolerated. Coverage thresholds are set per repo at scaffolding and raised, never quietly lowered.

### IV. Maintainability over cleverness

- Small, focused modules with one reason to change; explicit dependencies; no hidden side effects at import time.
- **Typed contracts at boundaries**: API request/response schemas defined once and shared — one source of truth per fact.
- Comments explain **why**, not what; public interfaces have usage documentation.
- Documentation updates ship in the same change as the behavior they describe; stale docs are treated as defects.
- Duplication is cheaper than the wrong abstraction — extract on the third real repetition, with evidence.

### V. Dependency hygiene

Minimal dependency count; every new dependency states in the MR why it exists and what it costs. Versions are locked; upgrades are scheduled work, not forgotten work. Licenses are recorded at adoption. Automated vulnerability scanning (Principle IV of the Security Constitution) gates releases.

### VI. Fail visibly, log safely

Errors are handled explicitly — no swallowed exceptions, no empty catch blocks. User-facing failures follow the Design Constitution's error semantics (`error-500` family, `tertiary-500`/`error-500` caption rows). Logs are structured, correlated by request ID, and contain **no personal data** (Security Constitution IV). Retry policies, timeouts, and circuit breakers are explicit, never implicit defaults.

### VII. Architecture boundaries hold

Layering is respected: UI → API/service → data. No UI code queries the data layer directly; no cross-feature shared mutable state. Single sources of truth: Legion tokens live in one place (Design Constitution I); the API schema is defined once and generated/consumed, not re-declared; environment configuration enters only through environment variables/secrets, never committed.

### VIII. Review and CI gates

- No direct pushes to the default branch; every change goes through a merge request.
- CI green (lint + typecheck + tests + dependency scan) is required before merge.
- Human review is required for changes touching personal data flows (Security Constitution), public APIs, and the constitution documents themselves.
- Commit history follows the repo's chosen convention (e.g. Conventional Commits); commit messages say why, not just what.

## Additional Constraints

- **Stack pinning**: Tania repositories are currently greenfield. The concrete stack (framework, test runner, coverage tool, CI definition) MUST be pinned in each repo's scaffolding or first plan and recorded as an amendment here. Until pinned, every spec proposing implementation states its tooling choice explicitly so the choice is reviewable.
- **Migrations**: schema changes ship as forward-compatible migrations with a documented rollback or deprecation path; destructive changes are two-phase (deprecate, then remove).
- **Performance budgets** for dense dashboard surfaces (large tables, many controls) are set at plan level — interaction latency and render cost are tested, not assumed.
- **Reproducibility**: a fresh clone builds and tests with documented commands only; local-only steps are defects.

## Governance

- All plans and implementations are checked against Principles I–VIII; review comments cite the principle.
- Amendments require a version bump and an amendment-log entry; stack-pinning amendments (Additional Constraints) are expected early and are MINOR bumps.
- Conflicts escalate: Security Constitution → Design Constitution → Technical Constitution (see master `constitution.md`).

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
