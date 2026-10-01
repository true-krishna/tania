# Tania Constitution

**Version**: 1.1.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-01

## Preamble

This constitution establishes the governance framework for all Tania engineering work (specification, planning, implementation, review). It consists of three pillars, each detailed in its own document:

| Pillar | Document | Grounded in |
|---|---|---|
| Security | `constitution-security.md` | UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Indonesia) |
| Design | `constitution-design.md` | Legion design system analysis (`DESIGN-legion.md`, version alpha) |
| Technical | `constitution-technical.md` | Code quality, testing, and maintainability engineering standards |

The master copy read by the Spec Kit tools (`/speckit.*`) lives at
`.specify/memory/constitution.md`. This index is a human-readable mirror.

## Precedence

1. **Security Constitution** — statutory obligations (UU PDP) override every other consideration, including design consistency and delivery speed.
2. **Design Constitution** — shipped Legion tokens and documented invariants override aesthetic preference and convenience.
3. **Technical Constitution** — quality/testing gates override individual judgment on schedule pressure.

Where pillars conflict with each other, the higher-precedence pillar wins and the conflict is recorded as an amendment proposal.

## Governance

- All specifications (`/speckit.specify`), plans (`/speckit.plan`), and implementations MUST be checked against all three pillars.
- Amendments require a version bump (MAJOR for principle changes, MINOR for new sections, PATCH for clarifications) and a dated entry in the pillar's changelog.
- Anything not covered by the pillars is decided at plan time and documented, then promoted into the constitution if it proves general.

**Version**: 1.1.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-01